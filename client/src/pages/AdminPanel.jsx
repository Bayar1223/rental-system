import { useState, useEffect, useMemo } from "react";
import api from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=400&q=70";

const ROLES = [
  { v: "tenant", label: "Түрээслэгч" },
  { v: "landlord", label: "Байрны эзэн" },
  { v: "admin", label: "Админ" },
];

const ROLE_COLORS = {
  tenant: "#C9A84C",
  landlord: "#10B981",
  admin: "#EF4444",
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMNT(n) {
  return new Intl.NumberFormat("mn-MN").format(n || 0);
}

function AdminPanel() {
  const navigate = useNavigate();
  const me = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "null"),
    []
  );

  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [propSearch, setPropSearch] = useState("");
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    if (!me) {
      navigate("/login");
      return;
    }
    if (me.role !== "admin") {
      navigate("/home");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [uRes, pRes] = await Promise.all([
          api.get("/api/admin/users"),
          api.get("/api/admin/properties"),
        ]);
        if (cancelled) return;
        setUsers(uRes.data || []);
        setProperties(pRes.data || []);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Татаж чадсангүй");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [me, navigate]);

  // ── User actions ──
  const handleRoleChange = async (userId, newRole) => {
    if (userId === me._id) {
      alert("Та өөрийн үүргийг өөрчилж чадахгүй");
      return;
    }
    if (!confirm(`Үүргийг "${newRole}" болгох уу?`)) return;
    setActioningId(userId);
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
    );
    try {
      await api.put(`/api/admin/users/${userId}`, { role: newRole });
    } catch (err) {
      alert(err.response?.data?.message || "Алдаа");
    } finally {
      setActioningId(null);
    }
  };

  const handleToggleBlock = async (userId, currentlyBlocked) => {
    if (userId === me._id) {
      alert("Та өөрийгөө хориглож чадахгүй");
      return;
    }
    const action = currentlyBlocked ? "сэргээх" : "хориглох";
    if (!confirm(`Энэ хэрэглэгчийг ${action} уу?`)) return;
    setActioningId(userId);
    setUsers((prev) =>
      prev.map((u) =>
        u._id === userId ? { ...u, isBlocked: !currentlyBlocked } : u
      )
    );
    try {
      await api.put(`/api/admin/users/${userId}`, {
        isBlocked: !currentlyBlocked,
      });
    } catch (err) {
      alert(err.response?.data?.message || "Алдаа");
    } finally {
      setActioningId(null);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (userId === me._id) {
      alert("Та өөрийгөө устгаж чадахгүй");
      return;
    }
    if (
      !confirm(
        `"${userName}" хэрэглэгчийг устгахдаа итгэлтэй байна уу? Энэ үйлдэл буцаагдахгүй.`
      )
    )
      return;
    setActioningId(userId);
    const original = users;
    setUsers((prev) => prev.filter((u) => u._id !== userId));
    try {
      await api.delete(`/api/admin/users/${userId}`);
    } catch (err) {
      alert(err.response?.data?.message || "Устгаж чадсангүй");
      setUsers(original);
    } finally {
      setActioningId(null);
    }
  };

  // ── Property actions ──
  const handleDeleteProperty = async (propId, title) => {
    if (!confirm(`"${title}" байрыг устгах уу?`)) return;
    setActioningId(propId);
    const original = properties;
    setProperties((prev) => prev.filter((p) => p._id !== propId));
    try {
      await api.delete(`/api/admin/properties/${propId}`);
    } catch (err) {
      alert(err.response?.data?.message || "Устгаж чадсангүй");
      setProperties(original);
    } finally {
      setActioningId(null);
    }
  };

  // ── Filters ──
  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const q = userSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q)
    );
  }, [users, userSearch]);

  const filteredProperties = useMemo(() => {
    if (!propSearch) return properties;
    const q = propSearch.toLowerCase();
    return properties.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.district?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p.owner?.name?.toLowerCase().includes(q)
    );
  }, [properties, propSearch]);

  // Stats
  const stats = useMemo(
    () => ({
      users: users.length,
      blocked: users.filter((u) => u.isBlocked).length,
      properties: properties.length,
      available: properties.filter((p) => p.status === "available").length,
    }),
    [users, properties]
  );

  return (
    <div
      className="min-h-screen pt-20"
      style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-8" style={{ background: "#C9A84C" }} />
          <span
            className="text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "#C9A84C" }}
          >
            Administration
          </span>
        </div>
        <h1
          className="font-light text-white leading-[1] tracking-tight"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(40px, 5vw, 64px)",
          }}
        >
          Админ<br />
          <em style={{ color: "#C9A84C", fontStyle: "italic" }}>
            самбар
          </em>
        </h1>
      </header>

      {/* Stats */}
      {!loading && (
        <section className="max-w-7xl mx-auto px-6 lg:px-12 mb-10">
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            style={{ border: "1px solid rgba(201,168,76,0.15)" }}
          >
            {[
              { label: "Нийт хэрэглэгч", value: stats.users, color: "#C9A84C" },
              { label: "Хориглосон", value: stats.blocked, color: "#EF4444" },
              { label: "Нийт байр", value: stats.properties, color: "#C9A84C" },
              { label: "Боломжтой", value: stats.available, color: "#10B981" },
            ].map((s, i) => (
              <div
                key={s.label}
                className="p-6"
                style={{
                  borderRight:
                    i < 3
                      ? "1px solid rgba(201,168,76,0.08)"
                      : "none",
                }}
              >
                <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-2">
                  {s.label}
                </div>
                <div
                  className="font-light leading-none"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 36,
                    color: s.color,
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tabs */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 mb-8">
        <div
          className="flex gap-1"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          {[
            { v: "users", label: "Хэрэглэгчид", count: stats.users },
            { v: "properties", label: "Байр", count: stats.properties },
          ].map((t) => (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              className="px-6 py-4 text-[10px] tracking-[0.25em] uppercase transition-colors flex items-center gap-2 relative"
              style={{
                color: tab === t.v ? "#C9A84C" : "rgba(255,255,255,0.5)",
              }}
            >
              {t.label}
              <span
                className="inline-flex items-center justify-center min-w-5 px-1.5 text-[10px]"
                style={{
                  background:
                    tab === t.v ? "#C9A84C" : "rgba(255,255,255,0.05)",
                  color: tab === t.v ? "#0A0A0A" : "rgba(255,255,255,0.5)",
                }}
              >
                {t.count}
              </span>
              {tab === t.v && (
                <div
                  className="absolute bottom-0 left-0 right-0"
                  style={{ height: 1, background: "#C9A84C" }}
                />
              )}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <section className="max-w-7xl mx-auto px-6 lg:px-12 mb-6">
          <div
            className="p-4 flex items-start gap-3"
            style={{
              background: "rgba(239,68,68,0.08)",
              borderLeft: "2px solid #EF4444",
            }}
          >
            <span style={{ color: "#EF4444" }}>✕</span>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </section>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 pb-20">
        {tab === "users" ? (
          <>
            {/* Search */}
            <div
              className="flex items-center gap-4 px-5 py-4 mb-6"
              style={{
                background: "#141414",
                border: "1px solid rgba(201,168,76,0.15)",
              }}
            >
              <span style={{ color: "#C9A84C", fontSize: 18 }}>◇</span>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Нэр, имэйл, утсаар хайх..."
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
              />
              {userSearch && (
                <button
                  onClick={() => setUserSearch("")}
                  className="text-[10px] tracking-widest uppercase text-white/40 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {loading ? (
              <LoadingList />
            ) : filteredUsers.length === 0 ? (
              <EmptyState
                title="Хэрэглэгч олдсонгүй"
                body={
                  userSearch
                    ? "Хайлтанд таарсан хэрэглэгч байхгүй."
                    : "Систем дээр хэрэглэгч бүртгэгдээгүй."
                }
              />
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((u) => (
                  <UserRow
                    key={u._id}
                    user={u}
                    isMe={u._id === me._id}
                    onRoleChange={handleRoleChange}
                    onToggleBlock={handleToggleBlock}
                    onDelete={handleDeleteUser}
                    actioning={actioningId === u._id}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Search */}
            <div
              className="flex items-center gap-4 px-5 py-4 mb-6"
              style={{
                background: "#141414",
                border: "1px solid rgba(201,168,76,0.15)",
              }}
            >
              <span style={{ color: "#C9A84C", fontSize: 18 }}>◇</span>
              <input
                type="text"
                value={propSearch}
                onChange={(e) => setPropSearch(e.target.value)}
                placeholder="Гарчиг, дүүрэг, хаяг, эзэмшигчээр хайх..."
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
              />
              {propSearch && (
                <button
                  onClick={() => setPropSearch("")}
                  className="text-[10px] tracking-widest uppercase text-white/40 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {loading ? (
              <LoadingList />
            ) : filteredProperties.length === 0 ? (
              <EmptyState
                title="Байр олдсонгүй"
                body={
                  propSearch
                    ? "Хайлтанд таарсан байр байхгүй."
                    : "Систем дээр байр бүртгэгдээгүй."
                }
              />
            ) : (
              <div className="space-y-2">
                {filteredProperties.map((p) => (
                  <PropertyRow
                    key={p._id}
                    property={p}
                    onDelete={handleDeleteProperty}
                    actioning={actioningId === p._id}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ── User row ──
function UserRow({ user, isMe, onRoleChange, onToggleBlock, onDelete, actioning }) {
  const roleColor = ROLE_COLORS[user.role] || "#C9A84C";
  const initial = (user.name || "?").charAt(0).toUpperCase();
  const isBlocked = user.isBlocked;

  return (
    <div
      className="grid grid-cols-12 gap-4 p-4 items-center transition-all duration-300"
      style={{
        background: isBlocked ? "rgba(239,68,68,0.03)" : "#141414",
        border: `1px solid ${
          isBlocked ? "rgba(239,68,68,0.2)" : isMe ? "#C9A84C" : "rgba(201,168,76,0.1)"
        }`,
        opacity: actioning ? 0.6 : 1,
      }}
    >
      {/* Avatar + name */}
      <div className="col-span-12 md:col-span-4 flex items-center gap-3">
        <div
          className="w-11 h-11 flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{
            background: "rgba(201,168,76,0.12)",
            color: "#C9A84C",
            border: isBlocked ? "1px solid rgba(239,68,68,0.4)" : "none",
          }}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 18,
              }}
            >
              {initial}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white truncate">{user.name}</span>
            {isMe && (
              <span
                className="text-[9px] tracking-[0.25em] uppercase px-1.5 py-0.5"
                style={{
                  background: "#C9A84C",
                  color: "#0A0A0A",
                }}
              >
                Та
              </span>
            )}
          </div>
          <div className="text-xs text-white/45 truncate">
            {user.email}
            {user.phone && (
              <>
                <span className="mx-2 text-white/20">·</span>
                {user.phone}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Role select */}
      <div className="col-span-6 md:col-span-2">
        <select
          value={user.role}
          onChange={(e) => onRoleChange(user._id, e.target.value)}
          disabled={isMe || actioning}
          className="w-full bg-transparent text-xs py-2 px-3 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            border: `1px solid ${roleColor}40`,
            color: roleColor,
            colorScheme: "dark",
          }}
        >
          {ROLES.map((r) => (
            <option key={r.v} value={r.v} style={{ background: "#141414" }}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div className="col-span-6 md:col-span-2">
        <StatusPill
          label={isBlocked ? "Хориглосон" : "Идэвхтэй"}
          color={isBlocked ? "#EF4444" : "#10B981"}
        />
      </div>

      {/* Joined */}
      <div className="hidden md:block md:col-span-2 text-xs text-white/45">
        {formatDate(user.createdAt)}
      </div>

      {/* Actions */}
      <div className="col-span-12 md:col-span-2 flex gap-2 justify-end">
        <button
          onClick={() => onToggleBlock(user._id, isBlocked)}
          disabled={isMe || actioning}
          className="px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            border: `1px solid ${isBlocked ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.4)"}`,
            color: isBlocked ? "#10B981" : "#F59E0B",
          }}
        >
          {isBlocked ? "Сэргээх" : "Хориглох"}
        </button>
        <button
          onClick={() => onDelete(user._id, user.name)}
          disabled={isMe || actioning}
          className="px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase text-red-300 hover:text-red-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ border: "1px solid rgba(239,68,68,0.4)" }}
        >
          Устгах
        </button>
      </div>
    </div>
  );
}

// ── Property row ──
function PropertyRow({ property, onDelete, actioning }) {
  const cover = property.photos?.[0] || PLACEHOLDER;
  const isAvailable = property.status === "available";

  return (
    <div
      className="grid grid-cols-12 gap-4 p-4 items-center transition-all duration-300"
      style={{
        background: "#141414",
        border: "1px solid rgba(201,168,76,0.1)",
        opacity: actioning ? 0.6 : 1,
      }}
    >
      <Link
        to={`/property/${property._id}`}
        className="col-span-3 md:col-span-1 block relative overflow-hidden"
        style={{
          aspectRatio: "1/1",
          border: "1px solid rgba(201,168,76,0.15)",
        }}
      >
        <img
          src={cover}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.88)" }}
        />
      </Link>

      <div className="col-span-9 md:col-span-4">
        <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-1">
          {property.district || "—"}
        </div>
        <h4
          className="font-light text-white leading-tight"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 18,
          }}
        >
          {property.title}
        </h4>
        <p className="text-xs text-white/45 mt-1 truncate">
          {property.address}
        </p>
      </div>

      <div className="hidden md:block md:col-span-2 text-xs text-white/55">
        <div className="text-[9px] tracking-[0.25em] uppercase text-white/40 mb-1">
          Эзэмшигч
        </div>
        {property.owner?.name || "—"}
      </div>

      <div className="col-span-6 md:col-span-2">
        <div
          className="font-light"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: "#C9A84C",
            fontSize: 18,
          }}
        >
          {formatMNT(property.price)}₮
        </div>
      </div>

      <div className="col-span-6 md:col-span-1">
        <StatusPill
          label={isAvailable ? "Боломжтой" : "Түрээслэгдсэн"}
          color={isAvailable ? "#10B981" : "#888"}
        />
      </div>

      <div className="col-span-12 md:col-span-2 flex gap-2 justify-end">
        <Link
          to={`/property/${property._id}`}
          className="px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase text-white/60 hover:text-white transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.12)" }}
        >
          Үзэх
        </Link>
        <button
          onClick={() => onDelete(property._id, property.title)}
          disabled={actioning}
          className="px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase text-red-300 hover:text-red-200 transition-colors disabled:opacity-30"
          style={{ border: "1px solid rgba(239,68,68,0.4)" }}
        >
          Устгах
        </button>
      </div>
    </div>
  );
}

function StatusPill({ label, color }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] tracking-[0.2em] uppercase"
      style={{
        background: `${color}15`,
        color,
        border: `1px solid ${color}50`,
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </div>
  );
}

function LoadingList() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-12 gap-4 p-4 animate-pulse items-center"
          style={{
            background: "#141414",
            border: "1px solid rgba(201,168,76,0.06)",
          }}
        >
          <div
            className="col-span-1 h-11 w-11"
            style={{ background: "rgba(255,255,255,0.04)" }}
          />
          <div className="col-span-11 space-y-2">
            <div
              className="h-4 w-1/3"
              style={{ background: "rgba(255,255,255,0.07)" }}
            />
            <div
              className="h-3 w-2/3"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, body }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-20 px-6"
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
        className="font-light text-white mb-2"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 26,
        }}
      >
        {title}
      </h3>
      <p className="text-sm text-white/50 max-w-md">{body}</p>
    </div>
  );
}

export default AdminPanel;