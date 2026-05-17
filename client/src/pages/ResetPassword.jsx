import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axiosInstance";

function ResetPassword() {
  const [searchParams]            = useSearchParams();
  const navigate                  = useNavigate();
  const token                     = searchParams.get("token");

  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]                 = useState(false);
  const [success, setSuccess]                 = useState(false);
  const [error, setError]                     = useState("");
  const [showPw, setShowPw]                   = useState(false);

  useEffect(() => {
    if (!token) navigate("/forgot-password");
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Нууц үг таарахгүй байна");
      return;
    }
    if (newPassword.length < 6) {
      setError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Алдаа гарлаа. Token хүчингүй байж болзошгүй.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex justify-center mt-12 mb-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🏡</span>
          <span className="text-xl font-bold text-indigo-600">Түрээсийн систем</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-[420px]">
          {success ? (
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Амжилттай!</h2>
              <p className="text-gray-500 text-sm mb-4">
                Нууц үг амжилттай шинэчлэгдлээ. 3 секундын дараа нэвтрэх хуудас руу шилжинэ.
              </p>
              <Link to="/login">
                <button className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 font-medium transition text-sm">
                  Нэвтрэх →
                </button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2 text-center">Нууц үг шинэчлэх</h1>
              <p className="text-gray-400 text-sm text-center mb-8">
                Шинэ нууц үгээ оруулна уу
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-5 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Шинэ нууц үг
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:border-indigo-400 text-sm pr-10"
                      required
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                      {showPw ? "Нуух" : "Харах"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Нууц үг давтах
                  </label>
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:border-indigo-400 text-sm"
                    required
                  />
                </div>

                {newPassword && (
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${
                        newPassword.length >= i * 2
                          ? i <= 2 ? "bg-red-400" : i <= 4 ? "bg-yellow-400" : "bg-green-400"
                          : "bg-gray-200"
                      }`} />
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 font-medium transition disabled:opacity-50"
                >
                  {loading ? "Шинэчилж байна..." : "Нууц үг шинэчлэх"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;