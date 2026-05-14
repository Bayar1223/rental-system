import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
      <Link to="/">
        <h1 className="text-2xl font-bold text-indigo-600">Түрээсийн систем</h1>
      </Link>

      <div className="flex items-center gap-6">
        {user?.role === "tenant" && (
          <Link to="/my-applications" className="text-gray-700 font-medium hover:text-indigo-600">
            Миний хүсэлтүүд
          </Link>
        )}

        {user?.role === "landlord" && (
          <>
            <Link to="/my-properties" className="text-gray-700 font-medium hover:text-indigo-600">
              Миний байрнууд
            </Link>
            <Link to="/landlord-applications" className="text-gray-700 font-medium hover:text-indigo-600">
              Ирсэн хүсэлтүүд
            </Link>
          </>
        )}

        {user ? (
          <>
            <span className="font-semibold text-gray-800">{user.firstName}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-5 py-2.5 rounded-xl hover:bg-red-600 transition"
            >
              Гарах
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                Нэвтрэх
              </button>
            </Link>
            <Link to="/register">
              <button className="px-4 py-2 rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50">
                Бүртгүүлэх
              </button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;