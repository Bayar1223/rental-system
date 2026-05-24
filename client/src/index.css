@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@200;300;400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ═══════════════════════════════════════════════════════════
   MONTE CARLO PALETTE
   ═══════════════════════════════════════════════════════════ */
:root {
  /* Backgrounds (dark) */
  --bg-primary:    #000000;
  --bg-secondary:  #0A0A0A;
  --bg-tertiary:   #141414;
  --bg-elevated:   #1A1A1A;
  --bg-card:       #0F0F0F;

  /* Gold */
  --gold:          #C8A961;
  --gold-light:    #E5D4A1;
  --gold-dark:     #8E7741;
  --gold-glow:     rgba(200, 169, 97, 0.25);

  /* Text */
  --text-primary:   #FFFFFF;
  --text-secondary: #C8C8C8;
  --text-muted:     #8A8A8A;
  --text-soft:      #5A5A5A;

  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-gold:   rgba(200, 169, 97, 0.25);
  --border-strong: rgba(255, 255, 255, 0.15);

  /* ── Backward compatibility (хуучин variable-уудыг шинэ утгад mapping) ── */
  --ink:           #FFFFFF;           /* хуучин: dark text → одоо: light text */
  --ink-soft:      #C8C8C8;
  --ink-muted:     #8A8A8A;
  --cream:         #000000;           /* хуучин: light bg → одоо: pure black */
  --surface:       #0F0F0F;
  --surface-warm:  #141414;
  --border-light:  rgba(200, 169, 97, 0.2);
}

/* ═══════════════════════════════════════════════════════════
   BASE
   ═══════════════════════════════════════════════════════════ */
* { box-sizing: border-box; }

html, body {
  background: var(--bg-primary);
  color: var(--text-primary);
}

body {
  font-family: 'Inter', sans-serif;
  font-weight: 300;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: 0.01em;
}

/* ═══════════════════════════════════════════════════════════
   TAILWIND OVERRIDES (хар theme рүү шилжүүлэх)
   ═══════════════════════════════════════════════════════════ */
.bg-white                     { background-color: var(--bg-card) !important; }
.bg-gray-50, .bg-gray-100     { background-color: var(--bg-secondary) !important; }
.bg-gray-200                  { background-color: var(--bg-tertiary) !important; }
.bg-amber-50, .bg-yellow-50   { background-color: rgba(200,169,97,0.08) !important; }
.bg-red-50                    { background-color: rgba(239,68,68,0.08) !important; }
.bg-green-50                  { background-color: rgba(34,197,94,0.08) !important; }
.bg-blue-50, .bg-indigo-50    { background-color: rgba(99,102,241,0.08) !important; }
.bg-orange-50                 { background-color: rgba(249,115,22,0.08) !important; }
.bg-purple-50                 { background-color: rgba(168,85,247,0.08) !important; }

.text-gray-900, .text-gray-800 { color: var(--text-primary) !important; }
.text-gray-700, .text-gray-600 { color: var(--text-secondary) !important; }
.text-gray-500                 { color: var(--text-muted) !important; }
.text-gray-400, .text-gray-300 { color: var(--text-soft) !important; }

.border-gray-100, .border-gray-200 { border-color: var(--border-subtle) !important; }
.border-gray-300                    { border-color: var(--border-strong) !important; }

.shadow, .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6), 0 1px 2px rgba(200, 169, 97, 0.05) !important;
}

/* Indigo accent classes → gold */
.bg-indigo-600, .bg-indigo-500, .bg-indigo-400 { background-color: var(--gold) !important; color: #000 !important; }
.text-indigo-600, .text-indigo-500, .text-indigo-400 { color: var(--gold) !important; }
.border-indigo-400, .border-indigo-500 { border-color: var(--gold) !important; }
.hover\:bg-indigo-700:hover { background-color: var(--gold-dark) !important; }
.focus\:border-indigo-400:focus { border-color: var(--gold) !important; }

/* Form inputs — dark style */
input, textarea, select {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border-color: var(--border-subtle);
}
input::placeholder, textarea::placeholder { color: var(--text-soft); }

/* Scrollbar */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb { background: var(--bg-tertiary); border-radius: 0; }
::-webkit-scrollbar-thumb:hover { background: var(--gold-dark); }

/* ═══════════════════════════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════════════════════════ */
@keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideRight { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes floatY { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes scrollDot { 0% { transform: translateY(0); opacity: 0; } 30% { opacity: 1; } 70% { opacity: 1; } 100% { transform: translateY(12px); opacity: 0; } }
@keyframes pulseGold { 0%, 100% { box-shadow: 0 0 0 0 var(--gold-glow); } 50% { box-shadow: 0 0 0 12px rgba(200,169,97,0); } }
@keyframes textFadeSlide {
  0%, 25% { opacity: 1; transform: translateY(0); }
  33%, 92% { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 1; transform: translateY(0); }
}

.animate-fadeUp { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
.animate-fadeIn { animation: fadeIn 0.6s ease both; }
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }
.delay-400 { animation-delay: 0.4s; }
.delay-500 { animation-delay: 0.5s; }
.delay-700 { animation-delay: 0.7s; }

/* ═══════════════════════════════════════════════════════════
   TYPOGRAPHY
   ═══════════════════════════════════════════════════════════ */
.font-display {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 300;
  letter-spacing: 0.005em;
}

.mc-eyebrow {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: var(--gold);
}

.mc-heading {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 300;
  line-height: 1.05;
  letter-spacing: -0.01em;
}

/* ═══════════════════════════════════════════════════════════
   BUTTONS
   ═══════════════════════════════════════════════════════════ */
.btn-gold {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: var(--gold);
  color: #000;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 14px 32px;
  border: 1px solid var(--gold);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.btn-gold::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--gold-dark);
  transform: translateX(-101%);
  transition: transform 0.4s ease;
}
.btn-gold > * { position: relative; z-index: 1; }
.btn-gold:hover::before { transform: translateX(0); }
.btn-gold:hover { color: #fff; }

.btn-outline-gold {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: transparent;
  color: var(--gold);
  border: 1px solid var(--gold);
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 13px 31px;
  cursor: pointer;
  transition: all 0.35s ease;
}
.btn-outline-gold:hover {
  background: var(--gold);
  color: #000;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: var(--text-muted);
  border: none;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  padding: 10px 18px;
  cursor: pointer;
  transition: color 0.2s;
}
.btn-ghost:hover { color: var(--gold); }

/* ═══════════════════════════════════════════════════════════
   CARDS
   ═══════════════════════════════════════════════════════════ */
.luxury-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}
.luxury-card::before {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
  transform: scaleX(0);
  transition: transform 0.5s ease;
}
.luxury-card:hover {
  border-color: var(--border-gold);
  transform: translateY(-4px);
}
.luxury-card:hover::before { transform: scaleX(1); }

/* ═══════════════════════════════════════════════════════════
   INPUTS
   ═══════════════════════════════════════════════════════════ */
.luxury-input {
  width: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 0;
  padding: 16px 18px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 300;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.25s;
}
.luxury-input:focus { border-color: var(--gold); }
.luxury-input::placeholder { color: var(--text-soft); }

.luxury-select {
  appearance: none;
  width: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 0;
  padding: 16px 44px 16px 18px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 300;
  color: var(--text-primary);
  outline: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23C8A961' viewBox='0 0 16 16'><path d='M8 11L3 6h10z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 18px center;
  transition: border-color 0.25s;
}
.luxury-select:focus { border-color: var(--gold); }

/* ═══════════════════════════════════════════════════════════
   BADGES
   ═══════════════════════════════════════════════════════════ */
.badge-gold {
  display: inline-block;
  background: var(--gold);
  color: #000;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 4px 12px;
}
.badge-ink {
  display: inline-block;
  background: rgba(0,0,0,0.85);
  color: var(--gold);
  border: 1px solid var(--border-gold);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 4px 12px;
}
.badge-outline {
  display: inline-block;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  padding: 3px 10px;
  background: rgba(255,255,255,0.02);
}

/* ═══════════════════════════════════════════════════════════
   DIVIDERS / LINES
   ═══════════════════════════════════════════════════════════ */
.gold-line {
  display: block;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold) 50%, transparent);
  transform-origin: center;
  animation: slideRight 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.gold-line-static {
  display: block;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold) 50%, transparent);
}
.divider-gold {
  display: flex;
  align-items: center;
  gap: 18px;
  color: var(--text-soft);
  font-size: 10px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
}
.divider-gold::before, .divider-gold::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-gold));
}
.divider-gold::after { background: linear-gradient(90deg, var(--border-gold), transparent); }

/* ═══════════════════════════════════════════════════════════
   SCROLL INDICATOR (Monte Carlo style)
   ═══════════════════════════════════════════════════════════ */
.scroll-indicator {
  width: 22px;
  height: 36px;
  border: 1px solid var(--gold);
  border-radius: 12px;
  position: relative;
}
.scroll-indicator::before {
  content: '';
  position: absolute;
  top: 6px;
  left: 50%;
  width: 2px;
  height: 6px;
  background: var(--gold);
  border-radius: 2px;
  transform: translateX(-50%);
  animation: scrollDot 2s ease-in-out infinite;
}

/* ═══════════════════════════════════════════════════════════
   REVEAL ON SCROLL
   ═══════════════════════════════════════════════════════════ */
.reveal {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}
.reveal.visible { opacity: 1; transform: translateY(0); }

/* ═══════════════════════════════════════════════════════════
   STAT NUMBERS
   ═══════════════════════════════════════════════════════════ */
.stat-number {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 300;
  color: var(--gold);
  line-height: 1;
}

/* ═══════════════════════════════════════════════════════════
   HERO VIDEO TAGLINE ROTATOR
   ═══════════════════════════════════════════════════════════ */
.hero-tagline {
  animation: textFadeSlide 6s ease-in-out infinite;
}

/* ═══════════════════════════════════════════════════════════
   LEAFLET MAP DARK
   ═══════════════════════════════════════════════════════════ */
.leaflet-container { background: var(--bg-secondary) !important; }
.leaflet-tile { filter: invert(1) hue-rotate(180deg) brightness(0.85) contrast(0.92); }
.leaflet-popup-content-wrapper, .leaflet-popup-tip {
  background: var(--bg-card) !important;
  color: var(--text-primary) !important;
  border-radius: 0 !important;
  box-shadow: 0 4px 24px rgba(0,0,0,0.8) !important;
}

/* ═══════════════════════════════════════════════════════════
   PAGE TRANSITION
   ═══════════════════════════════════════════════════════════ */
.page-enter { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }

/* ═══════════════════════════════════════════════════════════
   NOTIF DOT
   ═══════════════════════════════════════════════════════════ */
.notif-dot {
  width: 6px; height: 6px;
  background: var(--gold);
  border-radius: 50%;
  animation: pulseGold 2s infinite;
}