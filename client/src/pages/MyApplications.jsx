import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

const STATUS_CONFIG = {
  pending:   { label: "Хүлээгдэж байна", color: "var(--gold)",  border: "rgba(201,160,80,0.3)"  },
  approved:  { label: "Зөвшөөрсөн",     color: "#22C55E",       border: "rgba(34,197,94,0.3)"  },
  rejected:  { label: "Татгалзсан",      color: "#EF4444",       border: "rgba(239,68,68,0.3)"  },
  cancelled: { label: "Цуцлагдсан",      color: "var(--text-soft)", border: "var(--border-dim)" },
};

const CONTRACT_CONFIG = {
  not_started:  { label: "Гэрээ байхгүй",   color: "var(--text-soft)" },
  pending:      { label: "Гэрээ хүлээгдэж", color: "var(--gold)"      },
  signed:       { label: "Гэрээ байгуулсан",color: "#22C55E"           },
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} минутын өмнө`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} цагийн өмнө`;
  return `${Math.floor(diff / 86400)} өдрийн өмнө`;
}

export default function MyApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    api.get("/api/applications/my")
      .then(r => setApplications(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Энэхүү хүсэлтийг цуцлах уу?")) return;
    setCancelling(id);
    try {
      await api.delete(`/api/applications/${id}`);
      setApplications(prev => prev.map(a => a._id === id ? { ...a, status: "cancelled" } : a));
    } catch { alert("Алдаа гарлаа"); }
    finally { setCancelling(null); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--black)", paddingTop: 70 }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 48px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div className="flex items-center gap-4 mb-4">
            <div style={{ width: 32, height: 1, background: "var(--gold)" }} />
            <span style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--gold)" }}>
              Миний
            </span>
          </div>
          <h1 className="font-display" style={{ fontSize: 48, fontWeight: 300, color: "var(--white)" }}>
            Хүсэлтүүд
          </h1>
          {!loading && (
            <p style={{ fontFamily: "'Montserrat'", fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
              {applications.length} хүсэлт
            </p>
          )}
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 140, background: "var(--dark)", border: "1px solid var(--border-dim)", animation: "pulse 2s ease infinite" }} />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "96px 0" }}>
            <div className="font-display" style={{ fontSize: 64, fontWeight: 300, color: "rgba(201,160,80,0.1)", marginBottom: 16 }}>◈</div>
            <p className="font-display" style={{ fontSize: 32, fontWeight: 300, color: "var(--text-soft)", marginBottom: 12 }}>
              Хүсэлт байхгүй
            </p>
            <p style={{ fontFamily: "'Montserrat'", fontSize: 12, color: "var(--text-soft)", marginBottom: 28 }}>
              Байр хайж хүсэлт илгээнэ үү
            </p>
            <Link to="/home" className="btn-gold">Байр хайх →</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {applications.map((app) => {
              const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
              const cc = CONTRACT_CONFIG[app.contractStatus] || CONTRACT_CONFIG.not_started;
              const img = app.property?.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";
              return (
                <div
                  key={app._id}
                  style={{
                    background: "var(--dark)",
                    border: "1px solid var(--border-dim)",
                    display: "flex",
                    gap: 0,
                    overflow: "hidden",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(201,160,80,0.2)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-dim)"}
                >
                  {/* Image */}
                  <div style={{ width: 140, flexShrink: 0, position: "relative", overflow: "hidden" }}>
                    <img
                      src={img}
                      alt={app.property?.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.8)" }}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent, rgba(8,8,8,0.4))" }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, padding: "20px 24px", minWidth: 0 }}>
                    <div className="flex items-start justify-between gap-4">
                      <div style={{ minWidth: 0 }}>
                        <Link
                          to={`/properties/${app.property?._id}`}
                          style={{ textDecoration: "none" }}
                        >
                          <h3 className="font-display line-clamp-1" style={{ fontSize: 20, fontWeight: 400, color: "var(--white)", marginBottom: 4 }}>
                            {app.property?.title}
                          </h3>
                        </Link>
                        <p style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
                          {app.property?.location?.district} · {app.leaseMonths} сар · {app.totalRent?.toLocaleString()}₮
                        </p>
                      </div>

                      {/* Status badge */}
                      <span style={{
                        fontFamily: "'Montserrat'", fontSize: 8, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase",
                        padding: "4px 12px", border: `1px solid ${sc.border}`, color: sc.color, flexShrink: 0, whiteSpace: "nowrap"
                      }}>
                        {sc.label}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        {/* Contract status */}
                        <div className="flex items-center gap-2">
                          <div style={{ width: 4, height: 4, borderRadius: "50%", background: cc.color }} />
                          <span style={{ fontFamily: "'Montserrat'", fontSize: 9, color: cc.color }}>{cc.label}</span>
                        </div>
                        <span style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--text-soft)" }}>
                          {timeAgo(app.createdAt)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 8 }}>
                        {app.contractStatus === "signed" && (
                          <Link
                            to={`/contract/${app._id}`}
                            className="btn-outline"
                            style={{ fontSize: 9, padding: "7px 16px" }}
                          >
                            Гэрээ харах
                          </Link>
                        )}
                        {app.status === "approved" && app.contractStatus !== "signed" && (
                          <Link
                            to={`/contract/${app._id}`}
                            className="btn-gold"
                            style={{ fontSize: 9, padding: "7px 16px" }}
                          >
                            Гэрээ байгуулах →
                          </Link>
                        )}
                        {app.status === "pending" && (
                          <button
                            onClick={() => handleCancel(app._id)}
                            disabled={cancelling === app._id}
                            className="btn-danger"
                            style={{ fontSize: 9, padding: "7px 16px" }}
                          >
                            {cancelling === app._id ? "Цуцалж байна..." : "Цуцлах"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}