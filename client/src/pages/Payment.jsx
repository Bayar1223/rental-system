import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("mn-MN", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function formatMoney(amount) {
  if (!amount) return "0₮";
  return `${Number(amount).toLocaleString()}₮`;
}

function daysUntilDue(dueDate) {
  const diff = new Date(dueDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ← ӨӨРЧЛӨЛТ: "urgent" статус нэмсэн
const STATUS_MAP = {
  urgent:    { label: "Яаралтай ⚡",      cls: "bg-orange-100 text-orange-700" },
  pending:   { label: "Хүлээгдэж байна", cls: "bg-yellow-100 text-yellow-700" },
  paid:      { label: "Төлөгдсөн ✓",     cls: "bg-green-100 text-green-700"  },
  overdue:   { label: "Хоцорсон ⚠️",     cls: "bg-red-100 text-red-600"      },
  cancelled: { label: "Цуцлагдсан",       cls: "bg-gray-100 text-gray-500"   },
};

// Төлөгдөөгүй статусуудын жагсаалт
const UNPAID_STATUSES = ["urgent", "pending", "overdue"];

function PaymentCard({ payment, onPay, paying, isLandlord }) {
  const status = STATUS_MAP[payment.status] || STATUS_MAP.pending;
  const days = daysUntilDue(payment.dueDate);
  const isOverdue = days < 0;
  const isDueSoon = days >= 0 && days <= 7;

  return (
    <div className={`bg-white rounded-2xl shadow overflow-hidden border-l-4 ${
      payment.status === "paid"    ? "border-green-400"  :
      payment.status === "overdue" ? "border-red-400"    :
      payment.status === "urgent"  ? "border-orange-400" :
      isDueSoon                    ? "border-yellow-400" :
                                     "border-gray-200"
    }`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-bold text-gray-900 text-lg">
              {payment.paymentNumber}-р төлбөр
              {payment.includesDeposit && (
                <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                  Барьцаатай
                </span>
              )}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {formatDate(payment.periodStart)} — {formatDate(payment.periodEnd)}
            </p>
            {!isLandlord && payment.property && (
              <p className="text-sm text-gray-500 mt-0.5">
                🏠 {payment.property.title}
              </p>
            )}
            {isLandlord && payment.tenant && (
              <p className="text-sm text-gray-500 mt-0.5">
                👤 {payment.tenant.firstName} {payment.tenant.lastName}
              </p>
            )}
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${status.cls}`}>
            {status.label}
          </span>
        </div>

        {/* Дүнгийн задаргаа */}
        <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">
              Түрээс ({payment.periodMonths} сар × {formatMoney(payment.property?.monthlyRent)})
            </span>
            <span className="font-medium">{formatMoney(payment.rentAmount)}</span>
          </div>
          {payment.includesDeposit && payment.depositAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Барьцаа мөнгө</span>
              <span className="font-medium text-indigo-600">{formatMoney(payment.depositAmount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-1.5">
            <span className="font-bold text-gray-700">Нийт дүн</span>
            <span className="font-bold text-gray-900 text-base">{formatMoney(payment.totalAmount)}</span>
          </div>
        </div>

        {/* Огноо, сануулга */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Төлөх эцсийн огноо</p>
            <p className={`text-sm font-semibold ${
              payment.status === "paid"    ? "text-green-600"  :
              isOverdue                    ? "text-red-600"    :
              payment.status === "urgent"  ? "text-orange-600" :
              isDueSoon                    ? "text-yellow-600" :
                                             "text-gray-700"
            }`}>
              {payment.status === "paid"
                ? `Төлөгдсөн: ${formatDate(payment.paidAt)}`
                : isOverdue
                  ? `⚠️ ${Math.abs(days)} хоног хоцорсон`
                  : isDueSoon
                    ? `⏰ ${days} хоногт төлөх`
                    : formatDate(payment.dueDate)
              }
            </p>
          </div>

          {/* Төлөх товч — зөвхөн tenant, төлөгдөөгүй */}
          {!isLandlord && UNPAID_STATUSES.includes(payment.status) && (
            <button
              onClick={() => onPay(payment._id)}
              disabled={paying === payment._id}
              className={`text-white px-5 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 ${
                payment.status === "urgent"
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {paying === payment._id ? "Төлж байна..." : "💳 Төлбөр төлөх"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Payment() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showPayModal, setShowPayModal] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isLandlord = currentUser?.role === "landlord";

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const endpoint = isLandlord ? "/api/payments/landlord" : "/api/payments/my";
        const res = await api.get(endpoint);
        setPayments(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadPayments();
  }, [isLandlord]);

  const handlePay = async (paymentId) => {
    setShowPayModal(paymentId);
  };

  const confirmPay = async () => {
    if (!showPayModal) return;
    setPaying(showPayModal);
    try {
      await api.put(`/api/payments/${showPayModal}/pay`, { paymentMethod: "demo" });
      setPayments((prev) =>
        prev.map((p) =>
          p._id === showPayModal
            ? { ...p, status: "paid", paidAt: new Date() }
            : p
        )
      );
      setShowPayModal(null);
    } catch (err) {
      alert(err.response?.data?.message || "Алдаа гарлаа");
    } finally {
      setPaying(null);
    }
  };

  // ← ӨӨРЧЛӨЛТ: "urgent" статусыг "pending" tab-д харуулна
  const filtered = payments.filter((p) => {
    if (filter === "all")     return true;
    if (filter === "pending") return UNPAID_STATUSES.includes(p.status);
    if (filter === "paid")    return p.status === "paid";
    return true;
  });

  // ← ӨӨРЧЛӨЛТ: stat тооцоонд "urgent" оруулсан
  const totalPaid    = payments
    .filter(p => p.status === "paid")
    .reduce((s, p) => s + p.totalAmount, 0);
  const totalPending = payments
    .filter(p => UNPAID_STATUSES.includes(p.status))
    .reduce((s, p) => s + p.totalAmount, 0);
  const overdueCount = payments.filter(p => p.status === "overdue").length;
  const urgentCount  = payments.filter(p => p.status === "urgent").length;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 pb-10">

        <h1 className="text-2xl md:text-3xl font-bold mb-6">
          {isLandlord ? "💰 Орлогын мэдээлэл" : "💳 Төлбөрийн мэдээлэл"}
        </h1>

        {/* Яаралтай төлбөр сануулга */}
        {!isLandlord && urgentCount > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="font-semibold text-orange-700">Яаралтай төлбөр байна!</p>
              <p className="text-sm text-orange-600">
                Эхний төлбөрөө төлснөөр гэрээ идэвхжинэ.
              </p>
            </div>
          </div>
        )}

        {/* Статистик карт */}
        {payments.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow text-center">
              <p className="text-xl font-bold text-green-600">{formatMoney(totalPaid)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {isLandlord ? "Нийт орлого" : "Нийт төлсөн"}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow text-center">
              <p className="text-xl font-bold text-yellow-600">{formatMoney(totalPending)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {isLandlord ? "Хүлээгдэж буй" : "Үлдэгдэл төлбөр"}
              </p>
            </div>
            <div className={`rounded-2xl p-4 shadow text-center col-span-2 md:col-span-1 ${
              overdueCount > 0 ? "bg-red-50" : urgentCount > 0 ? "bg-orange-50" : "bg-white"
            }`}>
              <p className={`text-2xl font-bold ${
                overdueCount > 0 ? "text-red-600" : urgentCount > 0 ? "text-orange-600" : "text-gray-700"
              }`}>
                {overdueCount > 0 ? overdueCount : urgentCount > 0 ? urgentCount : 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {overdueCount > 0 ? "Хоцорсон төлбөр" : urgentCount > 0 ? "Яаралтай төлбөр" : "Хоцорсон төлбөр"}
              </p>
            </div>
          </div>
        )}

        {/* Шүүлтүүр */}
        {payments.length > 0 && (
          <div className="flex gap-2 mb-5">
            {[
              { key: "all",     label: "Бүгд" },
              { key: "pending", label: `Төлөгдөөгүй${payments.filter(p => UNPAID_STATUSES.includes(p.status)).length > 0 ? ` (${payments.filter(p => UNPAID_STATUSES.includes(p.status)).length})` : ""}` },
              { key: "paid",    label: "Төлөгдсөн" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  filter === f.key
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50 shadow"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Жагсаалт */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
            <div className="text-5xl mb-3">💳</div>
            <p className="text-lg font-medium">Төлбөрийн мэдээлэл байхгүй байна</p>
            <p className="text-sm mt-2">Гэрээ баталгаажсаны дараа төлбөрийн хуваарь автоматаар үүснэ</p>
            {!isLandlord && (
              <Link to="/home" className="mt-4 inline-block text-indigo-600 hover:underline text-sm">
                Байр хайх →
              </Link>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
            <p>Энэ шүүлтүүрт тохирох төлбөр байхгүй байна</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((payment) => (
              <PaymentCard
                key={payment._id}
                payment={payment}
                onPay={handlePay}
                paying={paying}
                isLandlord={isLandlord}
              />
            ))}
          </div>
        )}
      </div>

      {/* Төлбөр баталгаажуулах Modal */}
      {showPayModal && (() => {
        const p = payments.find(x => x._id === showPayModal);
        if (!p) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
            <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md p-6">
              <h2 className="text-xl font-bold mb-2">Төлбөр баталгаажуулах</h2>
              <p className="text-gray-500 text-sm mb-5">
                Дараах төлбөрийг төлөхийг баталгаажуулна уу.
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{p.paymentNumber}-р төлбөр</span>
                  <span>{formatDate(p.periodStart)} — {formatDate(p.periodEnd)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Түрээс</span>
                  <span>{formatMoney(p.rentAmount)}</span>
                </div>
                {p.includesDeposit && p.depositAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Барьцаа</span>
                    <span className="text-indigo-600">{formatMoney(p.depositAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 font-bold">
                  <span>Нийт</span>
                  <span className="text-lg">{formatMoney(p.totalAmount)}</span>
                </div>
              </div>

              {/* Demo QR */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-5 text-center">
                <p className="text-xs text-gray-500 mb-2">QPay QR код (Demo)</p>
                <div className="w-32 h-32 bg-white border-2 border-indigo-300 rounded-xl mx-auto flex items-center justify-center">
                  <div className="text-4xl">📱</div>
                </div>
                <p className="text-xs text-indigo-500 mt-2">
                  QPay credentials нэмэгдсэний дараа жинхэнэ QR харагдана
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPayModal(null)}
                  className="flex-1 border border-gray-200 py-3 rounded-xl text-gray-600 hover:bg-gray-50 text-sm transition"
                >
                  Болих
                </button>
                <button
                  onClick={confirmPay}
                  disabled={paying === showPayModal}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-medium transition disabled:opacity-50"
                >
                  {paying === showPayModal ? "Боловсруулж байна..." : "✓ Төлбөр төлсөн"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default Payment;