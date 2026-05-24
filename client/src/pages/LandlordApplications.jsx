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

function LandlordApplications() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [actioningId, setActioningId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "landlord" && user.role !== "admin") {
      navigate("/home");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/applications/landlord");
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

  const handleApprove = async (id) => {
    if (
      !confirm(
        "Та энэ өргөдлийг зөвшөөрөхдөө итгэлтэй байна уу? Энэ нь гэрээ үүсгэх процесс эхлүүлнэ."
      )
    )
      return;
    setActioningId(id);
    try {
      const res = await api.put(`/api/applications/${id}`, {
        status: "approved",
      });
      setApps((prev) =>
        prev.map((a) =>
          a._id === id ? { ...a, status: "approved", ...(res.data || {}) } : a
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Зөвшөөрч чадсангүй");
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id) => {
    if (!confirm("Та энэ өргөдлийг татгалзахдаа итгэлтэй байна уу?"))
      return;
    setActioningId(id);
    try {
      const res = await api.put(`/api/applications/${id}`, {
        status: "rejected",
      });
      setApps((prev) =>
        prev.map((a) =>
          a._id === id ? { ...a, status: "rejected", ...(res.data || {}) } : a
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Татгалзаж чадсангүй");
    } finally {
      setActioningId(null);
    }
  };

  // ── Unique properties for filter ──
  const properties = useMemo(() => {
    const seen = new Map();
    for (const a of apps) {
      if (a.property?._id && !seen.has(a.property._id)) {
        seen.set(a.property._id, a.property);
      }
    }
    return [...seen.values()];
  }, [apps]);

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      if (filter !== "all" && a.status !== filter) return false;
      if (propertyFilter && a.property?._id !== propertyFilter) return false;
      return true;
    });
  }, [apps, filter, propertyFilter]);

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
      <header className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-8" style={{ background: "#C9A84C" }} />
          <span
            className="text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "#C9A84C" }}
          >
            Incoming Applications
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
            Ирсэн<br />
            <em style={{ color: "#C9A84C", fontStyle: "italic" }}>
              өргөдлүүд
            </em>
          </h1>

          {counts.pending > 0 && (
            <div
              className="px-5 py-3"
              style={{
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.4)",
              }}
            >
              <div className="text-[10px] tracking-[0.25em] uppercase text-amber-300/70 mb-1">
                Шинэ хүлээгдэж буй
              </div>
              <div
                className="font-light"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 32,
                  color: "#F59E0B",
                }}
              >
                {counts.pending}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 mb-10">
        {/* Status tabs */}
        <div
          className="flex flex-wrap gap-1 overflow-x-auto mb-4"
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

        {/* Property filter */}
        {properties.length > 1 && (
          <div className="flex items-center gap-4">
            <span className="text-[10px] tracking-[0.25em] uppercase text-white/40 whitespace-nowrap">
              Байр:
            </span>
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="flex-1 max-w-md bg-transparent text-white text-sm py-2 outline-none"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.15)",
                colorScheme: "dark",
              }}
            >
              <option value="" style={{ background: "#141414" }}>
                Бүх байр ({properties.length})
              </option>
              {properties.map((p) => (
                <option
                  key={p._id}
                  value={p._id}
                  style={{ background: "#141414" }}
                >
                  {p.title}
                </option>
              ))}
            </select>
            {propertyFilter && (
              <button
                onClick={() => setPropertyFilter("")}
                className="text-[10px] tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors"
              >
                ✕ Цэвэрлэх
              </button>
            )}
          </div>
        )}
      </section>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 pb-20">
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
          <EmptyState filter={filter} hasProperty={!!propertyFilter} />
        ) : (
          <div className="space-y-5">
            {filtered.map((app) => (
              <LandlordApplicationCard
                key={app._id}
                app={app}
                onApprove={handleApprove}
                onReject={handleReject}
                actioning={actioningId === app._id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Landlord Application Card ──
function LandlordApplicationCard({ app, onApprove, onReject, actioning }) {
  const property = app.property || {};
  const tenant = app.tenant || {};
  const cover = property.photos?.[0] || PLACEHOLDER;
  const statusInfo = APP_STATUS[app.status] || APP_STATUS.pending;
  const contractInfo =
    CONTRACT_STATUS[app.contractStatus] || CONTRACT_STATUS.none;
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

  const canApprove = app.status === "pending";
  const canReject = app.status === "pending";
  const canViewContract =
    app.status === "approved" && app.contractStatus !== "cancelled";

  return (
    <article
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 transition-all duration-300"
      style={{
        background: "#141414",
        border: `1px solid ${
          app.status === "pending"
            ? "rgba(245,158,11,0.2)"
            : "rgba(201,168,76,0.1)"
        }`,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor =
          app.status === "pending"
            ? "rgba(245,158,11,0.5)"
            : "rgba(201,168,76,0.3)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor =
          app.status === "pending"
            ? "rgba(245,158,11,0.2)"
            : "rgba(201,168,76,0.1)")
      }
    >
      {/* Image */}
      <Link
        to={property._id ? `/properties/${property._id}` : "#"}
        className="lg:col-span-2 block relative overflow-hidden group"
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

      {/* Property + tenant info */}
      <div className="lg:col-span-6">
        <div className="flex items-center gap-3 mb-2 text-[10px] tracking-[0.25em] uppercase">
          <span style={{ color: "#C9A84C" }}>
            {property.district || "—"}
          </span>
          <span className="text-white/30">·</span>
          <span className="text-white/40">{date}</span>
        </div>

        <h3
          className="text-white font-light leading-tight mb-2"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 24,
          }}
        >
          {property.title || "Байр"}
        </h3>

        <div
          className="font-light mb-5"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: "#C9A84C",
            fontSize: 20,
          }}
        >
          {formattedPrice}₮{" "}
          <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">
            / сар
          </span>
        </div>

        {/* Tenant info */}
        <div
          className="pt-4 mb-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="text-[9px] tracking-[0.3em] uppercase text-white/40 mb-3">
            Түрээслэгч
          </div>
          <div className="flex items-start gap-4">
            <div
              className="w-11 h-11 flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(201,168,76,0.12)",
                color: "#C9A84C",
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 20,
              }}
            >
              {(tenant.name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white mb-1">
                {tenant.name || "Хэрэглэгч"}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/55">
                {tenant.email && (
                  <a
                    href={`mailto:${tenant.email}`}
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <span style={{ color: "#C9A84C" }}>◇</span>
                    {tenant.email}
                  </a>
                )}
                {tenant.phone && (
                  <a
                    href={`tel:${tenant.phone}`}
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <span style={{ color: "#C9A84C" }}>◇</span>
                    {tenant.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {app.message && (
          <div
            className="p-3 text-xs text-white/60 leading-relaxed"
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
      </div>

      {/* Status + Actions */}
      <div className="lg:col-span-4 flex flex-col gap-3 lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <StatusPill label={statusInfo.label} color={statusInfo.color} />
          {app.status === "approved" && app.contractStatus && (
            <StatusPill
              label={`Гэрээ: ${contractInfo.label}`}
              color={contractInfo.color}
            />
          )}
        </div>

        <div className="flex flex-col gap-2 mt-auto">
          {canApprove && (
            <button
              onClick={() => onApprove(app._id)}
              disabled={actioning}
              className="w-full py-3 text-center text-[10px] tracking-[0.25em] uppercase transition-all duration-300 disabled:opacity-50 group flex items-center justify-center gap-2"
              style={{ background: "#C9A84C", color: "#0A0A0A" }}
              onMouseEnter={(e) =>
                !actioning &&
                (e.currentTarget.style.background = "#E8D49E")
              }
              onMouseLeave={(e) =>
                !actioning &&
                (e.currentTarget.style.background = "#C9A84C")
              }
            >
              {actioning ? "..." : "Зөвшөөрөх"}
              {!actioning && (
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              )}
            </button>
          )}
          {canReject && (
            <button
              onClick={() => onReject(app._id)}
              disabled={actioning}
              className="w-full py-3 text-center text-[10px] tracking-[0.25em] uppercase text-red-300 hover:text-red-200 transition-colors disabled:opacity-50"
              style={{ border: "1px solid rgba(239,68,68,0.4)" }}
            >
              {actioning ? "..." : "Татгалзах"}
            </button>
          )}
          {canViewContract && (
            <Link
              to={`/contract/${app._id}`}
              className="w-full py-3 text-center text-[10px] tracking-[0.25em] uppercase transition-all duration-300"
              style={{ background: "#C9A84C", color: "#0A0A0A" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#E8D49E")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#C9A84C")
              }
            >
              Гэрээ үзэх →
            </Link>
          )}
          {property._id && (
            <Link
              to={`/properties/${property._id}`}
              className="w-full py-3 text-center text-[10px] tracking-[0.25em] uppercase text-white/60 hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}
            >
              Байр үзэх
            </Link>
          )}
        </div>
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
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 animate-pulse"
          style={{
            background: "#141414",
            border: "1px solid rgba(201,168,76,0.08)",
          }}
        >
          <div
            className="lg:col-span-2 aspect-[4/3]"
            style={{ background: "rgba(255,255,255,0.03)" }}
          />
          <div className="lg:col-span-6 space-y-3">
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
          <div className="lg:col-span-4 space-y-2">
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

// ── Empty state ──
function EmptyState({ filter, hasProperty }) {
  const messages = {
    all: hasProperty
      ? {
          title: "Энэ байранд өргөдөл алга",
          body: "Сонгосон байранд хараахан өргөдөл ирээгүй байна.",
        }
      : {
          title: "Өргөдөл байхгүй",
          body: "Танай байруудад хараахан түрээслэгчийн өргөдөл ирээгүй байна.",
        },
    pending: {
      title: "Хүлээгдэж буй өргөдөл алга",
      body: "Бүх өргөдлийн хариу өгсөн байна.",
    },
    approved: {
      title: "Зөвшөөрсөн өргөдөл алга",
      body: "Та хараахан өргөдөл зөвшөөрөөгүй байна.",
    },
    rejected: {
      title: "Татгалзсан өргөдөл алга",
      body: "Та хараахан өргөдөл татгалзаагүй байна.",
    },
    cancelled: {
      title: "Цуцалсан өргөдөл алга",
      body: "Цуцалсан өргөдөл одоогоор байхгүй.",
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
        to="/my-properties"
        className="inline-block px-8 py-3 text-[10px] tracking-[0.3em] uppercase transition-all duration-300"
        style={{ background: "#C9A84C", color: "#0A0A0A" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#E8D49E")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#C9A84C")}
      >
        Миний байрууд →
      </Link>
    </div>
  );
}

export default LandlordApplications;