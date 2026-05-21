import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

const CONTRACT_STATUS = {
  none:               { label: "Гэрээ байхгүй",              color: "#9CA3AF", bg: "#F3F4F6" },
  pending_signatures: { label: "Гарын үсэг хүлээгдэж байна", color: "#D97706", bg: "#FFFBEB" },
  signed:             { label: "Гэрээ баталгаажсан",         color: "#16A34A", bg: "#F0FDF4" },
  payment_pending:    { label: "Төлбөр хүлээгдэж байна",     color: "#D97706", bg: "#FFFBEB" },
  active:             { label: "Идэвхтэй",                   color: "#16A34A", bg: "#F0FDF4" },
  cancelled:          { label: "Цуцлагдсан",                 color: "#EF4444", bg: "#FEF2F2" },
  completed:          { label: "Дууссан",                    color: "#6B7280", bg: "#F9FAFB" },
};

function daysLeft(endDate) {
  const diff = new Date(endDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function totalDays(startDate, endDate) {
  const diff = new Date(endDate) - new Date(startDate);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("mn-MN", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function nextPaymentDate(startDate) {
  const start = new Date(startDate);
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, start.getDate());
  if (next <= now) next.setMonth(next.getMonth() + 1);
  return next;
}

function daysUntilPayment(startDate) {
  const next = nextPaymentDate(startDate);
  const diff = next - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function MyRentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isLandlord = currentUser?.role === "landlord";

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/applications/active");
        if (!cancelled) setRentals(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const loadRentals = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/applications/active");
      setRentals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!showCancelModal) return;
    setCancelling(showCancelModal);
    try {
      await api.put(`/api/applications/${showCancelModal}/cancel`, { reason: cancelReason });
      setShowCancelModal(null);
      setCancelReason("");
      loadRentals();
    } catch (err) {
      alert(err.response?.data?.message || "Алдаа гарлаа");
    } finally {
      setCancelling(null);
    }
  };

  const totalMonthlyIncome = rentals.reduce((sum, r) => sum + (r.property?.monthlyRent || 0), 0);
  const signedCount  = rentals.filter(r => ["signed","active"].includes(r.contractStatus)).length;
  const expiringCount = rentals.filter(r => r.endDate && daysLeft(r.endDate) <= 30).length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingTop: 64 }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>
            {isLandlord ? "Удирдлага" : "Миний"}
          </p>
          <h1 className="font-display text-4xl font-light" style={{ color: "var(--ink)" }}>
            {isLandlord ? "Түрээсийн мэдээлэл" : "Миний түрээс"}
          </h1>
        </div>

        {/* Landlord summary stats */}
        {isLandlord && rentals.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Идэвхтэй түрээс", value: rentals.length, big: true },
              { label: "Сарын орлого", value: `${totalMonthlyIncome.toLocaleString()}₮`, big: false },
              { label: "Гэрээ баталгаажсан", value: signedCount, big: true },
              { label: "30 хоногт дуусах", value: expiringCount, big: true, warn: expiringCount > 0 },
            ].map(({ label, value, warn }) => (
              <div key={label} className="bg-white border p-5 text-center"
                style={{ borderColor: warn ? "#FCA5A5" : "var(--border-subtle)", background: warn ? "#FEF2F2" : "white" }}>
                <p className="font-display text-2xl font-light mb-1"
                  style={{ color: warn ? "#EF4444" : "var(--ink)" }}>{value}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tenant summary card */}
        {!isLandlord && rentals.length > 0 && (() => {
          const r = rentals[0];
          if (!r.endDate) return null;
          const days = daysLeft(r.endDate);
          const total = totalDays(r.startDate, r.endDate);
          const progress = Math.max(0, Math.min(100, Math.round(((total - days) / total) * 100)));
          const payDays = daysUntilPayment(r.startDate);
          const progressColor = progress > 80 ? "#EF4444" : progress > 60 ? "#D97706" : "var(--gold)";
          return (
            <div className="bg-white border mb-8 p-6" style={{ borderColor: "var(--border-subtle)" }}>
              <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>Түрээсийн хураангуй</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                <div className="border p-4 text-center" style={{ borderColor: "var(--border-subtle)" }}>
                  <p className="font-display text-3xl font-light mb-1" style={{ color: "var(--ink)" }}>{days}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Үлдсэн хоног</p>
                </div>
                <div className="border p-4 text-center"
                  style={{ borderColor: payDays <= 5 ? "#FCA5A5" : "var(--border-subtle)", background: payDays <= 5 ? "#FEF2F2" : "white" }}>
                  <p className="font-display text-3xl font-light mb-1"
                    style={{ color: payDays <= 5 ? "#EF4444" : "var(--ink)" }}>{payDays}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Төлбөр хүртэл хоног</p>
                </div>
                <div className="border p-4 text-center col-span-2 md:col-span-1" style={{ borderColor: "var(--border-subtle)" }}>
                  <p className="font-display text-xl font-light mb-1" style={{ color: "var(--ink)" }}>
                    {r.property?.monthlyRent?.toLocaleString()}₮
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Сарын төлбөр</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-soft)" }}>
                  <span>Эхэлсэн: {formatDate(r.startDate)}</span>
                  <span>Дуусах: {formatDate(r.endDate)}</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "var(--border-subtle)" }}>
                  <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, background: progressColor }} />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span style={{ color: "var(--text-soft)" }}>{progress}% өнгөрсөн</span>
                  <span style={{ color: days <= 30 ? "#EF4444" : "var(--text-soft)" }}>
                    {days <= 30 ? "⚠️ Дуусахад ойрхон!" : `${days} хоног үлдсэн`}
                  </span>
                </div>
              </div>

              {/* Next payment */}
              <div className="flex items-center justify-between p-4 border"
                style={{
                  borderColor: payDays <= 5 ? "#FCA5A5" : "var(--border-subtle)",
                  background: payDays <= 5 ? "#FEF2F2" : "var(--cream)",
                }}>
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Дараагийн төлбөрийн огноо</p>
                  <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>{formatDate(nextPaymentDate(r.startDate))}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Дүн</p>
                  <p className="font-display text-lg font-light" style={{ color: "var(--gold)" }}>
                    {r.property?.monthlyRent?.toLocaleString()}₮
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
            <p className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Ачааллаж байна</p>
          </div>
        ) : rentals.length === 0 ? (
          <div className="text-center py-20 bg-white border" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="font-display text-2xl font-light mb-2" style={{ color: "var(--ink)" }}>
              {isLandlord ? "Одоогоор түрээслүүлж байгаа байр байхгүй" : "Идэвхтэй түрээс байхгүй"}
            </p>
            {!isLandlord && (
              <Link to="/" className="btn-gold mt-4 inline-flex text-xs" style={{ padding: "10px 24px" }}>
                Байр хайх
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {rentals.map((rental) => {
              const endDate = rental.endDate || (rental.startDate
                ? new Date(new Date(rental.startDate).getTime() + rental.leaseMonths * 30 * 24 * 3600 * 1000)
                : null);
              const days = endDate ? daysLeft(endDate) : null;
              const total = (rental.startDate && endDate) ? totalDays(rental.startDate, endDate) : 1;
              const progress = days !== null ? Math.max(0, Math.min(100, Math.round(((total - days) / total) * 100))) : 0;
              const progressColor = progress > 80 ? "#EF4444" : progress > 60 ? "#D97706" : "var(--gold)";
              const cs = CONTRACT_STATUS[rental.contractStatus] || CONTRACT_STATUS.none;
              const image = rental.property?.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";
              const iSigned   = isLandlord ? rental.landlordSigned : rental.tenantSigned;
              const otherSigned = isLandlord ? rental.tenantSigned : rental.landlordSigned;

              return (
                <div key={rental._id} className="bg-white border overflow-hidden" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="flex">
                    <div className="w-1 flex-shrink-0" style={{ background: cs.color }} />
                    <div className="flex-1">

                      {/* Top */}
                      <div className="flex gap-4 p-5">
                        <img src={image} alt="" className="w-24 h-20 md:w-28 md:h-22 object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <Link to={`/properties/${rental.property?._id}`}
                              className="font-medium text-sm hover:underline line-clamp-1"
                              style={{ color: "var(--ink)" }}>
                              {rental.property?.title}
                            </Link>
                            <span className="text-xs px-2 py-1 flex-shrink-0 font-medium"
                              style={{ background: cs.bg, color: cs.color }}>
                              {cs.label}
                            </span>
                          </div>
                          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                            {rental.property?.location?.district}, {rental.property?.location?.city}
                          </p>
                          {isLandlord ? (
                            <p className="text-xs" style={{ color: "var(--text-soft)" }}>
                              {rental.tenant?.firstName} {rental.tenant?.lastName} — {rental.tenant?.phone}
                            </p>
                          ) : (
                            <p className="text-xs" style={{ color: "var(--text-soft)" }}>
                              {rental.landlord?.firstName} {rental.landlord?.lastName} — {rental.landlord?.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div className="px-5 pb-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "Эхлэх огноо", value: formatDate(rental.startDate) },
                          { label: "Дуусах огноо", value: endDate ? formatDate(endDate) : "—" },
                          {
                            label: "Үлдсэн хоног",
                            value: days !== null ? `${days <= 30 ? "⚠️ " : ""}${days} хоног` : "—",
                            warn: days !== null && days <= 30,
                          },
                          {
                            label: "Сарын төлбөр",
                            value: `${rental.property?.monthlyRent?.toLocaleString()}₮`,
                            gold: true,
                          },
                        ].map(({ label, value, warn, gold }) => (
                          <div key={label} className="border p-3"
                            style={{ borderColor: warn ? "#FCA5A5" : "var(--border-subtle)", background: warn ? "#FEF2F2" : "var(--cream)" }}>
                            <p className="text-xs mb-1" style={{ color: "var(--text-soft)" }}>{label}</p>
                            <p className="text-xs font-medium"
                              style={{ color: warn ? "#EF4444" : gold ? "var(--gold)" : "var(--ink)" }}>
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div className="px-5 pb-4">
                        <div className="w-full h-1.5 rounded-full" style={{ background: "var(--border-subtle)" }}>
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${progress}%`, background: progressColor }} />
                        </div>
                        <p className="text-xs mt-1" style={{ color: "var(--text-soft)" }}>{progress}% өнгөрсөн</p>
                      </div>

                      {/* Action buttons */}
                      {rental.contractStatus !== "cancelled" && rental.contractStatus !== "completed" && (
                        <div className="px-5 pb-5 flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: "var(--border-subtle)" }}>
                          {rental.contractStatus === "pending_signatures" && !iSigned && (
                            <Link to={`/contract/${rental._id}`}
                              className="btn-gold text-xs" style={{ padding: "8px 16px" }}>
                              ✍️ Гарын үсэг зурах
                            </Link>
                          )}
                          {rental.contractStatus === "pending_signatures" && iSigned && !otherSigned && (
                            <div className="text-xs px-4 py-2 border"
                              style={{ borderColor: "var(--gold-light)", background: "var(--cream)", color: "var(--gold)" }}>
                              ✓ Та зурлаа — нөгөө талыг хүлээж байна
                            </div>
                          )}
                          <Link to={`/contract/${rental._id}`}
                            className="btn-ghost text-xs" style={{ padding: "8px 16px" }}>
                            📄 Гэрээ харах
                          </Link>
                          {(rental.contractStatus === "signed" || rental.contractStatus === "payment_pending") && (
                            <Link to={`/payment/${rental._id}`}
                              className="btn-outline-gold text-xs" style={{ padding: "8px 16px" }}>
                              Төлбөр төлөх
                            </Link>
                          )}
                          <button onClick={() => setShowCancelModal(rental._id)}
                            className="text-xs px-4 py-2 border transition-colors"
                            style={{ borderColor: "#FCA5A5", color: "#EF4444", background: "white" }}>
                            Цуцлах
                          </button>
                        </div>
                      )}

                      {rental.contractStatus === "cancelled" && rental.cancellationReason && (
                        <div className="px-5 pb-5">
                          <p className="text-xs p-3 border-l-2" style={{ borderColor: "#EF4444", background: "#FEF2F2", color: "#EF4444" }}>
                            Цуцлах шалтгаан: {rental.cancellationReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowCancelModal(null); setCancelReason(""); } }}>
          <div className="bg-white w-full md:max-w-md p-8">
            <div className="mb-6">
              <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "#EF4444" }}>Болгоомжтой</p>
              <h2 className="font-display text-2xl font-light" style={{ color: "var(--ink)" }}>Гэрээ цуцлах</h2>
              <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
                Гэрээг цуцлахад нөгөө тал мэдэгдэл хүлээн авна.
              </p>
            </div>
            <div className="mb-5">
              <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                Цуцлах шалтгаан
              </label>
              <textarea rows={3} placeholder="Шалтгааныг бичнэ үү..."
                value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                className="luxury-input w-full resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowCancelModal(null); setCancelReason(""); }}
                className="btn-ghost flex-1">Болих</button>
              <button onClick={handleCancel} disabled={cancelling === showCancelModal}
                className="flex-1 py-3 text-sm font-medium text-white transition-colors"
                style={{ background: cancelling === showCancelModal ? "#FCA5A5" : "#EF4444" }}>
                {cancelling === showCancelModal ? "Цуцалж байна..." : "Цуцлах"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyRentals;