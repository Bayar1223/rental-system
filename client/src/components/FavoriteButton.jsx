import { useState } from "react";
import api from "../api/axiosInstance";

/**
 * Дахин ашиглах зүрхэн товч.
 * props:
 *   propertyId   — заавал
 *   initial      — эхний төлөв (хадгалсан эсэх). Эцэг компонент мэддэг бол дамжуул.
 *   size         — px (default 38)
 *   onToggle     — (favorited) => void  // эцэг жагсаалтаас хасах гэх мэт
 *   floating     — true бол карт дээр絶 байрлах absolute загвар
 */
export default function FavoriteButton({
  propertyId,
  initial = false,
  size = 38,
  onToggle,
  floating = true,
}) {
  const [favorited, setFavorited] = useState(initial);
  const [busy, setBusy] = useState(false);

  // initial проп өөрчлөгдвөл дагана (жагсаалт дахин татагдах үед).
  // Effect биш — render үед өмнөх утгыг харьцуулна (cascading render-ээс зайлсхийнэ).
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setFavorited(initial);
  }

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    const next = !favorited;
    setFavorited(next); // optimistic
    setBusy(true);
    try {
      const res = await api.post(`/api/favorites/${propertyId}`);
      const real = res.data?.favorited ?? next;
      setFavorited(real);
      onToggle?.(real);
    } catch {
      setFavorited(!next); // алдаа гарвал буцаах
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={favorited ? "Хадгалснаас хасах" : "Хадгалах"}
      title={favorited ? "Хадгалснаас хасах" : "Хадгалах"}
      className={`flex items-center justify-center transition-all duration-300 ${
        floating ? "absolute top-3 right-3 z-10" : ""
      }`}
      style={{
        width: size,
        height: size,
        background: floating ? "rgba(10,10,10,0.55)" : "transparent",
        backdropFilter: floating ? "blur(4px)" : "none",
        border: `1px solid ${favorited ? "#C9A84C" : "rgba(255,255,255,0.25)"}`,
        cursor: busy ? "default" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!favorited) e.currentTarget.style.borderColor = "#C9A84C";
      }}
      onMouseLeave={(e) => {
        if (!favorited) e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
      }}
    >
      <svg
        width={size * 0.45}
        height={size * 0.45}
        viewBox="0 0 24 24"
        fill={favorited ? "#C9A84C" : "none"}
        stroke={favorited ? "#C9A84C" : "rgba(255,255,255,0.8)"}
        strokeWidth="1.6"
        style={{ transition: "all 0.3s ease" }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        />
      </svg>
    </button>
  );
}