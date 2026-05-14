import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

const districts = [
  "Багануур", "Багахангай", "Баянгол", "Баянзүрх",
  "Налайх", "Сонгинохайрхан", "Сүхбаатар", "Хан-Уул", "Чингэлтэй",
];
const khoroos  = Array.from({ length: 30 }, (_, i) => `${i + 1}-р хороо`);
const years    = Array.from({ length: 40 }, (_, i) => 2026 - i);
const numbers  = Array.from({ length: 30 }, (_, i) => i + 1);

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

  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles]   = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await axios.get(`https://rental-system-api.onrender.com/api/properties/${id}`);
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

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const data  = new FormData();

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

      existingImages.forEach((img) => data.append("existingImages", img));
      newImageFiles.forEach((file) => data.append("images", file));

      await axios.put(`https://rental-system-api.onrender.com/api/properties/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Байрны мэдээлэл амжилттай шинэчлэгдлээ");
      navigate(`/properties/${id}`);
    } catch (error) {
      alert(error.response?.data?.message || "Алдаа гарлаа");
    }
  };

  const selectedLocation = `${formData.city}${formData.district ? " — " + formData.district : ""}${formData.khoroo ? " — " + formData.khoroo : ""}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate("/my-properties")} className="bg-white px-5 py-3 rounded-xl shadow hover:bg-gray-50 font-medium">
            ← Буцах
          </button>
          <h1 className="text-3xl font-bold">Байрны мэдээлэл засах</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Байршил */}
            <button type="button" onClick={() => setShowLocationModal(true)} className="w-full bg-gray-100 border p-4 rounded-xl text-left font-semibold">
              Байршил: {selectedLocation}
            </button>

            <input name="title" placeholder="Зарын гарчиг" value={formData.title} onChange={handleChange} className="w-full border p-4 rounded-xl" required />
            <input name="address" placeholder="Дэлгэрэнгүй хаяг" value={formData.address} onChange={handleChange} className="w-full border p-4 rounded-xl" required />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <select name="rooms" value={formData.rooms} onChange={handleChange} className="border p-4 rounded-xl" required>
                <option value="">Өрөө сонгох</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} өрөө</option>)}
              </select>
              <select name="balconyCount" value={formData.balconyCount} onChange={handleChange} className="border p-4 rounded-xl">
                <option value="">Тагт</option>
                <option value="0">Тагтгүй</option>
                <option value="1">1 тагттай</option>
                <option value="2">2 тагттай</option>
                <option value="3">3+ тагттай</option>
              </select>
              <select name="doorType" value={formData.doorType} onChange={handleChange} className="border p-4 rounded-xl">
                <option value="">Хаалга</option>
                {["Мод","Төмөр","Бүргэд","Вакум"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select name="garageInfo" value={formData.garageInfo} onChange={handleChange} className="border p-4 rounded-xl">
                <option value="">Гараж</option>
                <option value="Байгаа">Байгаа</option>
                <option value="Байхгүй">Байхгүй</option>
              </select>
              <select name="windowType" value={formData.windowType} onChange={handleChange} className="border p-4 rounded-xl">
                <option value="">Цонх</option>
                {["Мод","Вакум","Төмөр вакум","Модон вакум"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select name="floorMaterial" value={formData.floorMaterial} onChange={handleChange} className="border p-4 rounded-xl">
                <option value="">Шал</option>
                {["Мод","Паркет","Ламинат","Чулуу","Плита"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <input name="area" inputMode="numeric" placeholder="Талбай м²" value={formData.area} onChange={handleChange} className="border p-4 rounded-xl" required />
              <select name="windowCount" value={formData.windowCount} onChange={handleChange} className="border p-4 rounded-xl">
                <option value="">Цонхны тоо</option>
                {numbers.slice(0,10).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <select name="floorNumber" value={formData.floorNumber} onChange={handleChange} className="border p-4 rounded-xl">
                <option value="">Хэдэн давхарт</option>
                {numbers.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <select name="builtYear" value={formData.builtYear} onChange={handleChange} className="border p-4 rounded-xl">
                <option value="">Ашиглалтад орсон он</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select name="totalFloors" value={formData.totalFloors} onChange={handleChange} className="border p-4 rounded-xl">
                <option value="">Барилгын давхар</option>
                {numbers.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <select name="paymentConditionText" value={formData.paymentConditionText} onChange={handleChange} className="border p-4 rounded-xl">
                <option value="">Төлбөрийн нөхцөл</option>
                {["Барьцаа байхгүй","1+1","2+1","3+1","4+1","5+1","6+1","12+1"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select name="isFurnished" value={formData.isFurnished} onChange={handleChange} className="border p-4 rounded-xl" required>
                <option value="">Тавилга</option>
                <option value="Тавилгатай">Тавилгатай</option>
                <option value="Тавилгагүй">Тавилгагүй</option>
              </select>
              <select name="hasOutdoorParking" value={formData.hasOutdoorParking} onChange={handleChange} className="border p-4 rounded-xl" required>
                <option value="">Гадна зогсоол</option>
                <option value="Байгаа">Байгаа</option>
                <option value="Байхгүй">Байхгүй</option>
              </select>
            </div>

            <input name="monthlyRent" inputMode="numeric" placeholder="Үнэ ₮" value={formData.monthlyRent} onChange={handleChange} className="w-full border p-4 rounded-xl" required />

            <div>
              <h2 className="text-xl font-bold mb-4">Холбоо барих мэдээлэл</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <input name="contactName" placeholder="Нэр" value={formData.contactName} onChange={handleChange} className="border p-4 rounded-xl" required />
                <input name="contactPhone" placeholder="Утасны дугаар" value={formData.contactPhone} onChange={handleChange} className="border p-4 rounded-xl" required />
                <input name="contactEmail" placeholder="Имэйл" value={formData.contactEmail} onChange={handleChange} className="border p-4 rounded-xl" />
              </div>
            </div>

            {/* Одоогийн зургууд */}
            {existingImages.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-3">Одоогийн зургууд</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((img, index) => (
                    <div key={index} className="relative">
                      <img src={img} alt="" className="h-32 w-full object-cover rounded-xl" />
                      <button type="button" onClick={() => removeExistingImage(index)} className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full text-lg leading-none">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Шинэ зураг */}
            <div>
              <h2 className="text-xl font-bold mb-3">Шинэ зураг нэмэх</h2>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-8 cursor-pointer hover:border-indigo-500 transition">
                <span className="text-gray-600 mb-1">Зургаа сонгох</span>
                <span className="text-sm text-gray-400">Нэг болон түүнээс дээш зураг</span>
                <input type="file" accept="image/*" multiple onChange={handleNewImages} className="hidden" />
              </label>
              {newImagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {newImagePreviews.map((img, index) => (
                    <div key={index} className="relative">
                      <img src={img} alt="" className="h-32 w-full object-cover rounded-xl" />
                      <button type="button" onClick={() => removeNewImage(index)} className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full text-lg leading-none">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <textarea name="details" placeholder="Тайлбар" value={formData.details} onChange={handleChange} className="w-full border p-4 rounded-xl h-40" required />

            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl hover:bg-indigo-700 text-lg font-semibold">
              Мэдээлэл шинэчлэх
            </button>
          </form>
        </div>
      </div>

      {/* Location modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-[90%] max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Байршил сонгох</h2>
              <button onClick={() => setShowLocationModal(false)} className="text-3xl">×</button>
            </div>
            <div className="grid grid-cols-3 gap-5">
              <button type="button" className="w-full bg-yellow-200 p-4 rounded-xl text-left font-medium">
                Улаанбаатар
              </button>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {districts.map((d) => (
                  <button key={d} type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, city: "Улаанбаатар", district: d, khoroo: "" }))}
                    className={`w-full p-3 rounded-xl text-left ${formData.district === d ? "bg-yellow-200" : "bg-gray-100"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {khoroos.map((k) => (
                  <button key={k} type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, khoroo: k }))}
                    className={`w-full p-3 rounded-xl text-left ${formData.khoroo === k ? "bg-yellow-200" : "bg-gray-100"}`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" onClick={() => setShowLocationModal(false)} className="mt-6 w-full bg-yellow-400 py-4 rounded-xl font-bold">
              Үргэлжлүүлэх
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditProperty;