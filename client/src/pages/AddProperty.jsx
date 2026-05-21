import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapPinSelector({ onSelect }) {
  useMapEvents({ click(e) { onSelect([e.latlng.lat, e.latlng.lng]); } });
  return null;
}

const years     = Array.from({ length: 40 }, (_, i) => 2026 - i);
const numbers   = Array.from({ length: 30 }, (_, i) => i + 1);
const districts = ["Багануур","Багахангай","Баянгол","Баянзүрх","Налайх","Сонгинохайрхан","Сүхбаатар","Хан-Уул","Чингэлтэй"];
const khoroos   = Array.from({ length: 30 }, (_, i) => `${i + 1}-р хороо`);
const districtCoords = {
  "Баянзүрх": [47.9184, 106.9612], "Баянгол": [47.9077, 106.8432],
  "Сүхбаатар": [47.9195, 106.9077], "Чингэлтэй": [47.9268, 106.8782],
  "Хан-Уул": [47.8748, 106.8815], "Сонгинохайрхан": [47.9268, 106.7782],
  "Налайх": [47.7577, 107.2682], "Багануур": [47.7121, 108.2821], "Багахангай": [47.8241, 106.9121],
};

const INIT = {
  title: "", city: "Улаанбаатар", district: "", khoroo: "", address: "",
  rooms: "", balconyCount: "", doorType: "", garageInfo: "", windowType: "",
  floorMaterial: "", area: "", windowCount: "", floorNumber: "", builtYear: "",
  totalFloors: "", paymentConditionText: "", monthlyRent: "", details: "",
  isFurnished: "", hasOutdoorParking: "", contactName: "", contactPhone: "", contactEmail: "",
};

function AddProperty() {
  const navigate = useNavigate();
  const [formData, setFormData]           = useState(INIT);
  const [images, setImages]               = useState([]);
  const [imageFiles, setImageFiles]       = useState([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMapModal, setShowMapModal]   = useState(false);
  const [pinCoords, setPinCoords]         = useState(null);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState("");

  const selectedLocation = `${formData.city}${formData.district ? " — " + formData.district : ""}${formData.khoroo ? " — " + formData.khoroo : ""}`;
  const mapCenter = formData.district && districtCoords[formData.district] ? districtCoords[formData.district] : [47.9077, 106.8832];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const files = [...imageFiles, ...Array.from(e.target.files)].slice(0, 10);
    setImageFiles(files);
    setImages(files.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImages(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const handlePinSelect = useCallback((coords) => setPinCoords(coords), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.district) { setError("Дүүрэг сонгоно уу"); return; }
    setSubmitting(true); setError("");
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.details);
      data.append("location[city]", formData.city);
      data.append("location[district]", formData.district);
      data.append("location[address]", `${formData.khoroo} ${formData.address}`.trim());
      data.append("monthlyRent", formData.monthlyRent);
      data.append("depositAmount", 0);
      data.append("paymentCondition", "monthly");
      data.append("paymentConditionText", formData.paymentConditionText);
      data.append("minLeaseMonths", 6);
      data.append("rooms", formData.rooms);
      data.append("area", formData.area);
      data.append("propertyType", "apartment");
      data.append("floorMaterial", formData.floorMaterial);
      data.append("doorType", formData.doorType);
      data.append("balconyCount", formData.balconyCount);
      data.append("builtYear", formData.builtYear);
      data.append("hasGarage", formData.garageInfo === "Байгаа");
      data.append("garageInfo", formData.garageInfo);
      data.append("windowType", formData.windowType);
      data.append("windowCount", formData.windowCount);
      data.append("floorNumber", formData.floorNumber);
      data.append("totalFloors", formData.totalFloors);
      data.append("isFurnished", formData.isFurnished === "Тавилгатай");
      data.append("hasOutdoorParking", formData.hasOutdoorParking === "Байгаа");
      data.append("contactName", formData.contactName);
      data.append("contactPhone", formData.contactPhone);
      data.append("contactEmail", formData.contactEmail);
      data.append("details", formData.details);
      if (pinCoords) { data.append("latitude", pinCoords[0]); data.append("longitude", pinCoords[1]); }
      imageFiles.forEach((file) => data.append("images", file));
      const response = await api.post("/api/properties", data, { headers: { "Content-Type": "multipart/form-data" } });
      const propertyId = response.data.property?._id || response.data._id;
      navigate(`/properties/${propertyId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Алдаа гарлаа. Дахин оролдоно уу.");
    } finally { setSubmitting(false); }
  };

  const inputCls  = "luxury-input w-full";
  const selectCls = "luxury-select w-full";
  const labelCls  = "block text-xs tracking-widest uppercase mb-2";

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingTop: 64 }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>Шинэ байр</p>
          <h1 className="font-display text-4xl font-light" style={{ color: "var(--ink)" }}>Байр нэмэх</h1>
        </div>

        {error && (
          <div className="mb-5 p-4 border-l-2 text-sm" style={{ borderColor: "#EF4444", background: "#FEF2F2", color: "#EF4444" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Байршил */}
          <div className="bg-white border p-6" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>Байршил</p>
            <button type="button" onClick={() => setShowLocationModal(true)}
              className="luxury-input w-full text-left mb-3"
              style={{ color: formData.district ? "var(--ink)" : "var(--text-soft)" }}>
              {formData.district ? `${selectedLocation}` : "Дүүрэг, хороо сонгох..."}
            </button>
            <button type="button" onClick={() => setShowMapModal(true)}
              className="w-full p-4 text-left text-sm border-2 transition-all mb-4"
              style={{
                borderStyle: "dashed",
                borderColor: pinCoords ? "var(--gold)" : "var(--border-subtle)",
                background: pinCoords ? "var(--cream)" : "white",
                color: pinCoords ? "var(--gold)" : "var(--text-soft)",
              }}>
              {pinCoords ? `Байршил тэмдэглэгдлээ (${pinCoords[0].toFixed(4)}, ${pinCoords[1].toFixed(4)}) — өөрчлөх` : "Газрын зураг дээр байршил тэмдэглэх (заавал биш)"}
            </button>
            <div>
              <label className={labelCls} style={{ color: "var(--text-muted)" }}>Дэлгэрэнгүй хаяг</label>
              <input name="address" className={inputCls} placeholder="Байр, хотхон, гудамж..." value={formData.address} onChange={handleChange} />
            </div>
          </div>

          {/* Үндсэн мэдээлэл */}
          <div className="bg-white border p-6" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>Үндсэн мэдээлэл</p>
            <div className="space-y-4">
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Зарын гарчиг *</label>
                <input name="title" className={inputCls} placeholder="Жишээ: Баянзүрх, 2 өрөө, тавилгатай байр" value={formData.title} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls} style={{ color: "var(--text-muted)" }}>Өрөөний тоо *</label>
                  <select name="rooms" className={selectCls} value={formData.rooms} onChange={handleChange} required>
                    <option value="">Сонгох</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} өрөө</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls} style={{ color: "var(--text-muted)" }}>Талбай м² *</label>
                  <input name="area" inputMode="numeric" className={inputCls} placeholder="60" value={formData.area} onChange={handleChange} required />
                </div>
                <div>
                  <label className={labelCls} style={{ color: "var(--text-muted)" }}>Үнэ ₮/сар *</label>
                  <input name="monthlyRent" inputMode="numeric" className={inputCls} placeholder="800,000" value={formData.monthlyRent} onChange={handleChange} required />
                </div>
                <div>
                  <label className={labelCls} style={{ color: "var(--text-muted)" }}>Давхар</label>
                  <select name="floorNumber" className={selectCls} value={formData.floorNumber} onChange={handleChange}>
                    <option value="">Сонгох</option>
                    {numbers.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls} style={{ color: "var(--text-muted)" }}>Барилгын давхар</label>
                  <select name="totalFloors" className={selectCls} value={formData.totalFloors} onChange={handleChange}>
                    <option value="">Сонгох</option>
                    {numbers.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls} style={{ color: "var(--text-muted)" }}>Ашиглалтад орсон он</label>
                  <select name="builtYear" className={selectCls} value={formData.builtYear} onChange={handleChange}>
                    <option value="">Сонгох</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Нэмэлт мэдээлэл */}
          <div className="bg-white border p-6" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>Нэмэлт мэдээлэл</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: "isFurnished", label: "Тавилга *", opts: ["Тавилгатай","Тавилгагүй"], req: true },
                { name: "hasOutdoorParking", label: "Гадна зогсоол *", opts: ["Байгаа","Байхгүй"], req: true },
                { name: "paymentConditionText", label: "Төлбөрийн нөхцөл", opts: ["Барьцаа байхгүй","1+1","2+1","3+1","4+1","5+1","6+1","12+1"] },
                { name: "balconyCount", label: "Тагт", opts: ["0","1","2","3"], labels: ["Тагтгүй","1 тагт","2 тагт","3+"] },
                { name: "garageInfo", label: "Гараж", opts: ["Байгаа","Байхгүй"] },
                { name: "floorMaterial", label: "Шал", opts: ["Мод","Паркет","Ламинат","Чулуу","Плита"] },
                { name: "doorType", label: "Хаалга", opts: ["Мод","Төмөр","Бүргэд","Вакум"] },
                { name: "windowType", label: "Цонх", opts: ["Мод","Вакум","Төмөр вакум","Модон вакум"] },
                { name: "windowCount", label: "Цонхны тоо", opts: numbers.slice(0,10).map(String) },
              ].map(({ name, label, opts, labels, req }) => (
                <div key={name}>
                  <label className={labelCls} style={{ color: "var(--text-muted)" }}>{label}</label>
                  <select name={name} className={selectCls} value={formData[name]} onChange={handleChange} required={req}>
                    <option value="">Сонгох</option>
                    {opts.map((o, i) => <option key={o} value={o}>{labels ? labels[i] : o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Зурагнууд */}
          <div className="bg-white border p-6" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>Зурагнууд</p>
            <label className="block border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
              style={{ borderColor: "var(--gold-light)", background: "var(--cream)" }}>
              <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Зургаа сонгох эсвэл чирж оруулах</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-soft)" }}>Хамгийн ихдээ 10 зураг · JPG, PNG, WEBP</p>
            </label>
            {images.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                {images.map((img, i) => (
                  <div key={i} className="relative group aspect-video overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">x</button>
                    {i === 0 && <span className="absolute bottom-1 left-1 text-xs px-2 py-0.5" style={{ background: "var(--gold)", color: "var(--ink)" }}>Үндсэн</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Холбоо барих */}
          <div className="bg-white border p-6" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>Холбоо барих</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Нэр *</label>
                <input name="contactName" className={inputCls} placeholder="Нэр" value={formData.contactName} onChange={handleChange} required />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Утас *</label>
                <input name="contactPhone" className={inputCls} placeholder="99001234" value={formData.contactPhone} onChange={handleChange} required />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Имэйл</label>
                <input name="contactEmail" className={inputCls} placeholder="example@gmail.com" value={formData.contactEmail} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Тайлбар */}
          <div className="bg-white border p-6" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>Тайлбар *</p>
            <textarea name="details" rows={5} className="luxury-input w-full resize-none"
              placeholder="Байрны талаар дэлгэрэнгүй мэдээлэл бичнэ үү..."
              value={formData.details} onChange={handleChange} required />
          </div>

          <button type="submit" disabled={submitting} className="btn-gold w-full justify-center" style={{ padding: "16px 0" }}>
            {submitting ? "Оруулж байна..." : "Байр нэмэх"}
          </button>
        </form>
      </div>

      {/* Дүүрэг/Хороо Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowLocationModal(false); }}>
          <div className="bg-white w-full md:max-w-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <div>
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--gold)" }}>Байршил</p>
                <h2 className="font-display text-xl font-light" style={{ color: "var(--ink)" }}>Дүүрэг, хороо сонгох</h2>
              </div>
              <button onClick={() => setShowLocationModal(false)} className="text-2xl" style={{ color: "var(--text-soft)" }}>x</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>Дүүрэг</p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {districts.map((d) => (
                    <button key={d} type="button"
                      onClick={() => setFormData({ ...formData, city: "Улаанбаатар", district: d, khoroo: "" })}
                      className="w-full p-2.5 text-sm text-left border transition-all"
                      style={{ borderColor: formData.district === d ? "var(--gold)" : "var(--border-subtle)", background: formData.district === d ? "var(--cream)" : "white", color: formData.district === d ? "var(--gold)" : "var(--ink)" }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>Хороо</p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {khoroos.map((k) => (
                    <button key={k} type="button"
                      onClick={() => setFormData({ ...formData, khoroo: k })}
                      className="w-full p-2.5 text-sm text-left border transition-all"
                      style={{ borderColor: formData.khoroo === k ? "var(--gold)" : "var(--border-subtle)", background: formData.khoroo === k ? "var(--cream)" : "white", color: formData.khoroo === k ? "var(--gold)" : "var(--ink)" }}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setShowLocationModal(false)}
              className="btn-gold w-full justify-center mt-5" style={{ padding: "12px 0" }}>Хадгалах</button>
          </div>
        </div>
      )}

      {/* Leaflet Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowMapModal(false); }}>
          <div className="bg-white w-full max-w-2xl overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "var(--border-subtle)" }}>
              <div>
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--gold)" }}>Газрын зураг</p>
                <h2 className="font-display text-xl font-light" style={{ color: "var(--ink)" }}>Байршил тэмдэглэх</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Map дээр байрны байршил дээр дарна уу</p>
              </div>
              <button onClick={() => setShowMapModal(false)} className="text-2xl" style={{ color: "var(--text-soft)" }}>x</button>
            </div>
            {pinCoords && (
              <div className="px-5 py-2 text-xs" style={{ background: "var(--cream)", color: "var(--gold)" }}>
                Сонгосон: {pinCoords[0].toFixed(5)}, {pinCoords[1].toFixed(5)}
              </div>
            )}
            <MapContainer center={pinCoords || mapCenter} zoom={14} style={{ height: 380, width: "100%", zIndex: 0 }} scrollWheelZoom={true}>
              <TileLayer attribution="OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapPinSelector onSelect={handlePinSelect} />
              {pinCoords && <Marker position={pinCoords} />}
            </MapContainer>
            <div className="p-4 flex gap-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              {pinCoords && (
                <button type="button" onClick={() => setPinCoords(null)} className="btn-ghost flex-1">Арилгах</button>
              )}
              <button type="button" onClick={() => setShowMapModal(false)} className="btn-gold flex-1 justify-center" style={{ padding: "12px 0" }}>
                {pinCoords ? "Хадгалах" : "Хаах"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddProperty;