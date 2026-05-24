import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

function ProgressBar({ paid, total }) {
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Төлбөрийн явц
        </span>
        <span style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--gold)" }}>
          {paid}/{total} · {pct}%
        </span>
      </div>
      <div style={{ height: 1, background: "var(--border-dim)", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${pct}%`,
          background: "linear-gradient(to right, var(--gold), rgba(201,160,80,0.6))",
          transition: "width 0.6s ease",
        }} />
      </div>
    </div>
  );
}

export default function MyRentals() {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get("/api/rentals/my")
      .then(r => setRentals(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) { alert("Шалтгаан оруулна уу"); return; }
    setCancelling(true);
    try {
      await api.post(`/api/rentals/${cancelModal._id}/cancel`, { reason: cancelReason });
      setRentals(prev => prev.map(r => r._id === cancelModal._id ? { ...r, status: "cancelled" } : r));
      setCancelModal(null);
      setCancelReason("");
    } catch { alert("Алдаа гарлаа"); }
    finally { setCancelling(false); }
  };

  const statusColors = {
    active:    { color: "#22C55E", label: "Идэвхтэй" },
    completed: { color: "var(--text-muted)", label: "Дууссан" },
    cancelled: { color: "#EF4444", label: "Цуцлагдсан" },
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--black)", paddingTop: 70 }}>
      <Navbar />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 48px" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div className="flex items-center gap-4 mb-4">
            <div style={{ width: 32, height: 1, background: "var(--gold)" }} />
            <span style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--gold)" }}>
              Миний
            </span>
          </div>
          <h1 className="font-display" style={{ fontSize: 48, fontWeight: 300, color: "var(--white)" }}>Түрээс</h1>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[1, 2].map(i => (
              <div key={i} style={{ height: 200, background: "var(--dark)", border: "1px solid var(--border-dim)", animation: "pulse 2s ease infinite" }} />
            ))}
          </div>
        ) : rentals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "96px 0" }}>
            <div className="font-display" style={{ fontSize: 64, fontWeight: 300, color: "rgba(201,160,80,0.08)", marginBottom: 16 }}>◈</div>
            <p className="font-display" style={{ fontSize: 32, fontWeight: 300, color: "var(--text-soft)", marginBottom: 12 }}>
              Идэвхтэй түрээс байхгүй
            </p>
            <Link to="/home" className="btn-gold" style={{ marginTop: 8 }}>
              Байр хайх →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {rentals.map(rental => {
              const sc = statusColors[rental.status] || statusColors.active;
              const img = rental.property?.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";
              const paidCount = rental.payments?.filter(p => p.status === "paid").length || 0;
              const totalCount = rental.payments?.length || rental.leaseMonths || 0;
              const nextPayment = rental.payments?.find(p => p.status === "pending" || p.status === "overdue");

              return (
                <div
                  key={rental._id}
                  style={{
                    background: "var(--dark)",
                    border: "1px solid var(--border-dim)",
                    overflow: "hidden",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(201,160,80,0.2)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-dim)"}
                >
                  <div style={{ display: "flex" }}>
                    {/* Property image */}
                    <div style={{ width: 180, flexShrink: 0, position: "relative", overflow: "hidden" }}>
                      <img
                        src={img}
                        alt={rental.property?.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.75)" }}
                      />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent, rgba(8,8,8,0.3))" }} />
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, padding: "24px 28px" }}>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div style={{ minWidth: 0 }}>
                          <Link to={`/properties/${rental.property?._id}`} style={{ textDecoration: "none" }}>
                            <h3 className="font-display line-clamp-1" style={{ fontSize: 22, fontWeight: 400, color: "var(--white)", marginBottom: 4 }}>
                              {rental.property?.title}
                            </h3>
                          </Link>
                          <p style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                            {rental.property?.location?.district} · {rental.leaseMonths} сар
                          </p>
                        </div>
                        <span style={{
                          fontFamily: "'Montserrat'", fontSize: 8, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase",
                          padding: "4px 12px", border: `1px solid ${sc.color}30`, color: sc.color, flexShrink: 0
                        }}>
                          {sc.label}
                        </span>
                      </div>

                      {/* Stats row */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, marginBottom: 16, borderTop: "1px solid var(--border-dim)", borderBottom: "1px solid var(--border-dim)", padding: "12px 0" }}>
                        {[
                          { label: "Сарын түрээс", value: `${rental.property?.monthlyRent?.toLocaleString()}₮` },
                          { label: "Нийт дүн", value: `${rental.totalRent?.toLocaleString()}₮` },
                          { label: "Дараагийн төлбөр", value: nextPayment ? `${nextPayment.totalAmount?.toLocaleString()}₮` : "—" },
                        ].map(({ label, value }) => (
                          <div key={label} style={{ paddingRight: 16 }}>
                            <p style={{ fontFamily: "'Montserrat'", fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-soft)", marginBottom: 4 }}>{label}</p>
                            <p className="font-display" style={{ fontSize: 18, fontWeight: 300, color: "var(--white)" }}>{value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Progress */}
                      <div style={{ marginBottom: 16 }}>
                        <ProgressBar paid={paidCount} total={totalCount} />
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 8 }}>
                        {rental.status === "active" && nextPayment && (
                          <Link
                            to={`/payment/${nextPayment._id}`}
                            className="btn-gold"
                            style={{ fontSize: 9, padding: "8px 16px" }}
                          >
                            Төлбөр хийх →
                          </Link>
                        )}
                        <Link
                          to={`/contract/${rental.application}`}
                          className="btn-outline"
                          style={{ fontSize: 9, padding: "8px 14px", textDecoration: "none" }}
                        >
                          Гэрээ
                        </Link>
                        {rental.status === "active" && (
                          <button
                            onClick={() => setCancelModal(rental)}
                            className="btn-ghost"
                            style={{ fontSize: 9, padding: "8px 14px", color: "#EF4444" }}
                          >
                            Цуцлах
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

      {/* Cancel Modal */}
      {cancelModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) { setCancelModal(null); setCancelReason(""); } }}
        >
          <div style={{ width: "100%", maxWidth: 440, background: "var(--dark)", border: "1px solid var(--border)", borderTop: "1px solid #EF4444" }}>
            <div style={{ padding: "28px 32px" }}>
              <div className="flex items-center gap-3 mb-4">
                <div style={{ width: 20, height: 1, background: "#EF4444" }} />
                <span style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "#EF4444" }}>
                  Анхааруулга
                </span>
              </div>
              <h2 className="font-display" style={{ fontSize: 28, fontWeight: 300, color: "var(--white)", marginBottom: 12 }}>
                Түрээс цуцлах
              </h2>
              <p style={{ fontFamily: "'Montserrat'", fontSize: 11, fontWeight: 300, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 20 }}>
                <span style={{ color: "var(--white)" }}>{cancelModal.property?.title}</span> байрны түрээсийг цуцлах гэж байна. Шалтгааныг тайлбарлана уу.
              </p>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Цуцлах шалтгаан..."
                rows={4}
                style={{
                  width: "100%", fontFamily: "'Montserrat'", fontSize: 12, fontWeight: 300,
                  background: "var(--dark-2)", border: "1px solid var(--border-dim)", borderBottom: "1px solid var(--border)",
                  color: "var(--white)", padding: "12px 16px", resize: "vertical", outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderBottomColor = "var(--gold)"}
                onBlur={e => e.target.style.borderBottomColor = "var(--border)"}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button onClick={() => { setCancelModal(null); setCancelReason(""); }} className="btn-ghost" style={{ flex: 1, padding: "12px 0" }}>
                  Буцах
                </button>
                <button onClick={handleCancelSubmit} disabled={cancelling} className="btn-danger" style={{ flex: 1, padding: "12px 0", justifyContent: "center" }}>
                  {cancelling ? "Цуцалж байна..." : "Цуцлах"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}