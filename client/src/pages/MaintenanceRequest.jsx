import { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

const STATUS_MAP = {
  pending:  { label: "Хүлээгдэж байна", cls: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Баталгаажсан ✓",  cls: "bg-green-100 text-green-700"  },
  rejected: { label: "Татгалзсан",       cls: "bg-red-100 text-red-600"      },
};

function MaintenanceRequests() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isLandlord  = currentUser?.role === "landlord";

  const [requests,     setRequests]     = useState([]);
  const [rentals,      setRentals]      = useState([]); // Landlord-ийн идэвхтэй гэрээнүүд
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState("");
  const [images,       setImages]       = useState([]);
  const [imageFiles,   setImageFiles]   = useState([]);

  const [form, setForm] = useState({
    applicationId: "",
    title:         "",
    description:   "",
    amount:        "",
  });

  const fetchRequests = async () => {
    try {
      const endpoint = isLandlord ? "/api/maintenance/landlord" : "/api/maintenance/tenant";
      const res = await api.get(endpoint);
      setRequests(res.data);
    } catch { /* silent */ }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchRequests();
      // Landlord бол идэвхтэй гэрээнүүдийг авах
      if (isLandlord) {
        try {
          const res = await api.get("/api/applications/active");
          setRentals(res.data);
        } catch { /* silent */ }
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
    e.preventDefault();
    setError("");
    if (!form.applicationId) { setError("Гэрээ сонгоно уу"); return; }
    if (Number(form.amount) <= 0) { setError("Суутгах дүн оруулна уу"); return; }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("applicationId", form.applicationId);
      data.append("title",         form.title);
      data.append("description",   form.description);
      data.append("amount",        form.amount);
      imageFiles.forEach((f) => data.append("images", f));

      await api.post("/api/maintenance", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowModal(false);
      setForm({ applicationId: "", title: "", description: "", amount: "" });
      setImageFiles([]); setImages([]);
      await fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Суутгалыг баталгаажуулах уу? Барьцаа мөнгөнөөс суутгагдана.")) return;
    try {
      await api.put(`/api/maintenance/${id}/approve`);
      await fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || "Алдаа гарлаа");
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Татгалзах шалтгаан:");
    if (reason === null) return;
    try {
      await api.put(`/api/maintenance/${id}/reject`, { reason });
      await fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || "Алдаа гарлаа");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 pb-10">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isLandlord ? "🔧 Гэмтлийн суутгал" : "🔧 Засварын хүсэлтүүд"}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isLandlord
                ? "Түрээслэгчээс барьцаа мөнгөнөөс суутгах хүсэлт илгээх"
                : "Барьцаа мөнгөнөөс суутгалын хүсэлтүүд"}
            </p>
          </div>
          {isLandlord && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
            >
              + Суутгал нэмэх
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow p-5 animate-pulse h-28" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-400">
            <div className="text-5xl mb-3">🔧</div>
            <p className="font-medium">Суутгалын хүсэлт байхгүй байна</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const status = STATUS_MAP[req.status] || STATUS_MAP.pending;
              return (
                <div key={req._id} className="bg-white rounded-2xl shadow p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{req.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        🏠 {req.property?.title}
                      </p>
                      {isLandlord ? (
                        <p className="text-sm text-gray-500">
                          👤 {req.tenant?.firstName} {req.tenant?.lastName} · {req.tenant?.phone}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">
                          🏢 {req.landlord?.firstName} {req.landlord?.lastName}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.cls}`}>
                        {status.label}
                      </span>
                      <span className="text-lg font-bold text-red-600">
                        -{req.amount?.toLocaleString()}₮
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mb-3">
                    {req.description}
                  </p>

                  {req.images?.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto">
                      {req.images.map((img, i) => (
                        <img key={i} src={img} alt=""
                          className="w-20 h-16 object-cover rounded-lg flex-shrink-0" />
                      ))}
                    </div>
                  )}

                  {req.status === "approved" && req.deductedFromDeposit && (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-700 mb-3">
                      ✓ Барьцаа мөнгөнөөс суутгагдсан
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      {new Date(req.createdAt).toLocaleDateString("mn-MN")}
                    </p>
                    {isLandlord && req.status === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(req._id)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg transition">
                          ✓ Баталгаажуулах
                        </button>
                        <button onClick={() => handleReject(req._id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg transition">
                          ✕ Татгалзах
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Суутгал нэмэх Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">Гэмтлийн суутгал нэмэх</h2>
              <button onClick={() => { setShowModal(false); setError(""); }}
                className="text-gray-400 text-2xl">×</button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Гэрээ сонгох *
                </label>
                <select
                  value={form.applicationId}
                  onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 bg-white"
                  required
                >
                  <option value="">Гэрээ сонгох...</option>
                  {rentals.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.property?.title} — {r.tenant?.firstName} {r.tenant?.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Гэмтлийн нэр *
                </label>
                <input
                  type="text"
                  placeholder="Жишээ: Угаалтуурын шугам эвдэрсэн"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Дэлгэрэнгүй тайлбар *
                </label>
                <textarea
                  rows={3}
                  placeholder="Гэмтлийн байдал, шалтгааныг дэлгэрэнгүй бичнэ үү..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Суутгах дүн ₮ *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="100,000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Гэмтлийн зураг (заавал биш, max 5)
                </label>
                <label className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-indigo-400 transition">
                  <span className="text-sm text-gray-500">📷 Зураг сонгох</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
                {images.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {images.map((img, i) => (
                      <img key={i} src={img} alt="" className="w-16 h-14 object-cover rounded-lg" />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button"
                  onClick={() => { setShowModal(false); setError(""); }}
                  className="flex-1 border border-gray-200 py-3 rounded-xl text-gray-600 hover:bg-gray-50 text-sm transition">
                  Болих
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-medium transition disabled:opacity-50">
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