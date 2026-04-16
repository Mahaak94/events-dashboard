import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

const G = {
  primary: "#00A651",
  light: "#00C962",
  pale: "rgba(0,166,81,0.1)",
  mid: "rgba(0,166,81,0.2)",
  dark: "#007A3D",
};

const BG = {
  base: "#0A1628",
  surface: "#0F2040",
  card: "#122348",
  border: "rgba(255,255,255,0.07)",
  borderAccent: "rgba(0,166,81,0.25)",
  muted: "#1A3155",
  text: "#E2EAF4",
  textSub: "#7A9BBE",
  textMuted: "#3D5A7A",
};

const PART_COLOR = {
  Exhibitor: "#00A651",
  Speaker: "#00B4D8",
  Sponsor: "#F4A261",
  Organizer: "#9B72CF",
  Attendee: "#E76F51",
};
const REGION_COLOR = {
  "Middle East": "#00A651",
  Europe: "#00B4D8",
  Americas: "#F4A261",
  Asia: "#9B72CF",
  Africa: "#E76F51",
};
const REGION_DOTS = [
  { region: "Middle East", x: "62%", y: "48%" },
  { region: "Europe", x: "50%", y: "28%" },
  { region: "Americas", x: "20%", y: "42%" },
  { region: "Asia", x: "76%", y: "38%" },
  { region: "Africa", x: "50%", y: "62%" },
];

function fmt(v) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return `${v}`;
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
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

function KpiCard({ label, value, sub, color, icon, delay, isFormatted }) {
  const ref = useRef();
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => e.isIntersecting && setVis(true), { threshold: 0.2 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  const n = useCountUp(typeof value === "number" ? value : 0, 1400, vis);
  return (
    <div ref={ref} style={{
      background: `linear-gradient(135deg, ${BG.card}, ${BG.surface})`,
      border: `1px solid ${BG.border}`,
      borderRadius: "16px", padding: "24px", position: "relative", overflow: "hidden",
      boxShadow: `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
      opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(14px)",
      transition: `opacity 0.5s ${delay}s, transform 0.5s ${delay}s`
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div style={{ position: "absolute", top: "18px", right: "18px", width: "38px", height: "38px", background: `${color}15`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px", border: `1px solid ${color}25` }}>{icon}</div>
      <div style={{ fontSize: "10px", color: BG.textMuted, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "12px", fontWeight: "600" }}>{label}</div>
      <div style={{ fontSize: "30px", fontWeight: "700", color: BG.text, lineHeight: 1, marginBottom: "6px", letterSpacing: "-0.02em" }}>
        {isFormatted ? `SAR ${fmt(value)}` : n.toLocaleString()}
      </div>
      <div style={{ fontSize: "12px", color, fontWeight: "500" }}>{sub}</div>
      <div style={{ position: "absolute", bottom: 0, left: 0, width: "40%", height: "1px", background: `linear-gradient(90deg, ${color}50, transparent)` }} />
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

function HBar({ label, value, max, color }) {
  const ref = useRef(); const [vis, setVis] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => e.isIntersecting && setVis(true), { threshold: 0.3 });
    if (ref.current) o.observe(ref.current); return () => o.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "12px", color: BG.textSub, fontWeight: "500" }}>{label}</span>
        <span style={{ fontSize: "12px", color, fontWeight: "700" }}>SAR {fmt(value)}</span>
      </div>
      <div style={{ height: "5px", background: BG.muted, borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: vis ? `${(value / max) * 100}%` : "0%", background: `linear-gradient(90deg, ${color}, ${color}80)`, borderRadius: "3px", transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)", boxShadow: `0 0 8px ${color}50` }} />
      </div>
    </div>
  );
}

function EventModal({ event, onClose, onDelete }) {
  if (!event) return null;
  const pc = PART_COLOR[event.participation] || G.primary;
  const attendeeList = typeof event.attendees === "string" ? event.attendees.split(",").map(a => a.trim()).filter(Boolean) : (event.attendees || []);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "24px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: `linear-gradient(150deg, ${BG.card}, ${BG.surface})`, border: `1px solid ${BG.borderAccent}`, borderRadius: "20px", padding: "36px", maxWidth: "580px", width: "100%", position: "relative", boxShadow: `0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,166,81,0.1)`, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${G.dark}, ${G.primary}, ${G.light})`, borderRadius: "20px 20px 0 0" }} />
        <button onClick={onClose} style={{ position: "absolute", top: "18px", right: "18px", background: BG.muted, border: `1px solid ${BG.border}`, color: BG.textSub, borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontSize: "18px" }}>×</button>
        <div style={{ fontSize: "10px", color: G.primary, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "6px", fontWeight: "600" }}>{event.type} · {event.region}</div>
        <h2 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: "700", color: BG.text, letterSpacing: "-0.02em" }}>{event.name}</h2>
        <p style={{ margin: "0 0 24px", fontSize: "13px", color: BG.textSub }}>📍 {event.location} · {fmtDate(event.date)}</p>
        <div style={{ background: G.pale, border: `1px solid ${G.mid}`, borderRadius: "12px", padding: "16px", marginBottom: "18px" }}>
          <div style={{ fontSize: "9px", color: G.light, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px", fontWeight: "600" }}>Strategic Objective</div>
          <p style={{ margin: 0, fontSize: "13px", color: BG.text, lineHeight: "1.7" }}>{event.objective}</p>
        </div>
        {event.highlight && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(0,166,81,0.08)", border: `1px solid ${G.mid}`, borderRadius: "10px", padding: "12px 16px", marginBottom: "18px" }}>
            <span style={{ color: G.light, fontSize: "14px" }}>✦</span>
            <span style={{ fontSize: "13px", color: G.light, fontWeight: "500" }}>{event.highlight}</span>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "18px" }}>
          {[{ l: "Role", v: event.participation, c: pc }, { l: "Budget", v: `SAR ${fmt(event.budget)}`, c: G.primary }, { l: "Status", v: event.status, c: event.status === "Completed" ? G.primary : "#00B4D8" }].map(f => (
            <div key={f.l} style={{ background: BG.muted, border: `1px solid ${BG.border}`, borderRadius: "10px", padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: "9px", color: BG.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px", fontWeight: "600" }}>{f.l}</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: f.c }}>{f.v}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "9px", color: BG.textMuted, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px", fontWeight: "600" }}>Delegation · {attendeeList.length} Members</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
          {attendeeList.map(a => (
            <span key={a} style={{ background: G.pale, border: `1px solid ${G.mid}`, color: G.light, borderRadius: "20px", padding: "5px 14px", fontSize: "12px", fontWeight: "500" }}>{a}</span>
          ))}
        </div>
        <button onClick={() => onDelete(event.id)} style={{ width: "100%", padding: "10px", background: "rgba(231,111,81,0.08)", border: "1px solid rgba(231,111,81,0.25)", borderRadius: "10px", color: "#E76F51", cursor: "pointer", fontSize: "12px", letterSpacing: "0.08em", fontWeight: "600", fontFamily: "'Outfit',sans-serif" }}>
          DELETE EVENT
        </button>
      </div>
    </div>
  );
}

function AddModal({ onClose, onAdd, loading }) {
  const [f, setF] = useState({ name: "", type: "Conference", date: "", location: "", region: "Middle East", objective: "", attendees: "", participation: "Exhibitor", budget: "", status: "Upcoming", highlight: "" });
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const inp = { width: "100%", background: BG.muted, border: `1px solid ${BG.border}`, borderRadius: "8px", padding: "10px 12px", color: BG.text, fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "'Outfit',sans-serif" };
  const lbl = { fontSize: "10px", color: BG.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "6px", fontWeight: "600" };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "24px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: `linear-gradient(150deg,${BG.card},${BG.surface})`, border: `1px solid ${BG.borderAccent}`, borderRadius: "20px", padding: "36px", maxWidth: "560px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: `0 40px 80px rgba(0,0,0,0.5)` }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg,${G.dark},${G.primary},${G.light})`, borderRadius: "20px 20px 0 0" }} />
        <h2 style={{ margin: "0 0 24px", fontSize: "22px", fontWeight: "700", color: BG.text, letterSpacing: "-0.02em" }}>Register New Event</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Event Name</label><input style={inp} value={f.name} onChange={e => s("name", e.target.value)} placeholder="e.g. ADIPEC 2025" /></div>
          <div><label style={lbl}>Type</label><select style={inp} value={f.type} onChange={e => s("type", e.target.value)}>{["Conference", "Forum", "Supplier Forum", "Exhibition", "Workshop"].map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label style={lbl}>Region</label><select style={inp} value={f.region} onChange={e => s("region", e.target.value)}>{["Middle East", "Europe", "Americas", "Asia", "Africa"].map(r => <option key={r}>{r}</option>)}</select></div>
          <div><label style={lbl}>Date</label><input style={inp} type="date" value={f.date} onChange={e => s("date", e.target.value)} /></div>
          <div><label style={lbl}>Location</label><input style={inp} value={f.location} onChange={e => s("location", e.target.value)} placeholder="City, Country" /></div>
          <div><label style={lbl}>Participation Role</label><select style={inp} value={f.participation} onChange={e => s("participation", e.target.value)}>{Object.keys(PART_COLOR).map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label style={lbl}>Budget (SAR)</label><input style={inp} type="number" value={f.budget} onChange={e => s("budget", e.target.value)} /></div>
          <div><label style={lbl}>Status</label><select style={inp} value={f.status} onChange={e => s("status", e.target.value)}>{["Upcoming", "Completed", "Cancelled"].map(x => <option key={x}>{x}</option>)}</select></div>
          <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Strategic Objective</label><textarea style={{ ...inp, minHeight: "72px", resize: "vertical" }} value={f.objective} onChange={e => s("objective", e.target.value)} /></div>
          <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Key Highlight</label><input style={inp} value={f.highlight} onChange={e => s("highlight", e.target.value)} placeholder="e.g. 200+ suppliers engaged" /></div>
          <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Attendees (comma-separated)</label><input style={inp} value={f.attendees} onChange={e => s("attendees", e.target.value)} placeholder="Name 1, Name 2, Name 3" /></div>
        </div>
        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", background: "transparent", border: `1px solid ${BG.border}`, borderRadius: "10px", color: BG.textSub, cursor: "pointer", fontSize: "13px", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
          <button onClick={() => { if (!f.name || !f.date) return; onAdd(f); }} disabled={loading}
            style={{ flex: 2, padding: "12px", background: `linear-gradient(135deg,${G.dark},${G.primary})`, border: "none", borderRadius: "10px", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: "700", letterSpacing: "0.06em", opacity: loading ? 0.7 : 1, fontFamily: "'Outfit',sans-serif", boxShadow: `0 4px 14px ${G.primary}40` }}>
            {loading ? "SAVING..." : "REGISTER EVENT"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [activeRegion, setActiveRegion] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { fetchEvents(); }, []);

  async function fetchEvents() {
    setLoadingData(true);
    const { data, error } = await supabase.from("events").select("*").order("date", { ascending: false });
    if (error) { setError("Could not load events. Check your Supabase table."); console.error(error); }
    else setEvents(data || []);
    setLoadingData(false);
  }

  async function handleAdd(f) {
    setSaving(true);
    const { data, error } = await supabase.from("events").insert([{
      name: f.name, type: f.type, date: f.date, location: f.location,
      region: f.region, objective: f.objective, attendees: f.attendees,
      participation: f.participation, budget: parseInt(f.budget) || 0,
      status: f.status, highlight: f.highlight,
    }]).select();
    if (error) { alert("Error saving: " + error.message); }
    else { setEvents(prev => [data[0], ...prev]); setAdding(false); }
    setSaving(false);
  }

  async function handleDelete(id) {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { alert("Error deleting: " + error.message); }
    else { setEvents(prev => prev.filter(e => e.id !== id)); setSelected(null); }
  }

  const filtered = useMemo(() => events.filter(e => {
    if (filterStatus !== "All" && e.status !== filterStatus) return false;
    if (activeRegion && e.region !== activeRegion) return false;
    return true;
  }), [events, filterStatus, activeRegion]);

  const totalBudget = events.reduce((s, e) => s + (e.budget || 0), 0);
  const uniqueAttendees = [...new Set(events.flatMap(e => typeof e.attendees === "string" ? e.attendees.split(",").map(a => a.trim()) : (e.attendees || [])))].filter(Boolean).length;
  const completed = events.filter(e => e.status === "Completed").length;
  const upcoming = events.filter(e => e.status === "Upcoming").length;
  const regionCounts = events.reduce((a, e) => { a[e.region] = (a[e.region] || 0) + 1; return a; }, {});
  const partData = Object.entries(events.reduce((a, e) => { a[e.participation] = (a[e.participation] || 0) + 1; return a; }, {})).map(([label, value]) => ({ label, value, color: PART_COLOR[label] || G.primary }));
  const budgetByRegion = Object.entries(events.reduce((a, e) => { a[e.region] = (a[e.region] || 0) + (e.budget || 0); return a; }, {})).sort((a, b) => b[1] - a[1]);
  const maxB = Math.max(...budgetByRegion.map(b => b[1]), 1);

  return (
    <div style={{ minHeight: "100vh", background: BG.base, fontFamily: "'Outfit',sans-serif", color: BG.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;}
        @keyframes pulse{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(2);opacity:0.15}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${BG.muted};border-radius:2px}
        select option{background:${BG.card};color:${BG.text}}
        input::placeholder{color:${BG.textMuted}}
        textarea::placeholder{color:${BG.textMuted}}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5)}
      `}</style>

      {/* Ambient background effects */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-15%", left: "15%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(0,166,81,0.06) 0%, transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "5%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(0,180,216,0.04) 0%, transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${BG.muted} 1px, transparent 1px)`, backgroundSize: "40px 40px", opacity: 0.3 }} />
      </div>

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: `rgba(10,22,40,0.92)`, backdropFilter: "blur(20px)", borderBottom: `1px solid ${BG.border}` }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 40px", height: "68px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
            {["All", "Completed", "Upcoming"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "7px 16px", borderRadius: "20px", border: `1px solid`, borderColor: filterStatus === s ? G.primary : BG.border, background: filterStatus === s ? G.pale : "transparent", color: filterStatus === s ? G.light : BG.textSub, fontSize: "11px", cursor: "pointer", letterSpacing: "0.08em", fontWeight: "600", transition: "all 0.2s", fontFamily: "'Outfit',sans-serif" }}>
                {s.toUpperCase()}
              </button>
            ))}
            <button onClick={() => setAdding(true)} style={{ marginLeft: "8px", padding: "9px 20px", background: `linear-gradient(135deg,${G.dark},${G.primary})`, border: "none", borderRadius: "10px", color: "white", fontSize: "12px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.08em", boxShadow: `0 4px 14px ${G.primary}40`, fontFamily: "'Outfit',sans-serif" }}>
              + ADD EVENT
            </button>
          </div>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 1, maxWidth: "1440px", margin: "0 auto", padding: "32px 40px" }}>

        {loadingData && (
          <div style={{ textAlign: "center", padding: "80px", color: G.primary }}>
            <div style={{ fontSize: "32px", animation: "spin 1s linear infinite", display: "inline-block", marginBottom: "16px" }}>✦</div>
            <div style={{ fontSize: "18px", fontWeight: "500", color: BG.textSub }}>Loading events...</div>
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(231,111,81,0.08)", border: "1px solid rgba(231,111,81,0.25)", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px", color: "#E76F51", fontSize: "13px" }}>
            ⚠️ {error}
          </div>
        )}

        {!loadingData && (
          <>
            {/* KPI Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "20px" }}>
              <KpiCard label="Total Events" value={events.length} sub={`${upcoming} upcoming · ${completed} completed`} color={G.primary} icon="✦" delay={0} />
              <KpiCard label="Completed" value={completed} sub={`${events.length > 0 ? Math.round(completed / events.length * 100) : 0}% completion rate`} color="#00B4D8" icon="◉" delay={0.08} />
              <KpiCard label="Total Investment" value={totalBudget} sub={`SAR ${fmt(events.length > 0 ? Math.round(totalBudget / events.length) : 0)} avg per event`} color="#F4A261" icon="◈" delay={0.16} isFormatted />
              <KpiCard label="Delegation Members" value={uniqueAttendees} sub="unique participants" color="#9B72CF" icon="◎" delay={0.24} />
            </div>

            {/* Analytics Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>

              {/* World Map */}
              <div style={{ background: `linear-gradient(135deg,${BG.card},${BG.surface})`, border: `1px solid ${BG.border}`, borderRadius: "16px", padding: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
                <div style={{ fontSize: "10px", color: G.primary, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3px", fontWeight: "600" }}>Global Footprint</div>
                <div style={{ fontSize: "19px", fontWeight: "700", color: BG.text, marginBottom: "16px", letterSpacing: "-0.01em" }}>Event Presence by Region</div>
                <div style={{ position: "relative", height: "148px", background: BG.base, borderRadius: "10px", border: `1px solid ${BG.border}`, overflow: "hidden", marginBottom: "14px" }}>
                  {[25, 50, 75].map(p => <div key={p} style={{ position: "absolute", left: `${p}%`, top: 0, bottom: 0, borderLeft: `1px solid ${BG.muted}` }} />)}
                  {[35, 65].map(p => <div key={p} style={{ position: "absolute", top: `${p}%`, left: 0, right: 0, borderTop: `1px solid ${BG.muted}` }} />)}
                  <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: `1px solid rgba(0,166,81,0.15)` }} />
                  <div style={{ position: "absolute", bottom: "6px", right: "10px", fontSize: "8px", color: BG.textMuted, letterSpacing: "0.1em" }}>WORLD MAP</div>
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
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: REGION_COLOR[r] || G.primary, boxShadow: `0 0 5px ${REGION_COLOR[r] || G.primary}` }} />
                      <span style={{ fontSize: "11px", color: BG.textSub, fontWeight: "500" }}>{r}</span>
                      <span style={{ fontSize: "11px", color: REGION_COLOR[r] || G.primary, fontWeight: "700" }}>{c}</span>
                    </div>
                  ))}
                  {activeRegion && <button onClick={() => setActiveRegion(null)} style={{ fontSize: "11px", color: G.primary, background: "none", border: "none", cursor: "pointer", fontWeight: "600", fontFamily: "'Outfit',sans-serif" }}>✕ Clear</button>}
                </div>
              </div>

              {/* Participation */}
              <div style={{ background: `linear-gradient(135deg,${BG.card},${BG.surface})`, border: `1px solid ${BG.border}`, borderRadius: "16px", padding: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
                <div style={{ fontSize: "10px", color: G.primary, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3px", fontWeight: "600" }}>Breakdown</div>
                <div style={{ fontSize: "19px", fontWeight: "700", color: BG.text, marginBottom: "16px", letterSpacing: "-0.01em" }}>Participation Roles</div>
                {partData.length > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <RadialChart data={partData} size={135} />
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
                ) : <div style={{ color: BG.textMuted, fontSize: "13px", paddingTop: "20px" }}>No events yet</div>}
              </div>

              {/* Budget */}
              <div style={{ background: `linear-gradient(135deg,${BG.card},${BG.surface})`, border: `1px solid ${BG.border}`, borderRadius: "16px", padding: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
                <div style={{ fontSize: "10px", color: G.primary, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3px", fontWeight: "600" }}>Investment</div>
                <div style={{ fontSize: "19px", fontWeight: "700", color: BG.text, marginBottom: "18px", letterSpacing: "-0.01em" }}>Budget by Region</div>
                {budgetByRegion.length > 0 ? budgetByRegion.map(([r, v]) => <HBar key={r} label={r} value={v} max={maxB} color={REGION_COLOR[r] || G.primary} />) : <div style={{ color: BG.textMuted, fontSize: "13px" }}>No data yet</div>}
                <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: `1px solid ${BG.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", color: BG.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600" }}>Total Investment</span>
                  <span style={{ fontSize: "16px", color: G.primary, fontWeight: "700" }}>SAR {fmt(totalBudget)}</span>
                </div>
              </div>
            </div>

            {/* Events Table */}
            <div style={{ background: `linear-gradient(135deg,${BG.card},${BG.surface})`, border: `1px solid ${BG.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
              <div style={{ padding: "20px 28px", borderBottom: `1px solid ${BG.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: `rgba(0,0,0,0.15)` }}>
                <div>
                  <div style={{ fontSize: "10px", color: G.primary, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3px", fontWeight: "600" }}>Events Registry</div>
                  <div style={{ fontSize: "19px", fontWeight: "700", color: BG.text, letterSpacing: "-0.01em" }}>
                    {filtered.length} Event{filtered.length !== 1 ? "s" : ""}{activeRegion ? ` · ${activeRegion}` : ""}{filterStatus !== "All" ? ` · ${filterStatus}` : ""}
                  </div>
                </div>
                <div style={{ fontSize: "10px", color: BG.textMuted, letterSpacing: "0.08em", fontWeight: "500" }}>CLICK ANY ROW TO VIEW DETAILS</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1.3fr 1.4fr 1fr 0.9fr 1fr", padding: "10px 28px", borderBottom: `1px solid ${BG.border}`, background: "rgba(0,0,0,0.1)" }}>
                {["Event", "Date & Location", "Objective", "Role", "Delegation", "Budget"].map(h => (
                  <div key={h} style={{ fontSize: "9px", color: BG.textMuted, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: "600" }}>{h}</div>
                ))}
              </div>

              {filtered.map((event) => {
                const pc = PART_COLOR[event.participation] || G.primary;
                const done = event.status === "Completed";
                const lineColor = done ? G.primary : "#00B4D8";
                const attendeeList = typeof event.attendees === "string" ? event.attendees.split(",").map(a => a.trim()).filter(Boolean) : (event.attendees || []);
                return (
                  <div key={event.id} onClick={() => setSelected(event)}
                    style={{ display: "grid", gridTemplateColumns: "2.4fr 1.3fr 1.4fr 1fr 0.9fr 1fr", padding: "18px 28px", borderBottom: `1px solid ${BG.border}`, cursor: "pointer", transition: "background 0.15s", alignItems: "center" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(0,166,81,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "3px", height: "36px", borderRadius: "2px", background: lineColor, flexShrink: 0, boxShadow: `0 0 6px ${lineColor}60` }} />
                      <div>
                        <div style={{ fontSize: "14px", color: BG.text, fontWeight: "600", marginBottom: "2px", letterSpacing: "-0.01em" }}>{event.name}</div>
                        <div style={{ fontSize: "10px", color: BG.textMuted, letterSpacing: "0.06em", fontWeight: "500" }}>{(event.type || "").toUpperCase()} · {(event.region || "").toUpperCase()}</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: BG.text, marginBottom: "2px", fontWeight: "500" }}>{fmtDate(event.date)}</div>
                      <div style={{ fontSize: "11px", color: BG.textSub }}>📍 {event.location}</div>
                    </div>
                    <div style={{ fontSize: "11px", color: BG.textSub, lineHeight: "1.5", paddingRight: "14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{event.objective}</div>
                    <div>
                      <span style={{ background: `${pc}15`, color: pc, border: `1px solid ${pc}30`, borderRadius: "6px", padding: "4px 10px", fontSize: "10px", fontWeight: "700" }}>
                        {event.participation}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <div style={{ display: "flex" }}>
                        {attendeeList.slice(0, 3).map((a, idx) => (
                          <div key={idx} style={{ width: "24px", height: "24px", borderRadius: "50%", background: `hsl(${idx * 70 + 150},45%,35%)`, border: `2px solid ${BG.card}`, marginLeft: idx > 0 ? "-7px" : "0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", color: "white", fontWeight: "700" }}>
                            {a.charAt(0)}
                          </div>
                        ))}
                      </div>
                      <span style={{ fontSize: "11px", color: BG.textMuted, fontWeight: "500" }}>{attendeeList.length}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", color: G.primary, fontWeight: "700" }}>SAR {fmt(event.budget)}</div>
                      <div style={{ fontSize: "10px", color: lineColor, marginTop: "2px", letterSpacing: "0.08em", fontWeight: "600" }}>{(event.status || "").toUpperCase()}</div>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && !loadingData && (
                <div style={{ padding: "60px", textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "14px", color: G.primary, opacity: 0.3 }}>✦</div>
                  <div style={{ fontSize: "18px", fontWeight: "500", color: BG.textSub }}>
                    {events.length === 0 ? "No events yet — add your first event!" : "No events match the current filters"}
                  </div>
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", marginTop: "28px", fontSize: "10px", color: BG.textMuted, letterSpacing: "0.15em", fontWeight: "500" }}>
              P&SCM · CONFIDENTIAL
            </div>
          </>
        )}
      </main>

      {selected && <EventModal event={selected} onClose={() => setSelected(null)} onDelete={handleDelete} />}
      {adding && <AddModal onClose={() => setAdding(false)} onAdd={handleAdd} loading={saving} />}
    </div>
  );
}
