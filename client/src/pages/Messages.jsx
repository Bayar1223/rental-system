import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../api/axiosInstance";
import ChatBox from "../components/ChatBox";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=200&q=70";

function timeAgo(date) {
  if (!date) return "";
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "Дөнгөж сая";
  if (diff < 3600) return `${Math.floor(diff / 60)}м`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}ц`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}ө`;
  return new Date(date).toLocaleDateString("mn-MN", { month: "short", day: "numeric" });
}

function Messages() {
  const navigate = useNavigate();
  const location = useLocation();
  const { applicationId } = useParams();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get("/api/messages/threads");
        if (cancelled) return;
        setThreads(res.data || []);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Татаж чадсангүй");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    // Inbox-ийг 15 сек тутам сэргээх
    const id = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [navigate, user]);

  const active = threads.find(
    (t) => t.applicationId?.toString() === applicationId
  );
  const activeName =
    active?.other?.name || location.state?.otherName || "Хэрэглэгч";

  return (
    <div
      className="min-h-screen pt-20"
      style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}
    >
      <header className="max-w-6xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-8" style={{ background: "#C9A84C" }} />
          <span
            className="text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "#C9A84C" }}
          >
            Messages
          </span>
        </div>
        <h1
          className="font-light text-white leading-[1] tracking-tight"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(40px, 5vw, 64px)",
          }}
        >
          Зурвас<br />
          <em style={{ color: "#C9A84C", fontStyle: "italic" }}>харилцаа</em>
        </h1>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-12 pb-20">
        {error && (
          <div
            className="mb-6 p-4 flex items-start gap-3"
            style={{ background: "rgba(239,68,68,0.08)", borderLeft: "2px solid #EF4444" }}
          >
            <span style={{ color: "#EF4444" }}>✕</span>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : threads.length === 0 && !applicationId ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Thread list */}
            <div
              className={`lg:col-span-4 ${applicationId ? "hidden lg:block" : "block"}`}
            >
              <div className="space-y-2">
                {threads.map((t) => {
                  const isActive =
                    t.applicationId?.toString() === applicationId;
                  const cover = t.property?.images?.[0] || PLACEHOLDER;
                  return (
                    <button
                      key={t.applicationId}
                      onClick={() => navigate(`/messages/${t.applicationId}`)}
                      className="w-full text-left flex items-center gap-3 p-3 transition-all duration-300"
                      style={{
                        background: isActive ? "rgba(201,168,76,0.08)" : "#141414",
                        border: `1px solid ${
                          isActive ? "#C9A84C" : "rgba(201,168,76,0.1)"
                        }`,
                      }}
                    >
                      <div
                        className="w-12 h-12 flex-shrink-0 overflow-hidden"
                        style={{ border: "1px solid rgba(201,168,76,0.15)" }}
                      >
                        <img
                          src={cover}
                          alt=""
                          className="w-full h-full object-cover"
                          style={{ filter: "brightness(0.88)" }}
                          onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-white truncate">
                            {t.other?.name || "Хэрэглэгч"}
                          </span>
                          <span className="text-[10px] text-white/40 flex-shrink-0">
                            {timeAgo(t.lastAt)}
                          </span>
                        </div>
                        <div className="text-[11px] text-white/40 truncate mb-0.5">
                          {t.property?.title || "Байр"}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-xs truncate"
                            style={{
                              color: t.unread > 0 ? "#fff" : "rgba(255,255,255,0.45)",
                              fontWeight: t.unread > 0 ? 500 : 400,
                            }}
                          >
                            {t.mine && <span className="text-white/30">Та: </span>}
                            {t.lastMessage}
                          </span>
                          {t.unread > 0 && (
                            <span
                              className="flex-shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold rounded-full"
                              style={{ background: "#C9A84C", color: "#0A0A0A" }}
                            >
                              {t.unread > 9 ? "9+" : t.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat panel */}
            <div
              className={`lg:col-span-8 ${applicationId ? "block" : "hidden lg:block"}`}
            >
              {applicationId ? (
                <>
                  <button
                    onClick={() => navigate("/messages")}
                    className="lg:hidden mb-3 text-[10px] tracking-[0.3em] uppercase text-white/40 hover:text-white transition-colors"
                  >
                    ← Жагсаалт руу
                  </button>
                  <ChatBox
                    applicationId={applicationId}
                    otherName={activeName}
                    height={560}
                  />
                </>
              ) : (
                <div
                  className="h-full min-h-[560px] flex flex-col items-center justify-center text-center"
                  style={{ border: "1px solid rgba(201,168,76,0.1)" }}
                >
                  <div
                    className="w-14 h-14 mb-6 flex items-center justify-center"
                    style={{ border: "1px solid rgba(201,168,76,0.4)" }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        background: "rgba(201,168,76,0.4)",
                        transform: "rotate(45deg)",
                      }}
                    />
                  </div>
                  <p
                    className="font-light text-white/60"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22 }}
                  >
                    Харилцаа сонгоно уу
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2 max-w-md">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 animate-pulse"
          style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.06)" }}
        >
          <div className="w-12 h-12" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2" style={{ background: "rgba(255,255,255,0.07)" }} />
            <div className="h-3 w-3/4" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-24 px-6"
      style={{ border: "1px solid rgba(201,168,76,0.15)", background: "rgba(201,168,76,0.02)" }}
    >
      <div
        className="w-16 h-16 mb-8 flex items-center justify-center"
        style={{ border: "1px solid #C9A84C" }}
      >
        <div
          style={{ width: 24, height: 24, background: "#C9A84C", transform: "rotate(45deg)" }}
        />
      </div>
      <h3
        className="font-light text-white mb-4"
        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32 }}
      >
        Харилцаа <em style={{ color: "#C9A84C", fontStyle: "italic" }}>алга</em>
      </h3>
      <p className="text-sm text-white/50 max-w-md leading-relaxed">
        Өргөдөл гаргасан эсвэл хүлээн авсан байрны хуудаснаас зурвас бичиж эхлээрэй.
      </p>
    </div>
  );
}

export default Messages;