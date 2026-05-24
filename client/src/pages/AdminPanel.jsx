import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

const ROLE_LABELS   = { tenant: "Түрээслэгч", landlord: "Түрээслүүлэгч", admin: "Админ" };
const STATUS_LABELS = { available: "Боломжтой", rented: "Түрээслэгдсэн", inactive: "Идэвхгүй" };

function StatCard({ label, value, sub, color = "var(--gold)" }) {
  return (
    <div style={{ background: "var(--dark)", border: "1px solid var(--border-dim)", padding: 28 }}>
      <div className="font-display" style={{ fontSize: 48, fontWeight: 300, color, lineHeight: 1, marginBottom: 8 }}>{value}</div>
      <p style={{ fontFamily: "'Montserrat'", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: sub ? 4 : 0 }}>{label}</p>
      {sub && <p style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--text-soft)" }}>{sub}</p>}
    </div>
  );
}

function AdminPanel() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const [tab, setTab]           = useState("stats");
  const [stats, setStats]       = useState(null);
  const [users, setUsers]       = useState([]);
  const [properties, setProperties] = useState([]);
  const [applications, setApplications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => { if (!currentUser || currentUser.role !== "admin") navigate("/home"); }, [currentUser, navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (tab === "stats") { const res = await api.get("/api/admin/stats"); setStats(res.data); }
        else if (tab === "users") { const res = await api.get("/api/admin/users", { params: { search, role: roleFilter } }); setUsers(res.data); }
        else if (tab === "properties") { const res = await api.get("/api/admin/properties", { params: { search, status: statusFilter } }); setProperties(res.data); }
        else if (tab === "applications") { const res = await api.get("/api/admin/applications"); setApplications(res.data); }
        else if (tab === "payments") { const res = await api.get("/api/admin/payments"); setPayments(res.data); }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    load();
  }, [tab, search, roleFilter, statusFilter]);

  const handleRoleChange = async (userId, role) => {
    if (!window.confirm(`Role-г "${role}" болгох уу?`)) return;
    try { await api.put(`/api/admin/users/${userId}/role`, { role }); setUsers(prev => prev.map(u => u._id === userId ? { ...u, role } : u)); }
    catch { alert("Алдаа гарлаа"); }
  };
  const handleToggleBlock = async (userId, isBlocked, name) => {
    const action = isBlocked ? "идэвхжүүлэх" : "блоклох";
    if (!window.confirm(`"${name}" хэрэглэгчийг ${action} уу?`)) return;
    try { const res = await api.put(`/api/admin/users/${userId}/block`); setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBlocked: res.data.user.isBlocked } : u)); }
    catch { alert("Алдаа гарлаа"); }
  };
  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`"${name}" хэрэглэгчийг устгах уу?`)) return;
    try { await api.delete(`/api/admin/users/${userId}`); setUsers(prev => prev.filter(u => u._id !== userId)); }
    catch { alert("Алдаа гарлаа"); }
  };
  const handleDeleteProperty = async (propId, title) => {
    if (!window.confirm(`"${title}" байрыг устгах уу?`)) return;
    try { await api.delete(`/api/admin/properties/${propId}`); setProperties(prev => prev.filter(p => p._id !== propId)); }
    catch { alert("Алдаа гарлаа"); }
  };

  const TABS = [
    { key: "stats", label: "Статистик" },
    { key: "users", label: "Хэрэглэгч" },
    { key: "properties", label: "Байрнууд" },
    { key: "applications", label: "Хүсэлтүүд" },
    { key: "payments", label: "Төлбөрүүд" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--black)", paddingTop: 70 }}>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 48px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div className="flex items-center gap-4 mb-4">
            <div style={{ width: 32, height: 1, background: "var(--gold)" }} />
            <span style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--gold)" }}>Хянах самбар</span>
          </div>
          <h1 className="font-display" style={{ fontSize: 48, fontWeight: 300, color: "var(--white)" }}>Admin Panel</h1>
        </div>

        {/* Tab navigation */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-dim)", marginBottom: 32, gap: 0 }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch(""); }}
              style={{
                padding: "10px 24px",
                fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase",
                background: "transparent", border: "none",
                borderBottom: tab === t.key ? "1px solid var(--gold)" : "1px solid transparent",
                color: tab === t.key ? "var(--gold)" : "var(--text-muted)",
                cursor: "pointer", marginBottom: -1, transition: "all 0.2s",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: 120, background: "var(--dark)", border: "1px solid var(--border-dim)", animation: "pulse 2s ease infinite" }} />)}
          </div>
        ) : (
          <>
            {/* STATS */}
            {tab === "stats" && stats && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  <StatCard label="Нийт хэрэглэгч" value={stats.users.total} sub={`${stats.users.tenants} түрээслэгч · ${stats.users.landlords} эзэмшигч`} />
                  <StatCard label="Нийт байр" value={stats.properties.total} sub={`${stats.properties.available} боломжтой · ${stats.properties.rented} түрээслэгдсэн`} color="var(--white)" />
                  <StatCard label="Нийт хүсэлт" value={stats.applications.total} sub={`${stats.applications.active} идэвхтэй`} color="#22C55E" />
                  <StatCard label="Нийт орлого" value={`${(stats.payments.totalRevenue/1000000).toFixed(1)}M₮`} sub={`${stats.payments.paid} төлбөр`} color="var(--gold)" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[
                    { t: "Хэрэглэгчид", rows: [["Нийт", stats.users.total], ["Түрээслэгч", stats.users.tenants], ["Түрээслүүлэгч", stats.users.landlords]] },
                    { t: "Байрнууд", rows: [["Нийт", stats.properties.total], ["Боломжтой", stats.properties.available], ["Түрээслэгдсэн", stats.properties.rented]] },
                    { t: "Төлбөр", rows: [["Нийт", stats.payments.total], ["Төлөгдсөн", stats.payments.paid], ["Нийт орлого", `${stats.payments.totalRevenue?.toLocaleString()}₮`]] },
                  ].map(({ t, rows }) => (
                    <div key={t} style={{ background: "var(--dark)", border: "1px solid var(--border-dim)", padding: 24 }}>
                      <p style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 16 }}>{t}</p>
                      {rows.map(([k, v]) => (
                        <div key={k} className="flex justify-between" style={{ padding: "8px 0", borderBottom: "1px solid var(--border-dim)" }}>
                          <span style={{ fontFamily: "'Montserrat'", fontSize: 11, color: "var(--text-muted)" }}>{k}</span>
                          <span style={{ fontFamily: "'Montserrat'", fontSize: 11, fontWeight: 500, color: "var(--white)" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* USERS */}
            {tab === "users" && (
              <div>
                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  <input type="text" placeholder="Нэр, имэйл, утас хайх..." value={search} onChange={(e) => setSearch(e.target.value)} className="luxury-input" style={{ flex: 1 }} />
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="luxury-select" style={{ width: 160 }}>
                    <option value="">Бүгд</option>
                    <option value="tenant">Түрээслэгч</option>
                    <option value="landlord">Түрээслүүлэгч</option>
                    <option value="admin">Админ</option>
                  </select>
                </div>
                <div style={{ background: "var(--dark)", border: "1px solid var(--border-dim)", overflow: "hidden" }}>
                  <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-dim)" }}>
                    <p style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.15em", color: "var(--text-soft)" }}>Нийт {users.length} хэрэглэгч</p>
                  </div>
                  {users.map((u) => (
                    <div key={u._id} style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-dim)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <div style={{ width: 36, height: 36, background: "var(--dark-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)", fontFamily: "'Cormorant Garamond'", fontSize: 16, fontWeight: 400, flexShrink: 0, overflow: "hidden" }}>
                          {u.avatar ? <img src={u.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : u.firstName?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontFamily: "'Montserrat'", fontSize: 12, fontWeight: u.isBlocked ? 300 : 400, color: u.isBlocked ? "var(--text-soft)" : "var(--white)", textDecoration: u.isBlocked ? "line-through" : "none" }}>
                            {u.firstName} {u.lastName}
                            {u.isBlocked && <span style={{ fontSize: 8, letterSpacing: "0.15em", color: "#EF4444", marginLeft: 8, textDecoration: "none" }}>БЛОКЛОГДСОН</span>}
                          </p>
                          <p style={{ fontFamily: "'Montserrat'", fontSize: 10, color: "var(--text-soft)" }}>{u.email} · {u.phone}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <span style={{ fontFamily: "'Montserrat'", fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", padding: "3px 10px", border: "1px solid var(--border)", color: "var(--gold)" }}>
                          {ROLE_LABELS[u.role]}
                        </span>
                        <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)} className="luxury-select" style={{ fontSize: 10, padding: "5px 10px", width: "auto" }}>
                          <option value="tenant">Түрээслэгч</option>
                          <option value="landlord">Түрээслүүлэгч</option>
                          <option value="admin">Админ</option>
                        </select>
                        <button onClick={() => handleToggleBlock(u._id, u.isBlocked, `${u.firstName}`)} className="btn-ghost" style={{ padding: "5px 12px", fontSize: 9, color: u.isBlocked ? "#22C55E" : "#F97316" }}>
                          {u.isBlocked ? "Идэвхжүүлэх" : "Блоклох"}
                        </button>
                        <button onClick={() => handleDeleteUser(u._id, `${u.firstName}`)} className="btn-danger" style={{ padding: "5px 12px", fontSize: 9 }}>Устгах</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PROPERTIES */}
            {tab === "properties" && (
              <div>
                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  <input type="text" placeholder="Байрны нэр, байршил хайх..." value={search} onChange={(e) => setSearch(e.target.value)} className="luxury-input" style={{ flex: 1 }} />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="luxury-select" style={{ width: 160 }}>
                    <option value="">Бүгд</option>
                    <option value="available">Боломжтой</option>
                    <option value="rented">Түрээслэгдсэн</option>
                  </select>
                </div>
                <div style={{ background: "var(--dark)", border: "1px solid var(--border-dim)" }}>
                  <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-dim)" }}>
                    <p style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.15em", color: "var(--text-soft)" }}>Нийт {properties.length} байр</p>
                  </div>
                  {properties.map((p) => {
                    const img = p.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";
                    return (
                      <div key={p._id} style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-dim)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                          <img src={img} alt="" style={{ width: 56, height: 44, objectFit: "cover", flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontFamily: "'Montserrat'", fontSize: 12, color: "var(--white)" }} className="line-clamp-1">{p.title}</p>
                            <p style={{ fontFamily: "'Montserrat'", fontSize: 10, color: "var(--text-soft)" }}>{p.location?.district}, {p.location?.city} · {p.monthlyRent?.toLocaleString()}₮/сар</p>
                            <p style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--text-soft)" }}>Эзэн: {p.owner?.firstName} {p.owner?.lastName}</p>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontFamily: "'Montserrat'", fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", padding: "3px 10px", color: p.status === "available" ? "#22C55E" : "var(--gold)", border: `1px solid ${p.status === "available" ? "#22C55E30" : "var(--gold-dim)"}` }}>
                            {STATUS_LABELS[p.status]}
                          </span>
                          <button onClick={() => handleDeleteProperty(p._id, p.title)} className="btn-danger" style={{ padding: "5px 12px", fontSize: 9 }}>Устгах</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* APPLICATIONS */}
            {tab === "applications" && (
              <div style={{ background: "var(--dark)", border: "1px solid var(--border-dim)" }}>
                <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-dim)" }}>
                  <p style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.15em", color: "var(--text-soft)" }}>Нийт {applications.length} хүсэлт</p>
                </div>
                {applications.map((a) => (
                  <div key={a._id} style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-dim)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: "'Montserrat'", fontSize: 12, color: "var(--white)" }} className="line-clamp-1">{a.property?.title}</p>
                      <p style={{ fontFamily: "'Montserrat'", fontSize: 10, color: "var(--text-soft)" }}>{a.tenant?.firstName} {a.tenant?.lastName} → {a.landlord?.firstName} {a.landlord?.lastName}</p>
                      <p style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--text-soft)" }}>{a.leaseMonths} сар · {a.totalRent?.toLocaleString()}₮</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span style={{ fontFamily: "'Montserrat'", fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 10px", color: a.status === "approved" ? "#22C55E" : a.status === "rejected" ? "#EF4444" : "var(--gold)", border: "1px solid currentcolor", opacity: 0.7 }}>{a.status}</span>
                      <span style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--text-soft)" }}>{a.contractStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PAYMENTS */}
            {tab === "payments" && (
              <div style={{ background: "var(--dark)", border: "1px solid var(--border-dim)" }}>
                <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-dim)" }}>
                  <p style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.15em", color: "var(--text-soft)" }}>Нийт {payments.length} төлбөр</p>
                </div>
                {payments.map((p) => (
                  <div key={p._id} style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-dim)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: "'Montserrat'", fontSize: 12, color: "var(--white)" }} className="line-clamp-1">{p.paymentNumber}-р төлбөр · {p.property?.title}</p>
                      <p style={{ fontFamily: "'Montserrat'", fontSize: 10, color: "var(--text-soft)" }}>{p.tenant?.firstName} {p.tenant?.lastName}</p>
                      <p style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--text-soft)" }}>{p.totalAmount?.toLocaleString()}₮ · {p.dueDate ? new Date(p.dueDate).toLocaleDateString("mn-MN") : "—"}</p>
                    </div>
                    <span style={{ fontFamily: "'Montserrat'", fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 10px", color: p.status === "paid" ? "#22C55E" : p.status === "overdue" ? "#EF4444" : p.status === "urgent" ? "#F97316" : "var(--gold)", border: "1px solid currentcolor", opacity: 0.8, flexShrink: 0 }}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;