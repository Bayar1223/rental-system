import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

const statusConfig = {
  pending:  { label: "Хүлээгдэж байна", cls: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Зөвшөөрөгдсөн",   cls: "bg-green-100 text-green-700" },
  rejected: { label: "Татгалзсан",       cls: "bg-red-100 text-red-600" },
};

function LandlordApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchData = async () => {
      try {
        const res = await axios.get("https://rental-system-api.onrender.com/api/applications/landlord", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setApplications(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refresh]);

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://rental-system-api.onrender.com/api/applications/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRefresh((r) => r + 1);
    } catch {
      alert("Алдаа гарлаа");
    }
  };

  const pendingApps = applications.filter((a) => a.status === "pending");
  const otherApps   = applications.filter((a) => a.status !== "pending");

  const AppCard = ({ app }) => {
    const { label, cls } = statusConfig[app.status] || statusConfig.pending;
    const image = app.property?.images?.[0] ||
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688";

    return (
      <div className="bg-white rounded-2xl shadow p-5">
        <div className="grid md:grid-cols-3 gap-5">
          <div className="flex gap-4">
            <img src={image} alt="" className="w-24 h-20 object-cover rounded-xl flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-bold truncate">{app.property?.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {app.property?.location?.city}, {app.property?.location?.district}
              </p>
              <p className="text-indigo-600 font-bold mt-1 text-sm">
                {app.property?.monthlyRent?.toLocaleString()}₮/сар
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-1 text-sm">
            <p className="font-semibold text-gray-800">👤 {app.tenant?.firstName} {app.tenant?.lastName}</p>
            <p className="text-gray-600">📞 {app.tenant?.phone}</p>
            <p className="text-gray-600">✉️ {app.tenant?.email}</p>
            <p className="text-gray-600 mt-1">📅 {app.leaseMonths} сар</p>
            <p className="text-gray-600">💰 {app.totalRent?.toLocaleString()}₮</p>
          </div>

          <div className="flex flex-col justify-between">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full w-fit ${cls}`}>{label}</span>

            {app.message && (
              <div className="bg-gray-50 rounded-lg p-2 text-sm text-gray-600 my-2 line-clamp-2">
                "{app.message}"
              </div>
            )}

            <div className="flex flex-col gap-2">
              {app.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(app._id, "approved")}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium"
                  >
                    ✓ Зөвшөөрөх
                  </button>
                  <button
                    onClick={() => updateStatus(app._id, "rejected")}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium"
                  >
                    ✕ Татгалзах
                  </button>
                </div>
              )}
              {app.status === "approved" && (
                <Link
                  to={`/contract/${app._id}`}
                  className="text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium"
                >
                  📄 Гэрээ харах
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8">Ирсэн хүсэлтүүд</h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Хүсэлт ирээгүй байна</h3>
            <p className="text-gray-500">Байрнуудад хүсэлт ирэх үед энд харагдана</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingApps.length > 0 && (
              <div>
                <h2 className="font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full inline-block" />
                  Шийдвэрлэх шаардлагатай ({pendingApps.length})
                </h2>
                <div className="space-y-4">
                  {pendingApps.map((app) => <AppCard key={app._id} app={app} />)}
                </div>
              </div>
            )}
            {otherApps.length > 0 && (
              <div>
                <h2 className="font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full inline-block" />
                  Шийдвэрлэгдсэн ({otherApps.length})
                </h2>
                <div className="space-y-4">
                  {otherApps.map((app) => <AppCard key={app._id} app={app} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LandlordApplications;