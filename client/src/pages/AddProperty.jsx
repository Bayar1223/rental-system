import { useState, useEffect, useRef } from "react";
import api from "../api/axiosInstance";
import { useNavigate, Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DISTRICTS = [
  "Хан-Уул", "Сүхбаатар", "Чингэлтэй", "Баянзүрх",
  "Сонгинохайрхан", "Баянгол", "Налайх", "Багануур", "Багахангай",
];

const PROPERTY_TYPES = [
  { value: "apartment", label: "Орон сууц" },
  { value: "house",     label: "Хувийн байшин" },
  { value: "studio",    label: "Студи" },
  { value: "room",      label: "Өрөө" },
];

const UB_CENTER = [47.9184, 106.9177];

const goldDiamondIcon = L.divIcon({
  className: "rentalsy-marker",
  html: `<div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;inset:5px;background:#C9A84C;transform:rotate(45deg);box-shadow:0 4px 14px rgba(201,168,76,0.7),0 0 0 2px #0A0A0A;"></div>
    <div style="position:absolute;width:7px;height:7px;background:#0A0A0A;transform:rotate(45deg);"></div>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) { onPick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

function AddProperty() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // ── Үндсэн мэдээлэл ──
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [propertyType, setPropertyType] = useState("apartment");

  // ── Хаяг ──
  const [city, setCity]         = useState("Улаанбаатар");
  const [district, setDistrict] = useState("");
  const [address, setAddress]   = useState("");

  // ── Үнэ & нөхцөл ──
  const [monthlyRent, setMonthlyRent]                   = useState("");
  const [depositAmount, setDepositAmount]               = useState("");
  const [minLeaseMonths, setMinLeaseMonths]             = useState("6");
  const [paymentConditionText, setPaymentConditionText] = useState("");

  // ── Үндсэн үзүүлэлт ──
  const [rooms, setRooms]             = useState("");
  const [area, setArea]               = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [builtYear, setBuiltYear]     = useState("");

  // ── Дэлгэрэнгүй ──
  const [balconyCount, setBalconyCount]   = useState("0");
  const [windowCount, setWindowCount]     = useState("");
  const [windowType, setWindowType]       = useState("");
  const [floorMaterial, setFloorMaterial] = useState("");
  const [doorType, setDoorType]           = useState("");

  // ── Үйлчилгээ ──
  const [hasGarage, setHasGarage]                 = useState(false);
  const [garageInfo, setGarageInfo]               = useState("");
  const [isFurnished, setIsFurnished]             = useState(false);
  const [hasOutdoorParking, setHasOutdoorParking] = useState(false);

  // ── Холбоо барих (заавал биш) ──
  const [contactName, setContactName]   = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // ── Зураг & байршил ──
  const [photos, setPhotos]     = useState([]); // Array<{file, preview}>
  const [position, setPosition] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const fileInputRef = useRef(null);

  // ── Role guard ──
  useEffect(() => {
    if (!user) navigate("/login");
    else if (user.role !== "landlord") navigate("/home");
  }, [user, navigate]);

  // ── Cleanup object URLs ──
  useEffect(() => {
    return () => {
      photos.forEach((p) => p.preview && URL.revokeObjectURL(p.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const valid = files.filter((f) => f.type.startsWith("image/"));
    const newOnes = valid.map((file) => ({
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // ── Validation ──
    if (!title.trim() || !description.trim() || !district || !address.trim() || !monthlyRent || !rooms || !area) {
      setError("Бүх шаардлагатай талбарыг бөглөнө үү");
      return;
    }
    if (!position) {
      setError("Газрын зурган дээр байршлаа сонгоно уу");
      return;
    }
    if (Number(monthlyRent) <= 0 || Number(rooms) <= 0 || Number(area) <= 0) {
      setError("Үнэ, өрөө, талбай эерэг тоо байх ёстой");
      return;
    }
    if (photos.length === 0) {
      setError("Хамгийн багадаа 1 зураг оруулна уу");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();

      // Үндсэн
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("propertyType", propertyType);

      // Хаяг — server location[city] хэлбэрээр хүлээж авна
      fd.append("location[city]",     city || "Улаанбаатар");
      fd.append("location[district]", district);
      fd.append("location[address]",  address.trim());

      // Координат
      fd.append("latitude",  position[0]);
      fd.append("longitude", position[1]);

      // Үнэ
      fd.append("monthlyRent",          monthlyRent);
      fd.append("depositAmount",        depositAmount || "0");
      fd.append("minLeaseMonths",       minLeaseMonths || "6");
      fd.append("paymentConditionText", paymentConditionText.trim());

      // Үндсэн үзүүлэлт
      fd.append("rooms", rooms);
      fd.append("area",  area);
      if (floorNumber) fd.append("floorNumber", floorNumber);
      if (totalFloors) fd.append("totalFloors", totalFloors);
      if (builtYear)   fd.append("builtYear",   builtYear);

      // Дэлгэрэнгүй
      fd.append("balconyCount", balconyCount || "0");
      if (windowCount) fd.append("windowCount", windowCount);
      fd.append("windowType",    windowType);
      fd.append("floorMaterial", floorMaterial);
      fd.append("doorType",      doorType);

      // Booleans — server "true"/"false" string-ээр уншина
      fd.append("hasGarage",         String(hasGarage));
      if (hasGarage) fd.append("garageInfo", garageInfo);
      fd.append("isFurnished",       String(isFurnished));
      fd.append("hasOutdoorParking", String(hasOutdoorParking));

      // Холбоо барих (заавал биш)
      if (contactName.trim())  fd.append("contactName",  contactName.trim());
      if (contactPhone.trim()) fd.append("contactPhone", contactPhone.trim());
      if (contactEmail.trim()) fd.append("contactEmail", contactEmail.trim());

      // ⭐ Зураг — multer "images" гэдэг нэрээр хүлээж авна
      photos.forEach((p) => fd.append("images", p.file));

      await api.post("/api/properties", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/my-properties");
    } catch (err) {
      setError(err.response?.data?.message || "Байр нэмэхэд алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen pt-20"
      style={{ background: "#FFFFFF", fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        .leaflet-container { background: #FFFFFF; font-family: 'DM Sans', sans-serif; cursor: crosshair; }
        .leaflet-control-zoom a {
          background: #FFFFFF !important;
          color: #C9A84C !important;
          border: 1px solid rgba(201,168,76,0.3) !important;
        }
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.82) !important;
          color: rgba(0,0,0,0.50) !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a { color: #C9A84C !important; }
        .rentalsy-marker { background: transparent !important; border: none !important; }
      `}</style>

      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-8">
        <Link
          to="/my-properties"
          className="text-[10px] tracking-[0.3em] uppercase text-black/50 hover:text-neutral-900 transition-colors"
        >
          ← Миний байрууд руу
        </Link>
      </div>

      {/* Header */}
      <header className="max-w-5xl mx-auto px-6 lg:px-12 mb-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-8" style={{ background: "#C9A84C" }} />
          <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#C9A84C" }}>
            New Listing
          </span>
        </div>
        <h1
          className="font-light text-neutral-900 leading-[1] tracking-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(40px, 5vw, 64px)" }}
        >
          Шинэ байр<br />
          <em style={{ color: "#C9A84C", fontStyle: "italic" }}>нэмэх</em>
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-6 lg:px-12 pb-20">
        {error && (
          <div
            className="mb-8 p-4 flex items-start gap-3"
            style={{ background: "rgba(239,68,68,0.08)", borderLeft: "2px solid #EF4444" }}
          >
            <span style={{ color: "#EF4444" }}>✕</span>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* ── 01 Үндсэн мэдээлэл ── */}
        <FormSection number="01" label="Үндсэн мэдээлэл">
          <Field label="Гарчиг" required>
            <TextInput value={title} onChange={setTitle} placeholder="Жнэ: Хан-Уул дүүрэг 2 өрөө байр" required />
          </Field>

          <Field label="Тайлбар" required>
            <TextArea
              value={description} onChange={setDescription} required
              placeholder="Байрны онцлог, орчин тойрон, тавилгын талаар бичнэ үү..."
            />
          </Field>

          <Field label="Байрны төрөл" required>
            <Select value={propertyType} onChange={setPropertyType}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value} style={{ background: "#F4F2EC" }}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
        </FormSection>

        {/* ── 02 Хаяг ── */}
        <FormSection number="02" label="Хаяг">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Хот" required>
              <TextInput value={city} onChange={setCity} placeholder="Улаанбаатар" required />
            </Field>

            <Field label="Дүүрэг" required>
              <Select value={district} onChange={setDistrict} required>
                <option value="" style={{ background: "#F4F2EC" }}>Сонгоно уу</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d} style={{ background: "#F4F2EC" }}>{d}</option>
                ))}
              </Select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Хаяг (хороо, хороолол)" required>
                <TextInput value={address} onChange={setAddress} placeholder="Жнэ: 3-р хороо, 24-р хороолол" required />
              </Field>
            </div>
          </div>
        </FormSection>

        {/* ── 03 Үнэ & нөхцөл ── */}
        <FormSection number="03" label="Үнэ & нөхцөл">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Сарын түрээс (₮)" required>
              <NumberInput value={monthlyRent} onChange={setMonthlyRent} placeholder="1500000" required />
              {monthlyRent && Number(monthlyRent) > 0 && (
                <p className="mt-2 text-xs" style={{ color: "#C9A84C" }}>
                  {new Intl.NumberFormat("mn-MN").format(monthlyRent)}₮ / сар
                </p>
              )}
            </Field>

            <Field label="Барьцаа (₮)">
              <NumberInput value={depositAmount} onChange={setDepositAmount} placeholder="3000000" />
              {depositAmount && Number(depositAmount) > 0 && (
                <p className="mt-2 text-xs" style={{ color: "#C9A84C" }}>
                  {new Intl.NumberFormat("mn-MN").format(depositAmount)}₮
                </p>
              )}
            </Field>

            <Field label="Түрээсийн хугацаа (сар)">
              <NumberInput value={minLeaseMonths} onChange={setMinLeaseMonths} placeholder="6" min="1" />
            </Field>

            <Field label="Төлбөрийн нөхцөл (тайлбар)">
              <TextInput
                value={paymentConditionText} onChange={setPaymentConditionText}
                placeholder="Жнэ: 3 сараар урьдчилж төлнө"
              />
            </Field>
          </div>
        </FormSection>

        {/* ── 04 Үндсэн үзүүлэлт ── */}
        <FormSection number="04" label="Үндсэн үзүүлэлт">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Өрөөний тоо" required>
              <NumberInput value={rooms} onChange={setRooms} placeholder="2" required />
            </Field>

            <Field label="Талбай (м²)" required>
              <NumberInput value={area} onChange={setArea} placeholder="65" required />
            </Field>

            <Field label="Хэддүгээр давхар">
              <NumberInput value={floorNumber} onChange={setFloorNumber} placeholder="5" />
            </Field>

            <Field label="Нийт давхар">
              <NumberInput value={totalFloors} onChange={setTotalFloors} placeholder="12" />
            </Field>

            <Field label="Ашиглалтанд орсон он">
              <NumberInput value={builtYear} onChange={setBuiltYear} placeholder="2020" min="1900" />
            </Field>
          </div>
        </FormSection>

        {/* ── 05 Дэлгэрэнгүй ── */}
        <FormSection number="05" label="Дэлгэрэнгүй" hint="Заавал биш — мэдэх мэдээллээ оруулна уу">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Балконы тоо">
              <NumberInput value={balconyCount} onChange={setBalconyCount} placeholder="1" />
            </Field>

            <Field label="Цонхны тоо">
              <NumberInput value={windowCount} onChange={setWindowCount} placeholder="4" />
            </Field>

            <Field label="Цонхны материал">
              <TextInput value={windowType} onChange={setWindowType} placeholder="Жнэ: PVC, Модон" />
            </Field>

            <Field label="Шалны материал">
              <TextInput value={floorMaterial} onChange={setFloorMaterial} placeholder="Жнэ: Паркет, Ламинат" />
            </Field>

            <Field label="Хаалганы төрөл">
              <TextInput value={doorType} onChange={setDoorType} placeholder="Жнэ: Хуяг хаалга" />
            </Field>
          </div>
        </FormSection>

        {/* ── 06 Үйлчилгээ & нэмэлт ── */}
        <FormSection number="06" label="Үйлчилгээ & нэмэлт">
          <div className="space-y-6">
            <Field label="Тавилгатай юу?">
              <Toggle value={isFurnished} onChange={setIsFurnished} />
            </Field>

            <Field label="Гараажтай юу?">
              <Toggle value={hasGarage} onChange={setHasGarage} />
              {hasGarage && (
                <div className="mt-4">
                  <TextInput
                    value={garageInfo} onChange={setGarageInfo}
                    placeholder="Гаражны талаар нэмэлт мэдээлэл (заавал биш)"
                  />
                </div>
              )}
            </Field>

            <Field label="Гадаа зогсоолтой юу?">
              <Toggle value={hasOutdoorParking} onChange={setHasOutdoorParking} />
            </Field>
          </div>
        </FormSection>

        {/* ── 07 Холбоо барих ── */}
        <FormSection number="07" label="Холбоо барих" hint="Заавал биш — Ажиглах болон лавлахад зориулсан">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Нэр">
              <TextInput value={contactName} onChange={setContactName} placeholder="Жнэ: Эрдэнэ" />
            </Field>

            <Field label="Утас">
              <TextInput value={contactPhone} onChange={setContactPhone} placeholder="99112233" />
            </Field>

            <div className="md:col-span-2">
              <Field label="Имэйл">
                <TextInput type="email" value={contactEmail} onChange={setContactEmail} placeholder="example@gmail.com" />
              </Field>
            </div>
          </div>
        </FormSection>

        {/* ── 08 Зураг ── */}
        <FormSection number="08" label="Зураг" hint="Эхний зураг нь үндсэн зураг болно">
          <input
            ref={fileInputRef} type="file" accept="image/*" multiple
            onChange={handlePhotoSelect} className="hidden"
          />

          {photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {photos.map((p, i) => (
                <div
                  key={i}
                  className="relative aspect-square group"
                  style={{ border: i === 0 ? "1px solid #C9A84C" : "1px solid rgba(0,0,0,0.12)" }}
                >
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <div
                      className="absolute top-2 left-2 px-2 py-0.5 text-[9px] tracking-[0.2em] uppercase"
                      style={{ background: "#C9A84C", color: "#0A0A0A" }}
                    >
                      Үндсэн
                    </div>
                  )}
                  <button
                    type="button" onClick={() => removePhoto(i)}
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center text-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.82)", border: "1px solid rgba(239,68,68,0.5)" }}
                    aria-label="Зураг устгах"
                  >✕</button>
                </div>
              ))}
              <button
                type="button" onClick={() => fileInputRef.current?.click()}
                className="aspect-square flex flex-col items-center justify-center gap-2 transition-all duration-300"
                style={{
                  border: "1px dashed rgba(201,168,76,0.4)",
                  background: "rgba(201,168,76,0.03)", color: "#C9A84C",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#C9A84C";
                  e.currentTarget.style.background = "rgba(201,168,76,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)";
                  e.currentTarget.style.background = "rgba(201,168,76,0.03)";
                }}
              >
                <span style={{ fontSize: 24 }}>+</span>
                <span className="text-[9px] tracking-[0.25em] uppercase">Нэмэх</span>
              </button>
            </div>
          ) : (
            <button
              type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full py-16 flex flex-col items-center justify-center gap-4 transition-all duration-300"
              style={{ border: "1px dashed rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.02)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,168,76,0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(201,168,76,0.02)")}
            >
              <div className="w-14 h-14 flex items-center justify-center" style={{ border: "1px solid #C9A84C" }}>
                <div style={{ width: 22, height: 22, background: "#C9A84C", transform: "rotate(45deg)" }} />
              </div>
              <div
                className="font-light"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "#C9A84C" }}
              >
                Зураг оруулах
              </div>
              <p className="text-xs text-black/50">JPG, PNG · хэдэн ч зураг</p>
            </button>
          )}
        </FormSection>

        {/* ── 09 Байршил ── */}
        <FormSection number="09" label="Байршил" hint="Газрын зурган дээр дарж эсвэл marker-ийг чирж байршлаа сонгоно уу">
          <div style={{ height: 420, border: "1px solid rgba(201,168,76,0.2)" }}>
            <MapContainer
              center={position || UB_CENTER} zoom={position ? 15 : 12}
              style={{ height: "100%", width: "100%" }} scrollWheelZoom
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap &copy; CARTO'
              />
              <MapClickHandler onPick={(lat, lng) => setPosition([lat, lng])} />
              {position && (
                <Marker
                  position={position} icon={goldDiamondIcon} draggable
                  eventHandlers={{
                    dragend(e) {
                      const { lat, lng } = e.target.getLatLng();
                      setPosition([lat, lng]);
                    },
                  }}
                />
              )}
            </MapContainer>
          </div>

          {position ? (
            <div
              className="mt-4 p-4 flex items-center justify-between"
              style={{ background: "rgba(201,168,76,0.06)", borderLeft: "2px solid #C9A84C" }}
            >
              <div className="flex items-center gap-4">
                <span style={{ color: "#C9A84C" }}>◇</span>
                <div>
                  <div className="text-[10px] tracking-[0.25em] uppercase text-black/50 mb-1">Сонгосон байршил</div>
                  <div className="text-xs text-black/80 font-mono">
                    {position[0].toFixed(5)}, {position[1].toFixed(5)}
                  </div>
                </div>
              </div>
              <button
                type="button" onClick={() => setPosition(null)}
                className="text-[10px] tracking-[0.2em] uppercase text-black/50 hover:text-red-400 transition-colors"
              >Цэвэрлэх</button>
            </div>
          ) : (
            <p className="mt-4 text-xs text-black/50 text-center">
              Газрын зурган дээр дарж байршлаа сонгоно уу
            </p>
          )}
        </FormSection>

        {/* ── Submit ── */}
        <div className="flex flex-col-reverse sm:flex-row gap-4 pt-10" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <Link
            to="/my-properties"
            className="flex-1 sm:flex-initial sm:px-8 py-4 text-center text-[10px] tracking-[0.25em] uppercase text-black/60 hover:text-neutral-900 transition-colors"
            style={{ border: "1px solid rgba(0,0,0,0.15)" }}
          >Болих</Link>
          <button
            type="submit" disabled={submitting}
            className="flex-1 py-4 text-xs font-medium tracking-[0.25em] uppercase transition-all duration-300 group flex items-center justify-center gap-3 disabled:opacity-50"
            style={{ background: "#C9A84C", color: "#0A0A0A" }}
            onMouseEnter={(e) => !submitting && (e.currentTarget.style.background = "#E8D49E")}
            onMouseLeave={(e) => !submitting && (e.currentTarget.style.background = "#C9A84C")}
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Илгээж байна
              </>
            ) : (
              <>
                Байр нэмэх
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Helper components
// ─────────────────────────────────────────────────────────────────────

function FormSection({ number, label, hint, children }) {
  return (
    <section className="mb-12 pb-12" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
      <div className="flex items-baseline gap-6 mb-8">
        <span className="font-light" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "#C9A84C" }}>
          {number}
        </span>
        <div className="flex-1">
          <h3 className="font-light text-neutral-900" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28 }}>
            {label}
          </h3>
          {hint && <p className="text-xs text-black/50 mt-1">{hint}</p>}
        </div>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.3em] uppercase text-black/50 mb-3">
        {label}
        {required && <span style={{ color: "#C9A84C" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, required, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full bg-transparent text-neutral-900 text-sm py-3 outline-none transition-colors"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.18)" }}
      onFocus={(e) => (e.target.style.borderBottomColor = "#C9A84C")}
      onBlur={(e) => (e.target.style.borderBottomColor = "rgba(0,0,0,0.18)")}
    />
  );
}

function NumberInput({ value, onChange, placeholder, required, min = "0" }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      min={min}
      className="w-full bg-transparent text-neutral-900 text-sm py-3 outline-none transition-colors"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.18)" }}
      onFocus={(e) => (e.target.style.borderBottomColor = "#C9A84C")}
      onBlur={(e) => (e.target.style.borderBottomColor = "rgba(0,0,0,0.18)")}
    />
  );
}

function TextArea({ value, onChange, placeholder, required, rows = 5 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      rows={rows}
      className="w-full bg-transparent text-neutral-900 text-sm py-3 px-4 outline-none resize-none transition-colors"
      style={{ border: "1px solid rgba(0,0,0,0.18)" }}
      onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
      onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.18)")}
    />
  );
}

function Select({ value, onChange, required, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full bg-transparent text-neutral-900 text-sm py-3 outline-none"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.18)", colorScheme: "light" }}
    >
      {children}
    </select>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className="px-6 py-2.5 text-[10px] tracking-[0.25em] uppercase transition-all"
        style={{
          background: value ? "#C9A84C" : "transparent",
          color: value ? "#0A0A0A" : "rgba(0,0,0,0.65)",
          border: value ? "1px solid #C9A84C" : "1px solid rgba(0,0,0,0.18)",
        }}
      >Тийм</button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className="px-6 py-2.5 text-[10px] tracking-[0.25em] uppercase transition-all"
        style={{
          background: !value ? "#C9A84C" : "transparent",
          color: !value ? "#0A0A0A" : "rgba(0,0,0,0.65)",
          border: !value ? "1px solid #C9A84C" : "1px solid rgba(0,0,0,0.18)",
        }}
      >Үгүй</button>
    </div>
  );
}

export default AddProperty;