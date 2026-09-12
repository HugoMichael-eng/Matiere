/**
 * /example — Public read-only demonstration moodboard
 * "Animal in the Mirror" — curated example workspace, no auth required.
 *
 * Interactions:
 * - Select a reference image to highlight linked descriptors and materials
 * - Select a material to expand why it relates
 * - Switch between two curated scent-direction iterations
 * - Inspect example notes
 * Never implies live AI generation. Invites signup after exploration.
 * Never exposes real user projects or API data.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ArrowLeft, ChevronDown, Play } from "lucide-react";

const BASE = import.meta.env.BASE_URL + "images/";

// ─── Curated Example Data ─────────────────────────────────────────────────────
// All content is representative, labeled as example, not tied to any user account.

interface ExampleRef {
  id: string;
  type: "image" | "video" | "note" | "quote";
  src?: string;
  caption: string;
  descriptors: string[];
  linkedMaterials: string[];
}

interface ExampleMaterial {
  id: string;
  name: string;
  role: string;
  family: string;
  linkedRefs: string[];
  why: string;
  olfactiveCharacter: string;
}

interface ScentDirection {
  id: string;
  label: string;
  description: string;
  accord: string;
  materials: string[];
  change?: string;
}

const EXAMPLE_REFS: ExampleRef[] = [
  {
    id: "ref-01",
    type: "image",
    src: BASE + "animal-mirror-01.jpg",
    caption: "Lacquer reflection — controlled, intimate, slightly uncanny",
    descriptors: ["intimate", "reflective", "lacquer", "uncanny"],
    linkedMaterials: ["mat-01", "mat-02"],
  },
  {
    id: "ref-02",
    type: "image",
    src: BASE + "petals.jpg",
    caption: "White powder texture — fragile, cosmetic, human",
    descriptors: ["soft", "powder", "intimate", "pale"],
    linkedMaterials: ["mat-01", "mat-03"],
  },
  {
    id: "ref-03",
    type: "image",
    src: BASE + "human-skin-01.jpg",
    caption: "Warm skin — alive, tactile, present",
    descriptors: ["warm", "skin", "alive", "close"],
    linkedMaterials: ["mat-02", "mat-04"],
  },
  {
    id: "ref-04",
    type: "image",
    src: BASE + "texture.jpg",
    caption: "Mineral surface — opaque, aged, structural",
    descriptors: ["mineral", "aged", "textured", "dry"],
    linkedMaterials: ["mat-04", "mat-05"],
  },
  {
    id: "ref-05",
    type: "video",
    caption: "Movement study — a slow turn in low light",
    descriptors: ["movement", "shadow", "intimate", "animal"],
    linkedMaterials: ["mat-02", "mat-05"],
  },
  {
    id: "ref-06",
    type: "note",
    caption: "Studio note — the brief",
    descriptors: ["concept", "direction"],
    linkedMaterials: [],
  },
];

const EXAMPLE_MATERIALS: ExampleMaterial[] = [
  {
    id: "mat-01",
    name: "Irone Alpha",
    role: "Primary · Floral",
    family: "Iris",
    linkedRefs: ["ref-01", "ref-02"],
    why: "The most complex iris material — cold violet with a slightly woody facet. At low doses it reads as skin rather than flower. This is the 'mirror' itself: precise, cool, familiar yet strange.",
    olfactiveCharacter: "Cold violet · slightly woody · intimate at low dose",
  },
  {
    id: "mat-02",
    name: "Orris Concrete",
    role: "Heart · Powdery",
    family: "Iris / Powder",
    linkedRefs: ["ref-01", "ref-03", "ref-05"],
    why: "Heavier and earthier than irone — the human texture beneath the iris. Where irone is the reflection, orris concrete is the warmth the mirror does not show. The powder quality reads as skin memory.",
    olfactiveCharacter: "Earthy powder · warm · soft violet · carrot-like",
  },
  {
    id: "mat-03",
    name: "Ethylene Brassylate",
    role: "Base · Musk",
    family: "Musks",
    linkedRefs: ["ref-02"],
    why: "A large-ring musk with an almost sweet-skin quality — it holds the composition against skin without sweetening it. The invisible surface on which everything rests.",
    olfactiveCharacter: "Clean · skin-close · soft · slightly sweet",
  },
  {
    id: "mat-04",
    name: "Civet Synthetic",
    role: "Trace · Animalic",
    family: "Animalic",
    linkedRefs: ["ref-03", "ref-04"],
    why: "The 'animal' in the title. Used at trace levels — enough to create friction, to introduce the uncanny quality the brief requires. Too much becomes literal; too little disappears. The right level makes you look twice.",
    olfactiveCharacter: "Warm · animalic · intimate · slightly leathery",
  },
  {
    id: "mat-05",
    name: "Ambroxan",
    role: "Base · Mineral",
    family: "Woody Amber",
    linkedRefs: ["ref-04", "ref-05"],
    why: "Skin-scent material. Mineral, slightly woody, warm. At 1.5% it gives the base its lived-in quality — the sense that this fragrance was already present when you arrived.",
    olfactiveCharacter: "Mineral · warm woody · skin-like · diffusive",
  },
];

const SCENT_DIRECTIONS: ScentDirection[] = [
  {
    id: "dir-01",
    label: "MOD 05 — The Beautiful Animal",
    description: "Pure iris opening, powder accord in the heart, musk foundation in the base. Clean and intentional.",
    accord: "Iris · Powder · White Musk",
    materials: ["Irone Alpha", "Orris Concrete", "Ethylene Brassylate", "Musks Blend"],
    change: undefined,
  },
  {
    id: "dir-02",
    label: "MOD 06 — With Friction",
    description: "Civet synthetic introduced at trace — enough friction to create the uncanny edge the brief requires. Ambroxan replaces one musk to push the skin effect further.",
    accord: "Iris · Powder · Animalic trace · Mineral skin",
    materials: ["Irone Alpha", "Orris Concrete", "Ethylene Brassylate", "Civet Synthetic", "Ambroxan"],
    change: "Added civet synthetic (trace), replaced Musks Blend with Ambroxan. The powder remains but now has depth and friction.",
  },
];

const EXAMPLE_NOTES = [
  {
    id: "note-01",
    date: "2024-12-18",
    tag: "direction",
    body: "The iris accord is too clean. The brief calls for something slightly uncanny — beautiful but with an animal edge that makes you look twice.",
  },
  {
    id: "note-02",
    date: "2024-11-30",
    tag: "evaluation",
    body: "Keep the skin effect but remove cosmetic softness. The difference is important: skin feels human, cosmetic softness feels manufactured.",
  },
  {
    id: "note-03",
    date: "2024-10-14",
    tag: "brief",
    body: "Your own skin, unrecognised. The brief is not a floral. It is not a perfume you wear — it is a reflection you do not quite recognise.",
  },
];

const AI_QUALITIES = [
  "Intimate closeness at a slight remove",
  "The powder of something cosmetic that has turned human",
  "Warmth without sweetness",
  "The texture of lacquer — smooth, reflective, slightly uncanny",
  "Animal presence held at the threshold of recognition",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExampleBadge() {
  return (
    <div className="inline-flex items-center gap-2 border border-accent/40 bg-accent/8 px-3 py-1.5">
      <span className="inline-block h-1.5 w-1.5 bg-accent shrink-0" aria-hidden />
      <span className="font-mono-ui text-[11px] uppercase tracking-[.22em] text-accent-foreground">
        Curated example — representative content
      </span>
    </div>
  );
}

function WorkflowSteps() {
  const steps = [
    { n: "01", label: "Collect references" },
    { n: "02", label: "Explore scent directions" },
    { n: "03", label: "Select materials" },
    { n: "04", label: "Develop and refine" },
  ];
  return (
    <div className="flex flex-wrap gap-0" role="list" aria-label="Creative workflow">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-0" role="listitem">
          <div className="flex items-center gap-2 px-4 py-2.5 border border-border bg-background first:border-l">
            <span className="font-mono-ui text-[10px] text-muted-foreground/50">{s.n}</span>
            <span className="font-mono-ui text-[12px] uppercase tracking-[.16em] text-foreground/70">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight size={11} strokeWidth={1.5} className="text-border mx-1 shrink-0" aria-hidden />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PublicExample() {
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [activeDirection, setActiveDirection] = useState<string>("dir-01");
  const [notesOpen, setNotesOpen] = useState(false);
  const [expandedNote, setExpandedNote] = useState<string | null>("note-01");

  const activeRef = EXAMPLE_REFS.find(r => r.id === selectedRef);
  const activeMat = EXAMPLE_MATERIALS.find(m => m.id === selectedMaterial);
  const activeDir = SCENT_DIRECTIONS.find(d => d.id === activeDirection) ?? SCENT_DIRECTIONS[0];

  // Materials highlighted by the selected reference
  const highlightedMaterials = activeRef ? new Set(activeRef.linkedMaterials) : new Set<string>();
  // References highlighted by the selected material
  const highlightedRefs = activeMat ? new Set(activeMat.linkedRefs) : new Set<string>();

  const handleSelectRef = (id: string) => {
    setSelectedRef(prev => prev === id ? null : id);
    setSelectedMaterial(null);
  };

  const handleSelectMaterial = (id: string) => {
    setSelectedMaterial(prev => prev === id ? null : id);
    setSelectedRef(null);
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-background font-mono-ui">

      {/* ── Public nav ── */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/96 px-6 py-4 sm:px-10 backdrop-blur-sm"
      >
        <Link
          href="/"
          data-testid="link-example-logo"
          className="font-mono-ui text-[11px] font-medium tracking-[.32em] uppercase text-foreground/85 hover:opacity-60 transition-opacity"
        >
          MATIÈ<span>R</span>E
        </Link>
        <ExampleBadge />
        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            data-testid="link-example-signin"
            className="font-mono-ui text-[12px] uppercase tracking-[.22em] text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/studio"
            data-testid="link-example-start"
            className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2.5 font-mono-ui text-[11px] uppercase tracking-[.18em] hover:opacity-80 transition-opacity"
          >
            Create a moodboard
          </Link>
        </div>
      </motion.header>

      {/* ── Page header ── */}
      <motion.section
        className="border-b border-border px-6 py-10 sm:px-10"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        data-testid="example-header"
      >
        <div className="mb-6">
          <Link
            href="/"
            data-testid="link-example-back"
            className="inline-flex items-center gap-2 font-mono-ui text-[12px] uppercase tracking-[.18em] text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={11} strokeWidth={1.5} /> Back
          </Link>
        </div>
        <div className="max-w-3xl">
          <p className="font-mono-ui text-[12px] uppercase tracking-[.26em] text-muted-foreground mb-3">
            Example workspace · Animal in the Mirror
          </p>
          <h1
            className="font-display tracking-[-0.03em] leading-[.88] text-foreground mb-5"
            style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)" }}
            data-testid="heading-example"
          >
            Animal in the Mirror
          </h1>
          <p className="text-lg leading-8 text-foreground/70 max-w-2xl mb-8" style={{ fontSize: "clamp(1rem, 2vw, 1.15rem)" }}>
            A powdery, intimate skin scent with an iris core and a subtle animalic depth.
            The brief: <em>your own skin, unrecognised.</em>
          </p>
          <WorkflowSteps />
        </div>
      </motion.section>

      {/* ── Instruction strip ── */}
      <div className="border-b border-border bg-secondary/30 px-6 py-3 sm:px-10">
        <p className="font-mono-ui text-[12px] uppercase tracking-[.18em] text-muted-foreground">
          Select a reference to highlight linked materials · select a material to read why it belongs · switch between scent direction iterations below
        </p>
      </div>

      {/* ── Reference grid ── */}
      <section
        className="border-b border-border px-6 py-8 sm:px-10"
        aria-label="Visual references"
        data-testid="section-references"
      >
        <p className="font-mono-ui text-[12px] uppercase tracking-[.26em] text-muted-foreground mb-6">
          Visual references · {EXAMPLE_REFS.length} collected
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border">
          {EXAMPLE_REFS.map((ref, i) => {
            const isSelected = selectedRef === ref.id;
            const isHighlighted = highlightedRefs.has(ref.id);
            const isDimmed = selectedMaterial && !isHighlighted;

            return (
              <motion.button
                key={ref.id}
                data-testid={`ref-item-${ref.id}`}
                onClick={() => handleSelectRef(ref.id)}
                aria-pressed={isSelected}
                aria-label={`Reference: ${ref.caption}`}
                className={[
                  "relative group text-left overflow-hidden bg-card transition-all duration-200",
                  "focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent focus-visible:outline-offset-1",
                  isSelected ? "outline outline-1 outline-accent" : "",
                  isDimmed ? "opacity-40" : "",
                ].join(" ")}
                style={{ aspectRatio: "4/5", minHeight: "clamp(120px, 14vw, 200px)" }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: isDimmed ? 0.4 : 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 + i * 0.04 }}
              >
                {/* Image refs */}
                {ref.type === "image" && ref.src && (
                  <img
                    src={ref.src}
                    alt={ref.caption}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}

                {/* Video thumbnail placeholder */}
                {ref.type === "video" && (
                  <div className="absolute inset-0 bg-foreground/90 flex flex-col items-center justify-center gap-3">
                    <div className="h-10 w-10 border border-white/20 flex items-center justify-center">
                      <Play size={14} strokeWidth={1.5} className="text-white/60 translate-x-0.5" />
                    </div>
                    <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-white/40">Video</p>
                  </div>
                )}

                {/* Note placeholder */}
                {ref.type === "note" && (
                  <div className="absolute inset-0 bg-secondary/60 flex flex-col justify-end p-3">
                    <p className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-muted-foreground">Note</p>
                    <p className="mt-1 text-xs leading-5 text-foreground/60">Your own skin, unrecognised.</p>
                  </div>
                )}

                {/* Selection accent */}
                {isSelected && (
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-accent" />
                )}

                {/* Highlighted indicator */}
                {isHighlighted && !isSelected && (
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-accent/50" />
                )}

                {/* Caption on hover/focus */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/60 to-transparent px-2 py-2 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                  <p className="font-mono-ui text-[9px] uppercase tracking-[.10em] text-white/80 line-clamp-2">
                    {ref.caption}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Selected reference detail */}
        <AnimatePresence>
          {activeRef && (
            <motion.div
              key={activeRef.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-4 border border-border bg-background p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6">
                  <div>
                    <p className="font-mono-ui text-[11px] uppercase tracking-[.22em] text-muted-foreground mb-3">
                      Selected reference
                    </p>
                    <p className="text-base leading-7 text-foreground/80 mb-4" style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.05rem)" }}>
                      {activeRef.caption}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <p className="font-mono-ui text-[11px] uppercase tracking-[.16em] text-muted-foreground mr-2">
                        Descriptors:
                      </p>
                      {activeRef.descriptors.map(d => (
                        <span
                          key={d}
                          className="font-mono-ui text-[11px] uppercase tracking-[.12em] border border-border px-2 py-0.5 text-foreground/70"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                    <p className="font-mono-ui text-[11px] uppercase tracking-[.16em] text-muted-foreground">
                      Linked materials →{" "}
                      {EXAMPLE_MATERIALS
                        .filter(m => activeRef.linkedMaterials.includes(m.id))
                        .map(m => m.name)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="flex items-start gap-3 shrink-0">
                    <span className="inline-block h-1 w-1 bg-accent shrink-0 mt-1" aria-hidden />
                    <p className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground/60">
                      Highlight visible in material list
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── AI-interpreted qualities (curated, labeled) ── */}
      <section
        className="border-b border-border px-6 py-8 sm:px-10 bg-card"
        aria-label="Curated scent qualities"
        data-testid="section-qualities"
      >
        <div className="flex items-start gap-4 mb-6">
          <div>
            <p className="font-mono-ui text-[12px] uppercase tracking-[.26em] text-muted-foreground mb-1">
              Interpreted qualities — curated example
            </p>
            <p className="font-mono-ui text-[11px] uppercase tracking-[.14em] text-muted-foreground/50">
              These qualities were curated by the studio team from the collected references, not generated live.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {AI_QUALITIES.map((q, i) => (
            <div
              key={i}
              className="border border-border bg-background px-4 py-4"
              data-testid={`quality-${i}`}
            >
              <span className="inline-block h-[3px] w-[3px] bg-accent mb-3" aria-hidden />
              <p className="text-sm leading-6 text-foreground/75" style={{ fontSize: "clamp(0.85rem, 1.4vw, 0.9rem)" }}>
                {q}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Materials with why ── */}
      <section
        className="border-b border-border"
        aria-label="Suggested materials"
        data-testid="section-materials"
      >
        <div className="px-6 py-6 sm:px-10 border-b border-border">
          <p className="font-mono-ui text-[12px] uppercase tracking-[.26em] text-muted-foreground">
            Suggested materials · {EXAMPLE_MATERIALS.length} in this direction
          </p>
        </div>

        {EXAMPLE_MATERIALS.map((mat, i) => {
          const isSelected = selectedMaterial === mat.id;
          const isHighlighted = highlightedMaterials.has(mat.id);
          const isDimmed = selectedRef && !isHighlighted;

          return (
            <motion.div
              key={mat.id}
              data-testid={`material-item-${mat.id}`}
              animate={{ opacity: isDimmed ? 0.35 : 1 }}
              transition={{ duration: 0.2 }}
              className={[
                "border-b border-border transition-colors duration-150",
                isSelected ? "bg-secondary/40" : "hover:bg-secondary/20",
                isHighlighted && !isSelected ? "border-l-2 border-l-accent bg-accent/5" : "",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => handleSelectMaterial(mat.id)}
                aria-expanded={isSelected}
                aria-controls={`material-body-${mat.id}`}
                className="w-full text-left px-6 py-5 sm:px-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                data-testid={`material-toggle-${mat.id}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">
                        {mat.role}
                      </span>
                      {isHighlighted && (
                        <span className="inline-flex items-center gap-1 font-mono-ui text-[10px] uppercase tracking-[.12em] text-accent-foreground border border-accent/30 px-2 py-0.5">
                          <span className="inline-block h-1 w-1 bg-accent" aria-hidden /> linked to selection
                        </span>
                      )}
                    </div>
                    <p className="font-display text-xl tracking-[-0.02em] text-foreground" style={{ fontSize: "clamp(1.1rem, 2vw, 1.35rem)" }}>
                      {mat.name}
                    </p>
                    <p className="mt-1 font-mono-ui text-[12px] uppercase tracking-[.12em] text-muted-foreground/60">
                      {mat.olfactiveCharacter}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="font-mono-ui text-[11px] uppercase tracking-[.14em] text-muted-foreground/50">
                      {isSelected ? "Close" : "Why it belongs"}
                    </span>
                    <ChevronDown
                      size={13}
                      strokeWidth={1.5}
                      className={`text-muted-foreground transition-transform duration-200 ${isSelected ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    id={`material-body-${mat.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-7 sm:px-10 pt-1">
                      <div className="border-l-2 border-accent pl-5 py-1">
                        <p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground mb-3">
                          Why it relates to this direction
                        </p>
                        <p className="text-base leading-8 text-foreground/75 max-w-2xl" style={{ fontSize: "clamp(0.95rem, 1.6vw, 1rem)" }}>
                          {mat.why}
                        </p>
                        <div className="mt-4">
                          <p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground/50">
                            Linked references →{" "}
                            {EXAMPLE_REFS
                              .filter(r => mat.linkedRefs.includes(r.id))
                              .map(r => r.caption.split("—")[0].trim())
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </section>

      {/* ── Scent direction iterations ── */}
      <section
        className="border-b border-border px-6 py-8 sm:px-10"
        aria-label="Scent direction iterations"
        data-testid="section-directions"
      >
        <p className="font-mono-ui text-[12px] uppercase tracking-[.26em] text-muted-foreground mb-6">
          Scent directions · {SCENT_DIRECTIONS.length} example iterations
        </p>

        {/* Tab switcher */}
        <div className="flex border border-border bg-card mb-6" role="tablist" aria-label="Scent direction iterations">
          {SCENT_DIRECTIONS.map(dir => (
            <button
              key={dir.id}
              role="tab"
              aria-selected={activeDirection === dir.id}
              aria-controls={`dir-panel-${dir.id}`}
              onClick={() => setActiveDirection(dir.id)}
              data-testid={`direction-tab-${dir.id}`}
              className={[
                "flex-1 px-4 py-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
                activeDirection === dir.id
                  ? "bg-background border-b-2 border-b-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30",
              ].join(" ")}
            >
              <p className="font-mono-ui text-[12px] uppercase tracking-[.14em] text-inherit">{dir.label}</p>
            </button>
          ))}
        </div>

        {/* Direction panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDirection}
            id={`dir-panel-${activeDirection}`}
            role="tabpanel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            data-testid="direction-panel"
          >
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-8">
              <div>
                <p className="font-mono-ui text-[11px] uppercase tracking-[.18em] text-muted-foreground mb-2">
                  Accord
                </p>
                <p className="font-display text-2xl tracking-[-0.02em] text-foreground mb-4" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)" }}>
                  {activeDir.accord}
                </p>
                <p className="text-base leading-8 text-foreground/70 mb-5" style={{ fontSize: "clamp(0.95rem, 1.6vw, 1rem)" }}>
                  {activeDir.description}
                </p>
                {activeDir.change && (
                  <div className="border-l-2 border-accent pl-4 py-2 mt-4">
                    <p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground mb-2">
                      What changed from the previous iteration
                    </p>
                    <p className="text-sm leading-7 text-foreground/70" style={{ fontSize: "clamp(0.875rem, 1.4vw, 0.9rem)" }}>
                      {activeDir.change}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <p className="font-mono-ui text-[11px] uppercase tracking-[.18em] text-muted-foreground mb-3">
                  Materials in this iteration
                </p>
                <div className="space-y-2">
                  {activeDir.materials.map(m => (
                    <div key={m} className="flex items-center gap-2">
                      <span className="inline-block h-[3px] w-[3px] bg-accent shrink-0" aria-hidden />
                      <span className="font-mono-ui text-[13px] uppercase tracking-[.10em] text-foreground/70">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ── Notes ── */}
      <section
        className="border-b border-border px-6 sm:px-10"
        aria-label="Studio notes"
        data-testid="section-notes"
      >
        <button
          type="button"
          onClick={() => setNotesOpen(v => !v)}
          aria-expanded={notesOpen}
          aria-controls="notes-panel"
          className="flex w-full items-center justify-between py-6 hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          data-testid="button-toggle-notes"
        >
          <p className="font-mono-ui text-[12px] uppercase tracking-[.26em] text-muted-foreground">
            Studio notes · {EXAMPLE_NOTES.length} example entries
          </p>
          <ChevronDown
            size={13}
            strokeWidth={1.5}
            className={`text-muted-foreground transition-transform duration-200 ${notesOpen ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {notesOpen && (
            <motion.div
              id="notes-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="pb-8 space-y-0">
                {EXAMPLE_NOTES.map((note, i) => (
                  <div
                    key={note.id}
                    className={`${i > 0 ? "border-t border-border" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedNote(prev => prev === note.id ? null : note.id)}
                      aria-expanded={expandedNote === note.id}
                      className="w-full text-left py-5 flex items-center justify-between gap-4 hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                      data-testid={`note-toggle-${note.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono-ui text-[11px] uppercase tracking-[.10em] text-muted-foreground/60">
                          {new Date(note.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span className="font-mono-ui text-[11px] uppercase tracking-[.14em] text-accent border border-accent/30 px-2 py-0.5">
                          {note.tag}
                        </span>
                      </div>
                      <ChevronDown
                        size={12}
                        strokeWidth={1.5}
                        className={`text-muted-foreground/50 transition-transform shrink-0 ${expandedNote === note.id ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {expandedNote === note.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="text-base leading-8 text-foreground/70 pb-5 max-w-2xl" style={{ fontSize: "clamp(0.95rem, 1.6vw, 1rem)" }}>
                            {note.body}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Next step ── */}
      <section
        className="border-b border-border px-6 py-8 sm:px-10"
        aria-label="Next step: develop and refine"
        data-testid="section-next-step"
      >
        <div className="flex items-start gap-4 mb-4">
          <span className="inline-block h-1.5 w-1.5 bg-accent shrink-0 mt-1" aria-hidden />
          <p className="font-mono-ui text-[12px] uppercase tracking-[.22em] text-muted-foreground">
            Next step in this example · Develop and refine
          </p>
        </div>
        <p className="text-base leading-8 text-foreground/70 max-w-2xl mb-6" style={{ fontSize: "clamp(0.95rem, 1.6vw, 1rem)" }}>
          In a real workspace, this is where materials become a formula — concentrations, roles, and iterations all in one place.
          The moodboard stays connected to the formula as it develops.
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="inline-flex items-center gap-2 font-mono-ui text-[12px] uppercase tracking-[.18em] text-muted-foreground/40 border border-border px-4 py-2.5 cursor-default select-none">
            Open formula builder
            <span className="border border-border px-1.5 py-0.5 text-[9px] tracking-widest ml-1">Sign in required</span>
          </div>
          <div className="inline-flex items-center gap-2 font-mono-ui text-[12px] uppercase tracking-[.18em] text-muted-foreground/40 border border-border px-4 py-2.5 cursor-default select-none">
            Browse material library
            <span className="border border-border px-1.5 py-0.5 text-[9px] tracking-widest ml-1">Sign in required</span>
          </div>
        </div>
      </section>

      {/* ── Signup invitation ── */}
      <section
        className="px-6 py-16 sm:px-10 sm:py-20 bg-card border-b border-border"
        aria-label="Create your own workspace"
        data-testid="section-signup-invite"
      >
        <div className="max-w-2xl">
          <p className="font-mono-ui text-[12px] uppercase tracking-[.28em] text-muted-foreground mb-4">
            You just explored a curated example
          </p>
          <h2
            className="font-display tracking-[-0.03em] leading-[.9] text-foreground mb-6"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
          >
            Now build your own.
          </h2>
          <p className="text-base leading-8 text-foreground/70 mb-8 max-w-xl" style={{ fontSize: "clamp(1rem, 1.8vw, 1.1rem)" }}>
            Collect references from your own world. Add images, video, and notes.
            Explore scent directions and materials, then develop your fragrance in one workspace — your projects stay private.
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <Link
              href="/studio"
              data-testid="button-example-create"
              className="inline-flex items-center gap-2.5 bg-foreground text-background px-6 py-3.5 font-mono-ui text-[12px] uppercase tracking-[.20em] hover:opacity-80 transition-opacity"
            >
              Create a moodboard
              <ArrowRight size={11} strokeWidth={1.5} />
            </Link>
            <Link
              href="/sign-in"
              data-testid="link-example-signin-bottom"
              className="font-mono-ui text-[12px] uppercase tracking-[.18em] text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in to your studio
            </Link>
          </div>
          <p className="mt-6 font-mono-ui text-[11px] uppercase tracking-[.14em] text-muted-foreground/50">
            Your projects, moodboards, materials, and formulas are private to your account.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <span className="font-mono-ui text-[11px] uppercase tracking-[.20em] text-muted-foreground">
            MATIÈRE — Sillage Lab
          </span>
          <span className="font-mono-ui text-[10px] text-muted-foreground/50">
            Example content · representative workspace · not associated with any user account
          </span>
        </div>
      </footer>
    </div>
  );
}
