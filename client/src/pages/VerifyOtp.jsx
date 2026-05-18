import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api/axiosInstance";

function VerifyOtp() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = location.state?.email || "";

  const [otp, setOtp]           = useState(["", "", "", "", "", ""]);
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]       = useState("");
  const [countdown, setCountdown] = useState(60); // Дахин явуулах хүлээлт
  const inputRefs = useRef([]);

  // Хуудас буруу ороход буцаах
  useEffect(() => {
    if (!email) navigate("/register");
  }, [email, navigate]);

  // Countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Input утга өөрчлөх
  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // Зөвхөн тоо
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");
    // Дараагийн input руу шилжих
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Backspace дарахад өмнөх рүү шилжих
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Paste хийхэд автоматаар бөглөх
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // Баталгаажуулах
  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError("6 оронтой кодыг бүрэн оруулна уу");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/verify-otp", { email, code });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "OTP код буруу байна");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // OTP дахин явуулах
  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    setError("");
    try {
      await api.post("/api/auth/resend-otp", { email, purpose: "register" });
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Дахин явуулахад алдаа гарлаа");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* Буцах */}
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate("/register")}
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

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-[420px]">

          {/* Толгой */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">📧</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Имэйл баталгаажуулах
            </h1>
            <p className="text-gray-500 text-sm">
              <span className="font-medium text-indigo-600">{email}</span>
              {" "}рүү 6 оронтой код илгээгдлээ
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify}>
            {/* OTP input нүднүүд */}
            <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none transition ${
                    digit
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 focus:border-indigo-400"
                  }`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join("").length < 6}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 font-medium transition disabled:opacity-50 mb-4"
            >
              {loading ? "Баталгаажуулж байна..." : "Баталгаажуулах"}
            </button>
          </form>

          {/* Дахин явуулах */}
          <div className="text-center text-sm text-gray-500">
            Код ирээгүй юу?{" "}
            {countdown > 0 ? (
              <span className="text-gray-400">{countdown}с дараа дахин явуулна</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-indigo-600 font-medium hover:underline disabled:opacity-50"
              >
                {resending ? "Явуулж байна..." : "Дахин явуулах"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;