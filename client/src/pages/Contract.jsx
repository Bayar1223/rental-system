import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

function Contract() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  const sigCanvasRef = useRef(null);

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [sigEmpty, setSigEmpty] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const [tenantRes, landlordRes] = await Promise.allSettled([
          api.get("/api/applications/my"),
          api.get("/api/applications/landlord"),
        ]);
        let apps = [];
        if (tenantRes.status === "fulfilled") apps = [...apps, ...tenantRes.value.data];
        if (landlordRes.status === "fulfilled") apps = [...apps, ...landlordRes.value.data];
        const found = apps.find((a) => a._id === id);
        if (!found) { alert("Гэрээ олдсонгүй"); navigate(-1); return; }
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

  const handleSign = async () => {
    if (sigCanvasRef.current?.isEmpty()) {
      alert("Гарын үсэг зурна уу");
      return;
    }
    setSigning(true);
    try {
      // Canvas-аас base64 зураг авах
      const signatureImage = sigCanvasRef.current
        .getTrimmedCanvas()
        .toDataURL("image/png");

      // Frontend-аас Cloudinary руу шууд upload
      const formData = new FormData();
      formData.append("file", signatureImage);
      formData.append("upload_preset", "rental-signature");

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const cloudData = await cloudRes.json();

      if (!cloudData.secure_url) {
        throw new Error("Зураг хадгалахад алдаа гарлаа");
      }

      // Cloudinary URL-ийг backend-д илгээх
      const res = await api.put(`/api/applications/${id}/sign`, {
        signatureUrl: cloudData.secure_url,
      });

      setApplication(res.data.application);
      setShowSignModal(false);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Алдаа гарлаа");
    } finally {
      setSigning(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("mn-MN", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  const calcEndDate = (sd, months) => {
    if (!sd || !months) return "-";
    const d = new Date(sd);
    d.setMonth(d.getMonth() + months);
    return formatDate(d);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-gray-400">Ачааллаж байна...</p>
    </div>
  );
  if (!application) return null;

  const { property, tenant, landlord, startDate, leaseMonths, totalRent, message } = application;

  const userId     = currentUser?._id || currentUser?.id;
  const isTenant   = String(application.tenant?._id || application.tenant) === String(userId);
  const mySign     = isTenant ? application.tenantSigned : application.landlordSigned;
  const mySignedAt = isTenant ? application.tenantSignedAt : application.landlordSignedAt;
  const otherSign  = isTenant ? application.landlordSigned : application.tenantSigned;

  const canSign = application.status === "approved" &&
    application.contractStatus !== "cancelled" &&
    !mySign;

  const contractSigned = application.contractStatus === "signed";

  const CONTRACT_BADGE = {
    none:               { label: "Гэрээ байхгүй",              cls: "bg-gray-100 text-gray-500" },
    pending_signatures: { label: "Гарын үсэг хүлээгдэж байна", cls: "bg-yellow-100 text-yellow-700" },
    signed:             { label: "Гэрээ баталгаажсан ✓",       cls: "bg-green-100 text-green-700" },
    cancelled:          { label: "Цуцлагдсан",                  cls: "bg-red-100 text-red-600" },
  };
  const badge = CONTRACT_BADGE[application.contractStatus] || CONTRACT_BADGE.none;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 pb-10">

        {/* Товчнууд */}
        <div className="flex flex-wrap gap-3 mb-5 print:hidden">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow hover:bg-gray-50 text-sm font-medium">
            ← Буцах
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 text-sm font-medium">
            🖨️ Хэвлэх / PDF
          </button>
        </div>

        {/* Статус хэсэг */}
        <div className="bg-white rounded-2xl shadow p-5 mb-5 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Гэрээний төлөв</p>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${application.tenantSigned ? "bg-green-500" : "bg-gray-300"}`} />
                <span className="text-gray-600">
                  Түрээслэгч: {application.tenantSigned ? `✓ ${formatDate(application.tenantSignedAt)}` : "Хүлээгдэж байна"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${application.landlordSigned ? "bg-green-500" : "bg-gray-300"}`} />
                <span className="text-gray-600">
                  Түрээслүүлэгч: {application.landlordSigned ? `✓ ${formatDate(application.landlordSignedAt)}` : "Хүлээгдэж байна"}
                </span>
              </div>
            </div>
          </div>

          {canSign && (
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowSignModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium text-sm transition"
              >
                ✍️ Гэрээнд гарын үсэг зурах
              </button>
              <p className="text-xs text-gray-400 mt-2">
                Гарын үсэг зурснаар та гэрээний нөхцөлүүдийг хүлээн зөвшөөрч байна.
              </p>
            </div>
          )}

          {mySign && !contractSigned && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-yellow-600 bg-yellow-50 px-4 py-2 rounded-xl">
                ✓ Та {formatDate(mySignedAt)}-нд гарын үсэг зурлаа.
                {!otherSign && " Нөгөө талын гарын үсгийг хүлээж байна."}
              </p>
            </div>
          )}

          {contractSigned && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-xl">
                🎉 Гэрээ хоёр талын гарын үсгээр баталгаажлаа!
              </p>
            </div>
          )}
        </div>

        {/* Гэрээний баримт */}
        <div ref={printRef} className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
          <div className="text-center mb-10 border-b pb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">ОРОН СУУЦ ТҮРЭЭСИЙН ГЭРЭЭ</h1>
            <p className="text-gray-500 text-sm">Гэрээний дугаар: {application._id?.slice(-8).toUpperCase()}</p>
            <p className="text-gray-500 text-sm">Огноо: {formatDate(application.createdAt)}</p>
            {contractSigned && (
              <span className="mt-3 inline-block bg-green-100 text-green-700 text-xs font-semibold px-4 py-1.5 rounded-full">
                ✓ Электрон гарын үсгээр баталгаажсан
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
            <h2 className="text-lg font-bold mb-4 pb-2 border-b">1. ТҮРЭЭСИЙН ОРОН СУУЦНЫ МЭДЭЭЛЭЛ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
            <h2 className="text-lg font-bold mb-4 pb-2 border-b">2. ТҮРЭЭСИЙН НӨХЦӨЛҮҮД</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p><span className="font-semibold">Эхлэх огноо:</span> {formatDate(startDate)}</p>
                <p><span className="font-semibold">Дуусах огноо:</span> {calcEndDate(startDate, leaseMonths)}</p>
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
            <h2 className="text-lg font-bold mb-4 pb-2 border-b">3. ЕРӨНХИЙ НӨХЦӨЛҮҮД</h2>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>3.1. Түрээслэгч нь түрээсийн орон сууцыг зориулалтын дагуу ашиглах үүрэгтэй.</p>
              <p>3.2. Түрээслэгч нь сар бүрийн 1-ний өдрөөс өмнө сарын түрээсийг төлөх үүрэгтэй.</p>
              <p>3.3. Түрээслэгч нь орон сууцанд гэмтэл учруулсан тохиолдолд засварлах буюу зохих өртгийг нөхөн төлөх үүрэгтэй.</p>
              <p>3.4. Түрээслүүлэгч нь гэрээний хугацааг хүндэтгэн үзэх нөхцөлгүйгээр дуусгавар болгох эрхтэй.</p>
              <p>3.5. Түрээслэгч нь гэрээний хугацаа дуусахаас 30 хоногийн өмнө мэдэгдэх үүрэгтэй.</p>
              <p>3.6. Нэмэлт мэдээлэл: {message || "—"}</p>
            </div>
          </div>

          {/* Гарын үсгийн хэсэг */}
          <div className="mt-10 grid grid-cols-2 gap-6 md:gap-10">
            <div>
              <p className="font-bold mb-4 text-sm">ТҮРЭЭСЛҮҮЛЭГЧИЙН ГАРЫН ҮСЭГ</p>
              {application.landlordSigned ? (
                <div className="border-2 border-green-400 bg-green-50 rounded-xl p-3 text-center">
                  {application.landlordSignature ? (
                    <img src={application.landlordSignature} alt="Гарын үсэг" className="max-h-16 mx-auto" />
                  ) : (
                    <p className="text-green-600 font-bold">✓ Зурсан</p>
                  )}
                  <p className="text-green-500 text-xs mt-1">{formatDate(application.landlordSignedAt)}</p>
                  <p className="text-gray-500 text-xs">{property?.contactName || landlord?.firstName} {landlord?.lastName}</p>
                </div>
              ) : (
                <div className="border-b-2 border-dashed border-gray-300 pt-10 text-center">
                  <p className="text-xs text-gray-400">Гарын үсэг хүлээгдэж байна</p>
                </div>
              )}
            </div>
            <div>
              <p className="font-bold mb-4 text-sm">ТҮРЭЭСЛЭГЧИЙН ГАРЫН ҮСЭГ</p>
              {application.tenantSigned ? (
                <div className="border-2 border-green-400 bg-green-50 rounded-xl p-3 text-center">
                  {application.tenantSignature ? (
                    <img src={application.tenantSignature} alt="Гарын үсэг" className="max-h-16 mx-auto" />
                  ) : (
                    <p className="text-green-600 font-bold">✓ Зурсан</p>
                  )}
                  <p className="text-green-500 text-xs mt-1">{formatDate(application.tenantSignedAt)}</p>
                  <p className="text-gray-500 text-xs">{tenant?.firstName} {tenant?.lastName}</p>
                </div>
              ) : (
                <div className="border-b-2 border-dashed border-gray-300 pt-10 text-center">
                  <p className="text-xs text-gray-400">Гарын үсэг хүлээгдэж байна</p>
                </div>
              )}
            </div>
          </div>

          <div className="text-center mt-8 text-xs text-gray-400 border-t pt-4">
            Энэхүү гэрээ нь Монгол Улсын хуулийн дагуу хүчин төгөлдөр болно.
            {contractSigned && (
              <span className="block mt-1 text-green-500">✓ Электрон гарын үсгээр баталгаажсан</span>
            )}
          </div>
        </div>
      </div>

      {/* Гарын үсэг зурах Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Гарын үсэг зурах</h2>
              <button onClick={() => setShowSignModal(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Доорх хайрцагт гарын үсгээ зурна уу. Mouse эсвэл хуруугаараа зурж болно.
            </p>
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden mb-4 bg-gray-50">
              <SignatureCanvas
                ref={sigCanvasRef}
                penColor="black"
                canvasProps={{
                  width: 500,
                  height: 180,
                  className: "w-full h-44 cursor-crosshair",
                }}
                onEnd={() => setSigEmpty(sigCanvasRef.current?.isEmpty())}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { sigCanvasRef.current?.clear(); setSigEmpty(true); }}
                className="flex-1 border border-gray-200 py-3 rounded-xl text-gray-600 hover:bg-gray-50 text-sm transition"
              >
                🗑️ Арилгах
              </button>
              <button
                onClick={handleSign}
                disabled={signing || sigEmpty}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                {signing ? "Хадгалж байна..." : "✓ Баталгаажуулах"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@media print { body { background: white; } .print\\:hidden { display: none !important; } }`}</style>
    </div>
  );
}

export default Contract;