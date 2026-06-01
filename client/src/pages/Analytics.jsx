import { useState, useEffect, useMemo } from "react";
import api from "../api/axiosInstance";
import { Link } from "react-router-dom";

// ── Тоо форматлах ──
const fmt = (n) => new Intl.NumberFormat("mn-MN").format(Math.round(n || 0));
const fmtCompact = (n) => {
  n = Math.round(n || 0);
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + " тэрбум";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + " сая";
  if (n >= 1e3) return Math.round(n / 1e3) + "мянга";
  return String(n);
};

const STATUS_META = {
  pending:   { label: "Хүлээгдэж буй", color: "#F59E0B" },
  approved:  { label: "Зөвшөөрсөн",    color: "#10B981" },
  rejected:  { label: "Татгалзсан",    color: "#EF4444" },
  cancelled: { label: "Цуцалсан",      color: "#888888" },
};

function Analytics() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const isAdmin = user?.role === "admin";
  const isTenant = user?.role === "tenant";
  // Зөвхөн нэвтэрсэн, tenant биш үед л сервер рүү хүсэлт явуулна
  const needFetch = !!user && !isTenant;

  const [data, setData] = useState(null);
  // needFetch үнэн бол эхэндээ "уншиж байна", үгүй бол шууд дуусгана (loader харагдахгүй)
  const [loading, setLoading] = useState(needFetch);
  const [error, setError] = useState("");

  useEffect(() => {
    // Хамгаалалтын салаанууд: синхрон setState дуудахгүйн тулд зүгээр л гарна
    if (!needFetch) return;

    let cancelled = false;
    (async () => {
      try {
        const url = isAdmin ? "/api/analytics/admin" : "/api/analytics/landlord";
        const res = await api.get(url);
        if (cancelled) return;
        setData(res.data);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Аналитик татаж чадсангүй");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [needFetch, isAdmin]);

  // Хамгаалалт + төлвийг render үед шууд шийднэ (effect-ээс биш)
  if (!user) return <CenterState text="Нэвтэрнэ үү" />;
  if (isTenant)
    return <CenterState text="Аналитик зөвхөн түрээслүүлэгч болон админд харагдана" />;
  if (loading) return <CenterState spin text="Уншиж байна" />;
  if (error) return <CenterState text={error} />;
  if (!data) return <CenterState text="Дата олдсонгүй" />;

  const { kpis, incomeTrend, occupancy, funnel, byDistrict } = data;
  const empty = (kpis.totalProperties || 0) === 0 && (kpis.totalIncome || 0) === 0;

  return (
    <div
      className="min-h-screen pt-20"
      style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── HEADER ── */}
      <header className="px-6 lg:px-12 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8" style={{ background: "#C9A84C" }} />
            <span
              className="text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "#C9A84C" }}
            >
              {isAdmin ? "Систем · Админ" : "Миний байрнууд"}
            </span>
          </div>
          <h1
            className="font-light text-white leading-[1] tracking-tight"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(40px, 5vw, 60px)",
            }}
          >
            Аналитик
            <br />
            <em style={{ color: "#C9A84C", fontStyle: "italic" }}>тойм</em>
          </h1>
        </div>
      </header>

      <main className="px-6 lg:px-12 pb-24">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* ── KPI cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Нийт орлого"
              value={`${fmtCompact(kpis.totalIncome)}₮`}
              hint={`${fmt(kpis.totalIncome)}₮`}
              highlight
            />
            <KpiCard label="Байрны тоо" value={fmt(kpis.totalProperties)} />
            <KpiCard label="Идэвхтэй гэрээ" value={fmt(kpis.activeLeases)} />
            {isAdmin ? (
              <KpiCard label="Хэрэглэгч" value={fmt(kpis.totalUsers)} />
            ) : (
              <KpiCard
                label="Хүлээгдэж буй өргөдөл"
                value={fmt(kpis.pendingApplications)}
              />
            )}
          </div>

          {empty && (
            <div
              className="p-5 text-sm text-white/55"
              style={{
                background: "rgba(201,168,76,0.04)",
                border: "1px dashed rgba(201,168,76,0.25)",
              }}
            >
              Одоогоор дата бага байна. Байр нэмэгдэж, төлбөр төлөгдөхөд графикууд
              автоматаар бөглөгдөнө.
            </div>
          )}

          {/* ── Орлогын чиг хандлага ── */}
          <Panel
            title="Орлогын чиг хандлага"
            subtitle="Сүүлийн 12 сар · төлөгдсөн төлбөр"
          >
            <IncomeBars data={incomeTrend} />
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── Эзлэлт ── */}
            <Panel title="Эзлэлт" subtitle="Байрны төлөв">
              <OccupancyChart occupancy={occupancy} />
            </Panel>

            {/* ── Өргөдлийн юүлүүр ── */}
            <Panel title="Өргөдлийн юүлүүр" subtitle="Төлвөөр">
              <FunnelChart funnel={funnel} />
            </Panel>
          </div>

          {/* ── Дүүргээр дундаж үнэ ── */}
          <Panel
            title="Дүүргээр дундаж үнэ"
            subtitle="Сарын түрээсийн дундаж"
          >
            <DistrictChart rows={byDistrict} />
          </Panel>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Layout helpers
// ─────────────────────────────────────────────

function Panel({ title, subtitle, children }) {
  return (
    <section
      className="p-6 lg:p-8"
      style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.15)" }}
    >
      <div className="mb-6">
        <h2
          className="font-light text-white leading-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28 }}
        >
          {title}
        </h2>
        {subtitle && (
          <div className="text-[10px] tracking-[0.25em] uppercase text-white/35 mt-1">
            {subtitle}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

function KpiCard({ label, value, hint, highlight }) {
  return (
    <div
      className="p-5"
      style={{
        background: highlight ? "rgba(201,168,76,0.08)" : "#141414",
        border: `1px solid ${
          highlight ? "rgba(201,168,76,0.4)" : "rgba(201,168,76,0.15)"
        }`,
      }}
      title={hint || ""}
    >
      <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-3">
        {label}
      </div>
      <div
        className="font-light leading-none"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 30,
          color: highlight ? "#C9A84C" : "#fff",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Charts (dependency-free)
// ─────────────────────────────────────────────

// Орлогын баганан график (SVG)
function IncomeBars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.total || 0));
  const W = 760;
  const H = 280;
  const padL = 14;
  const padR = 14;
  const padT = 24;
  const padB = 34;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = data.length;
  const gap = 10;
  const barW = (innerW - gap * (n - 1)) / n;
  const gridT = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 520, display: "block" }}>
        {/* gridlines */}
        {gridT.map((t) => {
          const y = padT + innerH * (1 - t);
          return (
            <g key={t}>
              <line
                x1={padL}
                x2={W - padR}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
              <text
                x={padL}
                y={y - 4}
                fontSize="9"
                fill="rgba(255,255,255,0.3)"
                fontFamily="'DM Sans', sans-serif"
              >
                {t === 0 ? "" : fmtCompact(max * t)}
              </text>
            </g>
          );
        })}

        {/* bars */}
        {data.map((d, i) => {
          const h = innerH * ((d.total || 0) / max);
          const x = padL + i * (barW + gap);
          const y = padT + innerH - h;
          return (
            <g key={d.key}>
              <rect
                x={x}
                y={d.total ? y : padT + innerH - 2}
                width={barW}
                height={d.total ? h : 2}
                rx="1.5"
                fill="#C9A84C"
                opacity={d.total ? 0.9 : 0.18}
              >
                <title>{`${d.label}: ${fmt(d.total)}₮`}</title>
              </rect>
              <text
                x={x + barW / 2}
                y={H - 12}
                textAnchor="middle"
                fontSize="10"
                fill="rgba(255,255,255,0.4)"
                fontFamily="'DM Sans', sans-serif"
              >
                {d.m}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Эзлэлтийн график — давхарласан хэвтээ баганан
function OccupancyChart({ occupancy }) {
  const total =
    (occupancy.available || 0) + (occupancy.rented || 0) + (occupancy.other || 0);
  const segs = [
    { key: "rented", label: "Түрээслэгдсэн", value: occupancy.rented || 0, color: "#C9A84C" },
    { key: "available", label: "Боломжтой", value: occupancy.available || 0, color: "rgba(255,255,255,0.28)" },
  ];
  if (occupancy.other) {
    segs.push({ key: "other", label: "Бусад", value: occupancy.other, color: "rgba(255,255,255,0.12)" });
  }
  const pct = (v) => (total ? Math.round((v / total) * 100) : 0);

  return (
    <div>
      <div
        className="flex w-full overflow-hidden mb-6"
        style={{ height: 28, border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {total === 0 ? (
          <div className="w-full" style={{ background: "rgba(255,255,255,0.05)" }} />
        ) : (
          segs.map((s) => (
            <div
              key={s.key}
              style={{
                width: `${(s.value / total) * 100}%`,
                background: s.color,
                transition: "width 0.4s",
              }}
              title={`${s.label}: ${s.value}`}
            />
          ))
        )}
      </div>
      <div className="space-y-3">
        {segs.map((s) => (
          <div key={s.key} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                style={{ width: 12, height: 12, background: s.color, display: "inline-block" }}
              />
              <span className="text-sm text-white/70">{s.label}</span>
            </div>
            <div className="text-sm text-white/85">
              {s.value}{" "}
              <span className="text-white/40 text-xs">· {pct(s.value)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Өргөдлийн юүлүүр — хэвтээ баганан
function FunnelChart({ funnel }) {
  const rows = ["pending", "approved", "rejected", "cancelled"].map((k) => ({
    key: k,
    ...STATUS_META[k],
    value: funnel[k] || 0,
  }));
  const max = Math.max(1, ...rows.map((r) => r.value));
  const totalApps = rows.reduce((s, r) => s + r.value, 0);

  if (totalApps === 0) {
    return <div className="text-sm text-white/40 py-6">Одоогоор өргөдөл алга.</div>;
  }

  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.key}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] tracking-[0.15em] uppercase text-white/55">
              {r.label}
            </span>
            <span className="text-sm text-white/85">{r.value}</span>
          </div>
          <div
            className="w-full"
            style={{ height: 8, background: "rgba(255,255,255,0.05)" }}
          >
            <div
              style={{
                width: `${(r.value / max) * 100}%`,
                height: "100%",
                background: r.color,
                transition: "width 0.4s",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Дүүргээр дундаж үнэ — хэвтээ баганан
function DistrictChart({ rows }) {
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-white/40 py-6">Дата алга.</div>;
  }
  const max = Math.max(1, ...rows.map((r) => r.avgPrice || 0));

  return (
    <div className="space-y-5">
      {rows.map((r) => (
        <div key={r.district}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-white/75">
              {r.district}{" "}
              <span className="text-white/35 text-xs">· {r.count} байр</span>
            </span>
            <span
              className="text-sm"
              style={{ color: "#C9A84C", fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}
            >
              {fmt(r.avgPrice)}₮
            </span>
          </div>
          <div
            className="w-full"
            style={{ height: 8, background: "rgba(255,255,255,0.05)" }}
          >
            <div
              style={{
                width: `${(r.avgPrice / max) * 100}%`,
                height: "100%",
                background: "#C9A84C",
                opacity: 0.85,
                transition: "width 0.4s",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  State screens
// ─────────────────────────────────────────────

function CenterState({ text, spin }) {
  return (
    <div
      className="min-h-screen pt-20 flex items-center justify-center px-6"
      style={{ background: "#0A0A0A" }}
    >
      <div className="text-center">
        {spin ? (
          <div
            className="w-12 h-12 mx-auto mb-6 animate-spin"
            style={{
              border: "2px solid rgba(201,168,76,0.2)",
              borderTopColor: "#C9A84C",
              borderRadius: "50%",
            }}
          />
        ) : (
          <div
            className="w-14 h-14 mx-auto mb-6 flex items-center justify-center"
            style={{ border: "1px solid #C9A84C" }}
          >
            <div
              style={{ width: 20, height: 20, background: "#C9A84C", transform: "rotate(45deg)" }}
            />
          </div>
        )}
        <p className="text-[11px] tracking-[0.3em] uppercase text-white/50 mb-6">
          {text}
        </p>
        {!spin && (
          <Link
            to="/home"
            className="inline-block px-7 py-3 text-[10px] tracking-[0.3em] uppercase"
            style={{ background: "#C9A84C", color: "#0A0A0A" }}
          >
            Эхлэл рүү →
          </Link>
        )}
      </div>
    </div>
  );
}

export default Analytics;