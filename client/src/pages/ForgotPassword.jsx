import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance";

function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err) { setError(err.response?.data?.message || "Алдаа гарлаа. Дахин оролдоно уу."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--black)", padding: "48px 24px" }}>

      <div style={{ position: "fixed", top: 24, left: 24 }}>
        <Link to="/login" className="btn-ghost" style={{ padding: "8px 12px", textDecoration: "none" }}>← Буцах</Link>
      </div>

      <Link to="/" style={{ textDecoration: "none", marginBottom: 48 }}>
        <span className="font-display" style={{ fontSize: 24, fontWeight: 300, color: "var(--white)" }}>
          Rental<span style={{ color: "var(--gold)" }}>Sy</span>
        </span>
      </Link>

      <div style={{ width: "100%", maxWidth: 400, background: "var(--dark)", border: "1px solid var(--border-dim)", borderTop: "1px solid var(--gold)", padding: 48 }} className="animate-fadeUp">
        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 56, height: 56, border: "1px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="22" height="22" fill="none" stroke="var(--gold)" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div style={{ width: 20, height: 1, background: "var(--gold)" }} />
              <span style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--gold)" }}>Амжилттай</span>
              <div style={{ width: 20, height: 1, background: "var(--gold)" }} />
            </div>
            <h2 className="font-display" style={{ fontSize: 32, fontWeight: 300, color: "var(--white)", marginBottom: 14 }}>Имэйл илгээгдлээ</h2>
            <p style={{ fontFamily: "'Montserrat'", fontSize: 12, fontWeight: 300, lineHeight: 1.8, color: "var(--text-muted)", marginBottom: 8 }}>
              Нууц үг сэргээх холбоос <span style={{ color: "var(--white)" }}>{email}</span> рүү илгээгдлээ.
            </p>
            <p style={{ fontFamily: "'Montserrat'", fontSize: 10, color: "var(--text-soft)", marginBottom: 28 }}>⏰ Холбоос 1 цагийн дотор хүчинтэй</p>
            <Link to="/login" className="btn-gold justify-center w-full" style={{ padding: "14px 0" }}>
              Нэвтрэх хуудас руу буцах
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 20, height: 1, background: "var(--gold)" }} />
              <span style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--gold)" }}>Нууц үг сэргээх</span>
            </div>
            <h1 className="font-display" style={{ fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 10 }}>Нууц үг мартсан уу?</h1>
            <p style={{ fontFamily: "'Montserrat'", fontSize: 12, fontWeight: 300, color: "var(--text-muted)", marginBottom: 28, lineHeight: 1.7 }}>
              Бүртгэлтэй имэйл хаягаа оруулахад сэргээх холбоос илгээнэ
            </p>

            {error && (
              <div style={{ marginBottom: 20, padding: "10px 14px", borderLeft: "2px solid #EF4444", background: "rgba(239,68,68,0.06)" }}>
                <p style={{ fontFamily: "'Montserrat'", fontSize: 11, color: "#EF4444" }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="input-label">Имэйл хаяг</label>
                <input type="email" placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} className="luxury-input" required />
              </div>
              <button type="submit" disabled={loading} className="btn-gold justify-center" style={{ padding: "14px 0", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Илгээж байна..." : "Сэргээх холбоос илгээх"}
              </button>
            </form>

            <p style={{ textAlign: "center", fontFamily: "'Montserrat'", fontSize: 12, fontWeight: 300, color: "var(--text-muted)", marginTop: 24 }}>
              Нууц үгээ санасан уу?{" "}
              <Link to="/login" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 400 }}>Нэвтрэх</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;