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
  application_received: { icon: "📨", color: "var(--gold)", label: "Хүсэлт" },
  application_approved: { icon: "✓",  color: "#22C55E", label: "Зөвшөөрөл" },
  application_rejected: { icon: "✕",  color: "#EF4444", label: "Татгалзал" },
  general:              { icon: "◈",  color: "var(--text-muted)", label: "Мэдэгдэл" },
};

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState("all");

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try { const res = await api.get("/api/notifications"); if (!cancelled) setNotifications(res.data); }
      catch { /* silent */ } finally { if (!cancelled) setLoading(false); }
    };
    fetch();
    return () => { cancelled = true; };
  }, []);

  const handleClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.put(`/api/notifications/${notif._id}/read`);
        setNotifications((prev) => prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n)));
      } catch { /* silent */ }
    }
    if (notif.link) navigate(notif.link);
  };

  const handleMarkAllRead = async () => {
    try { await api.put("/api/notifications/mark-all-read", {}); setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true }))); }
    catch { /* silent */ }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try { await api.delete(`/api/notifications/${id}`); setNotifications((prev) => prev.filter((n) => n._id !== id)); }
    catch { /* silent */ }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Бүх мэдэгдлийг устгах уу?")) return;
    try { await api.delete("/api/notifications/all"); setNotifications([]); }
    catch { /* silent */ }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read")   return n.isRead;
    return true;
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--black)", paddingTop: 70 }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 48px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div className="flex items-center gap-4 mb-4">
            <div style={{ width: 32, height: 1, background: "var(--gold)" }} />
            <span style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--gold)" }}>Системийн</span>
          </div>
          <div className="flex items-start justify-between">
            <h1 className="font-display" style={{ fontSize: 48, fontWeight: 300, color: "var(--white)" }}>Мэдэгдлүүд</h1>
            <div className="flex gap-3 mt-3">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="btn-ghost" style={{ padding: "8px 14px" }}>Бүгд уншсан</button>
              )}
              {notifications.length > 0 && (
                <button onClick={handleDeleteAll} className="btn-danger" style={{ padding: "8px 14px" }}>Бүгд устгах</button>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <p style={{ fontFamily: "'Montserrat'", fontSize: 11, color: "var(--gold)", marginTop: 8 }}>{unreadCount} уншаагүй мэдэгдэл</p>
          )}
        </div>

        {/* Filter tabs */}
        {notifications.length > 0 && (
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-dim)", marginBottom: 24 }}>
            {[
              { key: "all",    label: `Бүгд (${notifications.length})` },
              { key: "unread", label: `Уншаагүй (${unreadCount})` },
              { key: "read",   label: `Уншсан (${notifications.length - unreadCount})` },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "10px 20px",
                  fontFamily: "'Montserrat'",
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  background: "transparent",
                  border: "none",
                  borderBottom: filter === f.key ? "1px solid var(--gold)" : "1px solid transparent",
                  color: filter === f.key ? "var(--gold)" : "var(--text-muted)",
                  cursor: "pointer",
                  marginBottom: -1,
                  transition: "all 0.2s",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 80, background: "var(--dark)", border: "1px solid var(--border-dim)", animation: "pulse 2s ease infinite" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 300, color: "rgba(201,160,80,0.15)", marginBottom: 16 }}>◈</div>
            <p style={{ fontFamily: "'Montserrat'", fontSize: 12, color: "var(--text-soft)" }}>
              {filter === "unread" ? "Уншаагүй мэдэгдэл байхгүй" : filter === "read" ? "Уншсан мэдэгдэл байхгүй" : "Мэдэгдэл байхгүй байна"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {filtered.map((notif) => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.general;
              return (
                <div
                  key={notif._id}
                  onClick={() => handleClick(notif)}
                  className="group"
                  style={{
                    background: !notif.isRead ? "rgba(201,160,80,0.04)" : "var(--dark)",
                    border: "1px solid",
                    borderColor: !notif.isRead ? "rgba(201,160,80,0.15)" : "var(--border-dim)",
                    padding: "18px 20px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    gap: 16,
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(201,160,80,0.25)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = !notif.isRead ? "rgba(201,160,80,0.15)" : "var(--border-dim)"}
                >
                  {/* Icon */}
                  <div style={{ width: 36, height: 36, border: "1px solid", borderColor: cfg.color + "30", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: cfg.color, fontSize: 14 }}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-start justify-between gap-3">
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontFamily: "'Montserrat'", fontSize: 12, fontWeight: !notif.isRead ? 500 : 400, color: !notif.isRead ? "var(--white)" : "var(--text-muted)", marginBottom: 4 }}>
                          {notif.title}
                        </p>
                        <p style={{ fontFamily: "'Montserrat'", fontSize: 11, fontWeight: 300, color: "var(--text-soft)", lineHeight: 1.6 }} className="line-clamp-1">
                          {notif.message}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, notif._id)}
                        style={{ color: "var(--text-soft)", background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1, opacity: 0, transition: "opacity 0.2s", flexShrink: 0 }}
                        className="group-hover:opacity-100"
                        onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = "#EF4444"; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = 0; e.currentTarget.style.color = "var(--text-soft)"; }}
                      >
                        ×
                      </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                      <span style={{ fontFamily: "'Montserrat'", fontSize: 8, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: cfg.color, background: cfg.color + "15", padding: "2px 8px" }}>
                        {cfg.label}
                      </span>
                      <span style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--text-soft)" }}>{timeAgo(notif.createdAt)}</span>
                      {!notif.isRead && <span style={{ width: 4, height: 4, background: "var(--gold)", borderRadius: "50%" }} />}
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