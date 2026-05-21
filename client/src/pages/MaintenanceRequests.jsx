import { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

const STATUS_MAP = {
  pending:  { label: "Хүлээгдэж байна", color: "#D97706", bg: "#FFFBEB" },
  approved: { label: "Баталгаажсан",     color: "#16A34A", bg: "#F0FDF4" },
  rejected: { label: "Татгалзсан",       color: "#EF4444", bg: "#FEF2F2" },
};

function MaintenanceRequests() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isLandlord  = currentUser?.role === "landlord";

  const [requests,   setRequests]   = useState([]);
  const [rentals,    setRentals]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [images,     setImages]     = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  const [form, setForm] = useState({ applicationId: "", title: "", description: "", amount: "" });

  const fetchRequests = async () => {
    try {
      const endpoint = isLandlord ? "/api/maintenance/landlord" : "/api/maintenance/tenant";
      const res = await api.get(endpoint);
      setRequests(res.data);
    // eslint-disable-next-line no-empty
    } catch {}
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchRequests();
      if (isLandlord) {
        try {
          const res = await api.get("/api/applications/active");
          setRentals(res.data);
        // eslint-disable-next-line no-empty
        } catch {}
      }
      setLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLandlord]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImageFiles(files);
    setImages(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (!form.applicationId) { setError("Гэрээ сонгоно уу"); return; }
    if (Number(form.amount) <= 0) { setError("Суутгах дүн оруулна уу"); return; }
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("applicationId", form.applicationId);
      data.append("title", form.title);
      data.append("description", form.description);
      data.append("amount", form.amount);
      imageFiles.forEach((f) => data.append("images", f));
      await api.post("/api/maintenance", data, { headers: { "Content-Type": "multipart/form-data" } });
      setShowModal(false);
      setForm({ applicationId: "", title: "", description: "", amount: "" });
      setImageFiles([]); setImages([]);
      await fetchRequests();
    } catch (err) { setError(err.response?.data?.message || "Алдаа гарлаа"); }
    finally { setSubmitting(false); }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Суутгалыг баталгаажуулах уу? Барьцаа мөнгөнөөс суутгагдана.")) return;
    try { await api.put(`/api/maintenance/${id}/approve`); await fetchRequests(); }
    catch (err) { alert(err.response?.data?.message || "Алдаа гарлаа"); }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Татгалзах шалтгаан:");
    if (reason === null) return;
    try { await api.put(`/api/maintenance/${id}/reject`, { reason }); await fetchRequests(); }
    catch (err) { alert(err.response?.data?.message || "Алдаа гарлаа"); }
  };

  const inputCls = "luxury-input w-full";
  const labelCls = "block text-xs tracking-widest uppercase mb-2";

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingTop: 64 }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>
              {isLandlord ? "Барьцаа суутгал" : "Засварын хүсэлт"}
            </p>
            <h1 className="font-display text-4xl font-light" style={{ color: "var(--ink)" }}>
              {isLandlord ? "Гэмтлийн суутгал" : "Засварын хүсэлтүүд"}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {isLandlord ? "Түрээслэгчээс барьцаа мөнгөнөөс суутгах хүсэлт илгээх" : "Барьцаа мөнгөнөөс суутгалын хүсэлтүүд"}
            </p>
          </div>
          {isLandlord && (
            <button onClick={() => setShowModal(true)} className="btn-gold text-xs" style={{ padding: "10px 20px" }}>
              + Суутгал нэмэх
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
              style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 bg-white border" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="font-display text-2xl font-light mb-2" style={{ color: "var(--ink)" }}>Суутгалын хүсэлт байхгүй байна</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const status = STATUS_MAP[req.status] || STATUS_MAP.pending;
              return (
                <div key={req._id} className="bg-white border overflow-hidden" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="flex">
                    <div className="w-1 flex-shrink-0" style={{ background: status.color }} />
                    <div className="p-5 flex-1">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-medium text-sm mb-1" style={{ color: "var(--ink)" }}>{req.title}</h3>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{req.property?.title}</p>
                          {isLandlord ? (
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-soft)" }}>
                              {req.tenant?.firstName} {req.tenant?.lastName} · {req.tenant?.phone}
                            </p>
                          ) : (
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-soft)" }}>
                              {req.landlord?.firstName} {req.landlord?.lastName}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-xs px-3 py-1 font-medium" style={{ background: status.bg, color: status.color }}>
                            {status.label}
                          </span>
                          <span className="font-display text-lg font-light" style={{ color: "#EF4444" }}>
                            -{req.amount?.toLocaleString()}₮
                          </span>
                        </div>
                      </div>

                      <p className="text-sm leading-6 p-3 mb-3" style={{ background: "var(--cream)", color: "var(--text-muted)" }}>
                        {req.description}
                      </p>

                      {req.images?.length > 0 && (
                        <div className="flex gap-2 mb-3 overflow-x-auto">
                          {req.images.map((img, i) => (
                            <img key={i} src={img} alt="" className="w-20 h-16 object-cover flex-shrink-0" />
                          ))}
                        </div>
                      )}

                      {req.status === "approved" && req.deductedFromDeposit && (
                        <div className="mb-3 p-3 border-l-2 text-xs" style={{ borderColor: "#16A34A", background: "#F0FDF4", color: "#16A34A" }}>
                          Барьцаа мөнгөнөөс суутгагдсан
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <p className="text-xs" style={{ color: "var(--text-soft)" }}>
                          {new Date(req.createdAt).toLocaleDateString("mn-MN")}
                        </p>
                        {isLandlord && req.status === "pending" && (
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(req._id)}
                              className="btn-gold text-xs" style={{ padding: "6px 14px" }}>Баталгаажуулах</button>
                            <button onClick={() => handleReject(req._id)}
                              className="text-xs px-4 py-1.5 border transition-colors"
                              style={{ borderColor: "#FCA5A5", color: "#EF4444" }}>Татгалзах</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setError(""); } }}>
          <div className="bg-white w-full md:max-w-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--gold)" }}>Шинэ</p>
                <h2 className="font-display text-2xl font-light" style={{ color: "var(--ink)" }}>Гэмтлийн суутгал нэмэх</h2>
              </div>
              <button onClick={() => { setShowModal(false); setError(""); }} className="text-2xl" style={{ color: "var(--text-soft)" }}>x</button>
            </div>

            {error && (
              <div className="mb-4 p-3 border-l-2 text-sm" style={{ borderColor: "#EF4444", background: "#FEF2F2", color: "#EF4444" }}>{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Гэрээ сонгох *</label>
                <select value={form.applicationId} onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
                  className="luxury-select w-full" required>
                  <option value="">Гэрээ сонгох...</option>
                  {rentals.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.property?.title} — {r.tenant?.firstName} {r.tenant?.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Гэмтлийн нэр *</label>
                <input type="text" className={inputCls} placeholder="Жишээ: Угаалтуурын шугам эвдэрсэн"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Дэлгэрэнгүй тайлбар *</label>
                <textarea rows={3} className="luxury-input w-full resize-none"
                  placeholder="Гэмтлийн байдал, шалтгааныг дэлгэрэнгүй бичнэ үү..."
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Суутгах дүн ₮ *</label>
                <input type="number" inputMode="numeric" className={inputCls} placeholder="100,000"
                  value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="1" />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Гэмтлийн зураг (заавал биш, max 5)</label>
                <label className="block border-2 border-dashed p-4 text-center cursor-pointer"
                  style={{ borderColor: "var(--gold-light)", background: "var(--cream)" }}>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Зураг сонгох</p>
                </label>
                {images.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {images.map((img, i) => (
                      <img key={i} src={img} alt="" className="w-16 h-14 object-cover" />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(""); }} className="btn-ghost flex-1">Болих</button>
                <button type="submit" disabled={submitting} className="btn-gold flex-1 justify-center" style={{ padding: "14px 0" }}>
                  {submitting ? "Илгээж байна..." : "Суутгал илгээх"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaintenanceRequests;