import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/properties/${id}`
        );
        setProperty(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchProperty();
  }, [id]);

  if (!property) {
    return <p className="p-10">Ачааллаж байна...</p>;
  }

  const images =
    property.images && property.images.length > 0
      ? property.images
      : ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"];

  const ownerId =
    typeof property.owner === "object" ? property.owner?._id : property.owner;

  const currentUserId = currentUser?._id || currentUser?.id;

  const isOwner =
    currentUserId && ownerId && String(currentUserId) === String(ownerId);

  const fullAddress = `${property.location?.city || ""} ${
    property.location?.district || ""
  } ${property.location?.address || ""}`;

  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    fullAddress
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const handleApply = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Эхлээд нэвтэрнэ үү");
      navigate("/login");
      return;
    }

    if (isOwner) {
      alert("Өөрийн байр дээр хүсэлт илгээх боломжгүй");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/applications",
        {
          propertyId: property._id,
          startDate: new Date(),
          leaseMonths: 6,
          message: "Сайн байна уу. Энэ байрыг түрээслэх хүсэлтэй байна.",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Хүсэлт амжилттай илгээгдлээ");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Алдаа гарлаа");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-8 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="bg-white px-5 py-3 rounded-xl shadow hover:bg-gray-100"
        >
          ← Буцах
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-8">
        <img
          src={images[0]}
          alt={property.title}
          onClick={() => setSelectedImageIndex(0)}
          className="w-full h-[450px] object-cover rounded-3xl shadow cursor-pointer"
        />

        {images.length > 1 && (
          <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
            {images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`property-${index}`}
                onClick={() => setSelectedImageIndex(index)}
                className="w-28 h-20 object-cover rounded-xl cursor-pointer border hover:border-indigo-600"
              />
            ))}
          </div>
        )}

        <div className="bg-white mt-8 p-8 rounded-3xl shadow">
          <h1 className="text-4xl font-bold mb-4">{property.title}</h1>

          <p className="text-gray-600 text-lg mb-4">
            {property.location?.city}, {property.location?.district},{" "}
            {property.location?.address}
          </p>

          <p className="text-indigo-600 text-3xl font-bold mb-6">
            {property.monthlyRent?.toLocaleString()}₮/сар
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <Info label="Өрөө" value={property.rooms} />
            <Info label="Талбай" value={`${property.area} м²`} />
            <Info label="Түрээсийн нөхцөл" value={property.paymentConditionText} />
            <Info label="Давхар" value={`${property.floorNumber || "-"} / ${property.totalFloors || "-"}`} />
            <Info label="Ашиглалтад орсон он" value={property.builtYear} />
            <Info label="Тагт" value={property.balconyCount} />
            <Info label="Цонх" value={`${property.windowCount || "-"} ширхэг • ${property.windowType || "-"}`} />
            <Info label="Шал" value={property.floorMaterial} />
            <Info label="Хаалга" value={property.doorType} />
            <Info label="Гараж" value={property.garageInfo} />
            <Info label="Тавилга" value={property.isFurnished ? "Тавилгатай" : "Тавилгагүй"} />
            <Info label="Гадна зогсоол" value={property.hasOutdoorParking ? "Байгаа" : "Байхгүй"} />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-3">Газрын зураг</h2>
            <iframe
              title="map"
              src={mapUrl}
              className="w-full h-80 rounded-2xl border"
              loading="lazy"
            ></iframe>
          </div>

          {property.details && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-3">Дэлгэрэнгүй мэдээлэл</h2>
              <p className="text-gray-700 leading-7 whitespace-pre-line">
                {property.details}
              </p>
            </div>
          )}

          <div className="mb-8 bg-indigo-50 p-6 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">Ландлордтой холбогдох</h2>

            <p className="mb-2">
              <span className="font-semibold">Нэр:</span>{" "}
              {property.contactName || property.owner?.firstName}
            </p>

            <p className="mb-2">
              <span className="font-semibold">Утас:</span>{" "}
              {property.contactPhone || property.owner?.phone}
            </p>

            <p>
              <span className="font-semibold">Имэйл:</span>{" "}
              {property.contactEmail || property.owner?.email}
            </p>
          </div>

          {isOwner ? (
            <div className="w-full bg-gray-200 text-gray-700 py-4 rounded-xl text-center text-lg font-semibold">
              Энэ таны оруулсан байр байна
            </div>
          ) : (
            <button
              onClick={handleApply}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl hover:bg-indigo-700 text-lg"
            >
              Түрээслэх хүсэлт илгээх
            </button>
          )}
        </div>
      </div>

      {selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-6 right-8 text-white text-5xl"
          >
            ×
          </button>

          <button
            onClick={() =>
              setSelectedImageIndex(
                selectedImageIndex === 0
                  ? images.length - 1
                  : selectedImageIndex - 1
              )
            }
            className="absolute left-6 text-white text-6xl"
          >
            ‹
          </button>

          <img
            src={images[selectedImageIndex]}
            alt="preview"
            className="max-w-[85%] max-h-[85%] object-contain rounded-xl"
          />

          <button
            onClick={() =>
              setSelectedImageIndex(
                selectedImageIndex === images.length - 1
                  ? 0
                  : selectedImageIndex + 1
              )
            }
            className="absolute right-6 text-white text-6xl"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-gray-100 p-4 rounded-xl">
      <p className="text-gray-500">{label}</p>
      <p className="font-bold">{value || "-"}</p>
    </div>
  );
}

export default PropertyDetail;