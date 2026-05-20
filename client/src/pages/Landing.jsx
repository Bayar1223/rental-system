import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";

const features = [
  { icon: "◈", title: "Ухаалаг хайлт", desc: "Дүүрэг, үнэ, өрөөгөөр шүүж мөрөөдлийн байраа хайна уу" },
  { icon: "◉", title: "Цахим гэрээ", desc: "Онлайнаар гарын үсэг зурж найдвартай хадгалагдана" },
  { icon: "◎", title: "Шуурхай мэдэгдэл", desc: "Хүсэлтийн төлөв болон шинэ байрны мэдээлэл авна уу" },
  { icon: "◍", title: "Нэгдсэн удирдлага", desc: "Байр, гэрээ, төлбөр бүгдийг нэг дороос харна уу" },
];

const stats = [
  { num: "500+", label: "Идэвхтэй зар" },
  { num: "9", label: "Дүүрэг" },
  { num: "98%", label: "Сэтгэл ханамж" },
  { num: "24/7", label: "Тусламж" },
];

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { e.target.classList.add("visible"); obs.disconnect(); }
    }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
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
  const user = JSON.parse(localStorage.getItem("user"));
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [heroVisible, setHeroVisible] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => { if (user) navigate("/home"); }, [user, navigate]);
  useEffect(() => { setTimeout(() => setHeroVisible(true), 100); }, []);

  useEffect(() => {
    api.get("/api/properties", { params: { limit: 3 } })
      .then(r => setFeaturedProperties((r.data.properties || r.data).slice(0, 3)))
      .catch(() => {});
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursorPos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 20,
    });
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "var(--cream)" }}>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-16"
        style={{ height: 64, borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
        <div className="absolute inset-0 bg-[var(--ink)]/95 backdrop-blur-md" />
        <div className="relative flex items-center gap-3">
          <div className="relative w-7 h-7">
            <div className="absolute inset-0 border border-[var(--gold)] rotate-45" />
            <div className="absolute inset-1.5 bg-[var(--gold)] rotate-45" />
          </div>
          <span className="font-display text-xl font-light tracking-wider text-white">
            Rental<span style={{ color: "var(--gold)" }}>Sy</span>
          </span>
        </div>
        <div className="relative flex items-center gap-3">
          <Link to="/login" className="text-xs font-medium tracking-widest uppercase text-white/60 hover:text-white transition-colors px-4 py-2">
            Нэвтрэх
          </Link>
          <Link to="/register" className="btn-gold" style={{ fontSize: 11, padding: "10px 24px" }}>
            Бүртгүүлэх
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        onMouseMove={handleMouseMove}
        style={{ minHeight: "100vh", background: "var(--ink)", paddingTop: 64, overflow: "hidden", position: "relative" }}
      >
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(201,168,76,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.06) 1px, transparent 1px)",
          backgroundSize: "80px 80px"
        }} />

        <div className="absolute" style={{
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)",
          top: "10%", right: "-5%",
          transform: `translate(${cursorPos.x * -0.5}px, ${cursorPos.y * -0.5}px)`,
          transition: "transform 0.3s ease",
          animation: "floatY 8s ease-in-out infinite",
        }} />
        <div className="absolute" style={{
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)",
          bottom: "15%", left: "-5%",
          transform: `translate(${cursorPos.x * 0.3}px, ${cursorPos.y * 0.3}px)`,
          transition: "transform 0.4s ease",
          animation: "floatY 10s ease-in-out infinite reverse",
        }} />

        <div className="relative max-w-7xl mx-auto px-8 md:px-16 flex items-center" style={{ minHeight: "calc(100vh - 64px)" }}>
          <div className="w-full grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className={`transition-all duration-700 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-px w-8" style={{ background: "var(--gold)" }} />
                  <span className="text-xs tracking-widest uppercase" style={{ color: "var(--gold)" }}>№1 Орон сууцны платформ</span>
                </div>
              </div>

              <h1 className={`font-display font-light text-white leading-tight mb-8 transition-all duration-700 delay-100 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ fontSize: "clamp(48px, 6vw, 80px)" }}>
                Мөрөөдлийн<br />
                байраа<br />
                <span style={{ color: "var(--gold)", fontStyle: "italic" }}>олоорой</span>
              </h1>

              <p className={`text-white/50 mb-10 leading-relaxed text-sm transition-all duration-700 delay-200 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ maxWidth: 420 }}>
                Улаанбаатар хотын 9 дүүргийн байруудаас хайж, онлайнаар гэрээ байгуулан, цахим төлбөр хийх боломжтой систем.
              </p>

              <div className={`flex flex-wrap gap-4 mb-16 transition-all duration-700 delay-300 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                <Link to="/register" className="btn-gold">
                  Үнэгүй эхлэх
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" d="M5 12h14m-7-7l7 7-7 7" />
                  </svg>
                </Link>
                <Link to="/home" className="btn-outline-gold">Байр харах</Link>
              </div>

              <div className={`grid grid-cols-4 gap-6 transition-all duration-700 delay-400 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                {stats.map(({ num, label }) => (
                  <div key={label}>
                    <div className="stat-number text-3xl mb-1">{num}</div>
                    <div className="text-white/40 text-xs tracking-wide">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`hidden md:block transition-all duration-1000 delay-500 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(201,168,76,0.2)",
                backdropFilter: "blur(10px)",
                padding: 32,
                transform: `rotateX(${cursorPos.y * -0.3}deg) rotateY(${cursorPos.x * 0.3}deg)`,
                transition: "transform 0.3s ease",
              }}>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs tracking-widest uppercase" style={{ color: "var(--gold)" }}>Байр хайх</span>
                  <span className="badge-gold">500+ байр</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "14px 16px", marginBottom: 12 }}>
                  <p className="text-white/60 text-sm">Баянзүрх дүүрэг, 2 өрөө...</p>
                </div>
                {[
                  { title: "Баянзүрх, 2 өрөө тавилгатай", price: "1,200,000", tag: "Шинэ" },
                  { title: "Сүхбаатар, 3 өрөө орон сууц", price: "1,800,000", tag: "Онцлох" },
                  { title: "Хан-Уул, 1 өрөө studio", price: "750,000", tag: "" },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-4 py-4"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ width: 48, height: 48, background: `rgba(201,168,76,${0.1 + i * 0.05})`, flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-light line-clamp-1">{p.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--gold)" }}>{p.price}₮/сар</p>
                    </div>
                    {p.tag && <span className="badge-gold text-[10px]">{p.tag}</span>}
                  </div>
                ))}
                <Link to="/home" className="btn-gold w-full justify-center mt-6 text-xs">
                  Бүгдийг харах →
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24"
          style={{ background: "linear-gradient(transparent, var(--cream))" }} />
      </section>

      {/* ── FEATURES ── */}
      <section className="py-32 px-8 md:px-16" style={{ background: "var(--cream)" }}>
        <div className="max-w-6xl mx-auto">
          <RevealSection className="text-center mb-20">
            <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-4">Онцлог</p>
            <h2 className="font-display text-5xl font-light text-[var(--ink)]">Яагаад биднийг сонгох вэ?</h2>
          </RevealSection>
          <div className="grid md:grid-cols-4 gap-8">
            {features.map(({ icon, title, desc }, i) => (
              <RevealSection key={title} delay={i * 0.1}>
                <div className="group">
                  <div className="text-3xl text-[var(--gold)] mb-6 transition-transform duration-300 group-hover:scale-110" style={{ fontFamily: "monospace" }}>
                    {icon}
                  </div>
                  <div className="h-px mb-6" style={{ background: "var(--border-subtle)" }} />
                  <h3 className="font-display text-xl font-light text-[var(--ink)] mb-3">{title}</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PROPERTIES ── */}
      {featuredProperties.length > 0 && (
        <section className="py-24 px-8 md:px-16" style={{ background: "white" }}>
          <div className="max-w-7xl mx-auto">
            <RevealSection className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-3">Онцлох байрнууд</p>
                <h2 className="font-display text-4xl font-light text-[var(--ink)]">Сүүлд нэмэгдсэн</h2>
              </div>
              <Link to="/home" className="btn-outline-gold hidden md:flex">Бүгдийг харах →</Link>
            </RevealSection>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredProperties.map((p, i) => (
                <RevealSection key={p._id} delay={i * 0.1}>
                  <Link to={`/properties/${p._id}`} className="block group">
                    <div className="luxury-card overflow-hidden">
                      <div className="relative overflow-hidden" style={{ aspectRatio: "16/10" }}>
                        <img
                          src={p.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"}
                          alt={p.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="badge-gold">{p.rooms} өрөө</span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-display text-xl font-light text-[var(--ink)] line-clamp-1 mb-1">{p.title}</h3>
                        <p className="text-xs text-[var(--text-muted)] mb-4">{p.location?.district}, {p.location?.city}</p>
                        <div className="flex items-baseline justify-between">
                          <span className="font-display text-2xl font-light" style={{ color: "var(--gold)" }}>{p.monthlyRent?.toLocaleString()}₮</span>
                          <span className="text-xs text-[var(--text-soft)]">/сар</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      <section className="py-32 px-8 md:px-16" style={{ background: "var(--ink)" }}>
        <div className="max-w-5xl mx-auto">
          <RevealSection className="text-center mb-20">
            <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-4">Процесс</p>
            <h2 className="font-display text-5xl font-light text-white">Хэрхэн ажилладаг вэ?</h2>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { num: "01", title: "Бүртгүүлэх", desc: "Хэдхэн минутын дотор бүртгэл үүсгэнэ" },
              { num: "02", title: "Байр хайх", desc: "Шүүлтүүрээр тохирох байраа ол" },
              { num: "03", title: "Гэрээ байгуулах", desc: "Онлайнаар гарын үсэг зурж баталгаажуулна" },
            ].map(({ num, title, desc }, i) => (
              <RevealSection key={num} delay={i * 0.15}>
                <div className="text-center group">
                  <div className="stat-number text-7xl font-light mb-6 transition-transform duration-300 group-hover:scale-110">
                    {num}
                  </div>
                  <div className="h-px mb-6" style={{ background: "rgba(201,168,76,0.3)" }} />
                  <h3 className="font-display text-2xl font-light text-white mb-3">{title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-8 md:px-16" style={{ background: "var(--surface)" }}>
        <div className="max-w-5xl mx-auto">
          <RevealSection className="text-center mb-16">
            <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-4">Сэтгэгдэл</p>
            <h2 className="font-display text-4xl font-light text-[var(--ink)]">Хэрэглэгчид юу хэлэв?</h2>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Б. Мөнхбаяр", role: "Түрээслэгч", text: "Байр хайх, цахим гэрээ байгуулах бүх зүйл маш хялбар болсон." },
              { name: "Д. Цэрэндорж", role: "Түрээслүүлэгч", text: "Байруудаа удирдахад маш хялбар. Төлбөрийн хуваарь автоматаар үүснэ." },
              { name: "О. Сарантуяа", role: "Түрээслэгч", text: "Нийслэлийн бүх дүүрэгт хайх боломж гайхалтай. Маш цаг хэмнэлттэй." },
            ].map(({ name, role, text }, i) => (
              <RevealSection key={name} delay={i * 0.1}>
                <div className="luxury-card p-6">
                  <div className="flex mb-4">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ color: "var(--gold)", fontSize: 14 }}>★</span>
                    ))}
                  </div>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6 font-display font-light italic text-base">"{text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[var(--gold)] flex items-center justify-center text-[var(--ink)] text-xs font-medium">
                      {name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--ink)]">{name}</p>
                      <p className="text-xs text-[var(--text-soft)]">{role}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-8 md:px-16 text-center" style={{ background: "var(--cream)" }}>
        <RevealSection>
          <p className="text-xs tracking-widest uppercase text-[var(--gold)] mb-6">Эхлэх</p>
          <h2 className="font-display text-5xl md:text-6xl font-light text-[var(--ink)] mb-6">
            Өнөөдрөөс эхэлнэ үү
          </h2>
          <p className="text-[var(--text-muted)] text-sm mb-10 max-w-md mx-auto">
            Бүртгэл үнэ төлбөргүй. Хэдхэн минутын дотор байраа олоорой.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="btn-gold">
              Үнэгүй бүртгүүлэх →
            </Link>
            <Link to="/home" className="btn-outline-gold">Байр харах</Link>
          </div>
        </RevealSection>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-8 md:px-16 py-10" style={{ background: "var(--ink)", borderTop: "1px solid rgba(201,168,76,0.15)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 border border-[var(--gold)] rotate-45" />
              <div className="absolute inset-1.5 bg-[var(--gold)] rotate-45" />
            </div>
            <span className="font-display text-lg font-light text-white">
              Rental<span style={{ color: "var(--gold)" }}>Sy</span>
            </span>
          </div>
          <p className="text-white/30 text-xs tracking-wide">© 2026 RentalSy. Бүх эрх хуулиар хамгаалагдсан.</p>
          <div className="flex gap-6">
            {[{ to: "/home", label: "Байрнууд" }, { to: "/login", label: "Нэвтрэх" }, { to: "/register", label: "Бүртгүүлэх" }].map(({ to, label }) => (
              <Link key={to} to={to} className="text-white/40 hover:text-white text-xs tracking-widest uppercase transition-colors">{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}