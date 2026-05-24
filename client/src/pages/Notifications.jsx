import { useState, useEffect, useMemo } from "react";
import api from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";

const TYPE_META = {
  info: { color: "#C9A84C", icon: "◇" },
  success: { color: "#10B981", icon: "◆" },
  warning: { color: "#F59E0B", icon: "▲" },
  error: { color: "#EF4444", icon: "✕" },
  payment: { color: "#C9A84C", icon: "◇" },
  contract: { color: "#C9A84C", icon: "◇" },
  application: { color: "#C9A84C", icon: "◇" },
};

const FILTER_TABS = [
  { v: "all", label: "Бүгд" },
  { v: "unread", label: "Уншаагүй" },
  { v: "read", label: "Уншсан" },
];

function timeAgo(date) {
  if (!date) return "";
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return "Дөнгөж сая";
  if (min < 60) return `${min} мин өмнө`;
  if (hr < 24) return `${hr} цаг өмнө`;
  if (day < 7) return `${day} өдөр өмнө`;
  return d.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Notifications() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
      navigate("/login");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        // Navbar-тай ижил endpoint ашиглах (/api/notifications)
        // /api/notifications/me нь сервэрт байхгүй учир 404 буцаах
        const res = await api.get("/api/notifications");
        if (cancelled) return;
        const raw = res.data?.notifications || res.data || [];
        setNotifs(Array.isArray(raw) ? raw : []);
      } catch (err) {
        if (cancelled) return;
        // Сервэрт endpoint байхгүй бол хоосон жагсаалт харуулна
        const status = err.response?.status;
        if (status === 404) {
          setNotifs([]);
        } else {
          setError(err.response?.data?.message || "Татаж чадсангүй");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleMarkRead = async (id) => {
    setNotifs((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
    try {
      await api.patch(`/api/notifications/${id}/read`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!confirm("Бүх мэдэгдлийг уншсан гэж тэмдэглэх үү?")) return;
    setActioning(true);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.patch("/api/notifications/read-all");
    } catch (err) {
      alert(err.response?.data?.message || "Алдаа гарлаа");
    } finally {
      setActioning(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Энэ мэдэгдлийг устгах уу?")) return;
    const original = notifs;
    setNotifs((prev) => prev.filter((n) => n._id !== id));
    try {
      await api.delete(`/api/notifications/${id}`);
    } catch (err) {
      alert(err.response?.data?.message || "Устгаж чадсангүй");
      setNotifs(original);
    }
  };

  const filtered = useMemo(() => {
    if (filter === "all") return notifs;
    if (filter === "unread") return notifs.filter((n) => !n.read);
    return notifs.filter((n) => n.read);
  }, [notifs, filter]);

  const counts = useMemo(() => ({
    all: notifs.length,
    unread: notifs.filter((n) => !n.read).length,
    read: notifs.filter((n) => n.read).length,
  }), [notifs]);

  return (
    <div
      className="min-h-screen pt-20"
      style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Header */}
      <header className="max-w-4xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-8" style={{ background: "#C9A84C" }} />
          <span
            className="text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "#C9A84C" }}
          >
            Notifications
          </span>
        </div>
        <div className="flex items-end justify-between gap-6">
          <h1
            className="font-light text-white leading-[1] tracking-tight"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(40px, 5vw, 64px)",
            }}
          >
            Мэдэгдэл<br />
            <em style={{ color: "#C9A84C", fontStyle: "italic" }}>
              хүлээн авах
            </em>
          </h1>

          {counts.unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={actioning}
              className="text-[10px] tracking-[0.25em] uppercase transition-colors disabled:opacity-50"
              style={{ color: "#C9A84C" }}
            >
              ◇ Бүгдийг уншсан болгох
            </button>
          )}
        </div>
      </header>

      {/* Filter tabs */}
      <section className="max-w-4xl mx-auto px-6 lg:px-12 mb-8">
        <div
          className="flex flex-wrap gap-1 overflow-x-auto"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.v}
              onClick={() => setFilter(tab.v)}
              className="px-5 py-4 text-[10px] tracking-[0.25em] uppercase transition-all duration-300 flex items-center gap-2 whitespace-nowrap relative"
              style={{
                color:
                  filter === tab.v ? "#C9A84C" : "rgba(255,255,255,0.5)",
              }}
            >
              {tab.label}
              <span
                className="inline-flex items-center justify-center min-w-5 px-1.5 text-[10px]"
                style={{
                  background:
                    filter === tab.v
                      ? "#C9A84C"
                      : "rgba(255,255,255,0.05)",
                  color: filter === tab.v ? "#0A0A0A" : "rgba(255,255,255,0.5)",
                }}
              >
                {counts[tab.v]}
              </span>
              {filter === tab.v && (
                <div
                  className="absolute bottom-0 left-0 right-0"
                  style={{ height: 1, background: "#C9A84C" }}
                />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 lg:px-12 pb-20">
        {error && (
          <div
            className="mb-6 p-4 flex items-start gap-3"
            style={{
              background: "rgba(239,68,68,0.08)",
              borderLeft: "2px solid #EF4444",
            }}
          >
            <span style={{ color: "#EF4444" }}>✕</span>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {loading ? (
          <LoadingList />
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="space-y-2">
            {filtered.map((n) => (
              <NotificationItem
                key={n._id}
                notif={n}
                onRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function NotificationItem({ notif, onRead, onDelete }) {
  const meta = TYPE_META[notif.type] || TYPE_META.info;
  const handleClick = () => {
    if (!notif.read) onRead(notif._id);
  };

  const content = (
    <div
      onClick={handleClick}
      className="grid grid-cols-12 gap-4 p-5 transition-all duration-300 cursor-pointer group"
      style={{
        background: notif.read ? "transparent" : "#141414",
        borderLeft: notif.read
          ? "2px solid transparent"
          : `2px solid ${meta.color}`,
        border: notif.read
          ? "1px solid rgba(255,255,255,0.04)"
          : `1px solid rgba(201,168,76,0.15)`,
        borderLeftWidth: notif.read ? "1px" : "2px",
        borderLeftColor: notif.read ? "rgba(255,255,255,0.04)" : meta.color,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor =
          "rgba(201,168,76,0.35)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = notif.read
          ? "rgba(255,255,255,0.04)"
          : "rgba(201,168,76,0.15)")
      }
    >
      {/* Icon */}
      <div className="col-span-1 flex items-start justify-center pt-1">
        <div
          className="w-9 h-9 flex items-center justify-center"
          style={{
            background: `${meta.color}15`,
            color: meta.color,
            border: `1px solid ${meta.color}40`,
          }}
        >
          {meta.icon}
        </div>
      </div>

      {/* Body */}
      <div className="col-span-9">
        <div className="flex items-start gap-2 mb-1">
          {!notif.read && (
            <span
              className="inline-block w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
              style={{ background: "#C9A84C" }}
            />
          )}
          <h4
            className={`leading-snug ${
              notif.read ? "text-white/70" : "text-white"
            }`}
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 20,
              fontWeight: notif.read ? 300 : 400,
            }}
          >
            {notif.title || "Мэдэгдэл"}
          </h4>
        </div>
        {notif.message && (
          <p className="text-sm text-white/55 mt-1 leading-relaxed">
            {notif.message}
          </p>
        )}
        <div className="text-[10px] tracking-[0.2em] uppercase text-white/30 mt-3">
          {timeAgo(notif.createdAt)}
        </div>
      </div>

      {/* Actions */}
      <div className="col-span-2 flex flex-col items-end gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notif._id);
          }}
          className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Устгах"
        >
          ✕
        </button>
        {notif.link && (
          <span
            className="text-[10px] tracking-[0.25em] uppercase opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "#C9A84C" }}
          >
            Үзэх →
          </span>
        )}
      </div>
    </div>
  );

  return notif.link ? (
    <Link to={notif.link} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

function LoadingList() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-12 gap-4 p-5 animate-pulse"
          style={{
            background: "#141414",
            border: "1px solid rgba(201,168,76,0.06)",
          }}
        >
          <div
            className="col-span-1 h-9 w-9"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
          <div className="col-span-11 space-y-2">
            <div
              className="h-4 w-2/3"
              style={{ background: "rgba(255,255,255,0.08)" }}
            />
            <div
              className="h-3 w-full"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
            <div
              className="h-2 w-20 mt-2"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ filter }) {
  const messages = {
    all: "Танд одоогоор мэдэгдэл алга",
    unread: "Уншаагүй мэдэгдэл байхгүй",
    read: "Уншсан мэдэгдэл байхгүй",
  };
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-24 px-6"
      style={{
        border: "1px solid rgba(201,168,76,0.15)",
        background: "rgba(201,168,76,0.02)",
      }}
    >
      <div
        className="w-14 h-14 mb-6 flex items-center justify-center"
        style={{ border: "1px solid #C9A84C" }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            background: "#C9A84C",
            transform: "rotate(45deg)",
          }}
        />
      </div>
      <h3
        className="font-light text-white"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 28,
        }}
      >
        {messages[filter]}
      </h3>
    </div>
  );
}

export default Notifications;