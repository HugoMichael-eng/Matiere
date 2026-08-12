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
  { id: 1, title: "Iris & Vetiver Structure",  sub: "12 messages · Today",    bg: "#ffebeb" },
  { id: 2, title: "Civet Dosage Experiment",    sub: "7 messages · Yesterday", bg: undefined },
  { id: 3, title: "Chypre Accord Balance",      sub: "23 messages · Mon",      bg: "#bdbdbd" },
  { id: 4, title: "Top Note Volatility Study",  sub: "4 messages · Aug 10",    bg: undefined },
];

function SessionsScreen() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="atelier-screen">
      {/* Header */}
      <div className="atelier-sessions-header mt-[0px] mb-[0px]">
        <div>
          <div
            style={{
              fontFamily: F.sans,
              fontSize: 22,
              fontWeight: 700,
              color: C.fg,
              lineHeight: 1.1,
            }}
          >
            Sessions
          </div>
          <div
            style={{
              fontFamily: F.sans,
              fontSize: 13,
              fontWeight: 400,
              color: C.mutedFg,
              marginTop: 3,
            }}
          >
            {SESSIONS.length} sessions
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {/* + button — accent fill */}
          <button
            className="atelier-icon-btn"
            style={{ backgroundColor: C.accent }}
          >
            <Icon d={PATH.plus} size={18} color={C.accentFg} sw={2} />
          </button>
          {/* Log out button — muted fill */}
          <button
            className="atelier-icon-btn"
            style={{ backgroundColor: C.muted }}
          >
            <Icon d={PATH.logOut} size={16} color={C.mutedFg} sw={1.5} />
          </button>
        </div>
      </div>
      {/* Session list */}
      <div className="atelier-list gap-[0px]">
        {SESSIONS.map((s) => {
          const on = active === s.id;
          return (
            <button
              key={s.id}
              className={`atelier-session-item${on ? " is-active" : ""}`}
              onClick={() => setActive(on ? null : s.id)}
              style={{ backgroundColor: s.bg ?? (on ? C.secondary : C.card) }}
            >
              <div className="atelier-session-body">
                <div
                  className="font-bold"
                  style={{
                    fontFamily: F.sans,
                    fontSize: 14,
                    color: C.fg,
                    marginBottom: 3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.title}
                </div>
                <div
                  className="font-light"
                  style={{
                    fontFamily: F.sans,
                    fontSize: 12,
                    color: C.mutedFg,
                  }}
                >
                  {s.sub}
                </div>
              </div>
              <Icon
                d={PATH.chevronRight}
                size={14}
                color={C.mutedFg}
                sw={1.5}
              />
            </button>
          );
        })}
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

// ─── Root — three screens filling the full viewport ───────────────────────────
export default function SillageAtelierMobile() {
  return (
    <div className="atelier-root">
      <div className="atelier-screen" style={{ flex: 1, borderRight: `1px solid ${C.border}` }}>
        <SignInScreen />
      </div>
      <div className="atelier-screen" style={{ flex: 1, borderRight: `1px solid ${C.border}` }}>
        <SessionsScreen />
      </div>
      <div className="atelier-screen" style={{ flex: 1 }}>
        <ChatScreen />
      </div>
    </div>
  );
}
