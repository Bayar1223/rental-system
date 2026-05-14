import { useState } from "react";
import axios from "axios";

function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("tenant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await axios.post("https://rental-system-api.onrender.com/api/auth/register", {
        firstName,
        lastName,
        phone,
        email,
        password,
        role,
      });

      alert("Амжилттай бүртгэгдлээ");
    } catch (err) {
      console.log(err);
      alert("Бүртгэл амжилтгүй");
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f2] flex">
      <div className="hidden md:flex w-1/2 relative bg-[url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85')] bg-cover bg-center">
        <div className="absolute inset-0 bg-white/50"></div>

        <div className="relative z-10 p-10">
          <h1 className="text-2xl font-bold text-purple-700">
            RentalSystem
          </h1>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center px-6">
        <form
          onSubmit={handleRegister}
          className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-[470px]"
        >
          <p className="text-gray-600 mb-1">Welcome to RentalSystem</p>

          <h1 className="text-4xl font-bold mb-6">Бүртгүүлэх</h1>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Овог</label>
              <input
                type="text"
                placeholder="Овог"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border p-3 rounded-lg mt-1"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Нэр</label>
              <input
                type="text"
                placeholder="Нэр"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border p-3 rounded-lg mt-1"
                required
              />
            </div>
          </div>

          <label className="text-sm font-semibold mt-4 block">
            Утасны дугаар
          </label>
          <input
            type="text"
            placeholder="Утасны дугаар"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border p-3 rounded-lg mt-1"
            required
          />

          <label className="text-sm font-semibold mt-4 block">
            Имэйл хаяг
          </label>
          <input
            type="email"
            placeholder="Имэйл хаяг"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-3 rounded-lg mt-1"
            required
          />

          <label className="text-sm font-semibold mt-4 block">
            Нууц үг
          </label>
          <input
            type="password"
            placeholder="Нууц үг"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded-lg mt-1"
            required
          />

          <div className="grid grid-cols-2 gap-4 mt-6">
            <button
              type="button"
              onClick={() => setRole("tenant")}
              className={`py-3 rounded-lg text-white ${
                role === "tenant" ? "bg-slate-900" : "bg-slate-500"
              }`}
            >
              Түрээслэгч
            </button>

            <button
              type="button"
              onClick={() => setRole("landlord")}
              className={`py-3 rounded-lg text-white ${
                role === "landlord" ? "bg-slate-900" : "bg-slate-500"
              }`}
            >
              Түрээслүүлэгч
            </button>
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg hover:bg-purple-800"
          >
            Бүртгүүлэх
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;