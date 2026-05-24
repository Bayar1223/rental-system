import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api/axiosInstance";

function VerifyOtp() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = location.state?.email || "";
  const phone     = location.state?.phone || "";
  const initMethod = location.state?.otpMethod || "email";

  const [otpMethod, setOtpMethod] = useState(initMethod);
  const [otp, setOtp]             = useState(["", "", "", "", "", ""]);
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]         = useState("");
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => { if (!email && !phone) navigate("/register"); }, [email, phone, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value; setOtp(newOtp); setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("6 оронтой кодыг бүрэн оруулна уу"); return; }
    setLoading(true); setError("");
    try {
      const res = await api.post("/api/auth/verify-otp", { email, phone, code, otpMethod });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "OTP код буруу байна");
      setOtp(["", "", "", "", "", ""]); inputRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true); setError("");
    try {
      await api.post("/api/auth/resend-otp", { email, phone, purpose: "register", otpMethod });
      setCountdown(60); setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) { setError(err.response?.data?.message || "Дахин явуулахад алдаа гарлаа"); }
    finally { setResending(false); }
  };

  const switchMethod = async (method) => {
    if (method === otpMethod) return;
    setOtpMethod(method); setOtp(["", "", "", "", "", ""]); setError("");
    try {
      await api.post("/api/auth/resend-otp", { email, phone, purpose: "register", otpMethod: method });
      setCountdown(60);
    } catch (err) { setError(err.response?.data?.message || "Алдаа гарлаа"); }
  };

  const target = otpMethod === "phone" ? `+976${phone}` : email;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--black)", padding: "48px 24px" }}>

      {/* Back */}
      <div style={{ position: "fixed", top: 24, left: 24 }}>
        <button onClick={() => navigate("/register")} className="btn-ghost" style={{ padding: "8px 12px" }}>
          ← Буцах
        </button>
      </div>

      {/* Logo */}
      <Link to="/" style={{ textDecoration: "none", marginBottom: 48 }}>
        <span className="font-display" style={{ fontSize: 24, fontWeight: 300, color: "var(--white)" }}>
          Rental<span style={{ color: "var(--gold)" }}>Sy</span>
        </span>
      </Link>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--dark)",
          border: "1px solid var(--border-dim)",
          borderTop: "1px solid var(--gold)",
          padding: 48,
        }}
        className="animate-fadeUp"
      >
        {/* Icon */}
        <div style={{ width: 56, height: 56, border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          {otpMethod === "phone" ? (
            <svg width="22" height="22" fill="none" stroke="var(--gold)" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          ) : (
            <svg width="22" height="22" fill="none" stroke="var(--gold)" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )}
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-3">
          <div style={{ width: 20, height: 1, background: "var(--gold)" }} />
          <span style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--gold)" }}>
            Баталгаажуулах
          </span>
        </div>
        <h1 className="font-display" style={{ fontSize: 32, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>
          {otpMethod === "phone" ? "Утас" : "Имэйл"} баталгаажуулах
        </h1>
        <p style={{ fontFamily: "'Montserrat'", fontSize: 11, fontWeight: 300, color: "var(--text-muted)", marginBottom: 28, lineHeight: 1.6 }}>
          <span style={{ color: "var(--white)" }}>{target}</span> рүү 6 оронтой код илгээгдлээ
        </p>

        {/* Method switcher */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid var(--border-dim)", marginBottom: 24 }}>
          {[{ v: "email", l: "✉️  Имэйл" }, { v: "phone", l: "📱  Утас" }].map(({ v, l }) => (
            <button key={v} type="button" onClick={() => switchMethod(v)}
              style={{
                padding: "10px 0",
                fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase",
                background: otpMethod === v ? "rgba(201,160,80,0.1)" : "transparent",
                color: otpMethod === v ? "var(--gold)" : "var(--text-muted)",
                border: "none", cursor: "pointer", transition: "all 0.2s",
                borderBottom: otpMethod === v ? "1px solid var(--gold)" : "1px solid transparent",
              }}>
              {l}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 20, padding: "10px 14px", borderLeft: "2px solid #EF4444", background: "rgba(239,68,68,0.06)" }}>
            <p style={{ fontFamily: "'Montserrat'", fontSize: 11, color: "#EF4444" }}>{error}</p>
          </div>
        )}

        {/* OTP inputs */}
        <form onSubmit={handleVerify}>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28 }} onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                style={{
                  width: 48, height: 56,
                  textAlign: "center",
                  fontSize: 22,
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 400,
                  background: digit ? "rgba(201,160,80,0.06)" : "var(--dark-2)",
                  border: digit ? "1px solid var(--gold)" : "1px solid var(--border-dim)",
                  color: "var(--white)",
                  outline: "none",
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.join("").length < 6}
            className="btn-gold w-full justify-center"
            style={{ padding: "15px 0", opacity: (loading || otp.join("").length < 6) ? 0.6 : 1, marginBottom: 20 }}
          >
            {loading ? "Баталгаажуулж байна..." : "Баталгаажуулах"}
          </button>
        </form>

        {/* Resend */}
        <p style={{ textAlign: "center", fontFamily: "'Montserrat'", fontSize: 11, color: "var(--text-muted)" }}>
          Код ирээгүй юу?{" "}
          {countdown > 0 ? (
            <span style={{ color: "var(--text-soft)" }}>{countdown}с дараа дахин</span>
          ) : (
            <button onClick={handleResend} disabled={resending}
              style={{ color: "var(--gold)", background: "none", border: "none", cursor: "pointer", fontFamily: "'Montserrat'", fontSize: 11 }}>
              {resending ? "Явуулж байна..." : "Дахин явуулах"}
            </button>
          )}
        </p>

        <p style={{ textAlign: "center", fontFamily: "'Montserrat'", fontSize: 9, color: "var(--text-soft)", marginTop: 8 }}>
          {otpMethod === "phone" ? "Spam дохиогоо шалгана уу" : "Spam хавтасаа шалгана уу"}
        </p>
      </div>
    </div>
  );
}

export default VerifyOtp;