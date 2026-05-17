import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = "rental-signature"; // өмнөх unsigned preset

function Profile() {
  const navigate    = useNavigate();
  const fileInputRef = useRef(null);
  const currentUser  = JSON.parse(localStorage.getItem("user") || "null");

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", phone: "", email: "",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });
  const [avatar, setAvatar]         = useState(null);   // URL
  const [avatarFile, setAvatarFile] = useState(null);   // File object
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [pwSaving, setPwSaving]   = useState(false);
  const [message, setMessage]     = useState("");
  const [error, setError]         = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError]     = useState("");

  const ROLE_LABELS = {
    tenant:   "Түрээслэгч",
    landlord: "Түрээслүүлэгч",
    admin:    "Админ",
  };

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

  // Зураг сонгоход preview үүсгэх
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Зургийн хэмжээ 5MB-аас хэтрэхгүй байх ёстой");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Cloudinary-д upload хийх
  const uploadAvatarToCloudinary = async (file) => {
    const formDataCloud = new FormData();
    formDataCloud.append("file", file);
    formDataCloud.append("upload_preset", UPLOAD_PRESET);
    formDataCloud.append("folder", "rental-avatars");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: formDataCloud }
    );
    const data = await res.json();
    if (!data.secure_url) throw new Error("Upload амжилтгүй");
    return data.secure_url;
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      let avatarUrl = avatar;

      // Шинэ зураг байвал эхлээд upload хийнэ
      if (avatarFile) {
        setUploadingAvatar(true);
        avatarUrl = await uploadAvatarToCloudinary(avatarFile);
        setUploadingAvatar(false);
        setAvatar(avatarUrl);
        setAvatarFile(null);
        setAvatarPreview(null);
      }

      const res = await api.put("/api/users/profile", { ...formData, avatar: avatarUrl });

      // localStorage шинэчлэх
      const updated = { ...currentUser, ...formData, avatar: avatarUrl };
      localStorage.setItem("user", JSON.stringify(updated));
      setMessage(res.data.message || "Профайл амжилттай шинэчлэгдлээ");
      // Navbar-д avatar шинэчлэгдэхийн тулд хуудас reload хийнэ
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setError(err.response?.data?.message || "Алдаа гарлаа");
      setUploadingAvatar(false);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMessage("");
    setPwError("");

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwError("Шинэ нууц үг таарахгүй байна");
      return;
    }
    if (passwords.newPassword.length < 6) {
      setPwError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой");
      return;
    }

    setPwSaving(true);
    try {
      const res = await api.put("/api/users/change-password", {
        currentPassword: passwords.currentPassword,
        newPassword:     passwords.newPassword,
      });
      setPwMessage(res.data.message || "Нууц үг амжилттай солигдлоо");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwError(err.response?.data?.message || "Алдаа гарлаа");
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const displayAvatar = avatarPreview || avatar;
  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 text-sm";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 pb-10">

        {/* Толгой хэсэг — Avatar */}
        <div className="bg-white rounded-2xl shadow p-6 mb-5">
          <div className="flex items-center gap-5">

            {/* Avatar circle */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-indigo-600 font-bold text-3xl">
                    {formData.firstName?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
              </div>

              {/* Зураг солих товч */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow transition"
                title="Зураг солих"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {formData.firstName} {formData.lastName}
              </h1>
              <p className="text-indigo-600 text-sm font-medium mt-0.5">
                {ROLE_LABELS[currentUser?.role] || currentUser?.role}
              </p>
              <p className="text-gray-400 text-sm">{formData.email}</p>

              {/* Preview indicator */}
              {avatarPreview && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                    ⏳ Шинэ зураг сонгогдсон — хадгалах дарж баталгаажуулна уу
                  </span>
                  <button
                    type="button"
                    onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Профайл засах */}
        <div className="bg-white rounded-2xl shadow p-6 mb-5">
          <h2 className="text-lg font-bold mb-5">Хувийн мэдээлэл</h2>

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 mb-4 text-sm">
              ✓ {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">
              ✕ {error}
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Овог</label>
                <input type="text" className={inputCls}
                  value={formData.lastName}
                  onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                  required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Нэр</label>
                <input type="text" className={inputCls}
                  value={formData.firstName}
                  onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                  required />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Утасны дугаар</label>
              <input type="tel" className={inputCls}
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Имэйл</label>
              <input type="email" className={inputCls}
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                required />
            </div>
            <button type="submit" disabled={saving || uploadingAvatar}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50 text-sm">
              {uploadingAvatar ? "Зураг upload хийж байна..." : saving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </form>
        </div>

        {/* Нууц үг солих */}
        <div className="bg-white rounded-2xl shadow p-6 mb-5">
          <h2 className="text-lg font-bold mb-5">Нууц үг солих</h2>

          {pwMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 mb-4 text-sm">
              ✓ {pwMessage}
            </div>
          )}
          {pwError && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">
              ✕ {pwError}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Одоогийн нууц үг</label>
              <input type="password" className={inputCls}
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Шинэ нууц үг</label>
              <input type="password" className={inputCls}
                value={passwords.newPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Нууц үг давтах</label>
              <input type="password" className={inputCls}
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                required />
            </div>
            <button type="submit" disabled={pwSaving}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-xl font-medium transition disabled:opacity-50 text-sm">
              {pwSaving ? "Солиж байна..." : "Нууц үг солих"}
            </button>
          </form>
        </div>

        {/* Гарах */}
        <button onClick={handleLogout}
          className="w-full border border-red-200 text-red-500 hover:bg-red-50 py-3 rounded-xl font-medium transition text-sm">
          🚪 Системээс гарах
        </button>
      </div>
    </div>
  );
}

export default Profile;