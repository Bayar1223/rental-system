import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

const STATUS_CONFIG = {
  pending:   { label: "Хүлээгдэж байна", color: "var(--gold)"     },
  approved:  { label: "Зөвшөөрсөн",     color: "#22C55E"          },
  rejected:  { label: "Татгалзсан",      color: "#EF4444"          },
  cancelled: { label: "Цуцлагдсан",      color: "var(--text-soft)" },
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}м өмнө`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}ц өмнө`;
  return `${Math.floor(diff / 86400)}ө өмнө`;
}

export default function LandlordApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [acting, setActing] = useState(null);

  useEffect(() => {
    api.get("/api/applications/landlord")
      .then(r => setApplications(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id, action) => {
    const label = action === "approve" ? "зөвшөөрөх" : "татгалзах";
    if (!window.confirm(`Хүсэлтийг ${label} уу?`)) return;
    setActing(id + action);
    try {
      const res = await api.put(`/api/applications/${id}/${action}`);
      setApplications(prev => prev.map(a => a._id === id ? { ...a, status: res.data.application?.status || (action === "approve" ? "approved" : "rejected") } : a));
    } catch { alert("Алдаа гарлаа"); }
    finally { setActing(null); }
  };

  const filtered = applications.filter(a => filter === "all" ? true : a.status === filter);
  const pending = applications.filter(a => a.status === "pending").length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--black)", paddingTop: 70 }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 48px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div className="flex items-center gap-4 mb-4">
            <div style={{ width: 32, height: 1, background: "var(--gold)" }} />
            <span style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--gold)" }}>
              Ирсэн
            </span>
          </div>
          <div className="flex items-end justify-between">
            <h1 className="font-display" style={{ fontSize: 48, fontWeight: 300, color: "var(--white)" }}>Хүсэлтүүд</h1>
            {pending > 0 && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.15em", padding: "4px 14px", background: "rgba(201,160,80,0.12)", border: "1px solid rgba(201,160,80,0.3)", color: "var(--gold)" }}>
                  {pending} хүлээгдэж байна
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        {applications.length > 0 && (
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-dim)", marginBottom: 24 }}>
            {[
              { key: "all",      label: `Бүгд (${applications.length})` },
              { key: "pending",  label: `Хүлээгдэж (${pending})` },
              { key: "approved", label: `Зөвшөөрсөн (${applications.filter(a=>a.status==="approved").length})` },
              { key: "rejected", label: `Татгалзсан (${applications.filter(a=>a.status==="rejected").length})` },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{
                  padding: "10px 20px",
                  fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase",
                  background: "transparent", border: "none",
                  borderBottom: filter === f.key ? "1px solid var(--gold)" : "1px solid transparent",
                  color: filter === f.key ? "var(--gold)" : "var(--text-muted)",
                  cursor: "pointer", marginBottom: -1, transition: "all 0.2s",
                }}>
                {f.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 120, background: "var(--dark)", border: "1px solid var(--border-dim)", animation: "pulse 2s ease infinite" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p className="font-display" style={{ fontSize: 32, fontWeight: 300, color: "var(--text-soft)", marginBottom: 12 }}>Хүсэлт байхгүй</p>
            <p style={{ fontFamily: "'Montserrat'", fontSize: 12, color: "var(--text-soft)" }}>
              {filter !== "all" ? "Энэ статустай хүсэлт байхгүй байна" : "Одоохондоо хүсэлт ирээгүй байна"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(app => {
              const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
              const img = app.property?.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";
              return (
                <div
                  key={app._id}
                  style={{
                    background: app.status === "pending" ? "rgba(201,160,80,0.02)" : "var(--dark)",
                    border: "1px solid",
                    borderColor: app.status === "pending" ? "rgba(201,160,80,0.15)" : "var(--border-dim)",
                    display: "flex",
                    gap: 0,
                    overflow: "hidden",
                    transition: "border-color 0.2s",
                  }}
                >
                  {/* Property image */}
                  <div style={{ width: 100, flexShrink: 0, overflow: "hidden" }}>
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.75)" }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, padding: "16px 20px", minWidth: 0 }}>
                    <div className="flex items-start justify-between gap-4">
                      <div style={{ minWidth: 0 }}>
                        <div className="flex items-center gap-3 mb-1">
                          {/* Tenant avatar */}
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(201,160,80,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: "1px solid var(--border)" }}>
                            {app.tenant?.avatar
                              ? <img src={app.tenant.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                              : <span style={{ fontFamily: "'Cormorant Garamond'", fontSize: 14, color: "var(--gold)" }}>{app.tenant?.firstName?.[0]}</span>
                            }
                          </div>
                          <p style={{ fontFamily: "'Montserrat'", fontSize: 13, fontWeight: 400, color: "var(--white)" }}>
                            {app.tenant?.firstName} {app.tenant?.lastName}
                          </p>
                          <span style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--text-soft)" }}>·</span>
                          <span style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--text-soft)" }}>{app.tenant?.phone}</span>
                        </div>
                        <p style={{ fontFamily: "'Montserrat'", fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }} className="line-clamp-1">
                          {app.property?.title}
                        </p>
                        <div className="flex items-center gap-4">
                          <span style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--gold)" }}>
                            {app.leaseMonths} сар · {app.totalRent?.toLocaleString()}₮
                          </span>
                          <span style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--text-soft)" }}>
                            {timeAgo(app.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
                        <span style={{
                          fontFamily: "'Montserrat'", fontSize: 8, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase",
                          padding: "3px 10px", border: `1px solid ${sc.color}30`, color: sc.color
                        }}>
                          {sc.label}
                        </span>
                        {app.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleAction(app._id, "approve")}
                              disabled={!!acting}
                              className="btn-gold"
                              style={{ fontSize: 9, padding: "7px 16px" }}
                            >
                              {acting === app._id + "approve" ? "..." : "Зөвшөөрөх"}
                            </button>
                            <button
                              onClick={() => handleAction(app._id, "reject")}
                              disabled={!!acting}
                              className="btn-danger"
                              style={{ fontSize: 9, padding: "7px 16px" }}
                            >
                              {acting === app._id + "reject" ? "..." : "Татгалзах"}
                            </button>
                          </>
                        )}
                        {app.contractStatus === "signed" && (
                          <Link to={`/contract/${app._id}`} className="btn-outline" style={{ fontSize: 9, padding: "7px 14px" }}>
                            Гэрээ
                          </Link>
                        )}
                      </div>
                    </div>
                    {app.message && (
                      <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderLeft: "1px solid var(--border-dim)" }}>
                        <p style={{ fontFamily: "'Montserrat'", fontSize: 10, fontWeight: 300, color: "var(--text-muted)", fontStyle: "italic" }}>
                          "{app.message}"
                        </p>
                      </div>
                    )}
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