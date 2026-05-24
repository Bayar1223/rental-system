import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";

/* ═══════════════════════════════════════════════════════════
   ⚠️  HERO VIDEO CONFIG — ӨӨРИЙН ВИДЕО URL-ыг ЭНД БИЧНЭ ҮҮ
   ═══════════════════════════════════════════════════════════
   Сонголтууд:
   1. Cloudinary дээр өөрийн apartment видеогоо upload хийгээд URL-ыг тавих (хамгийн оновчтой)
      Жишээ: https://res.cloudinary.com/<cloud>/video/upload/v.../apartment.mp4
   2. Mixkit/Coverr-н үнэгүй stock video URL
   3. Видео хадгалагдаагүй бол fallback зураг автоматаар харагдана
*/
const HERO_VIDEO =
  "https://assets.mixkit.co/videos/preview/mixkit-luxury-house-with-modern-architecture-4035-large.mp4";
const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&q=85&auto=format&fit=crop";

const PROPERTY_FALLBACK =
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=70";

/* Hero tagline 3 мессеж — Monte Carlo стилээр ээлжлэн харагдана */
const TAGLINES = [
  "Улаанбаатарын зүрхэнд",
  "Шилдгүүдээс шалгарсан байрууд",
  "24/7 хувийн үйлчилгээ",
];

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = "", delay = 0 }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  // User-ийг нэг л удаа parse хийнэ (render тутамд биш)
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [heroVisible, setHeroVisible] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef(null);

  // ── Нэвтэрсэн бол /home рүү ──
  useEffect(() => {
    if (user) navigate("/home");
  }, [user, navigate]);

  // ── Hero нэвтрэлт (setTimeout-д cleanup нэмсэн) ──
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // ── Tagline rotator (cleanup байгаа) ──
  useEffect(() => {
    const t = setInterval(
      () => setTaglineIndex((i) => (i + 1) % TAGLINES.length),
      5500
    );
    return () => clearInterval(t);
  }, []);

  // ── Featured properties (cancelled flag pattern) ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.get("/api/properties", { params: { limit: 6 } });
        if (cancelled) return;
        const list = r.data?.properties || r.data || [];
        setFeaturedProperties(list.slice(0, 6));
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToFleet = () => {
    document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
      {/* ═══════════════════════════════════════════════════════════
          NAVIGATION (top-bar) — minimal Monte Carlo style
          ⚠️  ЗААВАЛ ЛЭ: App.jsx-д "/" route-д global Navbar-ыг
          render хийхгүй байх ёстой, эс бөгөөс хоёр navbar давхрагдана.
          ═══════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ height: 72 }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rotate-45" style={{ border: "1px solid var(--gold)" }} />
              <div className="absolute inset-[7px] rotate-45" style={{ background: "var(--gold)" }} />
            </div>
            <span className="font-display text-2xl tracking-wider text-white">
              Rental
              <span style={{ color: "var(--gold)", fontStyle: "italic" }}>Sy</span>
            </span>
          </Link>

          {/* Center anchor nav */}
          <div className="hidden lg:flex items-center gap-8">
            {[
              { label: "Эхлэл", to: "#hero" },
              { label: "Бидний тухай", to: "#about" },
              { label: "Цуглуулга", to: "#collection" },
              { label: "Үнэлгээ", to: "#values" },
              { label: "Холбоо", to: "#contact" },
            ].map(({ label, to }) => (
              <a
                key={to}
                href={to}
                className="text-white/70 hover:text-[var(--gold)] transition-colors"
                style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase" }}
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex text-white/70 hover:text-[var(--gold)] transition-colors"
              style={{
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                padding: "10px 16px",
              }}
            >
              Нэвтрэх
            </Link>
            <Link to="/register" className="btn-gold" style={{ fontSize: 10, padding: "12px 24px" }}>
              Бүртгүүлэх
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════
          HERO — Full-screen video + rotating tagline
          ═══════════════════════════════════════════════════════════ */}
      <section
        id="hero"
        className="relative w-full overflow-hidden"
        style={{ height: "100vh", minHeight: 720 }}
      >
        {/* Video / fallback image */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${HERO_FALLBACK})`,
              opacity: videoLoaded ? 0 : 1,
            }}
          />
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={() => setVideoLoaded(true)}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            style={{ opacity: videoLoaded ? 1 : 0 }}
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.75) 100%)",
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <div
            className={`flex items-center gap-4 mb-10 transition-all duration-1000 ${heroVisible ? "opacity-100" : "opacity-0"}`}
          >
            <div className="h-px w-12" style={{ background: "var(--gold)" }} />
            <span className="mc-eyebrow">Улаанбаатар · 2026</span>
            <div className="h-px w-12" style={{ background: "var(--gold)" }} />
          </div>

          <div className="h-32 md:h-40 flex items-center justify-center mb-4">
            <h1
              key={taglineIndex}
              className="mc-heading hero-tagline text-white"
              style={{ fontSize: "clamp(40px, 7vw, 88px)" }}
            >
              {TAGLINES[taglineIndex]}
            </h1>
          </div>

          <p
            className={`max-w-xl mx-auto text-white/65 font-light mb-12 leading-relaxed transition-all duration-1000 delay-300 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ fontSize: 15 }}
          >
            Орон сууцыг онлайнаар хайж, гэрээгээ цахимаар байгуулна.
            Найдвартай, мэргэжлийн үйлчилгээ.
          </p>

          <div
            className={`flex flex-wrap items-center justify-center gap-4 transition-all duration-1000 delay-500 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <button onClick={scrollToFleet} className="btn-outline-gold">
              Цуглуулга үзэх
            </button>
            <Link to="/register" className="btn-gold">
              Үнэгүй эхлэх
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" d="M5 12h14m-7-7l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <button
            onClick={scrollToFleet}
            className={`absolute bottom-12 left-1/2 -translate-x-1/2 transition-all duration-1000 delay-700 ${heroVisible ? "opacity-100" : "opacity-0"}`}
            aria-label="Доош гүйлгэх"
          >
            <div className="scroll-indicator" />
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ABOUT — large typography + signature
          ═══════════════════════════════════════════════════════════ */}
      <section
        id="about"
        className="py-32 px-6 lg:px-16"
        style={{ background: "var(--bg-secondary)" }}
      >
        <div className="max-w-5xl mx-auto">
          <RevealSection className="text-center mb-12">
            <p className="mc-eyebrow mb-6">Бидний тухай</p>
            <h2
              className="mc-heading text-white mb-10"
              style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
            >
              Орон сууц олох<br />
              <span style={{ color: "var(--gold)", fontStyle: "italic" }}>шинэ стандарт</span>
            </h2>
            <div className="gold-line-static w-40 mx-auto mb-10" />
          </RevealSection>

          <RevealSection delay={0.2}>
            <p
              className="text-center font-light leading-loose mb-6"
              style={{
                fontSize: 17,
                maxWidth: 760,
                margin: "0 auto",
                color: "var(--text-secondary)",
              }}
            >
              <b className="text-white font-medium">RentalSy</b> бол Улаанбаатарын{" "}
              <b className="text-white font-medium">9 дүүргийн</b> орон сууц түрээсийн нэгдсэн
              платформ юм. Бид түрээслэгч, түрээслүүлэгч хоёрын хооронд найдвартай гүүр болж,
              орон сууцны хайлтаас цахим гэрээ хүртэлх бүх үе шатыг хялбарчилдаг.
            </p>
            <p
              className="text-center font-light leading-loose"
              style={{
                fontSize: 15,
                maxWidth: 720,
                margin: "0 auto",
                color: "var(--text-muted)",
              }}
            >
              Манай платформ дээр та байрны цуглуулгыг үзэх, газрын зураг дээр байршил
              шалгах, өргөдөл гаргах, цахим гэрээнд гарын үсэг зурах, сар бүрийн төлбөрөө
              хийх — энэ бүхнийг нэгдсэн орчинд гүйцэтгэх боломжтой.
            </p>
          </RevealSection>

          {/* Signature element */}
          <RevealSection delay={0.4} className="flex flex-col items-center mt-20">
            <svg width="180" height="60" viewBox="0 0 180 60" fill="none">
              <path
                d="M10 40 Q 30 10, 50 30 T 90 35 Q 110 20, 130 32 T 170 38"
                stroke="var(--gold)"
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M25 45 Q 40 38, 60 42 T 100 44"
                stroke="var(--gold)"
                strokeWidth="0.8"
                fill="none"
                strokeLinecap="round"
                opacity="0.6"
              />
            </svg>
            <div className="mt-3 text-center">
              <p className="text-white text-sm font-light tracking-wide">Б. Индра</p>
              <p
                className="text-xs tracking-widest uppercase mt-1"
                style={{ color: "var(--text-soft)" }}
              >
                Үүсгэн байгуулагч · Ерөнхий менежер
              </p>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          VALUES — 3 columns
          ═══════════════════════════════════════════════════════════ */}
      <section
        id="values"
        className="py-24 px-6 lg:px-16"
        style={{ background: "var(--bg-tertiary)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-0">
            {[
              {
                num: "01",
                title: "Улаанбаатарын зүрхэнд",
                desc: "9 дүүргийн бүх байр нэг платформ дээр",
              },
              {
                num: "02",
                title: "Шилдгүүдээс шалгарсан байрууд",
                desc: "Чанарын шаардлага хангасан байрууд",
              },
              {
                num: "03",
                title: "24/7 хувийн үйлчилгээ",
                desc: "Цаг алдалгүй мэргэжлийн дэмжлэг",
              },
            ].map(({ num, title, desc }, i) => (
              <RevealSection key={num} delay={i * 0.15}>
                <div
                  className="py-12 px-6 md:px-10 h-full flex flex-col"
                  style={{
                    borderLeft: i === 0 ? "1px solid var(--border-subtle)" : "none",
                    borderRight: "1px solid var(--border-subtle)",
                  }}
                >
                  <span className="stat-number text-5xl mb-6">{num}</span>
                  <div className="gold-line-static w-12 mb-6" />
                  <h3 className="font-display text-2xl text-white mb-4 leading-snug">
                    {title}
                  </h3>
                  <p
                    className="text-sm font-light leading-relaxed mb-8"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {desc}
                  </p>
                  <Link
                    to="/home"
                    className="mt-auto inline-flex items-center gap-2 hover:gap-3 transition-all"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "var(--gold)",
                    }}
                  >
                    Цуглуулга үзэх →
                  </Link>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          LATEST COLLECTION — Featured Properties
          ⚠️  API contract миний 17 файлтай нэгтгэсэн:
              p.photos (images биш), p.district, p.price, /property/:id
          ═══════════════════════════════════════════════════════════ */}
      <section
        id="collection"
        className="py-32 px-6 lg:px-16"
        style={{ background: "var(--bg-secondary)" }}
      >
        <div className="max-w-7xl mx-auto">
          <RevealSection className="text-center mb-16">
            <p className="mc-eyebrow mb-6">Шинэ нэмэгдсэн</p>
            <h2
              className="mc-heading text-white mb-6"
              style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
            >
              Сүүлийн{" "}
              <span style={{ color: "var(--gold)", fontStyle: "italic" }}>
                цуглуулга
              </span>
            </h2>
            <div className="gold-line-static w-40 mx-auto" />
          </RevealSection>

          {featuredProperties.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0">
              {featuredProperties.map((p, i) => (
                <RevealSection key={p._id} delay={i * 0.08}>
                  <Link to={`/properties/${p._id}`} className="block group h-full">
                    <article
                      className="h-full"
                      style={{
                        borderTop: "1px solid var(--border-subtle)",
                        borderBottom: "1px solid var(--border-subtle)",
                        borderRight:
                          (i + 1) % 3 !== 0 ? "1px solid var(--border-subtle)" : "none",
                        borderLeft:
                          i % 3 === 0 ? "1px solid var(--border-subtle)" : "none",
                      }}
                    >
                      <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
                        <img
                          src={p.photos?.[0] || p.images?.[0] || PROPERTY_FALLBACK}
                          alt={p.title}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          style={{ filter: "brightness(0.9)" }}
                          onError={(e) => (e.currentTarget.src = PROPERTY_FALLBACK)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
                        {p.rooms != null && (
                          <div className="absolute top-4 left-4">
                            <span className="badge-gold">{p.rooms} өрөө</span>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="font-display text-2xl text-white mb-2 line-clamp-1 group-hover:text-[var(--gold)] transition-colors">
                          {p.title}
                        </h3>
                        <p
                          className="text-xs tracking-wider uppercase mb-4"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {p.district || p.location?.district || "Улаанбаатар"}
                        </p>
                        <div className="gold-line-static mb-4" />
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="font-display text-2xl text-white">
                              {(p.price ?? p.monthlyRent ?? 0).toLocaleString("mn-MN")}
                            </span>
                            <span
                              className="text-xs ml-2"
                              style={{ color: "var(--text-muted)" }}
                            >
                              ₮/сар
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              letterSpacing: "0.22em",
                              textTransform: "uppercase",
                              color: "var(--gold)",
                            }}
                          >
                            Үзэх →
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                </RevealSection>
              ))}
            </div>
          ) : (
            <div
              className="text-center py-20"
              style={{ color: "var(--text-muted)" }}
            >
              Ачааллаж байна...
            </div>
          )}

          <div className="text-center mt-16">
            <Link to="/home" className="btn-outline-gold">
              Бүх байр үзэх
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STATS BANNER
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="py-24 px-6 lg:px-16"
        style={{ background: "var(--bg-tertiary)" }}
      >
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
              {[
                { num: "500+", label: "Идэвхтэй байр" },
                { num: "9", label: "Дүүрэг" },
                { num: "98%", label: "Сэтгэл ханамж" },
                { num: "24/7", label: "Дэмжлэг" },
              ].map(({ num, label }, i) => (
                <div
                  key={label}
                  className="text-center py-8"
                  style={{
                    borderLeft: i !== 0 ? "1px solid var(--border-subtle)" : "none",
                  }}
                >
                  <div className="stat-number text-6xl mb-3">{num}</div>
                  <div
                    className="text-xs tracking-widest uppercase"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          BOOKING / CTA
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="py-32 px-6 lg:px-16 text-center"
        style={{ background: "var(--bg-secondary)" }}
      >
        <RevealSection>
          <p className="mc-eyebrow mb-6">Эхлэх</p>
          <h2
            className="mc-heading text-white mb-8"
            style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
          >
            Өнөөдрөөс<br />
            <span style={{ color: "var(--gold)", fontStyle: "italic" }}>эхэлнэ үү</span>
          </h2>
          <div className="gold-line-static w-32 mx-auto mb-10" />
          <p
            className="font-light max-w-md mx-auto mb-12 leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Бүртгэл үнэ төлбөргүй. Хэдхэн минутын дотор мөрөөдлийн байраа олно уу.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="btn-gold">
              Үнэгүй бүртгүүлэх
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" d="M5 12h14m-7-7l7 7-7 7" />
              </svg>
            </Link>
            <Link to="/home" className="btn-outline-gold">
              Цуглуулга үзэх
            </Link>
          </div>
        </RevealSection>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CONTACT
          ═══════════════════════════════════════════════════════════ */}
      <section
        id="contact"
        className="py-24 px-6 lg:px-16"
        style={{ background: "var(--bg-tertiary)" }}
      >
        <div className="max-w-5xl mx-auto">
          <RevealSection className="text-center mb-16">
            <p className="mc-eyebrow mb-6">Холбоо барих</p>
            <h2
              className="mc-heading text-white"
              style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
            >
              Бидэнтэй{" "}
              <span style={{ color: "var(--gold)", fontStyle: "italic" }}>
                холбогдоорой
              </span>
            </h2>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { label: "Хаяг", value: "Улаанбаатар хот\nСүхбаатар дүүрэг" },
              { label: "Утас", value: "+976 7700 0000" },
              { label: "Имэйл", value: "info@rentalsy.mn" },
            ].map(({ label, value }) => (
              <RevealSection key={label}>
                <div
                  className="text-center py-8"
                  style={{ borderTop: "1px solid var(--border-gold)" }}
                >
                  <p className="mc-eyebrow mb-4">{label}</p>
                  <p className="text-white font-light whitespace-pre-line leading-relaxed">
                    {value}
                  </p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════ */}
      <footer
        className="px-6 lg:px-16 py-10"
        style={{
          background: "var(--bg-primary)",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6">
              <div
                className="absolute inset-0 rotate-45"
                style={{ border: "1px solid var(--gold)" }}
              />
              <div
                className="absolute inset-[5px] rotate-45"
                style={{ background: "var(--gold)" }}
              />
            </div>
            <span className="font-display text-lg text-white">
              Rental
              <span style={{ color: "var(--gold)", fontStyle: "italic" }}>Sy</span>
            </span>
          </div>
          <p
            className="text-xs tracking-widest uppercase"
            style={{ color: "var(--text-soft)" }}
          >
            © 2026 RentalSy · Бүх эрх хуулиар хамгаалагдсан
          </p>
          <div className="flex gap-6">
            {[
              { to: "/home", label: "Байр" },
              { to: "/login", label: "Нэвтрэх" },
              { to: "/register", label: "Бүртгүүлэх" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="hover:text-[var(--gold)] transition-colors"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: "var(--text-soft)",
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}