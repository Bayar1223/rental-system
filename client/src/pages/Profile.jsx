import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = "rental-signature";
const ROLE_LABELS   = { tenant: "Түрээслэгч", landlord: "Түрээслүүлэгч", admin: "Админ" };

function SectionTitle({ label }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div style={{ width: 24, height: 1, background: "var(--gold)" }} />
      <span style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)" }}>
        {label}
      </span>
    </div>
  );
}

function Profile() {
  const navigate     = useNavigate();
  const fileInputRef = useRef(null);
  const currentUser  = JSON.parse(localStorage.getItem("user") || "null");

  const [formData, setFormData]     = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [passwords, setPasswords]   = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [avatar, setAvatar]         = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [pwSaving, setPwSaving]     = useState(false);
  const [message, setMessage]       = useState("");
  const [error, setError]           = useState("");
  const [pwMessage, setPwMessage]   = useState("");
  const [pwError, setPwError]       = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/users/profile");
        setFormData({ firstName: res.data.firstName||"", lastName: res.data.lastName||"", phone: res.data.phone||"", email: res.data.email||"" });
        setAvatar(res.data.avatar || null);
      } catch { setError("Профайл мэдээлэл авахад алдаа гарлаа"); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Зургийн хэмжээ 5MB-аас хэтрэхгүй байх ёстой"); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatarToCloudinary = async (file) => {
    const fd = new FormData();
    fd.append("file", file); fd.append("upload_preset", UPLOAD_PRESET); fd.append("folder", "rental-avatars");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
    const data = await res.json();
    if (!data.secure_url) throw new Error("Upload амжилтгүй");
    return data.secure_url;
  };

  const handleProfileSave = async (e) => {
    e.preventDefault(); setSaving(true); setMessage(""); setError("");
    try {
      let avatarUrl = avatar;
      if (avatarFile) { setUploadingAvatar(true); avatarUrl = await uploadAvatarToCloudinary(avatarFile); setUploadingAvatar(false); setAvatar(avatarUrl); setAvatarFile(null); setAvatarPreview(null); }
      await api.put("/api/users/profile", { ...formData, avatar: avatarUrl });
      const updated = { ...currentUser, ...formData, avatar: avatarUrl };
      localStorage.setItem("user", JSON.stringify(updated));
      setMessage("Профайл амжилттай шинэчлэгдлээ");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) { setError(err.response?.data?.message || "Алдаа гарлаа"); setUploadingAvatar(false); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault(); setPwMessage(""); setPwError("");
    if (passwords.newPassword !== passwords.confirmPassword) { setPwError("Шинэ нууц үг таарахгүй байна"); return; }
    if (passwords.newPassword.length < 8) { setPwError("Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой"); return; }
    setPwSaving(true);
    try {
      const res = await api.put("/api/users/change-password", { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setPwMessage(res.data.message || "Нууц үг амжилттай солигдлоо");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) { setPwError(err.response?.data?.message || "Алдаа гарлаа"); }
    finally { setPwSaving(false); }
  };

  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/"); };
  const displayAvatar = avatarPreview || avatar;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--black)" }}>
      <Navbar />
      <div className="text-center">
        <div style={{ width: 24, height: 24, border: "1px solid var(--gold)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--text-muted)" }}>Ачааллаж байна</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--black)", paddingTop: 70 }}>
      <Navbar />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 48px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div className="flex items-center gap-4 mb-4">
            <div style={{ width: 32, height: 1, background: "var(--gold)" }} />
            <span style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--gold)" }}>Хэрэглэгч</span>
          </div>
          <h1 className="font-display" style={{ fontSize: 48, fontWeight: 300, color: "var(--white)" }}>Миний профайл</h1>
        </div>

        {/* AVATAR CARD */}
        <div style={{ background: "var(--dark)", border: "1px solid var(--border-dim)", padding: "28px 32px", marginBottom: 16, display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--dark-2)" }}>
              {displayAvatar ? (
                <img src={displayAvatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span className="font-display" style={{ fontSize: 32, fontWeight: 300, color: "var(--gold)" }}>
                  {formData.firstName?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ position: "absolute", bottom: -2, right: -2, width: 28, height: 28, background: "var(--gold)", color: "var(--black)", border: "2px solid var(--black)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="font-display" style={{ fontSize: 24, fontWeight: 300, color: "var(--white)", marginBottom: 4 }}>{formData.firstName} {formData.lastName}</h2>
            <p style={{ fontFamily: "'Montserrat'", fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>{formData.email}</p>
            <span className="badge-gold" style={{ fontSize: 8 }}>{ROLE_LABELS[currentUser?.role] || currentUser?.role}</span>
            {avatarPreview && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--gold)", background: "rgba(201,160,80,0.08)", padding: "4px 10px", border: "1px solid rgba(201,160,80,0.2)" }}>
                  Шинэ зураг — хадгалахаа дарна уу
                </span>
                <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null); }} style={{ fontSize: 11, color: "var(--text-soft)", background: "none", border: "none", cursor: "pointer" }}>✕</button>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="btn-danger" style={{ flexShrink: 0 }}>Гарах</button>
        </div>

        {/* PROFILE FORM */}
        <div style={{ background: "var(--dark)", border: "1px solid var(--border-dim)", padding: 32, marginBottom: 16 }}>
          <SectionTitle label="Хувийн мэдээлэл" />
          {message && <div style={{ marginBottom: 20, padding: "10px 14px", borderLeft: "2px solid var(--gold)", background: "rgba(201,160,80,0.06)" }}><p style={{ fontFamily: "'Montserrat'", fontSize: 11, color: "var(--gold)" }}>{message}</p></div>}
          {error && <div style={{ marginBottom: 20, padding: "10px 14px", borderLeft: "2px solid #EF4444", background: "rgba(239,68,68,0.06)" }}><p style={{ fontFamily: "'Montserrat'", fontSize: 11, color: "#EF4444" }}>{error}</p></div>}
          <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="input-label">Овог</label>
                <input type="text" className="luxury-input" value={formData.lastName} onChange={(e) => setFormData(p => ({ ...p, lastName: e.target.value }))} required />
              </div>
              <div>
                <label className="input-label">Нэр</label>
                <input type="text" className="luxury-input" value={formData.firstName} onChange={(e) => setFormData(p => ({ ...p, firstName: e.target.value }))} required />
              </div>
            </div>
            <div>
              <label className="input-label">Утасны дугаар</label>
              <input type="tel" className="luxury-input" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} required />
            </div>
            <div>
              <label className="input-label">Имэйл</label>
              <input type="email" className="luxury-input" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <button type="submit" disabled={saving || uploadingAvatar} className="btn-gold justify-center" style={{ padding: "14px 0" }}>
              {uploadingAvatar ? "Зураг upload хийж байна..." : saving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </form>
        </div>

        {/* PASSWORD FORM */}
        <div style={{ background: "var(--dark)", border: "1px solid var(--border-dim)", padding: 32 }}>
          <SectionTitle label="Нууц үг солих" />
          {pwMessage && <div style={{ marginBottom: 20, padding: "10px 14px", borderLeft: "2px solid var(--gold)", background: "rgba(201,160,80,0.06)" }}><p style={{ fontFamily: "'Montserrat'", fontSize: 11, color: "var(--gold)" }}>{pwMessage}</p></div>}
          {pwError && <div style={{ marginBottom: 20, padding: "10px 14px", borderLeft: "2px solid #EF4444", background: "rgba(239,68,68,0.06)" }}><p style={{ fontFamily: "'Montserrat'", fontSize: 11, color: "#EF4444" }}>{pwError}</p></div>}
          <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[["Одоогийн нууц үг","currentPassword"],["Шинэ нууц үг","newPassword"],["Нууц үг давтах","confirmPassword"]].map(([label, key]) => (
              <div key={key}>
                <label className="input-label">{label}</label>
                <input type="password" className="luxury-input" value={passwords[key]} onChange={(e) => setPasswords(p => ({ ...p, [key]: e.target.value }))} required />
              </div>
            ))}
            <button type="submit" disabled={pwSaving} className="btn-gold justify-center" style={{ padding: "14px 0" }}>
              {pwSaving ? "Солиж байна..." : "Нууц үг солих"}
            </button>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Profile;