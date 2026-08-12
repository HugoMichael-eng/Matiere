/**
 * SillageAtelierMobile — "Warm Atelier" vibe variant
 *
 * Aesthetic direction: Craft atelier warmth — amber, parchment, raw linen.
 * Vs the source's cool, minimal, near-monochrome tech feel, this variant
 * evokes an artisan perfumer's workshop: warm candlelight amber accents,
 * cream/ivory backgrounds, sepia ink text, organic rounded shapes, and
 * generous breathing room that reads like a leather-bound notebook.
 *
 * Layout: Identical three-screen composite (sign-in · sessions list · chat)
 * at 402×874px mobile viewport, stacked as 3 phone frames side by side.
 */

import React, { useState } from "react";
import "./sillage-atelier.css";

// ─── Color tokens (warm atelier palette) ─────────────────────────────────────
const A = {
  bg: "#FAF7F2",         // warm cream / parchment
  bgDeep: "#F3EDE2",     // slightly deeper ivory for cards
  bgPanel: "#EDE4D4",    // linen panel bg
  border: "#D9CCBA",     // warm sepia border
  ink: "#2C2318",        // deep sepia-black for headings
  inkMid: "#6B5944",     // mid sepia for body text
  inkLight: "#9B876E",   // light sepia for muted/timestamps
  amber: "#C17D2E",      // warm amber — primary action
  amberLight: "#F4E4C5", // pale amber tint — user bubble bg
  amberDeep: "#A66620",  // pressed/deep amber
  amberFg: "#FAF7F2",    // text on amber
  destroy: "#B84A3A",    // terracotta-red for destructive
  radius: 14,            // generous rounding for warmth
  radiusLg: 22,
  radiusFull: 999,
};

// ─── Typography ──────────────────────────────────────────────────────────────
// We use Georgia for display warmth, system-ui for body legibility
const F = {
  display: "'Georgia', 'Times New Roman', serif",
  body: "system-ui, -apple-system, sans-serif",
};

// ─── Tiny icon SVGs (inline, no external dep) ────────────────────────────────
function Icon({
  d,
  size = 20,
  color = A.inkMid,
  strokeWidth = 1.75,
}: {
  d: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

// Common icon paths (Feather-style)
const ICONS = {
  droplet:
    "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z",
  plus: "M12 5v14M5 12h14",
  logOut:
    "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  chevronRight: "M9 18l6-6-6-6",
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  fileText:
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  chrome:
    "M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 9V2M5.4 5.4l5 5M2 12h7M5.4 18.6l5-5M12 15v7M18.6 18.6l-5-5M22 12h-7M18.6 5.4l-5 5",
  msgCircle:
    "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
};

// ─── Phone frame wrapper ──────────────────────────────────────────────────────
function PhoneFrame({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="atelier-phone-frame">
      <div className="atelier-phone-notch" />
      <div className="atelier-phone-screen">{children}</div>
      <div className="atelier-phone-label">{label}</div>
    </div>
  );
}

// ─── Decorative ambient mark ─────────────────────────────────────────────────
function AtelierMark({ size = 52 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: A.radiusLg,
        background: `linear-gradient(135deg, ${A.amber} 0%, ${A.amberDeep} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 4px 18px rgba(193,125,46,0.30)`,
        marginBottom: 4,
      }}
    >
      <Icon d={ICONS.droplet} size={size * 0.48} color={A.amberFg} strokeWidth={1.5} />
    </div>
  );
}

// ─── SCREEN 1 — Sign-in ───────────────────────────────────────────────────────
function SignInScreen() {
  return (
    <div className="atelier-screen" style={{ background: A.bg }}>
      {/* Ambient background texture */}
      <div className="atelier-grain" />

      {/* Hero */}
      <div className="atelier-signin-hero">
        {/* Decorative ruled lines above logo */}
        <div className="atelier-ruled-lines">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="atelier-ruled-line"
              style={{ opacity: 0.18 + i * 0.12 }}
            />
          ))}
        </div>

        <AtelierMark size={68} />

        <div style={{ textAlign: "center", marginTop: 4 }}>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 30,
              fontWeight: 400,
              color: A.ink,
              letterSpacing: "-0.01em",
              lineHeight: 1.15,
            }}
          >
            Sillage Lab
          </div>
          <div
            style={{
              marginTop: 6,
              fontFamily: F.body,
              fontSize: 13,
              color: A.inkLight,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Coaching at the bench
          </div>
        </div>

        {/* Decorative amber divider */}
        <div className="atelier-divider" style={{ marginTop: 28, marginBottom: 0 }} />

        <div
          style={{
            fontFamily: F.body,
            fontSize: 13,
            color: A.inkMid,
            textAlign: "center",
            maxWidth: 220,
            lineHeight: 1.6,
            paddingTop: 12,
          }}
        >
          Your personal guide through structure, accord, and material study
        </div>
      </div>

      {/* Footer CTA */}
      <div className="atelier-signin-footer">
        <button
          className="atelier-btn-primary"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            padding: "15px 24px",
            fontFamily: F.body,
            fontSize: 14,
            fontWeight: 600,
            color: A.amberFg,
            background: `linear-gradient(135deg, ${A.amber} 0%, ${A.amberDeep} 100%)`,
            border: "none",
            borderRadius: A.radius,
            cursor: "pointer",
            letterSpacing: "0.02em",
            boxShadow: `0 3px 12px rgba(193,125,46,0.35)`,
          }}
        >
          <Icon d={ICONS.chrome} size={17} color={A.amberFg} strokeWidth={1.6} />
          Continue with Google
        </button>
        <div
          style={{
            fontFamily: F.body,
            fontSize: 11,
            color: A.inkLight,
            textAlign: "center",
            marginTop: 4,
            letterSpacing: "0.02em",
          }}
        >
          Sign in to access your coaching sessions
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN 2 — Sessions list ─────────────────────────────────────────────────
const MOCK_SESSIONS = [
  {
    id: 1,
    title: "Iris & Vetiver Structure",
    messages: 12,
    date: "Today, 14:32",
    tag: "Structure",
  },
  {
    id: 2,
    title: "Civet Dosage Experiment",
    messages: 7,
    date: "Yesterday",
    tag: "Materials",
  },
  {
    id: 3,
    title: "Chypre Accord Balance",
    messages: 23,
    date: "Mon",
    tag: "Accord",
  },
  {
    id: 4,
    title: "Top Note Volatility",
    messages: 4,
    date: "Aug 12",
    tag: "Evaluation",
  },
];

function SessionsScreen() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="atelier-screen" style={{ background: A.bg }}>
      <div className="atelier-grain" />

      {/* Header */}
      <div
        className="atelier-sessions-header"
        style={{
          borderBottomColor: A.border,
          background: A.bg,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 24,
              fontWeight: 400,
              color: A.ink,
              letterSpacing: "-0.01em",
            }}
          >
            Sessions
          </div>
          <div
            style={{
              fontFamily: F.body,
              fontSize: 12,
              color: A.inkLight,
              marginTop: 2,
              letterSpacing: "0.04em",
            }}
          >
            {MOCK_SESSIONS.length} active sessions
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="atelier-icon-btn"
            style={{
              background: `linear-gradient(135deg, ${A.amber} 0%, ${A.amberDeep} 100%)`,
              boxShadow: `0 2px 8px rgba(193,125,46,0.28)`,
            }}
          >
            <Icon d={ICONS.plus} size={18} color={A.amberFg} strokeWidth={2} />
          </button>
          <button
            className="atelier-icon-btn"
            style={{ background: A.bgPanel, border: `1px solid ${A.border}` }}
          >
            <Icon d={ICONS.logOut} size={16} color={A.inkLight} />
          </button>
        </div>
      </div>

      {/* Amber section label */}
      <div className="atelier-section-label" style={{ color: A.inkLight }}>
        Recent
      </div>

      {/* Session list */}
      <div className="atelier-list">
        {MOCK_SESSIONS.map((s, i) => (
          <React.Fragment key={s.id}>
            <button
              className="atelier-session-item"
              onClick={() => setActive(active === s.id ? null : s.id)}
              style={{
                background:
                  active === s.id ? A.amberLight : A.bgDeep,
                borderColor:
                  active === s.id ? A.amber : A.border,
              }}
            >
              {/* Amber accent bar */}
              <div
                className="atelier-session-bar"
                style={{
                  background:
                    active === s.id
                      ? A.amber
                      : A.bgPanel,
                  borderColor: A.border,
                }}
              />

              <div className="atelier-session-body">
                <div
                  style={{
                    fontFamily: F.body,
                    fontSize: 14,
                    fontWeight: 500,
                    color: A.ink,
                    textAlign: "left",
                  }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    fontFamily: F.body,
                    fontSize: 11,
                    color: A.inkLight,
                    marginTop: 2,
                    display: "flex",
                    gap: 10,
                    textAlign: "left",
                  }}
                >
                  <span>{s.messages} messages</span>
                  <span style={{ color: A.border }}>·</span>
                  <span>{s.tag}</span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: F.body,
                    fontSize: 11,
                    color: A.inkLight,
                  }}
                >
                  {s.date}
                </span>
                <Icon
                  d={ICONS.chevronRight}
                  size={14}
                  color={active === s.id ? A.amber : A.inkLight}
                />
              </div>
            </button>
            {i < MOCK_SESSIONS.length - 1 && (
              <div style={{ height: 6 }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Bottom ambient */}
      <div className="atelier-bottom-fade" style={{ background: `linear-gradient(to top, ${A.bg}, transparent)` }} />
    </div>
  );
}

// ─── SCREEN 3 — Conversation chat ────────────────────────────────────────────
const MOCK_MESSAGES = [
  {
    id: "1",
    role: "assistant" as const,
    content:
      "Good morning. I've reviewed the Iris & Vetiver brief. The accord is reading a little flat in the dry-down — have you tried increasing the woody base slightly?",
  },
  {
    id: "2",
    role: "user" as const,
    content:
      "Yes, I pushed vetiver from 8% to 11% but it's overpowering the iris heart now.",
  },
  {
    id: "3",
    role: "assistant" as const,
    content:
      "That's a common tension in this family. Consider adding a small amount of orris concrete (1–2%) to bridge the two — it softens the vetiver's sharpness while deepening the iris character.",
  },
  {
    id: "4",
    role: "user" as const,
    content: "Brilliant. Any thoughts on the top note opening?",
  },
];

function ChatScreen() {
  const [input, setInput] = useState("What about bergamot?");

  return (
    <div className="atelier-screen" style={{ background: A.bg }}>
      <div className="atelier-grain" />

      {/* Header */}
      <div
        className="atelier-chat-header"
        style={{
          borderBottomColor: A.border,
          background: A.bg,
        }}
      >
        <button className="atelier-back-btn">
          <Icon d={ICONS.arrowLeft} size={20} color={A.inkMid} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 15,
              color: A.ink,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Iris & Vetiver Structure
          </div>
          <div
            style={{
              fontFamily: F.body,
              fontSize: 11,
              color: A.inkLight,
              marginTop: 1,
              letterSpacing: "0.03em",
            }}
          >
            Formula coaching session
          </div>
        </div>
        <button
          className="atelier-icon-btn"
          style={{
            background: A.bgPanel,
            border: `1px solid ${A.border}`,
          }}
        >
          <Icon d={ICONS.fileText} size={15} color={A.inkMid} />
        </button>
      </div>

      {/* Messages */}
      <div className="atelier-messages">
        {MOCK_MESSAGES.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`atelier-msg-row ${isUser ? "atelier-msg-user" : "atelier-msg-assistant"}`}
            >
              {!isUser && (
                <div
                  className="atelier-avatar"
                  style={{
                    background: `linear-gradient(135deg, ${A.amber} 0%, ${A.amberDeep} 100%)`,
                  }}
                >
                  <Icon d={ICONS.droplet} size={11} color={A.amberFg} strokeWidth={1.6} />
                </div>
              )}
              <div
                className="atelier-bubble"
                style={
                  isUser
                    ? {
                        background: A.amberLight,
                        border: `1px solid ${A.amber}44`,
                        borderBottomRightRadius: 4,
                      }
                    : {
                        background: A.bgDeep,
                        border: `1px solid ${A.border}`,
                        borderBottomLeftRadius: 4,
                      }
                }
              >
                <span
                  style={{
                    fontFamily: F.body,
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    color: isUser ? A.amberDeep : A.inkMid,
                  }}
                >
                  {m.content}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input bar */}
      <div
        className="atelier-input-bar"
        style={{
          borderTopColor: A.border,
          background: A.bg,
        }}
      >
        <div
          className="atelier-input-wrap"
          style={{
            background: A.bgDeep,
            border: `1px solid ${A.border}`,
            borderRadius: A.radius,
          }}
        >
          <textarea
            className="atelier-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              fontFamily: F.body,
              fontSize: 14,
              color: A.inkMid,
            }}
            rows={1}
          />
        </div>
        <button
          className="atelier-send-btn"
          style={{
            background: `linear-gradient(135deg, ${A.amber} 0%, ${A.amberDeep} 100%)`,
            boxShadow: `0 2px 10px rgba(193,125,46,0.32)`,
            borderRadius: A.radius,
          }}
        >
          <Icon d={ICONS.send} size={17} color={A.amberFg} />
        </button>
      </div>
    </div>
  );
}

// ─── Root composite ───────────────────────────────────────────────────────────
export default function SillageAtelierMobile() {
  return (
    <div className="atelier-root">
      {/* Ambient warm background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(193,125,46,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Title */}
      <div className="atelier-title-bar">
        <div
          style={{
            fontFamily: F.display,
            fontSize: 13,
            color: A.inkLight,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Sillage Lab — Warm Atelier
        </div>
        <div className="atelier-title-tag" style={{ background: A.amberLight, borderColor: `${A.amber}55`, color: A.amber }}>
          Vibe variant
        </div>
      </div>

      <div className="atelier-phones">
        <PhoneFrame label="Sign In">
          <SignInScreen />
        </PhoneFrame>
        <PhoneFrame label="Sessions">
          <SessionsScreen />
        </PhoneFrame>
        <PhoneFrame label="Conversation">
          <ChatScreen />
        </PhoneFrame>
      </div>
    </div>
  );
}
