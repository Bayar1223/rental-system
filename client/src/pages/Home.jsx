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

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)", paddingTop: 64 }}>
      <Navbar />

      {/* Hero search section */}
      <section style={{ background: "var(--ink)", padding: "60px 0 50px" }} className="relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "linear-gradient(var(--gold) 1px, transparent 1px), linear-gradient(90deg, var(--gold) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="animate-fadeUp">
            <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-3">Улаанбаатар</p>
            <h1 className="font-display text-5xl md:text-6xl font-light text-white leading-tight mb-8">
              Мөрөөдлийн байраа<br />
              <span style={{ color: "var(--gold)" }}>хялбараар олоорой</span>
            </h1>
          </div>

          {/* Search bar */}
          <div className="animate-fadeUp delay-200 flex gap-0 max-w-2xl">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Байрны нэр, байршил..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-white text-[var(--ink)] text-sm px-5 py-4 outline-none border-0"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
            <button
              onClick={() => setShowFilter(p => !p)}
              className={`px-6 py-4 text-xs font-medium tracking-widest uppercase transition-all border-l border-black/10 ${
                hasFilter ? "bg-[var(--gold)] text-[var(--ink)]" : "bg-white text-[var(--text-muted)] hover:bg-[var(--surface)]"
              }`}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {hasFilter ? `Шүүлтүүр (${[district,rooms,minRent,maxRent].filter(Boolean).length})` : "Шүүлтүүр"}
            </button>
          </div>

          {/* Filter panel */}
          {showFilter && (
            <div className="animate-fadeUp mt-0 bg-white max-w-2xl">
              <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Дүүрэг", component: (
                    <select value={district} onChange={(e) => { setDistrict(e.target.value); setPage(1); }} className="luxury-select text-sm">
                      <option value="">Бүгд</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  )},
                  { label: "Өрөө", component: (
                    <select value={rooms} onChange={(e) => { setRooms(e.target.value); setPage(1); }} className="luxury-select text-sm">
                      <option value="">Бүгд</option>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} өрөө</option>)}
                    </select>
                  )},
                  { label: "Мин үнэ", component: (
                    <input type="number" placeholder="0" value={minRent}
                      onChange={(e) => { setMinRent(e.target.value); setPage(1); }} className="luxury-input text-sm" />
                  )},
                  { label: "Макс үнэ", component: (
                    <input type="number" placeholder="∞" value={maxRent}
                      onChange={(e) => { setMaxRent(e.target.value); setPage(1); }} className="luxury-input text-sm" />
                  )},
                ].map(({ label, component }) => (
                  <div key={label}>
                    <label className="block text-xs tracking-widest uppercase text-[var(--text-muted)] mb-2">{label}</label>
                    {component}
                  </div>
                ))}
              </div>
              {hasFilter && (
                <div className="px-5 pb-4">
                  <button onClick={reset} className="text-xs text-[var(--gold)] hover:underline">Шүүлтүүр арилгах</button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs tracking-widest uppercase text-[var(--text-muted)]">
              {loading ? "Хайж байна..." : pagination ? `${pagination.total} байр — ${pagination.page}/${pagination.totalPages} хуудас` : `${properties.length} байр`}
            </p>
          </div>
          <div className="flex border border-black/10">
            {[
              { key: "list", icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>, label: "Жагсаалт" },
              { key: "map", icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>, label: "Зураг" },
            ].map(({ key, icon, label }) => (
              <button key={key} onClick={() => { setViewMode(key); setPage(1); }}
                className={`flex items-center gap-2 px-4 py-2 text-xs tracking-wide transition-all ${
                  viewMode === key ? "bg-[var(--ink)] text-white" : "text-[var(--text-muted)] hover:bg-[var(--surface)]"
                }`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {icon} <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* LIST VIEW */}
        {viewMode === "list" && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white animate-pulse">
                    <div className="bg-gray-100" style={{ aspectRatio: "4/3" }} />
                    <div className="p-5 space-y-3">
                      <div className="h-3 bg-gray-100 w-1/4 rounded" />
                      <div className="h-4 bg-gray-100 w-3/4 rounded" />
                      <div className="h-3 bg-gray-100 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="py-24 text-center">
                <p className="font-display text-4xl font-light text-[var(--text-soft)] mb-4">Байр олдсонгүй</p>
                <p className="text-sm text-[var(--text-soft)]">Шүүлтүүрийг өөрчилж дахин хайна уу</p>
                {hasFilter && <button onClick={reset} className="btn-outline-gold mt-6">Шүүлтүүр арилгах</button>}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((p, i) => <PropertyCard key={p._id} property={p} index={i} />)}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-12">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-10 h-10 flex items-center justify-center border border-black/10 text-[var(--text-muted)] hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:opacity-30 transition-all text-xs">
                  ←
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i-1] > 1) acc.push("..."); acc.push(p); return acc; }, [])
                  .map((p, i) => p === "..." ? (
                    <span key={`d${i}`} className="w-10 h-10 flex items-center justify-center text-[var(--text-soft)] text-xs">…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-10 h-10 flex items-center justify-center border text-xs font-medium transition-all ${
                        p === page ? "bg-[var(--ink)] text-white border-[var(--ink)]" : "border-black/10 text-[var(--text-muted)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
                      }`}>{p}</button>
                  ))}
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                  className="w-10 h-10 flex items-center justify-center border border-black/10 text-[var(--text-muted)] hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:opacity-30 transition-all text-xs">
                  →
                </button>
              </div>
            )}
          </>
        )}

        {/* MAP VIEW */}
        {viewMode === "map" && (
          <div className="flex flex-col md:flex-row gap-6" style={{ height: 600 }}>
            <div className="flex-1 overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
              {loading ? (
                <div className="w-full h-full bg-gray-50 animate-pulse flex items-center justify-center">
                  <p className="text-[var(--text-soft)] text-sm">Ачааллаж байна...</p>
                </div>
              ) : (
                <MapContainer center={[47.9077, 106.8832]} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
                  <TileLayer attribution='© OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {properties.filter(getCoords).map(p => (
                    <Marker key={p._id} position={getCoords(p)}>
                      <Popup>
                        <div className="text-sm min-w-[160px]">
                          <p className="font-medium text-[var(--ink)] mb-1">{p.title}</p>
                          <p className="text-xs text-[var(--text-muted)] mb-1">{p.location?.district}</p>
                          <p className="font-medium" style={{ color: "var(--gold)" }}>{p.monthlyRent?.toLocaleString()}₮/сар</p>
                          <Link to={`/properties/${p._id}`} className="block mt-2 text-center text-xs text-white py-1.5" style={{ background: "var(--ink)" }}>Үзэх →</Link>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>
            <div className="w-full md:w-64 overflow-y-auto space-y-2">
              {properties.filter(getCoords).map(p => (
                <Link key={p._id} to={`/properties/${p._id}`}
                  className="block bg-white hover:shadow-md transition-all overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
                  <img src={p.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"} alt={p.title} className="w-full h-28 object-cover" />
                  <div className="p-3">
                    <p className="text-sm font-medium text-[var(--ink)] line-clamp-1">{p.title}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{p.location?.district}</p>
                    <p className="text-sm font-medium mt-1" style={{ color: "var(--gold)" }}>{p.monthlyRent?.toLocaleString()}₮/сар</p>
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