import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

// FOREST DEPTH PALETTE
const G = {
  primary: "#22D3A5",
  light: "#5EEAC8",
  pale: "rgba(34,211,165,0.1)",
  mid: "rgba(34,211,165,0.22)",
  dark: "#0F9B7E",
};

const BG = {
  base: "#071A24",
  surface: "#0F2C38",
  card: "#123340",
  border: "rgba(255,255,255,0.06)",
  borderAccent: "rgba(34,211,165,0.25)",
  muted: "#15404F",
  text: "#ECFEFF",
  textSub: "#6B94A0",
  textMuted: "#45636D",
};

const AMBER = "#A78BFA";
const CYAN = "#38BDF8";
const CORAL = "#F87171";
const LILAC = "#F472B6";

// PASSWORDS
const ADMIN_PASSWORD = "iktvaadmin";
const VIEWER_PASSWORD = "iktva2026";
const AUTH_KEY = "pscm_events_auth_role";

const PART_COLOR = {
  Exhibitor: "#22D3A5", Speaker: "#38BDF8", Sponsor: "#A78BFA",
  Organizer: "#F472B6", Attendee: "#F87171",
};
const REGION_COLOR = {
  "Middle East": "#22D3A5", Europe: "#38BDF8",
  Americas: "#A78BFA", Asia: "#F472B6", Africa: "#F87171",
};
const TYPE_COLOR = {
  Conference: "#22D3A5", Forum: "#38BDF8", "Supplier Forum": "#A78BFA",
  Exhibition: "#F472B6", Workshop: "#F87171",
};
const REGION_DOTS = [
  { region: "Middle East", x: "62%", y: "48%" },
  { region: "Europe", x: "50%", y: "28%" },
  { region: "Americas", x: "20%", y: "42%" },
  { region: "Asia", x: "76%", y: "38%" },
  { region: "Africa", x: "50%", y: "62%" },
];

function fmtShort(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function fmtFull(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtRange(start, end) {
  if (!start) return "TBD";
  if (!end || start === end) return fmtFull(start);
  const sYear = new Date(start).getFullYear();
  const eYear = new Date(end).getFullYear();
  if (sYear === eYear) {
    return `${fmtShort(start)} – ${fmtShort(end)} ${eYear}`;
  }
  return `${fmtFull(start)} – ${fmtFull(end)}`;
}
function calcDays(start, end) {
  if (!start) return 0;
  if (!end || start === end) return 1;
  const s = new Date(start), e = new Date(end);
  const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 1;
}
function daysLabel(start, end) {
  const d = calcDays(start, end);
  return d === 1 ? "1 day" : `${d} days`;
}
function normalizeUrl(url) {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}
function getEventYear(event) {
  if (!event.start_date) return null;
  return new Date(event.start_date).getFullYear();
}

function useCountUp(target, duration = 1400, trigger = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = null;
    const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(ease(p) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, trigger]);
  return val;
}

function useIsMobile() {
  const detect = () => window.screen.width < 768 || window.innerWidth < 768;
  const [isMobile, setIsMobile] = useState(detect);
  useEffect(() => {
    const handler = () => setIsMobile(detect());
    window.addEventListener("resize", handler);
    window.addEventListener("orientationchange", handler);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("orientationchange", handler);
    };
  }, []);
  return isMobile;
}

function LoginScreen({ onAuth }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function handleSubmit(e) {
    e?.preventDefault();
    if (password === ADMIN_PASSWORD) {
      try { sessionStorage.setItem(AUTH_KEY, "admin"); } catch (err) {}
      onAuth("admin");
    } else if (password === VIEWER_PASSWORD) {
      try { sessionStorage.setItem(AUTH_KEY, "viewer"); } catch (err) {}
      onAuth("viewer");
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: BG.base, fontFamily: "'Outfit',sans-serif", color: BG.text, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", position: "relative", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        input:focus{outline:none;border-color:${G.primary}!important;box-shadow:0 0 0 3px ${G.pale}}
        input::placeholder{color:${BG.textMuted}}
        body{margin:0;overflow-x:hidden;}
      `}</style>

      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-10%", left: "10%", width: "500px", height: "500px", background: "radial-gradient(circle,rgba(34,211,165,0.1) 0%,transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "10%", width: "400px", height: "400px", background: "radial-gradient(circle,rgba(251,191,36,0.06) 0%,transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${BG.muted} 1px,transparent 1px)`, backgroundSize: "40px 40px", opacity: 0.2 }} />
      </div>

      <form onSubmit={handleSubmit} style={{ position: "relative", zIndex: 1, background: `linear-gradient(150deg,${BG.card},${BG.surface})`, border: `1px solid ${BG.borderAccent}`, borderRadius: "20px", padding: "40px 32px", maxWidth: "420px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", animation: shake ? "shake 0.4s" : "fadeIn 0.6s ease" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg,${G.dark},${G.primary},${G.light})`, borderRadius: "20px 20px 0 0" }} />

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px", animation: "float 3s ease-in-out infinite" }}>
          <div style={{ width: "64px", height: "64px", background: `linear-gradient(135deg,${G.dark},${G.primary})`, borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 24px ${G.primary}50` }}>
            <span style={{ fontSize: "28px", color: "white", fontWeight: "800" }}>✦</span>
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "10px", color: G.primary, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: "700", marginBottom: "8px" }}>Procurement & Supply Chain</div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: BG.text, letterSpacing: "-0.02em" }}>P&SCM Events Tracker</h1>
          <p style={{ margin: "8px 0 0", fontSize: "13px", color: BG.textSub }}>Enter access code to continue</p>
        </div>

        <div style={{ marginBottom: "8px" }}>
          <label style={{ fontSize: "10px", color: BG.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "8px", fontWeight: "600" }}>Access Code</label>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false); }}
            placeholder="••••••••"
            autoFocus
            style={{
              width: "100%",
              background: BG.muted,
              border: `1px solid ${error ? CORAL : BG.border}`,
              borderRadius: "12px",
              padding: "16px",
              color: BG.text,
              fontSize: "16px",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "'Outfit',sans-serif",
              letterSpacing: "0.1em",
              transition: "all 0.2s"
            }}
          />
          {error && (
            <div style={{ marginTop: "10px", fontSize: "12px", color: CORAL, textAlign: "center", fontWeight: "500" }}>
              ✕ Incorrect access code
            </div>
          )}
        </div>

        <button type="submit"
          style={{ width: "100%", padding: "16px", marginTop: "20px", background: `linear-gradient(135deg,${G.dark},${G.primary})`, border: "none", borderRadius: "12px", color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "700", letterSpacing: "0.1em", fontFamily: "'Outfit',sans-serif", boxShadow: `0 4px 16px ${G.primary}40`, transition: "transform 0.15s" }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
          UNLOCK DASHBOARD
        </button>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "10px", color: BG.textMuted, letterSpacing: "0.15em" }}>
          P&SCM · CONFIDENTIAL
        </div>
      </form>
    </div>
  );
}

function RadialChart({ data, size = 140 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2, cy = size / 2, r = size * 0.37;
  let angle = -Math.PI / 2;
  const arcs = data.map(d => {
    const sweep = (d.value / total) * Math.PI * 2 - 0.08;
    const sa = angle; angle += sweep + 0.08;
    const x1 = cx + r * Math.cos(sa), y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(sa + sweep), y2 = cy + r * Math.sin(sa + sweep);
    return { ...d, path: `M${x1} ${y1} A${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${x2} ${y2}` };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={BG.muted} strokeWidth="12" />
      {arcs.map((a, i) => (
        <path key={i} d={a.path} fill="none" stroke={a.color} strokeWidth="10" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${a.color}60)` }} />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={G.primary} fontSize="22" fontWeight="700" fontFamily="'Outfit',sans-serif">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={BG.textMuted} fontSize="8" letterSpacing="2" fontFamily="'Outfit',sans-serif">TOTAL</text>
    </svg>
  );
}

function EventModal({ event, onClose, onDelete, onEdit, isMobile, isAdmin }) {
  if (!event) return null;
  const pc = PART_COLOR[event.participation] || G.primary;
  const attendeeList = typeof event.attendees === "string" ? event.attendees.split(",").map(a => a.trim()).filter(Boolean) : (event.attendees || []);
  const websiteUrl = normalizeUrl(event.website);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(10px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 300, padding: isMobile ? "0" : "24px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: `linear-gradient(150deg,${BG.card},${BG.surface})`, border: `1px solid ${BG.borderAccent}`, borderRadius: isMobile ? "20px 20px 0 0" : "20px", padding: "28px", maxWidth: isMobile ? "100%" : "580px", width: "100%", position: "relative", boxShadow: `0 -20px 60px rgba(0,0,0,0.5)`, maxHeight: isMobile ? "88vh" : "90vh", overflowY: "auto", paddingBottom: isMobile ? "40px" : "28px" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg,${G.dark},${G.primary},${G.light})`, borderRadius: "20px 20px 0 0" }} />
        {isMobile && <div style={{ width: "40px", height: "4px", background: BG.muted, borderRadius: "2px", margin: "0 auto 20px" }} />}
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: BG.muted, border: `1px solid ${BG.border}`, color: BG.textSub, borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontSize: "18px" }}>×</button>
        <div style={{ fontSize: "10px", color: G.primary, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "6px", fontWeight: "600" }}>{event.type} · {event.region}</div>
        <h2 style={{ margin: "0 0 4px", fontSize: isMobile ? "20px" : "24px", fontWeight: "700", color: BG.text, letterSpacing: "-0.02em" }}>{event.name}</h2>
        <p style={{ margin: "0 0 4px", fontSize: "13px", color: BG.textSub }}>📍 {event.location}</p>
        <p style={{ margin: "0 0 20px", fontSize: "13px", color: BG.textSub }}>
          📅 {fmtRange(event.start_date, event.end_date)} <span style={{ color: G.light, fontWeight: "600" }}>· {daysLabel(event.start_date, event.end_date)}</span>
        </p>

        {websiteUrl && (
          <a href={websiteUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "12px", background: `linear-gradient(135deg,${G.dark},${G.primary})`, borderRadius: "10px", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: "700", letterSpacing: "0.08em", fontFamily: "'Outfit',sans-serif", boxShadow: `0 4px 12px ${G.primary}40`, textDecoration: "none", marginBottom: "16px", boxSizing: "border-box" }}>
            🔗 VISIT WEBSITE
          </a>
        )}

        <div style={{ background: G.pale, border: `1px solid ${G.mid}`, borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
          <div style={{ fontSize: "9px", color: G.light, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px", fontWeight: "600" }}>Strategic Objective</div>
          <p style={{ margin: 0, fontSize: "13px", color: BG.text, lineHeight: "1.7" }}>{event.objective}</p>
        </div>
        {event.highlight && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: `rgba(251,191,36,0.08)`, border: `1px solid rgba(251,191,36,0.25)`, borderRadius: "10px", padding: "12px 14px", marginBottom: "16px" }}>
            <span style={{ color: AMBER, fontSize: "14px" }}>✦</span>
            <span style={{ fontSize: "13px", color: AMBER, fontWeight: "500" }}>{event.highlight}</span>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
          {[
            { l: "Role", v: event.participation, c: pc },
            { l: "Status", v: event.status, c: event.status === "Completed" ? G.primary : CYAN },
            { l: "Previous", v: event.previous_participation ? "Yes" : "No", c: event.previous_participation ? G.primary : BG.textSub },
          ].map(f => (
            <div key={f.l} style={{ background: BG.muted, border: `1px solid ${BG.border}`, borderRadius: "10px", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "9px", color: BG.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "5px", fontWeight: "600" }}>{f.l}</div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: f.c }}>{f.v}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "9px", color: BG.textMuted, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px", fontWeight: "600" }}>Delegation · {attendeeList.length} Members</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: isAdmin ? "20px" : "0" }}>
          {attendeeList.map(a => (
            <span key={a} style={{ background: G.pale, border: `1px solid ${G.mid}`, color: G.light, borderRadius: "20px", padding: "5px 12px", fontSize: "12px", fontWeight: "500" }}>{a}</span>
          ))}
        </div>

        {isAdmin && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => onEdit(event)}
              style={{ flex: 2, padding: "12px", background: `linear-gradient(135deg,${G.dark},${G.primary})`, border: "none", borderRadius: "10px", color: "white", cursor: "pointer", fontSize: "13px", letterSpacing: "0.08em", fontWeight: "700", fontFamily: "'Outfit',sans-serif", boxShadow: `0 4px 12px ${G.primary}40` }}>
              ✎ EDIT EVENT
            </button>
            <button onClick={() => onDelete(event.id)}
              style={{ flex: 1, padding: "12px", background: `rgba(248,113,113,0.08)`, border: `1px solid rgba(248,113,113,0.25)`, borderRadius: "10px", color: CORAL, cursor: "pointer", fontSize: "13px", letterSpacing: "0.08em", fontWeight: "600", fontFamily: "'Outfit',sans-serif" }}>
              DELETE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EventForm({ initial, onClose, onSubmit, loading, isMobile, isEdit }) {
  const [f, setF] = useState(initial || {
    name: "", type: "Conference", start_date: "", end_date: "", location: "", region: "Middle East",
    objective: "", attendees: "", participation: "Exhibitor",
    status: "Upcoming", highlight: "", previous_participation: false, website: "",
  });
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const inp = { width: "100%", background: BG.muted, border: `1px solid ${BG.border}`, borderRadius: "10px", padding: "12px", color: BG.text, fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "'Outfit',sans-serif" };
  const lbl = { fontSize: "10px", color: BG.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "6px", fontWeight: "600" };

  const days = f.start_date ? calcDays(f.start_date, f.end_date) : 0;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(10px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 300, padding: isMobile ? "0" : "24px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: `linear-gradient(150deg,${BG.card},${BG.surface})`, border: `1px solid ${BG.borderAccent}`, borderRadius: isMobile ? "20px 20px 0 0" : "20px", padding: "28px", maxWidth: isMobile ? "100%" : "560px", width: "100%", maxHeight: isMobile ? "92vh" : "90vh", overflowY: "auto", paddingBottom: isMobile ? "40px" : "28px" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg,${G.dark},${G.primary},${G.light})`, borderRadius: "20px 20px 0 0" }} />
        {isMobile && <div style={{ width: "40px", height: "4px", background: BG.muted, borderRadius: "2px", margin: "0 auto 20px" }} />}
        <h2 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "700", color: BG.text, letterSpacing: "-0.02em" }}>
          {isEdit ? "Edit Event" : "Register New Event"}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div><label style={lbl}>Event Name</label><input style={inp} value={f.name} onChange={e => s("name", e.target.value)} placeholder="e.g. ADIPEC 2025" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><label style={lbl}>Type</label><select style={inp} value={f.type} onChange={e => s("type", e.target.value)}>{Object.keys(TYPE_COLOR).map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label style={lbl}>Region</label><select style={inp} value={f.region} onChange={e => s("region", e.target.value)}>{["Middle East", "Europe", "Americas", "Asia", "Africa"].map(r => <option key={r}>{r}</option>)}</select></div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={lbl}>Start Date</label>
              <input style={inp} type="date" value={f.start_date || ""} onChange={e => s("start_date", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>End Date <span style={{ opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
              <input style={inp} type="date" value={f.end_date || ""} onChange={e => s("end_date", e.target.value)} min={f.start_date || ""} />
            </div>
          </div>
          {days > 0 && (
            <div style={{ background: G.pale, border: `1px solid ${G.mid}`, borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: G.light, fontWeight: "600", textAlign: "center", marginTop: "-8px" }}>
              Duration: {days === 1 ? "1 day" : `${days} days`}
            </div>
          )}

          <div><label style={lbl}>Location</label><input style={inp} value={f.location} onChange={e => s("location", e.target.value)} placeholder="City, Country" /></div>

          <div>
            <label style={lbl}>Event Website <span style={{ opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <input style={inp} value={f.website || ""} onChange={e => s("website", e.target.value)} placeholder="www.example.com" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><label style={lbl}>Participation Role</label><select style={inp} value={f.participation} onChange={e => s("participation", e.target.value)}>{Object.keys(PART_COLOR).map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label style={lbl}>Status</label><select style={inp} value={f.status} onChange={e => s("status", e.target.value)}>{["Upcoming", "Completed", "Cancelled"].map(x => <option key={x}>{x}</option>)}</select></div>
          </div>

          <div>
            <label style={lbl}>Previous Participation?</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={() => s("previous_participation", true)}
                style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1px solid`, borderColor: f.previous_participation ? G.primary : BG.border, background: f.previous_participation ? G.pale : BG.muted, color: f.previous_participation ? G.light : BG.textSub, cursor: "pointer", fontSize: "13px", fontWeight: "600", fontFamily: "'Outfit',sans-serif", letterSpacing: "0.05em" }}>
                YES
              </button>
              <button type="button" onClick={() => s("previous_participation", false)}
                style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1px solid`, borderColor: !f.previous_participation ? CORAL : BG.border, background: !f.previous_participation ? `rgba(248,113,113,0.08)` : BG.muted, color: !f.previous_participation ? CORAL : BG.textSub, cursor: "pointer", fontSize: "13px", fontWeight: "600", fontFamily: "'Outfit',sans-serif", letterSpacing: "0.05em" }}>
                NO
              </button>
            </div>
          </div>

          <div><label style={lbl}>Strategic Objective</label><textarea style={{ ...inp, minHeight: "80px", resize: "vertical" }} value={f.objective} onChange={e => s("objective", e.target.value)} /></div>
          <div><label style={lbl}>Key Highlight</label><input style={inp} value={f.highlight} onChange={e => s("highlight", e.target.value)} placeholder="e.g. 200+ suppliers engaged" /></div>
          <div><label style={lbl}>Attendees (comma-separated)</label><input style={inp} value={f.attendees} onChange={e => s("attendees", e.target.value)} placeholder="Name 1, Name 2, Name 3" /></div>
        </div>
        <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "14px", background: "transparent", border: `1px solid ${BG.border}`, borderRadius: "12px", color: BG.textSub, cursor: "pointer", fontSize: "14px", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
          <button onClick={() => { if (!f.name || !f.start_date) return; onSubmit(f); }} disabled={loading}
            style={{ flex: 2, padding: "14px", background: `linear-gradient(135deg,${G.dark},${G.primary})`, border: "none", borderRadius: "12px", color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "700", letterSpacing: "0.06em", opacity: loading ? 0.7 : 1, fontFamily: "'Outfit',sans-serif", boxShadow: `0 4px 14px ${G.primary}40` }}>
            {loading ? "SAVING..." : (isEdit ? "SAVE CHANGES" : "REGISTER EVENT")}
          </button>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color, icon, delay }) {
  const ref = useRef();
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => e.isIntersecting && setVis(true), { threshold: 0.2 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  const n = useCountUp(typeof value === "number" ? value : 0, 1400, vis);
  return (
    <div ref={ref} style={{ background: `linear-gradient(135deg,${BG.card},${BG.surface})`, border: `1px solid ${BG.border}`, borderRadius: "16px", padding: "24px", position: "relative", overflow: "hidden", boxShadow: `0 4px 24px rgba(0,0,0,0.35)`, opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(14px)", transition: `opacity 0.5s ${delay}s, transform 0.5s ${delay}s` }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
      <div style={{ position: "absolute", top: "18px", right: "18px", width: "38px", height: "38px", background: `${color}15`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px", border: `1px solid ${color}25` }}>{icon}</div>
      <div style={{ fontSize: "10px", color: BG.textMuted, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "12px", fontWeight: "600" }}>{label}</div>
      <div style={{ fontSize: "30px", fontWeight: "700", color: BG.text, lineHeight: 1, marginBottom: "6px", letterSpacing: "-0.02em" }}>{n.toLocaleString()}</div>
      <div style={{ fontSize: "12px", color, fontWeight: "500" }}>{sub}</div>
      <div style={{ position: "absolute", bottom: 0, left: 0, width: "40%", height: "1px", background: `linear-gradient(90deg,${color}50,transparent)` }} />
    </div>
  );
}

function TypeBar({ label, value, max, color }) {
  const ref = useRef(); const [vis, setVis] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => e.isIntersecting && setVis(true), { threshold: 0.3 });
    if (ref.current) o.observe(ref.current); return () => o.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "12px", color: BG.textSub, fontWeight: "500" }}>{label}</span>
        <span style={{ fontSize: "12px", color, fontWeight: "700" }}>{value}</span>
      </div>
      <div style={{ height: "5px", background: BG.muted, borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: vis ? `${(value / max) * 100}%` : "0%", background: `linear-gradient(90deg,${color},${color}80)`, borderRadius: "3px", transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)", boxShadow: `0 0 8px ${color}50` }} />
      </div>
    </div>
  );
}

function MobileHome({ events, onSelectEvent, filterStatus, setFilterStatus, filterYear, setFilterYear, availableYears }) {
  const completed = events.filter(e => e.status === "Completed").length;
  const upcoming = events.filter(e => e.status === "Upcoming").length;
  const uniqueAttendees = [...new Set(events.flatMap(e => typeof e.attendees === "string" ? e.attendees.split(",").map(a => a.trim()) : (e.attendees || [])))].filter(Boolean).length;
  const filtered = events.filter(e => {
    if (filterStatus !== "All" && e.status !== filterStatus) return false;
    if (filterYear !== "All" && getEventYear(e) !== filterYear) return false;
    return true;
  });

  const kpis = [
    { label: "Total Events", value: events.length, color: G.primary },
    { label: "Completed", value: completed, color: CYAN },
    { label: "Upcoming", value: upcoming, color: AMBER },
    { label: "Delegation", value: uniqueAttendees, color: LILAC },
  ];

  return (
    <div style={{ paddingBottom: "90px" }}>
      <div style={{ background: `linear-gradient(135deg,${BG.surface},${BG.card})`, padding: "20px 16px", borderBottom: `1px solid ${BG.border}` }}>
        <div style={{ fontSize: "10px", color: G.primary, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Procurement & Supply Chain</div>
        <div style={{ fontSize: "22px", fontWeight: "800", color: BG.text, letterSpacing: "-0.02em", marginBottom: "16px" }}>Events Overview</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
          {kpis.map(k => (
            <div key={k.label} style={{ background: BG.base, borderRadius: "14px", padding: "14px", border: `1px solid ${BG.border}`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: k.color }} />
              <div style={{ fontSize: "9px", color: BG.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "6px" }}>{k.label}</div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: k.color, letterSpacing: "-0.02em" }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Status filter */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
          {["All", "Completed", "Upcoming"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "6px 16px", borderRadius: "20px", border: `1px solid`, borderColor: filterStatus === s ? G.primary : BG.border, background: filterStatus === s ? G.pale : "transparent", color: filterStatus === s ? G.light : BG.textSub, fontSize: "11px", cursor: "pointer", fontWeight: "600", fontFamily: "'Outfit',sans-serif" }}>
              {s}
            </button>
          ))}
        </div>

        {/* Year filter */}
        {availableYears.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "9px", color: BG.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600" }}>Year:</span>
            <button onClick={() => setFilterYear("All")} style={{ padding: "5px 12px", borderRadius: "16px", border: `1px solid`, borderColor: filterYear === "All" ? AMBER : BG.border, background: filterYear === "All" ? "rgba(251,191,36,0.1)" : "transparent", color: filterYear === "All" ? AMBER : BG.textSub, fontSize: "11px", cursor: "pointer", fontWeight: "600", fontFamily: "'Outfit',sans-serif" }}>
              All
            </button>
            {availableYears.map(y => (
              <button key={y} onClick={() => setFilterYear(y)} style={{ padding: "5px 12px", borderRadius: "16px", border: `1px solid`, borderColor: filterYear === y ? AMBER : BG.border, background: filterYear === y ? "rgba(251,191,36,0.1)" : "transparent", color: filterYear === y ? AMBER : BG.textSub, fontSize: "11px", cursor: "pointer", fontWeight: "600", fontFamily: "'Outfit',sans-serif" }}>
                {y}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "16px" }}>
        <div style={{ fontSize: "11px", color: BG.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "12px" }}>
          {filtered.length} Event{filtered.length !== 1 ? "s" : ""}
        </div>
        {filtered.map(event => {
          const pc = PART_COLOR[event.participation] || G.primary;
          const done = event.status === "Completed";
          const lineColor = done ? G.primary : CYAN;
          const attendeeList = typeof event.attendees === "string" ? event.attendees.split(",").map(a => a.trim()).filter(Boolean) : (event.attendees || []);
          return (
            <div key={event.id} onClick={() => onSelectEvent(event)}
              style={{ background: `linear-gradient(135deg,${BG.card},${BG.surface})`, border: `1px solid ${BG.border}`, borderRadius: "16px", padding: "16px", marginBottom: "12px", position: "relative", overflow: "hidden", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
              <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "3px", background: lineColor, boxShadow: `0 0 8px ${lineColor}60` }} />
              <div style={{ paddingLeft: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <div style={{ flex: 1, paddingRight: "10px", textAlign: "left" }}>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: BG.text, letterSpacing: "-0.01em", marginBottom: "2px", textAlign: "left" }}>{event.name}</div>
                    <div style={{ fontSize: "11px", color: BG.textSub, textAlign: "left" }}>📍 {event.location}</div>
                    <div style={{ fontSize: "11px", color: BG.textSub, marginTop: "2px", textAlign: "left" }}>
                      📅 {fmtRange(event.start_date, event.end_date)} · <span style={{ color: G.light }}>{daysLabel(event.start_date, event.end_date)}</span>
                    </div>
                  </div>
                  <span style={{ background: `${pc}15`, color: pc, border: `1px solid ${pc}30`, borderRadius: "6px", padding: "3px 8px", fontSize: "10px", fontWeight: "700", whiteSpace: "nowrap" }}>{event.participation}</span>
                </div>
                <div style={{ fontSize: "12px", color: BG.textSub, lineHeight: "1.5", marginBottom: "10px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textAlign: "left" }}>{event.objective}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ display: "flex" }}>
                      {attendeeList.slice(0, 3).map((a, idx) => (
                        <div key={idx} style={{ width: "22px", height: "22px", borderRadius: "50%", background: `hsl(${idx * 70 + 150},40%,32%)`, border: `2px solid ${BG.card}`, marginLeft: idx > 0 ? "-6px" : "0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", color: "white", fontWeight: "700" }}>
                          {a.charAt(0)}
                        </div>
                      ))}
                    </div>
                    <span style={{ fontSize: "11px", color: BG.textMuted }}>{attendeeList.length} members</span>
                  </div>
                  {event.previous_participation && (
                    <span style={{ fontSize: "10px", color: G.primary, fontWeight: "600", background: G.pale, border: `1px solid ${G.mid}`, borderRadius: "12px", padding: "3px 8px" }}>
                      ↻ Returning
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px 20px" }}>
            <div style={{ fontSize: "32px", opacity: 0.2, marginBottom: "12px" }}>✦</div>
            <div style={{ fontSize: "16px", color: BG.textSub, fontWeight: "500" }}>No events match the filters</div>
          </div>
        )}
      </div>
    </div>
  );
}

function MobileCharts({ events }) {
  const partData = Object.entries(events.reduce((a, e) => { a[e.participation] = (a[e.participation] || 0) + 1; return a; }, {})).map(([label, value]) => ({ label, value, color: PART_COLOR[label] || G.primary }));
  const typeData = Object.entries(events.reduce((a, e) => { a[e.type] = (a[e.type] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]);
  const maxT = Math.max(...typeData.map(t => t[1]), 1);
  const regionCounts = events.reduce((a, e) => { a[e.region] = (a[e.region] || 0) + 1; return a; }, {});
  const returning = events.filter(e => e.previous_participation).length;

  return (
    <div style={{ padding: "20px 16px 90px" }}>
      <div style={{ fontSize: "18px", fontWeight: "800", color: BG.text, letterSpacing: "-0.02em", marginBottom: "20px" }}>Analytics</div>

      <div style={{ background: `linear-gradient(135deg,${BG.card},${BG.surface})`, border: `1px solid ${BG.border}`, borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
        <div style={{ fontSize: "10px", color: G.primary, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: "600", marginBottom: "14px" }}>Participation Roles</div>
        {partData.length > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <RadialChart data={partData} size={130} />
            <div style={{ flex: 1 }}>
              {partData.map(d => (
                <div key={d.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: d.color, boxShadow: `0 0 5px ${d.color}` }} />
                    <span style={{ fontSize: "12px", color: BG.textSub, fontWeight: "500" }}>{d.label}</span>
                  </div>
                  <span style={{ fontSize: "15px", color: d.color, fontWeight: "700" }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : <div style={{ color: BG.textMuted, fontSize: "13px" }}>No events yet</div>}
      </div>

      <div style={{ background: `linear-gradient(135deg,${BG.card},${BG.surface})`, border: `1px solid ${BG.border}`, borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
        <div style={{ fontSize: "10px", color: G.primary, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: "600", marginBottom: "14px" }}>Events by Type</div>
        {typeData.length > 0 ? typeData.map(([t, c]) => <TypeBar key={t} label={t} value={c} max={maxT} color={TYPE_COLOR[t] || G.primary} />) : <div style={{ color: BG.textMuted, fontSize: "13px" }}>No data yet</div>}
      </div>

      <div style={{ background: `linear-gradient(135deg,${BG.card},${BG.surface})`, border: `1px solid ${BG.border}`, borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
        <div style={{ fontSize: "10px", color: G.primary, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: "600", marginBottom: "14px" }}>Events by Region</div>
        {Object.entries(regionCounts).map(([r, c]) => (
          <div key={r} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: REGION_COLOR[r] || G.primary, boxShadow: `0 0 6px ${REGION_COLOR[r] || G.primary}` }} />
              <span style={{ fontSize: "13px", color: BG.textSub, fontWeight: "500" }}>{r}</span>
            </div>
            <span style={{ fontSize: "16px", color: REGION_COLOR[r] || G.primary, fontWeight: "700" }}>{c}</span>
          </div>
        ))}
        {Object.keys(regionCounts).length === 0 && <div style={{ color: BG.textMuted, fontSize: "13px" }}>No data yet</div>}
      </div>

      <div style={{ background: `linear-gradient(135deg,${BG.card},${BG.surface})`, border: `1px solid ${BG.border}`, borderRadius: "16px", padding: "20px" }}>
        <div style={{ fontSize: "10px", color: G.primary, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: "600", marginBottom: "10px" }}>Returning Events</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <div style={{ fontSize: "36px", fontWeight: "800", color: G.primary, letterSpacing: "-0.02em" }}>{returning}</div>
          <div style={{ fontSize: "13px", color: BG.textSub }}>of {events.length} ({events.length > 0 ? Math.round(returning / events.length * 100) : 0}%)</div>
        </div>
        <div style={{ fontSize: "11px", color: BG.textMuted, marginTop: "4px" }}>Events with prior participation history</div>
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab, onAdd, isAdmin }) {
  const items = isAdmin
    ? [{ id: "home", label: "Events", icon: "◈" }, null, { id: "charts", label: "Analytics", icon: "◉" }]
    : [{ id: "home", label: "Events", icon: "◈" }, { id: "charts", label: "Analytics", icon: "◉" }];

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200, background: `rgba(15,31,26,0.97)`, backdropFilter: "blur(20px)", borderTop: `1px solid ${BG.border}`, paddingBottom: "env(safe-area-inset-bottom, 16px)", display: "flex", alignItems: "center", justifyContent: "space-around", height: "70px" }}>
      {items.map((item) => {
        if (!item) return (
          <button key="add" onClick={onAdd} style={{ width: "52px", height: "52px", borderRadius: "50%", background: `linear-gradient(135deg,${G.dark},${G.primary})`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${G.primary}50`, WebkitTapHighlightColor: "transparent", marginTop: "-20px" }}>
            <span style={{ fontSize: "28px", color: "white", fontWeight: "300", lineHeight: 1 }}>+</span>
          </button>
        );
        return (
          <button key={item.id} onClick={() => setTab(item.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", background: "none", border: "none", cursor: "pointer", padding: "8px", WebkitTapHighlightColor: "transparent" }}>
            <span style={{ fontSize: "20px", color: tab === item.id ? G.primary : BG.textMuted }}>{item.icon}</span>
            <span style={{ fontSize: "10px", color: tab === item.id ? G.primary : BG.textMuted, fontWeight: "600", fontFamily: "'Outfit',sans-serif" }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState(() => {
    try {
      const stored = sessionStorage.getItem(AUTH_KEY);
      return stored === "admin" || stored === "viewer" ? stored : null;
    } catch (err) { return null; }
  });

  const isAdmin = role === "admin";
  const isMobile = useIsMobile();
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeRegion, setActiveRegion] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [mobileTab, setMobileTab] = useState("home");
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { if (role) fetchEvents(); }, [role]);

  async function fetchEvents() {
    setLoadingData(true);
    const { data, error } = await supabase.from("events").select("*").order("start_date", { ascending: false });
    if (error) { setError("Could not load events."); console.error(error); }
    else setEvents(data || []);
    setLoadingData(false);
  }

  async function handleAdd(f) {
    setSaving(true);
    const { data, error } = await supabase.from("events").insert([{
      name: f.name, type: f.type, start_date: f.start_date, end_date: f.end_date || null,
      location: f.location, region: f.region, objective: f.objective,
      attendees: f.attendees, participation: f.participation, status: f.status,
      highlight: f.highlight, previous_participation: f.previous_participation,
      website: f.website || null,
    }]).select();
    if (error) { alert("Error saving: " + error.message); }
    else { setEvents(prev => [data[0], ...prev]); setAdding(false); }
    setSaving(false);
  }

  async function handleUpdate(f) {
    setSaving(true);
    const { data, error } = await supabase.from("events").update({
      name: f.name, type: f.type, start_date: f.start_date, end_date: f.end_date || null,
      location: f.location, region: f.region, objective: f.objective,
      attendees: f.attendees, participation: f.participation, status: f.status,
      highlight: f.highlight, previous_participation: f.previous_participation,
      website: f.website || null,
    }).eq("id", editing.id).select();
    if (error) { alert("Error updating: " + error.message); }
    else {
      setEvents(prev => prev.map(e => e.id === editing.id ? data[0] : e));
      setEditing(null);
      setSelected(null);
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { alert("Error deleting: " + error.message); }
    else { setEvents(prev => prev.filter(e => e.id !== id)); setSelected(null); }
  }

  function handleEditClick(event) {
    setEditing(event);
    setSelected(null);
  }

  // Auto-generate available years from events (sorted descending)
  const availableYears = useMemo(() => {
    const years = [...new Set(events.map(getEventYear).filter(y => y !== null))];
    return years.sort((a, b) => b - a);
  }, [events]);

  if (!role) {
    return <LoginScreen onAuth={setRole} />;
  }

  const filtered = events.filter(e => {
    if (filterStatus !== "All" && e.status !== filterStatus) return false;
    if (filterYear !== "All" && getEventYear(e) !== filterYear) return false;
    if (activeRegion && e.region !== activeRegion) return false;
    return true;
  });

  const uniqueAttendees = [...new Set(events.flatMap(e => typeof e.attendees === "string" ? e.attendees.split(",").map(a => a.trim()) : (e.attendees || [])))].filter(Boolean).length;
  const completed = events.filter(e => e.status === "Completed").length;
  const upcoming = events.filter(e => e.status === "Upcoming").length;
  const returning = events.filter(e => e.previous_participation).length;
  const regionCounts = events.reduce((a, e) => { a[e.region] = (a[e.region] || 0) + 1; return a; }, {});
  const partData = Object.entries(events.reduce((a, e) => { a[e.participation] = (a[e.participation] || 0) + 1; return a; }, {})).map(([label, value]) => ({ label, value, color: PART_COLOR[label] || G.primary }));
  const typeData = Object.entries(events.reduce((a, e) => { a[e.type] = (a[e.type] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]);
  const maxT = Math.max(...typeData.map(t => t[1]), 1);

  return (
    <div style={{ minHeight: "100vh", background: BG.base, fontFamily: "'Outfit',sans-serif", color: BG.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
        @keyframes pulse{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(2);opacity:0.15}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${BG.muted};border-radius:2px}
        select option{background:${BG.card};color:${BG.text}}
        input::placeholder{color:${BG.textMuted}}
        textarea::placeholder{color:${BG.textMuted}}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5)}
        body{margin:0;overflow-x:hidden;}
      `}</style>

      {isMobile && (
        <>
          <div style={{ position: "sticky", top: 0, zIndex: 100, background: `rgba(15,31,26,0.97)`, backdropFilter: "blur(20px)", borderBottom: `1px solid ${BG.border}`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "34px", height: "34px", background: `linear-gradient(135deg,${G.dark},${G.primary})`, borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 10px ${G.primary}40` }}>
                <span style={{ fontSize: "15px", color: "white", fontWeight: "800" }}>✦</span>
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: "800", color: BG.text, letterSpacing: "-0.02em", lineHeight: 1.2 }}>P&SCM Events</div>
                <div style={{ fontSize: "9px", color: isAdmin ? G.primary : AMBER, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600" }}>{isAdmin ? "Admin" : "View only"}</div>
              </div>
            </div>
            <div style={{ fontSize: "12px", color: BG.textMuted, fontWeight: "500" }}>{events.length} events</div>
          </div>
          {loadingData ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontSize: "32px", animation: "spin 1s linear infinite", display: "inline-block", marginBottom: "16px", color: G.primary }}>✦</div>
              <div style={{ fontSize: "16px", fontWeight: "500", color: BG.textSub }}>Loading events...</div>
            </div>
          ) : (
            <>
              {mobileTab === "home" && <MobileHome events={events} onSelectEvent={setSelected} filterStatus={filterStatus} setFilterStatus={setFilterStatus} filterYear={filterYear} setFilterYear={setFilterYear} availableYears={availableYears} />}
              {mobileTab === "charts" && <MobileCharts events={events} />}
            </>
          )}
          <BottomNav tab={mobileTab} setTab={setMobileTab} onAdd={() => setAdding(true)} isAdmin={isAdmin} />
        </>
      )}

      {!isMobile && (
        <>
          <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
            <div style={{ position: "absolute", top: "-15%", left: "15%", width: "600px", height: "600px", background: "radial-gradient(circle,rgba(34,211,165,0.06) 0%,transparent 65%)", borderRadius: "50%" }} />
            <div style={{ position: "absolute", bottom: "5%", right: "5%", width: "500px", height: "500px", background: "radial-gradient(circle,rgba(251,191,36,0.04) 0%,transparent 65%)", borderRadius: "50%" }} />
            <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${BG.muted} 1px,transparent 1px)`, backgroundSize: "40px 40px", opacity: 0.25 }} />
          </div>

          <header style={{ position: "sticky", top: 0, zIndex: 100, background: `rgba(15,31,26,0.92)`, backdropFilter: "blur(20px)", borderBottom: `1px solid ${BG.border}` }}>
            <div style={{ maxWidth: "100%", margin: "0 auto", padding: "0 48px", height: "68px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "40px", height: "40px", background: `linear-gradient(135deg,${G.dark},${G.primary})`, borderRadius: "11px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${G.primary}40` }}>
                  <span style={{ fontSize: "18px", color: "white", fontWeight: "800" }}>✦</span>
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: BG.text, letterSpacing: "-0.02em" }}>P&SCM Events Tracker</div>
                  <div style={{ fontSize: "10px", color: G.primary, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: "600" }}>Procurement & Supply Chain Management</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ padding: "6px 12px", background: isAdmin ? G.pale : "rgba(251,191,36,0.1)", border: `1px solid ${isAdmin ? G.mid : "rgba(251,191,36,0.3)"}`, borderRadius: "20px", fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", color: isAdmin ? G.light : AMBER, marginRight: "8px" }}>
                  {isAdmin ? "◆ ADMIN" : "◉ VIEW ONLY"}
                </div>
                {["All", "Completed", "Upcoming"].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "7px 16px", borderRadius: "20px", border: `1px solid`, borderColor: filterStatus === s ? G.primary : BG.border, background: filterStatus === s ? G.pale : "transparent", color: filterStatus === s ? G.light : BG.textSub, fontSize: "11px", cursor: "pointer", letterSpacing: "0.08em", fontWeight: "600", transition: "all 0.2s", fontFamily: "'Outfit',sans-serif" }}>
                    {s.toUpperCase()}
                  </button>
                ))}
                {isAdmin && (
                  <button onClick={() => setAdding(true)} style={{ marginLeft: "8px", padding: "9px 20px", background: `linear-gradient(135deg,${G.dark},${G.primary})`, border: "none", borderRadius: "10px", color: "white", fontSize: "12px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.08em", boxShadow: `0 4px 14px ${G.primary}40`, fontFamily: "'Outfit',sans-serif" }}>
                    + ADD EVENT
                  </button>
                )}
              </div>
            </div>
          </header>

          <main style={{ position: "relative", zIndex: 1, maxWidth: "100%", margin: "0 auto", padding: "32px 48px" }}>
            {loadingData && (
              <div style={{ textAlign: "center", padding: "80px" }}>
                <div style={{ fontSize: "32px", animation: "spin 1s linear infinite", display: "inline-block", marginBottom: "16px", color: G.primary }}>✦</div>
                <div style={{ fontSize: "18px", fontWeight: "500", color: BG.textSub }}>Loading events...</div>
              </div>
            )}
            {error && <div style={{ background: `rgba(248,113,113,0.08)`, border: `1px solid rgba(248,113,113,0.25)`, borderRadius: "12px", padding: "16px 20px", marginBottom: "24px", color: CORAL, fontSize: "13px" }}>⚠️ {error}</div>}

            {!loadingData && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "20px" }}>
                  <KpiCard label="Total Events" value={events.length} sub={`${upcoming} upcoming · ${completed} completed`} color={G.primary} icon="✦" delay={0} />
                  <KpiCard label="Completed" value={completed} sub={`${events.length > 0 ? Math.round(completed / events.length * 100) : 0}% completion rate`} color={CYAN} icon="◉" delay={0.08} />
                  <KpiCard label="Returning Events" value={returning} sub={`${events.length > 0 ? Math.round(returning / events.length * 100) : 0}% previously attended`} color={AMBER} icon="↻" delay={0.16} />
                  <KpiCard label="Delegation Members" value={uniqueAttendees} sub="unique participants" color={LILAC} icon="◎" delay={0.24} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                  <div style={{ background: `linear-gradient(135deg,${BG.card},${BG.surface})`, border: `1px solid ${BG.border}`, borderRadius: "16px", padding: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}>
                    <div style={{ fontSize: "10px", color: G.primary, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3px", fontWeight: "600" }}>Global Footprint</div>
                    <div style={{ fontSize: "19px", fontWeight: "700", color: BG.text, marginBottom: "16px" }}>Event Presence by Region</div>
                    <div style={{ position: "relative", height: "148px", background: BG.base, borderRadius: "10px", border: `1px solid ${BG.border}`, overflow: "hidden", marginBottom: "14px" }}>
                      {[25, 50, 75].map(p => <div key={p} style={{ position: "absolute", left: `${p}%`, top: 0, bottom: 0, borderLeft: `1px solid ${BG.muted}` }} />)}
                      {[35, 65].map(p => <div key={p} style={{ position: "absolute", top: `${p}%`, left: 0, right: 0, borderTop: `1px solid ${BG.muted}` }} />)}
                      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: `1px solid rgba(34,211,165,0.15)` }} />
                      <div style={{ position: "absolute", bottom: "6px", right: "10px", fontSize: "8px", color: BG.textMuted }}>WORLD MAP</div>
                      {REGION_DOTS.map(dot => {
                        const count = regionCounts[dot.region] || 0;
                        const color = REGION_COLOR[dot.region] || G.primary;
                        const isActive = activeRegion === dot.region;
                        return (
                          <div key={dot.region} onClick={() => count > 0 && setActiveRegion(activeRegion === dot.region ? null : dot.region)}
                            style={{ position: "absolute", left: dot.x, top: dot.y, transform: "translate(-50%,-50%)", cursor: count > 0 ? "pointer" : "default" }}>
                            {count > 0 && <div style={{ position: "absolute", inset: "-10px", borderRadius: "50%", background: color, opacity: 0.12, animation: "pulse 2.5s ease infinite" }} />}
                            <div style={{ width: count > 0 ? "14px" : "6px", height: count > 0 ? "14px" : "6px", borderRadius: "50%", background: count > 0 ? color : BG.muted, border: isActive ? `2px solid ${color}` : "none", transition: "all 0.3s", boxShadow: count > 0 ? `0 0 12px ${color}70` : "none" }} />
                            {count > 0 && <div style={{ position: "absolute", top: "-24px", left: "50%", transform: "translateX(-50%)", background: BG.card, border: `1px solid ${BG.border}`, borderRadius: "5px", padding: "2px 8px", fontSize: "9px", color: BG.text, whiteSpace: "nowrap", pointerEvents: "none", fontWeight: "600" }}>{dot.region} · {count}</div>}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {Object.entries(regionCounts).map(([r, c]) => (
                        <div key={r} onClick={() => setActiveRegion(activeRegion === r ? null : r)}
                          style={{ display: "flex", alignItems: "center", gap: "6px", background: activeRegion === r ? `${REGION_COLOR[r] || G.primary}18` : BG.muted, border: `1px solid ${activeRegion === r ? (REGION_COLOR[r] || G.primary) + "50" : BG.border}`, borderRadius: "20px", padding: "4px 12px", cursor: "pointer", transition: "all 0.2s" }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: REGION_COLOR[r] || G.primary }} />
                          <span style={{ fontSize: "11px", color: BG.textSub, fontWeight: "500" }}>{r}</span>
                          <span style={{ fontSize: "11px", color: REGION_COLOR[r] || G.primary, fontWeight: "700" }}>{c}</span>
                        </div>
                      ))}
                      {activeRegion && <button onClick={() => setActiveRegion(null)} style={{ fontSize: "11px", color: G.primary, background: "none", border: "none", cursor: "pointer", fontWeight: "600", fontFamily: "'Outfit',sans-serif" }}>✕ Clear</button>}
                    </div>
                  </div>

                  <div style={{ background: `linear-gradient(135deg,${BG.card},${BG.surface})`, border: `1px solid ${BG.border}`, borderRadius: "16px", padding: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}>
                    <div style={{ fontSize: "10px", color: G.primary, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3px", fontWeight: "600" }}>Breakdown</div>
                    <div style={{ fontSize: "19px", fontWeight: "700", color: BG.text, marginBottom: "16px" }}>Participation Roles</div>
                    {partData.length > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <RadialChart data={partData} size={135} />
                        <div style={{ flex: 1 }}>
                          {partData.map(d => (
                            <div key={d.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: d.color }} />
                                <span style={{ fontSize: "12px", color: BG.textSub, fontWeight: "500" }}>{d.label}</span>
                              </div>
                              <span style={{ fontSize: "15px", color: d.color, fontWeight: "700" }}>{d.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : <div style={{ color: BG.textMuted, fontSize: "13px" }}>No events yet</div>}
                  </div>

                  <div style={{ background: `linear-gradient(135deg,${BG.card},${BG.surface})`, border: `1px solid ${BG.border}`, borderRadius: "16px", padding: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}>
                    <div style={{ fontSize: "10px", color: G.primary, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3px", fontWeight: "600" }}>Distribution</div>
                    <div style={{ fontSize: "19px", fontWeight: "700", color: BG.text, marginBottom: "18px" }}>Events by Type</div>
                    {typeData.length > 0 ? typeData.map(([t, c]) => <TypeBar key={t} label={t} value={c} max={maxT} color={TYPE_COLOR[t] || G.primary} />) : <div style={{ color: BG.textMuted, fontSize: "13px" }}>No data yet</div>}
                    <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: `1px solid ${BG.border}`, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "10px", color: BG.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600" }}>Total Types</span>
                      <span style={{ fontSize: "16px", color: G.primary, fontWeight: "700" }}>{typeData.length}</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: `linear-gradient(135deg,${BG.card},${BG.surface})`, border: `1px solid ${BG.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}>
                  <div style={{ padding: "20px 28px", borderBottom: `1px solid ${BG.border}`, background: "rgba(0,0,0,0.15)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: availableYears.length > 0 ? "14px" : "0" }}>
                      <div>
                        <div style={{ fontSize: "10px", color: G.primary, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3px", fontWeight: "600" }}>Events Registry</div>
                        <div style={{ fontSize: "19px", fontWeight: "700", color: BG.text }}>
                          {filtered.length} Event{filtered.length !== 1 ? "s" : ""}{activeRegion ? ` · ${activeRegion}` : ""}{filterStatus !== "All" ? ` · ${filterStatus}` : ""}{filterYear !== "All" ? ` · ${filterYear}` : ""}
                        </div>
                      </div>
                      <div style={{ fontSize: "10px", color: BG.textMuted, letterSpacing: "0.08em" }}>CLICK ANY ROW TO VIEW DETAILS</div>
                    </div>

                    {/* Year filter pills */}
                    {availableYears.length > 0 && (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "10px", color: BG.textMuted, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: "600", marginRight: "4px" }}>Filter by year:</span>
                        <button onClick={() => setFilterYear("All")} style={{ padding: "5px 14px", borderRadius: "16px", border: `1px solid`, borderColor: filterYear === "All" ? AMBER : BG.border, background: filterYear === "All" ? "rgba(251,191,36,0.1)" : "transparent", color: filterYear === "All" ? AMBER : BG.textSub, fontSize: "11px", cursor: "pointer", fontWeight: "600", letterSpacing: "0.05em", fontFamily: "'Outfit',sans-serif", transition: "all 0.15s" }}>
                          ALL
                        </button>
                        {availableYears.map(y => (
                          <button key={y} onClick={() => setFilterYear(y)} style={{ padding: "5px 14px", borderRadius: "16px", border: `1px solid`, borderColor: filterYear === y ? AMBER : BG.border, background: filterYear === y ? "rgba(251,191,36,0.1)" : "transparent", color: filterYear === y ? AMBER : BG.textSub, fontSize: "11px", cursor: "pointer", fontWeight: "600", letterSpacing: "0.05em", fontFamily: "'Outfit',sans-serif", transition: "all 0.15s" }}>
                            {y}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1.4fr 1.3fr 1fr 0.9fr 1.1fr", padding: "10px 28px", borderBottom: `1px solid ${BG.border}`, background: "rgba(0,0,0,0.1)" }}>
                    {["Event", "Dates & Duration", "Objective", "Role", "Delegation", "Previous Participation"].map(h => (
                      <div key={h} style={{ fontSize: "9px", color: BG.textMuted, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: "600" }}>{h}</div>
                    ))}
                  </div>
                  {filtered.map(event => {
                    const pc = PART_COLOR[event.participation] || G.primary;
                    const done = event.status === "Completed";
                    const lineColor = done ? G.primary : CYAN;
                    const attendeeList = typeof event.attendees === "string" ? event.attendees.split(",").map(a => a.trim()).filter(Boolean) : (event.attendees || []);
                    return (
                      <div key={event.id} onClick={() => setSelected(event)}
                        style={{ display: "grid", gridTemplateColumns: "2.2fr 1.4fr 1.3fr 1fr 0.9fr 1.1fr", padding: "18px 28px", borderBottom: `1px solid ${BG.border}`, cursor: "pointer", transition: "background 0.15s", alignItems: "center" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(34,211,165,0.04)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", textAlign: "left" }}>
                          <div style={{ width: "3px", height: "36px", borderRadius: "2px", background: lineColor, flexShrink: 0 }} />
                          <div style={{ textAlign: "left", minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: "14px", color: BG.text, fontWeight: "600", marginBottom: "2px", textAlign: "left" }}>{event.name}</div>
                            <div style={{ fontSize: "10px", color: BG.textMuted, fontWeight: "500", textAlign: "left" }}>{(event.type || "").toUpperCase()} · 📍 {event.location}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontSize: "12px", color: BG.text, fontWeight: "500", marginBottom: "2px" }}>{fmtRange(event.start_date, event.end_date)}</div>
                          <div style={{ fontSize: "10px", color: G.light, fontWeight: "600" }}>⏱ {daysLabel(event.start_date, event.end_date)}</div>
                        </div>
                        <div style={{ fontSize: "11px", color: BG.textSub, lineHeight: "1.5", paddingRight: "14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textAlign: "left" }}>{event.objective}</div>
                        <div style={{ textAlign: "left" }}><span style={{ background: `${pc}15`, color: pc, border: `1px solid ${pc}30`, borderRadius: "6px", padding: "4px 10px", fontSize: "10px", fontWeight: "700" }}>{event.participation}</span></div>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                          <div style={{ display: "flex" }}>
                            {attendeeList.slice(0, 3).map((a, idx) => (
                              <div key={idx} style={{ width: "24px", height: "24px", borderRadius: "50%", background: `hsl(${idx * 70 + 150},40%,32%)`, border: `2px solid ${BG.card}`, marginLeft: idx > 0 ? "-7px" : "0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", color: "white", fontWeight: "700" }}>
                                {a.charAt(0)}
                              </div>
                            ))}
                          </div>
                          <span style={{ fontSize: "11px", color: BG.textMuted }}>{attendeeList.length}</span>
                        </div>
                        <div style={{ textAlign: "left" }}>
                          {event.previous_participation ? (
                            <span style={{ background: G.pale, color: G.light, border: `1px solid ${G.mid}`, borderRadius: "20px", padding: "4px 10px", fontSize: "10px", fontWeight: "700" }}>↻ YES</span>
                          ) : (
                            <span style={{ background: `rgba(248,113,113,0.08)`, color: CORAL, border: `1px solid rgba(248,113,113,0.2)`, borderRadius: "20px", padding: "4px 10px", fontSize: "10px", fontWeight: "700" }}>NO</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div style={{ padding: "60px", textAlign: "center" }}>
                      <div style={{ fontSize: "32px", marginBottom: "14px", color: G.primary, opacity: 0.3 }}>✦</div>
                      <div style={{ fontSize: "18px", fontWeight: "500", color: BG.textSub }}>
                        {events.length === 0 ? "No events yet" : "No events match the current filters"}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "center", marginTop: "28px", fontSize: "10px", color: BG.textMuted, letterSpacing: "0.15em" }}>P&SCM · CONFIDENTIAL</div>
              </>
            )}
          </main>
        </>
      )}

      {selected && <EventModal event={selected} onClose={() => setSelected(null)} onDelete={handleDelete} onEdit={handleEditClick} isMobile={isMobile} isAdmin={isAdmin} />}
      {adding && isAdmin && <EventForm onClose={() => setAdding(false)} onSubmit={handleAdd} loading={saving} isMobile={isMobile} />}
      {editing && isAdmin && <EventForm initial={{ ...editing, start_date: editing.start_date || "", end_date: editing.end_date || "", website: editing.website || "" }} onClose={() => setEditing(null)} onSubmit={handleUpdate} loading={saving} isMobile={isMobile} isEdit />}
    </div>
  );
}