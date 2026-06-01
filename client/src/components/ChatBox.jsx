import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import api from "../api/axiosInstance";

function fmtTime(d) {
  if (!d) return "";
  const date = new Date(d);
  const today = new Date();
  const sameDay =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  return sameDay
    ? date.toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("mn-MN", { month: "short", day: "numeric" }) +
        " " +
        date.toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Application thread дээрх чат.
 * props:
 *   applicationId — заавал
 *   otherName     — толгойд харуулах нөгөө талын нэр (заавал биш)
 *   height        — px (default 480)
 */
export default function ChatBox({ applicationId, otherName, height = 480 }) {
  const me = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const myId = me?._id;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/api/messages/${applicationId}`);
      setMessages(res.data || []);
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Зурвас татаж чадсангүй");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  // Анх ачаалах + 8 секунд тутам polling
  useEffect(() => {
    if (!applicationId) return;
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await load();
    };
    run();
    const id = setInterval(run, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [applicationId, load]);

  // Шинэ зурвас ирэхэд доош гүйлгэх
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await api.post("/api/messages", { applicationId, text: t });
      setMessages((prev) => [...prev, res.data]);
      setText("");
    } catch (err) {
      setError(err.response?.data?.message || "Илгээж чадсангүй");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="flex flex-col"
      style={{
        background: "#141414",
        border: "1px solid rgba(201,168,76,0.2)",
        height,
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(201,168,76,0.15)" }}
      >
        <span style={{ color: "#C9A84C" }}>◇</span>
        <div>
          <div
            className="text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "#C9A84C" }}
          >
            Зурвас
          </div>
          {otherName && (
            <div className="text-sm text-white/80 mt-0.5">{otherName}</div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div
              className="w-8 h-8 animate-spin"
              style={{
                border: "2px solid rgba(201,168,76,0.2)",
                borderTopColor: "#C9A84C",
                borderRadius: "50%",
              }}
            />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div
              className="w-12 h-12 mb-4 flex items-center justify-center"
              style={{ border: "1px solid rgba(201,168,76,0.4)" }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  background: "rgba(201,168,76,0.4)",
                  transform: "rotate(45deg)",
                }}
              />
            </div>
            <p className="text-sm text-white/40">
              Эхний зурвасаа бичээрэй
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = (m.sender?._id || m.sender) === myId;
            return (
              <div
                key={m._id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[78%] px-4 py-2.5"
                  style={{
                    background: mine ? "#C9A84C" : "rgba(255,255,255,0.04)",
                    color: mine ? "#0A0A0A" : "rgba(255,255,255,0.9)",
                    border: mine
                      ? "none"
                      : "1px solid rgba(201,168,76,0.15)",
                  }}
                >
                  <p
                    className="text-sm leading-relaxed whitespace-pre-line break-words"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {m.text}
                  </p>
                  <div
                    className="text-[9px] tracking-[0.15em] uppercase mt-1"
                    style={{
                      color: mine ? "rgba(10,10,10,0.55)" : "rgba(255,255,255,0.35)",
                      textAlign: mine ? "right" : "left",
                    }}
                  >
                    {fmtTime(m.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Error */}
      {error && (
        <div
          className="px-5 py-2 text-xs text-red-300 flex-shrink-0"
          style={{ background: "rgba(239,68,68,0.08)" }}
        >
          {error}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={send}
        className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(201,168,76,0.15)" }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Зурвас бичих..."
          className="flex-1 bg-transparent text-white text-sm py-2.5 px-3 outline-none transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.12)" }}
          onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
          onBlur={(e) =>
            (e.target.style.borderColor = "rgba(255,255,255,0.12)")
          }
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="px-5 py-2.5 text-[10px] tracking-[0.25em] uppercase transition-all duration-300 disabled:opacity-40 flex-shrink-0"
          style={{ background: "#C9A84C", color: "#0A0A0A" }}
          onMouseEnter={(e) =>
            !sending && text.trim() && (e.currentTarget.style.background = "#E8D49E")
          }
          onMouseLeave={(e) =>
            !sending && text.trim() && (e.currentTarget.style.background = "#C9A84C")
          }
        >
          {sending ? "..." : "Илгээх"}
        </button>
      </form>
    </div>
  );
}