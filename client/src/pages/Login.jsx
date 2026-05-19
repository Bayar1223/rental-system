import { useState } from "react";
import api from "../api/axiosInstance";
import { useNavigate, Link, useLocation } from "react-router-dom";

function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const navigate   = useNavigate();
  const location   = useLocation();
  const idleLogout = location.state?.reason === "idle";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/home");
    } catch {
      setError("Имэйл эсвэл нууц үг буруу байна");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user) navigate("/home");
    else navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* Буцах товч */}
      <div className="px-4 pt-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Буцах
        </button>
      </div>

      {/* Лого */}
      <div className="flex justify-center mt-8 mb-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🏡</span>
          <span className="text-xl font-bold text-indigo-600">Түрээсийн систем</span>
        </Link>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-[420px]"
        >
          <h1 className="text-3xl font-bold mb-2 text-center">Нэвтрэх</h1>
          <p className="text-gray-400 text-sm text-center mb-8">
            Тавтай морил! Хаягаараа нэвтэрнэ үү.
          </p>

          {/* Idle logout мэдэгдэл */}
          {idleLogout && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl p-3 mb-4 text-sm text-center">
              ⏰ 30 минут идэвхгүй байсан тул автоматаар гарлаа
            </div>
          )}

          {/* Алдааны мэдэгдэл */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-5 text-sm text-center">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Имэйл хаяг
            </label>
            <input
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:border-indigo-400 text-sm"
              required
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Нууц үг
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:border-indigo-400 text-sm"
              required
            />
          </div>

          {/* Нууц үг мартсан */}
          <div className="flex justify-end mb-6">
            <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">
              Нууц үг мартсан уу?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 font-medium transition disabled:opacity-50"
          >
            {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
          </button>

          <p className="text-center text-sm text-gray-500 mt-5">
            Бүртгэл байхгүй юу?{" "}
            <Link to="/register" className="text-indigo-600 font-medium hover:underline">
              Бүртгүүлэх
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;