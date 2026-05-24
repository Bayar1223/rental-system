import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import SignaturePad from "signature_pad";
import api from "../api/axiosInstance";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=70";

const CONTRACT_STATUS = {
  none: { label: "Гэрээгүй", color: "#888" },
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
  cancelled: { label: "Цуцалсан", color: "#888" },
};

// "6+1" → { months: 6, deposit: 1 }
function parseCondition(cond) {
  if (!cond || typeof cond !== "string") return { months: 1, deposit: 1 };
  const m = cond.match(/^(\d+)\s*\+\s*(\d+)$/);
  if (!m) return { months: 1, deposit: 1 };
  return { months: parseInt(m[1], 10), deposit: parseInt(m[2], 10) };
}

function Contract() {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "null"),
    []
  );

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/api/applications/${id}`);
        if (cancelled) return;
        setApp(res.data);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Гэрээ татаж чадсангүй");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, navigate, user]);

  const handleSign = async (role, dataURL) => {
    setSaving(true);
    setError("");
    try {
      const body =
        role === "tenant"
          ? { tenantSignature: dataURL }
          : { landlordSignature: dataURL };
      const res = await api.put(`/api/applications/${id}`, body);
      setApp((prev) => ({ ...prev, ...(res.data || {}) }));
    } catch (err) {
      setError(err.response?.data?.message || "Хадгалж чадсангүй");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelContract = async () => {
    if (
      !confirm(
        "Та энэ гэрээг цуцлахдаа итгэлтэй байна уу? Энэ үйлдэл буцаагдахгүй."
      )
    )
      return;
    setCancelling(true);
    try {
      const res = await api.put(`/api/applications/${id}`, {
        contractStatus: "cancelled",
        status: "cancelled",
      });
      setApp((prev) => ({ ...prev, ...(res.data || {}) }));
    } catch (err) {
      alert(err.response?.data?.message || "Цуцалж чадсангүй");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen pt-20 flex items-center justify-center"
        style={{ background: "#0A0A0A" }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 mx-auto mb-6 animate-spin"
            style={{
              border: "2px solid rgba(201,168,76,0.2)",
              borderTopColor: "#C9A84C",
              borderRadius: "50%",
            }}
          />
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">
            Уншиж байна
          </p>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div
        className="min-h-screen pt-20 flex items-center justify-center px-6"
        style={{ background: "#0A0A0A" }}
      >
        <div className="text-center max-w-md">
          <h2
            className="font-light text-white mb-4"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 36,
            }}
          >
            Гэрээ <em style={{ color: "#C9A84C", fontStyle: "italic" }}>олдсонгүй</em>
          </h2>
          <p className="text-sm text-white/50 mb-8">
            {error || "Энэ ID-тай гэрээ байхгүй байна."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 text-[10px] tracking-[0.3em] uppercase"
            style={{ background: "#C9A84C", color: "#0A0A0A" }}
          >
            ← Буцах
          </button>
        </div>
      </div>
    );
  }

  const property = app.property || {};
  const tenant = app.tenant || {};
  const landlord = app.landlord || property.owner || {};
  const tenantId = tenant._id || tenant;
  const landlordId = landlord._id || landlord;

  const isTenant = user._id === tenantId;
  const isLandlord = user._id === landlordId;

  if (!isTenant && !isLandlord && user.role !== "admin") {
    return (
      <div
        className="min-h-screen pt-20 flex items-center justify-center px-6"
        style={{ background: "#0A0A0A" }}
      >
        <div className="text-center max-w-md">
          <h2
            className="font-light text-white mb-4"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 36,
            }}
          >
            <em style={{ color: "#C9A84C", fontStyle: "italic" }}>Хандах</em> эрхгүй
          </h2>
          <p className="text-sm text-white/50">
            Та энэ гэрээний оролцогч биш байна.
          </p>
        </div>
      </div>
    );
  }

  const status = CONTRACT_STATUS[app.contractStatus] || CONTRACT_STATUS.none;
  const condition = parseCondition(app.condition);
  const monthlyRent = property.price || 0;
  const depositAmount = monthlyRent * condition.deposit;
  const firstPaymentAmount =
    monthlyRent * condition.months + depositAmount;

  const tenantSigned = !!app.tenantSignature;
  const landlordSigned = !!app.landlordSignature;
  const bothSigned = tenantSigned && landlordSigned;
  const isCancelled =
    app.contractStatus === "cancelled" || app.status === "cancelled";
  const isActive = app.contractStatus === "active";
  const needsPayment = app.contractStatus === "payment_pending";

  const canCancel =
    !isCancelled &&
    !isActive &&
    ["pending_signatures", "signed", "payment_pending", "none"].includes(
      app.contractStatus
    );

  const cover = property.photos?.[0] || PLACEHOLDER;
  const formattedPrice = new Intl.NumberFormat("mn-MN").format(monthlyRent);
  const formattedFirst = new Intl.NumberFormat("mn-MN").format(
    firstPaymentAmount
  );
  const formattedDeposit = new Intl.NumberFormat("mn-MN").format(
    depositAmount
  );

  return (
    <div
      className="min-h-screen pt-20"
      style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Back */}
      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-8">
        <button
          onClick={() => navigate(-1)}
          className="text-[10px] tracking-[0.3em] uppercase text-white/40 hover:text-white transition-colors"
        >
          ← Буцах
        </button>
      </div>

      {/* Header */}
      <header className="max-w-5xl mx-auto px-6 lg:px-12 mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-8" style={{ background: "#C9A84C" }} />
          <span
            className="text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "#C9A84C" }}
          >
            Lease Agreement
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
            Цахим<br />
            <em style={{ color: "#C9A84C", fontStyle: "italic" }}>
              гэрээ
            </em>
          </h1>
          <StatusPill label={status.label} color={status.color} />
        </div>
      </header>

      {/* Active banner */}
      {isActive && (
        <section className="max-w-5xl mx-auto px-6 lg:px-12 mb-8">
          <div
            className="p-5 flex items-center gap-4"
            style={{
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.4)",
            }}
          >
            <span style={{ color: "#10B981", fontSize: 24 }}>◇</span>
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-emerald-300/70 mb-1">
                Идэвхтэй гэрээ
              </div>
              <p className="text-sm text-white/80">
                Гэрээ хүчин төгөлдөр болсон. Та сар бүрийн төлбөрөө цаг
                тухайд нь хийх ёстой.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Cancelled banner */}
      {isCancelled && (
        <section className="max-w-5xl mx-auto px-6 lg:px-12 mb-8">
          <div
            className="p-5 flex items-center gap-4"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.4)",
            }}
          >
            <span style={{ color: "#EF4444", fontSize: 24 }}>✕</span>
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-red-300/70 mb-1">
                Цуцалсан
              </div>
              <p className="text-sm text-white/80">
                Энэ гэрээ цуцлагдсан.
              </p>
            </div>
          </div>
        </section>
      )}

      {error && (
        <section className="max-w-5xl mx-auto px-6 lg:px-12 mb-6">
          <div
            className="p-4 flex items-start gap-3"
            style={{
              background: "rgba(239,68,68,0.08)",
              borderLeft: "2px solid #EF4444",
            }}
          >
            <span style={{ color: "#EF4444" }}>✕</span>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </section>
      )}

      {/* Property summary */}
      <section className="max-w-5xl mx-auto px-6 lg:px-12 mb-10">
        <Section number="01" label="Байрны мэдээлэл">
          <div
            className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5"
            style={{
              background: "#141414",
              border: "1px solid rgba(201,168,76,0.15)",
            }}
          >
            <Link
              to={property._id ? `/properties/${property._id}` : "#"}
              className="md:col-span-3 block relative overflow-hidden"
              style={{
                aspectRatio: "4/3",
                border: "1px solid rgba(201,168,76,0.15)",
              }}
            >
              <img
                src={cover}
                alt=""
                className="w-full h-full object-cover"
                style={{ filter: "brightness(0.88)" }}
                onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
              />
            </Link>
            <div className="md:col-span-9 flex flex-col justify-center">
              <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-2">
                {property.district || "Улаанбаатар"}
              </div>
              <h3
                className="font-light text-white leading-tight mb-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 32,
                }}
              >
                {property.title}
              </h3>
              <p className="text-sm text-white/55 mb-4">
                {property.address || "—"}
              </p>
              <div className="flex gap-6 text-xs text-white/60">
                {property.rooms != null && (
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: "#C9A84C" }}>◇</span>
                    {property.rooms} өрөө
                  </div>
                )}
                {property.size != null && (
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: "#C9A84C" }}>◇</span>
                    {property.size}м²
                  </div>
                )}
              </div>
            </div>
          </div>
        </Section>
      </section>

      {/* Parties */}
      <section className="max-w-5xl mx-auto px-6 lg:px-12 mb-10">
        <Section number="02" label="Гэрээний талууд">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <PartyCard
              role="Түрээслэгч"
              user={tenant}
              isMe={isTenant}
              accentColor="#C9A84C"
            />
            <PartyCard
              role="Байрны эзэн"
              user={landlord}
              isMe={isLandlord}
              accentColor="#C9A84C"
            />
          </div>
        </Section>
      </section>

      {/* Terms */}
      <section className="max-w-5xl mx-auto px-6 lg:px-12 mb-10">
        <Section number="03" label="Гэрээний нөхцөл">
          <div
            className="p-6"
            style={{
              background: "#141414",
              border: "1px solid rgba(201,168,76,0.15)",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <TermRow
                label="Сарын түрээс"
                value={
                  <>
                    <span style={{ color: "#C9A84C" }}>{formattedPrice}₮</span>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-white/40 ml-2">
                      / сар
                    </span>
                  </>
                }
              />
              <TermRow
                label="Нөхцөл"
                value={`${condition.months}+${condition.deposit}`}
                hint={`${condition.months} сар түрээс + ${condition.deposit} сар барьцаа`}
              />
              <TermRow
                label="Барьцаа"
                value={
                  <span style={{ color: "#C9A84C" }}>
                    {formattedDeposit}₮
                  </span>
                }
              />
              <TermRow
                label="Эхний төлбөр"
                value={
                  <span style={{ color: "#C9A84C" }}>
                    {formattedFirst}₮
                  </span>
                }
                hint={`${condition.months} сар × ${formattedPrice}₮ + ${condition.deposit} сар барьцаа`}
              />
            </div>

            <div
              className="pt-5 text-xs text-white/55 leading-relaxed"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span style={{ color: "#C9A84C" }}>◇</span> Энэхүү цахим
              гэрээнд хоёр тал гарын үсэг зурснаар хүчин төгөлдөр
              болно. Түрээслэгч эхний төлбөрөө хийсний дараа гэрээ
              идэвхтэй болж, түрээсийн харилцаа эхэлнэ.
            </div>
          </div>
        </Section>
      </section>

      {/* Signatures */}
      <section className="max-w-5xl mx-auto px-6 lg:px-12 mb-10">
        <Section number="04" label="Гарын үсэг">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SignaturePanel
              role="Түрээслэгчийн гарын үсэг"
              existing={app.tenantSignature}
              canSign={isTenant && !tenantSigned && !isCancelled}
              waiting={!tenantSigned && !isTenant}
              onSave={(d) => handleSign("tenant", d)}
              saving={saving}
              party={tenant.name || "Түрээслэгч"}
            />
            <SignaturePanel
              role="Байрны эзний гарын үсэг"
              existing={app.landlordSignature}
              canSign={isLandlord && !landlordSigned && !isCancelled}
              waiting={!landlordSigned && !isLandlord}
              onSave={(d) => handleSign("landlord", d)}
              saving={saving}
              party={landlord.name || "Байрны эзэн"}
            />
          </div>

          {bothSigned && !isCancelled && (
            <div
              className="mt-6 p-4 flex items-center gap-3"
              style={{
                background: "rgba(201,168,76,0.06)",
                borderLeft: "2px solid #C9A84C",
              }}
            >
              <span style={{ color: "#C9A84C" }}>◇</span>
              <p className="text-sm text-white/80">
                Хоёр тал гарын үсэг зурсан. Гэрээ хүчин төгөлдөр.
              </p>
            </div>
          )}
        </Section>
      </section>

      {/* Actions */}
      <section className="max-w-5xl mx-auto px-6 lg:px-12 pb-20">
        <div
          className="flex flex-col-reverse sm:flex-row gap-3 pt-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {canCancel && (
            <button
              onClick={handleCancelContract}
              disabled={cancelling}
              className="sm:px-8 py-3 text-[10px] tracking-[0.25em] uppercase text-red-300 hover:text-red-200 transition-colors disabled:opacity-50"
              style={{ border: "1px solid rgba(239,68,68,0.4)" }}
            >
              {cancelling ? "Цуцалж байна..." : "Гэрээ цуцлах"}
            </button>
          )}

          <div className="flex-1" />

          {needsPayment && isTenant && (
            <Link
              to={`/payment/${app._id}`}
              className="sm:px-8 py-3 text-center text-[10px] tracking-[0.25em] uppercase transition-all duration-300 group flex items-center justify-center gap-2"
              style={{ background: "#C9A84C", color: "#0A0A0A" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#E8D49E")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#C9A84C")
              }
            >
              Эхний төлбөр төлөх
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          )}

          {isActive && (
            <Link
              to={`/payment/${app._id}`}
              className="sm:px-8 py-3 text-center text-[10px] tracking-[0.25em] uppercase transition-all duration-300"
              style={{ background: "#C9A84C", color: "#0A0A0A" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#E8D49E")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#C9A84C")
              }
            >
              Төлбөрийн жагсаалт →
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

// ── Section wrapper ──
function Section({ number, label, children }) {
  return (
    <div>
      <div className="flex items-baseline gap-6 mb-6">
        <span
          className="font-light"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 28,
            color: "#C9A84C",
          }}
        >
          {number}
        </span>
        <h2
          className="font-light text-white"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 24,
          }}
        >
          {label}
        </h2>
      </div>
      {children}
    </div>
  );
}

// ── Term row ──
function TermRow({ label, value, hint }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-2">
        {label}
      </div>
      <div
        className="font-light text-white"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 26,
        }}
      >
        {value}
      </div>
      {hint && <div className="text-xs text-white/40 mt-1">{hint}</div>}
    </div>
  );
}

// ── Party card ──
function PartyCard({ role, user, isMe, accentColor }) {
  return (
    <div
      className="p-5"
      style={{
        background: "#141414",
        border: isMe
          ? `1px solid ${accentColor}`
          : "1px solid rgba(201,168,76,0.15)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] tracking-[0.3em] uppercase text-white/40">
          {role}
        </div>
        {isMe && (
          <div
            className="text-[9px] tracking-[0.25em] uppercase px-2 py-0.5"
            style={{
              background: accentColor,
              color: "#0A0A0A",
            }}
          >
            Та
          </div>
        )}
      </div>
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(201,168,76,0.12)",
            color: "#C9A84C",
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 22,
          }}
        >
          {(user.name || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="font-light text-white leading-tight mb-2"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22,
            }}
          >
            {user.name || "—"}
          </div>
          <div className="space-y-1 text-xs text-white/55">
            {user.email && (
              <div className="flex items-center gap-2 truncate">
                <span style={{ color: "#C9A84C" }}>◇</span>
                {user.email}
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-2">
                <span style={{ color: "#C9A84C" }}>◇</span>
                {user.phone}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Signature Panel ──
function SignaturePanel({
  role,
  existing,
  canSign,
  waiting,
  onSave,
  saving,
  party,
}) {
  const canvasRef = useRef(null);
  const padRef = useRef(null);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    if (!canSign || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const pad = new SignaturePad(canvas, {
      backgroundColor: "rgba(0,0,0,0)",
      penColor: "#C9A84C",
      minWidth: 1,
      maxWidth: 2.5,
    });
    padRef.current = pad;

    const updateInk = () => setHasInk(!pad.isEmpty());
    pad.addEventListener("endStroke", updateInk);

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      const ctx = canvas.getContext("2d");
      ctx.scale(ratio, ratio);
      pad.clear();
      setHasInk(false);
    };

    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      pad.removeEventListener("endStroke", updateInk);
      pad.off();
    };
  }, [canSign]);

  const handleClear = () => {
    padRef.current?.clear();
    setHasInk(false);
  };

  const handleSubmit = () => {
    if (!padRef.current || padRef.current.isEmpty()) return;
    const dataURL = padRef.current.toDataURL("image/png");
    onSave(dataURL);
  };

  return (
    <div
      className="p-5 flex flex-col"
      style={{
        background: "#141414",
        border: existing
          ? "1px solid #C9A84C"
          : canSign
            ? "1px dashed rgba(201,168,76,0.4)"
            : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] tracking-[0.3em] uppercase text-white/40">
          {role}
        </div>
        {existing && (
          <span
            className="text-[9px] tracking-[0.2em] uppercase"
            style={{ color: "#C9A84C" }}
          >
            ◇ Зурсан
          </span>
        )}
      </div>

      {/* Signature area */}
      <div
        className="relative flex-1 flex items-center justify-center"
        style={{
          minHeight: 180,
          background:
            "linear-gradient(180deg, transparent 0%, rgba(201,168,76,0.02) 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {existing ? (
          <img
            src={existing}
            alt={`${party} signature`}
            className="max-w-full max-h-full object-contain p-4"
            style={{ filter: "brightness(1.4)" }}
          />
        ) : canSign ? (
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-full absolute inset-0"
              style={{ touchAction: "none", cursor: "crosshair" }}
            />
            {!hasInk && (
              <div className="text-center pointer-events-none">
                <div
                  className="font-light mb-2"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: "italic",
                    color: "rgba(201,168,76,0.4)",
                    fontSize: 24,
                  }}
                >
                  Энд гарын үсгээ зураарай
                </div>
                <p className="text-[10px] tracking-[0.25em] uppercase text-white/30">
                  Хулгана эсвэл хуруугаар
                </p>
              </div>
            )}
          </>
        ) : waiting ? (
          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-2">
              Хүлээгдэж буй
            </div>
            <p className="text-xs text-white/40">
              {party} гарын үсэг зурахыг хүлээж байна
            </p>
          </div>
        ) : (
          <div className="text-center text-[10px] tracking-[0.3em] uppercase text-white/30">
            Гарын үсэг алга
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-white/50">
          {party}
        </div>
        {canSign && (
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              disabled={!hasInk || saving}
              className="px-4 py-2 text-[10px] tracking-[0.25em] uppercase text-white/50 hover:text-white transition-colors disabled:opacity-30"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}
            >
              Цэвэрлэх
            </button>
            <button
              onClick={handleSubmit}
              disabled={!hasInk || saving}
              className="px-4 py-2 text-[10px] tracking-[0.25em] uppercase transition-all duration-300 disabled:opacity-30"
              style={{ background: "#C9A84C", color: "#0A0A0A" }}
              onMouseEnter={(e) =>
                hasInk &&
                !saving &&
                (e.currentTarget.style.background = "#E8D49E")
              }
              onMouseLeave={(e) =>
                hasInk &&
                !saving &&
                (e.currentTarget.style.background = "#C9A84C")
              }
            >
              {saving ? "..." : "Хадгалах"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ label, color }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-2 text-[10px] tracking-[0.2em] uppercase self-start"
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

export default Contract;