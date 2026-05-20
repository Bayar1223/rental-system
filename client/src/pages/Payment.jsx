import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" });
}

function formatMoney(amount) {
  if (!amount) return "0₮";
  return `${Number(amount).toLocaleString()}₮`;
}

function daysUntilDue(dueDate) {
  return Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
}

const UNPAID_STATUSES = ["urgent", "pending", "overdue"];

const STATUS_CONFIG = {
  urgent:  { label: "Яаралтай ⚡", color: "#f97316", bg: "#fff7ed" },
  pending: { label: "Хүлээгдэж байна", color: "var(--gold)", bg: "#fffbeb" },
  paid:    { label: "Төлөгдсөн ✓", color: "#22c55e", bg: "#f0fdf4" },
  overdue: { label: "Хоцорсон ⚠️", color: "#ef4444", bg: "#fef2f2" },
  cancelled: { label: "Цуцлагдсан", color: "var(--text-soft)", bg: "var(--surface)" },
};

function PaymentCard({ payment, onPay, paying, isLandlord }) {
  const status = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
  const days = daysUntilDue(payment.dueDate);
  const isOverdue = days < 0;

  return (
    <div className="bg-white border border-[var(--border-subtle)] overflow-hidden animate-fadeUp">
      <div className="flex">
        <div className="w-1 flex-shrink-0" style={{ background: status.color }} />
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-xl font-light text-[var(--ink)]">{payment.paymentNumber}-р төлбөр</h3>
                {payment.includesDeposit && (
                  <span className="text-xs px-2 py-0.5 border" style={{ color: "var(--gold)", borderColor: "var(--gold)" }}>Барьцаатай</span>
                )}
              </div>
              <p className="text-xs text-[var(--text-soft)]">{formatDate(payment.periodStart)} — {formatDate(payment.periodEnd)}</p>
              {!isLandlord && payment.property && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">🏠 {payment.property.title}</p>
              )}
              {isLandlord && payment.tenant && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">👤 {payment.tenant.firstName} {payment.tenant.lastName}</p>
              )}
            </div>
            <span className="text-xs font-medium px-3 py-1 border flex-shrink-0" style={{ color: status.color, borderColor: status.color }}>
              {status.label}
            </span>
          </div>

          <div className="h-px mb-4" style={{ background: "var(--border-subtle)" }} />

          {/* Amount breakdown */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-soft)]">Түрээс ({payment.periodMonths} сар × {formatMoney(payment.property?.monthlyRent)})</span>
              <span className="text-[var(--ink)]">{formatMoney(payment.rentAmount)}</span>
            </div>
            {payment.includesDeposit && payment.depositAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-soft)]">Барьцаа мөнгө</span>
                <span style={{ color: "var(--gold)" }}>{formatMoney(payment.depositAmount)}</span>
              </div>
            )}
            <div className="h-px" style={{ background: "var(--border-subtle)" }} />
            <div className="flex justify-between">
              <span className="text-sm font-medium text-[var(--ink)]">Нийт дүн</span>
              <span className="font-display text-2xl font-light text-[var(--ink)]">{formatMoney(payment.totalAmount)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--text-soft)] mb-0.5">Төлөх эцсийн огноо</p>
              <p className="text-sm font-medium" style={{ color: payment.status === "paid" ? "#22c55e" : isOverdue ? "#ef4444" : "var(--ink)" }}>
                {payment.status === "paid"
                  ? `Төлөгдсөн: ${formatDate(payment.paidAt)}`
                  : isOverdue ? `⚠️ ${Math.abs(days)} хоног хоцорсон`
                  : formatDate(payment.dueDate)}
              </p>
            </div>
            {!isLandlord && UNPAID_STATUSES.includes(payment.status) && (
              <button onClick={() => onPay(payment._id)} disabled={paying === payment._id}
                className="btn-gold text-xs" style={{ padding: "10px 20px", background: payment.status === "urgent" ? "#f97316" : "var(--gold)" }}>
                {paying === payment._id ? "Төлж байна..." : "💳 Төлбөр төлөх"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Payment() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showPayModal, setShowPayModal] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isLandlord = currentUser?.role === "landlord";

  useEffect(() => {
    const endpoint = isLandlord ? "/api/payments/landlord" : "/api/payments/my";
    api.get(endpoint).then(r => setPayments(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [isLandlord]);

  const handlePay = (paymentId) => setShowPayModal(paymentId);

  const confirmPay = async () => {
    if (!showPayModal) return;
    setPaying(showPayModal);
    try {
      await api.put(`/api/payments/${showPayModal}/pay`, { paymentMethod: "demo" });
      setPayments(prev => prev.map(p => p._id === showPayModal ? { ...p, status: "paid", paidAt: new Date() } : p));
      setShowPayModal(null);
    } catch (err) { alert(err.response?.data?.message || "Алдаа гарлаа"); }
    finally { setPaying(null); }
  };

  const filtered = payments.filter(p => {
    if (filter === "all") return true;
    if (filter === "pending") return UNPAID_STATUSES.includes(p.status);
    if (filter === "paid") return p.status === "paid";
    return true;
  });

  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.totalAmount, 0);
  const totalPending = payments.filter(p => UNPAID_STATUSES.includes(p.status)).reduce((s, p) => s + p.totalAmount, 0);
  const urgentCount = payments.filter(p => p.status === "urgent").length;
  const overdueCount = payments.filter(p => p.status === "overdue").length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingTop: 64 }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-2">{isLandlord ? "Орлого" : "Миний"}</p>
          <h1 className="font-display text-4xl font-light text-[var(--ink)]">
            {isLandlord ? "Орлогын мэдээлэл" : "Төлбөрийн мэдээлэл"}
          </h1>
        </div>

        {/* Urgent warning */}
        {!isLandlord && urgentCount > 0 && (
          <div className="border-l-4 border-orange-400 bg-orange-50 p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="font-medium text-orange-700 text-sm">Яаралтай төлбөр байна!</p>
              <p className="text-xs text-orange-600">Эхний төлбөрөө төлснөөр гэрээ идэвхжинэ.</p>
            </div>
          </div>
        )}

        {/* Stats */}
        {payments.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: isLandlord ? "Нийт орлого" : "Нийт төлсөн", value: formatMoney(totalPaid), color: "#22c55e" },
              { label: isLandlord ? "Хүлээгдэж буй" : "Үлдэгдэл", value: formatMoney(totalPending), color: "var(--gold)" },
              { label: overdueCount > 0 ? "Хоцорсон" : "Яаралтай", value: overdueCount > 0 ? overdueCount : urgentCount, color: overdueCount > 0 ? "#ef4444" : "#f97316" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white border border-[var(--border-subtle)] p-5 text-center">
                <p className="font-display text-2xl font-light mb-1" style={{ color }}>{value}</p>
                <p className="text-xs tracking-wide text-[var(--text-soft)] uppercase">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        {payments.length > 0 && (
          <div className="flex gap-0 mb-6 border border-[var(--border-subtle)] w-fit">
            {[
              { key: "all", label: "Бүгд" },
              { key: "pending", label: `Төлөгдөөгүй${payments.filter(p => UNPAID_STATUSES.includes(p.status)).length > 0 ? ` (${payments.filter(p => UNPAID_STATUSES.includes(p.status)).length})` : ""}` },
              { key: "paid", label: "Төлөгдсөн" },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className="px-5 py-2.5 text-xs font-medium tracking-widest uppercase transition-all"
                style={{
                  background: filter === f.key ? "var(--ink)" : "transparent",
                  color: filter === f.key ? "white" : "var(--text-muted)",
                }}>
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Payment list */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="bg-white border border-[var(--border-subtle)] p-6 animate-pulse h-36" />)}
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white border border-[var(--border-subtle)] p-16 text-center">
            <div className="text-4xl mb-4 opacity-30">💳</div>
            <p className="font-display text-2xl font-light text-[var(--text-soft)] mb-2">Төлбөр байхгүй</p>
            <p className="text-sm text-[var(--text-soft)]">Гэрээ баталгаажсаны дараа төлбөрийн хуваарь автоматаар үүснэ</p>
            {!isLandlord && (
              <Link to="/home" className="btn-gold mt-6 inline-flex" style={{ padding: "12px 28px" }}>Байр хайх →</Link>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-[var(--border-subtle)] p-8 text-center">
            <p className="text-[var(--text-soft)] text-sm">Энэ шүүлтүүрт тохирох төлбөр байхгүй</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(payment => (
              <PaymentCard key={payment._id} payment={payment} onPay={handlePay} paying={paying} isLandlord={isLandlord} />
            ))}
          </div>
        )}
      </div>

      {/* Pay modal */}
      {showPayModal && (() => {
        const p = payments.find(x => x._id === showPayModal);
        if (!p) return null;
        return (
          <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
            <div className="bg-white w-full md:max-w-md p-8">
              <div className="mb-6">
                <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-1">Баталгаажуулах</p>
                <h2 className="font-display text-2xl font-light text-[var(--ink)]">Төлбөр төлөх</h2>
              </div>

              <div className="border border-[var(--border-subtle)] p-5 mb-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-soft)]">{p.paymentNumber}-р төлбөр</span>
                  <span className="text-[var(--text-muted)]">{formatDate(p.periodStart)} — {formatDate(p.periodEnd)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-soft)]">Түрээс</span>
                  <span>{formatMoney(p.rentAmount)}</span>
                </div>
                {p.includesDeposit && p.depositAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-soft)]">Барьцаа</span>
                    <span style={{ color: "var(--gold)" }}>{formatMoney(p.depositAmount)}</span>
                  </div>
                )}
                <div className="h-px" style={{ background: "var(--border-subtle)" }} />
                <div className="flex justify-between">
                  <span className="font-medium text-[var(--ink)]">Нийт</span>
                  <span className="font-display text-2xl font-light text-[var(--ink)]">{formatMoney(p.totalAmount)}</span>
                </div>
              </div>

              {/* Demo QPay */}
              <div className="border border-[var(--border-subtle)] p-5 mb-6 text-center">
                <p className="text-xs tracking-widest uppercase text-[var(--text-soft)] mb-3">QPay QR код (Demo)</p>
                <div className="w-28 h-28 border border-[var(--border-subtle)] mx-auto flex items-center justify-center text-4xl">📱</div>
                <p className="text-xs text-[var(--text-soft)] mt-2">QPay credentials нэмэгдсэний дараа жинхэнэ QR харагдана</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowPayModal(null)} className="btn-ghost flex-1">Болих</button>
                <button onClick={confirmPay} disabled={paying === showPayModal} className="btn-gold flex-1 justify-center" style={{ padding: "14px 0" }}>
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