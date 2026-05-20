import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

const statusMap = {
  pending:  { label: "Хүлээгдэж байна", color: "var(--gold)" },
  approved: { label: "Зөвшөөрөгдсөн",   color: "#22c55e" },
  rejected: { label: "Татгалзсан",       color: "#ef4444" },
};

const RENTED_CONTRACT_STATUSES = ["signed", "payment_pending", "active"];

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/applications/my")
      .then(r => setApplications(r.data))
      .catch(console.log)
      .finally(() => setLoading(false));
  }, []);

  const visibleApps = applications.filter(app => {
    if (app.status === "rejected" || app.status === "cancelled") return true;
    if (app.status === "pending") return true;
    if (app.status === "approved" && RENTED_CONTRACT_STATUSES.includes(app.contractStatus)) return false;
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingTop: 64 }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-2">Миний</p>
          <h1 className="font-display text-4xl font-light text-[var(--ink)]">Хүсэлтүүд</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white border border-[var(--border-subtle)] p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-28 h-20 bg-gray-100" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-100 w-1/2" />
                    <div className="h-3 bg-gray-100 w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : visibleApps.length === 0 ? (
          <div className="bg-white border border-[var(--border-subtle)] p-16 text-center">
            <div className="text-4xl mb-4 opacity-30">📋</div>
            <p className="font-display text-2xl font-light text-[var(--text-soft)] mb-2">Хүсэлт байхгүй</p>
            <p className="text-sm text-[var(--text-soft)] mb-6">Байрны хуудаснаас хүсэлт илгээж эхлээрэй</p>
            {applications.some(a => RENTED_CONTRACT_STATUSES.includes(a.contractStatus)) && (
              <p className="text-sm text-[var(--text-muted)]">
                ✓ Түрээслэсэн байр{" "}
                <Link to="/my-rentals" className="underline" style={{ color: "var(--gold)" }}>Миний түрээс</Link>
                {" "}хэсэгт байна
              </p>
            )}
            <Link to="/home" className="btn-gold mt-6 inline-flex" style={{ padding: "12px 28px" }}>Байр хайх →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleApps.map((app) => {
              const status = statusMap[app.status] || statusMap.pending;
              const image = app.property?.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";
              const needsSignature = app.status === "approved" && (app.contractStatus === "pending_signatures" || app.contractStatus === "none");

              return (
                <div key={app._id} className="bg-white border border-[var(--border-subtle)] overflow-hidden animate-fadeUp">
                  <div className="flex gap-0">
                    {/* Left gold accent */}
                    <div className="w-1 flex-shrink-0" style={{ background: status.color }} />

                    <div className="flex gap-5 p-6 flex-1">
                      <img src={image} alt="" className="w-28 h-20 object-cover flex-shrink-0" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h2 className="font-display text-xl font-light text-[var(--ink)] line-clamp-1">{app.property?.title}</h2>
                            <p className="text-xs text-[var(--text-soft)] mt-0.5">{app.property?.location?.city}, {app.property?.location?.district}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs font-medium px-3 py-1 border" style={{ color: status.color, borderColor: status.color }}>
                              {status.label}
                            </span>
                            {needsSignature && (
                              <span className="text-xs px-2 py-0.5" style={{ color: "var(--gold)", border: "1px solid var(--gold)" }}>
                                ✍️ Гарын үсэг хүлээгдэж байна
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="h-px mb-3" style={{ background: "var(--border-subtle)" }} />

                        <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)] mb-4">
                          <span>📅 {app.leaseMonths} сар</span>
                          <span className="font-display text-base text-[var(--ink)]">{app.property?.monthlyRent?.toLocaleString()}₮<span className="text-xs text-[var(--text-soft)]">/сар</span></span>
                          <span>💰 Нийт: {app.totalRent?.toLocaleString()}₮</span>
                          {app.landlord && <span>🏠 {app.landlord.firstName} · {app.landlord.phone}</span>}
                        </div>

                        {app.message && (
                          <p className="text-xs text-[var(--text-soft)] border-l-2 border-[var(--gold-light)] pl-3 mb-4 italic">"{app.message}"</p>
                        )}

                        <div className="flex gap-3">
                          <Link to={`/properties/${app.property?._id}`} className="btn-ghost text-xs" style={{ padding: "8px 16px" }}>
                            Байр харах
                          </Link>
                          {app.status === "approved" && (
                            <Link to={`/contract/${app._id}`} className="btn-gold text-xs" style={{ padding: "8px 16px" }}>
                              📄 Гэрээ харах
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}