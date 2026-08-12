/**
 * SillageWorkbenchMobile — alternate design hypothesis for the Sillage Lab mobile app
 *
 * Fundamentally different concept from the chat-first "Sillage Atelier" mockup:
 * instead of a sign-in → session-list → linear-chat model, this explores a
 * "workbench dashboard" model — formulas as living documents with inline,
 * structured coach annotations attached directly to note components, plus an
 * insight feed you skim and save instead of a back-and-forth thread.
 *
 * Screens: Home (dashboard + quick-ask) · Formula (accordion + inline notes) ·
 * Insights (savable feed, no chat thread)
 *
 * Same S1 tokens as the source mockup: Jost + DM Mono, 0px radius, dark palette,
 * yellow-gold accent.
 */

import React, { useState } from "react";
import "./sillage-workbench.css";

// ─── S1 colour tokens (dark mode) ─────────────────────────────────────────────
const C = {
  bg: "hsl(220, 11.1%, 5.3%)",
  card: "hsl(216, 11.1%, 8.8%)",
  border: "hsl(220, 11.7%, 15.1%)",
  fg: "hsl(225, 18.2%, 91.4%)",
  mutedFg: "hsl(221, 15.5%, 59.6%)",
  muted: "hsl(227, 26.7%, 19.8%)",
  secondary: "hsl(226, 30.2%, 16.9%)",
  accent: "hsl(46, 83.8%, 61.4%)",
  accentFg: "hsl(220, 11.1%, 5.3%)",
  input: "hsl(220, 11.7%, 15.1%)",
};

const F = {
  sans: "'Jost', system-ui, sans-serif",
  mono: "'DM Mono', 'Courier New', monospace",
};

const PATH = {
  droplet: "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z",
  home: "M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10",
  flask: "M9 2v6L4 18a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-10V2M9 2h6",
  spark: "M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  chevronDown: "M6 9l6 6 6-6",
  bookmark: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z",
  arrowUp: "M12 19V5M5 12l7-7 7 7",
  mic: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4",
  dot: "M12 12h.01",
};

function Icon({
  d,
  size = 18,
  color = C.mutedFg,
  sw = 1.5,
  fill = "none",
}: {
  d: string;
  size?: number;
  color?: string;
  sw?: number;
  fill?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

// ─── Phone shell (same chrome language as source, own class names) ───────────
function Phone({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="wb-phone-frame">
      <div className="wb-phone-shell">
        <div className="wb-phone-notch" />
        <div className="wb-phone-screen">{children}</div>
      </div>
      <div className="wb-phone-label">{label}</div>
    </div>
  );
}

function TabBar({ active }: { active: "home" | "formula" | "insights" }) {
  const items: { key: "home" | "formula" | "insights"; label: string; d: string }[] = [
    { key: "home", label: "Home", d: PATH.home },
    { key: "formula", label: "Formulas", d: PATH.flask },
    { key: "insights", label: "Insights", d: PATH.spark },
  ];
  return (
    <div className="wb-tabbar">
      {items.map((it) => {
        const on = it.key === active;
        return (
          <div key={it.key} className="wb-tab">
            <Icon d={it.d} size={18} color={on ? C.accent : C.mutedFg} sw={on ? 2 : 1.5} />
            <span
              style={{
                fontFamily: F.mono,
                fontSize: 8.5,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: on ? C.accent : C.mutedFg,
                marginTop: 4,
              }}
            >
              {it.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── SCREEN 1 — Home dashboard ────────────────────────────────────────────────
const FORMULAS = [
  { id: 1, name: "Iris & Vetiver Structure", stage: "Dry-down refinement", progress: 72, flags: 2 },
  { id: 2, name: "Civet Dosage Experiment", stage: "Base calibration", progress: 40, flags: 0 },
  { id: 3, name: "Chypre Accord Balance", stage: "Heart accord", progress: 88, flags: 1 },
];

function HomeScreen() {
  const [ask, setAsk] = useState("");
  return (
    <div className="wb-screen">
      <div className="wb-home-header">
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.28em", color: C.mutedFg, textTransform: "uppercase" }}>
            Good evening
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 21, fontWeight: 700, color: C.fg, marginTop: 4 }}>
            Your workbench
          </div>
        </div>
        <div className="wb-avatar">
          <Icon d={PATH.user} size={16} color={C.mutedFg} sw={1.5} />
        </div>
      </div>

      <div className="wb-quick-ask">
        <Icon d={PATH.spark} size={14} color={C.accent} sw={1.6} />
        <input
          className="wb-quick-ask-input"
          placeholder="Ask the coach anything…"
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          style={{ fontFamily: F.sans, color: C.fg }}
        />
        <button className="wb-mic-btn" style={{ backgroundColor: ask.trim() ? C.accent : C.muted }}>
          <Icon d={ask.trim() ? PATH.arrowUp : PATH.mic} size={13} color={ask.trim() ? C.accentFg : C.mutedFg} sw={1.75} />
        </button>
      </div>

      <div className="wb-section-label" style={{ fontFamily: F.mono }}>
        Active Formulas · {FORMULAS.length}
      </div>

      <div className="wb-formula-list">
        {FORMULAS.map((f) => (
          <div key={f.id} className="wb-formula-card">
            <div className="wb-formula-card-top">
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: F.sans,
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: C.fg,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {f.name}
                </div>
                <div style={{ fontFamily: F.sans, fontSize: 11.5, color: C.mutedFg, marginTop: 2 }}>
                  {f.stage}
                </div>
              </div>
              {f.flags > 0 && (
                <div className="wb-flag-badge" style={{ fontFamily: F.mono }}>
                  {f.flags} NOTE{f.flags > 1 ? "S" : ""}
                </div>
              )}
            </div>
            <div className="wb-progress-track">
              <div className="wb-progress-fill" style={{ width: `${f.progress}%`, backgroundColor: C.accent }} />
            </div>
          </div>
        ))}
      </div>

      <TabBar active="home" />
    </div>
  );
}

// ─── SCREEN 2 — Formula detail with inline structured annotations ────────────
type NoteItem = { name: string; pct: string; note?: string };
const PYRAMID: { tier: string; items: NoteItem[] }[] = [
  {
    tier: "Top",
    items: [
      { name: "Bergamot FCF", pct: "6%" },
      { name: "Pink Pepper", pct: "2%" },
    ],
  },
  {
    tier: "Heart",
    items: [
      { name: "Iris Absolute", pct: "14%", note: "Reads flat against the vetiver — consider orris concrete 1–2% to bridge." },
      { name: "Orris Concrete", pct: "1.5%" },
    ],
  },
  {
    tier: "Base",
    items: [
      { name: "Vetiver Haiti", pct: "11%", note: "Pushed from 8%→11%, now overpowering the heart. Flagged for rebalance." },
      { name: "Ambroxan", pct: "5%" },
    ],
  },
];

function FormulaScreen() {
  const [open, setOpen] = useState<string>("Heart");

  return (
    <div className="wb-screen">
      <div className="wb-formula-header">
        <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.24em", color: C.mutedFg, textTransform: "uppercase" }}>
          Formula · v4
        </div>
        <div style={{ fontFamily: F.sans, fontSize: 18, fontWeight: 700, color: C.fg, marginTop: 4 }}>
          Iris & Vetiver Structure
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <div className="wb-pill" style={{ fontFamily: F.mono }}>72% COMPLETE</div>
          <div className="wb-pill wb-pill-accent" style={{ fontFamily: F.mono }}>2 OPEN NOTES</div>
        </div>
      </div>

      <div className="wb-pyramid">
        {PYRAMID.map((tier) => {
          const isOpen = open === tier.tier;
          return (
            <div key={tier.tier} className="wb-tier">
              <button
                className="wb-tier-header"
                onClick={() => setOpen(isOpen ? "" : tier.tier)}
              >
                <span style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 600, color: C.fg }}>
                  {tier.tier} Notes
                </span>
                <div style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                  <Icon d={PATH.chevronDown} size={15} color={C.mutedFg} sw={1.5} />
                </div>
              </button>
              {isOpen && (
                <div className="wb-tier-body">
                  {tier.items.map((it) => (
                    <div key={it.name} className="wb-note-row">
                      <div className="wb-note-row-top">
                        <span style={{ fontFamily: F.sans, fontSize: 12.5, color: C.fg }}>{it.name}</span>
                        <span style={{ fontFamily: F.mono, fontSize: 11, color: C.mutedFg }}>{it.pct}</span>
                      </div>
                      {it.note && (
                        <div className="wb-annotation">
                          <Icon d={PATH.spark} size={11} color={C.accent} sw={1.6} />
                          <span style={{ fontFamily: F.sans, fontSize: 11.5, color: C.mutedFg, lineHeight: 1.5 }}>
                            {it.note}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <TabBar active="formula" />
    </div>
  );
}

// ─── SCREEN 3 — Insight feed (savable cards, not chat) ────────────────────────
const INSIGHTS = [
  {
    id: 1,
    formula: "Iris & Vetiver",
    text: "Orris concrete at 1–2% bridges iris and vetiver without dulling the heart. Worth testing before rebalancing vetiver down.",
    saved: true,
  },
  {
    id: 2,
    formula: "Chypre Accord",
    text: "Oakmoss substitute (Evernyl + Veramoss blend) keeps the mossy backbone within IFRA limits while preserving the chypre signature.",
    saved: false,
  },
  {
    id: 3,
    formula: "Top Note Study",
    text: "Bergamot FCF volatility drops sharply above 22°C ambient — bench-test opening notes in a temperature-controlled room.",
    saved: false,
  },
];

function InsightsScreen() {
  const [saved, setSaved] = useState<Record<number, boolean>>({ 1: true });

  return (
    <div className="wb-screen">
      <div className="wb-insights-header">
        <div style={{ fontFamily: F.sans, fontSize: 21, fontWeight: 700, color: C.fg }}>Insights</div>
        <div style={{ fontFamily: F.sans, fontSize: 12.5, color: C.mutedFg, marginTop: 3 }}>
          Coach observations, distilled from your sessions
        </div>
      </div>

      <div className="wb-insight-list">
        {INSIGHTS.map((i) => {
          const isSaved = !!saved[i.id];
          return (
            <div key={i.id} className="wb-insight-card">
              <div className="wb-insight-card-top">
                <div className="wb-pill wb-pill-ghost" style={{ fontFamily: F.mono }}>
                  {i.formula.toUpperCase()}
                </div>
                <button
                  className="wb-bookmark-btn"
                  onClick={() => setSaved((s) => ({ ...s, [i.id]: !s[i.id] }))}
                >
                  <Icon
                    d={PATH.bookmark}
                    size={15}
                    color={isSaved ? C.accent : C.mutedFg}
                    sw={1.5}
                    fill={isSaved ? C.accent : "none"}
                  />
                </button>
              </div>
              <div style={{ fontFamily: F.sans, fontSize: 12.5, color: C.fg, lineHeight: 1.6, marginTop: 8 }}>
                {i.text}
              </div>
            </div>
          );
        })}
      </div>

      <TabBar active="insights" />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function SillageWorkbenchMobile() {
  return (
    <div className="wb-root">
      <div className="wb-title-bar">
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 9,
            fontWeight: 400,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: C.mutedFg,
            padding: "3px 8px",
            border: `1px solid ${C.border}`,
          }}
        >
          Sillage Lab — Workbench Concept
        </div>
      </div>

      <div className="wb-phones">
        <Phone label="Home">
          <HomeScreen />
        </Phone>
        <Phone label="Formula Detail">
          <FormulaScreen />
        </Phone>
        <Phone label="Insights Feed">
          <InsightsScreen />
        </Phone>
      </div>
    </div>
  );
}
