import React, { useMemo, useState } from "react";
import {
  Beaker,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDot,
  Clock3,
  FlaskConical,
  Leaf,
  Menu,
  Plus,
  Search,
  Sparkles,
  Timer,
  X,
} from "lucide-react";

type EventKind = "formula" | "observation" | "checkpoint";

type BenchEvent = {
  id: number;
  time: string;
  title: string;
  body: string;
  kind: EventKind;
  meta: string;
};

const materials = [
  { name: "Bergamot FCF", amount: "18.0%", tone: "#d9b45c" },
  { name: "Violet Leaf", amount: "12.5%", tone: "#78967b" },
  { name: "Orris Butter", amount: "8.0%", tone: "#b2a0b7" },
  { name: "Cedar Atlas", amount: "24.0%", tone: "#9a7657" },
  { name: "Ambroxan", amount: "37.5%", tone: "#cf8b58" },
];

const initialEvents: BenchEvent[] = [
  { id: 1, time: "09:18", title: "Formula 0.4 adjusted", body: "Reduced cedar by 2% to leave more air around the heart.", kind: "formula", meta: "5 materials · 100%" },
  { id: 2, time: "09:42", title: "Opening observation", body: "The opening lifts quickly; violet leaf keeps it tactile.", kind: "observation", meta: "On blotter · 24 min" },
  { id: 3, time: "10:24", title: "Skin checkpoint", body: "Next: evaluate persistence and mineral softness on skin.", kind: "checkpoint", meta: "In 42 min · planned", },
];

export function SillageLabDailyTimeline() {
  const [events, setEvents] = useState(initialEvents);
  const [selectedId, setSelectedId] = useState(2);
  const [note, setNote] = useState("");
  const [queryOpen, setQueryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [showFormula, setShowFormula] = useState(false);

  const selected = useMemo(
    () => events.find((event) => event.id === selectedId) ?? events[0],
    [events, selectedId],
  );

  function addObservation() {
    if (!note.trim()) return;
    const next = {
      id: Date.now(),
      time: "Now",
      title: "New observation",
      body: note.trim(),
      kind: "observation" as const,
      meta: "Just now · bench 02",
    };
    setEvents((current) => [next, ...current]);
    setSelectedId(next.id);
    setNote("");
  }

  return (
    <main className="sldt-shell">
      <style>{`
        .sldt-shell {
          --ink:#202a25; --muted:#718078; --line:#d9e0d9; --paper:#f4f6f0;
          --panel:#fbfcf8; --deep:#26372d; --moss:#4b6a51; --sage:#dce8dd;
          --orange:#b96845; min-height:100vh; background:var(--paper); color:var(--ink);
          font-family:Inter, ui-sans-serif, system-ui, sans-serif;
        }
        .sldt-shell * { box-sizing:border-box; }
        .sldt-layout { display:flex; min-height:100vh; }
        .sldt-rail { width:72px; background:var(--deep); color:#dbe6dc; display:flex; flex-direction:column; align-items:center; padding:22px 0; flex-shrink:0; }
        .sldt-mark { width:32px; height:32px; border:1px solid #93a895; border-radius:50%; display:grid; place-items:center; font:600 12px Georgia,serif; margin-bottom:46px; }
        .sldt-rail-button { width:48px; height:48px; color:#a7b8aa; border:0; border-left:2px solid transparent; background:transparent; display:grid; place-items:center; cursor:pointer; }
        .sldt-rail-button.active { color:#fff; border-left-color:#d7ad72; background:#33463a; }
        .sldt-rail-foot { margin-top:auto; color:#a7b8aa; font:11px ui-monospace,monospace; writing-mode:vertical-rl; letter-spacing:.08em; }
        .sldt-main { flex:1; min-width:0; }
        .sldt-header { min-height:84px; padding:20px 38px; border-bottom:1px solid var(--line); background:rgba(251,252,248,.86); display:flex; justify-content:space-between; align-items:center; gap:20px; }
        .sldt-kicker,.sldt-label { color:var(--moss); font:10px ui-monospace,monospace; letter-spacing:.16em; text-transform:uppercase; }
        .sldt-title { margin:5px 0 0; font:30px Georgia,serif; letter-spacing:-.03em; }
        .sldt-actions { display:flex; gap:8px; align-items:center; }
        .sldt-button { height:36px; padding:0 12px; background:transparent; border:1px solid var(--line); color:var(--ink); display:inline-flex; align-items:center; gap:7px; font-size:12px; cursor:pointer; }
        .sldt-button:hover,.sldt-event:hover { border-color:#9caf9d; background:#f2f6f0; }
        .sldt-icon-button { width:36px; padding:0; justify-content:center; }
        .sldt-content { max-width:1180px; padding:30px 38px 56px; margin:0 auto; }
        .sldt-toolbar { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:26px; gap:20px; }
        .sldt-heading { font:26px Georgia,serif; margin:5px 0 0; letter-spacing:-.025em; }
        .sldt-toolbar-note { color:var(--muted); font-size:12px; margin:0; }
        .sldt-search { border:1px solid var(--moss); background:#fff; padding:11px 14px; color:var(--muted); font-size:12px; margin-bottom:20px; }
        .sldt-board { display:grid; grid-template-columns:minmax(0,1fr) 330px; gap:42px; align-items:start; }
        .sldt-timeline { position:relative; padding:4px 0 0 46px; }
        .sldt-timeline:before { content:""; position:absolute; top:15px; bottom:24px; left:14px; width:1px; background:var(--line); }
        .sldt-event { width:100%; position:relative; text-align:left; border:1px solid var(--line); background:var(--panel); padding:17px 18px 16px; margin:0 0 13px; cursor:pointer; transition:background .2s,transform .2s,border-color .2s; }
        .sldt-event.selected { border-color:#90a794; box-shadow:0 3px 0 #d8e5d9; transform:translateX(3px); }
        .sldt-event-dot { position:absolute; width:11px; height:11px; border-radius:50%; border:2px solid var(--paper); outline:1px solid #9cad9f; left:-38px; top:21px; background:#91aa94; }
        .sldt-event.formula .sldt-event-dot { background:#d6ad70; }
        .sldt-event.checkpoint .sldt-event-dot { background:var(--orange); }
        .sldt-event-top { display:flex; justify-content:space-between; align-items:center; gap:15px; }
        .sldt-event-time { color:var(--moss); font:11px ui-monospace,monospace; }
        .sldt-event-kind { color:#859188; font:10px ui-monospace,monospace; text-transform:uppercase; letter-spacing:.08em; }
        .sldt-event h3 { font:18px Georgia,serif; font-weight:400; margin:13px 0 5px; }
        .sldt-event p { color:var(--muted); line-height:1.55; font-size:13px; margin:0 0 12px; max-width:570px; }
        .sldt-event-meta { color:#8b988e; font-size:11px; display:flex; align-items:center; gap:6px; }
        .sldt-add { margin:4px 0 0 -46px; padding:10px 12px; border:1px dashed #aebbb0; background:transparent; color:var(--moss); font-size:12px; display:inline-flex; gap:7px; align-items:center; cursor:pointer; }
        .sldt-side { position:sticky; top:24px; }
        .sldt-focus { background:var(--deep); color:#edf3ed; padding:20px; margin-bottom:14px; }
        .sldt-focus .sldt-label { color:#adc2af; }
        .sldt-focus h2 { font:24px Georgia,serif; font-weight:400; margin:12px 0 7px; }
        .sldt-focus p { color:#c2d0c3; font-size:12px; line-height:1.55; margin:0 0 18px; }
        .sldt-focus-meta { border-top:1px solid #496052; padding-top:13px; color:#a9b9ab; font:11px ui-monospace,monospace; display:flex; justify-content:space-between; }
        .sldt-panel { border:1px solid var(--line); background:var(--panel); padding:18px; margin-bottom:14px; }
        .sldt-panel-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:16px; }
        .sldt-panel h3 { font:18px Georgia,serif; font-weight:400; margin:0; }
        .sldt-panel small { color:var(--muted); font-size:11px; }
        .sldt-material { display:flex; align-items:center; gap:9px; padding:9px 0; border-top:1px solid #e9eee8; font-size:12px; }
        .sldt-material:first-of-type { border-top:0; }
        .sldt-swatch { width:8px; height:8px; border-radius:50%; flex:none; }
        .sldt-material span:nth-child(2) { flex:1; }
        .sldt-amount { color:var(--moss); font:11px ui-monospace,monospace; }
        .sldt-note { display:flex; gap:7px; margin-top:8px; }
        .sldt-note input { min-width:0; flex:1; border:1px solid var(--line); padding:10px; background:#fff; font:12px Inter,sans-serif; outline:none; }
        .sldt-note input:focus { border-color:var(--moss); }
        .sldt-mini { width:34px; border:1px solid var(--moss); background:var(--sage); color:var(--moss); cursor:pointer; display:grid; place-items:center; }
        .sldt-run { width:100%; margin-top:14px; border:0; background:var(--orange); color:#fff; padding:11px; font-size:12px; cursor:pointer; }
        .sldt-run.active { background:var(--moss); }
        .sldt-formula { margin-top:12px; border-top:1px solid var(--line); padding-top:12px; }
        .sldt-formula button { border:0; background:transparent; color:var(--moss); padding:3px 0; font-size:11px; display:flex; gap:6px; align-items:center; cursor:pointer; }
        .sldt-mobile { display:none; }
        @media (max-width:760px) {
          .sldt-rail { width:54px; }
          .sldt-mark { margin-bottom:25px; }
          .sldt-rail-button { width:42px; }
          .sldt-header { padding:18px 18px; }
          .sldt-content { padding:24px 18px 40px; }
          .sldt-title { font-size:24px; }
          .sldt-button:not(.sldt-icon-button) { display:none; }
          .sldt-board { grid-template-columns:1fr; gap:24px; }
          .sldt-side { position:static; }
          .sldt-toolbar { display:block; }
          .sldt-toolbar-note { margin-top:7px; }
          .sldt-mobile { display:inline-flex; }
        }
      `}</style>

      <div className="sldt-layout">
        <aside className="sldt-rail" aria-label="Primary navigation">
          <div className="sldt-mark">SL</div>
          <button className="sldt-rail-button active" aria-label="Daily bench"><Beaker size={17} /></button>
          <button className="sldt-rail-button" aria-label="Materials"><Leaf size={17} /></button>
          <button className="sldt-rail-button" aria-label="Projects"><FlaskConical size={17} /></button>
          <button className="sldt-rail-button sldt-mobile" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)}><Menu size={17} /></button>
          <div className="sldt-rail-foot">SILLAGE LAB</div>
        </aside>

      <section className="sldt-main">
        <header className="sldt-header">
          <div><div className="sldt-kicker">Daily bench / 18 june 2024</div><h1 className="sldt-title">Lait Vert</h1></div>
          <div className="sldt-actions">
            <button className="sldt-button sldt-icon-button" aria-label="Search" onClick={() => setQueryOpen(!queryOpen)}><Search size={15} /></button>
            <button className="sldt-button" onClick={() => setRunning(!running)}>{running ? "End session" : "Start session"} <Timer size={14} /></button>
            <button className="sldt-button sldt-icon-button sldt-mobile" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu"><Menu size={15} /></button>
          </div>
        </header>

        <div className="sldt-content">
          {queryOpen && <div className="sldt-search"><Search size={13} style={{ verticalAlign: "middle", marginRight: 7 }} /> Search observations, formulas, or materials…</div>}
          <div className="sldt-toolbar">
            <div><div className="sldt-label">Working timeline</div><h2 className="sldt-heading">From first impression to drydown.</h2></div>
            <p className="sldt-toolbar-note"><CalendarDays size={13} style={{ verticalAlign: "middle", marginRight: 5 }} /> Today · bench 02 · {events.length} entries</p>
          </div>

          <div className="sldt-board">
            <section className="sldt-timeline" aria-label="Chronological sensory timeline">
              {events.map((event) => (
                <button key={event.id} className={`sldt-event ${event.kind} ${selectedId === event.id ? "selected" : ""}`} onClick={() => setSelectedId(event.id)}>
                  <span className="sldt-event-dot" />
                  <div className="sldt-event-top"><span className="sldt-event-time">{event.time}</span><span className="sldt-event-kind">{event.kind}</span></div>
                  <h3>{event.title}</h3><p>{event.body}</p>
                  <span className="sldt-event-meta"><Clock3 size={12} /> {event.meta}</span>
                </button>
              ))}
              <button className="sldt-add" onClick={() => document.getElementById("timeline-note")?.focus()}><Plus size={14} /> Add to timeline</button>
            </section>

            <aside className="sldt-side">
              <section className="sldt-focus" aria-live="polite">
                <div className="sldt-label">Selected moment</div>
                <h2>{selected.title}</h2><p>{selected.body}</p>
                <div className="sldt-focus-meta"><span>{selected.time}</span><span>{selected.kind}</span></div>
              </section>
              <section className="sldt-panel">
                <div className="sldt-panel-head"><h3>Formula 0.4</h3><small>5 materials · 100%</small></div>
                {materials.map((material) => <div className="sldt-material" key={material.name}><span className="sldt-swatch" style={{ background: material.tone }} /><span>{material.name}</span><span className="sldt-amount">{material.amount}</span></div>)}
                <div className="sldt-formula"><button onClick={() => setShowFormula(!showFormula)}>{showFormula ? <X size={13} /> : <ChevronDown size={13} />} {showFormula ? "Hide formula details" : "Show formula details"}</button>{showFormula && <small style={{ display: "block", marginTop: 10, lineHeight: 1.5 }}>A green veil over warm skin. The drydown should remain soft, mineral, and quietly persistent.</small>}</div>
              </section>
              <section className="sldt-panel">
                <div className="sldt-panel-head"><h3>Capture an observation</h3><Sparkles size={15} color="var(--orange)" /></div>
                <div className="sldt-note"><input id="timeline-note" value={note} onChange={(event) => setNote(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addObservation()} placeholder="What changed?" aria-label="New observation" /><button className="sldt-mini" onClick={addObservation} aria-label="Save observation"><Check size={14} /></button></div>
                <button className={`sldt-run ${running ? "active" : ""}`} onClick={() => setRunning(!running)}>{running ? "Evaluation running · 41:32" : "Begin timed evaluation"} <CircleDot size={13} style={{ verticalAlign: "middle", marginLeft: 5 }} /></button>
              </section>
            </aside>
          </div>
        </div>
        </section>
      </div>
    </main>
  );
}