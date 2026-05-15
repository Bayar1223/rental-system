import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import api from "../api/axiosInstance";

const timeAgo = (date) => {
  const d = new Date(date).getTime();
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return "Дөнгөж сая";
  if (diff < 3600) return `${Math.floor(diff / 60)} минутын өмнө`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} цагийн өмнө`;
  return `${Math.floor(diff / 86400)} өдрийн өмнө`;
};

const typeIcon = (type) => {
  if (type === "application_received") return "📨";
  if (type === "application_approved") return "✅";
  if (type === "application_rejected") return "❌";
  return "🔔";
};

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Мэдэгдлийн тоог 30 секунд тутамд шинэчлэх
  useEffect(() => {
    if (!user || !token) return;

    const load = async () => {
      try {
        const res = await api.get("/api/notifications/unread-count");
        setUnreadCount(res.data.count);
      } catch { /* silent */ }
    };

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dropdown хаах
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleBellClick = async () => {
    if (!showNotif) {
      try {
        const res = await api.get("/api/notifications");
        setNotifications(res.data);
      } catch { /* silent */ }

      if (unreadCount > 0) {
        try {
          await api.put("/api/notifications/mark-all-read", {});
          setUnreadCount(0);
        } catch { /* silent */ }
      }
    }
    setShowNotif((prev) => !prev);
  };

  const handleNotifClick = (notif) => {
    setShowNotif(false);
    if (notif.link) navigate(notif.link);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const ROLE_LABELS = {
    tenant: "Түрээслэгч",
    landlord: "Түрээслүүлэгч",
    admin: "Админ",
  };

  return (
    <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center sticky top-0 z-40">
      {/* Лого */}
      <Link to={user ? "/home" : "/"}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🏡</span>
          <h1 className="text-xl font-bold text-indigo-600">Түрээсийн систем</h1>
        </div>
      </Link>

      <div className="flex items-center gap-5">
        {/* Tenant цэс */}
        {user?.role === "tenant" && (
          <Link to="/my-applications" className="text-gray-600 font-medium hover:text-indigo-600 transition text-sm">
            Миний хүсэлтүүд
          </Link>
        )}

        {/* Landlord цэс */}
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

        {/* Мэдэгдэл */}
        {user && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleBellClick}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">Мэдэгдлүүд</h3>
                  <span className="text-xs text-gray-400">{notifications.length} мэдэгдэл</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center text-gray-400">
                      <div className="text-3xl mb-2">🔔</div>
                      <p className="text-sm">Мэдэгдэл байхгүй байна</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n._id}
                        onClick={() => handleNotifClick(n)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 ${!n.isRead ? "bg-indigo-50/50" : ""}`}
                      >
                        <div className="flex gap-3">
                          <span className="text-xl flex-shrink-0">{typeIcon(n.type)}</span>
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold ${!n.isRead ? "text-indigo-700" : "text-gray-800"}`}>
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                          {!n.isRead && (
                            <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Хэрэглэгчийн цэс */}
        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu((prev) => !prev)}
              className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl transition"
            >
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                {user.firstName?.[0]?.toUpperCase()}
              </div>
              <span className="font-medium text-gray-800 text-sm">{user.firstName}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 top-12 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                {/* Хэрэглэгчийн мэдээлэл */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ROLE_LABELS[user.role] || user.role}</p>
                </div>

                {/* Холбоосууд */}
                <div className="py-1">
                  <Link
                    to="/home"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <span>🏠</span> Байр хайх
                  </Link>

                  {user.role === "tenant" && (
                    <Link
                      to="/my-applications"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <span>📋</span> Миний хүсэлтүүд
                    </Link>
                  )}

                  {user.role === "landlord" && (
                    <>
                      <Link
                        to="/my-properties"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <span>🏘️</span> Миний байрнууд
                      </Link>
                      <Link
                        to="/add-property"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <span>➕</span> Байр нэмэх
                      </Link>
                    </>
                  )}
                </div>

                {/* Гарах */}
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
                  >
                    <span>🚪</span> Гарах
                  </button>
                </div>
              </div>
            )}
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