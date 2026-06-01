import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api/axiosInstance";
import { useState, useEffect, useRef, useMemo } from "react";

const timeAgo = (date) => {
  if (!date) return "";
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "Дөнгөж сая";
  if (diff < 3600) return `${Math.floor(diff / 60)}м өмнө`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}ц өмнө`;
  return `${Math.floor(diff / 86400)}ө өмнө`;
};

const ROLE_LABELS = {
  tenant: "Түрээслэгч",
  landlord: "Байрны эзэн",
  admin: "Админ",
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [msgUnread, setMsgUnread] = useState(0); // ⭐ ШИНЭ: зурвасны уншаагүй тоо
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const user = currentUser;

  const displayName = useMemo(() => {
    if (!user) return "";
    if (user.firstName) return user.firstName;
    if (user.name) return user.name.split(" ")[0];
    return "Хэрэглэгч";
  }, [user]);

  const fullName = useMemo(() => {
    if (!user) return "";
    if (user.firstName) return `${user.firstName} ${user.lastName || ""}`.trim();
    return user.name || "Хэрэглэгч";
  }, [user]);

  const initial = useMemo(() => {
    if (!user) return "?";
    return (user.firstName || user.name || "?").charAt(0).toUpperCase();
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    let cancelled = false;
    // ⭐ ЗАСВАР: мэдэгдэл + зурвасны тоог нэг poll дотор зэрэг татна
    const load = async () => {
      try {
        const [notifRes, msgRes] = await Promise.all([
          api.get("/api/notifications/unread-count"),
          api.get("/api/messages/unread-count"),
        ]);
        if (cancelled) return;
        setUnreadCount(notifRes.data?.count || 0);
        setMsgUnread(msgRes.data?.count || 0);
      } catch {
        /* silent */
      }
    };

    load();
    const intervalId = setInterval(load, 30000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [user]);

  useEffect(() => {
    const handler = () => {
      try {
        setCurrentUser(JSON.parse(localStorage.getItem("user")));
      } catch {
        /* silent */
      }
    };
    window.addEventListener("storage", handler);
    window.addEventListener("userUpdated", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("userUpdated", handler);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    if (showNotif) setShowNotif(false);
    if (showUserMenu) setShowUserMenu(false);
    if (mobileOpen) setMobileOpen(false);
  }

  const handleBellClick = async () => {
    if (!showNotif) {
      try {
        const r = await api.get("/api/notifications");
        setNotifications(r.data || []);
      } catch {
        /* silent */
      }
      if (unreadCount > 0) {
        try {
          await api.put("/api/notifications/mark-all-read", {});
          setUnreadCount(0);
        } catch {
          /* silent */
        }
      }
    }
    setShowNotif((p) => !p);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const navLinks =
    user?.role === "tenant"
      ? [
          { to: "/home", label: "Байр" },
          { to: "/my-applications", label: "Хүсэлт" },
          { to: "/my-rentals", label: "Түрээс" },
          { to: "/payments", label: "Төлбөр" },
        ]
      : user?.role === "landlord"
        ? [
            { to: "/home", label: "Байр" },
            { to: "/my-properties", label: "Миний байр" },
            { to: "/landlord-applications", label: "Хүсэлт" },
            { to: "/payments", label: "Орлого" },
          ]
        : user?.role === "admin"
          ? [
              { to: "/home", label: "Байр" },
              { to: "/admin", label: "Админ" },
            ]
          : [{ to: "/home", label: "Байр" }];

  // ⭐ ШИНЭ: "Зурвас" нь бүх role-д dropdown + mobile цэсэнд гарна
  const userMenuItems = [
    { to: "/profile", label: "Профайл" },
    { to: "/messages", label: "Зурвас" },
    { to: "/notifications", label: "Мэдэгдэл" },
    ...(user?.role === "tenant"
      ? [
          { to: "/favorites", label: "Хадгалсан" },
          { to: "/my-rentals", label: "Миний түрээс" },
          { to: "/payments", label: "Миний төлбөр" },
          { to: "/maintenance", label: "Барьцаа суутгал" },
        ]
      : []),
    ...(user?.role === "landlord"
      ? [
          { to: "/add-property", label: "Байр нэмэх" },
          { to: "/payments", label: "Орлого" },
          { to: "/maintenance", label: "Барьцаа суутгал" },
        ]
      : []),
    ...(user?.role === "admin" ? [{ to: "/admin", label: "Админ самбар" }] : []),
  ];

  const navStyle = scrolled
    ? {
        height: 72,
        background: "rgba(10, 10, 10, 0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-gold)",
      }
    : { height: 72, background: "transparent" };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={navStyle}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-full flex items-center justify-between">
          <Link to={user ? "/home" : "/"} className="flex items-center gap-3 group">
            <div className="relative w-8 h-8">
              <div
                className="absolute inset-0 rotate-45 transition-transform duration-500 group-hover:rotate-[135deg]"
                style={{ border: "1px solid var(--gold)" }}
              />
              <div
                className="absolute inset-1.5 rotate-45 transition-all duration-500 group-hover:scale-50"
                style={{ background: "var(--gold)" }}
              />
            </div>
            <div className="hidden sm:block">
              <span
                className="font-display text-xl tracking-[0.2em] font-light"
                style={{ color: "var(--text-primary)" }}
              >
                Rental<span style={{ color: "var(--gold)", fontStyle: "italic" }}>Sy</span>
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="px-5 py-2 text-[10px] font-medium tracking-[0.2em] uppercase transition-all duration-300 relative"
                style={{
                  color: isActive(to) ? "var(--gold)" : "rgba(255,255,255,0.55)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(to)) e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive(to)) e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                }}
              >
                {label}
                {isActive(to) && (
                  <span
                    className="absolute bottom-0 left-5 right-5"
                    style={{
                      height: 1,
                      background: "var(--gold)",
                      animation: "slideRight 0.4s ease both",
                    }}
                  />
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* ⭐ ШИНЭ: Зурвасны икон + уншаагүй badge */}
                <Link
                  to="/messages"
                  className="relative w-10 h-10 flex items-center justify-center transition-colors"
                  style={{
                    color: isActive("/messages")
                      ? "var(--gold)"
                      : "rgba(255,255,255,0.55)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = isActive("/messages")
                      ? "var(--gold)"
                      : "rgba(255,255,255,0.55)")
                  }
                  aria-label="Зурвас"
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 5h16a1 1 0 011 1v9a1 1 0 01-1 1H9l-4 4v-4H4a1 1 0 01-1-1V6a1 1 0 011-1z"
                    />
                  </svg>
                  {msgUnread > 0 && (
                    <span
                      className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full text-[10px] font-semibold leading-none"
                      style={{
                        background: "var(--gold)",
                        color: "#0A0A0A",
                        fontFamily: "'DM Sans', sans-serif",
                        animation: "pulseGold 2s infinite",
                      }}
                    >
                      {msgUnread > 9 ? "9+" : msgUnread}
                    </span>
                  )}
                </Link>

                <div className="relative" ref={notifRef}>
                  <button
                    onClick={handleBellClick}
                    className="relative w-10 h-10 flex items-center justify-center transition-colors"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "rgba(255,255,255,0.55)")
                    }
                    aria-label="Мэдэгдэл"
                  >
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        d="M15 17H9m6 0a6 6 0 10-6 0m6 0v1a2 2 0 11-4 0v-1M12 3v1"
                      />
                    </svg>
                    {/* ⭐ ЗАСВАР: dot биш — тоотой алтан badge */}
                    {unreadCount > 0 && (
                      <span
                        className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full text-[10px] font-semibold leading-none"
                        style={{
                          background: "var(--gold)",
                          color: "#0A0A0A",
                          fontFamily: "'DM Sans', sans-serif",
                          animation: "pulseGold 2s infinite",
                        }}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotif && (
                    <div
                      className="absolute right-0 top-12 w-80 z-50 animate-fadeIn"
                      style={{
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border-gold)",
                      }}
                    >
                      <div
                        className="px-5 py-4 flex items-center justify-between"
                        style={{ borderBottom: "1px solid var(--border-subtle)" }}
                      >
                        <span
                          className="text-[10px] font-medium tracking-[0.25em] uppercase"
                          style={{ color: "var(--gold)" }}
                        >
                          Мэдэгдэл
                        </span>
                        {unreadCount > 0 && (
                          <span className="badge-gold">{unreadCount} шинэ</span>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
                            <div className="text-sm">Мэдэгдэл байхгүй</div>
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((n) => (
                            <button
                              key={n._id}
                              onClick={() => {
                                setShowNotif(false);
                                if (n.link) navigate(n.link);
                              }}
                              className="w-full text-left px-5 py-4 transition-colors"
                              style={{
                                borderBottom: "1px solid var(--border-subtle)",
                                background: !n.isRead
                                  ? "rgba(201,168,76,0.04)"
                                  : "transparent",
                                borderLeft: !n.isRead
                                  ? "2px solid var(--gold)"
                                  : "2px solid transparent",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = !n.isRead
                                  ? "rgba(201,168,76,0.04)"
                                  : "transparent";
                              }}
                            >
                              <p
                                className="text-sm mb-0.5 line-clamp-1"
                                style={{
                                  color: !n.isRead
                                    ? "var(--text-primary)"
                                    : "var(--text-secondary)",
                                  fontWeight: !n.isRead ? 500 : 400,
                                }}
                              >
                                {n.title}
                              </p>
                              {n.message && (
                                <p
                                  className="text-xs line-clamp-1"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  {n.message}
                                </p>
                              )}
                              <p
                                className="text-[10px] tracking-[0.2em] uppercase mt-1.5"
                                style={{ color: "var(--text-soft)" }}
                              >
                                {timeAgo(n.createdAt)}
                              </p>
                            </button>
                          ))
                        )}
                      </div>

                      <Link
                        to="/notifications"
                        onClick={() => setShowNotif(false)}
                        className="flex items-center justify-center gap-2 py-3 text-[10px] font-medium tracking-[0.25em] uppercase transition-colors"
                        style={{
                          color: "var(--gold)",
                          borderTop: "1px solid var(--border-subtle)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "rgba(201,168,76,0.05)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        Бүгдийг харах →
                      </Link>
                    </div>
                  )}
                </div>

                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu((p) => !p)}
                    className="flex items-center gap-2.5 px-3 py-1.5 transition-colors"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <div
                      className="w-8 h-8 flex items-center justify-center text-xs font-medium overflow-hidden"
                      style={{
                        border: "1px solid var(--gold)",
                        color: "var(--gold)",
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 14,
                      }}
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        initial
                      )}
                    </div>
                    <span
                      className="hidden sm:block text-xs font-light tracking-wider"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {displayName}
                    </span>
                    <svg
                      className={`w-3 h-3 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div
                      className="absolute right-0 top-12 w-60 z-50 animate-fadeIn"
                      style={{
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border-gold)",
                      }}
                    >
                      <div
                        className="px-5 py-4"
                        style={{ borderBottom: "1px solid var(--border-subtle)" }}
                      >
                        <p
                          className="text-sm leading-tight"
                          style={{
                            color: "var(--text-primary)",
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: 18,
                          }}
                        >
                          {fullName}
                        </p>
                        <p
                          className="text-[10px] tracking-[0.25em] uppercase mt-1.5"
                          style={{ color: "var(--gold)" }}
                        >
                          ◇ {ROLE_LABELS[user.role] || user.role}
                        </p>
                      </div>

                      <div className="py-1">
                        {userMenuItems.map(({ to, label }) => (
                          <Link
                            key={to}
                            to={to}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center justify-between px-5 py-2.5 text-xs tracking-wide transition-colors"
                            style={{ color: "var(--text-secondary)" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "var(--gold)";
                              e.currentTarget.style.background = "rgba(201,168,76,0.04)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--text-secondary)";
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <span>{label}</span>
                            {/* ⭐ ШИНЭ: "Зурвас" мөрөнд уншаагүй тоо */}
                            {to === "/messages" && msgUnread > 0 && (
                              <span
                                className="min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full text-[10px] font-semibold leading-none"
                                style={{ background: "var(--gold)", color: "#0A0A0A" }}
                              >
                                {msgUnread > 9 ? "9+" : msgUnread}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>

                      <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-5 py-3 text-xs tracking-wide transition-colors"
                          style={{ color: "#EF4444" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "rgba(239,68,68,0.06)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          Гарах
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setMobileOpen((p) => !p)}
                  className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1"
                  aria-label="Меню"
                >
                  <span
                    className={`block w-5 h-px transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-1.5" : ""}`}
                    style={{ background: "var(--text-primary)" }}
                  />
                  <span
                    className={`block w-5 h-px transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`}
                    style={{ background: "var(--text-primary)" }}
                  />
                  <span
                    className={`block w-5 h-px transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
                    style={{ background: "var(--text-primary)" }}
                  />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-ghost">
                  Нэвтрэх
                </Link>
                <Link
                  to="/register"
                  className="btn-gold"
                  style={{ padding: "11px 22px", fontSize: 10 }}
                >
                  Бүртгүүлэх
                </Link>
              </div>
            )}
          </div>
        </div>

        <div
          className="h-px"
          style={{
            background: "linear-gradient(90deg, transparent, var(--gold), transparent)",
            opacity: scrolled ? 0.3 : 0.15,
          }}
        />
      </nav>

      {mobileOpen && user && (
        <div
          className="md:hidden fixed inset-0 z-40 pt-20 animate-fadeIn"
          style={{ background: "var(--bg-primary)" }}
        >
          <div className="px-8 py-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-8" style={{ background: "var(--gold)" }} />
              <span
                className="text-[10px] tracking-[0.3em] uppercase"
                style={{ color: "var(--gold)" }}
              >
                Menu
              </span>
            </div>

            <div className="space-y-0 mb-8">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className="block py-5 transition-colors"
                  style={{
                    color: isActive(to) ? "var(--gold)" : "var(--text-secondary)",
                    borderBottom: "1px solid var(--border-subtle)",
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 24,
                    fontWeight: 300,
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="space-y-0 mb-8">
              {userMenuItems.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between py-3 text-sm tracking-wide"
                  style={{
                    color: "var(--text-secondary)",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <span>{label}</span>
                  {/* ⭐ ШИНЭ: mobile цэсэн дэх "Зурвас" badge */}
                  {to === "/messages" && msgUnread > 0 && (
                    <span
                      className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-semibold leading-none"
                      style={{ background: "var(--gold)", color: "#0A0A0A" }}
                    >
                      {msgUnread > 9 ? "9+" : msgUnread}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            <button
              onClick={handleLogout}
              className="block w-full text-left py-4 text-sm tracking-[0.2em] uppercase"
              style={{
                color: "#EF4444",
                borderTop: "1px solid rgba(239,68,68,0.3)",
                marginTop: 24,
              }}
            >
              Гарах
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;