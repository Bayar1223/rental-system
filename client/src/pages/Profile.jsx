import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = "rental-signature";

const ROLE_LABELS = { tenant: "Түрээслэгч", landlord: "Түрээслүүлэгч", admin: "Админ" };

function Profile() {
  const navigate     = useNavigate();
  const fileInputRef = useRef(null);
  const currentUser  = JSON.parse(localStorage.getItem("user") || "null");

  const [formData, setFormData] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [avatar, setAvatar]               = useState(null);
  const [avatarFile, setAvatarFile]       = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [message, setMessage]   = useState("");
  const [error, setError]       = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError]     = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/users/profile");
        setFormData({
          firstName: res.data.firstName || "",
          lastName:  res.data.lastName  || "",
          phone:     res.data.phone     || "",
          email:     res.data.email     || "",
        });
        setAvatar(res.data.avatar || null);
      } catch {
        setError("Профайл мэдээлэл авахад алдаа гарлаа");
      } finally {
        setLoading(false);
      }
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
    const formDataCloud = new FormData();
    formDataCloud.append("file", file);
    formDataCloud.append("upload_preset", UPLOAD_PRESET);
    formDataCloud.append("folder", "rental-avatars");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formDataCloud });
    const data = await res.json();
    if (!data.secure_url) throw new Error("Upload амжилтгүй");
    return data.secure_url;
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMessage(""); setError("");
    try {
      let avatarUrl = avatar;
      if (avatarFile) {
        setUploadingAvatar(true);
        avatarUrl = await uploadAvatarToCloudinary(avatarFile);
        setUploadingAvatar(false);
        setAvatar(avatarUrl); setAvatarFile(null); setAvatarPreview(null);
      }
      await api.put("/api/users/profile", { ...formData, avatar: avatarUrl });
      const updated = { ...currentUser, ...formData, avatar: avatarUrl };
      localStorage.setItem("user", JSON.stringify(updated));
      setMessage("Профайл амжилттай шинэчлэгдлээ");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Алдаа гарлаа");
      setUploadingAvatar(false);
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMessage(""); setPwError("");
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
  const inputCls = "luxury-input w-full";
  const labelCls = "block text-xs tracking-widest uppercase mb-2";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
      <Navbar />
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
        <p className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Ачааллаж байна</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingTop: 64 }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>Хэрэглэгч</p>
          <h1 className="font-display text-4xl font-light" style={{ color: "var(--ink)" }}>Миний профайл</h1>
        </div>

        {/* Avatar card */}
        <div className="bg-white border p-6 mb-6 flex items-center gap-5" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: "var(--cream)", border: "2px solid var(--gold-light)" }}>
              {displayAvatar ? (
                <img src={displayAvatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-3xl font-light" style={{ color: "var(--gold)" }}>
                  {formData.firstName?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 flex items-center justify-center rounded-full"
              style={{ background: "var(--gold)", color: "var(--ink)" }} title="Зураг солих">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-light" style={{ color: "var(--ink)" }}>{formData.firstName} {formData.lastName}</h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{formData.email}</p>
            <span className="text-xs px-3 py-1 mt-2 inline-block"
              style={{ background: "var(--cream)", border: "1px solid var(--gold)", color: "var(--gold)" }}>
              {ROLE_LABELS[currentUser?.role] || currentUser?.role}
            </span>
            {avatarPreview && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5" style={{ background: "#FFF7ED", color: "#D97706", border: "1px solid #FED7AA" }}>
                  Шинэ зураг сонгогдсон — хадгалахаа дарна уу
                </span>
                <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                  className="text-xs" style={{ color: "var(--text-soft)" }}>x</button>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="text-xs px-4 py-2 border flex-shrink-0"
            style={{ borderColor: "#FCA5A5", color: "#EF4444" }}>Гарах</button>
        </div>

        {/* Profile form */}
        <div className="bg-white border p-6 mb-6" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="text-xs tracking-widest uppercase mb-5" style={{ color: "var(--gold)" }}>Хувийн мэдээлэл</p>
          {message && <div className="mb-4 p-3 border-l-2 text-sm" style={{ borderColor: "var(--gold)", background: "var(--cream)", color: "var(--gold)" }}>{message}</div>}
          {error && <div className="mb-4 p-3 border-l-2 text-sm" style={{ borderColor: "#EF4444", background: "#FEF2F2", color: "#EF4444" }}>{error}</div>}
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Овог</label>
                <input type="text" className={inputCls} value={formData.lastName}
                  onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))} required />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Нэр</label>
                <input type="text" className={inputCls} value={formData.firstName}
                  onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))} required />
              </div>
            </div>
            <div>
              <label className={labelCls} style={{ color: "var(--text-muted)" }}>Утасны дугаар</label>
              <input type="tel" className={inputCls} value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} required />
            </div>
            <div>
              <label className={labelCls} style={{ color: "var(--text-muted)" }}>Имэйл</label>
              <input type="email" className={inputCls} value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} required />
            </div>
            <button type="submit" disabled={saving || uploadingAvatar} className="btn-gold w-full justify-center" style={{ padding: "14px 0" }}>
              {uploadingAvatar ? "Зураг upload хийж байна..." : saving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </form>
        </div>

        {/* Password form */}
        <div className="bg-white border p-6" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="text-xs tracking-widest uppercase mb-5" style={{ color: "var(--gold)" }}>Нууц үг солих</p>
          {pwMessage && <div className="mb-4 p-3 border-l-2 text-sm" style={{ borderColor: "var(--gold)", background: "var(--cream)", color: "var(--gold)" }}>{pwMessage}</div>}
          {pwError && <div className="mb-4 p-3 border-l-2 text-sm" style={{ borderColor: "#EF4444", background: "#FEF2F2", color: "#EF4444" }}>{pwError}</div>}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {[["Одоогийн нууц үг","currentPassword"],["Шинэ нууц үг","newPassword"],["Нууц үг давтах","confirmPassword"]].map(([label, key]) => (
              <div key={key}>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>{label}</label>
                <input type="password" className={inputCls} value={passwords[key]}
                  onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))} required />
              </div>
            ))}
            <button type="submit" disabled={pwSaving} className="btn-gold w-full justify-center" style={{ padding: "14px 0" }}>
              {pwSaving ? "Солиж байна..." : "Нууц үг солих"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;