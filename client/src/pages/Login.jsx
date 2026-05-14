import { useState } from "react";
import api from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post(
        "/api/auth/login",
        {
          email,
          password,
        }
      );

      console.log(res.data);

      localStorage.setItem(
        "token",
        res.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      alert("Амжилттай нэвтэрлээ");

      navigate("/");
    } catch (err) {
      console.log(err);

      alert("Имэйл эсвэл нууц үг буруу");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-[450px]"
      >
        <h1 className="text-4xl font-bold mb-8 text-center">
          Нэвтрэх
        </h1>

        <input
          type="email"
          placeholder="Имэйл"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full border p-3 rounded-lg mb-5"
          required
        />

        <input
          type="password"
          placeholder="Нууц үг"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full border p-3 rounded-lg mb-6"
          required
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700"
        >
          Нэвтрэх
        </button>
      </form>
    </div>
  );
}

export default Login;