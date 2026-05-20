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
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--ink)" }}>

      {/* Left: Visual */}
      <div className="hidden lg:flex flex-col justify-between p-16 w-1/2 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        <div className="absolute" style={{
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)",
          top: "20%", left: "-10%"
        }} />
        <Link to="/" className="relative flex items-center gap-3">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border border-[var(--gold)] rotate-45" />
            <div className="absolute inset-1.5 bg-[var(--gold)] rotate-45" />
          </div>
          <span className="font-display text-2xl font-light text-white">
            Rental<span style={{ color: "var(--gold)" }}>Sy</span>
          </span>
        </Link>

        <div className="relative">
          <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-4">Тавтай морил</p>
          <h2 className="font-display text-5xl font-light text-white leading-tight mb-6">
            Мөрөөдлийн<br />байраа<br />
            <span style={{ color: "var(--gold)", fontStyle: "italic" }}>эндээс олоорой</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed" style={{ maxWidth: 320 }}>
            Улаанбаатар хотын орон сууц түрээсийн нэгдсэн систем
          </p>
        </div>

        <div className="relative flex gap-8">
          {[{ num: "500+", label: "Байр" }, { num: "9", label: "Дүүрэг" }, { num: "98%", label: "Ханамж" }].map(({ num, label }) => (
            <div key={label}>
              <div className="stat-number text-3xl font-light mb-1">{num}</div>
              <div className="text-white/40 text-xs tracking-wide">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: "var(--cream)" }}>
        <div className="w-full max-w-sm animate-fadeUp">

          <div className="mb-10">
            <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 border border-[var(--gold)] rotate-45" />
                <div className="absolute inset-1.5 bg-[var(--gold)] rotate-45" />
              </div>
              <span className="font-display text-xl font-light text-[var(--ink)]">
                Rental<span style={{ color: "var(--gold)" }}>Sy</span>
              </span>
            </Link>
            <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-3">Нэвтрэх</p>
            <h1 className="font-display text-4xl font-light text-[var(--ink)]">Тавтай морил</h1>
          </div>

          {idleLogout && (
            <div className="mb-6 p-4 border-l-2 border-[var(--gold)] bg-amber-50">
              <p className="text-xs text-[var(--text-muted)]">30 минут идэвхгүй байсан тул автоматаар гарлаа</p>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 border-l-2 border-red-400 bg-red-50">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[var(--text-muted)] mb-2">Имэйл</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@gmail.com" required className="luxury-input" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs tracking-widest uppercase text-[var(--text-muted)]">Нууц үг</label>
                <Link to="/forgot-password" className="text-xs text-[var(--gold)] hover:underline">Мартсан?</Link>
              </div>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required className="luxury-input pr-12" />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-soft)] hover:text-[var(--ink)] transition-colors">
                  {showPw ? "Нуух" : "Харах"}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-gold w-full justify-center" style={{ padding: "16px 0" }}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Нэвтэрч байна...
                  </span>
                ) : "Нэвтрэх"}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <div className="divider-gold mb-6">эсвэл</div>
            <p className="text-sm text-[var(--text-muted)]">
              Бүртгэл байхгүй юу?{" "}
              <Link to="/register" className="text-[var(--gold)] hover:underline font-medium">Бүртгүүлэх</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;