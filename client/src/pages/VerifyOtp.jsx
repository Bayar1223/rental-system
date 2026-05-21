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
      const res = await api.post("/api/auth/verify-otp", {
        email, phone, code, otpMethod,
      });
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

  // Арга солих — шинэ OTP явуулна
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
    <div className="min-h-screen flex flex-col" style={{ background: "var(--cream)" }}>
      <div className="px-4 pt-4">
        <button onClick={() => navigate("/register")}
          className="flex items-center gap-2 text-sm transition-colors" style={{ color: "var(--text-muted)" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Буцах
        </button>
      </div>

      <div className="flex justify-center mt-8 mb-4">
        <Link to="/">
          <span className="font-display text-2xl font-light" style={{ color: "var(--ink)" }}>
            Rental<span style={{ color: "var(--gold)" }}>Sy</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white border w-full max-w-sm p-8" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-full"
              style={{ background: "var(--cream)", border: "1px solid var(--gold-light)" }}>
              {otpMethod === "phone" ? (
                <svg width="24" height="24" fill="none" stroke="var(--gold)" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              ) : (
                <svg width="24" height="24" fill="none" stroke="var(--gold)" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <h1 className="font-display text-2xl font-light mb-1" style={{ color: "var(--ink)" }}>
              {otpMethod === "phone" ? "Утас баталгаажуулах" : "Имэйл баталгаажуулах"}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              <span className="font-medium" style={{ color: "var(--ink)" }}>{target}</span> рүү<br />
              6 оронтой код илгээгдлээ
            </p>
          </div>

          {/* Арга солих */}
          <div className="grid grid-cols-2 gap-0 mb-5 border border-black/10">
            {[{ v: "email", l: "✉️ Имэйл" }, { v: "phone", l: "📱 Утас" }].map(({ v, l }) => (
              <button key={v} type="button" onClick={() => switchMethod(v)}
                className="py-2.5 text-xs font-medium tracking-widest uppercase transition-all"
                style={{
                  background: otpMethod === v ? "var(--ink)" : "transparent",
                  color: otpMethod === v ? "var(--gold)" : "var(--text-muted)",
                }}>
                {l}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 border-l-2 text-sm text-center" style={{ borderColor: "#EF4444", background: "#FEF2F2", color: "#EF4444" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleVerify}>
            <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input key={index} ref={(el) => (inputRefs.current[index] = el)}
                  type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="text-center text-xl font-medium border-2 transition-all outline-none"
                  style={{
                    width: 44, height: 52,
                    borderColor: digit ? "var(--gold)" : "var(--border-subtle)",
                    background: digit ? "var(--cream)" : "white",
                    color: "var(--ink)",
                    boxShadow: digit ? "0 0 0 2px var(--gold-light)" : "none",
                  }} />
              ))}
            </div>
            <button type="submit" disabled={loading || otp.join("").length < 6}
              className="btn-gold w-full justify-center mb-4" style={{ padding: "14px 0" }}>
              {loading ? "Баталгаажуулж байна..." : "Баталгаажуулах"}
            </button>
          </form>

          <div className="text-center text-sm" style={{ color: "var(--text-soft)" }}>
            Код ирээгүй юу?{" "}
            {countdown > 0 ? (
              <span>{countdown}с дараа дахин явуулна</span>
            ) : (
              <button onClick={handleResend} disabled={resending}
                className="font-medium transition-colors" style={{ color: "var(--gold)" }}>
                {resending ? "Явуулж байна..." : "Дахин явуулах"}
              </button>
            )}
          </div>

          <p className="text-center text-xs mt-3" style={{ color: "var(--text-soft)" }}>
            {otpMethod === "phone" ? "Spam дохиогоо шалгана уу" : "Spam хавтасаа шалгана уу"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;