import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

function LandlordApplications() {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/applications/landlord",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setApplications(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/applications/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchApplications();
    } catch (err) {
      console.log(err);
      alert("Алдаа гарлаа");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8">
          Ирсэн түрээсийн хүсэлтүүд
        </h1>

        {applications.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow">
            Одоогоор хүсэлт ирээгүй байна.
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => (
              <div
                key={app._id}
                className="bg-white rounded-2xl shadow p-6"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <img
                      src={app.property?.images?.[0]}
                      alt=""
                      className="w-full h-64 object-cover rounded-xl"
                    />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {app.property?.title}
                    </h2>

                    <p className="text-gray-600 mb-2">
                      {app.property?.city},{" "}
                      {app.property?.district}
                    </p>

                    <p className="text-indigo-600 text-2xl font-bold mb-4">
                      {app.property?.price?.toLocaleString()}₮
                    </p>

                    <div className="space-y-2">
                      <p>
                        <span className="font-semibold">
                          Хүсэлт илгээсэн:
                        </span>{" "}
                        {app.tenant?.firstName}{" "}
                        {app.tenant?.lastName}
                      </p>

                      <p>
                        <span className="font-semibold">
                          Имэйл:
                        </span>{" "}
                        {app.tenant?.email}
                      </p>

                      <p>
                        <span className="font-semibold">
                          Утас:
                        </span>{" "}
                        {app.tenant?.phone}
                      </p>

                      <p>
                        <span className="font-semibold">
                          Түрээслэх хугацаа:
                        </span>{" "}
                        {app.leaseMonths} сар
                      </p>

                      <p>
                        <span className="font-semibold">
                          Төлөв:
                        </span>{" "}
                        {app.status}
                      </p>
                    </div>

                    <div className="mt-5">
                      <p className="font-semibold mb-2">
                        Нэмэлт мэдээлэл:
                      </p>

                      <div className="bg-gray-100 p-4 rounded-xl">
                        {app.message}
                      </div>
                    </div>

                    {app.status === "pending" && (
                      <div className="flex gap-4 mt-6">
                        <button
                          onClick={() =>
                            updateStatus(app._id, "approved")
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
                        >
                          Зөвшөөрөх
                        </button>

                        <button
                          onClick={() =>
                            updateStatus(app._id, "rejected")
                          }
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl"
                        >
                          Татгалзах
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LandlordApplications;