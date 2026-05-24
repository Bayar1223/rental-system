import { useState, useEffect, useMemo } from "react";
import api from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=70";

const FILTER_TABS = [
  { v: "all",       label: "Бүгд" },
  { v: "available", label: "Боломжтой" },
  { v: "rented",    label: "Түрээслэгдсэн" },
];

function MyProperties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [filter, setFilter]         = useState("all");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) { navigate("/login"); return; }
    if (user.role !== "landlord" && user.role !== "admin") {
      navigate("/home"); return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/properties/landlord");
        if (cancelled) return;
        setProperties(res.data || []);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Байр татаж чадсангүй");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  const handleDelete = async (id, title) => {
    if (!confirm(`"${title}" байрыг устгахдаа итгэлтэй байна уу?`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/properties/${id}`);
      setProperties((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Устгаж чадсангүй");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    if (filter === "all") return properties;
    return properties.filter((p) => p.status === filter);
  }, [properties, filter]);

  const counts = useMemo(() => ({
    all:       properties.length,
    available: properties.filter((p) => p.status === "available").length,
    rented:    properties.filter((p) => p.status === "rented").length,
  }), [properties]);

  return (
    <div className="min-h-screen pt-20" style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-8" style={{ background: "#C9A84C" }} />
          <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#C9A84C" }}>Property Portfolio</span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <h1 className="font-light text-white leading-[1] tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(40px, 5vw, 64px)" }}
          >
            Миний<br />
            <em style={{ color: "#C9A84C", fontStyle: "italic" }}>байрууд</em>
          </h1>

          <Link to="/add-property"
            className="inline-flex items-center gap-3 px-6 py-4 text-xs font-medium tracking-[0.25em] uppercase transition-all duration-300 group"
            style={{ background: "#C9A84C", color: "#0A0A0A" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#E8D49E")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#C9A84C")}
          >
            + Шинэ байр нэмэх
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </header>

      {/* Stats */}
      {!loading && properties.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-12 mb-10">
          <div className="grid grid-cols-3 gap-3" style={{ border: "1px solid rgba(201,168,76,0.15)" }}>
            {[
              { label: "Нийт",          value: counts.all,       color: "#C9A84C" },
              { label: "Боломжтой",     value: counts.available, color: "#10B981" },
              { label: "Түрээслэгдсэн", value: counts.rented,    color: "#888"    },
            ].map((s, i) => (
              <div key={s.label} className="p-6"
                style={{ borderRight: i < 2 ? "1px solid rgba(201,168,76,0.08)" : "none" }}
              >
                <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-2">{s.label}</div>
                <div className="font-light leading-none"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44, color: s.color }}
                >{s.value}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filter tabs */}
      {!loading && properties.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-12 mb-8">
          <div className="flex flex-wrap gap-1 overflow-x-auto" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            {FILTER_TABS.map((tab) => (
              <button key={tab.v} onClick={() => setFilter(tab.v)}
                className="px-5 py-4 text-[10px] tracking-[0.25em] uppercase transition-all duration-300 flex items-center gap-2 whitespace-nowrap relative"
                style={{ color: filter === tab.v ? "#C9A84C" : "rgba(255,255,255,0.5)" }}
              >
                {tab.label}
                <span className="inline-flex items-center justify-center min-w-5 px-1.5 text-[10px]"
                  style={{
                    background: filter === tab.v ? "#C9A84C" : "rgba(255,255,255,0.05)",
                    color:      filter === tab.v ? "#0A0A0A" : "rgba(255,255,255,0.5)",
                  }}
                >{counts[tab.v] || 0}</span>
                {filter === tab.v && <div className="absolute bottom-0 left-0 right-0" style={{ height: 1, background: "#C9A84C" }} />}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 pb-20">
        {error && (
          <div className="mb-6 p-4 flex items-start gap-3"
            style={{ background: "rgba(239,68,68,0.08)", borderLeft: "2px solid #EF4444" }}
          >
            <span style={{ color: "#EF4444" }}>✕</span>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {loading ? <LoadingGrid />
          : filtered.length === 0 ? <EmptyState filter={filter} />
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((p) => (
                <PropertyAdminCard key={p._id} property={p}
                  onDelete={handleDelete} deleting={deletingId === p._id}
                />
              ))}
            </div>
          )
        }
      </main>
    </div>
  );
}

// ── Property admin card ──
function PropertyAdminCard({ property, onDelete, deleting }) {
  // ⭐ ЗАСВАР: images, monthlyRent, location.*, area
  const cover = property.images?.[0] || property.photos?.[0] || PLACEHOLDER;
  const isAvailable = property.status === "available";
  const monthlyRent = property.monthlyRent ?? property.price ?? 0;
  const formattedPrice = new Intl.NumberFormat("mn-MN").format(monthlyRent);
  const district = property.location?.district || property.district || "Улаанбаатар";
  const area = property.area ?? property.size;

  return (
    <div className="group relative overflow-hidden transition-all duration-300"
      style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.1)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.1)")}
    >
      {/* Image */}
      <Link to={`/properties/${property._id}`} className="block relative aspect-[4/3] overflow-hidden">
        <img src={cover} alt={property.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ filter: "brightness(0.88)" }}
          onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
        />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(180deg, transparent 60%, rgba(10,10,10,0.6) 100%)" }}
        />
        <div className="absolute top-4 left-4 px-3 py-1.5 text-[10px] tracking-[0.25em] uppercase"
          style={{
            background: isAvailable ? "rgba(201,168,76,0.95)" : "rgba(10,10,10,0.75)",
            color:      isAvailable ? "#0A0A0A" : "rgba(255,255,255,0.7)",
            border:     isAvailable ? "none" : "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(4px)",
          }}
        >{isAvailable ? "Боломжтой" : "Түрээслэгдсэн"}</div>
      </Link>

      {/* Content */}
      <div className="p-6">
        <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-2">{district}</div>
        <h3 className="text-white text-xl font-light mb-3 leading-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >{property.title}</h3>
        <div className="font-light mb-5"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "#C9A84C", fontSize: 22 }}
        >
          {formattedPrice}₮ <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">/ сар</span>
        </div>

        {/* Mini specs */}
        <div className="flex gap-4 text-xs text-white/55 pb-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          {property.rooms != null && (
            <div className="flex items-center gap-1.5">
              <span style={{ color: "#C9A84C" }}>◇</span>{property.rooms} өрөө
            </div>
          )}
          {area != null && (
            <div className="flex items-center gap-1.5">
              <span style={{ color: "#C9A84C" }}>◇</span>{area}м²
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          <Link to={`/edit-property/${property._id}`}
            className="py-2.5 text-center text-[10px] tracking-[0.2em] uppercase transition-all duration-300"
            style={{ border: "1px solid #C9A84C", color: "#C9A84C" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >Засах</Link>
          <Link to={`/properties/${property._id}`}
            className="py-2.5 text-center text-[10px] tracking-[0.2em] uppercase text-white/60 hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.12)" }}
          >Үзэх</Link>
          <button onClick={() => onDelete(property._id, property.title)} disabled={deleting}
            className="py-2.5 text-center text-[10px] tracking-[0.2em] uppercase text-red-300 hover:text-red-200 transition-colors disabled:opacity-50"
            style={{ border: "1px solid rgba(239,68,68,0.4)" }}
          >{deleting ? "..." : "Устгах"}</button>
        </div>
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse"
          style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.08)" }}
        >
          <div className="aspect-[4/3]" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="p-6 space-y-3">
            <div className="h-3 w-24" style={{ background: "rgba(255,255,255,0.05)" }} />
            <div className="h-5 w-3/4" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="h-6 w-32" style={{ background: "rgba(201,168,76,0.1)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ filter }) {
  const messages = {
    all: {
      title: "Байр алга",
      body:  "Та хараахан байр нэмээгүй байна. Эхний байрнаасаа эхэлцгээе.",
      cta:   { label: "Шинэ байр нэмэх", to: "/add-property" },
    },
    available: { title: "Боломжтой байр алга", body: "Бүх байр түрээслэгдсэн байна." },
    rented:    { title: "Түрээслэгдсэн байр алга", body: "Танай байрууд хараахан түрээслэгдээгүй байна." },
  };
  const m = messages[filter] || messages.all;
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6"
      style={{ border: "1px solid rgba(201,168,76,0.15)", background: "rgba(201,168,76,0.02)" }}
    >
      <div className="w-16 h-16 mb-8 flex items-center justify-center" style={{ border: "1px solid #C9A84C" }}>
        <div style={{ width: 24, height: 24, background: "#C9A84C", transform: "rotate(45deg)" }} />
      </div>
      <h3 className="font-light text-white mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32 }}>
        {m.title}
      </h3>
      <p className="text-sm text-white/50 max-w-md mb-8 leading-relaxed">{m.body}</p>
      {m.cta && (
        <Link to={m.cta.to}
          className="inline-block px-8 py-3 text-[10px] tracking-[0.3em] uppercase transition-all duration-300"
          style={{ background: "#C9A84C", color: "#0A0A0A" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#E8D49E")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#C9A84C")}
        >{m.cta.label} →</Link>
      )}
    </div>
  );
}

export default MyProperties;