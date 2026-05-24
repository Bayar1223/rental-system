import { useState, useMemo, useEffect, useRef } from "react";
import api from "../api/axiosInstance";
import { useNavigate, useLocation, Link } from "react-router-dom";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.email || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!initialEmail) inputRefs.current[0]?.focus();
  }, [initialEmail]);

  // ── Password strength ──
  const strength = useMemo(() => {
    let s = 0;
    if (newPassword.length >= 8) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s;
  }, [newPassword]);

  const strengthLabel = ["Сул", "Сул", "Дунд", "Сайн", "Хүчтэй"][strength];
  const strengthColor = [
    "#3a3a3a",
    "#EF4444",
    "#F59E0B",
    "#C9A84C",
    "#10B981",
  ][strength];

  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!data) return;
    const next = ["", "", "", "", "", ""];
    data.split("").forEach((d, i) => (next[i] = d));
    setOtp(next);
    inputRefs.current[Math.min(data.length, 5)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (otp.join("").length !== 6) {
      setError("6 оронтой код оруулна уу");
      return;
    }
    if (newPassword.length < 8) {
      setError("Нууц үг хамгийн багадаа 8 тэмдэгттэй байх ёстой");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Нууц үг таарахгүй байна");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/password-reset/reset", {
        email,
        otp: otp.join(""),
        newPassword,
      });
      setDone(true);
      setTimeout(() => navigate("/login"), 1400);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Сэргээх амжилтгүй боллоо. Кодоо шалгана уу."
      );
    } finally {
      setLoading(false);
    }
  };

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

      <div className="w-full max-w-md relative animate-fadeUp py-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center justify-center gap-3 mb-12 group"
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
              Reset Password
            </span>
            <div className="h-px w-8" style={{ background: "#C9A84C" }} />
          </div>
          <h2
            className="font-light text-white leading-tight mb-6"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 44,
            }}
          >
            Шинэ<br />
            <em style={{ color: "#C9A84C", fontStyle: "italic" }}>
              нууц үг
            </em>
          </h2>
          <p className="text-sm text-white/50 leading-relaxed max-w-xs mx-auto">
            Имэйл рүү ирсэн 6 оронтой кодыг оруулж, шинэ нууц үгээ
            тохируулна уу.
          </p>
        </div>

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
        {done && (
          <div
            className="mb-6 p-4 flex items-start gap-3"
            style={{
              background: "rgba(16,185,129,0.08)",
              borderLeft: "2px solid #10B981",
            }}
          >
            <span style={{ color: "#10B981" }}>✓</span>
            <p className="text-xs text-emerald-300">
              Нууц үг амжилттай шинэчлэгдлээ. Нэвтрэх хуудас руу
              шилжүүлж байна...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Email (editable if missing) */}
          {!initialEmail && (
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3">
                Имэйл хаяг
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent text-white text-sm py-3 outline-none transition-colors"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.15)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderBottomColor = "#C9A84C")
                }
                onBlur={(e) =>
                  (e.target.style.borderBottomColor =
                    "rgba(255,255,255,0.15)")
                }
              />
            </div>
          )}

          {/* OTP */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-white/40 mb-4 text-center">
              Сэргээх код
            </label>
            <div
              className="flex gap-2 justify-between"
              onPaste={handleOtpPaste}
            >
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-11 h-13 text-center text-xl text-white bg-transparent outline-none transition-all duration-300"
                  style={{
                    border: digit
                      ? "1px solid #C9A84C"
                      : "1px solid rgba(255,255,255,0.15)",
                    fontFamily: "'Cormorant Garamond', serif",
                    background: digit ? "rgba(201,168,76,0.06)" : "transparent",
                    height: 52,
                  }}
                />
              ))}
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3">
              Шинэ нууц үг
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-transparent text-white text-sm py-3 outline-none pr-16 transition-colors"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.15)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderBottomColor = "#C9A84C")
                }
                onBlur={(e) =>
                  (e.target.style.borderBottomColor =
                    "rgba(255,255,255,0.15)")
                }
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] tracking-widest uppercase text-white/40 hover:text-white transition-colors"
              >
                {showPw ? "Нуух" : "Харах"}
              </button>
            </div>

            {newPassword && (
              <div className="mt-3">
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex-1 h-[2px] transition-colors duration-300"
                      style={{
                        background:
                          i <= strength
                            ? strengthColor
                            : "rgba(255,255,255,0.08)",
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] tracking-widest uppercase">
                  <span className="text-white/40">Хүч</span>
                  <span style={{ color: strengthColor }}>
                    {strengthLabel}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3">
              Нууц үг давтах
            </label>
            <input
              type={showPw ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-transparent text-white text-sm py-3 outline-none transition-colors"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.15)",
              }}
              onFocus={(e) =>
                (e.target.style.borderBottomColor = "#C9A84C")
              }
              onBlur={(e) =>
                (e.target.style.borderBottomColor =
                  "rgba(255,255,255,0.15)")
              }
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || done}
              className="w-full flex items-center justify-center gap-3 py-4 text-xs font-medium tracking-[0.25em] uppercase transition-all duration-300 group disabled:opacity-50"
              style={{
                background: "#C9A84C",
                color: "#0A0A0A",
              }}
              onMouseEnter={(e) =>
                !loading &&
                !done &&
                (e.currentTarget.style.background = "#E8D49E")
              }
              onMouseLeave={(e) =>
                !loading &&
                !done &&
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
                  Шинэчилж байна
                </>
              ) : done ? (
                <>Амжилттай</>
              ) : (
                <>
                  Нууц үг шинэчлэх
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

        <div
          className="mt-12 pt-8 text-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
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

export default ResetPassword;