import { useState, useEffect, useMemo } from "react";
import api from "../api/axiosInstance";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PropertyCard from "../components/PropertyCard";

// ── Гол дүүргүүд ──
const DISTRICTS = [
  "Хан-Уул",
  "Сүхбаатар",
  "Чингэлтэй",
  "Баянзүрх",
  "Сонгинохайрхан",
  "Баянгол",
  "Налайх",
  "Багануур",
  "Багахангай",
];

// ── Gold diamond marker ──
const goldDiamondIcon = L.divIcon({
  className: "rentalsy-marker",
  html: `
    <div style="position:relative;width:30px;height:30px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;inset:4px;background:#C9A84C;transform:rotate(45deg);box-shadow:0 4px 12px rgba(201,168,76,0.6),0 0 0 2px #0A0A0A;"></div>
      <div style="position:absolute;width:6px;height:6px;background:#0A0A0A;transform:rotate(45deg);"></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// ── Улаанбаатарын төв ──
const UB_CENTER = [47.9184, 106.9177];

function Home() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid"); // 'grid' | 'map'
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    district: "",
    minPrice: "",
    maxPrice: "",
    rooms: "",
    sort: "newest",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/properties");
        if (mounted) setProperties(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let r = properties.filter((p) => p.status === "available");
    const { search, district, minPrice, maxPrice, rooms, sort } = filters;

    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q) ||
          p.district?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    if (district) r = r.filter((p) => p.district === district);
    if (minPrice) r = r.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) r = r.filter((p) => p.price <= Number(maxPrice));
    if (rooms) {
      r = r.filter((p) => {
        if (rooms === "4+") return Number(p.rooms) >= 4;
        return String(p.rooms) === String(rooms);
      });
    }

    const sorted = [...r];
    switch (sort) {
      case "price_asc":
        sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price_desc":
        sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "newest":
      default:
        sorted.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
    }
    return sorted;
  }, [properties, filters]);

  const updateFilter = (key, value) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const clearFilters = () =>
    setFilters({
      search: "",
      district: "",
      minPrice: "",
      maxPrice: "",
      rooms: "",
      sort: "newest",
    });

  const activeFilterCount =
    (filters.district ? 1 : 0) +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.rooms ? 1 : 0);

  const mapped = filtered.filter((p) => p.latitude && p.longitude);

  return (
    <div
      className="min-h-screen pt-20"
      style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Leaflet popup override */}
      <style>{`
        .leaflet-container { background: #0A0A0A; font-family: 'DM Sans', sans-serif; }
        .leaflet-popup-content-wrapper {
          background: #141414;
          color: #fff;
          border-radius: 0;
          border: 1px solid rgba(201,168,76,0.25);
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        }
        .leaflet-popup-tip { background: #141414; border: 1px solid rgba(201,168,76,0.25); }
        .leaflet-popup-content { margin: 0; min-width: 220px; }
        .leaflet-popup-close-button { color: rgba(255,255,255,0.6) !important; }
        .leaflet-control-zoom a {
          background: #141414 !important;
          color: #C9A84C !important;
          border: 1px solid rgba(201,168,76,0.3) !important;
        }
        .leaflet-control-zoom a:hover {
          background: #1A1A1A !important;
        }
        .leaflet-control-attribution {
          background: rgba(10,10,10,0.7) !important;
          color: rgba(255,255,255,0.4) !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a {
          color: #C9A84C !important;
        }
        .rentalsy-marker { background: transparent !important; border: none !important; }
      `}</style>

      {/* ── HEADER ── */}
      <header className="relative py-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8" style={{ background: "#C9A84C" }} />
            <span
              className="text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "#C9A84C" }}
            >
              The Collection
            </span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <h1
              className="font-light text-white leading-[1] tracking-tight"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(40px, 5vw, 64px)",
              }}
            >
              Шилмэл орон<br />
              <em style={{ color: "#C9A84C", fontStyle: "italic" }}>
                сууцууд
              </em>
            </h1>

            {/* View toggle */}
            <div
              className="inline-flex"
              style={{ border: "1px solid rgba(201,168,76,0.3)" }}
            >
              {[
                { v: "grid", label: "Жагсаалт" },
                { v: "map", label: "Газрын зураг" },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setView(opt.v)}
                  className="px-6 py-3 text-[10px] tracking-[0.25em] uppercase transition-all duration-300"
                  style={{
                    background: view === opt.v ? "#C9A84C" : "transparent",
                    color: view === opt.v ? "#0A0A0A" : "rgba(255,255,255,0.6)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── SEARCH + FILTERS ── */}
      <section className="px-6 lg:px-12 mb-8">
        <div className="max-w-7xl mx-auto">
          {/* Search bar */}
          <div
            className="flex items-center gap-4 px-5 py-4 mb-4"
            style={{
              background: "#141414",
              border: "1px solid rgba(201,168,76,0.15)",
            }}
          >
            <span style={{ color: "#C9A84C", fontSize: 18 }}>◇</span>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder="Хайх: байрны нэр, хаяг, дүүрэг..."
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
            />
            <button
              onClick={() => setFiltersOpen((f) => !f)}
              className="hidden lg:flex items-center gap-2 px-4 py-2 text-[10px] tracking-[0.25em] uppercase transition-colors"
              style={{
                background: filtersOpen
                  ? "rgba(201,168,76,0.12)"
                  : "transparent",
                color: filtersOpen ? "#C9A84C" : "rgba(255,255,255,0.6)",
                border: `1px solid ${
                  filtersOpen ? "#C9A84C" : "rgba(255,255,255,0.12)"
                }`,
              }}
            >
              Шүүлтүүр
              {activeFilterCount > 0 && (
                <span
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[9px]"
                  style={{ background: "#C9A84C", color: "#0A0A0A" }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
            <select
              value={filters.sort}
              onChange={(e) => updateFilter("sort", e.target.value)}
              className="hidden lg:block bg-transparent text-white text-xs outline-none cursor-pointer"
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "8px 12px",
                colorScheme: "dark",
              }}
            >
              <option value="newest" style={{ background: "#141414" }}>
                Шинэ нь
              </option>
              <option value="price_asc" style={{ background: "#141414" }}>
                Үнэ ↑
              </option>
              <option value="price_desc" style={{ background: "#141414" }}>
                Үнэ ↓
              </option>
            </select>
          </div>

          {/* Mobile sort + filter toggle */}
          <div className="lg:hidden flex gap-2 mb-4">
            <button
              onClick={() => setFiltersOpen((f) => !f)}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-[10px] tracking-[0.25em] uppercase"
              style={{
                background: filtersOpen
                  ? "rgba(201,168,76,0.12)"
                  : "transparent",
                color: filtersOpen ? "#C9A84C" : "rgba(255,255,255,0.6)",
                border: `1px solid ${
                  filtersOpen ? "#C9A84C" : "rgba(255,255,255,0.15)"
                }`,
              }}
            >
              Шүүлтүүр {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
            <select
              value={filters.sort}
              onChange={(e) => updateFilter("sort", e.target.value)}
              className="flex-1 bg-transparent text-white text-xs"
              style={{
                border: "1px solid rgba(255,255,255,0.15)",
                padding: "12px",
                colorScheme: "dark",
              }}
            >
              <option value="newest" style={{ background: "#141414" }}>
                Шинэ нь
              </option>
              <option value="price_asc" style={{ background: "#141414" }}>
                Үнэ ↑
              </option>
              <option value="price_desc" style={{ background: "#141414" }}>
                Үнэ ↓
              </option>
            </select>
          </div>

          {/* Expanded filters */}
          {filtersOpen && (
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 mb-4 animate-fadeUp"
              style={{
                background: "#141414",
                border: "1px solid rgba(201,168,76,0.15)",
              }}
            >
              {/* District */}
              <div>
                <label className="block text-[10px] tracking-[0.25em] uppercase text-white/40 mb-2">
                  Дүүрэг
                </label>
                <select
                  value={filters.district}
                  onChange={(e) => updateFilter("district", e.target.value)}
                  className="w-full bg-transparent text-white text-sm py-2 outline-none"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.15)",
                    colorScheme: "dark",
                  }}
                >
                  <option value="" style={{ background: "#141414" }}>
                    Бүгд
                  </option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d} style={{ background: "#141414" }}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rooms */}
              <div>
                <label className="block text-[10px] tracking-[0.25em] uppercase text-white/40 mb-2">
                  Өрөө
                </label>
                <select
                  value={filters.rooms}
                  onChange={(e) => updateFilter("rooms", e.target.value)}
                  className="w-full bg-transparent text-white text-sm py-2 outline-none"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.15)",
                    colorScheme: "dark",
                  }}
                >
                  <option value="" style={{ background: "#141414" }}>
                    Бүгд
                  </option>
                  <option value="1" style={{ background: "#141414" }}>
                    1 өрөө
                  </option>
                  <option value="2" style={{ background: "#141414" }}>
                    2 өрөө
                  </option>
                  <option value="3" style={{ background: "#141414" }}>
                    3 өрөө
                  </option>
                  <option value="4+" style={{ background: "#141414" }}>
                    4+ өрөө
                  </option>
                </select>
              </div>

              {/* Min price */}
              <div>
                <label className="block text-[10px] tracking-[0.25em] uppercase text-white/40 mb-2">
                  Хамгийн бага үнэ
                </label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => updateFilter("minPrice", e.target.value)}
                  placeholder="500000"
                  className="w-full bg-transparent text-white text-sm py-2 outline-none"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.15)",
                  }}
                />
              </div>

              {/* Max price */}
              <div>
                <label className="block text-[10px] tracking-[0.25em] uppercase text-white/40 mb-2">
                  Хамгийн их үнэ
                </label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter("maxPrice", e.target.value)}
                  placeholder="3000000"
                  className="w-full bg-transparent text-white text-sm py-2 outline-none"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.15)",
                  }}
                />
              </div>

              <div className="col-span-2 md:col-span-4 flex justify-end gap-3 pt-2">
                <button
                  onClick={clearFilters}
                  className="px-5 py-2 text-[10px] tracking-[0.25em] uppercase text-white/50 hover:text-white transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  Цэвэрлэх
                </button>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="px-5 py-2 text-[10px] tracking-[0.25em] uppercase transition-colors"
                  style={{ background: "#C9A84C", color: "#0A0A0A" }}
                >
                  Хаах
                </button>
              </div>
            </div>
          )}

          {/* Result count */}
          <div
            className="flex items-center justify-between pb-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="text-[11px] tracking-[0.2em] uppercase text-white/40">
              {loading ? (
                "Уншиж байна..."
              ) : (
                <>
                  <span style={{ color: "#C9A84C" }}>{filtered.length}</span>{" "}
                  орон сууц олдлоо
                </>
              )}
            </div>
            {activeFilterCount > 0 && !loading && (
              <button
                onClick={clearFilters}
                className="text-[10px] tracking-[0.25em] uppercase hover:underline"
                style={{ color: "#C9A84C" }}
              >
                Бүх шүүлтүүр цэвэрлэх
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── CONTENT ── */}
      <main className="px-6 lg:px-12 pb-20">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <LoadingGrid />
          ) : filtered.length === 0 ? (
            <EmptyState onClear={clearFilters} hasFilters={activeFilterCount > 0 || !!filters.search} />
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeUp">
              {filtered.map((p) => (
                <PropertyCard key={p._id} property={p} />
              ))}
            </div>
          ) : (
            <div
              className="relative"
              style={{
                height: "70vh",
                minHeight: 500,
                border: "1px solid rgba(201,168,76,0.2)",
              }}
            >
              <MapContainer
                center={UB_CENTER}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap &copy; CARTO'
                />
                {mapped.map((p) => (
                  <Marker
                    key={p._id}
                    position={[p.latitude, p.longitude]}
                    icon={goldDiamondIcon}
                  >
                    <Popup>
                      <MapPopup property={p} />
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {mapped.length === 0 && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-8 py-6 text-center"
                  style={{
                    background: "rgba(20,20,20,0.9)",
                    border: "1px solid rgba(201,168,76,0.3)",
                  }}
                >
                  <div
                    className="font-light mb-2"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      color: "#C9A84C",
                      fontSize: 24,
                    }}
                  >
                    Газрын зураг хоосон
                  </div>
                  <p className="text-xs text-white/50">
                    Шүүлтүүрт тохирох байр одоогоор олдсонгүй
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Popup mini-card ──
function MapPopup({ property }) {
  const cover =
    property.photos?.[0] ||
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=400&q=70";
  const price = new Intl.NumberFormat("mn-MN").format(property.price || 0);

  return (
    <div style={{ width: 220, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ position: "relative", height: 120, overflow: "hidden" }}>
        <img
          src={cover}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.85)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            background: "rgba(201,168,76,0.95)",
            color: "#0A0A0A",
            padding: "2px 8px",
            fontSize: 9,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Боломжтой
        </div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)",
            marginBottom: 6,
          }}
        >
          {property.district || "Улаанбаатар"}
        </div>
        <h4
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 18,
            fontWeight: 300,
            color: "#fff",
            margin: 0,
            marginBottom: 8,
            lineHeight: 1.2,
          }}
        >
          {property.title}
        </h4>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 8,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: "#C9A84C",
              fontSize: 18,
              fontWeight: 300,
            }}
          >
            {price}₮
          </div>
          <Link
            to={`/property/${property._id}`}
            style={{
              fontSize: 9,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "#C9A84C",
              textDecoration: "none",
              border: "1px solid #C9A84C",
              padding: "6px 10px",
            }}
          >
            Үзэх →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Loading skeleton ──
function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            background: "#141414",
            border: "1px solid rgba(201,168,76,0.08)",
          }}
        >
          <div
            className="aspect-[4/3]"
            style={{ background: "rgba(255,255,255,0.03)" }}
          />
          <div className="p-6 space-y-3">
            <div
              className="h-3 w-24"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
            <div
              className="h-5 w-3/4"
              style={{ background: "rgba(255,255,255,0.08)" }}
            />
            <div
              className="h-3 w-full"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
            <div
              className="h-7 w-32 mt-4"
              style={{ background: "rgba(201,168,76,0.1)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty state ──
function EmptyState({ onClear, hasFilters }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-24 px-6"
      style={{
        border: "1px solid rgba(201,168,76,0.15)",
        background: "rgba(201,168,76,0.02)",
      }}
    >
      <div
        className="w-16 h-16 mb-8 flex items-center justify-center"
        style={{ border: "1px solid #C9A84C" }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            background: "#C9A84C",
            transform: "rotate(45deg)",
          }}
        />
      </div>
      <h3
        className="font-light text-white mb-4"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 36,
        }}
      >
        {hasFilters ? (
          <>
            Үр дүн<br />
            <em style={{ color: "#C9A84C", fontStyle: "italic" }}>
              олдсонгүй
            </em>
          </>
        ) : (
          <>
            Одоогоор байр<br />
            <em style={{ color: "#C9A84C", fontStyle: "italic" }}>
              нэмэгдээгүй
            </em>
          </>
        )}
      </h3>
      <p className="text-sm text-white/50 max-w-md mb-8 leading-relaxed">
        {hasFilters
          ? "Шүүлтүүрийн нөхцөлийг өөрчилж дахин оролдоно уу."
          : "Шинэ орон сууцууд удахгүй нэмэгдэх болно."}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="px-8 py-3 text-[10px] tracking-[0.3em] uppercase transition-all duration-300"
          style={{ background: "#C9A84C", color: "#0A0A0A" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "#E8D49E")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "#C9A84C")
          }
        >
          Шүүлтүүр цэвэрлэх →
        </button>
      )}
    </div>
  );
}

export default Home;