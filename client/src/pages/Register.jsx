import { useState } from "react";
import api from "../api/axiosInstance";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [phone,     setPhone]     = useState("");
  const [role,      setRole]      = useState("tenant");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (password.length < 8) {
      setError("Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой");
      return;
    }
    if (!/^[789]\d{7}$/.test(phone)) {
      setError("Монгол дугаар оруулна уу (8 оронтой, 7/8/9-ээр эхлэх)");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/register", {
        firstName, lastName, phone, email, password, role,
      });

      // OTP баталгаажуулах хуудас руу шилжих — email дамжуулах
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || "Бүртгэл амжилтгүй боллоо");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

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

      <div className="flex justify-center mt-6 mb-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🏡</span>
          <span className="text-xl font-bold text-indigo-600">Түрээсийн систем</span>
        </Link>
      </div>

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

          {/* Роль */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { value: "tenant",   label: "🏠 Түрээслэгч" },
              { value: "landlord", label: "🏢 Түрээслүүлэгч" },
            ].map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`py-3 rounded-xl text-sm font-medium transition border-2 ${
                  role === r.value
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Нэр */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Овог</label>
              <input
                type="text" placeholder="Овог" value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:border-indigo-400 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Нэр</label>
              <input
                type="text" placeholder="Нэр" value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:border-indigo-400 text-sm"
                required
              />
            </div>
          </div>

          {/* Утас */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Утасны дугаар</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">+976</span>
              <input
                type="tel" placeholder="99001234" value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="w-full border border-gray-200 pl-14 pr-3 py-3 rounded-xl focus:outline-none focus:border-indigo-400 text-sm"
                required
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">8 оронтой, 7/8/9-ээр эхэлсэн дугаар</p>
          </div>

          {/* Имэйл */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Имэйл хаяг</label>
            <input
              type="email" placeholder="example@gmail.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:border-indigo-400 text-sm"
              required
            />
          </div>

          {/* Нууц үг */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Нууц үг</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="Хамгийн багадаа 8 тэмдэгт"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:border-indigo-400 text-sm pr-16"
                required
              />
              <button
                type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                {showPw ? "Нуух" : "Харах"}
              </button>
            </div>
            {/* Хүч чадлын зурвас */}
            {password && (
              <div className="flex gap-1 mt-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${
                    password.length >= i * 3
                      ? i <= 2 ? "bg-red-400" : i <= 3 ? "bg-yellow-400" : "bg-green-400"
                      : "bg-gray-200"
                  }`} />
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Код явуулж байна...
              </>
            ) : (
              "Үргэлжлүүлэх →"
            )}
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