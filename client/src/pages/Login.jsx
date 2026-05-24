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
    setLoading(true); setError("");
    try {
      const res = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/home");
    } catch { setError("Имэйл эсвэл нууц үг буруу байна"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--black)" }}>

      {/* LEFT VISUAL */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden"
        style={{ padding: "48px 64px" }}
      >
        {/* Background grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(201,160,80,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,160,80,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }} />

        {/* Glow */}
        <div className="absolute" style={{
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,160,80,0.08) 0%, transparent 70%)",
          bottom: "-10%", left: "-10%",
          pointerEvents: "none",
        }} />

        {/* Logo */}
        <Link to="/" className="relative flex items-center gap-4" style={{ textDecoration: "none" }}>
          <div className="relative" style={{ width: 32, height: 32 }}>
            <div className="absolute inset-0 rotate-45" style={{ border: "1px solid var(--gold)", opacity: 0.7 }} />
            <div className="absolute rotate-45" style={{ inset: "7px", background: "var(--gold)" }} />
          </div>
          <span className="font-display" style={{ fontSize: 22, fontWeight: 300, color: "var(--white)", letterSpacing: "0.04em" }}>
            Rental<span style={{ color: "var(--gold)" }}>Sy</span>
          </span>
        </Link>

        {/* Content */}
        <div className="relative">
          <div className="flex items-center gap-4 mb-6">
            <div style={{ width: 40, height: 1, background: "var(--gold)" }} />
            <span style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--gold)" }}>
              Тавтай морил
            </span>
          </div>
          <h2 className="font-display" style={{ fontSize: "clamp(48px,4vw,68px)", fontWeight: 300, color: "var(--white)", lineHeight: 1.1, marginBottom: 20 }}>
            Мөрөөдлийн<br />байраа<br />
            <em style={{ color: "var(--gold)", fontStyle: "italic" }}>эндээс олоорой</em>
          </h2>
          <p style={{ fontWeight: 300, fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.8, maxWidth: 300 }}>
            Улаанбаатар хотын орон сууц түрээсийн нэгдсэн систем
          </p>
        </div>

        {/* Stats */}
        <div className="relative flex gap-12">
          {[{ num: "500+", label: "Байр" }, { num: "9", label: "Дүүрэг" }, { num: "98%", label: "Ханамж" }].map(({ num, label }) => (
            <div key={label}>
              <div className="stat-number" style={{ fontSize: 32, marginBottom: 6 }}>{num}</div>
              <div style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT FORM */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{ padding: "48px 64px", background: "var(--dark)", borderLeft: "1px solid var(--border-dim)" }}
      >
        <div className="w-full animate-fadeUp" style={{ maxWidth: 380 }}>

          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-10" style={{ textDecoration: "none" }}>
            <div className="relative" style={{ width: 24, height: 24 }}>
              <div className="absolute inset-0 rotate-45" style={{ border: "1px solid var(--gold)", opacity: 0.7 }} />
              <div className="absolute rotate-45" style={{ inset: "5px", background: "var(--gold)" }} />
            </div>
            <span className="font-display" style={{ fontSize: 18, color: "var(--white)" }}>
              Rental<span style={{ color: "var(--gold)" }}>Sy</span>
            </span>
          </Link>

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 24, height: 1, background: "var(--gold)" }} />
              <span style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--gold)" }}>
                Нэвтрэх
              </span>
            </div>
            <h1 className="font-display" style={{ fontSize: 44, fontWeight: 300, color: "var(--white)" }}>
              Тавтай морил
            </h1>
          </div>

          {/* Alerts */}
          {idleLogout && (
            <div style={{ marginBottom: 24, padding: "12px 16px", borderLeft: "2px solid var(--gold)", background: "rgba(201,160,80,0.06)" }}>
              <p style={{ fontFamily: "'Montserrat'", fontSize: 11, color: "var(--text-muted)" }}>
                30 минут идэвхгүй байсан тул автоматаар гарлаа
              </p>
            </div>
          )}
          {error && (
            <div style={{ marginBottom: 24, padding: "12px 16px", borderLeft: "2px solid #EF4444", background: "rgba(239,68,68,0.06)" }}>
              <p style={{ fontFamily: "'Montserrat'", fontSize: 11, color: "#EF4444" }}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="input-label">Имэйл</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
                className="luxury-input"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="input-label" style={{ marginBottom: 0 }}>Нууц үг</label>
                <Link to="/forgot-password" style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.12em", color: "var(--gold)", textDecoration: "none" }}>
                  Мартсан?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="luxury-input"
                  style={{ paddingRight: 60 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.12em",
                    color: "var(--text-soft)", background: "none", border: "none", cursor: "pointer",
                    textTransform: "uppercase",
                  }}
                >
                  {showPw ? "Нуух" : "Харах"}
                </button>
              </div>
            </div>

            <div style={{ paddingTop: 8 }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full justify-center"
                style={{ padding: "16px 0", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Нэвтэрч байна...
                  </span>
                ) : "Нэвтрэх"}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="divider flex-1" />
            <span style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-soft)" }}>
              эсвэл
            </span>
            <div className="divider flex-1" />
          </div>

          {/* Sign up */}
          <p style={{ textAlign: "center", fontFamily: "'Montserrat'", fontSize: 12, fontWeight: 300, color: "var(--text-muted)" }}>
            Бүртгэл байхгүй юу?{" "}
            <Link to="/register" style={{ color: "var(--gold)", fontWeight: 400, textDecoration: "none" }}>
              Бүртгүүлэх
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;