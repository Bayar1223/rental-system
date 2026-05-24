import { useState, useEffect, useRef } from "react";
import api from "../api/axiosInstance";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  MapContainer, TileLayer, Marker, useMapEvents,
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

function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  // ── Холбоо барих ──
  const [contactName, setContactName]   = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // ── Зураг ──
  const [existingImages, setExistingImages] = useState([]); // URL[]
  const [photos, setPhotos]                 = useState([]); // {file, preview}[]

  // ── Байршил ──
  const [position, setPosition] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const fileInputRef = useRef(null);

  // ── Fetch property ──
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/properties/${id}`);
        if (!mounted) return;
        const p = res.data;

        // Эзэмшигч шалгах
        const ownerId = p.owner?._id || p.owner;
        if (ownerId !== user._id && user.role !== "admin") {
          navigate("/my-properties");
          return;
        }

        // ── Бүх талбарыг populated ──
        setTitle(p.title || "");
        setDescription(p.description || p.details || "");
        setPropertyType(p.propertyType || "apartment");

        setCity(p.location?.city || "Улаанбаатар");
        setDistrict(p.location?.district || p.district || "");
        setAddress(p.location?.address || p.address || "");

        setMonthlyRent((p.monthlyRent ?? p.price ?? "").toString());
        setDepositAmount((p.depositAmount ?? "").toString());
        setMinLeaseMonths((p.minLeaseMonths ?? 6).toString());
        setPaymentConditionText(p.paymentConditionText || "");

        setRooms((p.rooms ?? "").toString());
        setArea((p.area ?? p.size ?? "").toString());
        setFloorNumber(p.floorNumber != null ? p.floorNumber.toString() : "");
        setTotalFloors(p.totalFloors != null ? p.totalFloors.toString() : "");
        setBuiltYear(p.builtYear != null ? p.builtYear.toString() : "");

        setBalconyCount((p.balconyCount ?? 0).toString());
        setWindowCount(p.windowCount != null ? p.windowCount.toString() : "");
        setWindowType(p.windowType || "");
        setFloorMaterial(p.floorMaterial || "");
        setDoorType(p.doorType || "");

        setHasGarage(!!p.hasGarage);
        setGarageInfo(p.garageInfo || "");
        setIsFurnished(!!p.isFurnished);
        setHasOutdoorParking(!!p.hasOutdoorParking);

        setContactName(p.contactName || "");
        setContactPhone(p.contactPhone || "");
        setContactEmail(p.contactEmail || "");

        setExistingImages(p.images?.length ? p.images : (p.photos || []));

        const lat = p.latitude;
        const lng = p.longitude;
        if (lat != null && lng != null) {
          setPosition([lat, lng]);
        }
      } catch {
        if (mounted) setNotFound(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  const removeNewPhoto = (idx) => {
    setPhotos((prev) => {
      const removed = prev[idx];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const removeExistingPhoto = (idx) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveExistingPhotoFirst = (idx) => {
    setExistingImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

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
    if (existingImages.length + photos.length === 0) {
      setError("Хамгийн багадаа 1 зураг шаардлагатай");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();

      // Үндсэн
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("propertyType", propertyType);

      // Хаяг
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

      // Booleans
      fd.append("hasGarage",         String(hasGarage));
      fd.append("garageInfo",        hasGarage ? garageInfo : "");
      fd.append("isFurnished",       String(isFurnished));
      fd.append("hasOutdoorParking", String(hasOutdoorParking));

      // Холбоо барих
      fd.append("contactName",  contactName.trim());
      fd.append("contactPhone", contactPhone.trim());
      fd.append("contactEmail", contactEmail.trim());

      // ⭐ Зураг — хуучин URL-уудыг existingImages[] хэлбэрээр явуулна
      // (server multer-аас тусад нь уншиж array болгож нийлүүлнэ)
      existingImages.forEach((url) => fd.append("existingImages", url));

      // Шинэ файлуудыг multer "images" гэдэг нэрээр
      photos.forEach((p) => fd.append("images", p.file));

      await api.put(`/api/properties/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(`/properties/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Хадгалахад алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / Not Found ──
  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <div className="text-center">
          <div
            className="w-12 h-12 mx-auto mb-6 animate-spin"
            style={{
              border: "2px solid rgba(201,168,76,0.2)",
              borderTopColor: "#C9A84C", borderRadius: "50%",
            }}
          />
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">Уншиж байна</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-6" style={{ background: "#0A0A0A" }}>
        <div className="text-center max-w-md">
          <h2
            className="font-light text-white mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36 }}
          >
            Байр <em style={{ color: "#C9A84C", fontStyle: "italic" }}>олдсонгүй</em>
          </h2>
          <Link
            to="/my-properties"
            className="inline-block px-8 py-3 text-[10px] tracking-[0.3em] uppercase mt-6"
            style={{ background: "#C9A84C", color: "#0A0A0A" }}
          >
            Миний байрууд руу →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20" style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .leaflet-container { background: #0A0A0A; font-family: 'DM Sans', sans-serif; cursor: crosshair; }
        .leaflet-control-zoom a {
          background: #141414 !important;
          color: #C9A84C !important;
          border: 1px solid rgba(201,168,76,0.3) !important;
        }
        .leaflet-control-attribution {
          background: rgba(10,10,10,0.7) !important;
          color: rgba(255,255,255,0.4) !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a { color: #C9A84C !important; }
        .rentalsy-marker { background: transparent !important; border: none !important; }
      `}</style>

      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-8">
        <Link
          to={`/properties/${id}`}
          className="text-[10px] tracking-[0.3em] uppercase text-white/40 hover:text-white transition-colors"
        >
          ← Дэлгэрэнгүй рүү буцах
        </Link>
      </div>

      {/* Header */}
      <header className="max-w-5xl mx-auto px-6 lg:px-12 mb-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-8" style={{ background: "#C9A84C" }} />
          <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#C9A84C" }}>
            Edit Listing
          </span>
        </div>
        <h1
          className="font-light text-white leading-[1] tracking-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(40px, 5vw, 64px)" }}
        >
          Байр<br />
          <em style={{ color: "#C9A84C", fontStyle: "italic" }}>засварлах</em>
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-6 lg:px-12 pb-20">
        {error && (
          <div
            className="mb-8 p-4 flex items-start gap-3"
            style={{ background: "rgba(239,68,68,0.08)", borderLeft: "2px solid #EF4444" }}
          >
            <span style={{ color: "#EF4444" }}>✕</span>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* ── 01 ── */}
        <FormSection number="01" label="Үндсэн мэдээлэл">
          <Field label="Гарчиг" required>
            <TextInput value={title} onChange={setTitle} required />
          </Field>
          <Field label="Тайлбар" required>
            <TextArea value={description} onChange={setDescription} required />
          </Field>
          <Field label="Байрны төрөл" required>
            <Select value={propertyType} onChange={setPropertyType}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value} style={{ background: "#141414" }}>{t.label}</option>
              ))}
            </Select>
          </Field>
        </FormSection>

        {/* ── 02 ── */}
        <FormSection number="02" label="Хаяг">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Хот" required>
              <TextInput value={city} onChange={setCity} required />
            </Field>
            <Field label="Дүүрэг" required>
              <Select value={district} onChange={setDistrict} required>
                <option value="" style={{ background: "#141414" }}>Сонгоно уу</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d} style={{ background: "#141414" }}>{d}</option>
                ))}
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Хаяг (хороо, хороолол)" required>
                <TextInput value={address} onChange={setAddress} required />
              </Field>
            </div>
          </div>
        </FormSection>

        {/* ── 03 ── */}
        <FormSection number="03" label="Үнэ & нөхцөл">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Сарын түрээс (₮)" required>
              <NumberInput value={monthlyRent} onChange={setMonthlyRent} required />
              {monthlyRent && Number(monthlyRent) > 0 && (
                <p className="mt-2 text-xs" style={{ color: "#C9A84C" }}>
                  {new Intl.NumberFormat("mn-MN").format(monthlyRent)}₮ / сар
                </p>
              )}
            </Field>
            <Field label="Барьцаа (₮)">
              <NumberInput value={depositAmount} onChange={setDepositAmount} />
              {depositAmount && Number(depositAmount) > 0 && (
                <p className="mt-2 text-xs" style={{ color: "#C9A84C" }}>
                  {new Intl.NumberFormat("mn-MN").format(depositAmount)}₮
                </p>
              )}
            </Field>
            <Field label="Хамгийн бага түрээсийн хугацаа (сар)">
              <NumberInput value={minLeaseMonths} onChange={setMinLeaseMonths} min="1" />
            </Field>
            <Field label="Төлбөрийн нөхцөл (тайлбар)">
              <TextInput value={paymentConditionText} onChange={setPaymentConditionText} />
            </Field>
          </div>
        </FormSection>

        {/* ── 04 ── */}
        <FormSection number="04" label="Үндсэн үзүүлэлт">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Өрөөний тоо" required>
              <NumberInput value={rooms} onChange={setRooms} required />
            </Field>
            <Field label="Талбай (м²)" required>
              <NumberInput value={area} onChange={setArea} required />
            </Field>
            <Field label="Хэддүгээр давхар">
              <NumberInput value={floorNumber} onChange={setFloorNumber} />
            </Field>
            <Field label="Нийт давхар">
              <NumberInput value={totalFloors} onChange={setTotalFloors} />
            </Field>
            <Field label="Барьсан жил">
              <NumberInput value={builtYear} onChange={setBuiltYear} min="1900" />
            </Field>
          </div>
        </FormSection>

        {/* ── 05 ── */}
        <FormSection number="05" label="Дэлгэрэнгүй" hint="Заавал биш">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Балконы тоо">
              <NumberInput value={balconyCount} onChange={setBalconyCount} />
            </Field>
            <Field label="Цонхны тоо">
              <NumberInput value={windowCount} onChange={setWindowCount} />
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

        {/* ── 06 ── */}
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
                    placeholder="Гаражны талаар нэмэлт мэдээлэл"
                  />
                </div>
              )}
            </Field>
            <Field label="Гадаа зогсоолтой юу?">
              <Toggle value={hasOutdoorParking} onChange={setHasOutdoorParking} />
            </Field>
          </div>
        </FormSection>

        {/* ── 07 ── */}
        <FormSection number="07" label="Холбоо барих" hint="Заавал биш">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Нэр">
              <TextInput value={contactName} onChange={setContactName} />
            </Field>
            <Field label="Утас">
              <TextInput value={contactPhone} onChange={setContactPhone} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Имэйл">
                <TextInput type="email" value={contactEmail} onChange={setContactEmail} />
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

          {/* Хуучин зураг */}
          {existingImages.length > 0 && (
            <div className="mb-6">
              <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-4">
                Одоогийн зураг ({existingImages.length})
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {existingImages.map((url, i) => (
                  <div
                    key={url + i}
                    className="relative aspect-square group"
                    style={{ border: i === 0 ? "1px solid #C9A84C" : "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div
                        className="absolute top-2 left-2 px-2 py-0.5 text-[9px] tracking-[0.2em] uppercase"
                        style={{ background: "#C9A84C", color: "#0A0A0A" }}
                      >Үндсэн</div>
                    )}
                    <div className="absolute inset-x-2 bottom-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {i !== 0 && (
                        <button
                          type="button" onClick={() => moveExistingPhotoFirst(i)}
                          className="flex-1 py-1.5 text-[9px] tracking-[0.15em] uppercase"
                          style={{
                            background: "rgba(10,10,10,0.85)",
                            border: "1px solid rgba(201,168,76,0.5)",
                            color: "#C9A84C",
                          }}
                        >Үндсэн</button>
                      )}
                      <button
                        type="button" onClick={() => removeExistingPhoto(i)}
                        className="flex-1 py-1.5 text-[9px] tracking-[0.15em] uppercase text-red-300"
                        style={{
                          background: "rgba(10,10,10,0.85)",
                          border: "1px solid rgba(239,68,68,0.5)",
                        }}
                      >Устгах</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Шинэ зураг */}
          {photos.length > 0 && (
            <div className="mb-6">
              <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-4">
                Шинээр нэмсэн ({photos.length})
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {photos.map((p, i) => (
                  <div
                    key={i}
                    className="relative aspect-square group"
                    style={{ border: "1px dashed rgba(201,168,76,0.5)" }}
                  >
                    <img src={p.preview} alt="" className="w-full h-full object-cover" />
                    <div
                      className="absolute top-2 left-2 px-2 py-0.5 text-[9px] tracking-[0.2em] uppercase"
                      style={{ background: "rgba(201,168,76,0.95)", color: "#0A0A0A" }}
                    >Шинэ</div>
                    <button
                      type="button" onClick={() => removeNewPhoto(i)}
                      className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: "rgba(10,10,10,0.85)",
                        border: "1px solid rgba(239,68,68,0.5)",
                      }}
                      aria-label="Устгах"
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button" onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 flex flex-col items-center justify-center gap-3 transition-all duration-300"
            style={{
              border: "1px dashed rgba(201,168,76,0.4)",
              background: "rgba(201,168,76,0.02)", color: "#C9A84C",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#C9A84C";
              e.currentTarget.style.background = "rgba(201,168,76,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)";
              e.currentTarget.style.background = "rgba(201,168,76,0.02)";
            }}
          >
            <span style={{ fontSize: 22 }}>+</span>
            <span className="text-[10px] tracking-[0.25em] uppercase">Зураг нэмэх</span>
          </button>
        </FormSection>

        {/* ── 09 Map ── */}
        <FormSection number="09" label="Байршил" hint="Газрын зурган дээр дарж эсвэл marker-ийг чирж байршлаа өөрчилнө үү">
          <div style={{ height: 420, border: "1px solid rgba(201,168,76,0.2)" }}>
            <MapContainer
              center={position || UB_CENTER} zoom={position ? 15 : 12}
              style={{ height: "100%", width: "100%" }} scrollWheelZoom
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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

          {position && (
            <div
              className="mt-4 p-4 flex items-center justify-between"
              style={{ background: "rgba(201,168,76,0.06)", borderLeft: "2px solid #C9A84C" }}
            >
              <div className="flex items-center gap-4">
                <span style={{ color: "#C9A84C" }}>◇</span>
                <div>
                  <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-1">Сонгосон байршил</div>
                  <div className="text-xs text-white/80 font-mono">
                    {position[0].toFixed(5)}, {position[1].toFixed(5)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </FormSection>

        {/* ── Submit ── */}
        <div className="flex flex-col-reverse sm:flex-row gap-4 pt-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Link
            to={`/properties/${id}`}
            className="flex-1 sm:flex-initial sm:px-8 py-4 text-center text-[10px] tracking-[0.25em] uppercase text-white/60 hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.12)" }}
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
                Хадгалж байна
              </>
            ) : (
              <>
                Хадгалах
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
    <section className="mb-12 pb-12" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-baseline gap-6 mb-8">
        <span className="font-light" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "#C9A84C" }}>
          {number}
        </span>
        <div className="flex-1">
          <h3 className="font-light text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28 }}>
            {label}
          </h3>
          {hint && <p className="text-xs text-white/40 mt-1">{hint}</p>}
        </div>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3">
        {label}{required && <span style={{ color: "#C9A84C" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, required, type = "text" }) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} required={required}
      className="w-full bg-transparent text-white text-sm py-3 outline-none transition-colors"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}
      onFocus={(e) => (e.target.style.borderBottomColor = "#C9A84C")}
      onBlur={(e) => (e.target.style.borderBottomColor = "rgba(255,255,255,0.15)")}
    />
  );
}

function NumberInput({ value, onChange, placeholder, required, min = "0" }) {
  return (
    <input
      type="number" value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} required={required} min={min}
      className="w-full bg-transparent text-white text-sm py-3 outline-none transition-colors"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}
      onFocus={(e) => (e.target.style.borderBottomColor = "#C9A84C")}
      onBlur={(e) => (e.target.style.borderBottomColor = "rgba(255,255,255,0.15)")}
    />
  );
}

function TextArea({ value, onChange, placeholder, required, rows = 5 }) {
  return (
    <textarea
      value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} required={required} rows={rows}
      className="w-full bg-transparent text-white text-sm py-3 px-4 outline-none resize-none transition-colors"
      style={{ border: "1px solid rgba(255,255,255,0.15)" }}
      onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
    />
  );
}

function Select({ value, onChange, required, children }) {
  return (
    <select
      value={value} onChange={(e) => onChange(e.target.value)} required={required}
      className="w-full bg-transparent text-white text-sm py-3 outline-none"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.15)", colorScheme: "dark" }}
    >
      {children}
    </select>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div className="flex gap-2">
      <button
        type="button" onClick={() => onChange(true)}
        className="px-6 py-2.5 text-[10px] tracking-[0.25em] uppercase transition-all"
        style={{
          background: value ? "#C9A84C" : "transparent",
          color: value ? "#0A0A0A" : "rgba(255,255,255,0.6)",
          border: value ? "1px solid #C9A84C" : "1px solid rgba(255,255,255,0.15)",
        }}
      >Тийм</button>
      <button
        type="button" onClick={() => onChange(false)}
        className="px-6 py-2.5 text-[10px] tracking-[0.25em] uppercase transition-all"
        style={{
          background: !value ? "#C9A84C" : "transparent",
          color: !value ? "#0A0A0A" : "rgba(255,255,255,0.6)",
          border: !value ? "1px solid #C9A84C" : "1px solid rgba(255,255,255,0.15)",
        }}
      >Үгүй</button>
    </div>
  );
}

export default EditProperty;