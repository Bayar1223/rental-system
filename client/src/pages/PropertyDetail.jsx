import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

// Leaflet default marker icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Tenant энэ байрыг идэвхтэй түрээсэлж байгаа эсэхийг шалгах
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
  const [applyForm, setApplyForm] = useState({
    startDate: "",
    leaseMonths: "6",
    message: "",
  });

  // Review state
  const [reviews, setReviews]         = useState([]);
  const [avgRating, setAvgRating]     = useState(0);
  const [myReview, setMyReview]       = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating]     = useState(5);
  const [reviewComment, setReviewComment]   = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [canReview, setCanReview]     = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const currentUserId = currentUser?._id || currentUser?.id;
  const currentUserRole = currentUser?.role;

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await api.get(`/api/properties/${id}`);
        setProperty(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchProperty();
  }, [id]);

  // Review-үүд ачаалах
  useEffect(() => {
    if (!id) return;
    const fetchReviews = async () => {
      try {
        const res = await api.get(`/api/reviews/property/${id}`);
        setReviews(res.data.reviews);
        setAvgRating(res.data.avgRating);
        if (currentUserId) {
          const mine = res.data.reviews.find(
            (r) => r.tenant?._id === currentUserId || r.tenant?._id?.toString() === currentUserId
          );
          setMyReview(mine || null);
          if (mine) { setReviewRating(mine.rating); setReviewComment(mine.comment); }
        }
      } catch { /* silent */ }
    };
    fetchReviews();
  }, [id, currentUserId]);

  // Tenant энэ байрыг түрээсэлж байгаа эсэхийг шалгах → review өгч болох эсэх
  useEffect(() => {
    if (!token || currentUserRole !== "tenant") return;
    const checkCanReview = async () => {
      try {
        const res = await api.get("/api/applications/my");
        const hasRented = res.data.some(
          (app) =>
            app.property?._id === id &&
            ["signed", "payment_pending", "active", "cancelled"].includes(app.contractStatus)
        );
        setCanReview(hasRented);
      } catch { /* silent */ }
    };
    checkCanReview();
  }, [id, token, currentUserRole]);

  // DB координат → useMemo (setState биш)
  const districtCoords = {
    "Баянзүрх":       [47.9184, 106.9612],
    "Баянгол":        [47.9077, 106.8432],
    "Сүхбаатар":      [47.9195, 106.9077],
    "Чингэлтэй":      [47.9268, 106.8782],
    "Хан-Уул":        [47.8748, 106.8815],
    "Сонгинохайрхан": [47.9268, 106.7782],
    "Налайх":         [47.7577, 107.2682],
    "Багануур":       [47.7121, 108.2821],
    "Багахангай":     [47.8241, 106.9121],
  };
  const mapCoords = useMemo(() => {
    if (!property) return null;
    if (property.latitude && property.longitude) {
      return [property.latitude, property.longitude];
    }
    const district = property.location?.district;
    return districtCoords[district] || [47.9077, 106.8832];
  }, [property]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tenant бол өөрийн энэ байртай холбоотой идэвхтэй гэрээ байгаа эсэхийг шалгана
  useEffect(() => {
    if (!token || !currentUserRole || currentUserRole !== "tenant") return;
    const checkRental = async () => {
      try {
        const res = await api.get("/api/applications/my");
        const active = res.data.find(
          (app) =>
            app.property?._id === id &&
            ACTIVE_RENTAL_STATUSES.includes(app.contractStatus)
        );
        setMyRental(active || null);
      } catch {
        // чимээгүй алдаатай
      }
    };
    checkRental();
  }, [id, token, currentUserRole]);

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  const images =
    property.images && property.images.length > 0
      ? property.images
      : ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"];

  const ownerId = typeof property.owner === "object" ? property.owner?._id : property.owner;
  const isOwner = currentUserId && ownerId && String(currentUserId) === String(ownerId);
  const isRented = property.status === "rented";
  const estimatedTotal = property.monthlyRent * Number(applyForm.leaseMonths || 0);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!token) { navigate("/login"); return; }
    setApplying(true);
    try {
      await api.post("/api/applications", {
        propertyId: property._id,
        startDate: applyForm.startDate,
        leaseMonths: Number(applyForm.leaseMonths),
        message: applyForm.message,
      });
      setApplySuccess(true);
      setShowApplyModal(false);
    } catch (error) {
      alert(error.response?.data?.message || "Алдаа гарлаа");
    } finally {
      setApplying(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await api.post(`/api/reviews/property/${id}`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      // Reviews дахин ачаалах
      const reviewsRes = await api.get(`/api/reviews/property/${id}`);
      setReviews(reviewsRes.data.reviews);
      setAvgRating(reviewsRes.data.avgRating);
      setMyReview(res.data.review);
      setShowReviewForm(false);
    } catch (err) {
      alert(err.response?.data?.message || "Алдаа гарлаа");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Үнэлгээгээ устгах уу?")) return;
    try {
      await api.delete(`/api/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      setMyReview(null);
      setReviewRating(5);
      setReviewComment("");
    } catch { alert("Алдаа гарлаа"); }
  };

  const renderSidebarAction = () => {
    // 0. Admin — хүсэлт илгээх боломжгүй
    if (currentUserRole === "admin") {
      return (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-sm text-purple-700 text-center">
          ⚙️ Admin горимд хүсэлт илгээх боломжгүй
        </div>
      );
    }

    if (isOwner) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700 text-center">
          Энэ таны байр
        </div>
      );
    }
    if (myRental) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center space-y-3">
          <p className="text-green-700 font-semibold text-sm">✓ Та энэ байрыг түрээсэлж байна</p>
          <Link
            to="/my-rentals"
            className="block w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium text-sm transition text-center"
          >
            🏠 Миний түрээс харах
          </Link>
          <Link
            to={`/contract/${myRental._id}`}
            className="block w-full bg-white border border-green-300 hover:bg-green-50 text-green-700 py-3 rounded-xl font-medium text-sm transition text-center"
          >
            📄 Гэрээ харах
          </Link>
        </div>
      );
    }
    if (isRented) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-500 text-center">
          🔒 Энэ байр одоогоор түрээслэгдсэн байна
        </div>
      );
    }
    return (
      <button
        onClick={() => {
          if (!token) { navigate("/login"); return; }
          setShowApplyModal(true);
        }}
        disabled={applySuccess}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-lg transition disabled:opacity-60"
      >
        {applySuccess ? "✓ Хүсэлт илгээгдсэн" : "Түрээслэх хүсэлт илгээх"}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-4 md:pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition text-sm mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Буцах
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 pb-10">

        {/* Зургийн gallery */}
        <div className="relative rounded-2xl overflow-hidden shadow mb-4">
          <img
            src={images[0]}
            alt={property.title}
            onClick={() => setSelectedImageIndex(0)}
            className="w-full h-64 md:h-[420px] object-cover cursor-pointer"
          />
          {isRented && !myRental && (
            <div className="absolute top-4 left-4 bg-gray-800/80 text-white text-xs font-semibold px-3 py-1 rounded-full">
              🔒 Түрээслэгдсэн
            </div>
          )}
          {myRental && (
            <div className="absolute top-4 left-4 bg-green-600/90 text-white text-xs font-semibold px-3 py-1 rounded-full">
              ✓ Таны түрээс
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`property-${index}`}
                onClick={() => setSelectedImageIndex(index)}
                className="w-20 h-14 md:w-28 md:h-20 object-cover rounded-xl cursor-pointer border-2 hover:border-indigo-500 flex-shrink-0 transition"
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-5">

            <div className="bg-white p-5 md:p-8 rounded-2xl shadow">
              <h1 className="text-2xl md:text-4xl font-bold mb-2">{property.title}</h1>
              <p className="text-gray-500 mb-3 flex items-center gap-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {property.location?.city}, {property.location?.district}, {property.location?.address}
              </p>
              <p className="text-indigo-600 text-2xl md:text-3xl font-bold">
                {property.monthlyRent?.toLocaleString()}₮
                <span className="text-gray-400 text-base font-normal">/сар</span>
              </p>
              {applySuccess && (
                <div className="mt-4 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
                  ✓ Таны хүсэлт амжилттай илгээгдлээ!
                </div>
              )}
            </div>

            <div className="bg-white p-5 md:p-8 rounded-2xl shadow">
              <h2 className="text-xl font-bold mb-4">Байрны мэдээлэл</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Info label="Өрөө" value={property.rooms} />
                <Info label="Талбай" value={`${property.area} м²`} />
                <Info label="Түрээсийн нөхцөл" value={property.paymentConditionText} />
                <Info label="Давхар" value={`${property.floorNumber || "-"} / ${property.totalFloors || "-"}`} />
                <Info label="Ашиглалтад орсон он" value={property.builtYear} />
                <Info label="Тагт" value={property.balconyCount} />
                <Info label="Цонх" value={`${property.windowCount || "-"} • ${property.windowType || "-"}`} />
                <Info label="Шал" value={property.floorMaterial} />
                <Info label="Хаалга" value={property.doorType} />
                <Info label="Гараж" value={property.garageInfo} />
                <Info label="Тавилга" value={property.isFurnished ? "Тавилгатай" : "Тавилгагүй"} />
                <Info label="Гадна зогсоол" value={property.hasOutdoorParking ? "Байгаа" : "Байхгүй"} />
              </div>
            </div>

            {property.details && (
              <div className="bg-white p-5 md:p-8 rounded-2xl shadow">
                <h2 className="text-xl font-bold mb-3">Дэлгэрэнгүй мэдээлэл</h2>
                <p className="text-gray-700 leading-7 whitespace-pre-line text-sm md:text-base">
                  {property.details}
                </p>
              </div>
            )}

            {/* Газрын зураг — Leaflet */}
            <div className="bg-white rounded-2xl shadow overflow-hidden relative" style={{ zIndex: 0 }}>
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-xl font-bold">Байршил</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  📍 {property.location?.city}, {property.location?.district}
                  {property.location?.address ? `, ${property.location.address}` : ""}
                </p>
              </div>
              {mapCoords ? (
                <MapContainer
                  center={mapCoords}
                  zoom={15}
                  style={{ height: "320px", width: "100%", zIndex: 0 }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={mapCoords}>
                    <Popup>
                      <strong>{property.title}</strong><br />
                      {property.location?.city}, {property.location?.district}<br />
                      {property.monthlyRent?.toLocaleString()}₮/сар
                    </Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="h-80 flex items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-400">
                    <div className="text-3xl mb-2">🗺️</div>
                    <p className="text-sm">Газрын зураг ачааллаж байна...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow">
              <h3 className="font-bold text-lg mb-3">Холбоо барих</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Нэр: </span>
                  <span className="font-medium">{property.contactName || property.owner?.firstName}</span>
                </p>
                <p>
                  <span className="text-gray-500">Утас: </span>
                  <a href={`tel:${property.contactPhone || property.owner?.phone}`}
                    className="font-medium text-indigo-600 hover:underline">
                    {property.contactPhone || property.owner?.phone}
                  </a>
                </p>
                <p>
                  <span className="text-gray-500">Имэйл: </span>
                  <span className="font-medium">{property.contactEmail || property.owner?.email}</span>
                </p>
              </div>
            </div>

            {renderSidebarAction()}

            <div className="bg-white p-5 rounded-2xl shadow text-sm">
              <h3 className="font-bold mb-3">Төлбөрийн нөхцөл</h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Барьцаа мөнгө</span>
                  <span className="font-medium">
                    {property.depositAmount ? `${property.depositAmount.toLocaleString()}₮` : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Хамгийн бага хугацаа</span>
                  <span className="font-medium">{property.minLeaseMonths || 6} сар</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====== REVIEW SECTION — Grid-ийн доор ====== */}
        <div className="mt-6 bg-white rounded-2xl shadow p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold">Үнэлгээ ба сэтгэгдэл</h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">
                    {[1,2,3,4,5].map((s) => (
                      <span key={s} className={`text-lg ${s <= Math.round(avgRating) ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                    ))}
                  </div>
                  <span className="font-bold text-gray-900">{avgRating}</span>
                  <span className="text-gray-500 text-sm">({reviews.length} үнэлгээ)</span>
                </div>
              )}
            </div>
            {canReview && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium transition"
              >
                {myReview ? "✏️ Засах" : "⭐ Үнэлгээ өгөх"}
              </button>
            )}
          </div>

          {/* Review form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="bg-indigo-50 rounded-xl p-4 mb-5 max-w-2xl">
              <p className="font-semibold text-sm text-gray-700 mb-3">Үнэлгээ өгөх</p>
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map((s) => (
                  <button key={s} type="button" onClick={() => setReviewRating(s)}
                    className={`text-3xl transition ${s <= reviewRating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}>
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-500 self-center">{reviewRating}/5</span>
              </div>
              <textarea
                rows={3}
                placeholder="Сэтгэгдэл бичих..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 resize-none mb-3"
              />
              <div className="flex gap-2 max-w-xs">
                <button type="button" onClick={() => setShowReviewForm(false)}
                  className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                  Болих
                </button>
                <button type="submit" disabled={submittingReview}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50">
                  {submittingReview ? "Хадгалж байна..." : "Хадгалах"}
                </button>
              </div>
            </form>
          )}

          {/* Reviews жагсаалт */}
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">⭐</div>
              <p className="text-sm">Үнэлгээ байхгүй байна</p>
              {canReview && <p className="text-xs mt-1 text-indigo-500">Та эхний үнэлгээ өгч болно!</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((review) => {
                const isMyReview = review.tenant?._id === currentUserId ||
                  review.tenant?._id?.toString() === currentUserId;
                return (
                  <div key={review._id} className={`border rounded-xl p-4 ${isMyReview ? "border-indigo-200 bg-indigo-50/30" : "border-gray-100"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {review.tenant?.avatar
                            ? <img src={review.tenant.avatar} alt="" className="w-full h-full object-cover" />
                            : <span className="text-indigo-600 font-bold text-sm">
                                {review.tenant?.firstName?.[0]?.toUpperCase()}
                              </span>
                          }
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">
                            {review.tenant?.firstName} {review.tenant?.lastName}
                            {isMyReview && <span className="ml-1 text-xs text-indigo-600">(Та)</span>}
                          </p>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <span key={s} className={`text-sm ${s <= review.rating ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString("mn-MN")}
                        </span>
                        {isMyReview && (
                          <button onClick={() => handleDeleteReview(review._id)}
                            className="text-xs text-red-400 hover:text-red-600 transition">
                            Устгах
                          </button>
                        )}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 mt-3 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showApplyModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowApplyModal(false); }}
        >
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">Түрээслэх хүсэлт</h2>
              <button onClick={() => setShowApplyModal(false)} className="text-gray-400 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Эхлэх огноо</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 text-sm"
                  value={applyForm.startDate}
                  onChange={(e) => setApplyForm((p) => ({ ...p, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Хугацаа</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none text-sm"
                  value={applyForm.leaseMonths}
                  onChange={(e) => setApplyForm((p) => ({ ...p, leaseMonths: e.target.value }))}
                >
                  {[3, 6, 9, 12, 18, 24].map((m) => (
                    <option key={m} value={m}>{m} сар</option>
                  ))}
                </select>
              </div>
              {applyForm.leaseMonths && (
                <div className="bg-indigo-50 rounded-xl p-3 text-sm">
                  <span className="text-gray-600">Нийт: </span>
                  <span className="font-bold text-indigo-700">{estimatedTotal.toLocaleString()}₮</span>
                  <span className="text-gray-400"> ({applyForm.leaseMonths} × {property.monthlyRent?.toLocaleString()}₮)</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Мессеж (заавал биш)</label>
                <textarea
                  rows={3}
                  placeholder="Өөрийгөө танилцуулах..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 resize-none text-sm"
                  value={applyForm.message}
                  onChange={(e) => setApplyForm((p) => ({ ...p, message: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowApplyModal(false)}
                  className="flex-1 border border-gray-200 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition text-sm">
                  Болих
                </button>
                <button type="submit" disabled={applying}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50 text-sm">
                  {applying ? "Илгээж байна..." : "Илгээх"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          <button onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 text-white text-4xl w-10 h-10 flex items-center justify-center">×</button>
          <button
            onClick={() => setSelectedImageIndex(selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1)}
            className="absolute left-4 text-white text-5xl w-10 h-10 flex items-center justify-center">‹</button>
          <img src={images[selectedImageIndex]} alt="preview"
            className="max-w-[90%] max-h-[90%] object-contain rounded-xl" />
          <button
            onClick={() => setSelectedImageIndex(selectedImageIndex === images.length - 1 ? 0 : selectedImageIndex + 1)}
            className="absolute right-4 text-white text-5xl w-10 h-10 flex items-center justify-center">›</button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {selectedImageIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-gray-50 p-3 rounded-xl">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="font-semibold text-sm">{value || "—"}</p>
    </div>
  );
}

export default PropertyDetail;