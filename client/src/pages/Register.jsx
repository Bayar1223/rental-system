import { useState } from "react";
import api from "../api/axiosInstance";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("tenant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.length < 14 ? 3 : 4;
  const pwColors = ["", "#ef4444", "#f97316", "var(--gold)", "#22c55e"];
  const pwLabels = ["", "Маш сул", "Сул", "Дунд", "Хүчтэй"];

  const handleRegister = async (e) => {
    e.preventDefault(); setError("");
    if (password.length < 8) { setError("Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой"); return; }
    if (!/^[789]\d{7}$/.test(phone)) { setError("Монгол дугаар оруулна уу (7/8/9-ээр эхлэх, 8 оронтой)"); return; }
    setLoading(true);
    try {
      await api.post("/api/auth/register", { firstName, lastName, phone, email, password, role });
      navigate("/verify-otp", { state: { email } });
    } catch (err) { setError(err.response?.data?.message || "Бүртгэл амжилтгүй боллоо"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--ink)" }}>

      {/* Left visual */}
      <div className="hidden lg:flex flex-col justify-between p-16 w-1/2 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        <Link to="/" className="relative flex items-center gap-3">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border border-[var(--gold)] rotate-45" />
            <div className="absolute inset-1.5 bg-[var(--gold)] rotate-45" />
          </div>
          <span className="font-display text-2xl font-light text-white">
            Mon<span style={{ color: "var(--gold)" }}>Rent</span>
          </span>
        </Link>
        <div className="relative">
          <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-4">Шинэ бүртгэл</p>
          <h2 className="font-display text-5xl font-light text-white leading-tight mb-6">
            Түрээсийн<br />шинэ замыг<br />
            <span style={{ color: "var(--gold)", fontStyle: "italic" }}>нээ</span>
          </h2>
          <p className="text-white/40 text-sm">Үнэ төлбөргүй. Хэдхэн минутад.</p>
        </div>
        <div />
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto" style={{ background: "var(--cream)" }}>
        <div className="w-full max-w-sm animate-fadeUp py-8">

          <div className="mb-8">
            <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-3">Бүртгүүлэх</p>
            <h1 className="font-display text-4xl font-light text-[var(--ink)]">Шинэ хаяг үүсгэх</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 border-l-2 border-red-400 bg-red-50">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-0 mb-6 border border-black/10">
            {[{ v: "tenant", l: "Түрээслэгч" }, { v: "landlord", l: "Түрээслүүлэгч" }].map(({ v, l }) => (
              <button key={v} type="button" onClick={() => setRole(v)}
                className="py-3.5 text-xs font-medium tracking-widest uppercase transition-all"
                style={{
                  background: role === v ? "var(--ink)" : "transparent",
                  color: role === v ? "white" : "var(--text-muted)",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                {l}
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[var(--text-muted)] mb-2">Овог</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Овог" required className="luxury-input" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[var(--text-muted)] mb-2">Нэр</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Нэр" required className="luxury-input" />
              </div>
            </div>

            <div>
              <label className="block text-xs tracking-widest uppercase text-[var(--text-muted)] mb-2">Утас</label>
              <div className="flex">
                <div className="luxury-input flex-shrink-0 w-16 text-[var(--text-muted)] text-center border-r-0">+976</div>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,8))}
                  placeholder="99001234" required className="luxury-input flex-1" style={{ borderLeft: "none" }} />
              </div>
            </div>

            <div>
              <label className="block text-xs tracking-widest uppercase text-[var(--text-muted)] mb-2">Имэйл</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@gmail.com" required className="luxury-input" />
            </div>

            <div>
              <label className="block text-xs tracking-widest uppercase text-[var(--text-muted)] mb-2">Нууц үг</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Хамгийн багадаа 8 тэмдэгт" required className="luxury-input pr-12" />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-soft)] hover:text-[var(--ink)]">
                  {showPw ? "Нуух" : "Харах"}
                </button>
              </div>
              {password && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex-1 h-0.5 transition-all duration-300"
                        style={{ background: i <= pwStrength ? pwColors[pwStrength] : "var(--border-subtle)" }} />
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: pwColors[pwStrength] }}>{pwLabels[pwStrength]}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-gold w-full justify-center" style={{ padding: "16px 0" }}>
                {loading ? "Код явуулж байна..." : "Үргэлжлүүлэх →"}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <div className="divider-gold mb-6">эсвэл</div>
            <p className="text-sm text-[var(--text-muted)]">
              Бүртгэлтэй юу?{" "}
              <Link to="/login" className="text-[var(--gold)] hover:underline font-medium">Нэвтрэх</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}