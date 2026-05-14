import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

function MyProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    api
      .get("/api/properties")
      .then((res) => {
        const mine = res.data.filter(
          (p) =>
            p.owner?._id === user?.id   ||
            p.owner?._id === user?._id  ||
            p.owner === user?.id        ||
            p.owner === user?._id
        );
        setProperties(mine);
      })
      .catch(console.log)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Энэ байрыг устгах уу?")) return;
    try {
      await api.delete(`/api/properties/${id}`);
      setProperties((prev) => prev.filter((p) => p._id !== id));
    } catch (error) {
      alert(error.response?.data?.message || "Устгахад алдаа гарлаа");
    }
  };

  const statusLabel = (status) => {
    if (status === "available") return { text: "Боломжтой",      cls: "bg-green-100 text-green-700" };
    if (status === "rented")    return { text: "Түрээслэгдсэн",  cls: "bg-blue-100 text-blue-700" };
    return                             { text: "Идэвхгүй",       cls: "bg-gray-100 text-gray-600" };
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Миний байрнууд</h1>
          <Link
            to="/add-property"
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 font-medium flex items-center gap-2"
          >
            + Байр нэмэх
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-32 h-24 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Байр оруулаагүй байна</h3>
            <p className="text-gray-500 mb-6">Эхний байраа оруулж эхлээрэй</p>
            <Link to="/add-property" className="bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 font-medium">
              Байр нэмэх
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {properties.map((property) => {
              const { text, cls } = statusLabel(property.status);
              const image = property.images?.[0] ||
                "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";

              return (
                <div key={property._id} className="bg-white rounded-2xl shadow p-5">
                  <div className="flex gap-5">
                    <img
                      src={image}
                      alt={property.title}
                      className="w-36 h-28 object-cover rounded-xl flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold mb-1 truncate">{property.title}</h2>
                          <p className="text-gray-500 text-sm mb-1">
                            {property.location?.city}, {property.location?.district}
                          </p>
                          <p className="text-indigo-600 font-bold text-lg">
                            {property.monthlyRent?.toLocaleString()}₮/сар
                          </p>
                          <p className="text-gray-500 text-sm mt-1">
                            {property.rooms} өрөө · {property.area} м²
                          </p>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${cls}`}>
                          {text}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <Link
                          to={`/properties/${property._id}`}
                          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                        >
                          Харах
                        </Link>
                        <Link
                          to={`/edit-property/${property._id}`}
                          className="px-4 py-2 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium"
                        >
                          Засах
                        </Link>
                        <button
                          onClick={() => handleDelete(property._id)}
                          className="px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium"
                        >
                          Устгах
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyProperties;