import { useState, useEffect, useMemo } from "react";
import api from "../api/axiosInstance";
import { useParams, useNavigate, Link } from "react-router-dom";

const STATUS_META = {
  urgent:    { label: "Яаралтай",       color: "#EF4444", priority: 1 },
  overdue:   { label: "Хоцорсон",       color: "#EF4444", priority: 2 },
  pending:   { label: "Хүлээгдэж буй",   color: "#F59E0B", priority: 3 },
  paid:      { label: "Төлсөн",          color: "#10B981", priority: 4 },
  cancelled: { label: "Цуцалсан",        color: "#888",    priority: 5 },
};

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=70";

function formatMNT(n) {
  return new Intl.NumberFormat("mn-MN").format(n || 0);
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("mn-MN", {
    year: "numeric", month: "long", day: "numeric",
  });
}

// ⭐ ШИНЭ: Server-ийн талбараас уншиж label үүсгэх
function getPaymentLabel(payment) {
  const num = payment.paymentNumber || "?";
  return `№${num} төлбөр`;
}

function Payment() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);

  const [payments, setPayments]       = useState([]);
  const [application, setApplication] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [paying, setPaying]           = useState(null);
  const [confirmPayId, setConfirmPayId] = useState(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }

    let cancelled = false;
    (async () => {
      try {
        // ⭐ ЗАСВАР #1: path param (query string биш)
        const [appRes, payRes] = await Promise.all([
          api.get(`/api/applications/${applicationId}`),
          api.get(`/api/payments/application/${applicationId}`),
        ]);
        if (cancelled) return;
        setApplication(appRes.data);
        setPayments(payRes.data || []);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Татаж чадсангүй");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [applicationId, navigate, user]);

  const handlePay = async (id) => {
    setPaying(id);
    setError("");
    try {
      // ⭐ ЗАСВАР #2: PUT (POST биш)
      const res = await api.put(`/api/payments/${id}/pay`, { paymentMethod: "demo" });
      const updatedPayment = res.data?.payment;

      setPayments((prev) =>
        prev.map((p) =>
          p._id === id
            ? {
                ...p,
                status:     "paid",
                paidAt:     updatedPayment?.paidAt || new Date().toISOString(),
                paidAmount: updatedPayment?.paidAmount,
              }
            : p
        )
      );

      // Эхний төлбөр төлсөн бол гэрээ active болсон
      if (updatedPayment?.paymentNumber === 1) {
        setApplication((prev) => prev ? { ...prev, contractStatus: "active" } : prev);
      }

      setConfirmPayId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Төлбөр хийгдсэнгүй");
    } finally {
      setPaying(null);
    }
  };

  const sorted = useMemo(() => {
    return [...payments].sort((a, b) => {
      const pa = STATUS_META[a.status]?.priority || 99;
      const pb = STATUS_META[b.status]?.priority || 99;
      if (pa !== pb) return pa - pb;
      return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
    });
  }, [payments]);

  // ⭐ ЗАСВАР #3: payment.amount → payment.totalAmount
  const totals = useMemo(() => {
    const t = { total: 0, paid: 0, due: 0, overdue: 0 };
    for (const p of payments) {
      const amt = p.totalAmount || 0;
      t.total += amt;
      if (p.status === "paid") t.paid += amt;
      if (p.status === "pending" || p.status === "urgent") t.due += amt;
      if (p.status === "overdue") t.overdue += amt;
    }
    return t;
  }, [payments]);

  if (loading) return <LoadingState />;
  if (error && !application) return <ErrorState message={error} />;

  const property = application?.property || {};
  const isTenant = user._id === (application?.tenant?._id || application?.tenant);

  // ⭐ ЗАСВАР #4: images, location.*, monthlyRent
  const cover    = property.images?.[0] || property.photos?.[0] || PLACEHOLDER;
  const district = property.location?.district || property.district || "Улаанбаатар";
  const monthlyRent = property.monthlyRent ?? property.price ?? 0;

  const payToConfirm = payments.find((p) => p._id === confirmPayId);

  return (
    <div className="min-h-screen pt-20" style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-8">
        <button onClick={() => navigate(-1)}
          className="text-[10px] tracking-[0.3em] uppercase text-white/40 hover:text-white transition-colors"
        >← Буцах</button>
      </div>

      <header className="max-w-6xl mx-auto px-6 lg:px-12 mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-8" style={{ background: "#C9A84C" }} />
          <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#C9A84C" }}>Payment Schedule</span>
        </div>
        <h1 className="font-light text-white leading-[1] tracking-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(40px, 5vw, 64px)" }}
        >
          Төлбөрийн<br />
          <em style={{ color: "#C9A84C", fontStyle: "italic" }}>хуваарь</em>
        </h1>
      </header>

      {/* Property summary */}
      <section className="max-w-6xl mx-auto px-6 lg:px-12 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5"
          style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.15)" }}
        >
          <Link to={property._id ? `/properties/${property._id}` : "#"}
            className="md:col-span-2 block relative overflow-hidden"
            style={{ aspectRatio: "4/3", border: "1px solid rgba(201,168,76,0.15)" }}
          >
            <img src={cover} alt="" className="w-full h-full object-cover"
              style={{ filter: "brightness(0.88)" }}
              onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
            />
          </Link>
          <div className="md:col-span-10">
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-2">{district}</div>
            <h3 className="font-light text-white leading-tight mb-2"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26 }}
            >{property.title}</h3>
            <div className="font-light"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "#C9A84C", fontSize: 22 }}
            >
              {formatMNT(monthlyRent)}₮
              <span className="text-[10px] tracking-[0.2em] uppercase text-white/40 ml-2">/ сар</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {payments.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 lg:px-12 mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            style={{ border: "1px solid rgba(201,168,76,0.15)" }}
          >
            {[
              { label: "Нийт",         value: totals.total,   color: "#C9A84C" },
              { label: "Төлсөн",       value: totals.paid,    color: "#10B981" },
              { label: "Хүлээгдэж буй", value: totals.due,     color: "#F59E0B" },
              { label: "Хоцорсон",     value: totals.overdue, color: "#EF4444" },
            ].map((s, i) => (
              <div key={s.label} className="p-5"
                style={{ borderRight: i < 3 ? "1px solid rgba(201,168,76,0.08)" : "none" }}
              >
                <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-2">{s.label}</div>
                <div className="font-light leading-none"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: s.color }}
                >{formatMNT(s.value)}₮</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {error && (
        <section className="max-w-6xl mx-auto px-6 lg:px-12 mb-6">
          <div className="p-4 flex items-start gap-3"
            style={{ background: "rgba(239,68,68,0.08)", borderLeft: "2px solid #EF4444" }}
          >
            <span style={{ color: "#EF4444" }}>✕</span>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </section>
      )}

      <main className="max-w-6xl mx-auto px-6 lg:px-12 pb-20">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 px-6"
            style={{ border: "1px solid rgba(201,168,76,0.15)", background: "rgba(201,168,76,0.02)" }}
          >
            <div className="w-16 h-16 mb-8 flex items-center justify-center" style={{ border: "1px solid #C9A84C" }}>
              <div style={{ width: 24, height: 24, background: "#C9A84C", transform: "rotate(45deg)" }} />
            </div>
            <h3 className="font-light text-white mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32 }}>
              Төлбөр <em style={{ color: "#C9A84C", fontStyle: "italic" }}>үүсээгүй</em>
            </h3>
            <p className="text-sm text-white/50 max-w-md">
              Гэрээ хүчин төгөлдөр болсны дараа төлбөрийн хуваарь автоматаар үүсэх болно.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((p) => (
              <PaymentRow key={p._id} payment={p} isTenant={isTenant}
                onPay={() => setConfirmPayId(p._id)} paying={paying === p._id}
              />
            ))}
          </div>
        )}
      </main>

      {payToConfirm && (
        <ConfirmModal
          payment={payToConfirm}
          onConfirm={() => handlePay(payToConfirm._id)}
          onCancel={() => setConfirmPayId(null)}
          submitting={paying === payToConfirm._id}
        />
      )}
    </div>
  );
}

// ⭐ ЗАСВАР: payment.totalAmount (amount биш) + payment.includesDeposit + paymentNumber
function PaymentRow({ payment, isTenant, onPay, paying }) {
  const meta = STATUS_META[payment.status] || STATUS_META.pending;
  const canPay = isTenant && ["urgent", "pending", "overdue"].includes(payment.status);
  const isUrgent = payment.status === "urgent";

  return (
    <div className="grid grid-cols-12 gap-4 p-5 items-center transition-all duration-300"
      style={{
        background: isUrgent ? "rgba(239,68,68,0.04)" : "#141414",
        border: `1px solid ${
          isUrgent ? "rgba(239,68,68,0.3)"
          : payment.status === "overdue" ? "rgba(239,68,68,0.2)"
          : "rgba(201,168,76,0.1)"
        }`,
      }}
    >
      {/* Order */}
      <div className="col-span-1 font-light text-right"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "#C9A84C", fontSize: 28 }}
      >
        {String(payment.paymentNumber || "?").padStart(2, "0")}
      </div>

      {/* Details */}
      <div className="col-span-12 md:col-span-5">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[10px] tracking-[0.25em] uppercase text-white/40">
            {getPaymentLabel(payment)}
          </span>
          {payment.includesDeposit && (
            <span className="px-1.5 py-0.5 text-[9px] tracking-[0.2em] uppercase"
              style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C" }}
            >+ Барьцаа</span>
          )}
          {payment.periodMonths > 1 && (
            <span className="text-[9px] tracking-[0.2em] uppercase text-white/30">
              {payment.periodMonths} сар
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-white/60 flex-wrap">
          <span>Эцсийн огноо: {formatDate(payment.dueDate)}</span>
          {payment.paidAt && (
            <>
              <span className="text-white/30">·</span>
              <span style={{ color: "#10B981" }}>Төлсөн: {formatDate(payment.paidAt)}</span>
            </>
          )}
        </div>
        {payment.note && <p className="text-xs text-white/45 mt-1">{payment.note}</p>}
      </div>

      {/* Amount */}
      <div className="col-span-6 md:col-span-3">
        <div className="font-light"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: payment.status === "paid" ? "#10B981" : "#C9A84C",
            fontSize: 22,
          }}
        >
          {formatMNT(payment.totalAmount)}₮
        </div>
        {payment.includesDeposit && payment.depositAmount > 0 && (
          <div className="text-[10px] tracking-[0.2em] uppercase text-white/40 mt-1">
            {formatMNT(payment.rentAmount)}₮ + {formatMNT(payment.depositAmount)}₮ барьцаа
          </div>
        )}
      </div>

      {/* Status + action */}
      <div className="col-span-6 md:col-span-3 flex flex-col items-end gap-2">
        <StatusPill label={meta.label} color={meta.color} />
        {canPay && (
          <button onClick={onPay} disabled={paying}
            className="px-4 py-2 text-[10px] tracking-[0.25em] uppercase transition-all duration-300 disabled:opacity-50"
            style={{
              background: isUrgent ? "#EF4444" : "#C9A84C",
              color:      isUrgent ? "#fff"    : "#0A0A0A",
            }}
            onMouseEnter={(e) => {
              if (paying) return;
              e.currentTarget.style.background = isUrgent ? "#F87171" : "#E8D49E";
            }}
            onMouseLeave={(e) => {
              if (paying) return;
              e.currentTarget.style.background = isUrgent ? "#EF4444" : "#C9A84C";
            }}
          >{paying ? "..." : "Төлөх →"}</button>
        )}
      </div>
    </div>
  );
}

function ConfirmModal({ payment, onConfirm, onCancel, submitting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fadeIn"
      style={{ background: "rgba(5,5,5,0.9)", backdropFilter: "blur(8px)" }}
      onClick={onCancel}
    >
      <div className="w-full max-w-md relative animate-fadeUp"
        style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8" style={{ background: "#C9A84C" }} />
            <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#C9A84C" }}>Confirm Payment</span>
          </div>
          <h2 className="font-light text-white mb-6 leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32 }}
          >
            Төлбөр<br />
            <em style={{ color: "#C9A84C", fontStyle: "italic" }}>баталгаажуулах</em>
          </h2>
          <div className="space-y-3 p-5 mb-6"
            style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}
          >
            <Row label="Төлбөр" value={getPaymentLabel(payment)} />
            <Row label="Эцсийн огноо" value={formatDate(payment.dueDate)} />
            {payment.includesDeposit && (
              <>
                <Row label="Сарын түрээс" value={`${formatMNT(payment.rentAmount)}₮`} />
                <Row label="Барьцаа"     value={`${formatMNT(payment.depositAmount)}₮`} />
              </>
            )}
            <Row label="Нийт дүн"
              value={<span style={{ color: "#C9A84C" }}>{formatMNT(payment.totalAmount)}₮</span>}
              big
            />
          </div>
          <p className="text-xs text-white/50 mb-6 leading-relaxed">
            ◇ Та энэ төлбөрийг хийсэн гэдгийг баталгаажуулна уу. Үйлдэл буцаагдахгүй.
          </p>
          <div className="flex gap-3">
            <button onClick={onCancel} disabled={submitting}
              className="flex-1 py-3 text-[10px] tracking-[0.25em] uppercase text-white/60 hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}
            >Болих</button>
            <button onClick={onConfirm} disabled={submitting}
              className="flex-1 py-3 text-[10px] tracking-[0.25em] uppercase transition-all duration-300 disabled:opacity-50"
              style={{ background: "#C9A84C", color: "#0A0A0A" }}
              onMouseEnter={(e) => !submitting && (e.currentTarget.style.background = "#E8D49E")}
              onMouseLeave={(e) => !submitting && (e.currentTarget.style.background = "#C9A84C")}
            >{submitting ? "Илгээж байна..." : "Баталгаажуулах →"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, big }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] tracking-[0.25em] uppercase text-white/40">{label}</span>
      <span className={big ? "font-light" : "text-sm text-white/80"}
        style={big ? { fontFamily: "'Cormorant Garamond', serif", fontSize: 24 } : undefined}
      >{value}</span>
    </div>
  );
}

function StatusPill({ label, color }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] tracking-[0.2em] uppercase"
      style={{ background: `${color}15`, color, border: `1px solid ${color}50` }}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center" style={{ background: "#0A0A0A" }}>
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-6 animate-spin"
          style={{ border: "2px solid rgba(201,168,76,0.2)", borderTopColor: "#C9A84C", borderRadius: "50%" }}
        />
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">Уншиж байна</p>
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-6" style={{ background: "#0A0A0A" }}>
      <div className="text-center max-w-md">
        <h2 className="font-light text-white mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36 }}>
          <em style={{ color: "#C9A84C", fontStyle: "italic" }}>Алдаа</em>
        </h2>
        <p className="text-sm text-white/50 mb-8">{message}</p>
        <Link to="/home"
          className="inline-block px-8 py-3 text-[10px] tracking-[0.3em] uppercase"
          style={{ background: "#C9A84C", color: "#0A0A0A" }}
        >Эхлэл рүү →</Link>
      </div>
    </div>
  );
}

export default Payment;