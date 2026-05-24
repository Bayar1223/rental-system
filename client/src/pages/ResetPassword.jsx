import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axiosInstance";

function ResetPassword() {
  const [searchParams]    = useSearchParams();
  const navigate          = useNavigate();
  const token             = searchParams.get("token");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");
  const [showPw, setShowPw]     = useState(false);

  useEffect(() => { if (!token) navigate("/forgot-password"); }, [token, navigate]);

  const pwStrength = newPassword.length === 0 ? 0 : newPassword.length < 6 ? 1 : newPassword.length < 10 ? 2 : newPassword.length < 14 ? 3 : 4;
  const pwColors = ["", "#EF4444", "#F97316", "var(--gold)", "#22C55E"];

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (newPassword !== confirmPassword) { setError("Нууц үг таарахгүй байна"); return; }
    if (newPassword.length < 6) { setError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой"); return; }
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) { setError(err.response?.data?.message || "Алдаа гарлаа. Token хүчингүй байж болзошгүй."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--black)", padding: "48px 24px" }}>
      <Link to="/" style={{ textDecoration: "none", marginBottom: 48 }}>
        <span className="font-display" style={{ fontSize: 24, fontWeight: 300, color: "var(--white)" }}>
          Rental<span style={{ color: "var(--gold)" }}>Sy</span>
        </span>
      </Link>

      <div style={{ width: "100%", maxWidth: 400, background: "var(--dark)", border: "1px solid var(--border-dim)", borderTop: "1px solid var(--gold)", padding: 48 }} className="animate-fadeUp">
        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 56, height: 56, border: "1px solid #22C55E", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="22" height="22" fill="none" stroke="#22C55E" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-display" style={{ fontSize: 32, fontWeight: 300, color: "var(--white)", marginBottom: 12 }}>Амжилттай!</h2>
            <p style={{ fontFamily: "'Montserrat'", fontSize: 12, fontWeight: 300, color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.7 }}>
              Нууц үг амжилттай шинэчлэгдлээ. 3 секундын дараа нэвтрэх хуудас руу шилжинэ.
            </p>
            <Link to="/login" className="btn-gold justify-center w-full" style={{ padding: "14px 0" }}>Нэвтрэх →</Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 20, height: 1, background: "var(--gold)" }} />
              <span style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--gold)" }}>Нууц үг шинэчлэх</span>
            </div>
            <h1 className="font-display" style={{ fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 24 }}>Шинэ нууц үг</h1>

            {error && (
              <div style={{ marginBottom: 20, padding: "10px 14px", borderLeft: "2px solid #EF4444", background: "rgba(239,68,68,0.06)" }}>
                <p style={{ fontFamily: "'Montserrat'", fontSize: 11, color: "#EF4444" }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="input-label">Шинэ нууц үг</label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="luxury-input" style={{ paddingRight: 56 }} required />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-soft)", background: "none", border: "none", cursor: "pointer" }}>
                    {showPw ? "Нуух" : "Харах"}
                  </button>
                </div>
                {newPassword && (
                  <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
                    {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 1, background: i <= pwStrength ? pwColors[pwStrength] : "var(--border-dim)", transition: "all 0.3s" }} />)}
                  </div>
                )}
              </div>
              <div>
                <label className="input-label">Нууц үг давтах</label>
                <input type={showPw ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="luxury-input" required />
              </div>
              <button type="submit" disabled={loading} className="btn-gold justify-center" style={{ padding: "14px 0", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Шинэчилж байна..." : "Нууц үг шинэчлэх"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;