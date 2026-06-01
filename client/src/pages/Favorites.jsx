import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import FavoriteButton from "../components/FavoriteButton";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=70";

const STATUS = {
  available: { label: "Боломжтой", color: "#10B981" },
  rented:    { label: "Түрээслэгдсэн", color: "#888" },
};

function Favorites() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/favorites");
        if (cancelled) return;
        setProperties(res.data || []);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Татаж чадсангүй");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate, user]);

  // Зүрх дарж хасахад жагсаалтаас шууд авна
  const handleToggle = (propertyId, favorited) => {
    if (!favorited) {
      setProperties((prev) => prev.filter((p) => p._id !== propertyId));
    }
  };

  return (
    <div className="min-h-screen pt-20" style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}>
      <header className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-8" style={{ background: "#C9A84C" }} />
          <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#C9A84C" }}>Saved</span>
        </div>
        <h1 className="font-light text-white leading-[1] tracking-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(40px, 5vw, 64px)" }}
        >
          Хадгалсан<br />
          <em style={{ color: "#C9A84C", fontStyle: "italic" }}>байрууд</em>
        </h1>
      </header>

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
          : properties.length === 0 ? <EmptyState />
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((p) => (
                <PropertyCard key={p._id} property={p} onToggle={handleToggle} />
              ))}
            </div>
          )
        }
      </main>
    </div>
  );
}

function PropertyCard({ property, onToggle }) {
  const cover = property.images?.[0] || PLACEHOLDER;
  const monthlyRent = property.monthlyRent ?? 0;
  const price = new Intl.NumberFormat("mn-MN").format(monthlyRent);
  const district = property.location?.district || "Улаанбаатар";
  const statusInfo = STATUS[property.status];

  return (
    <Link
      to={`/properties/${property._id}`}
      className="group block relative transition-all duration-300"
      style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.1)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.35)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.1)")}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
        <img
          src={cover} alt={property.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ filter: "brightness(0.9)" }}
          onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
        />
        <FavoriteButton
          propertyId={property._id}
          initial={true}
          onToggle={(fav) => onToggle(property._id, fav)}
        />
        {statusInfo && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 px-3 py-1 text-[10px] tracking-[0.2em] uppercase"
            style={{ background: "rgba(10,10,10,0.7)", color: statusInfo.color, border: `1px solid ${statusInfo.color}50` }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: statusInfo.color }} />
            {statusInfo.label}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="text-[10px] tracking-[0.25em] uppercase mb-2" style={{ color: "#C9A84C" }}>
          {district}
        </div>
        <h3 className="text-white font-light leading-tight mb-3 line-clamp-1"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22 }}
        >{property.title || "Байр"}</h3>
        <div className="font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "#C9A84C", fontSize: 20 }}
        >
          {price}₮ <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">/ сар</span>
        </div>
      </div>
    </Link>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse" style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.06)" }}>
          <div style={{ aspectRatio: "4/3", background: "rgba(255,255,255,0.03)" }} />
          <div className="p-5 space-y-3">
            <div className="h-3 w-20" style={{ background: "rgba(255,255,255,0.05)" }} />
            <div className="h-5 w-3/4" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="h-4 w-28" style={{ background: "rgba(201,168,76,0.1)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6"
      style={{ border: "1px solid rgba(201,168,76,0.15)", background: "rgba(201,168,76,0.02)" }}
    >
      <div className="w-16 h-16 mb-8 flex items-center justify-center" style={{ border: "1px solid #C9A84C" }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.4">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      </div>
      <h3 className="font-light text-white mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32 }}>
        Хадгалсан байр <em style={{ color: "#C9A84C", fontStyle: "italic" }}>алга</em>
      </h3>
      <p className="text-sm text-white/50 max-w-md mb-8 leading-relaxed">
        Байрны жагсаалт дээрх зүрхэн товчийг дарж дуртай байраа хадгалаарай.
      </p>
      <Link to="/home"
        className="inline-block px-8 py-3 text-[10px] tracking-[0.3em] uppercase transition-all duration-300"
        style={{ background: "#C9A84C", color: "#0A0A0A" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#E8D49E")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#C9A84C")}
      >Байр хайх →</Link>
    </div>
  );
}

export default Favorites;