import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

const STATUS_CONFIG = {
  available: { label: "Боломжтой",     color: "#22C55E",         border: "rgba(34,197,94,0.25)"  },
  rented:    { label: "Түрээслэгдсэн", color: "var(--gold)",     border: "rgba(201,160,80,0.25)" },
  inactive:  { label: "Идэвхгүй",      color: "var(--text-soft)", border: "var(--border-dim)"    },
};

export default function MyProperties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get("/api/properties/my")
      .then(r => setProperties(r.data.properties || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`"${title}" байрыг устгах уу? Энэ үйлдлийг буцаах боломжгүй.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/api/properties/${id}`);
      setProperties(prev => prev.filter(p => p._id !== id));
    } catch { alert("Алдаа гарлаа"); }
    finally { setDeleting(null); }
  };

  const filtered = filter === "all" ? properties : properties.filter(p => p.status === filter);

  return (
    <div style={{ minHeight: "100vh", background: "var(--black)", paddingTop: 70 }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 48px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div className="flex items-center gap-4 mb-4">
            <div style={{ width: 32, height: 1, background: "var(--gold)" }} />
            <span style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--gold)" }}>
              Миний
            </span>
          </div>
          <div className="flex items-end justify-between">
            <h1 className="font-display" style={{ fontSize: 48, fontWeight: 300, color: "var(--white)" }}>Байрнуудад</h1>
            <Link to="/add-property" className="btn-gold" style={{ marginBottom: 8 }}>
              + Байр нэмэх
            </Link>
          </div>
        </div>

        {/* Filter tabs */}
        {properties.length > 0 && (
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-dim)", marginBottom: 28 }}>
            {[
              { key: "all",       label: `Бүгд (${properties.length})` },
              { key: "available", label: `Боломжтой (${properties.filter(p=>p.status==="available").length})` },
              { key: "rented",    label: `Түрээслэгдсэн (${properties.filter(p=>p.status==="rented").length})` },
              { key: "inactive",  label: `Идэвхгүй (${properties.filter(p=>p.status==="inactive").length})` },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{
                  padding: "10px 20px",
                  fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase",
                  background: "transparent", border: "none",
                  borderBottom: filter === f.key ? "1px solid var(--gold)" : "1px solid transparent",
                  color: filter === f.key ? "var(--gold)" : "var(--text-muted)",
                  cursor: "pointer", marginBottom: -1, transition: "all 0.2s",
                }}>
                {f.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 280, background: "var(--dark)", border: "1px solid var(--border-dim)", animation: "pulse 2s ease infinite" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "96px 0" }}>
            <div className="font-display" style={{ fontSize: 64, fontWeight: 300, color: "rgba(201,160,80,0.08)", marginBottom: 16 }}>◈</div>
            <p className="font-display" style={{ fontSize: 32, fontWeight: 300, color: "var(--text-soft)", marginBottom: 12 }}>
              {filter === "all" ? "Байр байхгүй" : "Энэ ангиллын байр байхгүй"}
            </p>
            {filter === "all" && (
              <Link to="/add-property" className="btn-gold" style={{ marginTop: 16 }}>
                Эхний байраа нэмэх →
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {filtered.map(property => {
              const sc = STATUS_CONFIG[property.status] || STATUS_CONFIG.inactive;
              const img = property.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";
              return (
                <div
                  key={property._id}
                  style={{
                    background: "var(--dark)",
                    border: "1px solid var(--border-dim)",
                    overflow: "hidden",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(201,160,80,0.2)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-dim)"}
                >
                  {/* Image */}
                  <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
                    <img
                      src={img}
                      alt={property.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.8)", transition: "transform 0.4s" }}
                      onMouseEnter={e => e.target.style.transform = "scale(1.04)"}
                      onMouseLeave={e => e.target.style.transform = "scale(1)"}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,8,8,0.5) 0%, transparent 50%)" }} />
                    <span style={{
                      position: "absolute", top: 12, right: 12,
                      fontFamily: "'Montserrat'", fontSize: 8, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase",
                      padding: "3px 10px", background: "rgba(8,8,8,0.8)", border: `1px solid ${sc.border}`, color: sc.color
                    }}>
                      {sc.label}
                    </span>
                    <span style={{
                      position: "absolute", bottom: 12, left: 12,
                      fontFamily: "'Montserrat'", fontSize: 9, color: "var(--gold)"
                    }}>
                      {property.rooms} өрөө
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ padding: "16px 20px" }}>
                    <h3 className="font-display line-clamp-1" style={{ fontSize: 18, fontWeight: 400, color: "var(--white)", marginBottom: 4 }}>
                      {property.title}
                    </h3>
                    <p style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
                      {property.location?.district}, {property.location?.city}
                    </p>
                    <div style={{ height: 1, background: "linear-gradient(to right, var(--gold), transparent)", opacity: 0.3, marginBottom: 12 }} />
                    <div className="flex items-center justify-between">
                      <span className="font-display" style={{ fontSize: 24, fontWeight: 300, color: "var(--white)" }}>
                        {property.monthlyRent?.toLocaleString()}₮
                        <span style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--text-soft)", marginLeft: 4 }}>/сар</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ padding: "0 20px 16px", display: "flex", gap: 8 }}>
                    <Link to={`/properties/${property._id}`} className="btn-ghost" style={{ fontSize: 9, padding: "8px 0", flex: 1, textAlign: "center", textDecoration: "none" }}>
                      Харах
                    </Link>
                    <Link to={`/edit-property/${property._id}`} className="btn-outline" style={{ fontSize: 9, padding: "8px 14px", textDecoration: "none" }}>
                      Засах
                    </Link>
                    <button
                      onClick={() => handleDelete(property._id, property.title)}
                      disabled={deleting === property._id}
                      className="btn-danger"
                      style={{ fontSize: 9, padding: "8px 14px" }}
                    >
                      {deleting === property._id ? "..." : "Устгах"}
                    </button>
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