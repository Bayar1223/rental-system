import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";

const stats = [
  { number: "500+", label: "Идэвхтэй зар" },
  { number: "1,200+", label: "Хэрэглэгч" },
  { number: "9", label: "Дүүрэг" },
  { number: "98%", label: "Сэтгэл ханамж" },
];

const features = [
  {
    icon: "🔍",
    title: "Хурдан хайлт",
    desc: "Дүүрэг, үнэ, өрөөний тоогоор шүүж хайх боломжтой",
  },
  {
    icon: "📄",
    title: "Цахим гэрээ",
    desc: "Онлайнаар гэрээ байгуулж, PDF хэлбэрээр хадгалах",
  },
  {
    icon: "🔔",
    title: "Шуурхай мэдэгдэл",
    desc: "Хүсэлтийн төлөв өөрчлөгдөхөд шуурхай мэдэгдэл хүлээн авна",
  },
  {
    icon: "🏠",
    title: "Байр удирдах",
    desc: "Landlord өөрийн байрнуудыг хялбархан удирдах боломжтой",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (user) navigate("/home");
  }, [user, navigate]);

  useEffect(() => {
    // Pagination форматтай болсон тул properties массивыг зөв авах
    api.get("/api/properties", { params: { limit: 3, page: 1 } })
      .then((res) => {
        const data = res.data.properties || res.data;
        setFeaturedProperties(Array.isArray(data) ? data.slice(0, 3) : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-white">
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet" />

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏡</span>
            <span className="text-xl font-bold text-white">Түрээсийн систем</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <button className="px-5 py-2.5 rounded-xl text-white/80 font-medium hover:bg-white/10 transition">
                Нэвтрэх
              </button>
            </Link>
            <Link to="/register">
              <button className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition shadow-lg shadow-indigo-900/50">
                Бүртгүүлэх
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%)",
          }}
        />
        <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative max-w-6xl mx-auto px-6 py-32 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
              №1 Орон сууц түрээсийн платформ
            </div>

            <h1 style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
              Мөрөөдлийн
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"> байраа </span>
              олоорой
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed mb-10">
              Улаанбаатар хотын бүх дүүргийн түрээсийн орон сууцнуудаас хайж, онлайнаар хүсэлт илгээж, цахим гэрээ байгуулах боломжтой.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition shadow-xl shadow-indigo-900/50 text-lg">
                  Үнэгүй бүртгүүлэх →
                </button>
              </Link>
              <Link to="/home">
                <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl transition border border-white/20 text-lg">
                  Байр үзэх
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-6 mt-14">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-white">{s.number}</div>
                  <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:block">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
              <div className="bg-white/5 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white text-lg">🔍</div>
                  <div>
                    <div className="text-white font-semibold">Байр хайх</div>
                    <div className="text-slate-400 text-sm">500+ зар нээлттэй байна</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {["Баянзүрх дүүрэг", "2 өрөө", "1,500,000₮ хүртэл"].map((t) => (
                    <div key={t} className="bg-white/10 rounded-lg px-3 py-2 text-slate-300 text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
              {[
                { title: "Баянзүрх, 3 өрөө", price: "1,200,000₮", tag: "Шинэ" },
                { title: "Сүхбаатар, 2 өрөө", price: "900,000₮", tag: "Онцлох" },
              ].map((p) => (
                <div key={p.title} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{p.title}</div>
                    <div className="text-indigo-300 text-sm font-bold">{p.price}/сар</div>
                  </div>
                  <span className="text-xs bg-indigo-500/30 text-indigo-300 px-2 py-1 rounded-lg">{p.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Доош скролл заалт */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-4xl font-bold text-gray-900 mb-4">
              Яагаад биднийг сонгох вэ?
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Түрээслэгч болон түрээслүүлэгч хоёуланд тохиромжтой бүрэн платформ
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-gray-100">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Онцлох байрнууд */}
      {featuredProperties.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif" }}
                  className="text-4xl font-bold text-gray-900 mb-2">
                  Онцлох байрнууд
                </h2>
                <p className="text-gray-500">Сүүлд нэмэгдсэн байрнуудаас</p>
              </div>
              <Link to="/home" className="text-indigo-600 font-medium hover:underline">
                Бүгдийг харах →
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredProperties.map((p) => (
                <Link to={`/properties/${p._id}`} key={p._id}>
                  <div className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="relative overflow-hidden h-52">
                      <img
                        src={p.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-xs font-semibold px-3 py-1 rounded-full text-indigo-600">
                        {p.rooms} өрөө
                      </div>
                      <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        Боломжтой
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 mb-1 truncate">{p.title}</h3>
                      <p className="text-gray-500 text-sm mb-3 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {p.location?.district}, {p.location?.city}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-indigo-600 font-bold text-xl">
                          {p.monthlyRent?.toLocaleString()}₮
                        </span>
                        <span className="text-gray-400 text-sm">/сар</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Хэрхэн ажилладаг */}
      <section className="py-24 bg-gradient-to-br from-indigo-950 to-slate-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-4xl font-bold text-white mb-4">
              Хэрхэн ажилладаг вэ?
            </h2>
            <p className="text-slate-400 text-lg">3 хялбар алхамаар байраа олоорой</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Бүртгүүлэх", desc: "Tenant эсвэл Landlord эрхтэйгээр бүртгүүлнэ", icon: "👤" },
              { step: "02", title: "Байр хайх", desc: "Дүүрэг, үнэ, өрөөний тоогоор шүүж хайна", icon: "🔍" },
              { step: "03", title: "Хүсэлт илгээх", desc: "Таалагдсан байрандаа хүсэлт илгээж гэрээ байгуулна", icon: "📝" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-indigo-400 text-sm font-bold mb-2">{item.step}</div>
                <h3 className="text-white font-bold text-xl mb-2">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-4xl font-bold text-gray-900 mb-4">
            Өнөөдрөөс эхлэх үү?
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            Бүртгэл үнэ төлбөргүй. Хэдхэн минутын дотор байраа олоорой.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition shadow-lg shadow-indigo-200 text-lg">
                Үнэгүй бүртгүүлэх →
              </button>
            </Link>
            <Link to="/home">
              <button className="px-8 py-4 border-2 border-gray-200 hover:border-indigo-300 text-gray-700 font-semibold rounded-2xl transition text-lg">
                Байр үзэх
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏡</span>
            <span className="text-white font-bold">Түрээсийн систем</span>
          </div>
          <p className="text-sm">© 2025 Түрээсийн систем. Бүх эрх хуулиар хамгаалагдсан.</p>
          <div className="flex gap-6 text-sm">
            <Link to="/home" className="hover:text-white transition">Байрнууд</Link>
            <Link to="/login" className="hover:text-white transition">Нэвтрэх</Link>
            <Link to="/register" className="hover:text-white transition">Бүртгүүлэх</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}