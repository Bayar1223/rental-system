import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api/axiosInstance";

function VerifyOtp() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = location.state?.email || "";

  const [otp, setOtp]             = useState(["", "", "", "", "", ""]);
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]         = useState("");
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => { if (!email) navigate("/register"); }, [email, navigate]);

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
      const res = await api.post("/api/auth/verify-otp", { email, code });
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
      await api.post("/api/auth/resend-otp", { email, purpose: "register" });
      setCountdown(60); setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) { setError(err.response?.data?.message || "Дахин явуулахад алдаа гарлаа"); }
    finally { setResending(false); }
  };

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
              <svg width="24" height="24" fill="none" stroke="var(--gold)" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-light mb-1" style={{ color: "var(--ink)" }}>Имэйл баталгаажуулах</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              <span className="font-medium" style={{ color: "var(--ink)" }}>{email}</span> рүү 6 оронтой код илгээгдлээ
            </p>
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
                  className="w-11 h-13 text-center text-xl font-medium border-2 transition-all outline-none"
                  style={{
                    height: 52,
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

          <p className="text-center text-xs mt-3" style={{ color: "var(--text-soft)" }}>Спам хавтасаа шалгана уу</p>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;