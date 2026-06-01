import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axiosInstance";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import FavoriteButton from "../components/FavoriteButton"; // ⭐ ШИНЭ

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80";

const PROPERTY_TYPE_LABELS = {
  apartment: "Орон сууц",
  house:     "Хувийн байшин",
  studio:    "Студи",
  room:      "Өрөө",
};

const goldDiamondIcon = L.divIcon({
  className: "rentalsy-marker",
  html: `<div style="position:relative;width:30px;height:30px;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;inset:4px;background:#C9A84C;transform:rotate(45deg);box-shadow:0 4px 12px rgba(201,168,76,0.6),0 0 0 2px #0A0A0A;"></div>
    <div style="position:absolute;width:6px;height:6px;background:#0A0A0A;transform:rotate(45deg);"></div>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);

  const [property, setProperty]           = useState(null);
  const [reviews, setReviews]             = useState([]);
  const [similar, setSimilar]             = useState([]);
  const [myApplication, setMyApplication] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [notFound, setNotFound]           = useState(false);
  const [favIds, setFavIds]               = useState([]); // ⭐ ШИНЭ

  const [lightboxIdx, setLightboxIdx] = useState(null);

  const [applyOpen, setApplyOpen]             = useState(false);
  const [applyMessage, setApplyMessage]       = useState("");
  const [applyStartDate, setApplyStartDate]   = useState("");
  const [applyLeaseMonths, setApplyLeaseMonths] = useState("");
  const [applying, setApplying]               = useState(false);
  const [applyError, setApplyError]           = useState("");

  const [reviewRating, setReviewRating]         = useState(0);
  const [reviewComment, setReviewComment]       = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError]           = useState("");
  const [reviewSuccess, setReviewSuccess]       = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [propRes, revRes, simRes] = await Promise.all([
          api.get(`/api/properties/${id}`),
          api.get(`/api/reviews?propertyId=${id}`).catch(() => ({ data: [] })),
          api.get(`/api/properties/${id}/similar`).catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        setProperty(propRes.data);
        setReviews(Array.isArray(revRes.data) ? revRes.data : []);
        setSimilar(Array.isArray(simRes.data) ? simRes.data : []);
      } catch {
        if (cancelled) return;
        setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!user || user.role !== "tenant") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/api/applications/me/property/${id}`);
        if (cancelled) return;
        setMyApplication(res.data || null);
      } catch {
        if (cancelled) return;
        setMyApplication(null);
      }
    })();
    return () => { cancelled = true; };
  }, [id, user]);

  // ⭐ ШИНЭ: энэ байр хадгалагдсан эсэхийг тогтоох
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api
      .get("/api/favorites/ids")
      .then((r) => {
        if (!cancelled) setFavIds(r.data || []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight")
        setLightboxIdx((i) => Math.min((i ?? 0) + 1, (property?.images?.length || 1) - 1));
      if (e.key === "ArrowLeft")
        setLightboxIdx((i) => Math.max((i ?? 0) - 1, 0));
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [lightboxIdx, property?.images?.length]);

  const handleApply = async (e) => {
    e?.preventDefault();
    if (!user) { navigate("/login"); return; }

    // Validation
    if (!applyStartDate) {
      setApplyError("Эхлэх огноог оруулна уу");
      return;
    }
    const months = Number(applyLeaseMonths);
    if (!months || months < 1) {
      setApplyError("Хугацааг сараар оруулна уу");
      return;
    }

    setApplying(true);
    setApplyError("");
    try {
      const res = await api.post("/api/applications", {
        propertyId:  id,
        startDate:   applyStartDate,
        leaseMonths: months,
        message:     applyMessage,
      });
      setMyApplication(res.data);
      setApplyOpen(false);
      setApplyMessage("");
      setApplyStartDate("");
      setApplyLeaseMonths("");
    } catch (err) {
      setApplyError(err.response?.data?.message || "Өргөдөл илгээж чадсангүй");
    } finally {
      setApplying(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");
    setReviewSuccess("");
    if (reviewRating < 1) { setReviewError("Үнэлгээ өгнө үү"); return; }
    if (!reviewComment.trim()) { setReviewError("Сэтгэгдэл бичнэ үү"); return; }
    setReviewSubmitting(true);
    try {
      const res = await api.post("/api/reviews", {
        propertyId: id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviews((r) => [res.data, ...r]);
      setReviewRating(0);
      setReviewComment("");
      setReviewSuccess("Сэтгэгдэл амжилттай нэмэгдлээ");
    } catch (err) {
      setReviewError(err.response?.data?.message || "Сэтгэгдэл нэмэх боломжгүй");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Та энэ байрыг устгахдаа итгэлтэй байна уу?")) return;
    try {
      await api.delete(`/api/properties/${id}`);
      navigate("/my-properties");
    } catch (err) {
      alert(err.response?.data?.message || "Устгаж чадсангүй");
    }
  };

  if (loading) return <LoadingState />;
  if (notFound || !property) return <NotFoundState />;

  // ── Field normalization (server's names + fallbacks) ──
  const rawPhotos = property.images?.length
    ? property.images
    : property.photos?.length
      ? property.photos
      : [];
  const photos = rawPhotos.length ? rawPhotos : [PLACEHOLDER];

  const ownerId    = property.owner?._id || property.owner;
  const isOwner    = user && ownerId === user._id;
  const isAdmin    = user?.role === "admin";
  const isTenant   = user?.role === "tenant";
  const isAvailable = property.status === "available";
  const isFav       = favIds.includes(id); // ⭐ ШИНЭ

  const monthlyRent      = property.monthlyRent ?? property.price ?? 0;
  const depositAmount    = property.depositAmount ?? 0;
  const formattedRent    = new Intl.NumberFormat("mn-MN").format(monthlyRent);
  const formattedDeposit = new Intl.NumberFormat("mn-MN").format(depositAmount);

  const cityValue     = property.location?.city     || "Улаанбаатар";
  const districtValue = property.location?.district || property.district || "";
  const addressValue  = property.location?.address  || property.address  || "";

  const propertyType   = property.propertyType || "apartment";
  const propertyTypeLabel = PROPERTY_TYPE_LABELS[propertyType] || propertyType;

  const area = property.area ?? property.size;

  // Detailed
  const floorNumber   = property.floorNumber;
  const totalFloors   = property.totalFloors;
  const builtYear     = property.builtYear;
  const balconyCount  = property.balconyCount;
  const windowCount   = property.windowCount;
  const windowType    = property.windowType    || "";
  const floorMaterial = property.floorMaterial || "";
  const doorType      = property.doorType      || "";

  // Features
  const hasGarage         = !!property.hasGarage;
  const garageInfo        = property.garageInfo || "";
  const isFurnished       = !!property.isFurnished;
  const hasOutdoorParking = !!property.hasOutdoorParking;

  // Lease terms
  const minLeaseMonths       = property.minLeaseMonths;
  const paymentConditionText = property.paymentConditionText || "";

  // Contact (заавал биш)
  const contactName  = property.contactName  || "";
  const contactPhone = property.contactPhone || "";
  const contactEmail = property.contactEmail || "";
  const hasContact   = contactName || contactPhone || contactEmail;

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
    : 0;
  const alreadyReviewed =
    user && reviews.some((r) => (r.tenant?._id || r.tenant) === user._id);
  const reviewEligible =
    user && isTenant && !isOwner && myApplication &&
    ["signed", "payment_pending", "active", "cancelled"].includes(myApplication.contractStatus);

  return (
    <div className="min-h-screen pt-20" style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .leaflet-container { background: #0A0A0A; font-family: 'DM Sans', sans-serif; }
        .leaflet-control-zoom a {
          background: #141414 !important;
          color: #C9A84C !important;
          border: 1px solid rgba(201,168,76,0.3) !important;
        }
        .leaflet-control-attribution {
          background: rgba(10,10,10,0.7) !important;
          color: rgba(255,255,255,0.4) !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a { color: #C9A84C !important; }
        .rentalsy-marker { background: transparent !important; border: none !important; }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
        <button
          onClick={() => navigate(-1)}
          className="text-[10px] tracking-[0.3em] uppercase text-white/40 hover:text-white transition-colors"
        >← Буцах</button>
      </div>

      {/* ── Gallery ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 mb-12">
        <div className={`grid grid-cols-1 gap-3 h-auto lg:h-[560px] ${photos.length > 1 ? "lg:grid-cols-12" : ""}`}>
          {/* ⭐ ШИНЭ: үндсэн зургийг relative div-ээр ороож, зүрхийг дээр нь тавив
              (button дотор button болохгүй тул) */}
          <div className={`relative ${photos.length > 1 ? "lg:col-span-8" : ""}`}>
            {user && (
              <FavoriteButton propertyId={property._id} initial={isFav} size={42} />
            )}
            <button
              onClick={() => setLightboxIdx(0)}
              className="relative overflow-hidden group cursor-zoom-in w-full h-full block"
              style={{ border: "1px solid rgba(201,168,76,0.15)" }}
            >
              <img
                src={photos[0]} alt={property.title}
                className="w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
                style={{
                  aspectRatio: photos.length > 1 ? "auto" : "16/8",
                  minHeight: photos.length > 1 ? "auto" : 320,
                  filter: "brightness(0.9)",
                }}
                onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
              />
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(180deg, transparent 60%, rgba(10,10,10,0.5) 100%)" }} />
              <div
                className="absolute top-5 left-5 px-3 py-1.5 text-[10px] tracking-[0.25em] uppercase"
                style={{
                  background: isAvailable ? "rgba(201,168,76,0.95)" : "rgba(10,10,10,0.75)",
                  color: isAvailable ? "#0A0A0A" : "rgba(255,255,255,0.7)",
                  border: isAvailable ? "none" : "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {isAvailable ? "Боломжтой" : "Түрээслэгдсэн"}
              </div>
              <div
                className="absolute bottom-5 right-5 px-3 py-1.5 text-[10px] tracking-[0.25em] uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "#C9A84C", color: "#0A0A0A" }}
              >◇ Бүх зураг үзэх</div>
            </button>
          </div>

          {photos.length > 1 && (
            <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-3">
              {photos.slice(1, 5).map((photo, idx) => {
                const i = idx + 1;
                const isLast = i === 4;
                const remaining = photos.length - 5;
                return (
                  <button
                    key={i} onClick={() => setLightboxIdx(i)}
                    className="relative overflow-hidden group cursor-zoom-in aspect-[4/3] lg:aspect-auto lg:h-full"
                    style={{ border: "1px solid rgba(201,168,76,0.15)" }}
                  >
                    <img src={photo} alt=""
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{ filter: "brightness(0.85)" }}
                      onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                    />
                    {isLast && remaining > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(10,10,10,0.7)" }}>
                        <div className="text-center" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                          <div className="text-4xl font-light" style={{ color: "#C9A84C" }}>+{remaining}</div>
                          <div className="text-[9px] tracking-[0.3em] uppercase text-white/60 mt-1">Зураг</div>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* LEFT */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8" style={{ background: "#C9A84C" }} />
              <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#C9A84C" }}>
                {propertyTypeLabel} · {districtValue || cityValue}
              </span>
            </div>

            <h1
              className="font-light text-white leading-[1.05] mb-6"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 4vw, 56px)" }}
            >
              {property.title}
            </h1>

            <div className="text-sm text-white/50 mb-2 flex items-center gap-2">
              <span style={{ color: "#C9A84C" }}>◇</span>
              {addressValue || "—"}{cityValue && `, ${cityValue}`}
            </div>

            {reviews.length > 0 && (
              <div className="flex items-center gap-3 mb-8">
                <RatingDiamonds value={avgRating} />
                <span className="text-xs text-white/50 tracking-wider">
                  {avgRating.toFixed(1)} · {reviews.length} сэтгэгдэл
                </span>
              </div>
            )}

            {(isOwner || isAdmin) && (
              <div className="flex gap-3 mb-8 pb-8" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {isOwner && (
                  <Link
                    to={`/edit-property/${id}`}
                    className="px-5 py-2.5 text-[10px] tracking-[0.25em] uppercase transition-all duration-300"
                    style={{ border: "1px solid #C9A84C", color: "#C9A84C" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#C9A84C";
                      e.currentTarget.style.color = "#0A0A0A";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#C9A84C";
                    }}
                  >Засварлах</Link>
                )}
                {(isOwner || isAdmin) && (
                  <button
                    onClick={handleDelete}
                    className="px-5 py-2.5 text-[10px] tracking-[0.25em] uppercase text-red-400 hover:text-red-300 transition-colors"
                    style={{ border: "1px solid rgba(239,68,68,0.4)" }}
                  >Устгах</button>
                )}
              </div>
            )}

            {/* Description */}
            <DetailSection title="Тайлбар">
              <p className="text-white/70 leading-relaxed whitespace-pre-line" style={{ fontSize: 15, lineHeight: 1.8 }}>
                {property.description || "Тайлбар оруулаагүй байна."}
              </p>
            </DetailSection>

            {/* ── Үндсэн үзүүлэлт (нэгтгэсэн) ── */}
            <DetailSection title="Үзүүлэлт">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <SpecCard label="Өрөө" value={property.rooms ?? "—"} />
                <SpecCard label="Талбай" value={area ? `${area}м²` : "—"} />
                <SpecCard label="Дүүрэг" value={districtValue || "—"} />
                <SpecCard label="Төлөв" value={isAvailable ? "Боломжтой" : "Түрээслэгдсэн"} />
                {(floorNumber || totalFloors) && (
                  <SpecCard
                    label="Давхар"
                    value={
                      floorNumber && totalFloors ? `${floorNumber} / ${totalFloors}` :
                      floorNumber || totalFloors
                    }
                  />
                )}
                {builtYear && <SpecCard label="Барьсан жил" value={builtYear} />}
                {balconyCount > 0 && <SpecCard label="Балкон" value={balconyCount} />}
                {windowCount && <SpecCard label="Цонхны тоо" value={windowCount} />}
                {windowType && <SpecCard label="Цонх" value={windowType} />}
                {floorMaterial && <SpecCard label="Шал" value={floorMaterial} />}
                {doorType && <SpecCard label="Хаалга" value={doorType} />}
              </div>
            </DetailSection>

            {/* ── Үйлчилгээ & нэмэлт ── */}
            {(isFurnished || hasGarage || hasOutdoorParking) && (
              <DetailSection title="Үйлчилгээ & нэмэлт">
                <div className="flex flex-wrap gap-3">
                  {isFurnished && <FeatureBadge icon="◇" label="Тавилгатай" />}
                  {hasGarage && <FeatureBadge icon="◇" label={garageInfo ? `Гараажтай · ${garageInfo}` : "Гараажтай"} />}
                  {hasOutdoorParking && <FeatureBadge icon="◇" label="Гадаа зогсоол" />}
                </div>
              </DetailSection>
            )}

            {/* ── Гэрээний нөхцөл ── */}
            {(depositAmount > 0 || minLeaseMonths || paymentConditionText) && (
              <DetailSection title="Гэрээний нөхцөл">
                <div className="space-y-4" style={{ border: "1px solid rgba(201,168,76,0.15)", padding: 20 }}>
                  {depositAmount > 0 && (
                    <InfoRow label="Барьцаа" value={`${formattedDeposit}₮`} />
                  )}
                  {minLeaseMonths && (
                    <InfoRow label="Хамгийн бага хугацаа" value={`${minLeaseMonths} сар`} />
                  )}
                  {paymentConditionText && (
                    <InfoRow label="Төлбөрийн нөхцөл" value={paymentConditionText} multiline />
                  )}
                </div>
              </DetailSection>
            )}

            {/* ── Холбоо барих ── */}
            {hasContact && (
              <DetailSection title="Холбоо барих">
                <div className="space-y-3" style={{ border: "1px solid rgba(201,168,76,0.15)", padding: 20 }}>
                  {contactName && <InfoRow label="Нэр" value={contactName} />}
                  {contactPhone && (
                    <InfoRow
                      label="Утас"
                      value={contactPhone}
                      href={`tel:${contactPhone.replace(/\s+/g, "")}`}
                    />
                  )}
                  {contactEmail && (
                    <InfoRow
                      label="Имэйл"
                      value={contactEmail}
                      href={`mailto:${contactEmail}`}
                    />
                  )}
                </div>
              </DetailSection>
            )}

            {/* Map */}
            {property.latitude && property.longitude && (
              <DetailSection title="Байршил">
                <div style={{ height: 360, border: "1px solid rgba(201,168,76,0.2)" }}>
                  <MapContainer
                    center={[property.latitude, property.longitude]} zoom={14}
                    style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; OpenStreetMap &copy; CARTO'
                    />
                    <Marker position={[property.latitude, property.longitude]} icon={goldDiamondIcon} />
                  </MapContainer>
                </div>
              </DetailSection>
            )}
          </div>

          {/* RIGHT — Sticky CTA */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <div className="p-8" style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.2)" }}>
                <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3">Сарын түрээс</div>
                <div className="flex items-baseline gap-2 mb-1">
                  <div
                    className="font-light leading-none"
                    style={{ fontFamily: "'Cormorant Garamond', serif", color: "#C9A84C", fontSize: 56 }}
                  >
                    {formattedRent}₮
                  </div>
                </div>
                <div className="text-[10px] tracking-[0.25em] uppercase text-white/30 mb-8">/ сар</div>

                {(depositAmount > 0 || minLeaseMonths) && (
                  <div className="space-y-3 mb-8 pb-8" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {depositAmount > 0 && (
                      <SideRow label="Барьцаа" value={`${formattedDeposit}₮`} highlight />
                    )}
                    {minLeaseMonths && (
                      <SideRow label="Хамгийн бага хугацаа" value={`${minLeaseMonths} сар`} />
                    )}
                  </div>
                )}

                <ApplyCTA
                  user={user} isOwner={isOwner} isTenant={isTenant} isAvailable={isAvailable}
                  myApplication={myApplication}
                  onApply={() => { setApplyError(""); setApplyOpen(true); }}
                />

                {property.owner?.name && (
                  <div className="mt-8 pt-6 flex items-center gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <div
                      className="w-10 h-10 flex items-center justify-center"
                      style={{
                        background: "rgba(201,168,76,0.12)", color: "#C9A84C",
                        fontFamily: "'Cormorant Garamond', serif", fontSize: 18,
                      }}
                    >
                      {property.owner.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[10px] tracking-[0.25em] uppercase text-white/40">Эзэмшигч</div>
                      <div className="text-sm text-white/80">{property.owner.name}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Reviews ── */}
        <div className="mt-20 pt-12" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8" style={{ background: "#C9A84C" }} />
                <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#C9A84C" }}>Сэтгэгдэл</span>
              </div>
              <h2 className="font-light text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44 }}>
                Туршлага<br />
                <em style={{ color: "#C9A84C", fontStyle: "italic" }}>түрээслэгчдээс</em>
              </h2>
            </div>
            {reviews.length > 0 && (
              <div className="text-right">
                <div
                  className="font-light"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: "#C9A84C" }}
                >{avgRating.toFixed(1)}</div>
                <RatingDiamonds value={avgRating} />
                <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mt-2">
                  {reviews.length} сэтгэгдэл
                </div>
              </div>
            )}
          </div>

          {reviewEligible && !alreadyReviewed && (
            <form
              onSubmit={handleReviewSubmit} className="p-8 mb-10"
              style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.2)" }}
            >
              <h3 className="text-[10px] tracking-[0.3em] uppercase mb-6" style={{ color: "#C9A84C" }}>
                Сэтгэгдэл бичих
              </h3>

              {reviewError && (
                <div
                  className="mb-5 p-3 text-xs text-red-300"
                  style={{ background: "rgba(239,68,68,0.08)", borderLeft: "2px solid #EF4444" }}
                >{reviewError}</div>
              )}
              {reviewSuccess && (
                <div
                  className="mb-5 p-3 text-xs text-emerald-300"
                  style={{ background: "rgba(16,185,129,0.08)", borderLeft: "2px solid #10B981" }}
                >{reviewSuccess}</div>
              )}

              <div className="mb-6">
                <label className="block text-[10px] tracking-[0.25em] uppercase text-white/40 mb-3">Үнэлгээ</label>
                <RatingInput value={reviewRating} onChange={setReviewRating} />
              </div>

              <div className="mb-6">
                <label className="block text-[10px] tracking-[0.25em] uppercase text-white/40 mb-3">Сэтгэгдэл</label>
                <textarea
                  value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Энэ байрны талаар та юу хэлэх вэ?" rows={4}
                  className="w-full bg-transparent text-white text-sm py-3 px-4 outline-none resize-none transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                  onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
                />
              </div>

              <button
                type="submit" disabled={reviewSubmitting}
                className="px-8 py-3 text-[10px] tracking-[0.25em] uppercase transition-all duration-300 disabled:opacity-50"
                style={{ background: "#C9A84C", color: "#0A0A0A" }}
                onMouseEnter={(e) => !reviewSubmitting && (e.currentTarget.style.background = "#E8D49E")}
                onMouseLeave={(e) => !reviewSubmitting && (e.currentTarget.style.background = "#C9A84C")}
              >
                {reviewSubmitting ? "Илгээж байна..." : "Илгээх →"}
              </button>
            </form>
          )}

          {reviews.length === 0 ? (
            <div className="py-16 text-center" style={{ border: "1px solid rgba(201,168,76,0.1)" }}>
              <div
                className="w-12 h-12 mx-auto mb-5 flex items-center justify-center"
                style={{ border: "1px solid rgba(201,168,76,0.4)" }}
              >
                <div style={{ width: 16, height: 16, background: "rgba(201,168,76,0.4)", transform: "rotate(45deg)" }} />
              </div>
              <p className="font-light text-white/60" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22 }}>
                Одоогоор сэтгэгдэл байхгүй
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((r) => <ReviewItem key={r._id} review={r} />)}
            </div>
          )}
        </div>

        {/* ── Ижил төстэй байр ── */}
        {similar.length > 0 && (
          <div className="mt-20 pt-12" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px w-8" style={{ background: "#C9A84C" }} />
              <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#C9A84C" }}>
                Ижил төстэй
              </span>
            </div>
            <h2
              className="font-light text-white mb-12 leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44 }}
            >
              Танд таалагдаж<br />
              <em style={{ color: "#C9A84C", fontStyle: "italic" }}>магадгүй</em>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similar.map((p) => <SimilarCard key={p._id} property={p} />)}
            </div>
          </div>
        )}
      </section>

      {lightboxIdx !== null && (
        <Lightbox photos={photos} index={lightboxIdx} onChange={setLightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      {applyOpen && (
        <ApplyModal
          onClose={() => setApplyOpen(false)}
          message={applyMessage} setMessage={setApplyMessage}
          startDate={applyStartDate} setStartDate={setApplyStartDate}
          leaseMonths={applyLeaseMonths} setLeaseMonths={setApplyLeaseMonths}
          minLeaseMonths={minLeaseMonths}
          submitting={applying} error={applyError} onSubmit={handleApply}
          propertyTitle={property.title}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Helper components
// ─────────────────────────────────────────────────────────────────────

function DetailSection({ title, children }) {
  return (
    <div className="mb-12">
      <h3 className="text-[10px] tracking-[0.3em] uppercase mb-5" style={{ color: "#C9A84C" }}>{title}</h3>
      {children}
    </div>
  );
}

function SpecCard({ label, value }) {
  return (
    <div className="p-5" style={{ background: "#0A0A0A", border: "1px solid rgba(201,168,76,0.15)" }}>
      <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-2">{label}</div>
      <div className="font-light" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#fff" }}>
        {value}
      </div>
    </div>
  );
}

function SimilarCard({ property }) {
  const img = property.images?.[0] || PLACEHOLDER;
  const rent = new Intl.NumberFormat("mn-MN").format(property.monthlyRent || 0);
  const district = property.location?.district || "";
  const area = property.area;
  const rooms = property.rooms;

  return (
    <Link
      to={`/properties/${property._id}`}
      className="block group transition-all duration-300"
      style={{ border: "1px solid rgba(201,168,76,0.15)", background: "#0F0F0F" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.15)")}
    >
      <div className="aspect-[4/3] overflow-hidden" style={{ background: "#141414" }}>
        <img
          src={img}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ filter: "brightness(0.85)" }}
          onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
        />
      </div>
      <div className="p-5">
        <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: "#C9A84C" }}>
          {district || "—"}
        </div>
        <h3
          className="font-light text-white mb-4 leading-tight"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 22,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {property.title}
        </h3>
        <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-white/60 text-xs">
            {rooms ? `${rooms} өрөө` : ""}
            {area ? ` · ${area}м²` : ""}
          </span>
          <span style={{ color: "#C9A84C", fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>
            {rent}₮
          </span>
        </div>
      </div>
    </Link>
  );
}

function FeatureBadge({ icon, label }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 text-xs"
      style={{
        background: "rgba(201,168,76,0.08)",
        border: "1px solid rgba(201,168,76,0.3)",
        color: "rgba(255,255,255,0.85)",
      }}
    >
      <span style={{ color: "#C9A84C" }}>{icon}</span>
      {label}
    </div>
  );
}

function InfoRow({ label, value, multiline, href }) {
  const valueEl = href ? (
    <a
      href={href}
      className="text-sm hover:opacity-80 transition-opacity"
      style={{ color: "#C9A84C" }}
    >
      {value}
    </a>
  ) : (
    <span className={`text-sm text-white/85 ${multiline ? "whitespace-pre-line" : ""}`}>{value}</span>
  );
  return (
    <div className={`flex ${multiline ? "flex-col gap-1" : "items-center justify-between"}`}>
      <span className="text-[10px] tracking-[0.25em] uppercase text-white/40">{label}</span>
      {valueEl}
    </div>
  );
}

function SideRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] tracking-[0.25em] uppercase text-white/40">{label}</span>
      <span className="text-sm" style={{ color: highlight ? "#C9A84C" : "rgba(255,255,255,0.85)" }}>
        {value}
      </span>
    </div>
  );
}

function ApplyCTA({ user, isOwner, isTenant, isAvailable, myApplication, onApply }) {
  if (!user) {
    return (
      <Link
        to="/login"
        className="block w-full py-4 text-center text-xs font-medium tracking-[0.25em] uppercase transition-all duration-300"
        style={{ background: "#C9A84C", color: "#0A0A0A" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#E8D49E")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#C9A84C")}
      >Нэвтрэн өргөдөл гаргах →</Link>
    );
  }

  if (isOwner) {
    return (
      <div className="p-4 text-center text-xs text-white/50"
        style={{ background: "rgba(201,168,76,0.05)", border: "1px dashed rgba(201,168,76,0.3)" }}
      >Энэ нь таны байр</div>
    );
  }

  if (!isTenant) {
    return (
      <div className="p-4 text-center text-xs text-white/50"
        style={{ background: "rgba(201,168,76,0.05)", border: "1px dashed rgba(201,168,76,0.3)" }}
      >Зөвхөн түрээслэгч өргөдөл гаргах боломжтой</div>
    );
  }

  if (myApplication) {
    const statusMap = {
      pending:   { label: "Хүлээгдэж буй", color: "#F59E0B" },
      approved:  { label: "Зөвшөөрсөн",    color: "#10B981" },
      rejected:  { label: "Татгалзсан",    color: "#EF4444" },
      cancelled: { label: "Цуцалсан",      color: "#888" },
    };
    const s = statusMap[myApplication.status] || statusMap.pending;
    return (
      <div className="space-y-3">
        <div className="p-4 text-center"
          style={{ background: "rgba(201,168,76,0.06)", borderLeft: `2px solid ${s.color}` }}
        >
          <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-1">Таны өргөдөл</div>
          <div className="text-sm tracking-wider" style={{ color: s.color }}>{s.label}</div>
        </div>
        <Link to="/my-applications"
          className="block w-full py-3 text-center text-[10px] tracking-[0.25em] uppercase transition-colors"
          style={{ border: "1px solid #C9A84C", color: "#C9A84C" }}
        >Дэлгэрэнгүй үзэх →</Link>
      </div>
    );
  }

  if (!isAvailable) {
    return (
      <div className="p-4 text-center text-xs text-white/50"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >Байр түрээслэгдсэн</div>
    );
  }

  return (
    <button
      onClick={onApply}
      className="w-full py-4 text-xs font-medium tracking-[0.25em] uppercase transition-all duration-300 group flex items-center justify-center gap-3"
      style={{ background: "#C9A84C", color: "#0A0A0A" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#E8D49E")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#C9A84C")}
    >
      Өргөдөл гаргах
      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
    </button>
  );
}

function RatingDiamonds({ value }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i}
          style={{
            width: 10, height: 10,
            background: i <= Math.round(value) ? "#C9A84C" : "transparent",
            border: "1px solid #C9A84C", transform: "rotate(45deg)",
          }}
        />
      ))}
    </div>
  );
}

function RatingInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <div
            style={{
              width: 22, height: 22,
              background: i <= (hover || value) ? "#C9A84C" : "transparent",
              border: "1px solid #C9A84C", transform: "rotate(45deg)",
            }}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewItem({ review }) {
  const tenantName = review.tenant?.name || "Хэрэглэгч";
  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("mn-MN", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "";

  return (
    <div className="p-6" style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.1)" }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center"
            style={{
              background: "rgba(201,168,76,0.12)", color: "#C9A84C",
              fontFamily: "'Cormorant Garamond', serif", fontSize: 18,
            }}
          >{tenantName.charAt(0).toUpperCase()}</div>
          <div>
            <div className="text-sm text-white/80">{tenantName}</div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-white/40 mt-1">{date}</div>
          </div>
        </div>
        <RatingDiamonds value={review.rating || 0} />
      </div>
      <p className="text-white/65 leading-relaxed text-sm whitespace-pre-line" style={{ lineHeight: 1.7 }}>
        {review.comment}
      </p>
    </div>
  );
}

function Lightbox({ photos, index, onChange, onClose }) {
  const goPrev = useCallback((e) => {
    e?.stopPropagation();
    onChange(Math.max(index - 1, 0));
  }, [index, onChange]);
  const goNext = useCallback((e) => {
    e?.stopPropagation();
    onChange(Math.min(index + 1, photos.length - 1));
  }, [index, onChange, photos.length]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fadeIn"
      style={{ background: "rgba(5,5,5,0.95)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center text-white/60 hover:text-white transition-colors text-2xl"
        style={{ border: "1px solid rgba(255,255,255,0.15)" }} aria-label="Close"
      >✕</button>

      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] uppercase text-white/50">
        <span style={{ color: "#C9A84C" }}>{index + 1}</span> / {photos.length}
      </div>

      {index > 0 && (
        <button
          onClick={goPrev}
          className="absolute left-6 w-14 h-14 flex items-center justify-center text-white/60 hover:text-white transition-colors text-2xl"
          style={{ border: "1px solid rgba(255,255,255,0.15)" }} aria-label="Previous"
        >←</button>
      )}

      <img src={photos[index]} alt=""
        className="max-w-[90vw] max-h-[85vh] object-contain"
        style={{ boxShadow: "0 12px 60px rgba(201,168,76,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      />

      {index < photos.length - 1 && (
        <button
          onClick={goNext}
          className="absolute right-6 w-14 h-14 flex items-center justify-center text-white/60 hover:text-white transition-colors text-2xl"
          style={{ border: "1px solid rgba(255,255,255,0.15)" }} aria-label="Next"
        >→</button>
      )}
    </div>
  );
}

function ApplyModal({
  onClose, message, setMessage,
  startDate, setStartDate, leaseMonths, setLeaseMonths, minLeaseMonths,
  submitting, error, onSubmit, propertyTitle,
}) {
  const today = new Date().toISOString().split("T")[0];
  const minMonths = minLeaseMonths || 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fadeIn"
      style={{ background: "rgba(5,5,5,0.9)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg relative animate-fadeUp"
        style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          aria-label="Close"
        >✕</button>

        <div className="p-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8" style={{ background: "#C9A84C" }} />
            <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#C9A84C" }}>Application</span>
          </div>
          <h2 className="font-light text-white mb-3 leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36 }}
          >
            Өргөдөл<br />
            <em style={{ color: "#C9A84C", fontStyle: "italic" }}>гаргах</em>
          </h2>
          <p className="text-sm text-white/50 mb-8">"{propertyTitle}" байранд түрээслэх хүсэлт илгээх</p>

          {error && (
            <div className="mb-6 p-3 text-xs text-red-300"
              style={{ background: "rgba(239,68,68,0.08)", borderLeft: "2px solid #EF4444" }}
            >{error}</div>
          )}

          <form onSubmit={onSubmit}>
            {/* Эхлэх огноо */}
            <div className="mb-5">
              <label className="block text-[10px] tracking-[0.25em] uppercase text-white/40 mb-3">
                Эхлэх огноо
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
                required
                className="w-full bg-transparent text-white text-sm py-3 px-4 outline-none transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.15)", colorScheme: "dark" }}
                onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
              />
            </div>

            {/* Хугацаа */}
            <div className="mb-5">
              <label className="block text-[10px] tracking-[0.25em] uppercase text-white/40 mb-3">
                Түрээслэх хугацаа (сар)
              </label>
              <input
                type="number"
                value={leaseMonths}
                onChange={(e) => setLeaseMonths(e.target.value)}
                min={minMonths}
                step={1}
                placeholder={`${minMonths}+`}
                required
                className="w-full bg-transparent text-white text-sm py-3 px-4 outline-none transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
              />
              {minLeaseMonths > 1 && (
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mt-2">
                  Хамгийн бага: {minLeaseMonths} сар
                </p>
              )}
            </div>

            {/* Захидал */}
            <div className="mb-6">
              <label className="block text-[10px] tracking-[0.25em] uppercase text-white/40 mb-3">
                Захидал (заавал биш)
              </label>
              <textarea
                value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Өөрийгөө танилцуулж, түрээслэх шалтгаанаа бичээрэй..." rows={4}
                className="w-full bg-transparent text-white text-sm py-3 px-4 outline-none resize-none transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
              />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 text-[10px] tracking-[0.25em] uppercase text-white/60 hover:text-white transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.12)" }}
              >Болих</button>
              <button type="submit" disabled={submitting}
                className="flex-1 py-3 text-[10px] tracking-[0.25em] uppercase transition-all duration-300 disabled:opacity-50"
                style={{ background: "#C9A84C", color: "#0A0A0A" }}
                onMouseEnter={(e) => !submitting && (e.currentTarget.style.background = "#E8D49E")}
                onMouseLeave={(e) => !submitting && (e.currentTarget.style.background = "#C9A84C")}
              >{submitting ? "Илгээж байна..." : "Илгээх →"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center" style={{ background: "#0A0A0A" }}>
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-6 animate-spin"
          style={{ border: "2px solid rgba(201,168,76,0.2)", borderTopColor: "#C9A84C", borderRadius: "50%" }} />
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">Уншиж байна</p>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-6" style={{ background: "#0A0A0A" }}>
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-8 flex items-center justify-center" style={{ border: "1px solid #C9A84C" }}>
          <div style={{ width: 24, height: 24, background: "#C9A84C", transform: "rotate(45deg)" }} />
        </div>
        <h2 className="font-light text-white mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40 }}>
          Байр<br />
          <em style={{ color: "#C9A84C", fontStyle: "italic" }}>олдсонгүй</em>
        </h2>
        <p className="text-sm text-white/50 mb-8">
          Энэ хаягт хамаарах байр байхгүй эсвэл устгагдсан байна.
        </p>
        <Link to="/home"
          className="inline-block px-8 py-3 text-[10px] tracking-[0.3em] uppercase transition-all duration-300"
          style={{ background: "#C9A84C", color: "#0A0A0A" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#E8D49E")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#C9A84C")}
        >Эхлэл рүү буцах →</Link>
      </div>
    </div>
  );
}

export default PropertyDetail;