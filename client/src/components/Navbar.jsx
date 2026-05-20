import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api/axiosInstance";
import { useState, useEffect, useRef } from "react";

const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "Дөнгөж сая";
  if (diff < 3600) return `${Math.floor(diff / 60)}м өмнө`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}ц өмнө`;
  return `${Math.floor(diff / 86400)}ө өмнө`;
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const user = currentUser;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!user || !token) return;
    const load = async () => {
      try {
        const res = await api.get("/api/notifications/unread-count");
        setUnreadCount(res.data.count);
      } catch { /* silent */ }
    };
    load();
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const h = () => {
      try { setCurrentUser(JSON.parse(localStorage.getItem("user"))); } catch { /* silent */ }
    };
    window.addEventListener("storage", h);
    window.addEventListener("userUpdated", h);
    return () => {
      window.removeEventListener("storage", h);
      window.removeEventListener("userUpdated", h);
    };
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleBellClick = async () => {
    if (!showNotif) {
      try {
        const r = await api.get("/api/notifications");
        setNotifications(r.data);
      } catch { /* silent */ }
      if (unreadCount > 0) {
        try {
          await api.put("/api/notifications/mark-all-read", {});
          setUnreadCount(0);
        } catch { /* silent */ }
      }
    }
    setShowNotif((p) => !p);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const navLinks =
    user?.role === "tenant"
      ? [
          { to: "/home", label: "Байр хайх" },
          { to: "/my-applications", label: "Хүсэлтүүд" },
          { to: "/payments", label: "Төлбөр" },
        ]
      : user?.role === "landlord"
      ? [
          { to: "/home", label: "Байрнууд" },
          { to: "/my-properties", label: "Миний байр" },
          { to: "/landlord-applications", label: "Хүсэлтүүд" },
          { to: "/payments", label: "Орлого" },
        ]
      : [{ to: "/home", label: "Байрнууд" }];

  const navCls = scrolled
    ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-black/5"
    : "bg-transparent";

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navCls}`} style={{ height: 64 }}>
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">

          {/* Logo */}
          <Link to={user ? "/home" : "/"} className="flex items-center gap-3 group">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 border border-[var(--gold)] rotate-45 transition-transform duration-300 group-hover:rotate-[60deg]" />
              <div className="absolute inset-1.5 bg-[var(--gold)] rotate-45 transition-all duration-300 group-hover:scale-90" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-light tracking-wider" style={{ fontFamily: "'DM Sans', sans-serif", color: "var(--ink)" }}>
                Rental<span style={{ color: "var(--gold)" }}>Sy</span>
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`px-4 py-2 text-xs font-medium tracking-widest uppercase transition-all duration-200 relative ${
                  isActive(to) ? "text-[var(--gold)]" : "text-[var(--text-muted)] hover:text-[var(--ink)]"
                }`}>
                {label}
                {isActive(to) && (
                  <span className="absolute bottom-0 left-4 right-4 h-px bg-[var(--gold)]"
                    style={{ animation: "slideRight 0.3s ease both" }} />
                )}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Bell */}
                <div className="relative" ref={notifRef}>
                  <button onClick={handleBellClick}
                    className="relative w-9 h-9 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" d="M15 17H9m6 0a6 6 0 10-6 0m6 0v1a2 2 0 11-4 0v-1M12 3v1" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--gold)] rounded-full" />
                    )}
                  </button>
                  {showNotif && (
                    <div className="absolute right-0 top-12 w-80 bg-white border border-black/8 shadow-2xl z-50 animate-fadeIn">
                      <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
                        <span className="text-xs font-medium tracking-widest uppercase text-[var(--text-muted)]">Мэдэгдлүүд</span>
                        {unreadCount > 0 && <span className="badge-gold">{unreadCount} шинэ</span>}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-12 text-center text-[var(--text-soft)] text-sm">Мэдэгдэл байхгүй</div>
                        ) : (
                          notifications.slice(0, 5).map((n) => (
                            <button key={n._id}
                              onClick={() => { setShowNotif(false); if (n.link) navigate(n.link); }}
                              className={`w-full text-left px-5 py-4 hover:bg-[var(--surface)] border-b border-black/3 transition-colors ${!n.isRead ? "bg-amber-50/50" : ""}`}>
                              <p className={`text-sm font-medium mb-0.5 ${!n.isRead ? "text-[var(--ink)]" : "text-[var(--text-muted)]"}`}>{n.title}</p>
                              <p className="text-xs text-[var(--text-soft)] line-clamp-1">{n.message}</p>
                              <p className="text-xs text-[var(--text-soft)] mt-1">{timeAgo(n.createdAt)}</p>
                            </button>
                          ))
                        )}
                      </div>
                      <Link to="/notifications" onClick={() => setShowNotif(false)}
                        className="flex items-center justify-center gap-2 py-3 text-xs font-medium tracking-widest uppercase text-[var(--gold)] hover:bg-[var(--surface)] transition-colors border-t border-black/5">
                        Бүгдийг харах →
                      </Link>
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setShowUserMenu((p) => !p)}
                    className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-black/5 transition-colors">
                    <div className="w-7 h-7 bg-[var(--gold)] flex items-center justify-center text-[var(--ink)] text-xs font-medium overflow-hidden">
                      {user?.avatar
                        ? <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                        : user?.firstName?.[0]?.toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-xs font-medium text-[var(--ink)]">{user.firstName}</span>
                    <svg className={`w-3 h-3 text-[var(--text-muted)] transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-12 w-52 bg-white border border-black/8 shadow-2xl z-50 animate-fadeIn">
                      <div className="px-4 py-3 border-b border-black/5">
                        <p className="text-sm font-medium text-[var(--ink)]">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-[var(--text-soft)] mt-0.5">
                          {user.role === "tenant" ? "Түрээслэгч" : user.role === "landlord" ? "Түрээслүүлэгч" : "Админ"}
                        </p>
                      </div>
                      <div className="py-1">
                        {[
                          { to: "/profile", label: "Профайл" },
                          { to: "/my-rentals", label: user.role === "landlord" ? "Түрээсийн мэдээлэл" : "Миний түрээс" },
                          { to: "/notifications", label: "Мэдэгдлүүд" },
                          ...(user.role === "tenant" ? [{ to: "/maintenance", label: "Засварын хүсэлт" }] : []),
                          ...(user.role === "landlord" ? [{ to: "/add-property", label: "Байр нэмэх" }, { to: "/maintenance", label: "Суутгал" }] : []),
                          ...(user.role === "admin" ? [{ to: "/admin", label: "Admin Panel" }] : []),
                        ].map(({ to, label }) => (
                          <Link key={to} to={to} onClick={() => setShowUserMenu(false)}
                            className="flex items-center px-4 py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition-colors">
                            {label}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-black/5 py-1">
                        <button onClick={handleLogout}
                          className="w-full flex items-center px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          Гарах
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile burger */}
                <button onClick={() => setMobileOpen((p) => !p)}
                  className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1">
                  <span className={`block w-5 h-px bg-[var(--ink)] transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-1.5" : ""}`} />
                  <span className={`block w-5 h-px bg-[var(--ink)] transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
                  <span className={`block w-5 h-px bg-[var(--ink)] transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-xs">Нэвтрэх</Link>
                <Link to="/register" className="btn-gold text-xs" style={{ padding: "10px 20px" }}>Бүртгүүлэх</Link>
              </div>
            )}
          </div>
        </div>
        <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)", opacity: 0.3 }} />
      </nav>

      {/* Mobile menu */}
      {mobileOpen && user && (
        <div className="md:hidden fixed inset-0 z-40 bg-white pt-16 animate-fadeIn">
          <div className="px-6 py-8 space-y-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                className={`block py-4 text-sm tracking-widest uppercase border-b border-black/5 transition-colors ${
                  isActive(to) ? "text-[var(--gold)]" : "text-[var(--text-muted)]"
                }`}>
                {label}
              </Link>
            ))}
            <button onClick={handleLogout}
              className="block w-full text-left py-4 text-sm tracking-widest uppercase text-red-400 border-b border-black/5">
              Гарах
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;