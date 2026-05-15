import { useState } from "react";
import api from "../api/axiosInstance";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("tenant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/api/auth/register", {
        firstName,
        lastName,
        phone,
        email,
        password,
        role,
      });
      alert("Амжилттай бүртгэгдлээ! Нэвтэрнэ үү.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Бүртгэл амжилтгүй боллоо");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* Буцах товч */}
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Буцах
        </button>
      </div>

      {/* Лого */}
      <div className="flex justify-center mt-6 mb-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🏡</span>
          <span className="text-xl font-bold text-indigo-600">Түрээсийн систем</span>
        </Link>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <form
          onSubmit={handleRegister}
          className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-[480px]"
        >
          <h1 className="text-3xl font-bold mb-2 text-center">Бүртгүүлэх</h1>
          <p className="text-gray-400 text-sm text-center mb-6">
            Шинэ хаяг үүсгэх 
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm text-center">
              {error}
            </div>
          )}

          {/* Роль сонгох */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => setRole("tenant")}
              className={`py-3 rounded-xl text-sm font-medium transition border-2 ${
                role === "tenant"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              🏠 Түрээслэгч
            </button>
            <button
              type="button"
              onClick={() => setRole("landlord")}
              className={`py-3 rounded-xl text-sm font-medium transition border-2 ${
                role === "landlord"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              🏢 Түрээслүүлэгч
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Овог</label>
              <input
                type="text"
                placeholder="Овог"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:border-indigo-400 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Нэр</label>
              <input
                type="text"
                placeholder="Нэр"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:border-indigo-400 text-sm"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Утасны дугаар</label>
            <input
              type="tel"
              placeholder="99001234"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:border-indigo-400 text-sm"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Имэйл хаяг</label>
            <input
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:border-indigo-400 text-sm"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Нууц үг</label>
            <input
              type="password"
              placeholder="Хамгийн багадаа 6 тэмдэгт"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:border-indigo-400 text-sm"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 font-medium transition disabled:opacity-50"
          >
            {loading ? "Бүртгэж байна..." : "Бүртгүүлэх"}
          </button>

          <p className="text-center text-sm text-gray-500 mt-5">
            Бүртгэлтэй хэрэглэгч үү?{" "}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
              Нэвтрэх
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;