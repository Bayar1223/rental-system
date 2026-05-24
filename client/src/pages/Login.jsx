import { useState } from "react";
import api from "../api/axiosInstance";
import { useNavigate, Link, useLocation } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const idleLogout = location.state?.reason === "idle";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/home");
    } catch {
      setError("Имэйл эсвэл нууц үг буруу байна");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── LEFT: Hero panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden"
        style={{ borderRight: "1px solid rgba(201,168,76,0.15)" }}
      >
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=80"
            alt=""
            className="w-full h-full object-cover opacity-40"
            style={{ filter: "grayscale(40%)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.65) 50%, rgba(10,10,10,0.92) 100%)",
            }}
          />
        </div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* TOP: Logo */}
        <div className="relative p-12 z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 border border-[#C9A84C] rotate-45 transition-transform duration-500 group-hover:rotate-[55deg]" />
              <div className="absolute inset-2 bg-[#C9A84C] rotate-45" />
            </div>
            <span
              className="text-2xl font-light tracking-[0.2em] text-white"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              RENTAL<span style={{ color: "#C9A84C" }}>SY</span>
            </span>
          </Link>
        </div>

        {/* CENTER: Hero text */}
        <div className="relative px-12 z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px w-12" style={{ background: "#C9A84C" }} />
            <span
              className="text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "#C9A84C" }}
            >
              Улаанбаатарын зүрхэнд
            </span>
          </div>

          <h1
            className="font-light text-white leading-[1.05] mb-8"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(48px, 5vw, 76px)",
            }}
          >
            Шилмэл байрны<br />
            <em style={{ color: "#C9A84C", fontStyle: "italic" }}>
              түрээсийн
            </em><br />
            систем
          </h1>

          <p
            className="text-white/50 text-sm leading-relaxed font-light mb-10"
            style={{ maxWidth: 420 }}
          >
            Улаанбаатар хотын 9 дүүрэг даяар хувийн үйлчилгээг 24/7
            хүргэнэ. Таны сонгосон орон сууц нь танд хамгийн сайхан
            үргэлжлэх амьдралыг авчирна.
          </p>

          {/* Signature */}
          <div
            className="flex items-center gap-4 pt-6"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: 26,
                color: "#C9A84C",
                letterSpacing: "0.02em",
              }}
            >
              
            </div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-white/40">
              Founder · RentalSy
            </div>
          </div>
        </div>

        {/* BOTTOM: Stats */}
        <div className="relative p-12 z-10">
          <div
            className="flex items-end justify-between gap-8 pt-8"
            style={{ borderTop: "1px solid rgba(201,168,76,0.2)" }}
          >
            {[
              { num: "500+", label: "Residences" },
              { num: "09", label: "Districts" },
              { num: "24/7", label: "Service" },
            ].map(({ num, label }) => (
              <div key={label}>
                <div
                  className="font-light mb-1"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 32,
                    color: "#C9A84C",
                  }}
                >
                  {num}
                </div>
                <div className="text-[10px] tracking-[0.25em] uppercase text-white/40">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form ── */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #C9A84C 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        <div className="w-full max-w-sm relative animate-fadeUp">
          {/* Mobile logo */}
          <Link
            to="/"
            className="lg:hidden flex items-center gap-3 mb-12"
          >
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 border border-[#C9A84C] rotate-45" />
              <div className="absolute inset-1.5 bg-[#C9A84C] rotate-45" />
            </div>
            <span
              className="font-light tracking-[0.2em] text-white text-lg"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              RENTAL<span style={{ color: "#C9A84C" }}>SY</span>
            </span>
          </Link>

          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8" style={{ background: "#C9A84C" }} />
              <span
                className="text-[10px] tracking-[0.3em] uppercase"
                style={{ color: "#C9A84C" }}
              >
                Sign In
              </span>
            </div>
            <h2
              className="font-light text-white leading-tight"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 52,
              }}
            >
              Тавтай<br />
              <em style={{ color: "#C9A84C", fontStyle: "italic" }}>
                морил
              </em>
            </h2>
          </div>

          {idleLogout && (
            <div
              className="mb-6 p-4 flex items-start gap-3"
              style={{
                background: "rgba(201,168,76,0.08)",
                borderLeft: "2px solid #C9A84C",
              }}
            >
              <span style={{ color: "#C9A84C" }}>◇</span>
              <p className="text-xs text-white/60 leading-relaxed">
                30 минут идэвхгүй байсан тул автоматаар гарлаа
              </p>
            </div>
          )}

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

          <form onSubmit={handleLogin} className="space-y-7">
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
                className="w-full bg-transparent text-white text-sm py-3 outline-none transition-colors"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.15)",
                  fontFamily: "'DM Sans', sans-serif",
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

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] tracking-[0.3em] uppercase text-white/40">
                  Нууц үг
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[10px] tracking-wider uppercase transition-colors hover:underline"
                  style={{ color: "#C9A84C" }}
                >
                  Мартсан уу?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-transparent text-white text-sm py-3 outline-none pr-16 transition-colors"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.15)",
                    fontFamily: "'DM Sans', sans-serif",
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
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 text-xs font-medium tracking-[0.25em] uppercase transition-all duration-300 group disabled:opacity-50"
                style={{
                  background: "#C9A84C",
                  color: "#0A0A0A",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={(e) =>
                  !loading && (e.currentTarget.style.background = "#E8D49E")
                }
                onMouseLeave={(e) =>
                  !loading && (e.currentTarget.style.background = "#C9A84C")
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
                    Нэвтэрч байна
                  </>
                ) : (
                  <>
                    Нэвтрэх
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-12 text-center">
            <div className="flex items-center gap-4 mb-8">
              <div
                className="flex-1 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(201,168,76,0.3))",
                }}
              />
              <span className="text-[10px] tracking-[0.3em] uppercase text-white/30">
                or
              </span>
              <div
                className="flex-1 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(201,168,76,0.3), transparent)",
                }}
              />
            </div>
            <p className="text-xs text-white/40 tracking-wide">
              Бүртгэлгүй юу?
              <Link
                to="/register"
                className="font-medium tracking-wider transition-colors hover:underline ml-2"
                style={{ color: "#C9A84C" }}
              >
                Бүртгүүлэх
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;