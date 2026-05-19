import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { useState, useEffect, useRef } from "react";

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

const ROLE_LABELS = {
  tenant:   "Түрээслэгч",
  landlord: "Түрээслүүлэгч",
  admin:    "Админ",
};

// ← NAVBAR-ААС ГАДНА тодорхойлсон — render үед шинээр үүсгэхгүй
function AvatarCircle({ avatar, firstName, size = "sm" }) {
  const cls = size === "lg"
    ? "w-10 h-10 text-lg"
    : "w-7 h-7 text-sm";
  if (avatar) {
    return (
      <img
        src={avatar}
        alt="avatar"
        className={`${cls} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${cls} bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold flex-shrink-0`}>
      {firstName?.[0]?.toUpperCase()}
    </div>
  );
}

function Navbar() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  });
  const [unreadCount, setUnreadCount]     = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif]         = useState(false);
  const [showUserMenu, setShowUserMenu]   = useState(false);
  const [mobileOpen, setMobileOpen]       = useState(false);

  // State-аас гаргаж авна
  const user  = currentUser;
  const token = localStorage.getItem("token");

  const notifRef    = useRef(null);
  const userMenuRef = useRef(null);

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

  // localStorage өөрчлөгдөхөд (Profile хадгалах үед) Navbar шинэчлэгдэнэ
  useEffect(() => {
    const handleStorageChange = () => {
      const updated = JSON.parse(localStorage.getItem("user"));
      setCurrentUser(updated);
    };
    window.addEventListener("storage", handleStorageChange);
    // Custom event — same tab дотор ажиллана
    window.addEventListener("userUpdated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userUpdated", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
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

  return (
    <>
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 md:px-8 py-3 flex justify-between items-center w-full">

          {/* Лого */}
          <Link to={user ? "/home" : "/"}>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏡</span>
              <h1 className="text-lg md:text-xl font-bold text-indigo-600">Түрээсийн систем</h1>
            </div>
          </Link>

          {/* ===== DESKTOP NAV ===== */}
          <div className="hidden md:flex items-center gap-5">
            {user?.role === "tenant" && (
              <>
                <Link to="/my-applications" className="text-gray-600 font-medium hover:text-indigo-600 transition text-sm">
                  Миний хүсэлтүүд
                </Link>
                <Link to="/payments" className="text-gray-600 font-medium hover:text-indigo-600 transition text-sm">
                  💳 Төлбөр
                </Link>
              </>
            )}
            {user?.role === "landlord" && (
              <>
                <Link to="/my-properties" className="text-gray-600 font-medium hover:text-indigo-600 transition text-sm">
                  Миний байрнууд
                </Link>
                <Link to="/landlord-applications" className="text-gray-600 font-medium hover:text-indigo-600 transition text-sm">
                  Ирсэн хүсэлтүүд
                </Link>
                <Link to="/payments" className="text-gray-600 font-medium hover:text-indigo-600 transition text-sm">
                  💰 Орлого
                </Link>
              </>
            )}

            {/* Мэдэгдэл */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button onClick={handleBellClick}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition">
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
                    {/* Scroll container — тогтмол өндөртэй */}
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center text-gray-400">
                          <div className="text-3xl mb-2">🔔</div>
                          <p className="text-sm">Мэдэгдэл байхгүй байна</p>
                        </div>
                      ) : notifications.slice(0, 5).map((n) => (
                        <button key={n._id} onClick={() => handleNotifClick(n)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 ${!n.isRead ? "bg-indigo-50/50" : ""}`}>
                          <div className="flex gap-3">
                            <span className="text-xl flex-shrink-0">{typeIcon(n.type)}</span>
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold ${!n.isRead ? "text-indigo-700" : "text-gray-800"}`}>{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                            </div>
                            {!n.isRead && <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1" />}
                          </div>
                        </button>
                      ))}
                    </div>
                    {/* "Бүгдийг харах" — scroll-оос ГАДНА, үргэлж харагдана */}
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotif(false)}
                      className="flex items-center justify-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 py-2.5 hover:bg-indigo-50 border-t border-gray-100 font-medium transition"
                    >
                      Бүгдийг харах →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* User dropdown */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setShowUserMenu((p) => !p)}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl transition">
                  {/* ← ӨӨРЧЛӨЛТ: Avatar зураг харуулах */}
                  <AvatarCircle avatar={user?.avatar} firstName={user?.firstName} size="sm" />
                  <span className="font-medium text-gray-800 text-sm">{user.firstName}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-800 text-sm">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{ROLE_LABELS[user.role]}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/home" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                        <span>🏠</span> Байр хайх
                      </Link>
                      <Link to="/profile" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                        <span>👤</span> Профайл
                      </Link>
                      <Link to="/notifications" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                        <span>🔔</span>
                        Мэдэгдэлүүд
                        {unreadCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                      {/* Tenant-д зориулсан links */}
                      {user.role === "tenant" && (
                        <>
                          <Link to="/my-rentals" onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                            <span>🏠</span> Миний түрээс
                          </Link>
                          <Link to="/payments" onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                            <span>💳</span> Төлбөр
                          </Link>
                          <Link to="/my-applications" onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                            <span>📋</span> Миний хүсэлтүүд
                          </Link>
                        </>
                      )}
                      {/* Landlord-д зориулсан links */}
                      {user.role === "landlord" && (
                        <>
                          <Link to="/my-rentals" onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                            <span>📊</span> Түрээсийн мэдээлэл
                          </Link>
                          <Link to="/payments" onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                            <span>💰</span> Орлого
                          </Link>
                          <Link to="/my-properties" onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                            <span>🏘️</span> Миний байрнууд
                          </Link>
                          <Link to="/add-property" onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                            <span>➕</span> Байр нэмэх
                          </Link>
                        </>
                      )}
                    </div>
                    {/* Admin link */}
                    {user?.role === "admin" && (
                      <Link to="/admin" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-600 hover:bg-purple-50 transition">
                        <span>⚙️</span> Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-gray-100 py-1">
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition">
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

          {/* ===== MOBILE RIGHT ===== */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <button onClick={handleBellClick}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition">
                <span className="text-lg">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}
            <button onClick={() => setMobileOpen((p) => !p)}
              className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-gray-100 transition">
              <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-200 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-200 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>

        {/* ===== MOBILE MENU ===== */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-gray-50 rounded-xl">
                  {/* ← ӨӨРЧЛӨЛТ: Avatar зураг */}
                  <AvatarCircle avatar={user?.avatar} firstName={user?.firstName} size="lg" />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-400">{ROLE_LABELS[user.role]}</p>
                  </div>
                </div>

                <Link to="/home" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition">
                  <span>🏠</span> Байр хайх
                </Link>
                <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition">
                  <span>👤</span> Профайл
                </Link>
                <Link to="/notifications" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition">
                  <span>🔔</span>
                  Мэдэгдэлүүд
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                {/* Tenant-д зориулсан links */}
                {user.role === "tenant" && (
                  <>
                    <Link to="/my-rentals" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition">
                      <span>🏠</span> Миний түрээс
                    </Link>
                    <Link to="/payments" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition">
                      <span>💳</span> Төлбөр
                    </Link>
                    <Link to="/my-applications" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition">
                      <span>📋</span> Миний хүсэлтүүд
                    </Link>
                  </>
                )}
                {/* Landlord-д зориулсан links */}
                {user.role === "landlord" && (
                  <>
                    <Link to="/my-rentals" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition">
                      <span>📊</span> Түрээсийн мэдээлэл
                    </Link>
                    <Link to="/payments" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition">
                      <span>💰</span> Орлого
                    </Link>
                    <Link to="/my-properties" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition">
                      <span>🏘️</span> Миний байрнууд
                    </Link>
                    <Link to="/landlord-applications" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition">
                      <span>📬</span> Ирсэн хүсэлтүүд
                    </Link>
                    <Link to="/add-property" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition">
                      <span>➕</span> Байр нэмэх
                    </Link>
                  </>
                )}
                {/* Admin-д зориулсан link */}
                {user.role === "admin" && (
                  <Link to="/admin"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-purple-600 hover:bg-purple-50 rounded-xl transition">
                    <span>⚙️</span> Admin Panel
                  </Link>
                )}
                <div className="pt-2 border-t border-gray-100">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition">
                    <span>🚪</span> Гарах
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/home" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition">
                  <span>🏠</span> Байр үзэх
                </Link>
                <Link to="/login" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition">
                  <span>🔑</span> Нэвтрэх
                </Link>
                <Link to="/register">
                  <button className="w-full mt-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
                    Бүртгүүлэх
                  </button>
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Mobile notification panel */}
      {showNotif && user && (
        <div className="md:hidden fixed inset-x-4 top-16 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Мэдэгдлүүд</h3>
              <button onClick={() => setShowNotif(false)} className="text-gray-400 text-2xl leading-none">×</button>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">Мэдэгдэл байхгүй байна</div>
              ) : notifications.slice(0, 5).map((n) => (
                <button key={n._id} onClick={() => handleNotifClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 ${!n.isRead ? "bg-indigo-50/50" : ""}`}>
                  <div className="flex gap-3">
                    <span className="text-lg">{typeIcon(n.type)}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {/* "Бүгдийг харах" — scroll-оос ГАДНА */}
            <Link
              to="/notifications"
              onClick={() => setShowNotif(false)}
              className="flex items-center justify-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 py-2.5 hover:bg-indigo-50 border-t border-gray-100 font-medium transition"
            >
              Бүгдийг харах →
            </Link>
            <Link to="/maintenance">🔧 Засварын хүсэлт</Link>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;