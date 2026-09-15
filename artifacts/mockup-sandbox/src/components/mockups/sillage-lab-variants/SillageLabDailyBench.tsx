import React, { useMemo, useState } from "react";
import {
  ArrowUp,
  Beaker,
  ChevronRight,
  CircleDot,
  FlaskConical,
  Leaf,
  Menu,
  Plus,
  Search,
  Sparkles,
  Timer,
} from "lucide-react";

type BenchStep = "brief" | "blend" | "evaluate" | "document";

const materials = [
  { name: "Bergamot FCF", family: "Citrus", amount: "18.0%", tone: "bright" },
  { name: "Violet Leaf", family: "Green", amount: "12.5%", tone: "green" },
  { name: "Orris Butter", family: "Powdery", amount: "8.0%", tone: "soft" },
  { name: "Cedar Atlas", family: "Woody", amount: "24.0%", tone: "wood" },
  { name: "Ambroxan", family: "Amber", amount: "37.5%", tone: "amber" },
];

const initialNotes = [
  { time: "09:42", text: "The opening lifts quickly; violet leaf keeps it tactile.", tag: "observation" },
  { time: "09:18", text: "Reduced cedar by 2% to leave more air around the heart.", tag: "modification" },
];

export function SillageLabDailyBench() {
  const [activeStep, setActiveStep] = useState<BenchStep>("blend");
  const [notes, setNotes] = useState(initialNotes);
  const [note, setNote] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [running, setRunning] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const completed = useMemo(
    () => ["brief", ...(activeStep === "evaluate" || activeStep === "document" ? ["blend"] : [])],
    [activeStep],
  );

  function addNote() {
    if (!note.trim()) return;
    setNotes((current) => [{ time: "Now", text: note.trim(), tag: "observation" }, ...current]);
    setNote("");
  }

  return (
    <main className="slb-shell">
      <style>{`
        .slb-shell {
          --ink: #1f2724; --muted: #6d7770; --line: #d9dfd7; --paper: #f5f6f0;
          --panel: #fbfcf8; --sage: #dbe7dc; --moss: #49634e; --orange: #ba6844;
          min-height: 100vh; background: var(--paper); color: var(--ink);
          font-family: Inter, ui-sans-serif, system-ui, sans-serif; display: flex;
        }
        .slb-shell * { box-sizing: border-box; }
        .slb-rail { width: 72px; background: #25332b; color: #e7efe6; display:flex; flex-direction:column; align-items:center; padding: 22px 0; flex-shrink:0; }
        .slb-mark { width:32px; height:32px; border:1px solid #94a998; border-radius:50%; display:grid; place-items:center; font: 600 12px Georgia, serif; margin-bottom:50px; }
        .slb-rail-btn { border:0; background:transparent; color:#a7b8aa; width:48px; height:48px; display:grid; place-items:center; border-left:2px solid transparent; cursor:pointer; }
        .slb-rail-btn.active { color:#fff; border-left-color:#d7ad72; background:#33463a; }
        .slb-rail-bottom { margin-top:auto; color:#a7b8aa; font: 11px ui-monospace, monospace; }
        .slb-main { flex:1; min-width:0; display:grid; grid-template-columns:minmax(460px, 1fr) 340px; grid-template-rows:auto 1fr; }
        .slb-topbar { grid-column:1 / -1; height:84px; display:flex; align-items:center; justify-content:space-between; padding: 0 34px; border-bottom:1px solid var(--line); background:rgba(251,252,248,.85); }
        .slb-kicker { color:var(--moss); font: 10px ui-monospace, monospace; letter-spacing:.16em; text-transform:uppercase; }
        .slb-title { font: 30px Georgia, serif; margin: 4px 0 0; letter-spacing:-.03em; }
        .slb-top-actions { display:flex; gap:9px; align-items:center; }
        .slb-icon-btn, .slb-outline-btn { background:transparent; border:1px solid var(--line); color:var(--ink); cursor:pointer; height:36px; display:inline-flex; align-items:center; gap:7px; padding:0 12px; font-size:12px; }
        .slb-icon-btn { width:36px; padding:0; justify-content:center; }
        .slb-outline-btn:hover, .slb-icon-btn:hover { border-color:var(--moss); background:#f0f4ed; }
        .slb-workspace { padding: 34px; min-width:0; }
        .slb-stepper { display:flex; align-items:stretch; border-bottom:1px solid var(--line); margin-bottom:30px; overflow:auto; }
        .slb-step { border:0; border-bottom:2px solid transparent; background:transparent; padding:0 30px 14px 0; margin-right:28px; cursor:pointer; color:var(--muted); text-align:left; white-space:nowrap; }
        .slb-step.active { color:var(--ink); border-color:var(--orange); }
        .slb-step.done { color:var(--moss); }
        .slb-step-num { font: 10px ui-monospace, monospace; margin-right:8px; }
        .slb-step-label { font-size:13px; font-weight:600; }
        .slb-grid { display:grid; grid-template-columns:minmax(260px, 1fr) minmax(240px, .8fr); gap:28px; }
        .slb-section-label { font:10px ui-monospace, monospace; color:var(--muted); text-transform:uppercase; letter-spacing:.14em; margin:0 0 14px; }
        .slb-brief { background:var(--sage); padding:22px; min-height:160px; position:relative; overflow:hidden; }
        .slb-brief:after { content:""; position:absolute; width:170px; height:170px; border:1px solid rgba(73,99,78,.25); border-radius:50%; right:-50px; top:-55px; }
        .slb-brief h2 { font: 26px Georgia, serif; margin:0 0 12px; max-width:300px; }
        .slb-brief p { font-size:12px; line-height:1.7; color:#526356; max-width:360px; margin:0; }
        .slb-formula-card { border:1px solid var(--line); background:var(--panel); margin-top:20px; }
        .slb-card-head { padding:16px 18px; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:center; }
        .slb-card-head h3 { margin:0; font: 18px Georgia, serif; }
        .slb-card-meta { color:var(--muted); font:10px ui-monospace, monospace; text-transform:uppercase; letter-spacing:.1em; }
        .slb-material { display:flex; align-items:center; gap:12px; padding:14px 18px; border-bottom:1px solid #e7ebe5; }
        .slb-material:last-child { border-bottom:0; }
        .slb-dot { width:9px; height:9px; border-radius:50%; background:#b9cdb9; flex:none; }
        .slb-dot.bright { background:#d8a36d; } .slb-dot.soft { background:#b6a9b4; } .slb-dot.wood { background:#8b6a55; } .slb-dot.amber { background:#b87852; }
        .slb-material-name { font-size:12px; font-weight:600; } .slb-material-family { color:var(--muted); font-size:10px; margin-top:3px; }
        .slb-amount { margin-left:auto; font:12px ui-monospace, monospace; }
        .slb-add { display:flex; align-items:center; gap:6px; width:100%; padding:13px 18px; border:0; border-top:1px solid var(--line); background:transparent; color:var(--moss); font-size:11px; cursor:pointer; text-align:left; }
        .slb-add:hover { background:#f1f5ef; }
        .slb-thermo { border-left:1px solid var(--line); padding:0 28px; background:#f0f2eb; }
        .slb-thermo-head { padding:34px 0 20px; border-bottom:1px solid var(--line); }
        .slb-thermo h2 { font:25px Georgia, serif; margin:0 0 5px; }
        .slb-status { display:flex; align-items:center; gap:7px; color:var(--moss); font:10px ui-monospace, monospace; text-transform:uppercase; letter-spacing:.08em; }
        .slb-status-dot { width:6px; height:6px; background:#6f9b74; border-radius:50%; }
        .slb-log { padding-top:25px; }
        .slb-log-entry { border-bottom:1px solid var(--line); padding:0 0 17px; margin-bottom:17px; }
        .slb-log-time { color:var(--muted); font:10px ui-monospace, monospace; }
        .slb-log-entry p { font:14px Georgia, serif; line-height:1.45; margin:7px 0 8px; }
        .slb-tag { color:var(--moss); font:9px ui-monospace, monospace; text-transform:uppercase; letter-spacing:.12em; }
        .slb-note { display:flex; gap:7px; border-top:1px solid var(--line); padding-top:15px; }
        .slb-note input { min-width:0; flex:1; border:0; border-bottom:1px solid #bfcac0; background:transparent; padding:8px 0; color:var(--ink); font:13px Georgia, serif; outline:0; }
        .slb-note input:focus { border-color:var(--moss); }
        .slb-mini-btn { border:0; background:var(--moss); color:white; width:30px; cursor:pointer; display:grid; place-items:center; }
        .slb-pulse { background:#e5ebe0; padding:14px; margin-top:28px; display:flex; align-items:center; gap:10px; }
        .slb-pulse strong { font-size:12px; } .slb-pulse span { display:block; color:var(--muted); font-size:10px; margin-top:3px; }
        .slb-run { width:100%; border:0; background:var(--orange); color:white; padding:13px; margin-top:18px; cursor:pointer; font-size:11px; letter-spacing:.1em; text-transform:uppercase; }
        .slb-run.running { background:var(--moss); }
        .slb-mobile-menu { display:none; }
        @media (max-width: 800px) {
          .slb-rail { width:54px; } .slb-mark { margin-bottom:26px; } .slb-rail-btn { width:40px; }
          .slb-main { display:block; } .slb-topbar { height:74px; padding:0 18px; } .slb-title { font-size:24px; }
          .slb-workspace { padding:24px 18px; } .slb-grid { grid-template-columns:1fr; }
          .slb-thermo { border-left:0; border-top:1px solid var(--line); padding:0 18px 28px; }
          .slb-thermo-head { padding-top:24px; } .slb-mobile-menu { display:inline-flex; }
          .slb-top-actions .slb-outline-btn { display:none; }
        }
      `}</style>

      <aside className="slb-rail" aria-label="Primary navigation">
        <div className="slb-mark">S</div>
        <button className="slb-rail-btn active" aria-label="Current bench"><Beaker size={18} /></button>
        <button className="slb-rail-btn" aria-label="Materials"><Leaf size={18} /></button>
        <button className="slb-rail-btn" aria-label="Formulas"><FlaskConical size={18} /></button>
        <button className="slb-rail-btn" aria-label="Inspiration"><Sparkles size={18} /></button>
        <div className="slb-rail-bottom">01</div>
      </aside>

      <section className="slb-main">
        <header className="slb-topbar">
          <div>
            <div className="slb-kicker">Sillage Lab / Daily bench</div>
            <h1 className="slb-title">Lait Vert <span style={{ color: "var(--muted)", fontSize: "16px", fontFamily: "ui-monospace" }}>· 0.4</span></h1>
          </div>
          <div className="slb-top-actions">
            <button className="slb-icon-btn" onClick={() => setShowSearch(!showSearch)} aria-label="Search"><Search size={15} /></button>
            <button className="slb-outline-btn" onClick={() => setRunning(!running)}>{running ? "Stop session" : "Start session"} <Timer size={14} /></button>
            <button className="slb-icon-btn slb-mobile-menu" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Open menu"><Menu size={16} /></button>
          </div>
        </header>

        <div className="slb-workspace">
          {showSearch && <div style={{ border: "1px solid var(--moss)", background: "white", padding: "10px 14px", marginBottom: "18px", fontSize: "12px" }}>Search materials, projects, or observations…</div>}
          <nav className="slb-stepper" aria-label="Bench workflow">
            {([
              ["brief", "01", "Brief"], ["blend", "02", "Blend"], ["evaluate", "03", "Evaluate"], ["document", "04", "Document"],
            ] as [BenchStep, string, string][]).map(([id, number, label]) => (
              <button key={id} className={`slb-step ${activeStep === id ? "active" : ""} ${completed.includes(id) ? "done" : ""}`} onClick={() => setActiveStep(id)} aria-current={activeStep === id ? "step" : undefined}>
                <span className="slb-step-num">{completed.includes(id) ? "✓" : number}</span><span className="slb-step-label">{label}</span>
              </button>
            ))}
          </nav>

          <div className="slb-grid">
            <div>
              <p className="slb-section-label">Working direction</p>
              <section className="slb-brief">
                <h2>A green veil over warm skin.</h2>
                <p>Keep the first impression leafy and luminous. Let the drydown become soft, mineral, and quietly persistent.</p>
              </section>
              <section className="slb-formula-card" aria-label="Current formula">
                <div className="slb-card-head"><h3>Formula 0.4</h3><span className="slb-card-meta">5 materials · 100%</span></div>
                {materials.map((material) => <div className="slb-material" key={material.name}><span className={`slb-dot ${material.tone}`} /><div><div className="slb-material-name">{material.name}</div><div className="slb-material-family">{material.family}</div></div><span className="slb-amount">{material.amount}</span><ChevronRight size={14} color="#9aa69c" /></div>)}
                <button className="slb-add"><Plus size={14} /> Add material</button>
              </section>
            </div>

            <aside className="slb-thermo" aria-label="Sensory log">
              <div className="slb-thermo-head">
                <div className="slb-status"><span className="slb-status-dot" /> Session active</div>
                <h2>Sensory log</h2>
                <div style={{ color: "var(--muted)", fontSize: "11px" }}>Today · bench 02</div>
              </div>
              <div className="slb-log">
                {notes.map((entry, index) => <article className="slb-log-entry" key={`${entry.time}-${index}`}><div className="slb-log-time">{entry.time}</div><p>{entry.text}</p><span className="slb-tag">{entry.tag}</span></article>)}
                <div className="slb-note"><input value={note} onChange={(event) => setNote(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addNote()} placeholder="Record an observation…" aria-label="New observation" /><button className="slb-mini-btn" onClick={addNote} aria-label="Add observation"><ArrowUp size={14} /></button></div>
                <div className="slb-pulse"><CircleDot size={16} color="var(--orange)" /><div><strong>Next checkpoint</strong><span>Evaluate on skin · in 42 min</span></div></div>
                <button className={`slb-run ${running ? "running" : ""}`} onClick={() => setRunning(!running)}>{running ? "End session" : "Begin timed evaluation"}</button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}