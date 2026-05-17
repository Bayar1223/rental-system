import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance";

function ForgotPassword() {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="px-4 pt-4">
        <Link to="/login" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Нэвтрэх хуудас руу буцах
        </Link>
      </div>

      <div className="flex justify-center mt-8 mb-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🏡</span>
          <span className="text-xl font-bold text-indigo-600">Түрээсийн систем</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-[420px]">
          {success ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Имэйл илгээгдлээ!</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Нууц үг сэргээх холбоос таны <strong>{email}</strong> имэйл рүү илгээгдлээ.
                Имэйлээ шалгаж холбоос дээр дарна уу.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                ⏰ Холбоос 1 цагийн дотор хүчинтэй
              </p>
              <Link to="/login">
                <button className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 font-medium transition text-sm">
                  Нэвтрэх хуудас руу буцах
                </button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2 text-center">Нууц үг мартсан уу?</h1>
              <p className="text-gray-400 text-sm text-center mb-8">
                Бүртгэлтэй имэйл хаягаа оруулахад сэргээх холбоос илгээнэ
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-5 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 font-medium transition disabled:opacity-50"
                >
                  {loading ? "Илгээж байна..." : "Сэргээх холбоос илгээх"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-5">
                Нууц үгээ санасан уу?{" "}
                <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                  Нэвтрэх
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;