import { useState, useMemo } from "react";
import api from "../api/axiosInstance";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("tenant");
  const [otpMethod, setOtpMethod] = useState("email");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ── Password strength ──
  const strength = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s; // 0-4
  }, [password]);

  const strengthLabel = ["Сул", "Сул", "Дунд", "Сайн", "Хүчтэй"][strength];
  const strengthColor = [
    "#3a3a3a",
    "#EF4444",
    "#F59E0B",
    "#C9A84C",
    "#10B981",
  ][strength];

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Нууц үг таарахгүй байна");
      return;
    }
    if (password.length < 8) {
      setError("Нууц үг хамгийн багадаа 8 тэмдэгттэй байх ёстой");
      return;
    }
    if (!/^\d{8}$/.test(phone)) {
      setError("Утасны дугаар 8 оронтой байх ёстой");
      return;
    }

    setLoading(true);
    try {
      const fullPhone = "+976" + phone;
      await api.post("/api/auth/register", {
        name,
        email,
        password,
        phone: fullPhone,
        role,
        otpMethod,
      });
      navigate("/verify-otp", {
        state: {
          email,
          phone: fullPhone,
          method: otpMethod,
          purpose: "register",
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Бүртгэл амжилтгүй боллоо"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "#FFFFFF", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── LEFT: Hero ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden"
        style={{ borderRight: "1px solid rgba(201,168,76,0.15)" }}
      >
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80"
            alt=""
            className="w-full h-full object-cover opacity-40"
            style={{ filter: "grayscale(40%)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.95) 100%)",
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

        <div className="relative p-12 z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 border border-[#C9A84C] rotate-45 transition-transform duration-500 group-hover:rotate-[55deg]" />
              <div className="absolute inset-2 bg-[#C9A84C] rotate-45" />
            </div>
            <span
              className="text-2xl font-light tracking-[0.2em] text-neutral-900"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              RENTAL<span style={{ color: "#C9A84C" }}>SY</span>
            </span>
          </Link>
        </div>

        <div className="relative px-12 z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px w-12" style={{ background: "#C9A84C" }} />
            <span
              className="text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "#C9A84C" }}
            >
              Become a member
            </span>
          </div>

          <h1
            className="font-light text-neutral-900 leading-[1.05] mb-8"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(48px, 5vw, 76px)",
            }}
          >
            Эрхэмлэн<br />
            <em style={{ color: "#C9A84C", fontStyle: "italic" }}>
              үнэлдэг
            </em><br />
            нийгэмлэг
          </h1>

          <p
            className="text-neutral-600 text-sm leading-relaxed font-light mb-10"
            style={{ maxWidth: 420 }}
          >
            Түрээслэгч ба байрны эзний хоорондын итгэлцэлд тулгуурласан
            нэгдсэн систем. Бүртгэл үүсгэснээр та цахим гэрээ,
            автомат төлбөр, найдвартай үйлчилгээний бүх давуу талыг
            эзэмшинэ.
          </p>

          <div
            className="flex items-center gap-4 pt-6"
            style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}
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
              Indra
            </div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-neutral-500">
              Founder · RentalSy
            </div>
          </div>
        </div>

        <div className="relative p-12 z-10">
          <div
            className="grid grid-cols-3 gap-8 pt-8"
            style={{ borderTop: "1px solid rgba(201,168,76,0.2)" }}
          >
            {[
              { num: "01", label: "Бүртгэл" },
              { num: "02", label: "Баталгаажуулах" },
              { num: "03", label: "Эхлэх" },
            ].map(({ num, label }) => (
              <div key={label}>
                <div
                  className="font-light mb-1"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 28,
                    color: "#C9A84C",
                  }}
                >
                  {num}
                </div>
                <div className="text-[10px] tracking-[0.25em] uppercase text-neutral-500">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form ── */}
      <div className="flex-1 flex items-center justify-center p-8 py-12 relative overflow-y-auto">
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
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-10">
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 border border-[#C9A84C] rotate-45" />
              <div className="absolute inset-1.5 bg-[#C9A84C] rotate-45" />
            </div>
            <span
              className="font-light tracking-[0.2em] text-neutral-900 text-lg"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              RENTAL<span style={{ color: "#C9A84C" }}>SY</span>
            </span>
          </Link>

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8" style={{ background: "#C9A84C" }} />
              <span
                className="text-[10px] tracking-[0.3em] uppercase"
                style={{ color: "#C9A84C" }}
              >
                Create Account
              </span>
            </div>
            <h2
              className="font-light text-neutral-900 leading-tight"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 48,
              }}
            >
              Шинэ<br />
              <em style={{ color: "#C9A84C", fontStyle: "italic" }}>
                бүртгэл
              </em>
            </h2>
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
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            {/* Role selector */}
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-neutral-500 mb-3">
                Та хэн бэ?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: "tenant", label: "Түрээслэгч" },
                  { v: "landlord", label: "Байрны эзэн" },
                ].map((r) => (
                  <button
                    key={r.v}
                    type="button"
                    onClick={() => setRole(r.v)}
                    className="py-3 text-xs tracking-[0.15em] uppercase transition-all duration-300"
                    style={{
                      background:
                        role === r.v
                          ? "rgba(201,168,76,0.12)"
                          : "transparent",
                      border:
                        role === r.v
                          ? "1px solid #C9A84C"
                          : "1px solid rgba(0,0,0,0.12)",
                      color: role === r.v ? "#C9A84C" : "rgba(0,0,0,0.55)",
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-neutral-500 mb-3">
                Овог нэр
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Бат-Эрдэнэ"
                required
                className="w-full bg-transparent text-neutral-900 text-sm py-3 outline-none transition-colors"
                style={{
                  borderBottom: "1px solid rgba(0,0,0,0.15)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderBottomColor = "#C9A84C")
                }
                onBlur={(e) =>
                  (e.target.style.borderBottomColor =
                    "rgba(0,0,0,0.15)")
                }
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-neutral-500 mb-3">
                Имэйл хаяг
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
                className="w-full bg-transparent text-neutral-900 text-sm py-3 outline-none transition-colors"
                style={{
                  borderBottom: "1px solid rgba(0,0,0,0.15)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderBottomColor = "#C9A84C")
                }
                onBlur={(e) =>
                  (e.target.style.borderBottomColor =
                    "rgba(0,0,0,0.15)")
                }
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-neutral-500 mb-3">
                Утасны дугаар
              </label>
              <div className="flex items-center gap-3">
                <span
                  className="text-sm text-neutral-600 py-3"
                  style={{
                    borderBottom: "1px solid rgba(0,0,0,0.15)",
                  }}
                >
                  +976
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                  placeholder="99112233"
                  required
                  className="flex-1 bg-transparent text-neutral-900 text-sm py-3 outline-none transition-colors"
                  style={{
                    borderBottom: "1px solid rgba(0,0,0,0.15)",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderBottomColor = "#C9A84C")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderBottomColor =
                      "rgba(0,0,0,0.15)")
                  }
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-neutral-500 mb-3">
                Нууц үг
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-transparent text-neutral-900 text-sm py-3 outline-none pr-16 transition-colors"
                  style={{
                    borderBottom: "1px solid rgba(0,0,0,0.15)",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderBottomColor = "#C9A84C")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderBottomColor =
                      "rgba(0,0,0,0.15)")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] tracking-widest uppercase text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  {showPw ? "Нуух" : "Харах"}
                </button>
              </div>

              {/* Strength meter */}
              {password && (
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
                              : "rgba(0,0,0,0.08)",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px] tracking-widest uppercase">
                    <span className="text-neutral-500">Хүч</span>
                    <span style={{ color: strengthColor }}>
                      {strengthLabel}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-neutral-500 mb-3">
                Нууц үг давтах
              </label>
              <input
                type={showPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-transparent text-neutral-900 text-sm py-3 outline-none transition-colors"
                style={{
                  borderBottom: "1px solid rgba(0,0,0,0.15)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderBottomColor = "#C9A84C")
                }
                onBlur={(e) =>
                  (e.target.style.borderBottomColor =
                    "rgba(0,0,0,0.15)")
                }
              />
            </div>

            {/* OTP Method */}
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-neutral-500 mb-3">
                Баталгаажуулах арга
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: "email", label: "Имэйл" },
                  { v: "phone", label: "Утас" },
                ].map((m) => (
                  <button
                    key={m.v}
                    type="button"
                    onClick={() => setOtpMethod(m.v)}
                    className="py-3 text-xs tracking-[0.15em] uppercase transition-all duration-300"
                    style={{
                      background:
                        otpMethod === m.v
                          ? "rgba(201,168,76,0.12)"
                          : "transparent",
                      border:
                        otpMethod === m.v
                          ? "1px solid #C9A84C"
                          : "1px solid rgba(0,0,0,0.12)",
                      color:
                        otpMethod === m.v
                          ? "#C9A84C"
                          : "rgba(0,0,0,0.55)",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 text-xs font-medium tracking-[0.25em] uppercase transition-all duration-300 group disabled:opacity-50"
                style={{
                  background: "#C9A84C",
                  color: "#0A0A0A",
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
                    Илгээж байна
                  </>
                ) : (
                  <>
                    Үргэлжлүүлэх
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 text-center">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="flex-1 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(201,168,76,0.3))",
                }}
              />
              <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400">
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
            <p className="text-xs text-neutral-500 tracking-wide">
              Бүртгэлтэй юу?
              <Link
                to="/login"
                className="font-medium tracking-wider transition-colors hover:underline ml-2"
                style={{ color: "#C9A84C" }}
              >
                Нэвтрэх
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;