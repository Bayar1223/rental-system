import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

const CONTRACT_STATUS = {
  none:               { label: "Гэрээ байхгүй",      cls: "bg-gray-100 text-gray-500" },
  pending_signatures: { label: "Гарын үсэг хүлээгдэж байна", cls: "bg-yellow-100 text-yellow-700" },
  signed:             { label: "Гэрээ баталгаажсан", cls: "bg-green-100 text-green-700" },
  cancelled:          { label: "Цуцлагдсан",          cls: "bg-red-100 text-red-600" },
};

function daysLeft(endDate) {
  const diff = new Date(endDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("mn-MN", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function MyRentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isLandlord = currentUser?.role === "landlord";

 const fetchRentals = async () => {
    try {
      const res = await api.get("/api/applications/active");
      setRentals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
  (async () => {
    try {
      const res = await api.get("/api/applications/active");
      setRentals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  })();
}, []);

  const handleSign = async (id) => {
    setSigning(id);
    try {
      await api.put(`/api/applications/${id}/sign`);
      fetchRentals();
    } catch (err) {
      alert(err.response?.data?.message || "Алдаа гарлаа");
    } finally {
      setSigning(null);
    }
  };

  const handleCancel = async () => {
    if (!showCancelModal) return;
    setCancelling(showCancelModal);
    try {
      await api.put(`/api/applications/${showCancelModal}/cancel`, {
        reason: cancelReason,
      });
      setShowCancelModal(null);
      setCancelReason("");
      fetchRentals();
    } catch (err) {
      alert(err.response?.data?.message || "Алдаа гарлаа");
    } finally {
      setCancelling(null);
    }
  };

  // Нийт орлого тооцоолох (landlord)
  const totalMonthlyIncome = rentals.reduce(
    (sum, r) => sum + (r.property?.monthlyRent || 0), 0
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 pb-10">

        <h1 className="text-2xl md:text-3xl font-bold mb-6">
          {isLandlord ? "Түрээслүүлж байгаа байрнууд" : "Миний түрээс"}
        </h1>

        {/* Landlord summary */}
        {isLandlord && rentals.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow text-center">
              <p className="text-2xl font-bold text-indigo-600">{rentals.length}</p>
              <p className="text-sm text-gray-500 mt-1">Идэвхтэй түрээс</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow text-center">
              <p className="text-2xl font-bold text-green-600">
                {totalMonthlyIncome.toLocaleString()}₮
              </p>
              <p className="text-sm text-gray-500 mt-1">Сарын нийт орлого</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow text-center col-span-2 md:col-span-1">
              <p className="text-2xl font-bold text-gray-700">
                {rentals.filter(r => r.contractStatus === "signed").length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Гэрээ баталгаажсан</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : rentals.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
            <div className="text-5xl mb-3">🏠</div>
            <p className="text-lg font-medium">
              {isLandlord ? "Одоогоор түрээслүүлж байгаа байр байхгүй" : "Одоогоор идэвхтэй түрээс байхгүй"}
            </p>
            {!isLandlord && (
              <Link to="/home" className="mt-4 inline-block text-indigo-600 hover:underline text-sm">
                Байр хайх →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {rentals.map((rental) => {
              const days = daysLeft(rental.endDate);
              const cs = CONTRACT_STATUS[rental.contractStatus] || CONTRACT_STATUS.none;
              const image = rental.property?.images?.[0] ||
                "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";

              const iSigned = isLandlord
                ? rental.landlordSigned
                : rental.tenantSigned;
              const otherSigned = isLandlord
                ? rental.tenantSigned
                : rental.landlordSigned;

              return (
                <div key={rental._id} className="bg-white rounded-2xl shadow overflow-hidden">
                  <div className="flex gap-4 p-5">
                    <img src={image} alt="" className="w-24 h-20 md:w-32 md:h-24 object-cover rounded-xl flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Link to={`/properties/${rental.property?._id}`}
                          className="font-bold text-gray-900 hover:text-indigo-600 transition line-clamp-1">
                          {rental.property?.title}
                        </Link>
                        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 font-medium ${cs.cls}`}>
                          {cs.label}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 mb-2">
                        📍 {rental.property?.location?.district}, {rental.property?.location?.city}
                      </p>

                      {/* Нөгөө талын мэдээлэл */}
                      {isLandlord ? (
                        <p className="text-sm text-gray-600">
                          👤 {rental.tenant?.firstName} {rental.tenant?.lastName} — {rental.tenant?.phone}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600">
                          🏢 {rental.landlord?.firstName} {rental.landlord?.lastName} — {rental.landlord?.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Огноо, төлбөр */}
                  <div className="px-5 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-gray-400 text-xs mb-1">Эхлэх огноо</p>
                      <p className="font-semibold">{formatDate(rental.startDate)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-gray-400 text-xs mb-1">Дуусах огноо</p>
                      <p className="font-semibold">{formatDate(rental.endDate)}</p>
                    </div>
                    <div className={`rounded-xl p-3 ${days <= 30 ? "bg-red-50" : "bg-gray-50"}`}>
                      <p className="text-gray-400 text-xs mb-1">Үлдсэн хоног</p>
                      <p className={`font-bold ${days <= 30 ? "text-red-600" : "text-gray-800"}`}>
                        {days} хоног
                      </p>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-3">
                      <p className="text-gray-400 text-xs mb-1">Сарын төлбөр</p>
                      <p className="font-bold text-indigo-600">
                        {rental.property?.monthlyRent?.toLocaleString()}₮
                      </p>
                    </div>
                  </div>

                  {/* Гэрээний үйлдлүүд */}
                  {rental.contractStatus !== "cancelled" && (
                    <div className="px-5 pb-5 flex flex-wrap gap-2">
                      {/* Гарын үсэг зурах */}
                      {rental.contractStatus === "pending_signatures" && !iSigned && (
                        <button
                          onClick={() => handleSign(rental._id)}
                          disabled={signing === rental._id}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
                        >
                          {signing === rental._id ? "..." : "✍️ Гэрээнд гарын үсэг зурах"}
                        </button>
                      )}
                      {rental.contractStatus === "pending_signatures" && iSigned && !otherSigned && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-xl text-sm">
                          ✓ Та гарын үсэг зурлаа — нөгөө талын гарын үсгийг хүлээж байна
                        </div>
                      )}

                      {/* Гэрээ харах */}
                      <Link
                        to={`/contract/${rental._id}`}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition"
                      >
                        📄 Гэрээ харах
                      </Link>

                      {/* Гэрээ цуцлах */}
                      <button
                        onClick={() => setShowCancelModal(rental._id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-medium transition"
                      >
                        ❌ Гэрээ цуцлах
                      </button>
                    </div>
                  )}

                  {rental.contractStatus === "cancelled" && rental.cancellationReason && (
                    <div className="px-5 pb-5">
                      <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
                        Цуцлах шалтгаан: {rental.cancellationReason}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md p-6">
            <h2 className="text-xl font-bold mb-2">Гэрээ цуцлах</h2>
            <p className="text-gray-500 text-sm mb-4">
              Гэрээг цуцлахад нөгөө тал мэдэгдэл хүлээн авна.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Цуцлах шалтгаан
              </label>
              <textarea
                rows={3}
                placeholder="Шалтгааныг бичнэ үү..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCancelModal(null); setCancelReason(""); }}
                className="flex-1 border border-gray-200 py-3 rounded-xl text-gray-600 hover:bg-gray-50 text-sm transition"
              >
                Болих
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling === showCancelModal}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                {cancelling === showCancelModal ? "..." : "Цуцлах"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyRentals;