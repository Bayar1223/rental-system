import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SignaturePad from "signature_pad";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

function Contract() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  const sigCanvasRef = useRef(null);
  const signaturePadRef = useRef(null);

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

  useEffect(() => {
    if (showSignModal && sigCanvasRef.current) {
      const pad = new SignaturePad(sigCanvasRef.current, { penColor: "black" });
      pad.addEventListener("endStroke", () => setSigEmpty(pad.isEmpty()));
      signaturePadRef.current = pad;
      setSigEmpty(true);
      return () => { pad.off(); signaturePadRef.current = null; };
    }
  }, [showSignModal]);

  const handlePrint = () => window.print();

  const handleSign = async () => {
    if (sigEmpty || !signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      alert("Гарын үсэг зурна уу"); return;
    }
    setSigning(true);
    try {
      const signatureImage = signaturePadRef.current.toDataURL("image/png");
      const formData = new FormData();
      formData.append("file", signatureImage);
      formData.append("upload_preset", "rental-signature");
      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const cloudData = await cloudRes.json();
      if (!cloudData.secure_url) throw new Error("Зураг хадгалахад алдаа гарлаа");
      const res = await api.put(`/api/applications/${id}/sign`, { signatureUrl: cloudData.secure_url });
      setApplication(res.data.application);
      setShowSignModal(false);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Алдаа гарлаа");
    } finally { setSigning(false); }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" });
  };

  const calcEndDate = (sd, months) => {
    if (!sd || !months) return "-";
    const d = new Date(sd); d.setMonth(d.getMonth() + months); return formatDate(d);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
      <Navbar />
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
        <p className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Ачааллаж байна</p>
      </div>
    </div>
  );
  if (!application) return null;

  const { property, tenant, landlord, startDate, leaseMonths, totalRent, message } = application;
  const userId   = currentUser?._id || currentUser?.id;
  const isTenant = String(application.tenant?._id || application.tenant) === String(userId);
  const mySign     = isTenant ? application.tenantSigned : application.landlordSigned;
  const mySignedAt = isTenant ? application.tenantSignedAt : application.landlordSignedAt;
  const otherSign  = isTenant ? application.landlordSigned : application.tenantSigned;
  const canSign = application.status === "approved" && application.contractStatus !== "cancelled" && !mySign;
  const contractSigned = application.contractStatus === "signed";

  const CONTRACT_BADGE = {
    none:               { label: "Гэрээ байхгүй",              color: "#9CA3AF", bg: "#F3F4F6" },
    pending_signatures: { label: "Гарын үсэг хүлээгдэж байна", color: "#D97706", bg: "#FFFBEB" },
    signed:             { label: "Гэрээ баталгаажсан",         color: "#16A34A", bg: "#F0FDF4" },
    cancelled:          { label: "Цуцлагдсан",                 color: "#EF4444", bg: "#FEF2F2" },
  };
  const badge = CONTRACT_BADGE[application.contractStatus] || CONTRACT_BADGE.none;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingTop: 64 }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-6 print:hidden">
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm">← Буцах</button>
          <button onClick={handlePrint} className="btn-outline-gold text-sm">Хэвлэх / PDF</button>
        </div>

        {/* Status panel */}
        <div className="bg-white border mb-6 p-6 print:hidden" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>Гэрээний төлөв</p>
              <span className="text-sm font-medium px-4 py-1.5" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { label: "Түрээслэгч", signed: application.tenantSigned, at: application.tenantSignedAt },
                { label: "Түрээслүүлэгч", signed: application.landlordSigned, at: application.landlordSignedAt },
              ].map(({ label, signed, at }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: signed ? "#16A34A" : "var(--border-subtle)" }} />
                  <span style={{ color: "var(--text-muted)" }}>{label}: {signed ? `Зурсан (${formatDate(at)})` : "Хүлээгдэж байна"}</span>
                </div>
              ))}
            </div>
          </div>

          {canSign && (
            <div className="pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <button onClick={() => setShowSignModal(true)} className="btn-gold text-sm" style={{ padding: "10px 24px" }}>
                Гэрээнд гарын үсэг зурах
              </button>
              <p className="text-xs mt-2" style={{ color: "var(--text-soft)" }}>
                Гарын үсэг зурснаар та гэрээний нөхцөлүүдийг хүлээн зөвшөөрч байна.
              </p>
            </div>
          )}

          {mySign && !contractSigned && (
            <div className="pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <p className="text-sm p-3 border-l-2" style={{ borderColor: "var(--gold)", background: "var(--cream)", color: "var(--gold)" }}>
                Та {formatDate(mySignedAt)}-нд гарын үсэг зурлаа.{!otherSign && " Нөгөө талын гарын үсгийг хүлээж байна."}
              </p>
            </div>
          )}

          {contractSigned && (
            <div className="pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <p className="text-sm p-3 border-l-2" style={{ borderColor: "#16A34A", background: "#F0FDF4", color: "#16A34A" }}>
                Гэрээ хоёр талын гарын үсгээр баталгаажлаа!
              </p>
            </div>
          )}
        </div>

        {/* Contract document */}
        <div ref={printRef} className="bg-white border p-8 md:p-12" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="text-center mb-10 pb-8 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>RentalSy</p>
            <h1 className="font-display text-2xl font-light mb-2" style={{ color: "var(--ink)" }}>ОРОН СУУЦ ТҮРЭЭСИЙН ГЭРЭЭ</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Дугаар: {application._id?.slice(-8).toUpperCase()} · Огноо: {formatDate(application.createdAt)}</p>
            {contractSigned && (
              <span className="mt-3 inline-block text-xs px-4 py-1.5" style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                Электрон гарын үсгээр баталгаажсан
              </span>
            )}
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {[
              { role: "Түрээслүүлэгч", name: property?.contactName || `${landlord?.firstName ?? ""} ${landlord?.lastName ?? ""}`, phone: property?.contactPhone || landlord?.phone, email: property?.contactEmail || landlord?.email },
              { role: "Түрээслэгч", name: `${tenant?.firstName} ${tenant?.lastName}`, phone: tenant?.phone, email: tenant?.email },
            ].map(({ role, name, phone, email }) => (
              <div key={role} className="border p-5" style={{ borderColor: "var(--border-subtle)" }}>
                <p className="text-xs tracking-widest uppercase mb-3" style={{ color: "var(--gold)" }}>{role}</p>
                <div className="space-y-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  <p><span className="font-medium" style={{ color: "var(--ink)" }}>Нэр:</span> {name}</p>
                  <p><span className="font-medium" style={{ color: "var(--ink)" }}>Утас:</span> {phone}</p>
                  <p><span className="font-medium" style={{ color: "var(--ink)" }}>Имэйл:</span> {email}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sections */}
          {[
            {
              title: "1. Түрээсийн орон сууцны мэдээлэл",
              items: [
                ["Гарчиг", property?.title],
                ["Байршил", `${property?.location?.city}, ${property?.location?.district}, ${property?.location?.address}`],
                ["Өрөөний тоо", `${property?.rooms} өрөө`],
                ["Талбай", `${property?.area} м²`],
                ["Давхар", `${property?.floorNumber}/${property?.totalFloors}`],
                ["Тавилга", property?.isFurnished ? "Тавилгатай" : "Тавилгагүй"],
              ]
            },
            {
              title: "2. Түрээсийн нөхцөлүүд",
              items: [
                ["Эхлэх огноо", formatDate(startDate)],
                ["Дуусах огноо", calcEndDate(startDate, leaseMonths)],
                ["Хугацаа", `${leaseMonths} сар`],
                ["Сарын түрээс", `${property?.monthlyRent?.toLocaleString()}₮`],
                ["Нийт дүн", `${totalRent?.toLocaleString()}₮`],
                ["Төлбөрийн нөхцөл", property?.paymentConditionText || "Сар бүр"],
              ]
            }
          ].map(({ title, items }) => (
            <div key={title} className="mb-8">
              <p className="text-xs tracking-widest uppercase mb-4 pb-2 border-b" style={{ color: "var(--gold)", borderColor: "var(--border-subtle)" }}>{title}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map(([k, v]) => (
                  <p key={k} className="text-sm" style={{ color: "var(--text-muted)" }}>
                    <span className="font-medium" style={{ color: "var(--ink)" }}>{k}:</span> {v}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {/* General terms */}
          <div className="mb-8">
            <p className="text-xs tracking-widest uppercase mb-4 pb-2 border-b" style={{ color: "var(--gold)", borderColor: "var(--border-subtle)" }}>3. Ерөнхий нөхцөлүүд</p>
            <div className="space-y-2 text-sm leading-7" style={{ color: "var(--text-muted)" }}>
              {[
                "Түрээслэгч нь түрээсийн орон сууцыг зориулалтын дагуу ашиглах үүрэгтэй.",
                "Түрээслэгч нь сар бүрийн 1-ний өдрөөс өмнө сарын түрээсийг төлөх үүрэгтэй.",
                "Түрээслэгч нь орон сууцанд гэмтэл учруулсан тохиолдолд засварлах буюу нөхөн төлөх үүрэгтэй.",
                "Түрээслүүлэгч нь нөхцөлгүйгээр гэрээг дуусгавар болгох эрхтэй.",
                "Түрээслэгч нь гэрээний хугацаа дуусахаас 30 хоногийн өмнө мэдэгдэх үүрэгтэй.",
                `Нэмэлт мэдээлэл: ${message || "—"}`,
              ].map((t, i) => <p key={i}>3.{i+1}. {t}</p>)}
            </div>
          </div>

          {/* Signatures */}
          <div className="h-px my-8" style={{ background: "var(--border-subtle)" }} />
          <div className="grid grid-cols-2 gap-10">
            {[
              { role: "Түрээслүүлэгч", signed: application.landlordSigned, sig: application.landlordSignature, at: application.landlordSignedAt, name: `${property?.contactName || landlord?.firstName} ${landlord?.lastName || ""}` },
              { role: "Түрээслэгч", signed: application.tenantSigned, sig: application.tenantSignature, at: application.tenantSignedAt, name: `${tenant?.firstName} ${tenant?.lastName}` },
            ].map(({ role, signed, sig, at, name }) => (
              <div key={role}>
                <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>{role}ийн гарын үсэг</p>
                {signed ? (
                  <div className="border p-3 text-center" style={{ borderColor: "#BBF7D0", background: "#F0FDF4" }}>
                    {sig ? <img src={sig} alt="Гарын үсэг" className="max-h-16 mx-auto" /> : <p className="text-sm font-medium" style={{ color: "#16A34A" }}>Зурсан</p>}
                    <p className="text-xs mt-1" style={{ color: "#16A34A" }}>{formatDate(at)}</p>
                    <p className="text-xs" style={{ color: "var(--text-soft)" }}>{name}</p>
                  </div>
                ) : (
                  <div className="border-b-2 border-dashed pt-12 text-center" style={{ borderColor: "var(--border-subtle)" }}>
                    <p className="text-xs" style={{ color: "var(--text-soft)" }}>Гарын үсэг хүлээгдэж байна</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-8 text-xs border-t pt-4" style={{ borderColor: "var(--border-subtle)", color: "var(--text-soft)" }}>
            Энэхүү гэрээ нь Монгол Улсын хуулийн дагуу хүчин төгөлдөр болно.
            {contractSigned && <span className="block mt-1" style={{ color: "#16A34A" }}>Электрон гарын үсгээр баталгаажсан</span>}
          </div>
        </div>
      </div>

      {/* Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowSignModal(false); }}>
          <div className="bg-white w-full md:max-w-lg p-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--gold)" }}>Гарын үсэг</p>
                <h2 className="font-display text-2xl font-light" style={{ color: "var(--ink)" }}>Гарын үсэг зурах</h2>
              </div>
              <button onClick={() => setShowSignModal(false)} className="text-2xl" style={{ color: "var(--text-soft)" }}>x</button>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Доорх хайрцагт гарын үсгээ зурна уу. Mouse эсвэл хуруугаараа зурж болно.
            </p>
            <div className="border overflow-hidden mb-4" style={{ borderColor: "var(--border-subtle)" }}>
              <canvas ref={sigCanvasRef} width={500} height={180}
                className="w-full h-44 cursor-crosshair touch-none" style={{ background: "#FAFAFA" }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { signaturePadRef.current?.clear(); setSigEmpty(true); }} className="btn-ghost flex-1">Арилгах</button>
              <button onClick={handleSign} disabled={signing || sigEmpty} className="btn-gold flex-1 justify-center" style={{ padding: "12px 0" }}>
                {signing ? "Хадгалж байна..." : "Баталгаажуулах"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@media print { body { background: white; } .print-hidden { display: none !important; } }`}</style>
    </div>
  );
}

export default Contract;