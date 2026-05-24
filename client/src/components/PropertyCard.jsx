import { Link } from "react-router-dom";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80";

function PropertyCard({ property }) {
  const {
    _id,
    title,
    rooms,
    size,
    status = "available",
  } = property;

  // Schema defensive reading — шинэ field эсвэл хуучин field-ийг хоёуланг авна
  const photos = property.photos?.length
    ? property.photos
    : property.images?.length
      ? property.images
      : [];
  const district =
    property.district || property.location?.district || "";
  const address =
    property.address || property.location?.address || "";
  const price = property.price ?? property.monthlyRent ?? 0;

  const cover = photos[0] || PLACEHOLDER;
  const isAvailable = status === "available";
  const formattedPrice = new Intl.NumberFormat("mn-MN").format(price);

  return (
    <Link
      to={`/properties/${_id}`}
      className="group relative block overflow-hidden transition-all duration-500"
      style={{
        background: "#141414",
        border: "1px solid rgba(201,168,76,0.1)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "rgba(201,168,76,0.1)")
      }
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={cover}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-110"
          style={{ filter: "brightness(0.88)" }}
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER;
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, transparent 50%, rgba(10,10,10,0.7) 100%)",
          }}
        />

        {/* Status badge */}
        <div
          className="absolute top-4 left-4 px-3 py-1.5 text-[10px] tracking-[0.25em] uppercase"
          style={{
            background: isAvailable
              ? "rgba(201,168,76,0.95)"
              : "rgba(10,10,10,0.75)",
            color: isAvailable ? "#0A0A0A" : "rgba(255,255,255,0.7)",
            border: isAvailable
              ? "none"
              : "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(4px)",
          }}
        >
          {isAvailable ? "Боломжтой" : "Түрээслэгдсэн"}
        </div>

        {/* Photo count indicator */}
        {photos.length > 1 && (
          <div
            className="absolute top-4 right-4 px-2.5 py-1 text-[10px] tracking-[0.15em] uppercase flex items-center gap-1.5"
            style={{
              background: "rgba(10,10,10,0.6)",
              color: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(4px)",
            }}
          >
            <span style={{ color: "#C9A84C" }}>◇</span>
            {photos.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3">
          {district || "Улаанбаатар"}
        </div>

        <h3
          className="text-white text-2xl font-light mb-2 leading-tight transition-colors duration-300 group-hover:text-[#E8D49E]"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {title}
        </h3>

        <p className="text-xs text-white/40 mb-5 truncate">
          {address || "—"}
        </p>

        <div
          className="flex items-end justify-between pt-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div>
            <div
              className="font-light leading-none mb-1"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "#C9A84C",
                fontSize: 26,
              }}
            >
              {formattedPrice}₮
            </div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-white/30">
              / сар
            </div>
          </div>

          <div className="flex gap-4 text-xs text-white/55">
            {rooms != null && (
              <div className="flex items-center gap-1.5">
                <span style={{ color: "#C9A84C" }}>◇</span>
                {rooms} өрөө
              </div>
            )}
            {size != null && (
              <div className="flex items-center gap-1.5">
                <span style={{ color: "#C9A84C" }}>◇</span>
                {size}м²
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hover arrow */}
      <div
        className="absolute bottom-6 right-6 w-9 h-9 flex items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100"
        style={{
          background: "#C9A84C",
          color: "#0A0A0A",
        }}
      >
        →
      </div>
    </Link>
  );
}

export default PropertyCard;