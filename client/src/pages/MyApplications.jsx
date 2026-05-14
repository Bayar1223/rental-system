import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

const statusMap = {
  pending:  { label: "Хүлээгдэж байна", cls: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Зөвшөөрөгдсөн", cls: "bg-green-100 text-green-700" },
  rejected: { label: "Татгалзсан",     cls: "bg-red-100 text-red-600"    },
};

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("https://rental-system-api.onrender.com/api/applications/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setApplications(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-5xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8">Миний хүсэлтүүд</h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Хүсэлт байхгүй байна</h3>
            <p className="text-gray-500">Байрны хуудаснаас хүсэлт илгээж эхлээрэй</p>
          </div>
        ) : (
          <div className="space-y-5">
            {applications.map((app) => {
              const { label, cls } = statusMap[app.status] || statusMap.pending;
              const image = app.property?.images?.[0] ||
                "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";

              return (
                <div key={app._id} className="bg-white rounded-2xl shadow p-5">
                  <div className="flex gap-5">
                    <img
                      src={image}
                      alt={app.property?.title}
                      className="w-32 h-24 object-cover rounded-xl flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-bold mb-1">{app.property?.title}</h2>
                          <p className="text-gray-500 text-sm">
                            {app.property?.location?.city}, {app.property?.location?.district}
                          </p>
                          <p className="text-indigo-600 font-bold mt-1">
                            {app.property?.monthlyRent?.toLocaleString()}₮/сар
                          </p>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cls}`}>
                          {label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                        <span>📅 {app.leaseMonths} сар</span>
                        <span>💰 Нийт: {app.totalRent?.toLocaleString()}₮</span>
                        {app.landlord && (
                          <span>🏠 Ландлорд: {app.landlord.firstName} · {app.landlord.phone}</span>
                        )}
                      </div>

                      {app.message && (
                        <p className="mt-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-2 line-clamp-2">
                          "{app.message}"
                        </p>
                      )}

                      <div className="flex gap-3 mt-4">
                        <Link
                          to={`/properties/${app.property?._id}`}
                          className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                        >
                          Байр харах
                        </Link>
                        {app.status === "approved" && (
                          <Link
                            to={`/contract/${app._id}`}
                            className="text-sm px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                          >
                            📄 Гэрээ харах
                          </Link>
                        )}
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

export default MyApplications;