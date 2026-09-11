/**
 * Inspiration / Moodboard — Lait Vert representative board.
 *
 * Architecture is ready for a future Canvas mode (view toggle hook,
 * InspirationItem span/aspect metadata). Canvas is NOT built here.
 *
 * Interactions implemented:
 *   - Masonry grid with span/aspect control
 *   - Tile click → focused viewer with contextual actions
 *   - Interpret (single tile) → structured 4-section panel
 *   - Explore as Scent → structured olfactive direction object
 *   - Multi-select → Interpret Selection → structured panel
 *   - Interpret Board → Board Reading designed object
 *   - + Add sheet (preview/read-only, no persistence)
 *   - Current Olfactive Direction continuity section
 *
 * Persistence: none. All actions are representative UI only.
 */

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type KeyboardEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams } from "wouter";
import { X, Plus, Sparkles, Check, ArrowRight, ChevronRight } from "lucide-react";
import { DEMO_PROJECTS } from "../data/projects";
import type { InspirationItem } from "../data/projects";

// ─── Lait Vert–specific interpretation data ───────────────────────────────────

const LAIT_VERT_BOARD_READING = {
  atmosphere: ["Cold", "Quiet", "Tactile", "Diffused", "Intimate"],
  visualTensions: [
    "Organic ↔ Architectural",
    "Wet ↔ Dry",
    "Transparent ↔ Creamy",
    "Botanical ↔ Mineral",
  ],
  olfactiveTerritories: [
    "Green vegetal",
    "Cold floral",
    "Mineral skin",
    "Milky transparency",
    "Pale woods",
  ],
  materialDirections: [
    "Violet Leaf Absolute",
    "Stemone",
    "Hedione HC",
    "Galbanum EO",
    "Ambrettolide",
    "Cashmeran",
    "Ambroxan",
  ],
  avoid: ["Bright citrus", "Sugared florals", "Heavy amber warmth", "Sweet iris"],
};

const LAIT_VERT_DIRECTION = {
  lines: [
    "Cold vegetal opening",
    "Translucent floral diffusion",
    "Mineral skin",
    "Pale dry woods",
  ],
};

// Per-item interpretation keyed by item id
const ITEM_INTERPRETATIONS: Record<
  string,
  {
    visualReading: string[];
    olfactiveTranslation: string[];
    materialPossibilities: string[];
    exploreAsScent: {
      character: string[];
      structure: string[];
      explore: string[];
    } | null;
  }
> = {
  "i-11": {
    visualReading: ["Saturated", "Wet", "Cold", "Metallic", "Vegetal"],
    olfactiveTranslation: [
      "Wet leaf",
      "Metallic green",
      "Cold ozonic",
      "Transparent",
    ],
    materialPossibilities: [
      "Violet Leaf Absolute",
      "Stemone",
      "Galbanum EO",
      "Floralozone",
    ],
    exploreAsScent: {
      character: ["Cold", "Vegetal", "Metallic", "Transparent"],
      structure: [
        "Wet green opening",
        "Ozonic floral diffusion",
        "Dry mineral finish",
      ],
      explore: [
        "Violet Leaf Absolute",
        "Stemone",
        "Hedione",
        "Floralozone",
      ],
    },
  },
  "i-11b": {
    visualReading: ["Architectural", "Restrained", "Non-literal", "Structural"],
    olfactiveTranslation: [
      "Mineral green",
      "Cold geometry",
      "Diffusive transparency",
    ],
    materialPossibilities: ["Stemone", "Iso E Super", "Cashmeran", "Ambroxan"],
    exploreAsScent: null,
  },
  "i-11c": {
    visualReading: ["Translucent", "Diffused", "Pale", "Warm", "Quiet"],
    olfactiveTranslation: [
      "Skin warmth",
      "Airy floral",
      "Transparent musk",
      "Soft powder",
    ],
    materialPossibilities: [
      "Hedione HC",
      "Habanolide",
      "Ambrettolide",
      "Cashmeran",
    ],
    exploreAsScent: {
      character: ["Translucent", "Warm", "Quiet", "Tactile"],
      structure: [
        "Diffusive floral opening",
        "Warm skin core",
        "Lingering musk",
      ],
      explore: ["Hedione HC", "Habanolide", "Ambrettolide", "Musks Blend"],
    },
  },
  "i-11d": {
    visualReading: ["Enclosed", "Humid", "Green", "Still", "After-presence"],
    olfactiveTranslation: [
      "Humid vegetal",
      "Soil under glass",
      "Fading flower",
      "Green mineral",
    ],
    materialPossibilities: [
      "Violet Leaf Absolute",
      "Galbanum EO",
      "Hedione HC",
      "Stemone",
    ],
    exploreAsScent: null,
  },
  "i-11e": {
    visualReading: ["Semi-opaque", "Organic", "Milky", "Dense", "Textured"],
    olfactiveTranslation: [
      "Milky musk",
      "Warm resin",
      "Skin-like opacity",
      "Soft woods",
    ],
    materialPossibilities: [
      "Cashmeran",
      "Ambrettolide",
      "Habanolide",
      "Cedarwood Atlas",
    ],
    exploreAsScent: {
      character: ["Milky", "Warm", "Organic", "Soft"],
      structure: [
        "Resinous opening",
        "Milky skin accord",
        "Pale wood drydown",
      ],
      explore: [
        "Cashmeran",
        "Ambrettolide",
        "Habanolide",
        "Lily of the Valley Base",
      ],
    },
  },
  "i-11f": {
    visualReading: ["Pale", "Tactile", "Close-woven", "Muted", "Restrained"],
    olfactiveTranslation: [
      "Clean linen",
      "Quiet musk",
      "Mineral skin",
      "Transparent warmth",
    ],
    materialPossibilities: [
      "Ambrettolide",
      "Ambroxan",
      "Habanolide",
      "Floralozone",
    ],
    exploreAsScent: null,
  },
  "i-11g": {
    visualReading: ["Mineral", "Cold", "Structural", "Grey", "Hard"],
    olfactiveTranslation: [
      "Mineral dryness",
      "Cold stone",
      "Abstract woods",
      "Ozonic undertone",
    ],
    materialPossibilities: [
      "Stemone",
      "Iso E Super",
      "Cashmeran",
      "Ambroxan",
    ],
    exploreAsScent: {
      character: ["Mineral", "Cold", "Structural", "Abstract"],
      structure: [
        "Ozonic mineral opening",
        "Dry wood accord",
        "Cool ambergris skin",
      ],
      explore: ["Stemone", "Iso E Super", "Cashmeran", "Ambroxan"],
    },
  },
  "i-11h": {
    visualReading: ["Cold", "Luminous", "Transparent", "Botanical", "Fragile"],
    olfactiveTranslation: [
      "Cold light",
      "Transparent green",
      "Airy floral",
      "Morning dew",
    ],
    materialPossibilities: [
      "Violet Leaf Absolute",
      "Floralozone",
      "Hedione HC",
      "Stemone",
    ],
    exploreAsScent: null,
  },
  "i-11i": {
    visualReading: ["Refined", "Pale", "Structural", "Quiet", "Linear"],
    olfactiveTranslation: [
      "Clean restraint",
      "Aldehyidic warmth",
      "Quiet florals",
      "Tailored skin",
    ],
    materialPossibilities: [
      "Hedione HC",
      "Ambrettolide",
      "Cashmeran",
      "Habanolide",
    ],
    exploreAsScent: null,
  },
  "i-11j": {
    visualReading: ["Fragile", "Powdery", "Close", "Organic", "Pale"],
    olfactiveTranslation: [
      "Soft powder",
      "Cool iris facet",
      "Orris accord",
      "Skin musk",
    ],
    materialPossibilities: ["Orris Concrete", "Irone Alpha", "Ambrettolide", "Hedione HC"],
    exploreAsScent: null,
  },
  "i-11k": {
    visualReading: [
      "Translucent",
      "Cold",
      "Mineral",
      "Diffused",
      "Pale green",
      "Fragile",
    ],
    olfactiveTranslation: [
      "Wet vegetal",
      "Airy floral",
      "Mineral",
      "Transparent musk",
      "Cold woods",
    ],
    materialPossibilities: [
      "Violet Leaf Absolute",
      "Stemone",
      "Hedione",
      "Floralozone",
      "Ambroxan",
      "Habanolide",
    ],
    exploreAsScent: {
      character: ["Cold", "Vegetal", "Mineral", "Transparent"],
      structure: [
        "Green opening",
        "Diffusive floral core",
        "Dry mineral skin",
      ],
      explore: [
        "Violet Leaf Absolute",
        "Stemone",
        "Hedione",
        "Ambroxan",
        "Habanolide",
      ],
    },
  },
  "i-12": {
    visualReading: ["Precise", "Plant-forward", "Cold", "Structural"],
    olfactiveTranslation: [
      "Metallic green",
      "Wet foliage",
      "Ozonic edge",
      "Non-sweet",
    ],
    materialPossibilities: [
      "Violet Leaf Absolute",
      "Galbanum EO",
      "Stemone",
      "Floralozone",
    ],
    exploreAsScent: null,
  },
};

const MULTI_SELECT_READING = {
  atmosphere: ["Cold", "Restrained", "Tactile", "Diffused"],
  tensions: [
    "Organic ↔ Architectural",
    "Wet ↔ Dry",
    "Soft ↔ Mineral",
    "Transparent ↔ Creamy",
  ],
  olfactiveTranslation: [
    "Green vegetal",
    "Cold floral",
    "Skin musk",
    "Mineral woods",
  ],
  materialTerritories: [
    "Violet Leaf Absolute",
    "Stemone",
    "Hedione",
    "Ambrettolide",
    "Cashmeran",
    "Ambroxan",
  ],
};

// ─── Primitive helpers ────────────────────────────────────────────────────────

type ViewMode = "moodboard"; // | "canvas" — future

// Trap focus inside a dialog element
function useFocusTrap(ref: React.RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [active, ref]);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block border border-border px-2 py-0.5 font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground">
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono-ui text-[8px] uppercase tracking-[.24em] text-muted-foreground mb-2">
      {children}
    </p>
  );
}

function TagRow({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <Chip key={t}>{t}</Chip>
      ))}
    </div>
  );
}

function ReadOnlyBadge() {
  return (
    <span className="font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground/40">
      Preview · read-only
    </span>
  );
}

// ─── + Add sheet ─────────────────────────────────────────────────────────────

const ADD_OPTIONS = [
  { label: "Upload image", key: "image" },
  { label: "Upload video", key: "video" },
  { label: "Add text", key: "text" },
  { label: "Add link", key: "link" },
  { label: "Add material", key: "material" },
];

function AddSheet({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true);

  // Esc to close
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Add to board"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
      <motion.div
        ref={ref}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm border border-border bg-card mx-4 mb-4 sm:mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground">
            Add to board
          </p>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-foreground"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div className="py-1">
          {ADD_OPTIONS.map(({ label, key }) => (
            <button
              key={key}
              type="button"
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-secondary/30 focus-visible:outline-none focus-visible:bg-secondary/30"
              onClick={onClose}
              data-testid={`button-add-${key}`}
            >
              <span className="text-sm text-foreground/80">{label}</span>
              <ReadOnlyBadge />
            </button>
          ))}
        </div>
        <div className="border-t border-border px-5 py-4">
          <p className="font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground/40 leading-5">
            This board is representative · changes do not persist
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Single-item interpretation panel ────────────────────────────────────────

function InterpretPanel({
  item,
  onClose,
}: {
  item: InspirationItem;
  onClose: () => void;
}) {
  const interp = ITEM_INTERPRETATIONS[item.id];
  const [showScent, setShowScent] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const fallback = {
    visualReading: ["Restrained", "Tactile", "Cold"],
    olfactiveTranslation: ["Green vegetal", "Cold floral", "Mineral skin"],
    materialPossibilities: ["Violet Leaf Absolute", "Stemone", "Hedione HC"],
    exploreAsScent: null,
  };
  const data = interp ?? fallback;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Interpret reference"
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
      <motion.div
        ref={ref}
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-lg border border-border bg-card mx-4 mb-4 sm:mb-0 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-4 z-10">
          <div>
            <p className="font-mono-ui text-[8px] uppercase tracking-[.22em] text-muted-foreground">
              Possible translations
            </p>
            {(item.caption ?? item.body) && (
              <p className="mt-0.5 text-sm text-foreground/60 truncate max-w-xs">
                {item.caption ?? (item.body ? item.body.slice(0, 48) + "…" : "")}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-foreground"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          {/* Visual Reading */}
          <div>
            <SectionLabel>Visual reading</SectionLabel>
            <TagRow items={data.visualReading} />
          </div>

          {/* Olfactive Translation */}
          <div>
            <SectionLabel>Olfactive translation</SectionLabel>
            <TagRow items={data.olfactiveTranslation} />
          </div>

          {/* Material Possibilities */}
          <div>
            <SectionLabel>Material possibilities</SectionLabel>
            <div className="space-y-1.5">
              {data.materialPossibilities.map((m) => (
                <Link
                  key={m}
                  href={`/materials?search=${encodeURIComponent(m)}`}
                  className="flex items-center justify-between py-1 text-sm text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-foreground group"
                  data-testid={`link-interp-material-${m.replace(/\s/g, "-").toLowerCase()}`}
                >
                  <span>{m}</span>
                  <ChevronRight
                    size={10}
                    className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors"
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Explore as Scent */}
          {data.exploreAsScent && !showScent && (
            <div className="border-t border-border pt-5">
              <button
                type="button"
                onClick={() => setShowScent(true)}
                className="flex w-full items-center justify-between text-left group"
                data-testid="button-explore-as-scent"
              >
                <span className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-foreground/60 group-hover:text-foreground transition-colors">
                  Explore as scent →
                </span>
              </button>
            </div>
          )}

          {data.exploreAsScent && showScent && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-border pt-5 space-y-4"
            >
              <div>
                <SectionLabel>Character</SectionLabel>
                <TagRow items={data.exploreAsScent.character} />
              </div>
              <div>
                <SectionLabel>Structure</SectionLabel>
                <div className="space-y-1">
                  {data.exploreAsScent.structure.map((s, i) => (
                    <p key={i} className="text-sm text-foreground/70 leading-6">{s}</p>
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel>Explore</SectionLabel>
                <TagRow items={data.exploreAsScent.explore} />
              </div>
              {/* Actions */}
              <div className="border-t border-border pt-4 flex flex-wrap items-center gap-4">
                <span className="text-sm text-muted-foreground/50 flex items-center gap-2">
                  Save as olfactive direction
                  <ReadOnlyBadge />
                </span>
                <Link
                  href="/materials"
                  className="text-sm text-foreground underline-offset-4 hover:underline transition-colors focus-visible:outline-none focus-visible:underline"
                  data-testid="link-scent-explore-materials"
                >
                  Explore materials →
                </Link>
              </div>
              <p className="font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground/40 leading-5">
                Possible direction only · the perfumer remains the author
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 border-t border-border bg-card px-5 py-4 flex flex-wrap gap-3 items-center">
          <span className="text-sm text-muted-foreground/40 flex items-center gap-2 mr-auto">
            Add note <ReadOnlyBadge />
          </span>
          <span className="text-sm text-muted-foreground/40 flex items-center gap-2">
            Connect material <ReadOnlyBadge />
          </span>
          <span className="text-sm text-muted-foreground/40 flex items-center gap-2">
            Use as direction <ReadOnlyBadge />
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Focused viewer ───────────────────────────────────────────────────────────

function FocusedViewer({
  item,
  onClose,
  onInterpret,
}: {
  item: InspirationItem;
  onClose: () => void;
  onInterpret: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`View: ${item.caption ?? item.materialName ?? "reference"}`}
    >
      <div className="absolute inset-0 bg-background/92 backdrop-blur-sm" />
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col max-w-3xl w-full mx-4 max-h-[92vh] overflow-hidden border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image fill */}
        {item.type === "image" && item.src && (
          <div className="flex-1 overflow-hidden min-h-0">
            <img
              src={item.src}
              alt={item.caption ?? ""}
              className="w-full h-full object-cover"
              style={{ maxHeight: "60vh" }}
            />
          </div>
        )}

        {/* Text/quote fill */}
        {(item.type === "text" || item.type === "quote" || item.type === "note") && (
          <div className="flex-1 flex items-center justify-center p-10 min-h-[24vh]">
            <blockquote className="font-display text-2xl sm:text-3xl leading-snug text-center max-w-md">
              {item.body}
            </blockquote>
          </div>
        )}

        {/* Material fill */}
        {item.type === "material" && (
          <div className="flex-1 flex flex-col justify-center px-8 py-10 min-h-[20vh]">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.22em] text-muted-foreground mb-3">
              Material reference
            </p>
            <p className="font-display text-3xl">{item.materialName}</p>
            {item.materialSubtitle && (
              <p className="mt-2 font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">
                {item.materialSubtitle}
              </p>
            )}
            {item.body && (
              <p className="mt-4 text-sm leading-6 text-foreground/70 max-w-sm">
                {item.body}
              </p>
            )}
          </div>
        )}

        {/* Controls bar */}
        <div className="border-t border-border px-5 py-4 flex items-center gap-3 flex-wrap bg-card">
          {item.caption && (
            <p className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/60 flex-1 min-w-0 truncate">
              {item.caption}
            </p>
          )}
          <div className="flex items-center gap-3 ml-auto shrink-0">
            <button
              onClick={() => { onClose(); onInterpret(); }}
              className="inline-flex items-center gap-1.5 font-mono-ui text-[8px] uppercase tracking-[.2em] text-foreground border border-border px-3 py-2 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:bg-secondary"
              data-testid="button-viewer-interpret"
            >
              <Sparkles size={10} /> Interpret
            </button>
            {item.type === "material" && item.materialName && (
              <Link
                href={`/materials?search=${encodeURIComponent(item.materialName)}`}
                className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-foreground"
                data-testid="link-viewer-to-material"
              >
                Search library →
              </Link>
            )}
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-foreground"
              aria-label="Close viewer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Multi-select interpret panel ─────────────────────────────────────────────

function MultiInterpretPanel({
  count,
  onClose,
}: {
  count: number;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true);
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Interpret selection"
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
      <motion.div
        ref={ref}
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-lg border border-border bg-card mx-4 mb-4 sm:mb-0 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-4 z-10">
          <div>
            <p className="font-mono-ui text-[8px] uppercase tracking-[.22em] text-muted-foreground">
              Interpret selection
            </p>
            <p className="mt-0.5 font-mono-ui text-[7px] text-muted-foreground/60">
              {count} references selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-5 py-5 space-y-6">
          <div>
            <SectionLabel>Shared atmosphere</SectionLabel>
            <TagRow items={MULTI_SELECT_READING.atmosphere} />
          </div>
          <div>
            <SectionLabel>Creative tensions</SectionLabel>
            <div className="space-y-1.5">
              {MULTI_SELECT_READING.tensions.map((t) => (
                <p key={t} className="text-sm text-foreground/70 italic">{t}</p>
              ))}
            </div>
          </div>
          <div>
            <SectionLabel>Olfactive translation</SectionLabel>
            <TagRow items={MULTI_SELECT_READING.olfactiveTranslation} />
          </div>
          <div>
            <SectionLabel>Material territories</SectionLabel>
            <div className="space-y-1.5">
              {MULTI_SELECT_READING.materialTerritories.map((m) => (
                <Link
                  key={m}
                  href={`/materials?search=${encodeURIComponent(m)}`}
                  className="flex items-center justify-between py-1 text-sm text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none group"
                >
                  <span>{m}</span>
                  <ChevronRight size={10} className="text-muted-foreground/30 group-hover:text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <p className="font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground/40 leading-5">
              Relational reading of selected references · interpretive only · the perfumer remains the author
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Board Reading panel ──────────────────────────────────────────────────────

function BoardReadingPanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true);
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const br = LAIT_VERT_BOARD_READING;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Board reading"
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
      <motion.div
        ref={ref}
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-xl border border-border bg-card mx-4 mb-4 sm:mb-0 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-4 z-10">
          <p className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-muted-foreground">
            Board reading
          </p>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-6 space-y-6">
          {/* Atmosphere */}
          <div>
            <SectionLabel>Atmosphere</SectionLabel>
            <TagRow items={br.atmosphere} />
          </div>

          {/* Visual Tensions */}
          <div>
            <SectionLabel>Visual tensions</SectionLabel>
            <div className="space-y-1.5">
              {br.visualTensions.map((t) => (
                <p key={t} className="text-sm text-foreground/70 italic">{t}</p>
              ))}
            </div>
          </div>

          {/* Olfactive Territories */}
          <div>
            <SectionLabel>Olfactive territories</SectionLabel>
            <TagRow items={br.olfactiveTerritories} />
          </div>

          {/* Material Directions */}
          <div>
            <SectionLabel>Material directions</SectionLabel>
            <div className="space-y-1.5">
              {br.materialDirections.map((m) => (
                <Link
                  key={m}
                  href={`/materials?search=${encodeURIComponent(m)}`}
                  className="flex items-center justify-between py-1 text-sm text-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none group"
                >
                  <span>{m}</span>
                  <ChevronRight size={10} className="text-muted-foreground/30 group-hover:text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>

          {/* Avoid */}
          <div>
            <SectionLabel>Avoid</SectionLabel>
            <div className="space-y-1">
              {br.avoid.map((a) => (
                <p key={a} className="text-sm text-muted-foreground/60 line-through decoration-muted-foreground/30">
                  {a}
                </p>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-border pt-5 space-y-3">
            {/* Save — read-only */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/60">Save as olfactive direction</span>
              <ReadOnlyBadge />
            </div>
            {/* Explore — functional */}
            <Link
              href="/materials"
              onClick={onClose}
              className="flex items-center gap-2 text-sm text-foreground hover:underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:underline"
              data-testid="link-board-explore-materials"
            >
              Explore materials <ArrowRight size={11} />
            </Link>
            {/* Refine — read-only */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/60">Refine interpretation</span>
              <ReadOnlyBadge />
            </div>
          </div>

          <p className="font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground/40 leading-5">
            Board-level reading · derived from representative board content · interpretive only
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Masonry tile ─────────────────────────────────────────────────────────────

function MasonryTile({
  item,
  selected,
  selectMode,
  onToggleSelect,
  onOpen,
}: {
  item: InspirationItem;
  selected: boolean;
  selectMode: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (item: InspirationItem) => void;
}) {
  const handleClick = useCallback(() => {
    if (selectMode) {
      onToggleSelect(item.id);
    } else {
      onOpen(item);
    }
  }, [selectMode, item, onToggleSelect, onOpen]);

  const handleKey = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  // Aspect ratio classes — give visual rhythm
  const aspectClass =
    item.aspect === "portrait"
      ? "aspect-[3/4]"
      : item.aspect === "landscape"
      ? "aspect-[4/3]"
      : item.aspect === "panoramic"
      ? "aspect-[16/7]"
      : item.aspect === "tall"
      ? "aspect-[2/3]"
      : "aspect-square"; // square or default for non-image

  const isText = item.type === "text" || item.type === "quote" || item.type === "note";
  const isMaterial = item.type === "material";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onClick={handleClick}
      onKeyDown={handleKey}
      tabIndex={0}
      role="button"
      aria-pressed={selected}
      aria-label={item.caption ?? item.materialName ?? item.body?.slice(0, 40) ?? "Reference"}
      data-testid={`tile-${item.id}`}
      className={[
        "group relative cursor-pointer overflow-hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40",
        "transition-opacity duration-150",
        selected ? "opacity-90" : "hover:opacity-95",
      ].join(" ")}
    >
      {/* Image tile */}
      {item.type === "image" && item.src && (
        <div className={`relative overflow-hidden ${aspectClass}`}>
          <img
            src={item.src}
            alt={item.caption ?? ""}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {/* Caption on hover — bottom overlay */}
          {item.caption && (
            <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 bg-foreground/80 px-3 py-2">
              <p className="font-mono-ui text-[7px] uppercase tracking-[.16em] text-white/80 truncate">
                {item.caption}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Text tile */}
      {isText && (
        <div className="flex h-full min-h-[120px] flex-col justify-center bg-secondary/30 px-5 py-6 border border-border/50">
          {item.tag && (
            <p className="mb-3 font-mono-ui text-[7px] uppercase tracking-[.2em] text-muted-foreground/60">
              {item.tag}
            </p>
          )}
          <blockquote className="font-display text-lg sm:text-xl leading-snug text-foreground">
            {item.body}
          </blockquote>
        </div>
      )}

      {/* Material tile */}
      {isMaterial && (
        <div className="flex h-full min-h-[120px] flex-col justify-between border border-border bg-card px-5 py-5">
          <div>
            <p className="font-mono-ui text-[7px] uppercase tracking-[.2em] text-muted-foreground/60 mb-2">
              Material reference
            </p>
            <p className="font-display text-xl leading-tight">{item.materialName}</p>
            {item.materialSubtitle && (
              <p className="mt-1.5 font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">
                {item.materialSubtitle}
              </p>
            )}
          </div>
          {item.body && (
            <p className="mt-3 text-xs leading-5 text-muted-foreground line-clamp-3">
              {item.body}
            </p>
          )}
        </div>
      )}

      {/* Select overlay */}
      <AnimatePresence>
        {selectMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute top-2 left-2"
          >
            <div
              className={[
                "flex h-5 w-5 items-center justify-center border transition-colors",
                selected
                  ? "border-foreground bg-foreground"
                  : "border-white/60 bg-background/60",
              ].join(" ")}
            >
              {selected && <Check size={10} className="text-background" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Masonry grid ─────────────────────────────────────────────────────────────

/**
 * CSS Masonry layout using column-count approach.
 * Items with span="wide" or span="full" are placed as full-width breaks
 * before/after them. This is a pragmatic approach that avoids JS height
 * calculation while keeping reasonable visual rhythm.
 */
function MasonryGrid({
  items,
  selectedIds,
  selectMode,
  onToggleSelect,
  onOpen,
}: {
  items: InspirationItem[];
  selectedIds: Set<string>;
  selectMode: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (item: InspirationItem) => void;
}) {
  return (
    <div
      className="w-full"
      style={{
        columnCount: undefined, // handled by responsive classes below
      }}
    >
      {/*
        Two-column masonry on mobile, three on ≥768px, four on ≥1280px.
        "full"/"wide" span items break out to span all columns.
      */}
      <div
        className="gap-2 sm:gap-3"
        style={{
          columnCount: 2,
          columnGap: "0.5rem",
        }}
      >
        <style>{`
          @media (min-width: 768px) { .masonry-grid { column-count: 3; column-gap: 0.75rem; } }
          @media (min-width: 1280px) { .masonry-grid { column-count: 4; column-gap: 0.75rem; } }
        `}</style>
        <div className="masonry-grid" style={{ columnCount: 2, columnGap: "0.5rem" }}>
          {items.map((item) => {
            const isFull = item.span === "full";
            const isWide = item.span === "wide";
            if (isFull || isWide) {
              return (
                <div
                  key={item.id}
                  style={{ columnSpan: "all", breakInside: "avoid", marginBottom: "0.5rem" }}
                >
                  <MasonryTile
                    item={item}
                    selected={selectedIds.has(item.id)}
                    selectMode={selectMode}
                    onToggleSelect={onToggleSelect}
                    onOpen={onOpen}
                  />
                </div>
              );
            }
            return (
              <div
                key={item.id}
                style={{ breakInside: "avoid", marginBottom: "0.5rem" }}
              >
                <MasonryTile
                  item={item}
                  selected={selectedIds.has(item.id)}
                  selectMode={selectMode}
                  onToggleSelect={onToggleSelect}
                  onOpen={onOpen}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Project tab nav (compact, consistent with ProjectWorkspace) ──────────────

const TABS = [
  { id: "overview", label: "Overview", href: (id: string) => `/projects/${id}` },
  { id: "inspiration", label: "Inspiration", href: (id: string) => `/projects/${id}/inspiration` },
  { id: "notes", label: "Notes", href: (id: string) => `/projects/${id}` },
  { id: "materials", label: "Materials", href: (id: string) => `/projects/${id}` },
  { id: "formulas", label: "Mods", href: (id: string) => `/projects/${id}` },
  { id: "evaluation", label: "Evaluation", href: (id: string) => `/projects/${id}` },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Inspiration() {
  const params = useParams<{ id: string }>();
  const project = DEMO_PROJECTS.find((p) => p.id === params.id);

  // View mode — moodboard only for now; canvas is future
  const [_viewMode] = useState<ViewMode>("moodboard");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectMode = selectedIds.size > 0;
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const clearSelect = useCallback(() => setSelectedIds(new Set()), []);

  // Viewer + interpret
  const [viewedItem, setViewedItem] = useState<InspirationItem | null>(null);
  const [interpretItem, setInterpretItem] = useState<InspirationItem | null>(null);

  // Panels
  const [showAdd, setShowAdd] = useState(false);
  const [showMultiInterpret, setShowMultiInterpret] = useState(false);
  const [showBoardReading, setShowBoardReading] = useState(false);

  const openViewer = useCallback((item: InspirationItem) => {
    setViewedItem(item);
  }, []);

  const openInterpret = useCallback((item: InspirationItem) => {
    setInterpretItem(item);
  }, []);

  if (!project) {
    return (
      <div className="py-20 text-center">
        <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground mb-4">
          Project not found
        </p>
        <Link
          href="/projects"
          className="font-mono-ui text-[9px] uppercase tracking-widest underline-offset-4 hover:underline"
          data-testid="link-back-projects"
        >
          ← Back to projects
        </Link>
      </div>
    );
  }

  const board = project.inspiration;

  return (
    <>
      <div className="animate-fade-in overflow-x-hidden">

        {/* ── Compact project header ──────────────────────────────── */}
        <header className="pt-6 pb-0">
          {/* Breadcrumb row */}
          <div className="flex items-center gap-2 mb-3">
            <Link
              href="/projects"
              data-testid="link-breadcrumb-projects"
              className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-foreground"
            >
              Projects
            </Link>
            <span className="text-muted-foreground/30 text-xs">/</span>
            <Link
              href={`/projects/${project.id}`}
              data-testid="link-breadcrumb-project"
              className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-foreground"
            >
              {project.name}
            </Link>
          </div>

          {/* Title row */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="font-mono-ui text-[8px] uppercase tracking-[.24em] text-muted-foreground">
                {project.name}
              </p>
              <h1
                className="mt-1.5 font-display text-4xl sm:text-5xl tracking-[-0.03em] leading-[.88]"
                data-testid="heading-inspiration"
              >
                Inspiration
              </h1>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-3 flex-wrap self-start mt-2 sm:mt-0 sm:self-auto">
              {/* Interpret Board */}
              <button
                onClick={() => setShowBoardReading(true)}
                data-testid="button-interpret-board"
                className="inline-flex items-center gap-1.5 font-mono-ui text-[8px] uppercase tracking-[.18em] text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-2 focus-visible:outline-none focus-visible:text-foreground"
              >
                <Sparkles size={9} />
                Interpret board
              </button>
              {/* + Add */}
              <button
                onClick={() => setShowAdd(true)}
                data-testid="button-add-to-board"
                className="inline-flex items-center gap-1.5 border border-border px-3 py-2 font-mono-ui text-[8px] uppercase tracking-[.18em] text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-foreground"
                aria-label="Add to board"
              >
                <Plus size={10} />
                Add
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex overflow-x-auto mt-5 border-b border-border" data-testid="project-tabs">
            {TABS.map((tab) => {
              const active = tab.id === "inspiration";
              return (
                <Link
                  key={tab.id}
                  href={tab.href(project.id)}
                  data-testid={`tab-${tab.id}`}
                  className={[
                    "relative shrink-0 px-4 py-3",
                    "font-mono-ui text-[9px] uppercase tracking-[.14em]",
                    "transition-colors focus-visible:outline-none",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {tab.label}
                  {active && (
                    <span className="absolute inset-x-0 bottom-0 h-[2px] bg-foreground" />
                  )}
                </Link>
              );
            })}
          </div>
        </header>

        {/* ── Selection toolbar ───────────────────────────────────── */}
        <AnimatePresence>
          {selectMode && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur-sm px-0 py-3"
            >
              <p className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-foreground/70">
                {selectedIds.size} selected
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowMultiInterpret(true)}
                  data-testid="button-interpret-selection"
                  className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 font-mono-ui text-[8px] uppercase tracking-[.18em] text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:bg-secondary"
                >
                  <Sparkles size={9} />
                  Interpret selection
                </button>
                <button
                  onClick={clearSelect}
                  className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-foreground"
                  data-testid="button-clear-selection"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Multi-select hint ───────────────────────────────────── */}
        {!selectMode && (
          <div className="mt-4 mb-1 flex items-center justify-between">
            <p className="font-mono-ui text-[7px] uppercase tracking-[.18em] text-muted-foreground/40">
              {board.length} references · tap to view · tap + hold or select multiple to interpret together
            </p>
          </div>
        )}

        {/* ── Board ───────────────────────────────────────────────── */}
        <div className="mt-3">
          {board.length === 0 ? (
            <div className="border border-dashed border-border py-20 text-center mt-6">
              <p className="font-display text-2xl text-muted-foreground/40">
                The board is empty.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Add images, text, materials and references to build the visual world of this fragrance.
              </p>
            </div>
          ) : (
            <MasonryGrid
              items={board}
              selectedIds={selectedIds}
              selectMode={selectMode}
              onToggleSelect={toggleSelect}
              onOpen={openViewer}
            />
          )}
        </div>

        {/* ── Current Olfactive Direction ─────────────────────────── */}
        <section className="mt-12 border-t border-border pt-8 pb-12" data-testid="section-olfactive-direction">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
            <div>
              <p className="font-mono-ui text-[8px] uppercase tracking-[.28em] text-muted-foreground">
                Current olfactive direction
              </p>
              <p className="mt-0.5 font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground/40">
                Representative · derived from this board
              </p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href="/materials"
                className="font-mono-ui text-[8px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline transition-colors focus-visible:outline-none focus-visible:underline"
                data-testid="link-direction-explore-materials"
              >
                Explore materials →
              </Link>
              <Link
                href="/formulas/new"
                className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-foreground"
                data-testid="link-direction-formula-lab"
              >
                Formula lab →
              </Link>
            </div>
          </div>

          <div className="space-y-2 max-w-lg">
            {LAIT_VERT_DIRECTION.lines.map((line, i) => (
              <p
                key={i}
                className={[
                  "font-display leading-snug",
                  i === 0 ? "text-2xl sm:text-3xl text-foreground" : "text-xl sm:text-2xl text-foreground/60",
                ].join(" ")}
              >
                {line}
              </p>
            ))}
          </div>

          <p className="mt-6 font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground/30 leading-5">
            This direction is representative and read-only. When Project persistence exists, board interpretations will be saved here and flow into Materials and Formula Lab.
          </p>
        </section>

      </div>

      {/* ── Overlays (portaled above page) ─────────────────────────── */}
      <AnimatePresence>
        {viewedItem && (
          <FocusedViewer
            key="viewer"
            item={viewedItem}
            onClose={() => setViewedItem(null)}
            onInterpret={() => openInterpret(viewedItem)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {interpretItem && (
          <InterpretPanel
            key="interpret"
            item={interpretItem}
            onClose={() => setInterpretItem(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && (
          <AddSheet key="add-sheet" onClose={() => setShowAdd(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMultiInterpret && (
          <MultiInterpretPanel
            key="multi-interpret"
            count={selectedIds.size}
            onClose={() => { setShowMultiInterpret(false); clearSelect(); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBoardReading && (
          <BoardReadingPanel
            key="board-reading"
            onClose={() => setShowBoardReading(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
