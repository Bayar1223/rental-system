import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

function MyApplications() {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          "http://localhost:5000/api/applications/my",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setApplications(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchApplications();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8">Миний хүсэлтүүд</h1>

        <div className="space-y-6">
          {applications.map((app) => (
            <div key={app._id} className="bg-white p-6 rounded-2xl shadow">
              <h2 className="text-2xl font-bold mb-2">
                {app.property?.title}
              </h2>

              <p className="text-gray-600 mb-2">
                {app.property?.location?.city},{" "}
                {app.property?.location?.district}
              </p>

              <p className="text-indigo-600 font-bold text-xl mb-3">
                {app.property?.monthlyRent?.toLocaleString()}₮
              </p>

              <p className="mb-2">
                <span className="font-semibold">Түрээсийн хугацаа:</span>{" "}
                {app.leaseMonths} сар
              </p>

              <p className="mb-2">
                <span className="font-semibold">Төлөв:</span> {app.status}
              </p>

              <p className="text-gray-700">{app.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyApplications;