import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

const ROLE_LABELS = {
  tenant:   { label: "Түрээслэгч",    cls: "bg-blue-100 text-blue-700"   },
  landlord: { label: "Түрээслүүлэгч", cls: "bg-green-100 text-green-700" },
  admin:    { label: "Админ",          cls: "bg-purple-100 text-purple-700"},
};

const STATUS_LABELS = {
  available: { label: "Боломжтой",    cls: "bg-green-100 text-green-700" },
  rented:    { label: "Түрээслэгдсэн",cls: "bg-blue-100 text-blue-700"   },
  inactive:  { label: "Идэвхгүй",     cls: "bg-gray-100 text-gray-500"   },
};

function StatCard({ icon, label, value, sub, color = "indigo" }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    green:  "bg-green-50 text-green-600",
    blue:   "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function AdminPanel() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const [tab, setTab]               = useState("stats"); // stats | users | properties | applications | payments
  const [stats, setStats]           = useState(null);
  const [users, setUsers]           = useState([]);
  const [properties, setProperties] = useState([]);
  const [applications, setApplications] = useState([]);
  const [payments, setPayments]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Admin биш бол redirect
  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/home");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (tab === "stats") {
          const res = await api.get("/api/admin/stats");
          setStats(res.data);
        } else if (tab === "users") {
          const res = await api.get("/api/admin/users", {
            params: { search, role: roleFilter },
          });
          setUsers(res.data);
        } else if (tab === "properties") {
          const res = await api.get("/api/admin/properties", {
            params: { search, status: statusFilter },
          });
          setProperties(res.data);
        } else if (tab === "applications") {
          const res = await api.get("/api/admin/applications");
          setApplications(res.data);
        } else if (tab === "payments") {
          const res = await api.get("/api/admin/payments");
          setPayments(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab, search, roleFilter, statusFilter]);

  const handleRoleChange = async (userId, role) => {
    if (!window.confirm(`Role-г "${role}" болгох уу?`)) return;
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role } : u));
    } catch { alert("Алдаа гарлаа"); }
  };

  const handleToggleBlock = async (userId, isBlocked, name) => {
    const action = isBlocked ? "идэвхжүүлэх" : "блоклох";
    if (!window.confirm(`"${name}" хэрэглэгчийг ${action} уу?`)) return;
    try {
      const res = await api.put(`/api/admin/users/${userId}/block`);
      setUsers((prev) =>
        prev.map((u) => u._id === userId ? { ...u, isBlocked: res.data.user.isBlocked } : u)
      );
    } catch { alert("Алдаа гарлаа"); }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`"${name}" хэрэглэгчийг устгах уу?`)) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch { alert("Алдаа гарлаа"); }
  };

  const handleDeleteProperty = async (propId, title) => {
    if (!window.confirm(`"${title}" байрыг устгах уу?`)) return;
    try {
      await api.delete(`/api/admin/properties/${propId}`);
      setProperties((prev) => prev.filter((p) => p._id !== propId));
    } catch { alert("Алдаа гарлаа"); }
  };

  const TABS = [
    { key: "stats",        label: "📊 Статистик"  },
    { key: "users",        label: "👥 Хэрэглэгч"  },
    { key: "properties",   label: "🏠 Байрнууд"    },
    { key: "applications", label: "📋 Хүсэлтүүд"  },
    { key: "payments",     label: "💳 Төлбөрүүд"   },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 pb-10">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl">⚙️</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500">Системийн удирдлага</p>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch(""); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                tab === t.key ? "bg-indigo-600 text-white shadow" : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow p-5 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <>
            {/* ====== STATS ====== */}
            {tab === "stats" && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon="👥" label="Нийт хэрэглэгч" value={stats.users.total}
                    sub={`${stats.users.tenants} түрээслэгч · ${stats.users.landlords} эзэмшигч`} color="indigo" />
                  <StatCard icon="🏠" label="Нийт байр" value={stats.properties.total}
                    sub={`${stats.properties.available} боломжтой · ${stats.properties.rented} түрээслэгдсэн`} color="blue" />
                  <StatCard icon="📋" label="Нийт хүсэлт" value={stats.applications.total}
                    sub={`${stats.applications.active} идэвхтэй гэрээ`} color="orange" />
                  <StatCard icon="💰" label="Нийт орлого" value={`${stats.payments.totalRevenue.toLocaleString()}₮`}
                    sub={`${stats.payments.paid} төлбөр төлөгдсөн`} color="green" />
                </div>

                {/* Дэлгэрэнгүй статистик */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl shadow p-5">
                    <h3 className="font-bold text-gray-700 mb-4">👥 Хэрэглэгчид</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Нийт</span>
                        <span className="font-bold">{stats.users.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-600">Түрээслэгч</span>
                        <span className="font-bold text-blue-600">{stats.users.tenants}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Түрээслүүлэгч</span>
                        <span className="font-bold text-green-600">{stats.users.landlords}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow p-5">
                    <h3 className="font-bold text-gray-700 mb-4">🏠 Байрнууд</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Нийт</span>
                        <span className="font-bold">{stats.properties.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Боломжтой</span>
                        <span className="font-bold text-green-600">{stats.properties.available}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-600">Түрээслэгдсэн</span>
                        <span className="font-bold text-blue-600">{stats.properties.rented}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow p-5">
                    <h3 className="font-bold text-gray-700 mb-4">💳 Төлбөр</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Нийт</span>
                        <span className="font-bold">{stats.payments.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Төлөгдсөн</span>
                        <span className="font-bold text-green-600">{stats.payments.paid}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-indigo-600">Нийт орлого</span>
                        <span className="font-bold text-indigo-600">{stats.payments.totalRevenue.toLocaleString()}₮</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ====== USERS ====== */}
            {tab === "users" && (
              <div>
                <div className="flex gap-3 mb-4">
                  <input type="text" placeholder="Нэр, имэйл, утас хайх..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white">
                    <option value="">Бүгд</option>
                    <option value="tenant">Түрээслэгч</option>
                    <option value="landlord">Түрээслүүлэгч</option>
                    <option value="admin">Админ</option>
                  </select>
                </div>
                <div className="bg-white rounded-2xl shadow overflow-hidden">
                  <div className="px-5 py-3 border-b bg-gray-50">
                    <p className="text-sm text-gray-500">Нийт {users.length} хэрэглэгч</p>
                  </div>
                  <div className="divide-y">
                    {users.map((u) => {
                      const role = ROLE_LABELS[u.role] || ROLE_LABELS.tenant;
                      return (
                        <div key={u._id} className="px-5 py-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                              {u.avatar
                                ? <img src={u.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                                : u.firstName?.[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className={`font-semibold text-sm truncate ${u.isBlocked ? "text-gray-400 line-through" : "text-gray-900"}`}>
                                  {u.firstName} {u.lastName}
                                </p>
                                {u.isBlocked && (
                                  <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                                    Блоклогдсон
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">{u.email} · {u.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${role.cls}`}>
                              {role.label}
                            </span>
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none bg-white"
                            >
                              <option value="tenant">Түрээслэгч</option>
                              <option value="landlord">Түрээслүүлэгч</option>
                              <option value="admin">Админ</option>
                            </select>
                              <button
                              onClick={() => handleToggleBlock(u._id, u.isBlocked, `${u.firstName} ${u.lastName}`)}
                              className={`text-xs px-2 py-1 rounded-lg transition ${
                                u.isBlocked
                                  ? "text-green-600 hover:bg-green-50"
                                  : "text-orange-500 hover:bg-orange-50"
                              }`}
                            >
                              {u.isBlocked ? "Идэвхжүүлэх" : "Блоклох"}
                            </button>
                            <button onClick={() => handleDeleteUser(u._id, `${u.firstName} ${u.lastName}`)}
                              className="text-xs text-red-400 hover:text-red-600 px-2 py-1 hover:bg-red-50 rounded-lg transition">
                              Устгах
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ====== PROPERTIES ====== */}
            {tab === "properties" && (
              <div>
                <div className="flex gap-3 mb-4">
                  <input type="text" placeholder="Байрны нэр, байршил хайх..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white">
                    <option value="">Бүгд</option>
                    <option value="available">Боломжтой</option>
                    <option value="rented">Түрээслэгдсэн</option>
                  </select>
                </div>
                <div className="bg-white rounded-2xl shadow overflow-hidden">
                  <div className="px-5 py-3 border-b bg-gray-50">
                    <p className="text-sm text-gray-500">Нийт {properties.length} байр</p>
                  </div>
                  <div className="divide-y">
                    {properties.map((p) => {
                      const status = STATUS_LABELS[p.status] || STATUS_LABELS.available;
                      const img = p.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";
                      return (
                        <div key={p._id} className="px-5 py-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img src={img} alt="" className="w-12 h-10 object-cover rounded-lg flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-gray-900 truncate">{p.title}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {p.location?.district}, {p.location?.city} · {p.monthlyRent?.toLocaleString()}₮/сар
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                Эзэн: {p.owner?.firstName} {p.owner?.lastName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}>
                              {status.label}
                            </span>
                            <button onClick={() => handleDeleteProperty(p._id, p.title)}
                              className="text-xs text-red-400 hover:text-red-600 px-2 py-1 hover:bg-red-50 rounded-lg transition">
                              Устгах
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ====== APPLICATIONS ====== */}
            {tab === "applications" && (
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-5 py-3 border-b bg-gray-50">
                  <p className="text-sm text-gray-500">Нийт {applications.length} хүсэлт</p>
                </div>
                <div className="divide-y">
                  {applications.map((a) => (
                    <div key={a._id} className="px-5 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            🏠 {a.property?.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            👤 {a.tenant?.firstName} {a.tenant?.lastName} → {a.landlord?.firstName} {a.landlord?.lastName}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {a.leaseMonths} сар · {a.totalRent?.toLocaleString()}₮
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            a.status === "approved" ? "bg-green-100 text-green-700" :
                            a.status === "rejected" ? "bg-red-100 text-red-600" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>{a.status}</span>
                          <span className="text-xs text-gray-400">{a.contractStatus}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ====== PAYMENTS ====== */}
            {tab === "payments" && (
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-5 py-3 border-b bg-gray-50">
                  <p className="text-sm text-gray-500">Нийт {payments.length} төлбөр</p>
                </div>
                <div className="divide-y">
                  {payments.map((p) => (
                    <div key={p._id} className="px-5 py-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {p.paymentNumber}-р төлбөр · {p.property?.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          👤 {p.tenant?.firstName} {p.tenant?.lastName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {p.totalAmount?.toLocaleString()}₮ · {p.dueDate ? new Date(p.dueDate).toLocaleDateString("mn-MN") : "—"}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        p.status === "paid"    ? "bg-green-100 text-green-700"  :
                        p.status === "overdue" ? "bg-red-100 text-red-600"      :
                        p.status === "urgent"  ? "bg-orange-100 text-orange-700":
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;