import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const ACTIVE_RENTAL_STATUSES = ["signed", "payment_pending", "active"];

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [myRental, setMyRental] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyForm, setApplyForm] = useState({ startDate: "", leaseMonths: "6", message: "" });

  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [myReview, setMyReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [canReview, setCanReview] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const currentUserId = currentUser?._id || currentUser?.id;
  const currentUserRole = currentUser?.role;

  const districtCoords = {
    "Баянзүрх": [47.9184, 106.9612], "Баянгол": [47.9077, 106.8432],
    "Сүхбаатар": [47.9195, 106.9077], "Чингэлтэй": [47.9268, 106.8782],
    "Хан-Уул": [47.8748, 106.8815], "Сонгинохайрхан": [47.9268, 106.7782],
    "Налайх": [47.7577, 107.2682], "Багануур": [47.7121, 108.2821], "Багахангай": [47.8241, 106.9121],
  };

  useEffect(() => {
    api.get(`/api/properties/${id}`).then(r => setProperty(r.data)).catch(console.log);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.get(`/api/reviews/property/${id}`).then(r => {
      setReviews(r.data.reviews);
      setAvgRating(r.data.avgRating);
      if (currentUserId) {
        const mine = r.data.reviews.find(r => r.tenant?._id === currentUserId || r.tenant?._id?.toString() === currentUserId);
        setMyReview(mine || null);
        if (mine) { setReviewRating(mine.rating); setReviewComment(mine.comment); }
      }
    }).catch(() => {});
  }, [id, currentUserId]);

  useEffect(() => {
    if (!token || currentUserRole !== "tenant") return;
    api.get("/api/applications/my").then(r => {
      setCanReview(r.data.some(a => a.property?._id === id && ["signed","payment_pending","active","cancelled"].includes(a.contractStatus)));
    }).catch(() => {});
  }, [id, token, currentUserRole]);

  useEffect(() => {
    if (!token || !currentUserRole || currentUserRole !== "tenant") return;
    api.get("/api/applications/my").then(r => {
      const active = r.data.find(a => a.property?._id === id && ACTIVE_RENTAL_STATUSES.includes(a.contractStatus));
      setMyRental(active || null);
    }).catch(() => {});
  }, [id, token, currentUserRole]);

  const mapCoords = useMemo(() => {
    if (!property) return null;
    if (property.latitude && property.longitude) return [property.latitude, property.longitude];
    return districtCoords[property.location?.district] || [47.9077, 106.8832];
  }, [property]); // eslint-disable-line

  if (!property) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
      <Navbar />
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--text-muted)] text-sm tracking-widest uppercase">Ачааллаж байна</p>
      </div>
    </div>
  );

  const images = property.images?.length > 0 ? property.images : ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"];
  const ownerId = typeof property.owner === "object" ? property.owner?._id : property.owner;
  const isOwner = currentUserId && ownerId && String(currentUserId) === String(ownerId);
  const isRented = property.status === "rented";
  const estimatedTotal = property.monthlyRent * Number(applyForm.leaseMonths || 0);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!token) { navigate("/login"); return; }
    setApplying(true);
    try {
      await api.post("/api/applications", { propertyId: property._id, startDate: applyForm.startDate, leaseMonths: Number(applyForm.leaseMonths), message: applyForm.message });
      setApplySuccess(true);
      setShowApplyModal(false);
    } catch (err) { alert(err.response?.data?.message || "Алдаа гарлаа"); }
    finally { setApplying(false); }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.post(`/api/reviews/property/${id}`, { rating: reviewRating, comment: reviewComment });
      const r = await api.get(`/api/reviews/property/${id}`);
      setReviews(r.data.reviews); setAvgRating(r.data.avgRating);
      setMyReview(r.data.reviews.find(rv => rv.tenant?._id === currentUserId));
      setShowReviewForm(false);
    } catch (err) { alert(err.response?.data?.message || "Алдаа гарлаа"); }
    finally { setSubmittingReview(false); }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Үнэлгээгээ устгах уу?")) return;
    try {
      await api.delete(`/api/reviews/${reviewId}`);
      setReviews(prev => prev.filter(r => r._id !== reviewId));
      setMyReview(null); setReviewRating(5); setReviewComment("");
    } catch { alert("Алдаа гарлаа"); }
  };

  const renderSidebarAction = () => {
    if (currentUserRole === "admin") return (
      <div className="border border-[var(--border-subtle)] p-4 text-sm text-[var(--text-muted)] text-center">
        ⚙️ Admin горимд хүсэлт илгээх боломжгүй
      </div>
    );
    if (isOwner) return (
      <div className="border border-[var(--gold)] bg-amber-50 p-4 text-sm text-center">
        <p className="text-[var(--gold)] font-medium">Энэ таны байр</p>
        <Link to={`/edit-property/${property._id}`} className="btn-outline-gold mt-3 text-xs w-full justify-center" style={{display:"flex"}}>Засах</Link>
      </div>
    );
    if (myRental) return (
      <div className="border border-[var(--gold)] bg-amber-50 p-5 text-center space-y-3">
        <p className="text-[var(--gold)] font-medium text-sm">✓ Та энэ байрыг түрээсэлж байна</p>
        <Link to="/my-rentals" className="btn-gold w-full justify-center text-xs" style={{display:"flex",padding:"10px 0"}}>Миний түрээс</Link>
        <Link to={`/contract/${myRental._id}`} className="btn-outline-gold w-full justify-center text-xs" style={{display:"flex",padding:"10px 0"}}>Гэрээ харах</Link>
      </div>
    );
    if (isRented) return (
      <div className="border border-[var(--border-subtle)] p-4 text-sm text-[var(--text-soft)] text-center">
        🔒 Энэ байр одоогоор түрээслэгдсэн байна
      </div>
    );
    return (
      <button onClick={() => { if (!token) { navigate("/login"); return; } setShowApplyModal(true); }}
        disabled={applySuccess}
        className="btn-gold w-full justify-center" style={{ padding: "16px 0", display:"flex" }}>
        {applySuccess ? "✓ Хүсэлт илгээгдсэн" : "Түрээслэх хүсэлт илгээх"}
      </button>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingTop: 64 }}>
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back button */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors text-sm mb-6">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Буцах
        </button>

        {/* Main image */}
        <div className="relative overflow-hidden mb-3" style={{ aspectRatio: "16/7" }}>
          <img src={images[0]} alt={property.title} onClick={() => setSelectedImageIndex(0)}
            className="w-full h-full object-cover cursor-pointer transition-transform duration-700 hover:scale-105" />
          {isRented && !myRental && (
            <div className="absolute top-4 left-4"><span className="badge-ink">🔒 Түрээслэгдсэн</span></div>
          )}
          {myRental && (
            <div className="absolute top-4 left-4"><span className="badge-gold">✓ Таны түрээс</span></div>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <img key={i} src={img} alt="" onClick={() => setSelectedImageIndex(i)}
                className={`w-20 h-14 object-cover flex-shrink-0 cursor-pointer transition-all duration-200 ${selectedImageIndex === i ? "ring-2 ring-[var(--gold)]" : "opacity-70 hover:opacity-100"}`} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Title & price */}
            <div className="bg-white border border-[var(--border-subtle)] p-8">
              <h1 className="font-display text-3xl font-light text-[var(--ink)] mb-2">{property.title}</h1>
              <p className="text-[var(--text-muted)] text-sm mb-4 flex items-center gap-1">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M12 21c0 0-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2"/>
                </svg>
                {property.location?.city}, {property.location?.district}, {property.location?.address}
              </p>
              <div className="h-px mb-4" style={{ background: "linear-gradient(90deg, var(--gold-light), transparent)" }} />
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-light text-[var(--ink)]">{property.monthlyRent?.toLocaleString()}</span>
                <span className="text-[var(--text-muted)] text-sm">₮/сар</span>
              </div>
              {applySuccess && (
                <div className="mt-4 p-4 border-l-2 border-[var(--gold)] bg-amber-50">
                  <p className="text-xs text-[var(--gold)]">✓ Таны хүсэлт амжилттай илгээгдлээ!</p>
                </div>
              )}
            </div>

            {/* Property details */}
            <div className="bg-white border border-[var(--border-subtle)] p-8">
              <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-6">Байрны мэдээлэл</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Өрөө", value: property.rooms },
                  { label: "Талбай", value: `${property.area} м²` },
                  { label: "Давхар", value: `${property.floorNumber || "-"}/${property.totalFloors || "-"}` },
                  { label: "Ашиглалтад орсон он", value: property.builtYear },
                  { label: "Тавилга", value: property.isFurnished ? "Тавилгатай" : "Тавилгагүй" },
                  { label: "Тагт", value: property.balconyCount },
                  { label: "Цонх", value: `${property.windowCount || "-"} • ${property.windowType || "-"}` },
                  { label: "Шал", value: property.floorMaterial },
                  { label: "Хаалга", value: property.doorType },
                  { label: "Гараж", value: property.garageInfo },
                  { label: "Гадна зогсоол", value: property.hasOutdoorParking ? "Байгаа" : "Байхгүй" },
                  { label: "Төлбөрийн нөхцөл", value: property.paymentConditionText },
                ].map(({ label, value }) => (
                  <div key={label} className="border border-[var(--border-subtle)] p-4">
                    <p className="text-xs tracking-wide text-[var(--text-soft)] mb-1">{label}</p>
                    <p className="text-sm font-medium text-[var(--ink)]">{value || "—"}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {property.details && (
              <div className="bg-white border border-[var(--border-subtle)] p-8">
                <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-4">Дэлгэрэнгүй</p>
                <p className="text-sm text-[var(--text-muted)] leading-7 whitespace-pre-line">{property.details}</p>
              </div>
            )}

            {/* Map */}
            <div className="bg-white border border-[var(--border-subtle)] overflow-hidden">
              <div className="p-6 border-b border-[var(--border-subtle)]">
                <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-1">Байршил</p>
                <p className="text-sm text-[var(--text-muted)]">📍 {property.location?.city}, {property.location?.district}{property.location?.address ? `, ${property.location.address}` : ""}</p>
              </div>
              {mapCoords && (
                <MapContainer center={mapCoords} zoom={15} style={{ height: 280, width: "100%", zIndex: 0 }} scrollWheelZoom={false}>
                  <TileLayer attribution='© OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={mapCoords}>
                    <Popup><strong>{property.title}</strong><br />{property.monthlyRent?.toLocaleString()}₮/сар</Popup>
                  </Marker>
                </MapContainer>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white border border-[var(--border-subtle)] p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-2">Үнэлгээ</p>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex">{[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= Math.round(avgRating) ? "var(--gold)" : "var(--border-subtle)", fontSize: 16 }}>★</span>)}</div>
                      <span className="font-display text-xl text-[var(--ink)]">{avgRating}</span>
                      <span className="text-xs text-[var(--text-soft)]">({reviews.length})</span>
                    </div>
                  )}
                </div>
                {canReview && !showReviewForm && (
                  <button onClick={() => setShowReviewForm(true)} className="btn-outline-gold text-xs" style={{ padding: "8px 16px" }}>
                    {myReview ? "✏️ Засах" : "⭐ Үнэлгээ өгөх"}
                  </button>
                )}
              </div>

              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="border border-[var(--border-subtle)] p-5 mb-6">
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => setReviewRating(s)}
                        style={{ fontSize: 28, color: s <= reviewRating ? "var(--gold)" : "var(--border-subtle)", transition: "color 0.2s" }}>★</button>
                    ))}
                  </div>
                  <textarea rows={3} placeholder="Сэтгэгдэл бичих..." value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                    className="luxury-input resize-none mb-4" />
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowReviewForm(false)} className="btn-ghost text-sm">Болих</button>
                    <button type="submit" disabled={submittingReview} className="btn-gold text-xs" style={{ padding: "10px 24px" }}>
                      {submittingReview ? "Хадгалж байна..." : "Хадгалах"}
                    </button>
                  </div>
                </form>
              )}

              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[var(--text-soft)] text-sm">Үнэлгээ байхгүй байна</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => {
                    const isMyReview = review.tenant?._id === currentUserId || review.tenant?._id?.toString() === currentUserId;
                    return (
                      <div key={review._id} className={`border p-5 ${isMyReview ? "border-[var(--gold)]" : "border-[var(--border-subtle)]"}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[var(--gold)] flex items-center justify-center text-[var(--ink)] text-xs font-medium">
                              {review.tenant?.firstName?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[var(--ink)]">{review.tenant?.firstName} {review.tenant?.lastName} {isMyReview && <span className="text-xs text-[var(--gold)]">(Та)</span>}</p>
                              <div className="flex">{[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= review.rating ? "var(--gold)" : "var(--border-subtle)", fontSize: 12 }}>★</span>)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[var(--text-soft)]">{new Date(review.createdAt).toLocaleDateString("mn-MN")}</span>
                            {isMyReview && <button onClick={() => handleDeleteReview(review._id)} className="text-xs text-red-400 hover:text-red-600">Устгах</button>}
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-[var(--text-muted)] leading-relaxed">{review.comment}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Contact */}
            <div className="bg-white border border-[var(--border-subtle)] p-6">
              <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-4">Холбоо барих</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-soft)]">Нэр</span>
                  <span className="font-medium text-[var(--ink)]">{property.contactName || property.owner?.firstName}</span>
                </div>
                <div className="h-px" style={{ background: "var(--border-subtle)" }} />
                <div className="flex justify-between">
                  <span className="text-[var(--text-soft)]">Утас</span>
                  <a href={`tel:${property.contactPhone}`} className="font-medium" style={{ color: "var(--gold)" }}>
                    {property.contactPhone || property.owner?.phone}
                  </a>
                </div>
                <div className="h-px" style={{ background: "var(--border-subtle)" }} />
                <div className="flex justify-between">
                  <span className="text-[var(--text-soft)]">Имэйл</span>
                  <span className="font-medium text-[var(--ink)] text-xs">{property.contactEmail || property.owner?.email}</span>
                </div>
              </div>
            </div>

            {/* Action */}
            {renderSidebarAction()}

            {/* Payment info */}
            <div className="bg-white border border-[var(--border-subtle)] p-6">
              <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-4">Төлбөрийн нөхцөл</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-soft)]">Барьцаа мөнгө</span>
                  <span className="font-medium text-[var(--ink)]">{property.depositAmount ? `${property.depositAmount.toLocaleString()}₮` : "—"}</span>
                </div>
                <div className="h-px" style={{ background: "var(--border-subtle)" }} />
                <div className="flex justify-between">
                  <span className="text-[var(--text-soft)]">Хамгийн бага хугацаа</span>
                  <span className="font-medium text-[var(--ink)]">{property.minLeaseMonths || 6} сар</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowApplyModal(false); }}>
          <div className="bg-white w-full md:max-w-md p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-1">Хүсэлт</p>
                <h2 className="font-display text-2xl font-light text-[var(--ink)]">Түрээслэх хүсэлт</h2>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="text-[var(--text-soft)] hover:text-[var(--ink)] text-2xl">×</button>
            </div>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[var(--text-muted)] mb-2">Эхлэх огноо</label>
                <input type="date" required min={new Date().toISOString().split("T")[0]} className="luxury-input"
                  value={applyForm.startDate} onChange={e => setApplyForm(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[var(--text-muted)] mb-2">Хугацаа</label>
                <select className="luxury-select" value={applyForm.leaseMonths} onChange={e => setApplyForm(p => ({ ...p, leaseMonths: e.target.value }))}>
                  {[3,6,9,12,18,24].map(m => <option key={m} value={m}>{m} сар</option>)}
                </select>
              </div>
              {applyForm.leaseMonths && (
                <div className="border-l-2 border-[var(--gold)] pl-4 py-2">
                  <span className="text-xs text-[var(--text-muted)]">Нийт дүн: </span>
                  <span className="font-display text-lg text-[var(--ink)]">{estimatedTotal.toLocaleString()}₮</span>
                </div>
              )}
              <div>
                <label className="block text-xs tracking-widest uppercase text-[var(--text-muted)] mb-2">Мессеж</label>
                <textarea rows={3} placeholder="Өөрийгөө танилцуулах..." className="luxury-input resize-none"
                  value={applyForm.message} onChange={e => setApplyForm(p => ({ ...p, message: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowApplyModal(false)} className="btn-ghost flex-1">Болих</button>
                <button type="submit" disabled={applying} className="btn-gold flex-1 justify-center" style={{ padding: "14px 0" }}>
                  {applying ? "Илгээж байна..." : "Илгээх"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          <button onClick={() => setSelectedImageIndex(null)} className="absolute top-4 right-4 text-white text-4xl">×</button>
          <button onClick={() => setSelectedImageIndex(selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1)}
            className="absolute left-4 text-white text-5xl">‹</button>
          <img src={images[selectedImageIndex]} alt="" className="max-w-[90%] max-h-[90%] object-contain" />
          <button onClick={() => setSelectedImageIndex(selectedImageIndex === images.length - 1 ? 0 : selectedImageIndex + 1)}
            className="absolute right-4 text-white text-5xl">›</button>
          <div className="absolute bottom-4 text-white/60 text-sm">{selectedImageIndex + 1} / {images.length}</div>
        </div>
      )}
    </div>
  );
}

export default PropertyDetail;