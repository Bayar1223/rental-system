import { useState, useEffect, useMemo } from "react";
import api from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=70";

const APP_STATUS = {
  pending: { label: "Хүлээгдэж буй", color: "#F59E0B" },
  approved: { label: "Зөвшөөрсөн", color: "#10B981" },
  rejected: { label: "Татгалзсан", color: "#EF4444" },
  cancelled: { label: "Цуцалсан", color: "#888" },
};

const CONTRACT_STATUS = {
  none: { label: "Гэрээгүй", color: "#888" },
  pending_signatures: { label: "Гарын үсэг хүлээж буй", color: "#F59E0B" },
  signed: { label: "Гарын үсэг зурсан", color: "#C9A84C" },
  payment_pending: { label: "Эхний төлбөр хүлээж буй", color: "#F59E0B" },
  active: { label: "Идэвхтэй", color: "#10B981" },
  cancelled: { label: "Цуцалсан", color: "#888" },
};

const FILTER_TABS = [
  { v: "all", label: "Бүгд" },
  { v: "pending", label: "Хүлээгдэж буй" },
  { v: "approved", label: "Зөвшөөрсөн" },
  { v: "rejected", label: "Татгалзсан" },
  { v: "cancelled", label: "Цуцалсан" },
];

function MyApplications() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actioningId, setActioningId] = useState(null);
  const [error, setError] = useState("");

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
        setApps(res.data || []);
      } catch (err) {
        if (cancelled) return;
        setError(
          err.response?.data?.message || "Өргөдөл татаж чадсангүй"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleCancel = async (id) => {
    if (!confirm("Та өргөдлөө цуцлахдаа итгэлтэй байна уу?")) return;
    setActioningId(id);
    try {
      const res = await api.put(`/api/applications/${id}`, {
        status: "cancelled",
      });
      setApps((prev) =>
        prev.map((a) =>
          a._id === id ? { ...a, status: "cancelled", ...(res.data || {}) } : a
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Цуцалж чадсангүй");
    } finally {
      setActioningId(null);
    }
  };

  const filtered = useMemo(() => {
    if (filter === "all") return apps;
    return apps.filter((a) => a.status === filter);
  }, [apps, filter]);

  const counts = useMemo(() => {
    const c = { all: apps.length };
    for (const s of ["pending", "approved", "rejected", "cancelled"]) {
      c[s] = apps.filter((a) => a.status === s).length;
    }
    return c;
  }, [apps]);

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
            Applications
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
            өргөдлүүд
          </em>
        </h1>
      </header>

      {/* Filter tabs */}
      <section className="max-w-6xl mx-auto px-6 lg:px-12 mb-10">
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
          <EmptyState filter={filter} />
        ) : (
          <div className="space-y-5">
            {filtered.map((app) => (
              <ApplicationCard
                key={app._id}
                app={app}
                onCancel={handleCancel}
                actioning={actioningId === app._id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Application Card (tenant view) ──
function ApplicationCard({ app, onCancel, actioning }) {
  const property = app.property || {};
  const cover = property.photos?.[0] || PLACEHOLDER;
  const statusInfo = APP_STATUS[app.status] || APP_STATUS.pending;
  const contractInfo = CONTRACT_STATUS[app.contractStatus] || CONTRACT_STATUS.none;
  const formattedPrice = new Intl.NumberFormat("mn-MN").format(
    (property.price ?? property.monthlyRent ?? 0)
  );
  const date = app.createdAt
    ? new Date(app.createdAt).toLocaleDateString("mn-MN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const canCancel = app.status === "pending";
  const canViewContract =
    app.status === "approved" && app.contractStatus !== "cancelled";
  const canViewPayment =
    app.contractStatus === "active" ||
    app.contractStatus === "payment_pending";

  return (
    <article
      className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 transition-all duration-300"
      style={{
        background: "#141414",
        border: "1px solid rgba(201,168,76,0.1)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "rgba(201,168,76,0.1)")
      }
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
      <div className="md:col-span-6 flex flex-col">
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

        <div
          className="font-light mb-4"
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

        {app.message && (
          <div
            className="mt-2 p-3 text-xs text-white/60 leading-relaxed"
            style={{
              background: "rgba(255,255,255,0.02)",
              borderLeft: "1px solid rgba(201,168,76,0.3)",
            }}
          >
            <div className="text-[9px] tracking-[0.25em] uppercase text-white/40 mb-1.5">
              Захидал
            </div>
            {app.message}
          </div>
        )}

        {/* Status badges */}
        <div className="mt-auto pt-4 flex flex-wrap gap-2">
          <StatusPill label={statusInfo.label} color={statusInfo.color} />
          {app.status === "approved" && app.contractStatus && (
            <StatusPill
              label={`Гэрээ: ${contractInfo.label}`}
              color={contractInfo.color}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="md:col-span-3 flex md:flex-col gap-2 md:justify-center">
        {property._id && (
          <Link
            to={`/properties/${property._id}`}
            className="flex-1 md:flex-initial py-2.5 px-4 text-center text-[10px] tracking-[0.25em] uppercase text-white/60 hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.12)" }}
          >
            Байр үзэх
          </Link>
        )}
        {canViewContract && (
          <Link
            to={`/contract/${app._id}`}
            className="flex-1 md:flex-initial py-2.5 px-4 text-center text-[10px] tracking-[0.25em] uppercase transition-all duration-300"
            style={{ background: "#C9A84C", color: "#0A0A0A" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#E8D49E")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#C9A84C")
            }
          >
            Гэрээ →
          </Link>
        )}
        {canViewPayment && (
          <Link
            to={`/payments/${app._id}`}
            className="flex-1 md:flex-initial py-2.5 px-4 text-center text-[10px] tracking-[0.25em] uppercase transition-all duration-300"
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
            Төлбөр
          </Link>
        )}
        {canCancel && (
          <button
            onClick={() => onCancel(app._id)}
            disabled={actioning}
            className="flex-1 md:flex-initial py-2.5 px-4 text-center text-[10px] tracking-[0.25em] uppercase text-red-300 hover:text-red-200 transition-colors disabled:opacity-50"
            style={{ border: "1px solid rgba(239,68,68,0.4)" }}
          >
            {actioning ? "..." : "Цуцлах"}
          </button>
        )}
      </div>
    </article>
  );
}

// ── Status pill ──
function StatusPill({ label, color }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1 text-[10px] tracking-[0.2em] uppercase"
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

// ── Loading skeleton ──
function LoadingList() {
  return (
    <div className="space-y-5">
      {[...Array(3)].map((_, i) => (
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
            <div
              className="h-3 w-full mt-4"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
          </div>
          <div className="md:col-span-3 space-y-2">
            <div
              className="h-9 w-full"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
            <div
              className="h-9 w-full"
              style={{ background: "rgba(201,168,76,0.08)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty state ──
function EmptyState({ filter }) {
  const messages = {
    all: {
      title: "Өргөдөл байхгүй",
      body: "Та хараахан байр түрээслэх хүсэлт явуулаагүй байна.",
    },
    pending: {
      title: "Хүлээгдэж буй өргөдөл байхгүй",
      body: "Шинэ өргөдлийн хариу хүлээгдэж байна.",
    },
    approved: {
      title: "Зөвшөөрсөн өргөдөл байхгүй",
      body: "Танай өргөдлүүд зөвшөөрөгдөхөд эндээс харагдана.",
    },
    rejected: {
      title: "Татгалзсан өргөдөл байхгүй",
      body: "Сайн байна! Татгалзсан өргөдөл одоогоор алга.",
    },
    cancelled: {
      title: "Цуцалсан өргөдөл байхгүй",
      body: "Та хараахан өргөдөл цуцлаагүй байна.",
    },
  };
  const m = messages[filter] || messages.all;
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
        {m.title}
      </h3>
      <p className="text-sm text-white/50 max-w-md mb-8 leading-relaxed">
        {m.body}
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

export default MyApplications;