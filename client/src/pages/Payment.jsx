import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

export default function Payment() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [qpayData, setQpayData] = useState(null);
  const [showQpay, setShowQpay] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState("");
  const [method, setMethod] = useState("qpay");

  useEffect(() => {
    api.get(`/api/payments/${paymentId}`)
      .then(r => setPayment(r.data))
      .catch(() => navigate("/my-rentals"))
      .finally(() => setLoading(false));
  }, [paymentId, navigate]);

  const handleQPay = async () => {
    setPaying(true);
    try {
      const res = await api.post(`/api/payments/${paymentId}/qpay`);
      setQpayData(res.data);
      setShowQpay(true);
    } catch (err) {
      alert(err.response?.data?.message || "QPay үүсгэхэд алдаа гарлаа");
    } finally {
      setPaying(false);
    }
  };

  const handleCheckPayment = async () => {
    setChecking(true); setCheckMsg("");
    try {
      const res = await api.post(`/api/payments/${paymentId}/check`);
      if (res.data.paid || res.data.status === "paid") {
        setPayment(prev => ({ ...prev, status: "paid" }));
        setShowQpay(false);
        setCheckMsg("Төлбөр амжилттай баталгаажлаа!");
      } else {
        setCheckMsg("Төлбөр бүртгэгдээгүй байна. Дахин шалгана уу.");
      }
    } catch {
      setCheckMsg("Шалгахад алдаа гарлаа");
    } finally {
      setChecking(false);
    }
  };

  const statusColor = {
    pending: "var(--gold)",
    paid:    "#22C55E",
    overdue: "#EF4444",
    urgent:  "#F97316",
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--black)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Navbar />
      <div style={{ width: 24, height: 24, border: "1px solid var(--gold)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!payment) return null;

  const isPaid = payment.status === "paid";
  const img = payment.property?.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";

  return (
    <div style={{ minHeight: "100vh", background: "var(--black)", paddingTop: 70 }}>
      <Navbar />

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 48px" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div className="flex items-center gap-4 mb-4">
            <div style={{ width: 32, height: 1, background: "var(--gold)" }} />
            <span style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--gold)" }}>
              Төлбөр
            </span>
          </div>
          <h1 className="font-display" style={{ fontSize: 48, fontWeight: 300, color: "var(--white)" }}>
            {payment.paymentNumber}-р сар
          </h1>
        </div>

        {/* Property card */}
        <div style={{ background: "var(--dark)", border: "1px solid var(--border-dim)", overflow: "hidden", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 0 }}>
            <div style={{ width: 100, flexShrink: 0, overflow: "hidden" }}>
              <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.75)" }} />
            </div>
            <div style={{ flex: 1, padding: "16px 20px" }}>
              <p className="font-display line-clamp-1" style={{ fontSize: 18, fontWeight: 400, color: "var(--white)", marginBottom: 4 }}>
                {payment.property?.title}
              </p>
              <p style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                {payment.property?.location?.district}
              </p>
            </div>
          </div>
        </div>

        {/* Payment details */}
        <div style={{ background: "var(--dark)", border: "1px solid var(--border-dim)", marginBottom: 24 }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-dim)" }}>
            <span style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)" }}>
              Төлбөрийн дэлгэрэнгүй
            </span>
          </div>
          {[
            { label: "Сарын түрээс", value: `${payment.amount?.toLocaleString()}₮` },
            { label: "Нэмэлт хураамж", value: `${(payment.lateFee || 0).toLocaleString()}₮`, hide: !payment.lateFee },
            { label: "Нийт дүн", value: `${payment.totalAmount?.toLocaleString()}₮`, bold: true },
            { label: "Дуусах хугацаа", value: payment.dueDate ? new Date(payment.dueDate).toLocaleDateString("mn-MN") : "—" },
            { label: "Статус", value: payment.status?.toUpperCase(), color: statusColor[payment.status] },
          ].filter(r => !r.hide).map(({ label, value, bold, color }) => (
            <div key={label} className="flex justify-between" style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-dim)" }}>
              <span style={{ fontFamily: "'Montserrat'", fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
              <span style={{ fontFamily: bold ? "'Cormorant Garamond', serif" : "'Montserrat'", fontSize: bold ? 22 : 11, fontWeight: bold ? 300 : 500, color: color || "var(--white)" }}>{value}</span>
            </div>
          ))}
        </div>

        {isPaid ? (
          <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" fill="none" stroke="#22C55E" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: "'Montserrat'", fontSize: 12, fontWeight: 500, color: "#22C55E", marginBottom: 2 }}>Амжилттай төлөгдсөн</p>
              <p style={{ fontFamily: "'Montserrat'", fontSize: 10, color: "var(--text-muted)" }}>
                {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("mn-MN") : ""}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Method selection */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 12 }}>
                Төлбөрийн арга
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid var(--border-dim)" }}>
                {[
                  { v: "qpay",  l: "QPay", icon: "⚡" },
                  { v: "bank",  l: "Банкны шилжүүлэг", icon: "🏦" },
                ].map(({ v, l, icon }) => (
                  <button key={v} onClick={() => setMethod(v)}
                    style={{
                      padding: "14px 0", fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase",
                      background: method === v ? "rgba(201,160,80,0.1)" : "transparent",
                      color: method === v ? "var(--gold)" : "var(--text-muted)",
                      border: "none", cursor: "pointer", transition: "all 0.2s",
                      borderBottom: method === v ? "1px solid var(--gold)" : "1px solid transparent",
                    }}>
                    {icon}&nbsp; {l}
                  </button>
                ))}
              </div>
            </div>

            {method === "qpay" && (
              <button
                onClick={handleQPay}
                disabled={paying}
                className="btn-gold w-full justify-center"
                style={{ padding: "16px 0", opacity: paying ? 0.7 : 1 }}
              >
                {paying ? "QPay үүсгэж байна..." : `QPay-р ${payment.totalAmount?.toLocaleString()}₮ төлөх →`}
              </button>
            )}

            {method === "bank" && (
              <div style={{ background: "var(--dark)", border: "1px solid var(--border-dim)", padding: "20px 24px" }}>
                <div style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 16 }}>
                  Дансны мэдээлэл
                </div>
                {[
                  { label: "Банк", value: "Хаан банк" },
                  { label: "Данс №", value: "5080123456" },
                  { label: "Эзэмшигч", value: `${payment.landlord?.lastName?.[0] || ""}. ${payment.landlord?.firstName || ""}` },
                  { label: "Гүйлгээний утга", value: `Түрээс_${payment.paymentNumber}_${paymentId.slice(-6)}` },
                  { label: "Дүн", value: `${payment.totalAmount?.toLocaleString()}₮` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between" style={{ padding: "8px 0", borderBottom: "1px solid var(--border-dim)" }}>
                    <span style={{ fontFamily: "'Montserrat'", fontSize: 10, color: "var(--text-muted)" }}>{label}</span>
                    <span style={{ fontFamily: "'Montserrat'", fontSize: 10, fontWeight: 400, color: "var(--white)", letterSpacing: label === "Данс №" ? "0.1em" : 0 }}>{value}</span>
                  </div>
                ))}
                <p style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--text-soft)", marginTop: 12, lineHeight: 1.6 }}>
                  Шилжүүлэг хийсний дараа эзэмшигчтэй холбогдон баталгаажуулна уу.
                </p>
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 20 }}>
          <Link to="/my-rentals" className="btn-ghost" style={{ fontSize: 9 }}>
            ← Түрээс рүү буцах
          </Link>
        </div>
      </div>

      {/* QPay Modal */}
      {showQpay && qpayData && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowQpay(false); }}
        >
          <div style={{ width: "100%", maxWidth: 400, background: "var(--dark)", border: "1px solid var(--border)", borderTop: "1px solid var(--gold)" }}>
            <div style={{ padding: "28px 32px" }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div style={{ width: 20, height: 1, background: "var(--gold)" }} />
                    <span style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)" }}>QPay</span>
                  </div>
                  <h2 className="font-display" style={{ fontSize: 28, fontWeight: 300, color: "var(--white)" }}>QR Уншуулах</h2>
                </div>
                <button onClick={() => setShowQpay(false)} style={{ color: "var(--text-soft)", background: "none", border: "none", cursor: "pointer", fontSize: 22, lineHeight: 1 }}>×</button>
              </div>

              {/* QR */}
              {qpayData.qr_image && (
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ display: "inline-block", padding: 16, background: "white", border: "1px solid var(--border-dim)" }}>
                    <img src={`data:image/png;base64,${qpayData.qr_image}`} alt="QPay QR" style={{ width: 200, height: 200, display: "block" }} />
                  </div>
                </div>
              )}

              <div style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--text-muted)", textAlign: "center", marginBottom: 20, lineHeight: 1.7 }}>
                Банкны апп-аар уншуулж <span style={{ color: "var(--gold)", fontWeight: 500 }}>{payment.totalAmount?.toLocaleString()}₮</span> төлнө үү
              </div>

              {/* Bank app links */}
              {qpayData.urls && qpayData.urls.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
                  {qpayData.urls.slice(0, 6).map((u, i) => (
                    <a key={i} href={u.link} target="_blank" rel="noopener noreferrer"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "8px 4px", background: "var(--dark-2)", border: "1px solid var(--border-dim)",
                        textDecoration: "none", transition: "border-color 0.2s",
                        fontFamily: "'Montserrat'", fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)"
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(201,160,80,0.3)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-dim)"}
                    >
                      {u.name}
                    </a>
                  ))}
                </div>
              )}

              {checkMsg && (
                <div style={{ marginBottom: 16, padding: "10px 14px", borderLeft: `2px solid ${checkMsg.includes("амжилттай") ? "#22C55E" : "#EF4444"}`, background: checkMsg.includes("амжилттай") ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)" }}>
                  <p style={{ fontFamily: "'Montserrat'", fontSize: 11, color: checkMsg.includes("амжилттай") ? "#22C55E" : "#EF4444" }}>{checkMsg}</p>
                </div>
              )}

              <button
                onClick={handleCheckPayment}
                disabled={checking}
                className="btn-gold w-full justify-center"
                style={{ padding: "13px 0", opacity: checking ? 0.7 : 1 }}
              >
                {checking ? "Шалгаж байна..." : "Төлбөр шалгах"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}