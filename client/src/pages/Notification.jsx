import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "Дөнгөж сая";
  if (diff < 3600) return `${Math.floor(diff / 60)} минутын өмнө`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} цагийн өмнө`;
  return `${Math.floor(diff / 86400)} өдрийн өмнө`;
};

const TYPE_CONFIG = {
  application_received: { icon: "📨", color: "bg-blue-100 text-blue-700",   label: "Хүсэлт" },
  application_approved: { icon: "✅", color: "bg-green-100 text-green-700",  label: "Зөвшөөрөл" },
  application_rejected: { icon: "❌", color: "bg-red-100 text-red-600",      label: "Татгалзал" },
  general:              { icon: "🔔", color: "bg-gray-100 text-gray-600",    label: "Мэдэгдэл" },
};

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState("all"); // all | unread | read

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const res = await api.get("/api/notifications");
        if (!cancelled) setNotifications(res.data);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, []);

  const handleClick = async (notif) => {
    // Уншсан болгох
    if (!notif.isRead) {
      try {
        await api.put(`/api/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      } catch { /* silent */ }
    }
    if (notif.link) navigate(notif.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/api/notifications/mark-all-read", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch { /* silent */ }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Бүх мэдэгдлийг устгах уу?")) return;
    try {
      await api.delete("/api/notifications/all");
      setNotifications([]);
    } catch { /* silent */ }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read")   return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 pb-10">

        {/* Толгой */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🔔 Мэдэгдлүүд</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-indigo-600 mt-0.5">{unreadCount} уншаагүй мэдэгдэл байна</p>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium transition"
              >
                Бүгдийг уншсан болгох
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="text-xs px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg font-medium transition"
              >
                Бүгдийг устгах
              </button>
            )}
          </div>
        </div>

        {/* Шүүлтүүр */}
        {notifications.length > 0 && (
          <div className="flex gap-2 mb-4">
            {[
              { key: "all",    label: `Бүгд (${notifications.length})` },
              { key: "unread", label: `Уншаагүй (${unreadCount})` },
              { key: "read",   label: `Уншсан (${notifications.length - unreadCount})` },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`text-sm px-4 py-2 rounded-xl font-medium transition ${
                  filter === f.key
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Жагсаалт */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <div className="text-5xl mb-3">🔔</div>
            <p className="text-gray-500 font-medium">
              {filter === "unread" ? "Уншаагүй мэдэгдэл байхгүй" :
               filter === "read"   ? "Уншсан мэдэгдэл байхгүй"  :
                                     "Мэдэгдэл байхгүй байна"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((notif) => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.general;
              return (
                <div
                  key={notif._id}
                  onClick={() => handleClick(notif)}
                  className={`bg-white rounded-2xl shadow-sm p-4 cursor-pointer hover:shadow-md transition group border-l-4 ${
                    !notif.isRead ? "border-indigo-400" : "border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${cfg.color}`}>
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={`font-semibold text-sm ${!notif.isRead ? "text-gray-900" : "text-gray-600"}`}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                        {/* Устгах товч */}
                        <button
                          onClick={(e) => handleDelete(e, notif._id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition text-lg leading-none flex-shrink-0 mt-0.5"
                          title="Устгах"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-gray-400">{timeAgo(notif.createdAt)}</span>
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;