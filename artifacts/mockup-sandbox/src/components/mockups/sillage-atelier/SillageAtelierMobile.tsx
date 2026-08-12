/**
 * SillageAtelierMobile — Faithful S1 Design System mockup
 *
 * Mirrors the actual Sillage Lab mobile app using the S1 design system tokens:
 * - Font: Jost (sans) + DM Mono (mono labels)
 * - Radius: 0px — sharp corners throughout
 * - Dark mode palette: near-black bg, warm off-white fg, yellow-gold accent
 * - Three screens: Sign-in · Sessions · Conversation
 */

import React, { useState } from "react";
import "./sillage-atelier.css";

// ─── White & grey palette — light, monochromatic ──────────────────────────────
const C = {
  bg:        "#FFFFFF",
  card:      "#F4F4F4",
  border:    "#E2E2E2",
  fg:        "#111111",
  mutedFg:   "#888888",
  muted:     "#EEEEEE",
  secondary: "#F0F0F0",
  accent:    "#111111",
  accentFg:  "#FFFFFF",
  input:     "#E2E2E2",
};

// ─── Typography (S1 design system) ───────────────────────────────────────────
const F = {
  sans: "'Jost', system-ui, sans-serif",
  mono: "'DM Mono', 'Courier New', monospace",
};

// ─── Icon (Feather-style square strokes) ─────────────────────────────────────
const PATH = {
  droplet:      "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z",
  plus:         "M12 5v14M5 12h14",
  logOut:       "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  chevronRight: "M9 18l6-6-6-6",
  arrowLeft:    "M19 12H5M12 19l-7-7 7-7",
  send:         "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  msgCircle:    "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
};

function Icon({
  d,
  size = 18,
  color = C.mutedFg,
  sw = 1.5,
}: {
  d: string;
  size?: number;
  color?: string;
  sw?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

// ─── Phone shell ──────────────────────────────────────────────────────────────
function Phone({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="atelier-phone-frame">
      <div className="atelier-phone-shell">
        <div className="atelier-phone-notch" />
        <div className="atelier-phone-screen border-t-[0px] border-r-[0px] border-b-[0px] border-l-[0px]">{children}</div>
      </div>
      <div className="atelier-phone-label">{label}</div>
    </div>
  );
}

// ─── SCREEN 1 — Sign in ───────────────────────────────────────────────────────
function SignInScreen() {
  return (
    <div className="atelier-screen">
      <div className="atelier-signin-hero">

        {/* Logo mark — accent square with droplet icon, same as app */}
        <div
          style={{
            width: 64,
            height: 64,
            backgroundColor: C.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            borderRadius: 0,
          }}
        >
          <Icon d={PATH.droplet} size={28} color={C.accentFg} sw={1.75} />
        </div>

        {/* Brand name — exact web logo style */}
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: C.fg,
            marginBottom: 8,
          }}
        >
          SILLAGE LAB
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: F.sans,
            fontSize: 13,
            fontWeight: 400,
            color: C.mutedFg,
            textAlign: "center",
            lineHeight: 1.6,
            maxWidth: 200,
            marginBottom: 40,
          }}
        >
          Your coaching companion at the bench
        </div>

      </div>

      {/* Footer CTA */}
      <div className="atelier-signin-footer">
        {/* Sign in button — exact app button style */}
        <button
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            padding: "14px 20px",
            backgroundColor: C.accent,
            border: "none",
            borderRadius: 0,
            cursor: "pointer",
            fontFamily: F.sans,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: C.accentFg,
          }}
        >
          {/* Google-style G mark */}
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke={C.accentFg} strokeWidth="1.5" />
            <path d="M12 12h5c0 2.76-2.24 5-5 5a5 5 0 0 1 0-10 5 5 0 0 1 3.54 1.46L14 10" stroke={C.accentFg} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Continue with Google
        </button>

        <div
          style={{
            fontFamily: F.sans,
            fontSize: 11,
            fontWeight: 400,
            color: C.mutedFg,
            textAlign: "center",
          }}
        >
          Sign in to access your coaching sessions
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN 2 — Sessions ──────────────────────────────────────────────────────
const SESSIONS = [
  { id: 1, title: "Iris & Vetiver Structure",  msgs: 12, date: "Today",     tag: "Structure",  excerpt: "Try orris concrete at 1–2% to bridge vetiver and iris heart.", bg: "#ffebeb" },
  { id: 2, title: "Civet Dosage Experiment",    msgs: 7,  date: "Yesterday", tag: "Materials",  excerpt: "Keep civet below 0.3% — character reads animalic beyond that.", bg: "#fff5f5" },
  { id: 3, title: "Chypre Accord Balance",      msgs: 23, date: "Mon",       tag: "Accord",     excerpt: "Labdanum is your missing anchor in the base.", bg: "#fff5f5" },
  { id: 4, title: "Top Note Volatility Study",  msgs: 4,  date: "Aug 10",    tag: "Evaluation", excerpt: "Bergamot opens too fast — consider a small ethanol dilution.", bg: undefined },
];

const STATS = [
  { label: "Sessions", value: "4" },
  { label: "Messages", value: "46" },
  { label: "Materials", value: "12" },
];

function Tag({ label }: { label: string }) {
  return (
    <span style={{
      fontFamily: F.mono,
      fontSize: 8,
      fontWeight: 400,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: C.mutedFg,
      border: `1px solid ${C.border}`,
      padding: "2px 6px",
      flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

function SessionsScreen() {
  const [active, setActive] = useState<number | null>(null);
  const [featured] = SESSIONS;
  const rest = SESSIONS.slice(1);

  return (
    <div className="atelier-screen" style={{ overflowY: "auto" }}>
      {/* ── Header ── */}
      <div style={{
        padding: "18px 16px 14px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}>
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 8, fontWeight: 300,
            letterSpacing: "0.22em", textTransform: "uppercase", color: C.mutedFg, marginBottom: 4 }}>
            Wed, Aug 12
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 20, fontWeight: 700, color: C.fg, lineHeight: 1.1 }}>
            Good morning.
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
          <button className="atelier-icon-btn" style={{ backgroundColor: C.accent }}>
            <Icon d={PATH.plus} size={16} color={C.accentFg} sw={2} />
          </button>
          <button className="atelier-icon-btn" style={{ backgroundColor: C.muted }}>
            <Icon d={PATH.logOut} size={14} color={C.mutedFg} sw={1.5} />
          </button>
        </div>
      </div>
      {/* ── Stats strip ── */}
      <div style={{
        display: "flex",
        borderBottom: `1px solid ${C.border}`,
      }}>
        {STATS.map((s, i) => (
          <div key={s.label} style={{
            flex: 1,
            padding: "12px 0",
            textAlign: "center",
            borderRight: i < STATS.length - 1 ? `1px solid ${C.border}` : "none",
          }}>
            <div style={{ fontFamily: F.sans, fontSize: 20, fontWeight: 700, color: C.fg, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 7.5, fontWeight: 300,
              letterSpacing: "0.18em", textTransform: "uppercase", color: C.mutedFg, marginTop: 4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
      {/* ── Pinned / featured session ── */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ fontFamily: F.mono, fontSize: 8, fontWeight: 300,
          letterSpacing: "0.22em", textTransform: "uppercase", color: C.mutedFg, marginBottom: 10 }}>
          Pinned
        </div>
        <button
          onClick={() => setActive(active === featured.id ? null : featured.id)}
          style={{
            width: "100%", textAlign: "left", background: featured.bg ?? C.card,
            border: `1px solid ${C.border}`, padding: "14px 14px 16px", cursor: "pointer",
            marginBottom: 16,
          }}
          className="bg-[#d0d2db]">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <Tag label={featured.tag} />
            <span style={{ fontFamily: F.mono, fontSize: 8, color: C.mutedFg, letterSpacing: "0.1em" }}>
              {featured.date}
            </span>
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 15, fontWeight: 700, color: C.fg,
            marginBottom: 6, lineHeight: 1.2 }}>
            {featured.title}
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 300, color: C.mutedFg,
            lineHeight: 1.55 }}>
            {featured.excerpt}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: 12 }}>
            <span style={{ fontFamily: F.mono, fontSize: 8, color: C.mutedFg,
              letterSpacing: "0.14em" }}>{featured.msgs} messages</span>
            <Icon d={PATH.chevronRight} size={12} color={C.mutedFg} sw={1.5} />
          </div>
        </button>
      </div>
      {/* ── Recent list ── */}
      <div style={{ padding: "0 16px 12px" }}>
        <div style={{ fontFamily: F.mono, fontSize: 8, fontWeight: 300,
          letterSpacing: "0.22em", textTransform: "uppercase", color: C.mutedFg, marginBottom: 10 }}>
          Recent
        </div>
        <div style={{ border: `1px solid ${C.border}` }}>
          {rest.map((s, i) => {
            const on = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActive(on ? null : s.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "11px 12px", textAlign: "left", cursor: "pointer", border: "none",
                  borderBottom: i < rest.length - 1 ? `1px solid ${C.border}` : "none",
                  backgroundColor: s.bg ?? (on ? C.secondary : C.bg),
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 600,
                    color: C.fg, marginBottom: 3, whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Tag label={s.tag} />
                    <span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 300,
                      color: C.mutedFg }}>{s.msgs} msgs · {s.date}</span>
                  </div>
                </div>
                <Icon d={PATH.chevronRight} size={12} color={C.mutedFg} sw={1.5} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN 3 — Conversation ──────────────────────────────────────────────────
const MESSAGES = [
  {
    id: "1",
    role: "assistant" as const,
    text: "I've reviewed the Iris & Vetiver brief. The accord reads flat in the dry-down — have you tried increasing the woody base?",
  },
  {
    id: "2",
    role: "user" as const,
    text: "Yes, pushed vetiver 8%→11% but it's overpowering the iris heart.",
  },
  {
    id: "3",
    role: "assistant" as const,
    text: "Try adding orris concrete at 1–2%. It bridges the gap — softening the vetiver without dulling the iris.",
  },
  {
    id: "4",
    role: "user" as const,
    text: "Brilliant. Any thoughts on the top note opening?",
  },
];

function ChatScreen() {
  const [val, setVal] = useState("What about bergamot?");

  return (
    <div className="atelier-screen">
      {/* Header */}
      <div className="atelier-chat-header">
        <button className="atelier-back-btn">
          <Icon d={PATH.arrowLeft} size={18} color={C.fg} sw={1.5} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: F.sans,
              fontSize: 15,
              fontWeight: 600,
              color: C.fg,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Iris & Vetiver Structure
          </div>
          <div
            style={{
              fontFamily: F.sans,
              fontSize: 12,
              fontWeight: 400,
              color: C.mutedFg,
              marginTop: 1,
            }}
          >
            Formula coaching session
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="atelier-messages">
        {MESSAGES.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`atelier-msg-row${isUser ? " atelier-msg-user" : ""}`}
            >
              <div
                className="atelier-bubble"
                style={
                  isUser
                    ? { backgroundColor: C.accent }
                    : {
                        backgroundColor: C.card,
                        border: `1px solid ${C.border}`,
                      }
                }
              >
                <span
                  style={{
                    fontFamily: F.sans,
                    fontSize: 13,
                    fontWeight: 400,
                    lineHeight: 1.55,
                    color: isUser ? C.accentFg : C.fg,
                  }}
                >
                  {m.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input bar */}
      <div className="atelier-input-bar">
        <textarea
          className="atelier-textarea"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          rows={1}
          placeholder="Ask your coach…"
          style={{ color: C.fg, backgroundColor: C.card, borderColor: C.border }}
        />
        <button
          className="atelier-send-btn"
          style={{ backgroundColor: val.trim() ? C.accent : C.muted }}
        >
          <Icon
            d={PATH.send}
            size={16}
            color={val.trim() ? C.accentFg : C.mutedFg}
            sw={1.5}
          />
        </button>
      </div>
    </div>
  );
}

// ─── Root — single screen, tab-switched ───────────────────────────────────────
// ─── Tab icon paths ───────────────────────────────────────────────────────────
const TAB_ICONS: Record<string, string> = {
  "Sessions":  "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  "Formulas":  "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18",
  "Shop":      "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  "Lab":       "M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2M8.5 2h7M6 22h12",
  "Sign In":   "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
};

const TABS = ["Sessions", "Formulas", "Shop", "Lab"] as const;
type Tab = typeof TABS[number];

export default function SillageAtelierMobile() {
  const [tab, setTab] = useState<Tab>("Sessions");

  return (
    <div className="atelier-root">
      {/* Active screen fills all available space */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {tab === "Sessions"  && <SessionsScreen />}
        {tab === "Formulas"  && <PlaceholderScreen label="Formulas" />}
        {tab === "Shop"      && <PlaceholderScreen label="Shop" />}
        {tab === "Lab"       && <PlaceholderScreen label="Lab" />}
      </div>

      {/* Tab bar */}
      <div className="atelier-tab-bar">
        {TABS.map((t) => (
          <button
            key={t}
            className={`atelier-tab${tab === t ? " is-active" : ""}`}
            onClick={() => setTab(t)}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
              style={{ display: "block", margin: "0 auto 3px" }}
            >
              <path d={TAB_ICONS[t]} />
            </svg>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Placeholder for new screens ──────────────────────────────────────────────
function PlaceholderScreen({ label }: { label: string }) {
  return (
    <div className="atelier-screen" style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <svg width={32} height={32} viewBox="0 0 24 24" fill="none"
        stroke={C.border} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
        <path d={TAB_ICONS[label]} />
      </svg>
      <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em",
        textTransform: "uppercase", color: C.border }}>
        {label}
      </div>
    </div>
  );
}
