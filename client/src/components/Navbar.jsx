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
        <h1 className="text-2xl font-bold text-indigo-600">
          Түрээсийн систем
        </h1>
      </Link>

      <div className="flex items-center gap-6">
        {/* Tenant menu */}
        {user?.role === "tenant" && (
          <Link
            to="/my-applications"
            className="text-gray-700 font-medium"
          >
            Хүсэлтүүд
          </Link>
        )}

        {/* Landlord menu */}
        {user?.role === "landlord" && (
          <>
            <Link
              to="/add-property"
              className="text-gray-700 font-medium"
            >
              Байр нэмэх
            </Link>

            <Link
              to="/landlord-applications"
              className="text-gray-700 font-medium"
            >
              Ирсэн хүсэлтүүд
            </Link>
          </>
        )}

        {user ? (
          <>
            <p className="font-semibold">
              {user.firstName}
            </p>

            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-5 py-3 rounded-xl"
            >
              Гарах
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white">
                Нэвтрэх
              </button>
            </Link>

            <Link to="/register">
              <button className="px-4 py-2 rounded-lg border border-indigo-600 text-indigo-600">
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