/**
 * SillageAtelierNoir — Dark-mode luxe variant of the Sillage Lab mobile mockup
 *
 * Same three-screen composite (sign-in · sessions · chat) and craft-atelier
 * character as SillageAtelierMobile, reimagined as a high-end Parisian
 * perfumery at night: near-black backgrounds, rich amber/gold accents,
 * cream text, and subtle warm glow halos around key elements.
 */

import React, { useState } from "react";
import "./sillage-atelier-noir.css";

// ─── Noir palette — deep charcoal + amber/gold on dark ────────────────────────
const C = {
  bg:        "hsl(30, 12%, 4%)",
  card:      "hsl(28, 14%, 7%)",
  border:    "hsl(32, 18%, 16%)",
  fg:        "hsl(38, 42%, 92%)",
  mutedFg:   "hsl(35, 16%, 58%)",
  muted:     "hsl(30, 14%, 13%)",
  secondary: "hsl(32, 20%, 12%)",
  accent:    "hsl(42, 88%, 58%)",
  accentDim: "hsl(38, 62%, 42%)",
  accentFg:  "hsl(28, 30%, 6%)",
  gold:      "hsl(45, 70%, 68%)",
};

// ─── Typography ────────────────────────────────────────────────────────────
const F = {
  sans: "'Jost', system-ui, sans-serif",
  mono: "'DM Mono', 'Courier New', monospace",
};

// ─── Icons ─────────────────────────────────────────────────────────────────
const PATH = {
  droplet:      "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z",
  plus:         "M12 5v14M5 12h14",
  logOut:       "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  chevronRight: "M9 18l6-6-6-6",
  arrowLeft:    "M19 12H5M12 19l-7-7 7-7",
  send:         "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
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
    <div className="noir-phone-frame">
      <div className="noir-phone-shell">
        <div className="noir-phone-glow" />
        <div className="noir-phone-notch" />
        <div className="noir-phone-screen">{children}</div>
      </div>
      <div className="noir-phone-label">{label}</div>
    </div>
  );
}

// ─── SCREEN 1 — Sign in ───────────────────────────────────────────────────────
function SignInScreen() {
  return (
    <div className="noir-screen">
      <div className="noir-signin-hero">
        <div className="noir-logo-halo">
          <div
            style={{
              width: 64,
              height: 64,
              backgroundColor: C.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 0,
              position: "relative",
              zIndex: 1,
            }}
          >
            <Icon d={PATH.droplet} size={28} color={C.accentFg} sw={1.75} />
          </div>
        </div>

        <div
          style={{
            fontFamily: F.mono,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: C.gold,
            marginTop: 20,
            marginBottom: 8,
          }}
        >
          SILLAGE LAB
        </div>

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
          Your coaching companion after hours
        </div>
      </div>

      <div className="noir-signin-footer">
        <button className="noir-cta-btn">
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke={C.accentFg} strokeWidth="1.5" />
            <path
              d="M12 12h5c0 2.76-2.24 5-5 5a5 5 0 0 1 0-10 5 5 0 0 1 3.54 1.46L14 10"
              stroke={C.accentFg}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
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
  { id: 1, title: "Iris & Vetiver Structure",  sub: "12 messages · Today",    },
  { id: 2, title: "Civet Dosage Experiment",    sub: "7 messages · Yesterday", },
  { id: 3, title: "Chypre Accord Balance",      sub: "23 messages · Mon",      },
  { id: 4, title: "Top Note Volatility Study",  sub: "4 messages · Aug 10",    },
];

function SessionsScreen() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="noir-screen">
      {/* Header */}
      <div className="noir-sessions-header">
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
          <button className="noir-icon-btn noir-icon-btn-accent">
            <Icon d={PATH.plus} size={18} color={C.accentFg} sw={2} />
          </button>
          <button className="noir-icon-btn" style={{ backgroundColor: C.muted }}>
            <Icon d={PATH.logOut} size={16} color={C.mutedFg} sw={1.5} />
          </button>
        </div>
      </div>

      {/* Session list */}
      <div className="noir-list">
        {SESSIONS.map((s) => {
          const on = active === s.id;
          return (
            <button
              key={s.id}
              className={`noir-session-item${on ? " is-active" : ""}`}
              onClick={() => setActive(on ? null : s.id)}
              style={{ backgroundColor: on ? C.secondary : C.card }}
            >
              <div className="noir-session-body">
                <div
                  style={{
                    fontFamily: F.sans,
                    fontSize: 14,
                    fontWeight: 600,
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
                  style={{
                    fontFamily: F.sans,
                    fontSize: 12,
                    fontWeight: 400,
                    color: C.mutedFg,
                  }}
                >
                  {s.sub}
                </div>
              </div>
              <Icon d={PATH.chevronRight} size={14} color={C.accentDim} sw={1.5} />
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
    <div className="noir-screen">
      {/* Header */}
      <div className="noir-chat-header">
        <button className="noir-back-btn">
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
      <div className="noir-messages">
        {MESSAGES.map((m) => {
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={`noir-msg-row${isUser ? " noir-msg-user" : ""}`}>
              <div
                className={`noir-bubble${isUser ? " noir-bubble-user" : ""}`}
                style={
                  isUser
                    ? { backgroundColor: C.accent }
                    : { backgroundColor: C.card, border: `1px solid ${C.border}` }
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
      <div className="noir-input-bar">
        <textarea
          className="noir-textarea"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          rows={1}
          placeholder="Ask your coach…"
          style={{ color: C.fg, backgroundColor: C.card, borderColor: C.border }}
        />
        <button
          className="noir-send-btn"
          style={{ backgroundColor: val.trim() ? C.accent : C.muted }}
        >
          <Icon d={PATH.send} size={16} color={val.trim() ? C.accentFg : C.mutedFg} sw={1.5} />
        </button>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function SillageAtelierNoir() {
  return (
    <div className="noir-root">
      {/* Label */}
      <div className="noir-title-bar">
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 9,
            fontWeight: 400,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: C.gold,
            padding: "3px 8px",
            border: `1px solid ${C.border}`,
          }}
        >
          Sillage Lab Mobile — Noir Édition
        </div>
      </div>
      {/* Three screens */}
      <div className="noir-phones">
        <Phone label="Sign In">
          <SignInScreen />
        </Phone>
        <Phone label="Sessions">
          <SessionsScreen />
        </Phone>
        <Phone label="Conversation">
          <ChatScreen />
        </Phone>
      </div>
    </div>
  );
}
