import { useState } from "react";
import api from "../api/axiosInstance";
import { useNavigate, Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/api/password-reset/request", { email });
      setSent(true);
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Хүсэлт илгээж чадсангүй. Имэйлээ шалгана уу."
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
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-8" style={{ background: "#C9A84C" }} />
            <span
              className="text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "#C9A84C" }}
            >
              Password Recovery
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
            Нууц үгээ<br />
            <em style={{ color: "#C9A84C", fontStyle: "italic" }}>
              мартсан уу
            </em>
            ?
          </h2>
          <p className="text-sm text-white/50 leading-relaxed max-w-xs mx-auto">
            Бүртгэлтэй имэйл хаягаа оруулна уу. Бид сэргээх кодыг таны
            имэйл рүү илгээх болно.
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
        {sent && (
          <div
            className="mb-6 p-4 flex items-start gap-3"
            style={{
              background: "rgba(16,185,129,0.08)",
              borderLeft: "2px solid #10B981",
            }}
          >
            <span style={{ color: "#10B981" }}>✓</span>
            <p className="text-xs text-emerald-300">
              Сэргээх код таны имэйл рүү илгээгдлээ
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3">
              Имэйл хаяг
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              required
              disabled={sent}
              className="w-full bg-transparent text-white text-sm py-3 outline-none transition-colors disabled:opacity-50"
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

          <button
            type="submit"
            disabled={loading || sent}
            className="w-full flex items-center justify-center gap-3 py-4 text-xs font-medium tracking-[0.25em] uppercase transition-all duration-300 group disabled:opacity-50"
            style={{
              background: "#C9A84C",
              color: "#0A0A0A",
            }}
            onMouseEnter={(e) =>
              !loading &&
              !sent &&
              (e.currentTarget.style.background = "#E8D49E")
            }
            onMouseLeave={(e) =>
              !loading &&
              !sent &&
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
                Илгээж байна
              </>
            ) : sent ? (
              <>Илгээгдлээ</>
            ) : (
              <>
                Сэргээх код илгээх
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </>
            )}
          </button>
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

export default ForgotPassword;