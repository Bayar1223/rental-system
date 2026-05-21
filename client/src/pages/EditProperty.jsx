import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const districts = ["Багануур","Багахангай","Баянгол","Баянзүрх","Налайх","Сонгинохайрхан","Сүхбаатар","Хан-Уул","Чингэлтэй"];
const khoroos   = Array.from({ length: 30 }, (_, i) => `${i + 1}-р хороо`);
const years     = Array.from({ length: 40 }, (_, i) => 2026 - i);
const numbers   = Array.from({ length: 30 }, (_, i) => i + 1);

const districtCoords = {
  "Баянзүрх":       [47.9184, 106.9612],
  "Баянгол":        [47.9077, 106.8432],
  "Сүхбаатар":      [47.9195, 106.9077],
  "Чингэлтэй":      [47.9268, 106.8782],
  "Хан-Уул":        [47.8748, 106.8815],
  "Сонгинохайрхан": [47.9268, 106.7782],
  "Налайх":         [47.7577, 107.2682],
  "Багануур":       [47.7121, 108.2821],
  "Багахангай":     [47.8241, 106.9121],
};

function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "", city: "Улаанбаатар", district: "", khoroo: "",
    address: "", rooms: "", balconyCount: "", doorType: "",
    garageInfo: "", windowType: "", floorMaterial: "", area: "",
    windowCount: "", floorNumber: "", builtYear: "", totalFloors: "",
    paymentConditionText: "", monthlyRent: "", details: "",
    isFurnished: "", hasOutdoorParking: "", contactName: "",
    contactPhone: "", contactEmail: "",
  });

  const [existingImages, setExistingImages]     = useState([]);
  const [newImageFiles, setNewImageFiles]       = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [submitting, setSubmitting]             = useState(false);
  const [deleting, setDeleting]                 = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMapModal, setShowMapModal]         = useState(false);
  const [pinCoords, setPinCoords]               = useState(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await api.get(`/api/properties/${id}`);
        const p = res.data;
        const khorooMatch = p.location?.address?.match(/\d+-р хороо/);
        const khoroo  = khorooMatch ? khorooMatch[0] : "";
        const address = p.location?.address?.replace(khoroo, "").trim() || "";
        setFormData({
          title: p.title || "",
          city: p.location?.city || "Улаанбаатар",
          district: p.location?.district || "",
          khoroo,
          address,
          rooms: p.rooms || "",
          balconyCount: p.balconyCount ?? "",
          doorType: p.doorType || "",
          garageInfo: p.hasGarage ? "Байгаа" : (p.garageInfo || ""),
          windowType: p.windowType || "",
          floorMaterial: p.floorMaterial || "",
          area: p.area || "",
          windowCount: p.windowCount ?? "",
          floorNumber: p.floorNumber ?? "",
          builtYear: p.builtYear ?? "",
          totalFloors: p.totalFloors ?? "",
          paymentConditionText: p.paymentConditionText || "",
          monthlyRent: p.monthlyRent || "",
          details: p.details || "",
          isFurnished: p.isFurnished ? "Тавилгатай" : "Тавилгагүй",
          hasOutdoorParking: p.hasOutdoorParking ? "Байгаа" : "Байхгүй",
          contactName: p.contactName || "",
          contactPhone: p.contactPhone || "",
          contactEmail: p.contactEmail || "",
        });
        if (p.latitude && p.longitude) setPinCoords([p.latitude, p.longitude]);
        setExistingImages(p.images || []);
      } catch {
        alert("Байрны мэдээлэл авахад алдаа гарлаа");
        navigate("/my-properties");
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id, navigate]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    setNewImageFiles(files);
    setNewImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeExistingImage = (index) =>
    setExistingImages(existingImages.filter((_, i) => i !== index));

  const removeNewImage = (index) => {
    setNewImageFiles(newImageFiles.filter((_, i) => i !== index));
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
  };

  const handlePinSelect = useCallback((coords) => setPinCoords(coords), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("location[city]", formData.city);
      data.append("location[district]", formData.district);
      data.append("location[address]", `${formData.khoroo} ${formData.address}`.trim());
      data.append("monthlyRent", formData.monthlyRent);
      data.append("paymentConditionText", formData.paymentConditionText);
      data.append("rooms", formData.rooms);
      data.append("area", formData.area);
      data.append("floorMaterial", formData.floorMaterial);
      data.append("doorType", formData.doorType);
      data.append("balconyCount", formData.balconyCount);
      data.append("builtYear", formData.builtYear);
      data.append("garageInfo", formData.garageInfo);
      data.append("hasGarage", formData.garageInfo === "Байгаа");
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
      data.append("description", formData.details);
      if (pinCoords) {
        data.append("latitude", pinCoords[0]);
        data.append("longitude", pinCoords[1]);
      }
      existingImages.forEach((img) => data.append("existingImages", img));
      newImageFiles.forEach((file) => data.append("images", file));
      await api.put(`/api/properties/${id}`, data);
      navigate(`/properties/${id}`);
    } catch (error) {
      alert(error.response?.data?.message || "Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Энэ байрыг устгах уу?")) return;
    setDeleting(true);
    try {
      await api.delete(`/api/properties/${id}`);
      navigate("/my-properties");
    } catch { alert("Алдаа гарлаа"); }
    finally { setDeleting(false); }
  };

  const selectedLocation = `${formData.city}${formData.district ? " — " + formData.district : ""}${formData.khoroo ? " — " + formData.khoroo : ""}`;
  const mapCenter = formData.district && districtCoords[formData.district]
    ? districtCoords[formData.district]
    : pinCoords || [47.9077, 106.8832];

  const inputCls  = "luxury-input w-full";
  const selectCls = "luxury-select w-full";
  const labelCls  = "block text-xs tracking-widest uppercase mb-2";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
      <Navbar />
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
        <p className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Ачааллаж байна</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingTop: 64 }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">

        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>Байр засах</p>
            <h1 className="font-display text-4xl font-light" style={{ color: "var(--ink)" }}>Мэдээлэл шинэчлэх</h1>
          </div>
          <button onClick={handleDelete} disabled={deleting}
            className="text-xs px-4 py-2 border transition-colors"
            style={{ borderColor: "#FCA5A5", color: "#EF4444", background: "white" }}>
            {deleting ? "Устгаж байна..." : "Байр устгах"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="bg-white border p-6" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>Байршил</p>
            <button type="button" onClick={() => setShowLocationModal(true)}
              className="luxury-input w-full text-left mb-3"
              style={{ color: formData.district ? "var(--ink)" : "var(--text-soft)" }}>
              {formData.district ? `📍 ${selectedLocation}` : "📍 Дүүрэг, хороо сонгох..."}
            </button>
            <button type="button" onClick={() => setShowMapModal(true)}
              className="w-full p-4 text-left text-sm border-2 transition-all mb-4"
              style={{
                borderStyle: "dashed",
                borderColor: pinCoords ? "var(--gold)" : "var(--border-subtle)",
                background: pinCoords ? "var(--cream)" : "white",
                color: pinCoords ? "var(--gold)" : "var(--text-soft)",
              }}>
              {pinCoords
                ? `🗺️ Байршил тэмдэглэгдсэн (${pinCoords[0].toFixed(4)}, ${pinCoords[1].toFixed(4)}) — өөрчлөх`
                : "🗺️ Газрын зураг дээр байршил тэмдэглэх"}
            </button>
            <div>
              <label className={labelCls} style={{ color: "var(--text-muted)" }}>Дэлгэрэнгүй хаяг</label>
              <input name="address" className={inputCls} placeholder="Гудамж, байр, орц, тоот"
                value={formData.address} onChange={handleChange} />
            </div>
          </div>

          <div className="bg-white border p-6" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>Үндсэн мэдээлэл</p>
            <div className="space-y-4">
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Гарчиг *</label>
                <input name="title" className={inputCls} placeholder="Зарын гарчиг"
                  value={formData.title} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} style={{ color: "var(--text-muted)" }}>Өрөө *</label>
                  <select name="rooms" className={selectCls} value={formData.rooms} onChange={handleChange} required>
                    <option value="">Сонгох</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} өрөө</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls} style={{ color: "var(--text-muted)" }}>Талбай (м²) *</label>
                  <input name="area" inputMode="numeric" className={inputCls} placeholder="60"
                    value={formData.area} onChange={handleChange} required />
                </div>
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Сарын түрээс (₮) *</label>
                <input name="monthlyRent" inputMode="numeric" className={inputCls} placeholder="800,000"
                  value={formData.monthlyRent} onChange={handleChange} required />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Төлбөрийн нөхцөл</label>
                <select name="paymentConditionText" className={selectCls} value={formData.paymentConditionText} onChange={handleChange}>
                  <option value="">Сонгох</option>
                  {["Барьцаа байхгүй","1+1","2+1","3+1","4+1","5+1","6+1","12+1"].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border p-6" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>Дэлгэрэнгүй мэдээлэл</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Тагт</label>
                <select name="balconyCount" className={selectCls} value={formData.balconyCount} onChange={handleChange}>
                  <option value="">Сонгох</option>
                  <option value="0">Тагтгүй</option>
                  <option value="1">1 тагт</option>
                  <option value="2">2 тагт</option>
                  <option value="3">3+ тагт</option>
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Хаалга</label>
                <select name="doorType" className={selectCls} value={formData.doorType} onChange={handleChange}>
                  <option value="">Сонгох</option>
                  {["Мод","Төмөр","Бүргэд","Вакум"].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Гараж</label>
                <select name="garageInfo" className={selectCls} value={formData.garageInfo} onChange={handleChange}>
                  <option value="">Сонгох</option>
                  <option value="Байгаа">Байгаа</option>
                  <option value="Байхгүй">Байхгүй</option>
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Цонхны төрөл</label>
                <select name="windowType" className={selectCls} value={formData.windowType} onChange={handleChange}>
                  <option value="">Сонгох</option>
                  {["Мод","Вакум","Төмөр вакум","Модон вакум"].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Цонхны тоо</label>
                <select name="windowCount" className={selectCls} value={formData.windowCount} onChange={handleChange}>
                  <option value="">Сонгох</option>
                  {numbers.slice(0,10).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Шалны материал</label>
                <select name="floorMaterial" className={selectCls} value={formData.floorMaterial} onChange={handleChange}>
                  <option value="">Сонгох</option>
                  {["Мод","Паркет","Ламинат","Чулуу","Плита"].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Давхар</label>
                <select name="floorNumber" className={selectCls} value={formData.floorNumber} onChange={handleChange}>
                  <option value="">Сонгох</option>
                  {numbers.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Нийт давхар</label>
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
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Тавилга *</label>
                <select name="isFurnished" className={selectCls} value={formData.isFurnished} onChange={handleChange} required>
                  <option value="">Сонгох</option>
                  <option value="Тавилгатай">Тавилгатай</option>
                  <option value="Тавилгагүй">Тавилгагүй</option>
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Гадна зогсоол *</label>
                <select name="hasOutdoorParking" className={selectCls} value={formData.hasOutdoorParking} onChange={handleChange} required>
                  <option value="">Сонгох</option>
                  <option value="Байгаа">Байгаа</option>
                  <option value="Байхгүй">Байхгүй</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className={labelCls} style={{ color: "var(--text-muted)" }}>Тайлбар *</label>
              <textarea name="details" rows={4} className="luxury-input w-full resize-none"
                placeholder="Байрны онцлог, давуу талуудаа тайлбарлана уу..."
                value={formData.details} onChange={handleChange} required />
            </div>
          </div>

          <div className="bg-white border p-6" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>Холбоо барих мэдээлэл</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Нэр *</label>
                <input name="contactName" className={inputCls} placeholder="Нэр"
                  value={formData.contactName} onChange={handleChange} required />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Утас *</label>
                <input name="contactPhone" className={inputCls} placeholder="99001122"
                  value={formData.contactPhone} onChange={handleChange} required />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--text-muted)" }}>Имэйл</label>
                <input name="contactEmail" type="email" className={inputCls} placeholder="email@example.com"
                  value={formData.contactEmail} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="bg-white border p-6" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>Зурагнууд</p>
            {existingImages.length > 0 && (
              <>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Одоогийн зурагнууд</p>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-5">
                  {existingImages.map((img, i) => (
                    <div key={i} className="relative group aspect-video overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeExistingImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">x</button>
                      {i === 0 && <span className="absolute bottom-1 left-1 text-xs px-2 py-0.5" style={{ background: "var(--gold)", color: "var(--ink)" }}>Үндсэн</span>}
                    </div>
                  ))}
                </div>
              </>
            )}
            <label className="block border-2 border-dashed p-6 text-center cursor-pointer"
              style={{ borderColor: "var(--gold-light)", background: "var(--cream)" }}>
              <input type="file" accept="image/*" multiple onChange={handleNewImages} className="hidden" />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>+ Шинэ зураг нэмэх</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-soft)" }}>JPG, PNG, WEBP</p>
            </label>
            {newImagePreviews.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-3">
                {newImagePreviews.map((src, i) => (
                  <div key={i} className="relative group aspect-video overflow-hidden">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeNewImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">x</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate("/my-properties")} className="btn-ghost flex-1">Болих</button>
            <button type="submit" disabled={submitting} className="btn-gold flex-1 justify-center" style={{ padding: "14px 0" }}>
              {submitting ? "Хадгалж байна..." : "Мэдээлэл шинэчлэх"}
            </button>
          </div>
        </form>
      </div>

      {showLocationModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowLocationModal(false); }}>
          <div className="bg-white w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <div>
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--gold)" }}>Байршил</p>
                <h2 className="font-display text-xl font-light" style={{ color: "var(--ink)" }}>Дүүрэг, хороо сонгох</h2>
              </div>
              <button onClick={() => setShowLocationModal(false)} className="text-2xl" style={{ color: "var(--text-soft)" }}>x</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>Хот</p>
                <button type="button" className="w-full p-3 text-sm text-left border"
                  style={{ borderColor: "var(--gold)", background: "var(--cream)", color: "var(--gold)" }}>
                  Улаанбаатар
                </button>
              </div>
              <div>
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>Дүүрэг</p>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {districts.map((d) => (
                    <button key={d} type="button"
                      onClick={() => setFormData(prev => ({ ...prev, district: d, khoroo: "" }))}
                      className="w-full p-2.5 text-sm text-left border transition-all"
                      style={{
                        borderColor: formData.district === d ? "var(--gold)" : "var(--border-subtle)",
                        background: formData.district === d ? "var(--cream)" : "white",
                        color: formData.district === d ? "var(--gold)" : "var(--ink)",
                      }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>Хороо</p>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {khoroos.map((k) => (
                    <button key={k} type="button"
                      onClick={() => setFormData(prev => ({ ...prev, khoroo: k }))}
                      className="w-full p-2.5 text-sm text-left border transition-all"
                      style={{
                        borderColor: formData.khoroo === k ? "var(--gold)" : "var(--border-subtle)",
                        background: formData.khoroo === k ? "var(--cream)" : "white",
                        color: formData.khoroo === k ? "var(--gold)" : "var(--ink)",
                      }}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setShowLocationModal(false)}
              className="btn-gold w-full justify-center mt-6" style={{ padding: "12px 0" }}>
              Батлах
            </button>
          </div>
        </div>
      )}

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
            <MapContainer center={pinCoords || mapCenter} zoom={14}
              style={{ height: 380, width: "100%", zIndex: 0 }} scrollWheelZoom={true}>
              <TileLayer attribution="OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapPinSelector onSelect={handlePinSelect} />
              {pinCoords && <Marker position={pinCoords} />}
            </MapContainer>
            <div className="p-4 flex gap-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              {pinCoords && (
                <button type="button" onClick={() => setPinCoords(null)} className="btn-ghost flex-1">Арилгах</button>
              )}
              <button type="button" onClick={() => setShowMapModal(false)}
                className="btn-gold flex-1 justify-center" style={{ padding: "12px 0" }}>
                {pinCoords ? "Хадгалах" : "Хаах"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditProperty;