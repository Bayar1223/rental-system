import { Link } from "react-router-dom";

function PropertyCard({ property }) {
  const image =
    property.images && property.images.length > 0
      ? property.images[0]
      : "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <img src={image} alt={property.title} className="h-64 w-full object-cover" />

      <div className="p-5">
        <h3 className="text-2xl font-semibold">{property.title}</h3>

        <p className="text-gray-500 mt-2">
          {property.location?.city}, {property.location?.district}
        </p>

        <p className="text-gray-500 mt-1">
          {property.rooms} өрөө • {property.area} м²
        </p>

        <p className="text-indigo-600 font-bold text-xl mt-4">
          {property.monthlyRent?.toLocaleString()}₮/сар
        </p>

        <Link to={`/properties/${property._id}`}>
          <button className="mt-5 w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700">
            Дэлгэрэнгүй
          </button>
        </Link>
      </div>
    </div>
  );
}

export default PropertyCard;