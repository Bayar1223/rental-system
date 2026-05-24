import { useState, useRef, useEffect } from "react";
import api from "../api/axiosInstance";
import { useNavigate, useLocation, Link } from "react-router-dom";

function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, phone, method: initialMethod, purpose } =
    location.state || {};
  const [method, setMethod] = useState(initialMethod || "email");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  // ── Redirect if no state ──
  useEffect(() => {
    if (!email && !phone) navigate("/register");
  }, [email, phone, navigate]);

  // ── Resend countdown ──
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!data) return;
    const next = ["", "", "", "", "", ""];
    data.split("").forEach((d, i) => (next[i] = d));
    setOtp(next);
    inputRefs.current[Math.min(data.length, 5)]?.focus();
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("6 оронтой код оруулна уу");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/verify-otp", {
        email,
        phone,
        method,
        otpCode: code,
        purpose,
      });
      setSuccess("Амжилттай баталгаажлаа");
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setTimeout(() => navigate("/home"), 700);
      } else {
        setTimeout(() => navigate("/login"), 700);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Код буруу байна");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/api/auth/resend-otp", { email, phone, method, purpose });
      setSuccess("Код дахин илгээгдлээ");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Дахин илгээж чадсангүй");
    } finally {
      setResending(false);
    }
  };

  const switchMethod = async (newMethod) => {
    if (newMethod === method) return;
    setMethod(newMethod);
    setResending(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/api/auth/resend-otp", {
        email,
        phone,
        method: newMethod,
        purpose,
      });
      setSuccess(
        newMethod === "email" ? "Имэйл рүү код илгээлээ" : "Утас руу код илгээлээ"
      );
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Дахин илгээж чадсангүй");
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.+)$/, (_, a, b, c) => a + "•".repeat(b.length) + c)
    : "";
  const maskedPhone = phone ? phone.slice(0, 4) + "••••" + phone.slice(-2) : "";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative"
      style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}
    >
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #C9A84C 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,168,76,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.025) 1px, transparent 1px)",
          backgroundSize: "100px 100px",
        }}
      />

      <div className="w-full max-w-md relative animate-fadeUp">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center justify-center gap-3 mb-14 group"
        >
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border border-[#C9A84C] rotate-45 transition-transform duration-500 group-hover:rotate-[55deg]" />
            <div className="absolute inset-1.5 bg-[#C9A84C] rotate-45" />
          </div>
          <span
            className="text-xl font-light tracking-[0.2em] text-white"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            RENTAL<span style={{ color: "#C9A84C" }}>SY</span>
          </span>
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-8" style={{ background: "#C9A84C" }} />
            <span
              className="text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "#C9A84C" }}
            >
              Verification
            </span>
            <div className="h-px w-8" style={{ background: "#C9A84C" }} />
          </div>
          <h2
            className="font-light text-white leading-tight mb-6"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 48,
            }}
          >
            Кодыг<br />
            <em style={{ color: "#C9A84C", fontStyle: "italic" }}>
              баталгаажуулах
            </em>
          </h2>
          <p className="text-sm text-white/50 leading-relaxed">
            {method === "email"
              ? "Бид таны имэйл рүү 6 оронтой код илгээсэн"
              : "Бид таны утас руу 6 оронтой код илгээсэн"}
          </p>
          <p
            className="text-sm mt-2 tracking-wide"
            style={{ color: "#C9A84C" }}
          >
            {method === "email" ? maskedEmail : maskedPhone}
          </p>
        </div>

        {/* Banners */}
        {error && (
          <div
            className="mb-6 p-4 flex items-start gap-3"
            style={{
              background: "rgba(239,68,68,0.08)",
              borderLeft: "2px solid #EF4444",
            }}
          >
            <span style={{ color: "#EF4444" }}>✕</span>
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}
        {success && (
          <div
            className="mb-6 p-4 flex items-start gap-3"
            style={{
              background: "rgba(16,185,129,0.08)",
              borderLeft: "2px solid #10B981",
            }}
          >
            <span style={{ color: "#10B981" }}>✓</span>
            <p className="text-xs text-emerald-300">{success}</p>
          </div>
        )}

        {/* OTP form */}
        <form onSubmit={handleVerify}>
          <div
            className="flex gap-3 justify-between mb-10"
            onPaste={handlePaste}
          >
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 text-center text-2xl text-white bg-transparent outline-none transition-all duration-300"
                style={{
                  border: digit
                    ? "1px solid #C9A84C"
                    : "1px solid rgba(255,255,255,0.15)",
                  fontFamily: "'Cormorant Garamond', serif",
                  background: digit
                    ? "rgba(201,168,76,0.06)"
                    : "transparent",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "#C9A84C")
                }
                onBlur={(e) =>
                  !digit &&
                  (e.target.style.borderColor =
                    "rgba(255,255,255,0.15)")
                }
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className="w-full flex items-center justify-center gap-3 py-4 text-xs font-medium tracking-[0.25em] uppercase transition-all duration-300 group disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "#C9A84C",
              color: "#0A0A0A",
            }}
            onMouseEnter={(e) =>
              !loading &&
              otp.join("").length === 6 &&
              (e.currentTarget.style.background = "#E8D49E")
            }
            onMouseLeave={(e) =>
              !loading &&
              otp.join("").length === 6 &&
              (e.currentTarget.style.background = "#C9A84C")
            }
          >
            {loading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Шалгаж байна
              </>
            ) : (
              <>
                Баталгаажуулах
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </>
            )}
          </button>
        </form>

        {/* Resend + Switch */}
        <div className="mt-10 text-center space-y-4">
          {countdown > 0 ? (
            <p className="text-xs text-white/40 tracking-wide">
              Дахин илгээх боломжтой:{" "}
              <span style={{ color: "#C9A84C" }}>{countdown}с</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-xs tracking-[0.2em] uppercase transition-colors hover:underline disabled:opacity-40"
              style={{ color: "#C9A84C" }}
            >
              {resending ? "Илгээж байна..." : "Кодыг дахин илгээх"}
            </button>
          )}

          {(email && phone) && (
            <div className="pt-4">
              <button
                type="button"
                onClick={() =>
                  switchMethod(method === "email" ? "phone" : "email")
                }
                disabled={resending}
                className="text-[10px] tracking-[0.25em] uppercase text-white/40 hover:text-white transition-colors"
              >
                {method === "email"
                  ? "Утсаар авах →"
                  : "Имэйлээр авах →"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Link
            to="/login"
            className="text-[10px] tracking-[0.25em] uppercase text-white/40 hover:text-white transition-colors"
          >
            ← Нэвтрэх хуудас руу
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;