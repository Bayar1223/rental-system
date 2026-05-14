import { useEffect, useState, useCallback } from "react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import PropertyCard from "../components/PropertyCard";

const districts = [
  "Багануур", "Багахангай", "Баянгол", "Баянзүрх",
  "Налайх", "Сонгинохайрхан", "Сүхбаатар", "Хан-Уул", "Чингэлтэй",
];

function Home() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("");
  const [rooms, setRooms] = useState("");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (district) params.district = district;
      if (rooms) params.rooms = rooms;
      if (minRent) params.minRent = minRent;
      if (maxRent) params.maxRent = maxRent;

     const res = await api.get("/api/properties", { params });
      setProperties(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [search, district, rooms, minRent, maxRent]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProperties();
    }, 400);
    return () => clearTimeout(timeout);
  }, [fetchProperties]);

  const handleReset = () => {
    setSearch("");
    setDistrict("");
    setRooms("");
    setMinRent("");
    setMaxRent("");
  };

  const hasFilter = search || district || rooms || minRent || maxRent;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-8 py-10">
          <h2 className="text-4xl font-bold mb-2">Түрээсийн байр хайх</h2>
          <p className="text-gray-500 mb-6">Улаанбаатар хотын орон сууц түрээсийн систем</p>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Байрны нэр, хаяг хайх..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base"
              />
            </div>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-medium transition ${
                showFilter || hasFilter
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Шүүлтүүр
              {hasFilter && (
                <span className="bg-white text-indigo-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {[district, rooms, minRent, maxRent].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {showFilter && (
            <div className="mt-4 p-5 bg-gray-50 rounded-2xl border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1 block">Дүүрэг</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full border p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Бүгд</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1 block">Өрөөний тоо</label>
                  <select
                    value={rooms}
                    onChange={(e) => setRooms(e.target.value)}
                    className="w-full border p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Бүгд</option>
                    <option value="1">1 өрөө</option>
                    <option value="2">2 өрөө</option>
                    <option value="3">3 өрөө</option>
                    <option value="4">4 өрөө</option>
                    <option value="5">5+ өрөө</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1 block">Мин үнэ (₮)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minRent}
                    onChange={(e) => setMinRent(e.target.value)}
                    className="w-full border p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1 block">Макс үнэ (₮)</label>
                  <input
                    type="number"
                    placeholder="10,000,000"
                    value={maxRent}
                    onChange={(e) => setMaxRent(e.target.value)}
                    className="w-full border p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {hasFilter && (
                <button
                  onClick={handleReset}
                  className="mt-4 text-sm text-red-500 hover:underline font-medium"
                >
                  Шүүлтүүр арилгах
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {loading ? "Хайж байна..." : `${properties.length} байр олдлоо`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-2xl" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-6 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Байр олдсонгүй</h3>
            <p className="text-gray-500">Шүүлтүүрийг өөрчилж дахин хайна уу</p>
            {hasFilter && (
              <button onClick={handleReset} className="mt-4 text-indigo-600 hover:underline font-medium">
                Шүүлтүүр арилгах
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property._id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;