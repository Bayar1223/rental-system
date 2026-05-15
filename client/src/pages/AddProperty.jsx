import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

function AddProperty() {
  const navigate = useNavigate();

  const years    = Array.from({ length: 40 }, (_, i) => 2026 - i);
  const numbers  = Array.from({ length: 30 }, (_, i) => i + 1);
  const districts = [
    "Багануур","Багахангай","Баянгол","Баянзүрх",
    "Налайх","Сонгинохайрхан","Сүхбаатар","Хан-Уул","Чингэлтэй",
  ];
  const khoroos = Array.from({ length: 30 }, (_, i) => `${i + 1}-р хороо`);

  const initialFormData = {
    title: "", city: "Улаанбаатар", district: "", khoroo: "",
    address: "", rooms: "", balconyCount: "", doorType: "",
    garageInfo: "", windowType: "", floorMaterial: "", area: "",
    windowCount: "", floorNumber: "", builtYear: "", totalFloors: "",
    paymentConditionText: "", monthlyRent: "", details: "",
    isFurnished: "", hasOutdoorParking: "",
    contactName: "", contactPhone: "", contactEmail: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedLocation = `${formData.city}${
    formData.district ? " — " + formData.district : ""
  }${formData.khoroo ? " — " + formData.khoroo : ""}`;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = [...imageFiles, ...files].slice(0, 10);
    setImageFiles(newFiles);
    setImages(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImages(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.district) {
      setError("Дүүрэг сонгоно уу");
      return;
    }
    setSubmitting(true);
    setError("");

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
      imageFiles.forEach((file) => data.append("images", file));

      const response = await api.post("/api/properties", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const propertyId = response.data.property?._id || response.data._id;
      navigate(`/properties/${propertyId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:border-indigo-400 text-sm";
  const selectCls = "w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:border-indigo-400 text-sm bg-white";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";
  const sectionCls = "bg-white rounded-2xl shadow p-5 md:p-6";

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Буцах
          </button>
          <h1 className="text-xl md:text-2xl font-bold">Байр нэмэх</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">
            ✕ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Байршил */}
          <div className={sectionCls}>
            <h2 className="font-bold text-lg mb-4">📍 Байршил</h2>
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              className={`w-full text-left p-3 rounded-xl border-2 text-sm font-medium transition ${
                formData.district
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                  : "border-dashed border-gray-300 text-gray-500 hover:border-indigo-300"
              }`}
            >
              {formData.district ? `✓ ${selectedLocation}` : "Дүүрэг, хороо сонгох →"}
            </button>
            <div className="mt-3">
              <label className={labelCls}>Дэлгэрэнгүй хаяг</label>
              <input
                name="address"
                placeholder="Байр, хотхон, гудамж..."
                value={formData.address}
                onChange={handleChange}
                className={inputCls}
              />
            </div>
          </div>

          {/* Үндсэн мэдээлэл */}
          <div className={sectionCls}>
            <h2 className="font-bold text-lg mb-4">🏠 Үндсэн мэдээлэл</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Зарын гарчиг *</label>
                <input
                  name="title"
                  placeholder="Жишээ: Баянзүрх, 2 өрөө, тавилгатай байр"
                  value={formData.title}
                  onChange={handleChange}
                  className={inputCls}
                  required
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Өрөөний тоо *</label>
                  <select name="rooms" value={formData.rooms} onChange={handleChange} className={selectCls} required>
                    <option value="">Сонгох</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} өрөө</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Талбай м² *</label>
                  <input name="area" inputMode="numeric" placeholder="60" value={formData.area} onChange={handleChange} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Үнэ ₮/сар *</label>
                  <input name="monthlyRent" inputMode="numeric" placeholder="800,000" value={formData.monthlyRent} onChange={handleChange} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Давхар</label>
                  <select name="floorNumber" value={formData.floorNumber} onChange={handleChange} className={selectCls}>
                    <option value="">Сонгох</option>
                    {numbers.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Барилгын давхар</label>
                  <select name="totalFloors" value={formData.totalFloors} onChange={handleChange} className={selectCls}>
                    <option value="">Сонгох</option>
                    {numbers.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Ашиглалтад орсон он</label>
                  <select name="builtYear" value={formData.builtYear} onChange={handleChange} className={selectCls}>
                    <option value="">Сонгох</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Нэмэлт мэдээлэл */}
          <div className={sectionCls}>
            <h2 className="font-bold text-lg mb-4">🔧 Нэмэлт мэдээлэл</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Тавилга *</label>
                <select name="isFurnished" value={formData.isFurnished} onChange={handleChange} className={selectCls} required>
                  <option value="">Сонгох</option>
                  <option value="Тавилгатай">Тавилгатай</option>
                  <option value="Тавилгагүй">Тавилгагүй</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Гадна зогсоол *</label>
                <select name="hasOutdoorParking" value={formData.hasOutdoorParking} onChange={handleChange} className={selectCls} required>
                  <option value="">Сонгох</option>
                  <option value="Байгаа">Байгаа</option>
                  <option value="Байхгүй">Байхгүй</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Төлбөрийн нөхцөл</label>
                <select name="paymentConditionText" value={formData.paymentConditionText} onChange={handleChange} className={selectCls}>
                  <option value="">Сонгох</option>
                  {["Барьцаа байхгүй","1+1","2+1","3+1","4+1","5+1","6+1","12+1"].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Тагт</label>
                <select name="balconyCount" value={formData.balconyCount} onChange={handleChange} className={selectCls}>
                  <option value="">Сонгох</option>
                  <option value="0">Тагтгүй</option>
                  <option value="1">1 тагттай</option>
                  <option value="2">2 тагттай</option>
                  <option value="3">3+</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Гараж</label>
                <select name="garageInfo" value={formData.garageInfo} onChange={handleChange} className={selectCls}>
                  <option value="">Сонгох</option>
                  <option value="Байгаа">Байгаа</option>
                  <option value="Байхгүй">Байхгүй</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Шал</label>
                <select name="floorMaterial" value={formData.floorMaterial} onChange={handleChange} className={selectCls}>
                  <option value="">Сонгох</option>
                  {["Мод","Паркет","Ламинат","Чулуу","Плита"].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Хаалга</label>
                <select name="doorType" value={formData.doorType} onChange={handleChange} className={selectCls}>
                  <option value="">Сонгох</option>
                  {["Мод","Төмөр","Бүргэд","Вакум"].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Цонх</label>
                <select name="windowType" value={formData.windowType} onChange={handleChange} className={selectCls}>
                  <option value="">Сонгох</option>
                  {["Мод","Вакум","Төмөр вакум","Модон вакум"].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Цонхны тоо</label>
                <select name="windowCount" value={formData.windowCount} onChange={handleChange} className={selectCls}>
                  <option value="">Сонгох</option>
                  {numbers.slice(0,10).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Зурагнууд */}
          <div className={sectionCls}>
            <h2 className="font-bold text-lg mb-4">📷 Зурагнууд</h2>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-6 md:p-10 cursor-pointer hover:border-indigo-400 transition">
              <span className="text-3xl mb-2">📁</span>
              <span className="text-sm font-medium text-gray-600 mb-1">Зургаа сонгох</span>
              <span className="text-xs text-gray-400">Хамгийн ихдээ 10 зураг • JPG, PNG</span>
              <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square">
                    <img src={img} alt="preview" className="w-full h-full object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1.5 right-1.5 bg-red-500 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                        Үндсэн
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Холбоо барих */}
          <div className={sectionCls}>
            <h2 className="font-bold text-lg mb-4">📞 Холбоо барих мэдээлэл</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Нэр *</label>
                <input name="contactName" placeholder="Нэр" value={formData.contactName} onChange={handleChange} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Утасны дугаар *</label>
                <input name="contactPhone" placeholder="99001234" value={formData.contactPhone} onChange={handleChange} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Имэйл</label>
                <input name="contactEmail" placeholder="example@gmail.com" value={formData.contactEmail} onChange={handleChange} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Тайлбар */}
          <div className={sectionCls}>
            <h2 className="font-bold text-lg mb-4">📝 Тайлбар *</h2>
            <textarea
              name="details"
              placeholder="Байрны талаар дэлгэрэнгүй мэдээлэл бичнэ үү..."
              value={formData.details}
              onChange={handleChange}
              className={`${inputCls} h-36 resize-none`}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl hover:bg-indigo-700 text-base font-bold transition disabled:opacity-50"
          >
            {submitting ? "Оруулж байна..." : "Байр нэмэх"}
          </button>
        </form>
      </div>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:w-[90%] md:max-w-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">Байршил сонгох</h2>
              <button onClick={() => setShowLocationModal(false)} className="text-2xl text-gray-400">×</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Дүүрэг</p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {districts.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormData({ ...formData, city: "Улаанбаатар", district: d, khoroo: "" })}
                      className={`w-full p-2.5 rounded-xl text-left text-sm transition ${
                        formData.district === d ? "bg-indigo-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Хороо</p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {khoroos.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setFormData({ ...formData, khoroo: k })}
                      className={`w-full p-2.5 rounded-xl text-left text-sm transition ${
                        formData.khoroo === k ? "bg-indigo-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLocationModal(false)}
              className="mt-5 w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
            >
              Хадгалах
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddProperty;