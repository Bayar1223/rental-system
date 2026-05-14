import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

function Contract() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const token = localStorage.getItem("token");
        const [tenantRes, landlordRes] = await Promise.allSettled([
          axios.get("https://rental-system-api.onrender.com/api/applications/my", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("https://rental-system-api.onrender.com/api/applications/landlord", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        let apps = [];
        if (tenantRes.status === "fulfilled") apps = [...apps, ...tenantRes.value.data];
        if (landlordRes.status === "fulfilled") apps = [...apps, ...landlordRes.value.data];

        const found = apps.find((a) => a._id === id);
        if (!found) {
          alert("Гэрээ олдсонгүй");
          navigate(-1);
          return;
        }
        setApplication(found);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, [id, navigate]);

  const handlePrint = () => window.print();

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("mn-MN", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  const endDate = (sd, months) => {
    if (!sd || !months) return "-";
    const d = new Date(sd);
    d.setMonth(d.getMonth() + months);
    return formatDate(d);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p>Ачааллаж байна...</p>
    </div>
  );
  if (!application) return null;

  const { property, tenant, landlord, startDate, leaseMonths, totalRent, message } = application;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex gap-4 mb-6 print:hidden">
          <button onClick={() => navigate(-1)} className="bg-white px-5 py-3 rounded-xl shadow hover:bg-gray-50 font-medium">
            ← Буцах
          </button>
          <button onClick={handlePrint} className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 font-medium">
            🖨️ Хэвлэх / PDF хадгалах
          </button>
        </div>

        <div ref={printRef} className="bg-white rounded-2xl shadow-lg p-10">
          <div className="text-center mb-10 border-b pb-8">
            <h1 className="text-3xl font-bold mb-2">ОРОН СУУЦ ТҮРЭЭСИЙН ГЭРЭЭ</h1>
            <p className="text-gray-500">Гэрээний дугаар: {application._id?.slice(-8).toUpperCase()}</p>
            <p className="text-gray-500">Огноо: {formatDate(application.createdAt)}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-indigo-50 rounded-xl p-5">
              <h3 className="font-bold text-indigo-800 mb-3">🏠 ТҮРЭЭСЛҮҮЛЭГЧ</h3>
              <div className="space-y-1.5 text-sm">
                <p><span className="font-semibold">Нэр:</span> {property?.contactName || `${landlord?.firstName ?? ""} ${landlord?.lastName ?? ""}`}</p>
                <p><span className="font-semibold">Утас:</span> {property?.contactPhone || landlord?.phone}</p>
                <p><span className="font-semibold">Имэйл:</span> {property?.contactEmail || landlord?.email}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-bold text-gray-800 mb-3">👤 ТҮРЭЭСЛЭГЧ</h3>
              <div className="space-y-1.5 text-sm">
                <p><span className="font-semibold">Нэр:</span> {tenant?.firstName} {tenant?.lastName}</p>
                <p><span className="font-semibold">Утас:</span> {tenant?.phone}</p>
                <p><span className="font-semibold">Имэйл:</span> {tenant?.email}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b">1. ТҮРЭЭСИЙН ОРОН СУУЦНЫ МЭДЭЭЛЭЛ</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p><span className="font-semibold">Зарын гарчиг:</span> {property?.title}</p>
                <p><span className="font-semibold">Байршил:</span> {property?.location?.city}, {property?.location?.district}, {property?.location?.address}</p>
                <p><span className="font-semibold">Өрөөний тоо:</span> {property?.rooms} өрөө</p>
              </div>
              <div className="space-y-2">
                <p><span className="font-semibold">Талбай:</span> {property?.area} м²</p>
                <p><span className="font-semibold">Давхар:</span> {property?.floorNumber}/{property?.totalFloors}</p>
                <p><span className="font-semibold">Тавилга:</span> {property?.isFurnished ? "Тавилгатай" : "Тавилгагүй"}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b">2. ТҮРЭЭСИЙН НӨХЦӨЛүүд</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p><span className="font-semibold">Эхлэх огноо:</span> {formatDate(startDate)}</p>
                <p><span className="font-semibold">Дуусах огноо:</span> {endDate(startDate, leaseMonths)}</p>
                <p><span className="font-semibold">Хугацаа:</span> {leaseMonths} сар</p>
              </div>
              <div className="space-y-2">
                <p><span className="font-semibold">Сарын түрээс:</span> {property?.monthlyRent?.toLocaleString()}₮</p>
                <p><span className="font-semibold">Нийт дүн:</span> {totalRent?.toLocaleString()}₮</p>
                <p><span className="font-semibold">Төлбөрийн нөхцөл:</span> {property?.paymentConditionText || "Сар бүр"}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b">3. ЕРӨНХИЙ НӨХЦӨЛүүд</h2>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>3.1. Түрээслэгч нь түрээсийн орон сууцыг зориулалтын дагуу ашиглах үүрэгтэй.</p>
              <p>3.2. Түрээслэгч нь сар бүрийн __ -ны өдрөөс өмнө сарын түрээсийг төлөх үүрэгтэй.</p>
              <p>3.3. Түрээслэгч нь орон сууцанд гэмтэл учруулсан тохиолдолд засварлах буюу зохих өртгийг нөхөн төлөх үүрэгтэй.</p>
              <p>3.4. Түрээслүүлэгч нь гэрээний хугацааг хүндэтгэн үзэх нөхцөлгүйгээр дуусгавар болгох эрхтэй.</p>
              <p>3.5. Түрээслэгч нь гэрээний хугацаа дуусахаас 30 хоногийн өмнө мэдэгдэх үүрэгтэй.</p>
              <p>3.6. Нэмэлт мэдээлэл: {message || "—"}</p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-10">
            <div>
              <p className="font-bold mb-6">ТҮРЭЭСЛҮҮЛЭГЧИЙН ГАРЫН ҮСЭГ</p>
              <div className="border-b-2 border-gray-400 pt-10 mb-2"></div>
              <p className="text-sm text-gray-500">{property?.contactName || landlord?.firstName}</p>
              <p className="text-sm text-gray-500 mt-2">Огноо: ________________</p>
            </div>
            <div>
              <p className="font-bold mb-6">ТҮРЭЭСЛЭГЧИЙН ГАРЫН ҮСЭГ</p>
              <div className="border-b-2 border-gray-400 pt-10 mb-2"></div>
              <p className="text-sm text-gray-500">{tenant?.firstName} {tenant?.lastName}</p>
              <p className="text-sm text-gray-500 mt-2">Огноо: ________________</p>
            </div>
          </div>

          <div className="text-center mt-8 text-xs text-gray-400 border-t pt-4">
            Энэхүү гэрээ нь Монгол Улсын хуулийн дагуу хүчин төгөлдөр болно.
          </div>
        </div>
      </div>
      <style>{`@media print { body { background: white; } .print\\:hidden { display: none !important; } }`}</style>
    </div>
  );
}

export default Contract;