import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

const STATUS_CONFIG = {
  available: { label: "Боломжтой",     color: "#16A34A", bg: "#F0FDF4" },
  rented:    { label: "Түрээслэгдсэн", color: "#2563EB", bg: "#EFF6FF" },
  inactive:  { label: "Идэвхгүй",      color: "#9CA3AF", bg: "#F9FAFB" },
};

function MyProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/properties/my");
        if (!cancelled) setProperties(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`"${title}" байрыг устгах уу?`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/properties/${id}`);
      setProperties(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Алдаа гарлаа");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingTop: 64 }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>Миний</p>
            <h1 className="font-display text-4xl font-light" style={{ color: "var(--ink)" }}>Байрнууд</h1>
          </div>
          <Link to="/add-property" className="btn-gold text-xs" style={{ padding: "10px 20px" }}>
            + Байр нэмэх
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
            <p className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Ачааллаж байна</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 bg-white border" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="font-display text-2xl font-light mb-2" style={{ color: "var(--ink)" }}>Байр байхгүй байна</p>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Та одоогоор байр нэмээгүй байна</p>
            <Link to="/add-property" className="btn-gold text-xs" style={{ padding: "10px 24px" }}>
              Байр нэмэх
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((property) => {
              const st = STATUS_CONFIG[property.status] || STATUS_CONFIG.available;
              const image = property.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";
              return (
                <div key={property._id} className="bg-white border overflow-hidden"
                  style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="flex">
                    <div className="w-1 flex-shrink-0" style={{ background: st.color }} />
                    <div className="flex flex-col md:flex-row flex-1">
                      <img src={image} alt={property.title}
                        className="w-full md:w-40 h-36 md:h-auto object-cover flex-shrink-0" />
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="font-medium text-sm" style={{ color: "var(--ink)" }}>
                              {property.title}
                            </h3>
                            <span className="text-xs px-3 py-1 font-medium flex-shrink-0"
                              style={{ background: st.bg, color: st.color }}>
                              {st.label}
                            </span>
                          </div>
                          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                            {property.location?.city}, {property.location?.district}
                          </p>
                          <div className="flex gap-4 mb-4">
                            <span className="font-display text-lg font-light" style={{ color: "var(--gold)" }}>
                              {property.monthlyRent?.toLocaleString()}₮/сар
                            </span>
                            <span className="text-xs self-end pb-0.5" style={{ color: "var(--text-soft)" }}>
                              {property.rooms} өрөө · {property.area} м²
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Link to={`/properties/${property._id}`}
                            className="btn-ghost text-xs" style={{ padding: "7px 16px" }}>
                            Харах
                          </Link>
                          <Link to={`/edit-property/${property._id}`}
                            className="btn-outline-gold text-xs" style={{ padding: "7px 16px" }}>
                            Засах
                          </Link>
                          <button
                            onClick={() => handleDelete(property._id, property.title)}
                            disabled={deletingId === property._id}
                            className="text-xs px-4 py-1.5 border transition-colors"
                            style={{ borderColor: "#FCA5A5", color: "#EF4444", background: "white" }}>
                            {deletingId === property._id ? "Устгаж байна..." : "Устгах"}
                          </button>
                        </div>
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

export default MyProperties;