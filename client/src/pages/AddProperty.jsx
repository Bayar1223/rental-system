import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

function AddProperty() {
  const navigate = useNavigate();

  const years = Array.from({ length: 40 }, (_, i) => 2026 - i);
  const numbers = Array.from({ length: 30 }, (_, i) => i + 1);

  const districts = [
    "Багануур",
    "Багахангай",
    "Баянгол",
    "Баянзүрх",
    "Налайх",
    "Сонгинохайрхан",
    "Сүхбаатар",
    "Хан-Уул",
    "Чингэлтэй",
  ];

  const khoroos = Array.from({ length: 30 }, (_, i) => `${i + 1}-р хороо`);

  const initialFormData = {
    title: "",
    city: "Улаанбаатар",
    district: "",
    khoroo: "",
    address: "",
    rooms: "",
    balconyCount: "",
    doorType: "",
    garageInfo: "",
    windowType: "",
    floorMaterial: "",
    area: "",
    windowCount: "",
    floorNumber: "",
    builtYear: "",
    totalFloors: "",
    paymentConditionText: "",
    monthlyRent: "",
    details: "",
    isFurnished: "",
    hasOutdoorParking: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const selectedLocation = `${formData.city}${
    formData.district ? " — " + formData.district : ""
  }${formData.khoroo ? " — " + formData.khoroo : ""}`;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    const previewImages = files.map((file) => URL.createObjectURL(file));
    setImages(previewImages);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();

      data.append("title", formData.title);
      data.append("description", formData.details);

      data.append("location[city]", formData.city);
      data.append("location[district]", formData.district);
      data.append("location[address]", `${formData.khoroo} ${formData.address}`);

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

      imageFiles.forEach((file) => {
        data.append("images", file);
      });

      const response = await api.post("/api/properties", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const propertyId = response.data.property?._id || response.data._id;

      alert("Байрны мэдээлэл амжилттай орууллаа");
      navigate(`/properties/${propertyId}`);
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Алдаа гарлаа");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-4xl font-bold mb-8">
            Байрны мэдээлэл оруулах
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              className="w-full bg-gray-100 border p-4 rounded-xl text-left font-semibold"
            >
              Байршил: {selectedLocation}
            </button>

            <input
              name="title"
              placeholder="Зарын гарчиг"
              value={formData.title}
              onChange={handleChange}
              className="w-full border p-4 rounded-xl"
              required
            />

            <input
              name="address"
              placeholder="Дэлгэрэнгүй хаяг /байр, хотхон, гудамж/"
              value={formData.address}
              onChange={handleChange}
              className="w-full border p-4 rounded-xl"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <select
                name="rooms"
                value={formData.rooms}
                onChange={handleChange}
                className="border p-4 rounded-xl"
                required
              >
                <option value="">Өрөө сонгох</option>
                <option value="1">1 өрөө</option>
                <option value="2">2 өрөө</option>
                <option value="3">3 өрөө</option>
                <option value="4">4 өрөө</option>
                <option value="5">5+ өрөө</option>
              </select>

              <select
                name="balconyCount"
                value={formData.balconyCount}
                onChange={handleChange}
                className="border p-4 rounded-xl"
              >
                <option value="">Тагт сонгох</option>
                <option value="0">Тагтгүй</option>
                <option value="1">1 тагттай</option>
                <option value="2">2 тагттай</option>
                <option value="3">3+ тагттай</option>
              </select>

              <select
                name="doorType"
                value={formData.doorType}
                onChange={handleChange}
                className="border p-4 rounded-xl"
              >
                <option value="">Хаалга сонгох</option>
                <option value="Мод">Мод</option>
                <option value="Төмөр">Төмөр</option>
                <option value="Бүргэд">Бүргэд</option>
                <option value="Вакум">Вакум</option>
              </select>

              <select
                name="garageInfo"
                value={formData.garageInfo}
                onChange={handleChange}
                className="border p-4 rounded-xl"
              >
                <option value="">Гараж сонгох</option>
                <option value="Байгаа">Байгаа</option>
                <option value="Байхгүй">Байхгүй</option>
              </select>

              <select
                name="windowType"
                value={formData.windowType}
                onChange={handleChange}
                className="border p-4 rounded-xl"
              >
                <option value="">Цонх сонгох</option>
                <option value="Мод">Мод</option>
                <option value="Вакум">Вакум</option>
                <option value="Төмөр вакум">Төмөр вакум</option>
                <option value="Модон вакум">Модон вакум</option>
              </select>

              <select
                name="floorMaterial"
                value={formData.floorMaterial}
                onChange={handleChange}
                className="border p-4 rounded-xl"
              >
                <option value="">Шал сонгох</option>
                <option value="Мод">Мод</option>
                <option value="Паркет">Паркет</option>
                <option value="Ламинат">Ламинат</option>
                <option value="Чулуу">Чулуу</option>
                <option value="Плита">Плита</option>
              </select>

              <input
                name="area"
                inputMode="numeric"
                placeholder="Талбай м²"
                value={formData.area}
                onChange={handleChange}
                className="border p-4 rounded-xl"
                required
              />

              <select
                name="windowCount"
                value={formData.windowCount}
                onChange={handleChange}
                className="border p-4 rounded-xl"
              >
                <option value="">Цонхны тоо</option>
                {numbers.slice(0, 10).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              <select
                name="floorNumber"
                value={formData.floorNumber}
                onChange={handleChange}
                className="border p-4 rounded-xl"
              >
                <option value="">Хэдэн давхарт</option>
                {numbers.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              <select
                name="builtYear"
                value={formData.builtYear}
                onChange={handleChange}
                className="border p-4 rounded-xl"
              >
                <option value="">Ашиглалтад орсон он</option>
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              <select
                name="totalFloors"
                value={formData.totalFloors}
                onChange={handleChange}
                className="border p-4 rounded-xl"
              >
                <option value="">Барилгын давхар</option>
                {numbers.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              <select
                name="paymentConditionText"
                value={formData.paymentConditionText}
                onChange={handleChange}
                className="border p-4 rounded-xl"
              >
                <option value="">Төлбөрийн нөхцөл</option>
                <option value="Барьцаа байхгүй">Барьцаа байхгүй</option>
                <option value="1+1">1+1</option>
                <option value="2+1">2+1</option>
                <option value="3+1">3+1</option>
                <option value="4+1">4+1</option>
                <option value="5+1">5+1</option>
                <option value="6+1">6+1</option>
                <option value="12+1">12+1</option>
              </select>

              <select
                name="isFurnished"
                value={formData.isFurnished}
                onChange={handleChange}
                className="border p-4 rounded-xl"
                required
              >
                <option value="">Тавилга сонгох</option>
                <option value="Тавилгатай">Тавилгатай</option>
                <option value="Тавилгагүй">Тавилгагүй</option>
              </select>

              <select
                name="hasOutdoorParking"
                value={formData.hasOutdoorParking}
                onChange={handleChange}
                className="border p-4 rounded-xl"
                required
              >
                <option value="">Гадна зогсоол сонгох</option>
                <option value="Байгаа">Байгаа</option>
                <option value="Байхгүй">Байхгүй</option>
              </select>
            </div>

            <input
              name="monthlyRent"
              inputMode="numeric"
              placeholder="Үнэ ₮"
              value={formData.monthlyRent}
              onChange={handleChange}
              className="w-full border p-4 rounded-xl"
              required
            />

            <div>
              <h2 className="text-2xl font-bold mb-4">
                Холбоо барих мэдээлэл
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <input
                  name="contactName"
                  placeholder="Нэр"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="border p-4 rounded-xl"
                  required
                />

                <input
                  name="contactPhone"
                  placeholder="Утасны дугаар"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="border p-4 rounded-xl"
                  required
                />

                <input
                  name="contactEmail"
                  placeholder="Имэйл"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="border p-4 rounded-xl"
                />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Зурагнууд</h2>

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-10 cursor-pointer hover:border-indigo-500 transition">
                <span className="text-lg text-gray-600 mb-2">Зургаа сонгох</span>
                <span className="text-sm text-gray-400">
                  Нэг болон түүнээс дээш зураг сонгож болно
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {images.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img}
                        alt="preview"
                        className="h-40 w-full object-cover rounded-2xl"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <textarea
              name="details"
              placeholder="Тайлбар"
              value={formData.details}
              onChange={handleChange}
              className="w-full border p-4 rounded-xl h-48"
              required
            />

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-4 rounded-xl hover:bg-indigo-700 text-lg font-semibold"
            >
              Байрны мэдээлэл оруулах
            </button>
          </form>
        </div>
      </div>

      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-[90%] max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">Байршил сонгох</h2>
              <button onClick={() => setShowLocationModal(false)} className="text-3xl">×</button>
            </div>

            <div className="grid grid-cols-3 gap-5">
              <button type="button" className="w-full bg-yellow-200 p-4 rounded-xl text-left">
                Улаанбаатар
              </button>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {districts.map((district) => (
                  <button
                    key={district}
                    type="button"
                    onClick={() => setFormData({ ...formData, city: "Улаанбаатар", district, khoroo: "" })}
                    className={`w-full p-3 rounded-xl text-left ${
                      formData.district === district ? "bg-yellow-200" : "bg-gray-100"
                    }`}
                  >
                    {district}
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {khoroos.map((khoroo) => (
                  <button
                    key={khoroo}
                    type="button"
                    onClick={() => setFormData({ ...formData, khoroo })}
                    className={`w-full p-3 rounded-xl text-left ${
                      formData.khoroo === khoroo ? "bg-yellow-200" : "bg-gray-100"
                    }`}
                  >
                    {khoroo}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLocationModal(false)}
              className="mt-8 w-full bg-yellow-400 py-4 rounded-xl font-bold"
            >
              Үргэлжлүүлэх
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddProperty;