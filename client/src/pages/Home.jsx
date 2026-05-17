import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import PropertyCard from "../components/PropertyCard";

// Leaflet marker icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const districts = [
  "Багануур","Багахангай","Баянгол","Баянзүрх",
  "Налайх","Сонгинохайрхан","Сүхбаатар","Хан-Уул","Чингэлтэй",
];

// Координатгүй байрнуудад дүүргийн default координат ашиглана
const DISTRICT_COORDS = {
  "Баянзүрх":       [47.9184, 106.9612],
  "Баянгол":        [47.9077, 106.8432],
  "Сүхбаатар":      [47.9195, 106.9077],
  "Чингэлтэй":      [47.9268, 106.8782],
  "Хан-Уул":        [47.8748, 106.8815],
  "Сонгинохайрхан": [47.9268, 106.7782],
  "Налайх":         [47.7577, 107.2682],
  "Багануур":       [47.7121, 108.2821],
  "Багахангай":     [47.8241, 106.9121],
};

function getCoords(property) {
  if (property.latitude && property.longitude) {
    return [property.latitude, property.longitude];
  }
  const district = property.location?.district;
  return DISTRICT_COORDS[district] || null;
}

function Home() {
  const [properties, setProperties]   = useState([]);
  const [pagination, setPagination]   = useState(null);
  const [loading, setLoading]         = useState(false);
  const [viewMode, setViewMode]       = useState("list"); // "list" | "map"

  const [search, setSearch]           = useState("");
  const [district, setDistrict]       = useState("");
  const [rooms, setRooms]             = useState("");
  const [minRent, setMinRent]         = useState("");
  const [maxRent, setMaxRent]         = useState("");
  const [showFilter, setShowFilter]   = useState(false);
  const [page, setPage]               = useState(1);
  const [selectedProperty, setSelectedProperty] = useState(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: viewMode === "map" ? 50 : 9 };
      if (search)   params.search   = search;
      if (district) params.district = district;
      if (rooms)    params.rooms    = rooms;
      if (minRent)  params.minRent  = minRent;
      if (maxRent)  params.maxRent  = maxRent;

      const res = await api.get("/api/properties", { params });
      if (res.data.properties) {
        setProperties(res.data.properties);
        setPagination(res.data.pagination);
      } else {
        setProperties(res.data);
        setPagination(null);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [search, district, rooms, minRent, maxRent, page, viewMode]);

  useEffect(() => {
    const timeout = setTimeout(() => { fetchProperties(); }, 400);
    return () => clearTimeout(timeout);
  }, [fetchProperties]);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleReset = () => {
    setSearch(""); setDistrict(""); setRooms("");
    setMinRent(""); setMaxRent(""); setPage(1);
  };

  const hasFilter = search || district || rooms || minRent || maxRent;

  // Map-д харагдах байрнууд (координаттай)
  const mappableProperties = properties.filter((p) => getCoords(p));

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Хайлтын хэсэг */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
          <h2 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">
            Түрээсийн байр хайх
          </h2>
          <p className="text-gray-500 text-sm md:text-base mb-4 md:mb-6">
            Улаанбаатар хотын орон сууц түрээсийн систем
          </p>

          <div className="flex gap-2 md:gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Байрны нэр, хаяг хайх..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm md:text-base"
              />
            </div>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2.5 md:py-3 rounded-xl border font-medium transition text-sm md:text-base ${
                showFilter || hasFilter
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Шүүлтүүр
              {hasFilter && (
                <span className="bg-white text-indigo-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {[district, rooms, minRent, maxRent].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Шүүлтүүр панел */}
          {showFilter && (
            <div className="mt-3 md:mt-4 p-4 md:p-5 bg-gray-50 rounded-2xl border">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div>
                  <label className="text-xs md:text-sm font-semibold text-gray-600 mb-1 block">Дүүрэг</label>
                  <select value={district} onChange={handleFilterChange(setDistrict)}
                    className="w-full border p-2 md:p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">Бүгд</option>
                    {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-semibold text-gray-600 mb-1 block">Өрөөний тоо</label>
                  <select value={rooms} onChange={handleFilterChange(setRooms)}
                    className="w-full border p-2 md:p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">Бүгд</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} өрөө</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-semibold text-gray-600 mb-1 block">Мин үнэ (₮)</label>
                  <input type="number" placeholder="0" value={minRent}
                    onChange={handleFilterChange(setMinRent)}
                    className="w-full border p-2 md:p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="text-xs md:text-sm font-semibold text-gray-600 mb-1 block">Макс үнэ (₮)</label>
                  <input type="number" placeholder="10,000,000" value={maxRent}
                    onChange={handleFilterChange(setMaxRent)}
                    className="w-full border p-2 md:p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              {hasFilter && (
                <button onClick={handleReset}
                  className="mt-3 text-sm text-red-500 hover:underline font-medium">
                  Шүүлтүүр арилгах
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Жагсаалт / Map харагдац */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-5 md:py-8">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <p className="text-gray-600 text-sm md:text-base">
            {loading
              ? "Хайж байна..."
              : pagination
                ? `Нийт ${pagination.total} байр — ${pagination.page} / ${pagination.totalPages} хуудас`
                : `${properties.length} байр олдлоо`}
          </p>

          {/* View mode toggle */}
          <div className="flex items-center bg-white border rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition whitespace-nowrap ${
                viewMode === "list" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline">Жагсаалт</span>
              <span className="sm:hidden">Жагс</span>
            </button>
            <button
              onClick={() => { setViewMode("map"); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition whitespace-nowrap ${
                viewMode === "map" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="hidden sm:inline">Газрын зураг</span>
              <span className="sm:hidden">Зураг</span>
            </button>
          </div>
        </div>

        {/* ====== LIST VIEW ====== */}
        {viewMode === "list" && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl shadow animate-pulse">
                    <div className="h-44 md:h-48 bg-gray-200 rounded-t-2xl" />
                    <div className="p-4 md:p-5 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-6 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-16 md:py-20">
                <div className="text-5xl md:text-6xl mb-4">🏠</div>
                <h3 className="text-lg md:text-xl font-bold text-gray-700 mb-2">Байр олдсонгүй</h3>
                <p className="text-gray-500 text-sm md:text-base">Шүүлтүүрийг өөрчилж дахин хайна уу</p>
                {hasFilter && (
                  <button onClick={handleReset}
                    className="mt-4 text-indigo-600 hover:underline font-medium text-sm">
                    Шүүлтүүр арилгах
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {properties.map((property) => (
                  <PropertyCard key={property._id} property={property} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-1.5 md:gap-2 mt-8 md:mt-10">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 md:px-4 py-2 rounded-xl border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition">
                  ← Өмнөх
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span key={`dot-${idx}`} className="px-2 text-gray-400 text-sm">...</span>
                    ) : (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-9 h-9 md:w-10 md:h-10 rounded-xl text-sm font-medium transition ${
                          p === page ? "bg-indigo-600 text-white" : "border hover:bg-gray-50 text-gray-700"
                        }`}>
                        {p}
                      </button>
                    )
                  )}
                <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-3 md:px-4 py-2 rounded-xl border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition">
                  Дараах →
                </button>
              </div>
            )}
          </>
        )}

        {/* ====== MAP VIEW ====== */}
        {viewMode === "map" && (
          <div className="flex flex-col md:flex-row gap-4" style={{ height: "600px" }}>

            {/* Map */}
            <div className="flex-1 rounded-2xl overflow-hidden shadow-md" style={{ minHeight: "400px" }}>
              {loading ? (
                <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                  <p className="text-gray-400">Газрын зураг ачааллаж байна...</p>
                </div>
              ) : (
                <MapContainer
                  center={[47.9077, 106.8832]}
                  zoom={12}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {mappableProperties.map((property) => {
                    const coords = getCoords(property);
                    if (!coords) return null;
                    return (
                      <Marker
                        key={property._id}
                        position={coords}
                        eventHandlers={{
                          click: () => setSelectedProperty(property),
                        }}
                      >
                        <Popup>
                          <div className="text-sm min-w-[160px]">
                            <p className="font-bold text-gray-900 mb-1">{property.title}</p>
                            <p className="text-gray-500 text-xs mb-1">
                              {property.location?.district}, {property.location?.city}
                            </p>
                            <p className="text-indigo-600 font-bold">
                              {property.monthlyRent?.toLocaleString()}₮/сар
                            </p>
                            <Link
                              to={`/properties/${property._id}`}
                              className="block mt-2 text-center bg-indigo-600 text-white text-xs py-1 px-2 rounded-lg hover:bg-indigo-700"
                            >
                              Дэлгэрэнгүй →
                            </Link>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              )}
            </div>

            {/* Sidebar — сонгосон байрны жагсаалт */}
            <div className="w-full md:w-72 overflow-y-auto space-y-3 pr-1">
              {mappableProperties.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <div className="text-4xl mb-2">🗺️</div>
                  <p className="text-sm">Газрын зураг дээр харагдах байр байхгүй байна</p>
                  <p className="text-xs mt-1 text-gray-300">Байр нэмэхдээ байршил тэмдэглэнэ үү</p>
                </div>
              ) : (
                mappableProperties.map((property) => {
                  const image = property.images?.[0] ||
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";
                  const isSelected = selectedProperty?._id === property._id;
                  return (
                    <Link
                      key={property._id}
                      to={`/properties/${property._id}`}
                      onClick={() => setSelectedProperty(property)}
                      className={`block bg-white rounded-xl shadow-sm hover:shadow-md transition border-2 overflow-hidden ${
                        isSelected ? "border-indigo-500" : "border-transparent"
                      }`}
                    >
                      <img src={image} alt={property.title}
                        className="w-full h-28 object-cover" />
                      <div className="p-3">
                        <p className="font-semibold text-sm text-gray-900 line-clamp-1">
                          {property.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          📍 {property.location?.district}, {property.location?.city}
                        </p>
                        <p className="text-indigo-600 font-bold text-sm mt-1">
                          {property.monthlyRent?.toLocaleString()}₮/сар
                        </p>
                        <div className="flex gap-2 mt-1 text-xs text-gray-400">
                          <span>{property.rooms} өрөө</span>
                          <span>•</span>
                          <span>{property.area} м²</span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;