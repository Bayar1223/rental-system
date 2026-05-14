import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center sticky top-0 z-40">
      <Link to={user ? "/home" : "/"}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🏡</span>
          <h1 className="text-xl font-bold text-indigo-600">Түрээсийн систем</h1>
        </div>
      </Link>

      <div className="flex items-center gap-5">
        {user?.role === "tenant" && (
          <Link to="/my-applications" className="text-gray-600 font-medium hover:text-indigo-600 transition text-sm">
            Миний хүсэлтүүд
          </Link>
        )}

        {user?.role === "landlord" && (
          <>
            <Link to="/my-properties" className="text-gray-600 font-medium hover:text-indigo-600 transition text-sm">
              Миний байрнууд
            </Link>
            <Link to="/landlord-applications" className="text-gray-600 font-medium hover:text-indigo-600 transition text-sm">
              Ирсэн хүсэлтүүд
            </Link>
          </>
        )}

        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                {user.firstName?.[0]?.toUpperCase()}
              </div>
              <span className="font-medium text-gray-800 text-sm">{user.firstName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-50 text-red-500 hover:bg-red-100 px-4 py-2 rounded-xl transition font-medium text-sm"
            >
              Гарах
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <button className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium text-sm transition">
                Нэвтрэх
              </button>
            </Link>
            <Link to="/register">
              <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-medium text-sm transition">
                Бүртгүүлэх
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;