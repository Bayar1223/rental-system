import { useState, useEffect, useMemo } from "react";
import api from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=70";

const STATUS_META = {
  urgent:    { label: "Яаралтай",      color: "#EF4444", priority: 1 },
  overdue:   { label: "Хоцорсон",      color: "#EF4444", priority: 2 },
  pending:   { label: "Хүлээгдэж буй", color: "#F59E0B", priority: 3 },
  paid:      { label: "Төлсөн",         color: "#10B981", priority: 4 },
  cancelled: { label: "Цуцалсан",       color: "#888",    priority: 5 },
};

const FILTER_TABS = [
  { v: "all",     label: "Бүгд" },
  { v: "active",  label: "Идэвхтэй" },
  { v: "paid",    label: "Төлсөн" },
  { v: "overdue", label: "Хоцорсон" },
];

function fmt(n)     { return new Intl.NumberFormat("mn-MN").format(n || 0); }
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" });
}

function MyPayments() {
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);

  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [filter, setFilter]     = useState("all");
  const [paying, setPaying]     = useState(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }

    let cancelled = false;
    (async () => {
      try {
        // Landlord бол /landlord, түрээслэгч бол /my
        const url = user.role === "landlord" ? "/api/payments/landlord" : "/api/payments/my";
        const res = await api.get(url);
        if (cancelled) return;
        setPayments(res.data || []);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Татаж чадсангүй");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate, user]);

  const handleQuickPay = async (id) => {
    if (!confirm("Энэ төлбөрийг төлсөн гэж тэмдэглэх үү?")) return;
    setPaying(id);
    try {
      const res = await api.put(`/api/payments/${id}/pay`, { paymentMethod: "demo" });
      const updated = res.data?.payment;
      setPayments((prev) => prev.map((p) =>
        p._id === id ? { ...p, status: "paid", paidAt: updated?.paidAt || new Date().toISOString() } : p
      ));
    } catch (err) {
      alert(err.response?.data?.message || "Төлбөр хийгдсэнгүй");
    } finally {
      setPaying(null);
    }
  };

  const sorted = useMemo(() => {
    return [...payments].sort((a, b) => {
      const pa = STATUS_META[a.status]?.priority || 99;
      const pb = STATUS_META[b.status]?.priority || 99;
      if (pa !== pb) return pa - pb;
      return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
    });
  }, [payments]);

  const filtered = useMemo(() => {
    if (filter === "all")     return sorted;
    if (filter === "active")  return sorted.filter((p) => ["urgent", "pending"].includes(p.status));
    if (filter === "paid")    return sorted.filter((p) => p.status === "paid");
    if (filter === "overdue") return sorted.filter((p) => p.status === "overdue");
    return sorted;
  }, [sorted, filter]);

  const totals = useMemo(() => {
    const t = { total: 0, paid: 0, due: 0, overdue: 0 };
    for (const p of payments) {
      const amt = p.totalAmount || 0;
      t.total += amt;
      if (p.status === "paid") t.paid += amt;
      if (["pending", "urgent"].includes(p.status)) t.due += amt;
      if (p.status === "overdue") t.overdue += amt;
    }
    return t;
  }, [payments]);

  const counts = useMemo(() => ({
    all:     payments.length,
    active:  payments.filter((p) => ["urgent", "pending"].includes(p.status)).length,
    paid:    payments.filter((p) => p.status === "paid").length,
    overdue: payments.filter((p) => p.status === "overdue").length,
  }), [payments]);

  return (
    <div className="min-h-screen pt-20" style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}>
      <header className="max-w-6xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-8" style={{ background: "#C9A84C" }} />
          <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#C9A84C" }}>
            {user?.role === "landlord" ? "Income" : "My Payments"}
          </span>
        </div>
        <h1 className="font-light text-white leading-[1] tracking-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(40px, 5vw, 64px)" }}
        >
          {user?.role === "landlord" ? "Орлогын" : "Төлбөрийн"}<br />
          <em style={{ color: "#C9A84C", fontStyle: "italic" }}>хуваарь</em>
        </h1>
      </header>

      {/* Stats */}
      {!loading && payments.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 lg:px-12 mb-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            style={{ border: "1px solid rgba(201,168,76,0.15)" }}
          >
            {[
              { label: "Нийт",          value: totals.total,   color: "#C9A84C" },
              { label: "Төлсөн",        value: totals.paid,    color: "#10B981" },
              { label: "Хүлээгдэж буй", value: totals.due,     color: "#F59E0B" },
              { label: "Хоцорсон",      value: totals.overdue, color: "#EF4444" },
            ].map((s, i) => (
              <div key={s.label} className="p-5"
                style={{ borderRight: i < 3 ? "1px solid rgba(201,168,76,0.08)" : "none" }}
              >
                <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-2">{s.label}</div>
                <div className="font-light leading-none"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: s.color }}
                >{fmt(s.value)}₮</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filter tabs */}
      {!loading && payments.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 lg:px-12 mb-8">
          <div className="flex flex-wrap gap-1 overflow-x-auto"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
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

      <main className="max-w-6xl mx-auto px-6 lg:px-12 pb-20">
        {error && (
          <div className="mb-6 p-4 flex items-start gap-3"
            style={{ background: "rgba(239,68,68,0.08)", borderLeft: "2px solid #EF4444" }}
          >
            <span style={{ color: "#EF4444" }}>✕</span>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {loading ? <LoadingList />
          : filtered.length === 0 ? <EmptyState hasAny={payments.length > 0} role={user?.role} />
          : (
            <div className="space-y-3">
              {filtered.map((p) => (
                <PaymentCard key={p._id} payment={p}
                  isTenant={user?.role !== "landlord"}
                  onQuickPay={handleQuickPay}
                  paying={paying === p._id}
                />
              ))}
            </div>
          )
        }
      </main>
    </div>
  );
}

function PaymentCard({ payment, isTenant, onQuickPay, paying }) {
  const meta = STATUS_META[payment.status] || STATUS_META.pending;
  const property = payment.property || {};
  const cover    = property.images?.[0] || PLACEHOLDER;
  const district = property.location?.district || "Улаанбаатар";
  const isUrgent = payment.status === "urgent";
  const canPay   = isTenant && ["urgent", "pending", "overdue"].includes(payment.status);
  const isPaid   = payment.status === "paid";

  return (
    <article className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center transition-all duration-300"
      style={{
        background: isUrgent ? "rgba(239,68,68,0.04)" : "#141414",
        border: `1px solid ${
          isUrgent ? "rgba(239,68,68,0.3)"
          : payment.status === "overdue" ? "rgba(239,68,68,0.2)"
          : isPaid ? "rgba(16,185,129,0.15)"
          : "rgba(201,168,76,0.1)"
        }`,
      }}
    >
      {/* Image */}
      <Link to={property._id ? `/properties/${property._id}` : "#"}
        className="md:col-span-2 block relative overflow-hidden"
        style={{ aspectRatio: "4/3", border: "1px solid rgba(201,168,76,0.15)" }}
      >
        <img src={cover} alt="" className="w-full h-full object-cover"
          style={{ filter: "brightness(0.88)" }}
          onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
        />
      </Link>

      {/* Details */}
      <div className="md:col-span-6">
        <div className="flex items-center gap-3 mb-1 text-[10px] tracking-[0.25em] uppercase">
          <span style={{ color: "#C9A84C" }}>{district}</span>
          <span className="text-white/30">·</span>
          <span className="text-white/40">№{payment.paymentNumber} төлбөр</span>
          {payment.includesDeposit && (
            <span className="px-1.5 py-0.5"
              style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C" }}
            >+ Барьцаа</span>
          )}
        </div>
        <h3 className="text-white font-light leading-tight mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22 }}
        >{property.title || "Байр"}</h3>
        <div className="flex items-center gap-3 text-xs text-white/60 flex-wrap">
          <span>Эцсийн огноо: {fmtDate(payment.dueDate)}</span>
          {payment.paidAt && (
            <>
              <span className="text-white/30">·</span>
              <span style={{ color: "#10B981" }}>Төлсөн: {fmtDate(payment.paidAt)}</span>
            </>
          )}
        </div>
      </div>

      {/* Amount + actions */}
      <div className="md:col-span-4 flex flex-col items-stretch md:items-end gap-2">
        <div className="font-light text-right"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: isPaid ? "#10B981" : "#C9A84C", fontSize: 24,
          }}
        >{fmt(payment.totalAmount)}₮</div>
        <StatusPill label={meta.label} color={meta.color} />
        <div className="flex gap-2 mt-1">
          <Link to={`/payments/${payment.application?._id || payment.application}`}
            className="flex-1 py-2 px-3 text-center text-[10px] tracking-[0.25em] uppercase text-white/60 hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.12)" }}
          >Дэлгэрэнгүй</Link>
          {canPay && (
            <button onClick={() => onQuickPay(payment._id)} disabled={paying}
              className="flex-1 py-2 px-3 text-[10px] tracking-[0.25em] uppercase transition-all duration-300 disabled:opacity-50"
              style={{
                background: isUrgent ? "#EF4444" : "#C9A84C",
                color:      isUrgent ? "#fff"    : "#0A0A0A",
              }}
            >{paying ? "..." : "Төлөх →"}</button>
          )}
        </div>
      </div>
    </article>
  );
}

function StatusPill({ label, color }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] tracking-[0.2em] uppercase self-end"
      style={{ background: `${color}15`, color, border: `1px solid ${color}50` }}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </div>
  );
}

function LoadingList() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 animate-pulse"
          style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.08)" }}
        >
          <div className="md:col-span-2 aspect-[4/3]" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="md:col-span-6 space-y-2">
            <div className="h-3 w-32" style={{ background: "rgba(255,255,255,0.05)" }} />
            <div className="h-5 w-3/4" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="h-3 w-48" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
          <div className="md:col-span-4 space-y-2">
            <div className="h-6 w-32 ml-auto" style={{ background: "rgba(201,168,76,0.1)" }} />
            <div className="h-9 w-full" style={{ background: "rgba(255,255,255,0.05)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasAny, role }) {
  if (hasAny) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6"
        style={{ border: "1px solid rgba(201,168,76,0.1)" }}
      >
        <p className="text-sm text-white/50">Сонгосон төлөвт төлбөр алга</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6"
      style={{ border: "1px solid rgba(201,168,76,0.15)", background: "rgba(201,168,76,0.02)" }}
    >
      <div className="w-16 h-16 mb-8 flex items-center justify-center" style={{ border: "1px solid #C9A84C" }}>
        <div style={{ width: 24, height: 24, background: "#C9A84C", transform: "rotate(45deg)" }} />
      </div>
      <h3 className="font-light text-white mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32 }}>
        Төлбөр <em style={{ color: "#C9A84C", fontStyle: "italic" }}>алга</em>
      </h3>
      <p className="text-sm text-white/50 max-w-md mb-8 leading-relaxed">
        {role === "landlord"
          ? "Танай байруудад одоогоор идэвхтэй гэрээ байхгүй."
          : "Та хараахан түрээсийн гэрээ байгуулаагүй байна."
        }
      </p>
      <Link to={role === "landlord" ? "/my-properties" : "/home"}
        className="inline-block px-8 py-3 text-[10px] tracking-[0.3em] uppercase transition-all duration-300"
        style={{ background: "#C9A84C", color: "#0A0A0A" }}
      >
        {role === "landlord" ? "Миний байрууд →" : "Байр хайх →"}
      </Link>
    </div>
  );
}

export default MyPayments;