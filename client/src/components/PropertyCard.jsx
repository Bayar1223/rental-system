import { Link } from "react-router-dom";

function PropertyCard({ property }) {
  const image =
    property.images && property.images.length > 0
      ? property.images[0]
      : "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";

  const statusConfig = {
    available: { label: "Боломжтой", cls: "bg-green-100 text-green-700" },
    rented:    { label: "Түрээслэгдсэн", cls: "bg-blue-100 text-blue-700" },
    inactive:  { label: "Идэвхгүй", cls: "bg-gray-100 text-gray-500" },
  };
  const status = statusConfig[property.status] || statusConfig.available;

  return (
    <Link to={`/properties/${property._id}`}>
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 hover:-translate-y-1">

        {/* Зураг */}
        <div className="relative overflow-hidden h-52">
          <img
            src={image}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Статус badge */}
          <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${status.cls}`}>
            {status.label}
          </span>

          {/* Зургийн тоо */}
          {property.images?.length > 1 && (
            <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              +{property.images.length - 1} зураг
            </span>
          )}
        </div>

        {/* Мэдээлэл */}
        <div className="p-4">

          {/* Гарчиг */}
          <h3 className="font-bold text-gray-900 text-lg leading-snug line-clamp-1 mb-1">
            {property.title}
          </h3>

          {/* Байршил */}
          <p className="text-gray-500 text-sm flex items-center gap-1 mb-3">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {property.location?.district}, {property.location?.city}
          </p>

          {/* Үзүүлэлтүүд */}
          <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {property.rooms} өрөө
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              {property.area} м²
            </span>
            {property.floorNumber && (
              <>
                <span className="text-gray-300">•</span>
                <span>{property.floorNumber} давхар</span>
              </>
            )}
          </div>

          {/* Нэмэлт шинж */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {property.isFurnished && (
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">
                Тавилгатай
              </span>
            )}
            {property.hasOutdoorParking && (
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">
                Зогсоолтой
              </span>
            )}
            {property.balconyCount > 0 && (
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">
                Тагттай
              </span>
            )}
            {property.paymentConditionText && (
              <span className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg">
                {property.paymentConditionText}
              </span>
            )}
          </div>

          {/* Үнэ */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <span className="text-2xl font-bold text-indigo-600">
                {property.monthlyRent?.toLocaleString()}₮
              </span>
              <span className="text-gray-400 text-sm">/сар</span>
            </div>
            <span className="text-sm text-indigo-600 font-medium group-hover:underline">
              Дэлгэрэнгүй →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default PropertyCard;