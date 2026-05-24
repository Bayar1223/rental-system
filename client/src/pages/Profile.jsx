import { useState, useEffect, useMemo, useRef } from "react";
import api from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";

const ROLE_LABELS = {
  tenant: "Түрээслэгч",
  landlord: "Байрны эзэн",
  admin: "Админ",
};

function Profile() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("info"); // 'info' | 'password'

  // Profile state
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Info form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef(null);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoMsg, setInfoMsg] = useState({ ok: "", error: "" });

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState({ ok: "", error: "" });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
      navigate("/login");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/auth/me");
        if (cancelled) return;
        const u = res.data;
        setMe(u);
        setName(u.name || "");
        setEmail(u.email || "");
        setPhone((u.phone || "").replace(/^\+976/, ""));
      } catch (err) {
        if (cancelled) return;
        setLoadError(err.response?.data?.message || "Уншиж чадсангүй");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Password strength
  const pwStrength = useMemo(() => {
    let s = 0;
    if (newPw.length >= 8) s++;
    if (/[A-Z]/.test(newPw)) s++;
    if (/[0-9]/.test(newPw)) s++;
    if (/[^A-Za-z0-9]/.test(newPw)) s++;
    return s;
  }, [newPw]);
  const pwLabel = ["Сул", "Сул", "Дунд", "Сайн", "Хүчтэй"][pwStrength];
  const pwColor = [
    "#3a3a3a",
    "#EF4444",
    "#F59E0B",
    "#C9A84C",
    "#10B981",
  ][pwStrength];

  const handleAvatarSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
    e.target.value = "";
  };

  const handleAvatarRemove = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setInfoMsg({ ok: "", error: "" });
    if (!name.trim() || !email.trim()) {
      setInfoMsg({ ok: "", error: "Нэр болон имэйл шаардлагатай" });
      return;
    }
    if (phone && !/^\d{8}$/.test(phone)) {
      setInfoMsg({ ok: "", error: "Утасны дугаар 8 оронтой байх ёстой" });
      return;
    }

    setSavingInfo(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("email", email.trim());
      if (phone) fd.append("phone", "+976" + phone);
      if (avatarFile) fd.append("avatar", avatarFile);

      const res = await api.put("/api/users/me", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updated = res.data;
      setMe(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarFile(null);
      setAvatarPreview(null);
      setInfoMsg({ ok: "Амжилттай хадгалагдлаа", error: "" });
    } catch (err) {
      setInfoMsg({
        ok: "",
        error: err.response?.data?.message || "Хадгалж чадсангүй",
      });
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ ok: "", error: "" });
    if (!currentPw || !newPw || !confirmPw) {
      setPwMsg({ ok: "", error: "Бүх талбарыг бөглөнө үү" });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({
        ok: "",
        error: "Шинэ нууц үг хамгийн багадаа 8 тэмдэгттэй байх ёстой",
      });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ ok: "", error: "Шинэ нууц үг таарахгүй байна" });
      return;
    }

    setSavingPw(true);
    try {
      await api.put("/api/auth/change-password", {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setPwMsg({
        ok: "Нууц үг амжилттай шинэчлэгдлээ",
        error: "",
      });
    } catch (err) {
      setPwMsg({
        ok: "",
        error: err.response?.data?.message || "Нууц үг солих боломжгүй",
      });
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen pt-20 flex items-center justify-center"
        style={{ background: "#0A0A0A" }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 mx-auto mb-6 animate-spin"
            style={{
              border: "2px solid rgba(201,168,76,0.2)",
              borderTopColor: "#C9A84C",
              borderRadius: "50%",
            }}
          />
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">
            Уншиж байна
          </p>
        </div>
      </div>
    );
  }

  if (loadError || !me) {
    return (
      <div
        className="min-h-screen pt-20 flex items-center justify-center px-6"
        style={{ background: "#0A0A0A" }}
      >
        <p className="text-sm text-red-300">{loadError || "Алдаа"}</p>
      </div>
    );
  }

  const initial = (me.name || "?").charAt(0).toUpperCase();
  const roleLabel = ROLE_LABELS[me.role] || me.role;

  return (
    <div
      className="min-h-screen pt-20"
      style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Header */}
      <header className="max-w-4xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-8" style={{ background: "#C9A84C" }} />
          <span
            className="text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "#C9A84C" }}
          >
            Profile
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div
            className="w-20 h-20 flex items-center justify-center flex-shrink-0 relative overflow-hidden"
            style={{
              background: "rgba(201,168,76,0.12)",
              border: "1px solid #C9A84C",
            }}
          >
            {me.avatar ? (
              <img
                src={me.avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 36,
                  color: "#C9A84C",
                }}
              >
                {initial}
              </span>
            )}
          </div>
          <div>
            <h1
              className="font-light text-white leading-tight mb-2"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(32px, 4vw, 48px)",
              }}
            >
              {me.name}
            </h1>
            <div className="flex items-center gap-3">
              <span
                className="px-3 py-1 text-[10px] tracking-[0.25em] uppercase"
                style={{
                  background: "rgba(201,168,76,0.12)",
                  color: "#C9A84C",
                  border: "1px solid rgba(201,168,76,0.4)",
                }}
              >
                {roleLabel}
              </span>
              <span className="text-xs text-white/40">{me.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <section className="max-w-4xl mx-auto px-6 lg:px-12 mb-10">
        <div
          className="flex gap-1"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          {[
            { v: "info", label: "Хувийн мэдээлэл" },
            { v: "password", label: "Нууц үг солих" },
          ].map((t) => (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              className="px-5 py-4 text-[10px] tracking-[0.25em] uppercase transition-colors relative"
              style={{
                color: tab === t.v ? "#C9A84C" : "rgba(255,255,255,0.5)",
              }}
            >
              {t.label}
              {tab === t.v && (
                <div
                  className="absolute bottom-0 left-0 right-0"
                  style={{ height: 1, background: "#C9A84C" }}
                />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 lg:px-12 pb-20">
        {tab === "info" ? (
          <form onSubmit={handleSaveInfo}>
            {infoMsg.error && (
              <Banner type="error" text={infoMsg.error} />
            )}
            {infoMsg.ok && <Banner type="success" text={infoMsg.ok} />}

            <FormSection number="01" label="Профайл зураг">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
              />
              <div className="flex items-center gap-6">
                <div
                  className="w-24 h-24 flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{
                    background: "rgba(201,168,76,0.12)",
                    border: "1px solid rgba(201,168,76,0.4)",
                  }}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : me.avatar ? (
                    <img
                      src={me.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 36,
                        color: "#C9A84C",
                      }}
                    >
                      {initial}
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-5 py-2.5 text-[10px] tracking-[0.25em] uppercase transition-colors"
                    style={{
                      border: "1px solid #C9A84C",
                      color: "#C9A84C",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(201,168,76,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {avatarPreview ? "Өөр зураг" : "Зураг сонгох"}
                  </button>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleAvatarRemove}
                      className="px-5 py-2.5 text-[10px] tracking-[0.25em] uppercase text-red-300 hover:text-red-200 transition-colors"
                      style={{ border: "1px solid rgba(239,68,68,0.4)" }}
                    >
                      Хасах
                    </button>
                  )}
                </div>
              </div>
            </FormSection>

            <FormSection number="02" label="Үндсэн мэдээлэл">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Овог нэр" required>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-transparent text-white text-sm py-3 outline-none transition-colors"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.15)",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderBottomColor = "#C9A84C")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderBottomColor =
                        "rgba(255,255,255,0.15)")
                    }
                  />
                </Field>

                <Field label="Имэйл хаяг" required>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-transparent text-white text-sm py-3 outline-none transition-colors"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.15)",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderBottomColor = "#C9A84C")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderBottomColor =
                        "rgba(255,255,255,0.15)")
                    }
                  />
                </Field>

                <Field label="Утасны дугаар">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-sm text-white/50 py-3"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      +976
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(
                          e.target.value.replace(/\D/g, "").slice(0, 8)
                        )
                      }
                      placeholder="99112233"
                      className="flex-1 bg-transparent text-white text-sm py-3 outline-none transition-colors"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.15)",
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderBottomColor = "#C9A84C")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderBottomColor =
                          "rgba(255,255,255,0.15)")
                      }
                    />
                  </div>
                </Field>

                <Field label="Үүрэг">
                  <div className="py-3 text-sm text-white/60">
                    {roleLabel}
                  </div>
                </Field>
              </div>
            </FormSection>

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={savingInfo}
                className="px-8 py-3 text-[10px] tracking-[0.25em] uppercase transition-all duration-300 disabled:opacity-50"
                style={{ background: "#C9A84C", color: "#0A0A0A" }}
                onMouseEnter={(e) =>
                  !savingInfo &&
                  (e.currentTarget.style.background = "#E8D49E")
                }
                onMouseLeave={(e) =>
                  !savingInfo &&
                  (e.currentTarget.style.background = "#C9A84C")
                }
              >
                {savingInfo ? "Хадгалж байна..." : "Хадгалах →"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePassword}>
            {pwMsg.error && <Banner type="error" text={pwMsg.error} />}
            {pwMsg.ok && <Banner type="success" text={pwMsg.ok} />}

            <FormSection number="01" label="Нууц үг шинэчлэх">
              <Field label="Одоогийн нууц үг" required>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-transparent text-white text-sm py-3 outline-none pr-16 transition-colors"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.15)",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderBottomColor = "#C9A84C")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderBottomColor =
                        "rgba(255,255,255,0.15)")
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] tracking-widest uppercase text-white/40 hover:text-white transition-colors"
                  >
                    {showPw ? "Нуух" : "Харах"}
                  </button>
                </div>
              </Field>

              <Field label="Шинэ нууц үг" required>
                <input
                  type={showPw ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-transparent text-white text-sm py-3 outline-none transition-colors"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.15)",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderBottomColor = "#C9A84C")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderBottomColor =
                      "rgba(255,255,255,0.15)")
                  }
                />
                {newPw && (
                  <div className="mt-3">
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex-1 h-[2px] transition-colors duration-300"
                          style={{
                            background:
                              i <= pwStrength
                                ? pwColor
                                : "rgba(255,255,255,0.08)",
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[10px] tracking-widest uppercase">
                      <span className="text-white/40">Хүч</span>
                      <span style={{ color: pwColor }}>{pwLabel}</span>
                    </div>
                  </div>
                )}
              </Field>

              <Field label="Нууц үг давтах" required>
                <input
                  type={showPw ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-transparent text-white text-sm py-3 outline-none transition-colors"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.15)",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderBottomColor = "#C9A84C")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderBottomColor =
                      "rgba(255,255,255,0.15)")
                  }
                />
              </Field>
            </FormSection>

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={savingPw}
                className="px-8 py-3 text-[10px] tracking-[0.25em] uppercase transition-all duration-300 disabled:opacity-50"
                style={{ background: "#C9A84C", color: "#0A0A0A" }}
                onMouseEnter={(e) =>
                  !savingPw &&
                  (e.currentTarget.style.background = "#E8D49E")
                }
                onMouseLeave={(e) =>
                  !savingPw &&
                  (e.currentTarget.style.background = "#C9A84C")
                }
              >
                {savingPw ? "Шинэчилж байна..." : "Нууц үг шинэчлэх →"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

function FormSection({ number, label, children }) {
  return (
    <section
      className="mb-10 pb-10"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-baseline gap-6 mb-6">
        <span
          className="font-light"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 28,
            color: "#C9A84C",
          }}
        >
          {number}
        </span>
        <h3
          className="font-light text-white"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 24,
          }}
        >
          {label}
        </h3>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3">
        {label}
        {required && <span style={{ color: "#C9A84C" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function Banner({ type, text }) {
  const isError = type === "error";
  const color = isError ? "#EF4444" : "#10B981";
  const icon = isError ? "✕" : "✓";
  const textColor = isError ? "text-red-300" : "text-emerald-300";
  return (
    <div
      className="mb-6 p-4 flex items-start gap-3"
      style={{
        background: `${color}15`,
        borderLeft: `2px solid ${color}`,
      }}
    >
      <span style={{ color }}>{icon}</span>
      <p className={`text-sm ${textColor}`}>{text}</p>
    </div>
  );
}

export default Profile;