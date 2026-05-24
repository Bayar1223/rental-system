import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import PropertyCard from "../components/PropertyCard";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const districts = ["Багануур","Багахангай","Баянгол","Баянзүрх","Налайх","Сонгинохайрхан","Сүхбаатар","Хан-Уул","Чингэлтэй"];
const DISTRICT_COORDS = {
  "Баянзүрх":[47.9184,106.9612],"Баянгол":[47.9077,106.8432],"Сүхбаатар":[47.9195,106.9077],
  "Чингэлтэй":[47.9268,106.8782],"Хан-Уул":[47.8748,106.8815],"Сонгинохайрхан":[47.9268,106.7782],
  "Налайх":[47.7577,107.2682],"Багануур":[47.7121,108.2821],"Багахангай":[47.8241,106.9121],
};
const getCoords = (p) => (p.latitude && p.longitude) ? [p.latitude, p.longitude] : (DISTRICT_COORDS[p.location?.district] || null);

function Home() {
  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("");
  const [rooms, setRooms] = useState("");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: viewMode === "map" ? 50 : 9 };
      if (search) params.search = search;
      if (district) params.district = district;
      if (rooms) params.rooms = rooms;
      if (minRent) params.minRent = minRent;
      if (maxRent) params.maxRent = maxRent;
      const res = await api.get("/api/properties", { params });
      if (res.data.properties) { setProperties(res.data.properties); setPagination(res.data.pagination); }
      else { setProperties(res.data); setPagination(null); }
    } catch { /* empty */ } finally { setLoading(false); }
  }, [search, district, rooms, minRent, maxRent, page, viewMode]);

  useEffect(() => {
    const t = setTimeout(fetchProperties, 400);
    return () => clearTimeout(t);
  }, [fetchProperties]);

  const hasFilter = search || district || rooms || minRent || maxRent;
  const reset = () => { setSearch(""); setDistrict(""); setRooms(""); setMinRent(""); setMaxRent(""); setPage(1); };

  const inputStyle = {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 12,
    fontWeight: 300,
    letterSpacing: "0.05em",
    background: "var(--dark-2)",
    border: "1px solid var(--border-dim)",
    color: "var(--white)",
    outline: "none",
    padding: "10px 14px",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--black)", paddingTop: 70 }}>
      <Navbar />

      {/* HERO SEARCH */}
      <section style={{ background: "var(--dark)", padding: "64px 0 0", borderBottom: "1px solid var(--border-dim)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px" }}>
          {/* Section label */}
          <div className="flex items-center gap-4 mb-6 animate-fadeUp">
            <div style={{ width: 32, height: 1, background: "var(--gold)" }} />
            <span style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--gold)" }}>
              Улаанбаатар
            </span>
          </div>

          <h1 className="font-display animate-fadeUp delay-100" style={{ fontSize: "clamp(40px,4vw,64px)", fontWeight: 300, color: "var(--white)", marginBottom: 32, lineHeight: 1.1 }}>
            Мөрөөдлийн байраа<br />
            <em style={{ color: "var(--gold)" }}>хялбараар олоорой</em>
          </h1>

          {/* Search bar */}
          <div className="animate-fadeUp delay-200" style={{ display: "flex", marginBottom: 0, maxWidth: 640 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <svg
                style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}
                width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Байрны нэр, байршил..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ ...inputStyle, width: "100%", paddingLeft: 40, borderRight: "none", borderBottom: "1px solid var(--gold)" }}
              />
            </div>
            <button
              onClick={() => setShowFilter(p => !p)}
              style={{
                fontFamily: "'Montserrat'",
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                padding: "10px 24px",
                border: "1px solid var(--border-dim)",
                borderLeft: "none",
                borderBottom: "1px solid var(--gold)",
                background: hasFilter ? "var(--gold)" : "var(--dark-2)",
                color: hasFilter ? "var(--black)" : "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {hasFilter ? `Шүүлтүүр (${[district,rooms,minRent,maxRent].filter(Boolean).length})` : "Шүүлтүүр"}
            </button>
          </div>

          {/* Filter panel */}
          {showFilter && (
            <div
              className="animate-fadeUp"
              style={{ background: "var(--dark-2)", border: "1px solid var(--border-dim)", borderTop: "none", maxWidth: 640, padding: 24 }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  {
                    label: "Дүүрэг",
                    elem: (
                      <select value={district} onChange={(e) => { setDistrict(e.target.value); setPage(1); }} className="luxury-select" style={{ padding: "10px 14px" }}>
                        <option value="">Бүгд</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    )
                  },
                  {
                    label: "Өрөө",
                    elem: (
                      <select value={rooms} onChange={(e) => { setRooms(e.target.value); setPage(1); }} className="luxury-select" style={{ padding: "10px 14px" }}>
                        <option value="">Бүгд</option>
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} өрөө</option>)}
                      </select>
                    )
                  },
                  {
                    label: "Мин үнэ",
                    elem: <input type="number" placeholder="0" value={minRent} onChange={(e) => { setMinRent(e.target.value); setPage(1); }} style={{ ...inputStyle, width: "100%" }} />
                  },
                  {
                    label: "Макс үнэ",
                    elem: <input type="number" placeholder="∞" value={maxRent} onChange={(e) => { setMaxRent(e.target.value); setPage(1); }} style={{ ...inputStyle, width: "100%" }} />
                  },
                ].map(({ label, elem }) => (
                  <div key={label}>
                    <label className="input-label">{label}</label>
                    {elem}
                  </div>
                ))}
              </div>
              {hasFilter && (
                <div style={{ marginTop: 14 }}>
                  <button onClick={reset} style={{ fontFamily: "'Montserrat'", fontSize: 9, letterSpacing: "0.15em", color: "var(--gold)", background: "none", border: "none", cursor: "pointer", textTransform: "uppercase" }}>
                    Шүүлтүүр арилгах
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 48px" }}>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-10">
          <p style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 400, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            {loading ? "Хайж байна..." : pagination
              ? `${pagination.total} байр — ${pagination.page}/${pagination.totalPages} хуудас`
              : `${properties.length} байр`}
          </p>
          <div className="flex" style={{ border: "1px solid var(--border-dim)" }}>
            {[
              { key: "list", label: "Жагсаалт", icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg> },
              { key: "map", label: "Зураг", icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg> },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => { setViewMode(key); setPage(1); }}
                className="flex items-center gap-2"
                style={{
                  padding: "9px 20px",
                  fontFamily: "'Montserrat'",
                  fontSize: 9,
                  fontWeight: 400,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  background: viewMode === key ? "var(--gold)" : "transparent",
                  color: viewMode === key ? "var(--black)" : "var(--text-muted)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* LIST VIEW */}
        {viewMode === "list" && (
          <>
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ background: "var(--dark-card)", border: "1px solid var(--border-dim)", aspectRatio: "4/5" }} className="animate-pulse" />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div style={{ textAlign: "center", padding: "96px 0" }}>
                <p className="font-display" style={{ fontSize: 40, fontWeight: 300, color: "var(--text-soft)", marginBottom: 12 }}>Байр олдсонгүй</p>
                <p style={{ fontFamily: "'Montserrat'", fontSize: 12, color: "var(--text-soft)" }}>Шүүлтүүрийг өөрчилж дахин хайна уу</p>
                {hasFilter && <button onClick={reset} className="btn-outline mt-6">Шүүлтүүр арилгах</button>}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
                {properties.map((p, i) => <PropertyCard key={p._id} property={p} index={i} />)}
              </div>
            )}

            {/* PAGINATION */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-16">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    width: 40, height: 40,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid var(--border-dim)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontFamily: "'Montserrat'",
                    fontSize: 12,
                    transition: "all 0.2s",
                    opacity: page === 1 ? 0.3 : 1,
                  }}
                  onMouseEnter={e => { if (page > 1) { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-dim)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                  ←
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i-1] > 1) acc.push("..."); acc.push(p); return acc; }, [])
                  .map((p, i) => p === "..." ? (
                    <span key={`d${i}`} style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-soft)", fontFamily: "'Montserrat'", fontSize: 12 }}>…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        width: 40, height: 40,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: p === page ? "1px solid var(--gold)" : "1px solid var(--border-dim)",
                        background: p === page ? "var(--gold)" : "transparent",
                        color: p === page ? "var(--black)" : "var(--text-muted)",
                        cursor: "pointer",
                        fontFamily: "'Montserrat'",
                        fontSize: 12,
                        fontWeight: p === page ? 500 : 400,
                        transition: "all 0.2s",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  style={{
                    width: 40, height: 40,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid var(--border-dim)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontFamily: "'Montserrat'",
                    fontSize: 12,
                    transition: "all 0.2s",
                    opacity: page === pagination.totalPages ? 0.3 : 1,
                  }}
                  onMouseEnter={e => { if (page < pagination.totalPages) { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-dim)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                  →
                </button>
              </div>
            )}
          </>
        )}

        {/* MAP VIEW */}
        {viewMode === "map" && (
          <div style={{ display: "flex", gap: 24, height: 600 }}>
            <div style={{ flex: 1, overflow: "hidden", border: "1px solid var(--border-dim)" }}>
              <MapContainer center={[47.9077, 106.8832]} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
                <TileLayer
                  attribution='© OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {properties.filter(getCoords).map(p => (
                  <Marker key={p._id} position={getCoords(p)}>
                    <Popup>
                      <div style={{ fontFamily: "'Montserrat'", minWidth: 160 }}>
                        <p style={{ fontWeight: 500, color: "var(--white)", marginBottom: 4, fontSize: 12 }}>{p.title}</p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>{p.location?.district}</p>
                        <p style={{ fontWeight: 500, color: "var(--gold)", fontSize: 12 }}>{p.monthlyRent?.toLocaleString()}₮/сар</p>
                        <Link to={`/properties/${p._id}`} style={{ display: "block", marginTop: 8, textAlign: "center", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", textDecoration: "none", padding: "6px", border: "1px solid var(--gold)" }}>
                          Үзэх →
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            <div style={{ width: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {properties.filter(getCoords).map(p => (
                <Link key={p._id} to={`/properties/${p._id}`} style={{ display: "block", background: "var(--dark-card)", border: "1px solid var(--border-dim)", overflow: "hidden", textDecoration: "none", transition: "border-color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(201,160,80,0.3)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-dim)"}
                >
                  <img src={p.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"} alt="" style={{ width: "100%", height: 100, objectFit: "cover" }} />
                  <div style={{ padding: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 300, color: "var(--white)", marginBottom: 4 }} className="line-clamp-1">{p.title}</p>
                    <p style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--text-muted)", marginBottom: 6 }}>{p.location?.district}</p>
                    <p style={{ fontFamily: "'Montserrat'", fontSize: 12, color: "var(--gold)" }}>{p.monthlyRent?.toLocaleString()}₮/сар</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;