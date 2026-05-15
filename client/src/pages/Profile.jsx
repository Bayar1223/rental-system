import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

function Profile() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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
      } catch {
        setError("Профайл мэдээлэл авахад алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await api.put("/api/users/profile", formData);
      // localStorage шинэчлэх
      const updated = { ...currentUser, ...formData };
      localStorage.setItem("user", JSON.stringify(updated));
      setMessage(res.data.message || "Профайл амжилттай шинэчлэгдлээ");
    } catch (err) {
      setError(err.response?.data?.message || "Алдаа гарлаа");
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
      <div className="max-w-2xl mx-auto p-8">

        {/* Толгой хэсэг */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-2xl flex-shrink-0">
            {formData.firstName?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {formData.firstName} {formData.lastName}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {ROLE_LABELS[currentUser?.role] || currentUser?.role}
            </p>
            <p className="text-gray-400 text-sm">{formData.email}</p>
          </div>
        </div>

        {/* Профайл засах */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-5">Хувийн мэдээлэл</h2>

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
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 text-sm"
                  value={formData.lastName}
                  onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Нэр</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 text-sm"
                  value={formData.firstName}
                  onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Утасны дугаар</label>
              <input
                type="tel"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 text-sm"
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Имэйл</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 text-sm"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50 text-sm"
            >
              {saving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </form>
        </div>

        {/* Нууц үг солих */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-5">Нууц үг солих</h2>

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
              <input
                type="password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 text-sm"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Шинэ нууц үг</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 text-sm"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Нууц үг давтах</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 text-sm"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                required
              />
            </div>

            <button
              type="submit"
              disabled={pwSaving}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-xl font-medium transition disabled:opacity-50 text-sm"
            >
              {pwSaving ? "Солиж байна..." : "Нууц үг солих"}
            </button>
          </form>
        </div>

        {/* Гарах */}
        <button
          onClick={handleLogout}
          className="w-full border border-red-200 text-red-500 hover:bg-red-50 py-3 rounded-xl font-medium transition text-sm"
        >
          🚪 Системээс гарах
        </button>
      </div>
    </div>
  );
}

export default Profile;