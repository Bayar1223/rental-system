import { Link } from "react-router-dom";

function PropertyCard({ property, index = 0 }) {
  const image = property.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";
  const isAvailable = property.status === "available";

  return (
    <Link to={`/properties/${property._id}`} className="block group">
      <article className="luxury-card animate-fadeUp" style={{ animationDelay: `${index * 0.07}s` }}>

        {/* IMAGE */}
        <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
          <img
            src={image}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            style={{ filter: "brightness(0.85)" }}
          />

          {/* Dark overlay gradient */}
          <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{
              background: "linear-gradient(to top, rgba(8,8,8,0.8) 0%, rgba(8,8,8,0.2) 50%, transparent 100%)",
            }}
          />

          {/* Gold overlay on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
            style={{ background: "rgba(201,160,80,0.06)" }}
          />

          {/* Status */}
          <div className="absolute top-4 left-4">
            {isAvailable
              ? <span className="badge-gold">Боломжтой</span>
              : <span className="badge-dark">Түрээслэгдсэн</span>}
          </div>

          {/* Image count */}
          {property.images?.length > 1 && (
            <div
              className="absolute top-4 right-4"
              style={{
                fontFamily: "'Montserrat'",
                fontSize: 9,
                fontWeight: 400,
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.7)",
                background: "rgba(0,0,0,0.5)",
                padding: "3px 8px",
              }}
            >
              +{property.images.length - 1}
            </div>
          )}

          {/* Price on hover overlay */}
          <div
            className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
          >
            <span
              className="font-display"
              style={{ fontSize: 28, fontWeight: 300, color: "var(--white)", lineHeight: 1 }}
            >
              {property.monthlyRent?.toLocaleString()}
            </span>
            <span style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "rgba(255,255,255,0.5)", marginLeft: 4 }}>
              ₮/сар
            </span>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ padding: "20px 20px 24px" }}>
          {/* Tags */}
          <div className="flex gap-2 mb-3">
            <span className="badge-dark">{property.rooms} өрөө</span>
            <span className="badge-dark">{property.area}м²</span>
            {property.isFurnished && <span className="badge-dark">Тавилгатай</span>}
          </div>

          {/* Title */}
          <h3
            className="font-display leading-snug mb-1 line-clamp-1 transition-colors duration-200 group-hover:text-gold"
            style={{ fontSize: 20, fontWeight: 400, color: "var(--white)" }}
          >
            {property.title}
          </h3>

          {/* Location */}
          <p
            className="flex items-center gap-1.5 mb-4"
            style={{ fontFamily: "'Montserrat'", fontSize: 9, fontWeight: 400, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}
          >
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="flex-shrink-0">
              <path strokeLinecap="round" d="M12 21c0 0-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z" />
              <circle cx="12" cy="10" r="2" />
            </svg>
            {property.location?.district}, {property.location?.city}
          </p>

          {/* Gold line */}
          <div className="divider-gold mb-4" />

          {/* Price */}
          <div className="flex items-baseline justify-between">
            <div>
              <span
                className="font-display"
                style={{ fontSize: 26, fontWeight: 300, color: "var(--white)" }}
              >
                {property.monthlyRent?.toLocaleString()}
              </span>
              <span style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--text-muted)", marginLeft: 4 }}>
                ₮/сар
              </span>
            </div>
            {property.paymentConditionText && (
              <span style={{ fontFamily: "'Montserrat'", fontSize: 9, color: "var(--text-soft)" }}>
                {property.paymentConditionText}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export default PropertyCard;