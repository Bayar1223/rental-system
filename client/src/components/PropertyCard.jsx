import { Link } from "react-router-dom";

function PropertyCard({ property, index = 0 }) {
  const image = property.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";
  const isAvailable = property.status === "available";

  return (
    <Link to={`/properties/${property._id}`} className="block group">
      <article className="luxury-card animate-fadeUp" style={{ animationDelay: `${index * 0.08}s` }}>

        {/* Image */}
        <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
          <img src={image} alt={property.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

          {/* Status badge */}
          <div className="absolute top-3 left-3">
            {isAvailable
              ? <span className="badge-gold">Боломжтой</span>
              : <span className="badge-ink">Түрээслэгдсэн</span>}
          </div>

          {/* Image count */}
          {property.images?.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 font-light tracking-widest">
              +{property.images.length - 1}
            </div>
          )}

          {/* Hover CTA */}
          <div className="absolute inset-0 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <span className="bg-[var(--gold)] text-[var(--ink)] text-xs font-medium tracking-widest uppercase px-6 py-2.5">
              Дэлгэрэнгүй
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Tags */}
          <div className="flex gap-2 mb-3">
            <span className="badge-outline">{property.rooms} өрөө</span>
            <span className="badge-outline">{property.area} м²</span>
            {property.isFurnished && <span className="badge-outline">Тавилгатай</span>}
          </div>

          {/* Title */}
          <h3 className="font-display text-lg font-light leading-snug text-[var(--ink)] mb-1 line-clamp-1 group-hover:text-[var(--gold-dark)] transition-colors">
            {property.title}
          </h3>

          {/* Location */}
          <p className="text-xs text-[var(--text-muted)] tracking-wide mb-4 flex items-center gap-1">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="flex-shrink-0">
              <path strokeLinecap="round" d="M12 21c0 0-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z" />
              <circle cx="12" cy="10" r="2" />
            </svg>
            {property.location?.district}, {property.location?.city}
          </p>

          {/* Gold divider */}
          <div className="h-px mb-4" style={{ background: "linear-gradient(90deg, var(--gold-light), transparent)" }} />

          {/* Price */}
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-display text-2xl font-light text-[var(--ink)]">
                {property.monthlyRent?.toLocaleString()}
              </span>
              <span className="text-xs text-[var(--text-muted)] ml-1">₮/сар</span>
            </div>
            {property.paymentConditionText && (
              <span className="text-xs text-[var(--text-soft)]">{property.paymentConditionText}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export default PropertyCard;