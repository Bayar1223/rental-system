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

const APP_STATUS = {
  pending:  { label: "Хүлээгдэж байна", color: "#D97706" },
  approved: { label: "Зөвшөөрсөн",      color: "#16A34A" },
  rejected: { label: "Татгалзсан",      color: "#EF4444" },
};

function LandlordApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRentals, setActiveRentals] = useState([]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/applications/landlord");
      const all = res.data;
      setApplications(all);
      setActiveRentals(all.filter(a =>
        ["signed","payment_pending","active"].includes(a.contractStatus)
      ));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/applications/landlord");
        if (!cancelled) {
          const all = res.data;
          setApplications(all);
          setActiveRentals(all.filter(a =>
            ["signed","payment_pending","active"].includes(a.contractStatus)
          ));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/applications/${id}/status`, { status });
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.message || "Алдаа гарлаа");
    }
  };

  // Шийдвэрлэх шаардлагатай (pending)
  const pending = applications.filter(a => a.status === "pending");
  // Гэрээ зурагдаж байгаа / идэвхтэй
  const withContract = applications.filter(a =>
    a.status === "approved" && a.contractStatus && a.contractStatus !== "none"
  );

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("mn-MN") : "—";

  const AppCard = ({ app }) => {
    const cs = CONTRACT_STATUS[app.contractStatus] || CONTRACT_STATUS.none;
    const as = APP_STATUS[app.status] || APP_STATUS.pending;
    const image = app.property?.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";

    return (
      <div className="bg-white border overflow-hidden" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex">
          <div className="w-1 flex-shrink-0" style={{ background: app.status === "pending" ? "#D97706" : cs.color }} />
          <div className="flex flex-col md:flex-row flex-1">
            <img src={image} alt="" className="w-full md:w-36 h-28 object-cover flex-shrink-0" />
            <div className="p-5 flex-1">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-medium text-sm mb-0.5" style={{ color: "var(--ink)" }}>
                    {app.property?.title}
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {app.property?.location?.district}, {app.property?.location?.city}
                  </p>
                  <p className="font-display text-base font-light mt-1" style={{ color: "var(--gold)" }}>
                    {app.property?.monthlyRent?.toLocaleString()}₮/сар
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-xs px-2 py-1 font-medium" style={{ color: as.color, background: as.color + "15" }}>
                    {as.label}
                  </span>
                  {app.contractStatus && app.contractStatus !== "none" && (
                    <span className="text-xs px-2 py-1" style={{ background: cs.bg, color: cs.color }}>
                      {cs.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Tenant info */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: "var(--gold)" }}>👤</span>
                  {app.tenant?.firstName} {app.tenant?.lastName}
                </div>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: "var(--gold)" }}>📞</span>
                  {app.tenant?.phone}
                </div>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: "var(--gold)" }}>✉️</span>
                  {app.tenant?.email}
                </div>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: "var(--gold)" }}>📅</span>
                  {app.leaseMonths} сар
                </div>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: "var(--gold)" }}>💰</span>
                  {app.totalRent?.toLocaleString()}₮
                </div>
                {app.startDate && (
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: "var(--gold)" }}>🗓️</span>
                    {formatDate(app.startDate)}
                  </div>
                )}
              </div>

              {/* Message */}
              {app.message && (
                <div className="mb-3 p-3 text-xs italic" style={{ background: "var(--cream)", color: "var(--text-muted)", borderLeft: "2px solid var(--gold-light)" }}>
                  "{app.message}"
                </div>
              )}

              {/* Signature status */}
              {app.contractStatus === "pending_signatures" && (
                <div className="mb-3 flex items-center gap-3 text-xs" style={{ color: "var(--text-soft)" }}>
                  <span>🔥 Гарын үсэг хүлээгдэж байна</span>
                  <span style={{ color: app.landlordSigned ? "#16A34A" : "var(--text-soft)" }}>
                    {app.landlordSigned ? "✓ Та зурлаа" : "○ Та зураагүй"}
                  </span>
                  <span style={{ color: app.tenantSigned ? "#16A34A" : "var(--text-soft)" }}>
                    {app.tenantSigned ? "✓ Түрээслэгч зурлаа" : "○ Түрээслэгч зураагүй"}
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {app.status === "pending" && (
                  <>
                    <button onClick={() => updateStatus(app._id, "approved")}
                      className="btn-gold text-xs" style={{ padding: "7px 16px" }}>
                      ✓ Зөвшөөрөх
                    </button>
                    <button onClick={() => updateStatus(app._id, "rejected")}
                      className="text-xs px-4 py-1.5 border transition-colors"
                      style={{ borderColor: "#FCA5A5", color: "#EF4444", background: "white" }}>
                      ✕ Татгалзах
                    </button>
                  </>
                )}
                {app.status === "approved" && app.contractStatus && app.contractStatus !== "none" && (
                  <Link to={`/contract/${app._id}`} className="btn-outline-gold text-xs" style={{ padding: "7px 16px" }}>
                    Гэрээ харах
                  </Link>
                )}
                {app.contractStatus === "pending_signatures" && !app.landlordSigned && (
                  <Link to={`/contract/${app._id}`} className="btn-gold text-xs" style={{ padding: "7px 16px" }}>
                    ✍️ Гарын үсэг зурах
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingTop: 64 }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>Landlord</p>
            <h1 className="font-display text-4xl font-light" style={{ color: "var(--ink)" }}>Ирсэн хүсэлтүүд</h1>
          </div>
          {activeRentals.length > 0 && (
            <Link to="/my-rentals"
              className="text-xs px-4 py-2 border flex items-center gap-2 transition-colors"
              style={{ borderColor: "var(--gold)", color: "var(--gold)", background: "var(--cream)" }}>
              Түрээслэгдсэн байрнууд ({activeRentals.length}) →
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
            <p className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Ачааллаж байна</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20 bg-white border" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="font-display text-2xl font-light mb-2" style={{ color: "var(--ink)" }}>Хүсэлт ирээгүй байна</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Байрнуудад хүсэлт ирэхэд энд харагдана</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Шийдвэрлэх шаардлагатай */}
            {pending.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#D97706" }} />
                  <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                    Шийдвэрлэх шаардлагатай ({pending.length})
                  </p>
                </div>
                <div className="space-y-4">
                  {pending.map(app => <AppCard key={app._id} app={app} />)}
                </div>
              </div>
            )}

            {/* Гэрээ зурагдаж байгаа / бусад */}
            {withContract.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#16A34A" }} />
                  <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                    Гэрээ зурагдаж байгаа ({withContract.length})
                  </p>
                </div>
                <div className="space-y-4">
                  {withContract.map(app => <AppCard key={app._id} app={app} />)}
                </div>
              </div>
            )}

            {/* Rejected */}
            {applications.filter(a => a.status === "rejected").length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#9CA3AF" }} />
                  <p className="text-sm" style={{ color: "var(--text-soft)" }}>
                    Татгалзсан ({applications.filter(a => a.status === "rejected").length})
                  </p>
                </div>
                <div className="space-y-4">
                  {applications.filter(a => a.status === "rejected").map(app => <AppCard key={app._id} app={app} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LandlordApplications;