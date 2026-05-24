import { useState, useEffect, useMemo, useRef } from "react";
import api from "../api/axiosInstance";
import { useNavigate, Link } from "react-router-dom";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=400&q=70";

function formatMNT(n) {
  return new Intl.NumberFormat("mn-MN").format(n || 0);
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function MaintenanceRequests() {
  const navigate = useNavigate();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "null"),
    []
  );

  const [items, setItems] = useState([]);
  const [activeRentals, setActiveRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const isLandlord = user.role === "landlord" || user.role === "admin";

    let cancelled = false;
    (async () => {
      try {
        const endpoint = isLandlord
          ? "/api/maintenance/landlord"
          : "/api/maintenance/me";
        const calls = [api.get(endpoint)];
        if (isLandlord) {
          calls.push(api.get("/api/applications/landlord"));
        }
        const responses = await Promise.all(calls);
        if (cancelled) return;
        setItems(responses[0].data || []);
        if (isLandlord) {
          const rentals = (responses[1].data || []).filter((a) =>
            ["active", "payment_pending", "signed"].includes(
              a.contractStatus
            )
          );
          setActiveRentals(rentals);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Татаж чадсангүй");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, user]);

  const handleCreate = (newItem) => {
    setItems((prev) => [newItem, ...prev]);
    setCreateOpen(false);
  };

  const stats = useMemo(() => {
    const totalAmount = items.reduce((s, i) => s + (i.amount || 0), 0);
    const propertyIds = new Set(
      items.map((i) => i.property?._id || i.application?.property?._id).filter(Boolean)
    );
    return {
      count: items.length,
      totalAmount,
      properties: propertyIds.size,
    };
  }, [items]);

  const isLandlord = user?.role === "landlord" || user?.role === "admin";

  return (
    <div
      className="min-h-screen pt-20"
      style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-8" style={{ background: "#C9A84C" }} />
          <span
            className="text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "#C9A84C" }}
          >
            Maintenance & Deductions
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
            Засвар,<br />
            <em style={{ color: "#C9A84C", fontStyle: "italic" }}>
              барьцаа суутгал
            </em>
          </h1>

          {isLandlord && activeRentals.length > 0 && (
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-3 px-6 py-4 text-xs font-medium tracking-[0.25em] uppercase transition-all duration-300 group"
              style={{ background: "#C9A84C", color: "#0A0A0A" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#E8D49E")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#C9A84C")
              }
            >
              + Шинэ суутгал бүртгэх
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Stats */}
      {!loading && items.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 lg:px-12 mb-10">
          <div
            className="grid grid-cols-3 gap-3"
            style={{ border: "1px solid rgba(201,168,76,0.15)" }}
          >
            <div
              className="p-6"
              style={{ borderRight: "1px solid rgba(201,168,76,0.08)" }}
            >
              <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-2">
                Нийт бичлэг
              </div>
              <div
                className="font-light leading-none"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 40,
                  color: "#C9A84C",
                }}
              >
                {stats.count}
              </div>
            </div>
            <div
              className="p-6"
              style={{ borderRight: "1px solid rgba(201,168,76,0.08)" }}
            >
              <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-2">
                Нийт суутгал
              </div>
              <div
                className="font-light leading-none"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 26,
                  color: "#EF4444",
                }}
              >
                {formatMNT(stats.totalAmount)}₮
              </div>
            </div>
            {isLandlord && (
              <div className="p-6">
                <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-2">
                  Хамрагдсан байр
                </div>
                <div
                  className="font-light leading-none"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 40,
                    color: "#C9A84C",
                  }}
                >
                  {stats.properties}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {error && (
        <section className="max-w-6xl mx-auto px-6 lg:px-12 mb-6">
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

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 lg:px-12 pb-20">
        {loading ? (
          <LoadingList />
        ) : items.length === 0 ? (
          <EmptyState
            isLandlord={isLandlord}
            hasRentals={activeRentals.length > 0}
            onCreate={() => setCreateOpen(true)}
          />
        ) : (
          <div className="space-y-5">
            {items.map((item) => (
              <MaintenanceItem
                key={item._id}
                item={item}
                isLandlord={isLandlord}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create modal */}
      {createOpen && isLandlord && (
        <CreateModal
          rentals={activeRentals}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreate}
        />
      )}
    </div>
  );
}

function MaintenanceItem({ item, isLandlord }) {
  const property = item.property || item.application?.property || {};
  const tenant = item.tenant || item.application?.tenant || {};
  const landlord = item.landlord || item.application?.landlord || {};
  const cover = property.photos?.[0] || PLACEHOLDER;

  return (
    <article
      className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 transition-all duration-300"
      style={{
        background: "#141414",
        border: "1px solid rgba(201,168,76,0.1)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "rgba(201,168,76,0.1)")
      }
    >
      <Link
        to={property._id ? `/properties/${property._id}` : "#"}
        className="md:col-span-2 block relative overflow-hidden"
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
        />
      </Link>

      <div className="md:col-span-7">
        <div className="text-[10px] tracking-[0.25em] uppercase mb-2">
          <span style={{ color: "#C9A84C" }}>
            {property.district || "—"}
          </span>
          <span className="text-white/30 mx-2">·</span>
          <span className="text-white/40">{formatDate(item.createdAt)}</span>
        </div>
        <h3
          className="font-light text-white leading-tight mb-3"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 22,
          }}
        >
          {property.title || "Байр"}
        </h3>

        {isLandlord && tenant.name && (
          <div className="text-xs text-white/55 mb-3">
            <span className="text-[10px] tracking-[0.25em] uppercase text-white/40 mr-2">
              Түрээслэгч:
            </span>
            {tenant.name}
          </div>
        )}
        {!isLandlord && landlord.name && (
          <div className="text-xs text-white/55 mb-3">
            <span className="text-[10px] tracking-[0.25em] uppercase text-white/40 mr-2">
              Эзэн:
            </span>
            {landlord.name}
          </div>
        )}

        <div
          className="p-3 mb-3"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderLeft: "1px solid rgba(201,168,76,0.3)",
          }}
        >
          <div className="text-[9px] tracking-[0.25em] uppercase text-white/40 mb-1">
            Шалтгаан
          </div>
          <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">
            {item.reason || "—"}
          </p>
        </div>

        {item.photos && item.photos.length > 0 && (
          <div className="flex gap-2">
            {item.photos.slice(0, 5).map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-14 h-14 overflow-hidden"
                style={{ border: "1px solid rgba(201,168,76,0.15)" }}
              >
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
              </a>
            ))}
            {item.photos.length > 5 && (
              <div
                className="w-14 h-14 flex items-center justify-center text-xs"
                style={{
                  border: "1px solid rgba(201,168,76,0.15)",
                  color: "#C9A84C",
                }}
              >
                +{item.photos.length - 5}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="md:col-span-3 flex flex-col items-end justify-between">
        <div className="text-right">
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-2">
            Суутгасан дүн
          </div>
          <div
            className="font-light"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 28,
              color: "#EF4444",
            }}
          >
            −{formatMNT(item.amount)}₮
          </div>
        </div>
        {item.remainingDeposit != null && (
          <div className="text-right text-xs">
            <div className="text-[10px] tracking-[0.25em] uppercase text-white/40">
              Үлдэгдэл барьцаа
            </div>
            <div style={{ color: "#C9A84C" }}>
              {formatMNT(item.remainingDeposit)}₮
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function CreateModal({ rentals, onClose, onCreated }) {
  const [rentalId, setRentalId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const selected = rentals.find((r) => r._id === rentalId);
  const remainingDeposit = selected?.remainingDeposit;
  const monthlyRent = selected?.property?.price || 0;
  const depositTotal =
    selected?.depositPaid || selected?.depositAmount || monthlyRent;

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    const newOnes = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newOnes]);
    e.target.value = "";
  };

  const removePhoto = (idx) => {
    setPhotos((prev) => {
      const removed = prev[idx];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  useEffect(() => {
    return () => {
      photos.forEach((p) => p.preview && URL.revokeObjectURL(p.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!rentalId || !amount || !reason.trim()) {
      setError("Бүх шаардлагатай талбарыг бөглөнө үү");
      return;
    }
    const amt = Number(amount);
    if (amt <= 0) {
      setError("Дүн эерэг тоо байх ёстой");
      return;
    }
    if (remainingDeposit != null && amt > remainingDeposit) {
      setError(
        `Дүн үлдэгдэл барьцаанаас (${formatMNT(remainingDeposit)}₮) хэтэрсэн байна`
      );
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("applicationId", rentalId);
      fd.append("amount", amt);
      fd.append("reason", reason.trim());
      photos.forEach((p) => fd.append("photos", p.file));

      const res = await api.post("/api/maintenance", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Илгээж чадсангүй");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fadeIn overflow-y-auto"
      style={{ background: "rgba(5,5,5,0.9)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl relative animate-fadeUp my-8"
        style={{
          background: "#141414",
          border: "1px solid rgba(201,168,76,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          ✕
        </button>

        <form onSubmit={handleSubmit} className="p-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8" style={{ background: "#C9A84C" }} />
            <span
              className="text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "#C9A84C" }}
            >
              New Deduction
            </span>
          </div>
          <h2
            className="font-light text-white mb-6 leading-tight"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 32,
            }}
          >
            Суутгал<br />
            <em style={{ color: "#C9A84C", fontStyle: "italic" }}>
              бүртгэх
            </em>
          </h2>

          {error && (
            <div
              className="mb-6 p-3 text-xs text-red-300"
              style={{
                background: "rgba(239,68,68,0.08)",
                borderLeft: "2px solid #EF4444",
              }}
            >
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3">
              Идэвхтэй гэрээ <span style={{ color: "#C9A84C" }}>*</span>
            </label>
            <select
              value={rentalId}
              onChange={(e) => setRentalId(e.target.value)}
              required
              className="w-full bg-transparent text-white text-sm py-3 outline-none"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.15)",
                colorScheme: "dark",
              }}
            >
              <option value="" style={{ background: "#141414" }}>
                Сонгоно уу
              </option>
              {rentals.map((r) => (
                <option
                  key={r._id}
                  value={r._id}
                  style={{ background: "#141414" }}
                >
                  {r.property?.title || "Байр"} — {r.tenant?.name || "Түрээслэгч"}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div
              className="mb-6 p-4 grid grid-cols-2 gap-4"
              style={{
                background: "rgba(201,168,76,0.06)",
                borderLeft: "2px solid #C9A84C",
              }}
            >
              <div>
                <div className="text-[9px] tracking-[0.25em] uppercase text-white/40 mb-1">
                  Нийт барьцаа
                </div>
                <div
                  className="font-light"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 20,
                    color: "#C9A84C",
                  }}
                >
                  {formatMNT(depositTotal)}₮
                </div>
              </div>
              {remainingDeposit != null && (
                <div>
                  <div className="text-[9px] tracking-[0.25em] uppercase text-white/40 mb-1">
                    Үлдэгдэл
                  </div>
                  <div
                    className="font-light"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 20,
                      color:
                        remainingDeposit > 0 ? "#10B981" : "#EF4444",
                    }}
                  >
                    {formatMNT(remainingDeposit)}₮
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3">
              Суутгах дүн (₮) <span style={{ color: "#C9A84C" }}>*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="150000"
              min="0"
              required
              className="w-full bg-transparent text-white text-sm py-3 outline-none transition-colors"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}
              onFocus={(e) =>
                (e.target.style.borderBottomColor = "#C9A84C")
              }
              onBlur={(e) =>
                (e.target.style.borderBottomColor =
                  "rgba(255,255,255,0.15)")
              }
            />
            {amount && Number(amount) > 0 && (
              <p
                className="mt-2 text-xs"
                style={{ color: "#C9A84C" }}
              >
                {formatMNT(amount)}₮
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3">
              Шалтгаан <span style={{ color: "#C9A84C" }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Жнэ: Цонхны хагаралтай шил, шалны паркетны эвдрэл..."
              rows={4}
              required
              className="w-full bg-transparent text-white text-sm py-3 px-4 outline-none resize-none transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.15)" }}
              onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.15)")
              }
            />
          </div>

          <div className="mb-6">
            <label className="block text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3">
              Зураг (заавал биш)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />
            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {photos.map((p, i) => (
                  <div
                    key={i}
                    className="relative aspect-square group"
                    style={{ border: "1px solid rgba(201,168,76,0.2)" }}
                  >
                    <img
                      src={p.preview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: "rgba(10,10,10,0.85)",
                        border: "1px solid rgba(239,68,68,0.5)",
                        color: "#EF4444",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 text-[10px] tracking-[0.25em] uppercase transition-all duration-300"
              style={{
                border: "1px dashed rgba(201,168,76,0.4)",
                color: "#C9A84C",
                background: "rgba(201,168,76,0.02)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(201,168,76,0.06)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(201,168,76,0.02)")
              }
            >
              + Зураг нэмэх
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-[10px] tracking-[0.25em] uppercase text-white/60 hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}
            >
              Болих
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 text-[10px] tracking-[0.25em] uppercase transition-all duration-300 disabled:opacity-50"
              style={{ background: "#C9A84C", color: "#0A0A0A" }}
              onMouseEnter={(e) =>
                !submitting &&
                (e.currentTarget.style.background = "#E8D49E")
              }
              onMouseLeave={(e) =>
                !submitting &&
                (e.currentTarget.style.background = "#C9A84C")
              }
            >
              {submitting ? "Илгээж байна..." : "Бүртгэх →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoadingList() {
  return (
    <div className="space-y-5">
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 animate-pulse"
          style={{
            background: "#141414",
            border: "1px solid rgba(201,168,76,0.06)",
          }}
        >
          <div
            className="md:col-span-2 aspect-[4/3]"
            style={{ background: "rgba(255,255,255,0.03)" }}
          />
          <div className="md:col-span-7 space-y-3">
            <div
              className="h-3 w-24"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
            <div
              className="h-5 w-3/4"
              style={{ background: "rgba(255,255,255,0.08)" }}
            />
            <div
              className="h-12 w-full"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
          </div>
          <div className="md:col-span-3 space-y-2">
            <div
              className="h-7 w-32 ml-auto"
              style={{ background: "rgba(239,68,68,0.15)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ isLandlord, hasRentals, onCreate }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-24 px-6"
      style={{
        border: "1px solid rgba(201,168,76,0.15)",
        background: "rgba(201,168,76,0.02)",
      }}
    >
      <div
        className="w-16 h-16 mb-8 flex items-center justify-center"
        style={{ border: "1px solid #C9A84C" }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            background: "#C9A84C",
            transform: "rotate(45deg)",
          }}
        />
      </div>
      <h3
        className="font-light text-white mb-4"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 32,
        }}
      >
        Суутгал <em style={{ color: "#C9A84C", fontStyle: "italic" }}>алга</em>
      </h3>
      <p className="text-sm text-white/50 max-w-md mb-8 leading-relaxed">
        {isLandlord
          ? hasRentals
            ? "Танд идэвхтэй түрээслэгчид байна. Шаардлагатай үед суутгал бүртгэх боломжтой."
            : "Идэвхтэй гэрээ байхгүй тул суутгал хийх боломжгүй."
          : "Танай барьцаанаас одоогоор юу ч суутгагдаагүй байна."}
      </p>
      {isLandlord && hasRentals && (
        <button
          onClick={onCreate}
          className="inline-block px-8 py-3 text-[10px] tracking-[0.3em] uppercase transition-all duration-300"
          style={{ background: "#C9A84C", color: "#0A0A0A" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#E8D49E")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#C9A84C")}
        >
          + Шинэ суутгал →
        </button>
      )}
    </div>
  );
}

export default MaintenanceRequests;