import { useState, useEffect, useMemo } from "react";
import api from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=70";

const CONTRACT_STATUS = {
  pending_signatures: {
    label: "Гарын үсэг хүлээж буй",
    color: "#F59E0B",
  },
  signed: { label: "Гарын үсэг зурсан", color: "#C9A84C" },
  payment_pending: {
    label: "Эхний төлбөр хүлээж буй",
    color: "#F59E0B",
  },
  active: { label: "Идэвхтэй", color: "#10B981" },
};

const FILTER_TABS = [
  { v: "all", label: "Бүгд" },
  { v: "active", label: "Идэвхтэй" },
  { v: "pending_signatures", label: "Гарын үсэг" },
  { v: "payment_pending", label: "Төлбөр хүлээж буй" },
];

// Гэрээний статусын дараалал
const ACTIVE_CONTRACT_STATUSES = [
  "pending_signatures",
  "signed",
  "payment_pending",
  "active",
];

function MyRentals() {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
      navigate("/login");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/applications/me");
        if (cancelled) return;
        // Зөвхөн идэвхтэй гэрээтэй өргөдлүүд
        const onlyRentals = (res.data || []).filter((a) =>
          ACTIVE_CONTRACT_STATUSES.includes(a.contractStatus)
        );
        setRentals(onlyRentals);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Татаж чадсангүй");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const filtered = useMemo(() => {
    if (filter === "all") return rentals;
    return rentals.filter((r) => r.contractStatus === filter);
  }, [rentals, filter]);

  const counts = useMemo(() => {
    const c = { all: rentals.length };
    for (const s of ACTIVE_CONTRACT_STATUSES) {
      c[s] = rentals.filter((r) => r.contractStatus === s).length;
    }
    return c;
  }, [rentals]);

  // Нийт сар бүрийн зардал
  const totalMonthly = useMemo(() => {
    return rentals
      .filter((r) => r.contractStatus === "active")
      .reduce((sum, r) => sum + (r.property?.price || 0), 0);
  }, [rentals]);

  return (
    <div
      className="min-h-screen pt-20"
      style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-8" style={{ background: "#C9A84C" }} />
          <span
            className="text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "#C9A84C" }}
          >
            Active Rentals
          </span>
        </div>
        <h1
          className="font-light text-white leading-[1] tracking-tight"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(40px, 5vw, 64px)",
          }}
        >
          Миний<br />
          <em style={{ color: "#C9A84C", fontStyle: "italic" }}>
            түрээсүүд
          </em>
        </h1>
      </header>

      {/* Stats */}
      {!loading && rentals.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 lg:px-12 mb-10">
          <div
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
            style={{ border: "1px solid rgba(201,168,76,0.15)" }}
          >
            <div
              className="p-6"
              style={{
                borderRight: "1px solid rgba(201,168,76,0.08)",
              }}
            >
              <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-2">
                Нийт түрээс
              </div>
              <div
                className="font-light leading-none"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 40,
                  color: "#C9A84C",
                }}
              >
                {rentals.length}
              </div>
            </div>
            <div
              className="p-6"
              style={{
                borderRight: "1px solid rgba(201,168,76,0.08)",
              }}
            >
              <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-2">
                Идэвхтэй
              </div>
              <div
                className="font-light leading-none"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 40,
                  color: "#10B981",
                }}
              >
                {counts.active || 0}
              </div>
            </div>
            <div className="p-6 col-span-2 md:col-span-1">
              <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-2">
                Сарын нийт зардал
              </div>
              <div
                className="font-light leading-none"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 32,
                  color: "#C9A84C",
                }}
              >
                {new Intl.NumberFormat("mn-MN").format(totalMonthly)}₮
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filter tabs */}
      {!loading && rentals.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 lg:px-12 mb-8">
          <div
            className="flex flex-wrap gap-1 overflow-x-auto"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.v}
                onClick={() => setFilter(tab.v)}
                className="px-5 py-4 text-[10px] tracking-[0.25em] uppercase transition-all duration-300 flex items-center gap-2 whitespace-nowrap relative"
                style={{
                  color:
                    filter === tab.v ? "#C9A84C" : "rgba(255,255,255,0.5)",
                }}
              >
                {tab.label}
                <span
                  className="inline-flex items-center justify-center min-w-5 px-1.5 text-[10px]"
                  style={{
                    background:
                      filter === tab.v
                        ? "#C9A84C"
                        : "rgba(255,255,255,0.05)",
                    color: filter === tab.v ? "#0A0A0A" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {counts[tab.v] || 0}
                </span>
                {filter === tab.v && (
                  <div
                    className="absolute bottom-0 left-0 right-0"
                    style={{ height: 1, background: "#C9A84C" }}
                  />
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 lg:px-12 pb-20">
        {error && (
          <div
            className="mb-6 p-4 flex items-start gap-3"
            style={{
              background: "rgba(239,68,68,0.08)",
              borderLeft: "2px solid #EF4444",
            }}
          >
            <span style={{ color: "#EF4444" }}>✕</span>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {loading ? (
          <LoadingList />
        ) : filtered.length === 0 ? (
          <EmptyState hasRentals={rentals.length > 0} />
        ) : (
          <div className="space-y-5">
            {filtered.map((rental) => (
              <RentalCard key={rental._id} rental={rental} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Rental Card ──
function RentalCard({ rental }) {
  const property = rental.property || {};
  const landlord = rental.landlord || property.owner || {};
  const cover = property.photos?.[0] || PLACEHOLDER;
  const contractInfo =
    CONTRACT_STATUS[rental.contractStatus] || CONTRACT_STATUS.pending_signatures;
  const formattedPrice = new Intl.NumberFormat("mn-MN").format(
    (property.price ?? property.monthlyRent ?? 0)
  );
  const date = rental.updatedAt
    ? new Date(rental.updatedAt).toLocaleDateString("mn-MN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const isActive = rental.contractStatus === "active";
  const needsPayment = rental.contractStatus === "payment_pending";
  const needsSigning = rental.contractStatus === "pending_signatures";

  return (
    <article
      className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 transition-all duration-300"
      style={{
        background: "#141414",
        border: `1px solid ${
          isActive
            ? "rgba(16,185,129,0.2)"
            : needsPayment || needsSigning
              ? "rgba(245,158,11,0.2)"
              : "rgba(201,168,76,0.15)"
        }`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isActive
          ? "rgba(16,185,129,0.5)"
          : needsPayment || needsSigning
            ? "rgba(245,158,11,0.5)"
            : "rgba(201,168,76,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isActive
          ? "rgba(16,185,129,0.2)"
          : needsPayment || needsSigning
            ? "rgba(245,158,11,0.2)"
            : "rgba(201,168,76,0.15)";
      }}
    >
      {/* Image */}
      <Link
        to={property._id ? `/properties/${property._id}` : "#"}
        className="md:col-span-3 block relative overflow-hidden group"
        style={{
          aspectRatio: "4/3",
          border: "1px solid rgba(201,168,76,0.15)",
        }}
      >
        <img
          src={cover}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ filter: "brightness(0.88)" }}
          onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
        />
      </Link>

      {/* Body */}
      <div className="md:col-span-6">
        <div className="flex items-center gap-3 mb-2 text-[10px] tracking-[0.25em] uppercase">
          <span style={{ color: "#C9A84C" }}>
            {property.district || "Улаанбаатар"}
          </span>
          <span className="text-white/30">·</span>
          <span className="text-white/40">{date}</span>
        </div>

        <h3
          className="text-white font-light leading-tight mb-2"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 26,
          }}
        >
          {property.title || "Байр"}
        </h3>

        <p className="text-xs text-white/50 mb-3">
          {property.address || "—"}
        </p>

        <div
          className="font-light mb-5"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: "#C9A84C",
            fontSize: 22,
          }}
        >
          {formattedPrice}₮{" "}
          <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">
            / сар
          </span>
        </div>

        {/* Landlord */}
        {landlord.name && (
          <div
            className="pt-4 flex items-center gap-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="w-9 h-9 flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(201,168,76,0.12)",
                color: "#C9A84C",
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 16,
              }}
            >
              {landlord.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] tracking-[0.3em] uppercase text-white/40 mb-0.5">
                Байрны эзэн
              </div>
              <div className="text-xs text-white/80">{landlord.name}</div>
            </div>
            <div className="flex gap-2">
              {landlord.email && (
                <a
                  href={`mailto:${landlord.email}`}
                  className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-[#C9A84C] transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                  title={landlord.email}
                >
                  ◇
                </a>
              )}
              {landlord.phone && (
                <a
                  href={`tel:${landlord.phone}`}
                  className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-[#C9A84C] transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                  title={landlord.phone}
                >
                  ◇
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status + Actions */}
      <div className="md:col-span-3 flex flex-col gap-3 justify-between">
        <StatusPill label={contractInfo.label} color={contractInfo.color} />

        <div className="flex flex-col gap-2">
          {needsSigning && (
            <Link
              to={`/contract/${rental._id}`}
              className="w-full py-3 text-center text-[10px] tracking-[0.25em] uppercase transition-all duration-300"
              style={{ background: "#F59E0B", color: "#0A0A0A" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#FBBF24")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#F59E0B")
              }
            >
              Гарын үсэг →
            </Link>
          )}
          {needsPayment && (
            <Link
              to={`/payment/${rental._id}`}
              className="w-full py-3 text-center text-[10px] tracking-[0.25em] uppercase transition-all duration-300"
              style={{ background: "#C9A84C", color: "#0A0A0A" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#E8D49E")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#C9A84C")
              }
            >
              Төлбөр төлөх →
            </Link>
          )}
          {isActive && (
            <Link
              to={`/payment/${rental._id}`}
              className="w-full py-3 text-center text-[10px] tracking-[0.25em] uppercase transition-all duration-300"
              style={{ background: "#C9A84C", color: "#0A0A0A" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#E8D49E")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#C9A84C")
              }
            >
              Төлбөр →
            </Link>
          )}
          <Link
            to={`/contract/${rental._id}`}
            className="w-full py-3 text-center text-[10px] tracking-[0.25em] uppercase transition-colors"
            style={{
              border: "1px solid #C9A84C",
              color: "#C9A84C",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(201,168,76,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Гэрээ үзэх
          </Link>
        </div>
      </div>
    </article>
  );
}

function StatusPill({ label, color }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase self-start"
      style={{
        background: `${color}15`,
        color,
        border: `1px solid ${color}50`,
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </div>
  );
}

function LoadingList() {
  return (
    <div className="space-y-5">
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 animate-pulse"
          style={{
            background: "#141414",
            border: "1px solid rgba(201,168,76,0.08)",
          }}
        >
          <div
            className="md:col-span-3 aspect-[4/3]"
            style={{ background: "rgba(255,255,255,0.03)" }}
          />
          <div className="md:col-span-6 space-y-3">
            <div
              className="h-3 w-24"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
            <div
              className="h-5 w-3/4"
              style={{ background: "rgba(255,255,255,0.08)" }}
            />
            <div
              className="h-4 w-32"
              style={{ background: "rgba(201,168,76,0.1)" }}
            />
          </div>
          <div className="md:col-span-3 space-y-2">
            <div
              className="h-9 w-full"
              style={{ background: "rgba(201,168,76,0.1)" }}
            />
            <div
              className="h-9 w-full"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasRentals }) {
  if (!hasRentals) {
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
            fontSize: 32,
          }}
        >
          Идэвхтэй <em style={{ color: "#C9A84C", fontStyle: "italic" }}>түрээс алга</em>
        </h3>
        <p className="text-sm text-white/50 max-w-md mb-8 leading-relaxed">
          Та хараахан байр түрээслээгүй байна. Цуглуулгаас сонирхсон
          байраа сонгож өргөдөл гаргаарай.
        </p>
        <Link
          to="/home"
          className="inline-block px-8 py-3 text-[10px] tracking-[0.3em] uppercase transition-all duration-300"
          style={{ background: "#C9A84C", color: "#0A0A0A" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#E8D49E")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#C9A84C")}
        >
          Байр хайх →
        </Link>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center text-center py-16 px-6"
      style={{ border: "1px solid rgba(201,168,76,0.1)" }}
    >
      <p className="text-sm text-white/50">
        Сонгосон төлөвт түрээс байхгүй
      </p>
    </div>
  );
}

export default MyRentals;