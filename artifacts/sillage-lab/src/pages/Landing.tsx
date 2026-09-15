import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
const FIELD_NOTE_SCENES = [
  {
    fieldNote: "014", date: "03.14",
    bg: "hero-flowers.jpg",
    name: "salt / iris", nameEm: "old wood",
    description: "A little mineral. A soft refusal. Something that stays after the room is empty.",
    concentration: "20%", unit: "eau de parfum",
  },
  {
    fieldNote: "007", date: "11.02",
    bg: "rose.jpg",
    name: "rose / amber", nameEm: "musk",
    description: "Full-bodied without sweetness. A rose that smells like it was just cut.",
    concentration: "22%", unit: "eau de parfum",
  },
  {
    fieldNote: "021", date: "07.28",
    bg: "vetiver.jpg",
    name: "cedar / smoke", nameEm: "vetiver",
    description: "Rooted and unhurried. The kind of dry that feels earned.",
    concentration: "15%", unit: "eau de parfum",
  },
  {
    fieldNote: "033", date: "01.09",
    bg: "resin.jpg",
    name: "labdanum / oud", nameEm: "benzoin",
    description: "Resinous and warm. Something ancient without being obvious about it.",
    concentration: "18%", unit: "extrait de parfum",
  },
];

function FieldNoteCard() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-160, 160], [7, -7]), { damping: 22, stiffness: 180 });
  const rotateY = useSpring(useTransform(mouseX, [-160, 160], [-7, 7]), { damping: 22, stiffness: 180 });

  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % FIELD_NOTE_SCENES.length), 4400);
    return () => clearInterval(t);
  }, []);

  const base = import.meta.env.BASE_URL + "images/";

  return (
    <motion.div
      style={{ rotateX, rotateY, transformPerspective: 1100 }}
      onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); mouseX.set(e.clientX - r.left - r.width / 2); mouseY.set(e.clientY - r.top - r.height / 2); }}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      initial={{ opacity: 0, y: 36, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.22, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      className="relative min-h-[420px] cursor-default lg:min-h-[540px]"
    >
      <div className="absolute inset-0 overflow-hidden border border-border text-foreground">

        {/* ── Crossfading scene layer (bg + text together) ── */}
        <AnimatePresence mode="sync">
          {FIELD_NOTE_SCENES.map((scene, i) => i !== active ? null : (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.0, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              {/* Background */}
              <img
                src={base + scene.bg}
                alt="Studio material photograph"
                className="absolute inset-0 h-full w-full object-cover"
                data-testid={i === 0 ? "img-hero-photo" : undefined}
              />
              {/* Field note header */}
              <div className="relative flex justify-between px-8 pt-8 font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">
                <span>Field note {scene.fieldNote}</span><span>{scene.date}</span>
              </div>

              {/* Bottom content */}
              <div className="absolute bottom-10 left-8 right-8 z-[1]">
                <p className="font-display text-6xl leading-[.82] text-foreground">
                  {scene.name}<br /><em>{scene.nameEm}</em>
                </p>
                <div className="mt-7 flex items-end justify-between">
                  <p className="max-w-[180px] text-sm leading-6 text-muted-foreground">{scene.description}</p>
                  <div className="grid size-20 place-items-center border border-border font-mono-ui text-[9px] text-center uppercase leading-3">
                    {scene.concentration}<br />{scene.unit}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── Dot indicators ── */}
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {FIELD_NOTE_SCENES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Scene ${i + 1}`}
              className={`h-[3px] rounded-full transition-all duration-500 ${
                i === active ? "w-5 bg-foreground/50" : "w-[3px] bg-foreground/20 hover:bg-foreground/35"
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── MoodboardDemo data ───────────────────────────────────────────────────────

interface ScentDir {
  id: string;
  label: string;
  tagline: string;
  derivedFrom: string[];
  territory: string[];
  keywords: string[];
  rationale: string;
  materials: { name: string; reason: string }[];
}

const SCENT_DIRECTIONS: ScentDir[] = [
  {
    id: "soft-focus",
    label: "Soft focus",
    tagline: "Airy woods, gentle warmth, a close-to-skin feeling.",
    derivedFrom: ["Fogged glass", "Warm skin", "Soft reflection"],
    territory: ["Transparent woods", "Soft musk", "Diffusive floral"],
    keywords: ["Transparent", "Skin-close", "Airy", "Soft woods"],
    rationale: "The fogged glass and warm skin in your moodboard suggest something close but blurred — familiar without being literal. This direction keeps warmth intimate and avoids anything sweet or heavy.",
    materials: [
      { name: "Ambroxan", reason: "Warm, mineral, and skin-like. Creates that close-to-skin transparency without sweetness." },
      { name: "Cashmeran", reason: "Soft woody warmth. Adds the fuzzy, enveloping quality that makes this direction intimate rather than distant." },
      { name: "Iso E Super", reason: "Transparent woody diffusion. Blurs the edges so the composition reads as presence, not perfume." },
    ],
  },
  {
    id: "after-dark",
    label: "After dark",
    tagline: "A floral direction with shadow, depth, and contrast.",
    derivedFrom: ["Dark lacquer", "Warm reflection", "Obscured surface"],
    territory: ["Dark floral", "Resin", "Polished woods"],
    keywords: ["Dark floral", "Contrast", "Shadow", "Depth"],
    rationale: "The dark lacquer in your moodboard pulls toward something with presence and contrast — a floral that is not cheerful, with shadow at its base. Warmth and strangeness in equal measure.",
    materials: [
      { name: "Rose Absolute", reason: "Not a fresh rose — this is honeyed and slightly animalic. The depth comes from its damascenone edge." },
      { name: "Labdanum Absolute", reason: "Warm, resinous, slightly leathery. The shadow underneath the floral." },
      { name: "Hedione", reason: "Diffusive and transparent. Lifts the darker elements so the composition breathes." },
    ],
  },
  {
    id: "warm-surface",
    label: "Warm surface",
    tagline: "Resinous warmth balanced with dry, textured elements.",
    derivedFrom: ["Warm skin", "Dark lacquer", "Powdered texture"],
    territory: ["Amber", "Dry woods", "Skin musk"],
    keywords: ["Resinous", "Dry", "Textured", "Mineral"],
    rationale: "The warm skin and textured surfaces in your moodboard point toward something with physical presence — resinous but not sweet, warm but with a dry mineral edge that keeps it from becoming heavy.",
    materials: [
      { name: "Benzoin Resinoid", reason: "Warm, slightly vanilla-edged resin. Grounds the direction in something rich and textured." },
      { name: "Vetiver", reason: "Dry, earthy, slightly smoky. Counterbalances the resin and adds the textured quality your references suggest." },
      { name: "Cedarwood Atlas", reason: "Dry woody structure. Keeps the warmth from turning heavy or sweet." },
    ],
  },
];

interface Refinement {
  id: string;
  label: string;
  directionId: string;
  rationale: string;
  keywords: string[];
  materials: { name: string; reason: string }[];
}

const REFINEMENTS: Refinement[] = [
  // Soft focus refinements
  {
    id: "sf-less-floral",
    label: "Less floral",
    directionId: "soft-focus",
    keywords: ["Transparent", "Mineral", "Airy", "Clean skin"],
    rationale: "Pulled back from any floral suggestion — now purely skin and mineral. The warmth stays but becomes more abstract, closer to the smell of clean skin in cool air.",
    materials: [
      { name: "Ambroxan", reason: "Now at the centre, undiluted by floral support. Mineral and skin-close." },
      { name: "Iso E Super", reason: "The only woody element — transparent and spacious." },
      { name: "Habanolide", reason: "A clean, skin-close musk that replaces any softness from the original Cashmeran." },
    ],
  },
  {
    id: "sf-more-mineral",
    label: "More mineral",
    directionId: "soft-focus",
    keywords: ["Cold mineral", "Transparent", "Skin", "Geological"],
    rationale: "A cooler, more structural version — the warmth recedes and a cold mineral character comes forward. Think the smell of stone in morning air.",
    materials: [
      { name: "Ambroxan", reason: "Still the skin-anchor, but now surrounded by cooler elements." },
      { name: "Calone 1951", reason: "Used at sub-trace — not marine, but cold and open. The mineral quality without the aquatic." },
      { name: "Stemone", reason: "Structural green-mineral. Adds precision and coldness." },
    ],
  },
  {
    id: "sf-explore",
    label: "Explore another direction",
    directionId: "soft-focus",
    keywords: ["Powder", "Iris", "Intimate", "Quiet floral"],
    rationale: "A different reading of the same moodboard — quieter, more powdery. The iris direction reads the warm skin as something more human and personal.",
    materials: [
      { name: "Orris Concrete", reason: "Earthy, powdery iris. Reads as skin memory rather than flower." },
      { name: "Ethylene Brassylate", reason: "A large-ring musk with a clean, close-to-skin quality." },
      { name: "Irone Alpha", reason: "Cold, slightly woody iris facet at low dose. Intimate rather than floral." },
    ],
  },
  // After dark refinements
  {
    id: "ad-less-floral",
    label: "Less floral",
    directionId: "after-dark",
    keywords: ["Shadow", "Resinous", "Depth", "Animalic"],
    rationale: "The floral element recedes to a trace. The shadow and depth remain — now more resinous and animalic, the floral becomes a memory rather than a presence.",
    materials: [
      { name: "Labdanum Absolute", reason: "Moves to the foreground. Warm, leathery, complex." },
      { name: "Civet Synthetic", reason: "At trace level, adds the animalic quality without the flower." },
      { name: "Benzoin Resinoid", reason: "Sweetens the resinous base so it does not become austere." },
    ],
  },
  {
    id: "ad-more-mineral",
    label: "More mineral",
    directionId: "after-dark",
    keywords: ["Dark floral", "Mineral", "Cold contrast", "Structural"],
    rationale: "Introduces a cold mineral vein into the dark floral — like the smell of a stone floor in a room full of flowers. The contrast becomes architectural.",
    materials: [
      { name: "Rose Absolute", reason: "Still present but now set against colder elements." },
      { name: "Labdanum Absolute", reason: "The shadow anchor." },
      { name: "Ambroxan", reason: "Adds cold, mineral skin quality to offset the warmth of the floral-resin accord." },
    ],
  },
  {
    id: "ad-explore",
    label: "Explore another direction",
    directionId: "after-dark",
    keywords: ["Incense", "Woody depth", "Smoky", "Atmospheric"],
    rationale: "A further reading of the darkness in your references — less floral, more atmospheric. Incense and dry wood, something ceremonial.",
    materials: [
      { name: "Frankincense EO", reason: "Incense quality without becoming heavy. The smoke is clean." },
      { name: "Cedarwood Atlas", reason: "Dry woody structure — the bones of the accord." },
      { name: "Labdanum Absolute", reason: "Warm base that connects incense to skin." },
    ],
  },
  // Warm surface refinements
  {
    id: "ws-less-floral",
    label: "Less floral",
    directionId: "warm-surface",
    keywords: ["Resinous", "Dry wood", "Amber", "Warm mineral"],
    rationale: "Removes any softness that could read floral. Now purely resinous and woody — amber-adjacent without the sweetness.",
    materials: [
      { name: "Benzoin Resinoid", reason: "Still the warm heart, but now untempered." },
      { name: "Cedarwood Atlas", reason: "Dry and structural — counterbalances the resin." },
      { name: "Labdanum Absolute", reason: "Adds an animalic warmth that prevents the accord from going sweet." },
    ],
  },
  {
    id: "ws-more-mineral",
    label: "More mineral",
    directionId: "warm-surface",
    keywords: ["Warm mineral", "Dry", "Stone", "Textured amber"],
    rationale: "Introduces a cold mineral quality to the warm resinous direction. The warmth is still present but now sits beneath a cooler, more structural surface.",
    materials: [
      { name: "Vetiver", reason: "Dry and earthy — the mineral is expressed through its smoky, geological quality." },
      { name: "Ambroxan", reason: "Mineral skin-warmth that bridges the resinous and mineral territories." },
      { name: "Benzoin Resinoid", reason: "Remains as the warm base but is now secondary to the mineral character." },
    ],
  },
  {
    id: "ws-explore",
    label: "Explore another direction",
    directionId: "warm-surface",
    keywords: ["Warm spice", "Resinous", "Oud", "Deep texture"],
    rationale: "A richer reading of warmth — spice added to the resinous base. Darker and more complex, with an oud facet that reads as furniture rather than perfume.",
    materials: [
      { name: "Oud CO₂", reason: "The direction-defining material — woody, animalic, complex." },
      { name: "Benzoin Resinoid", reason: "The sweet resinous base that softens the oud." },
      { name: "Cardamom EO", reason: "Spice without heat. A fresh, aromatic quality that lifts the accord." },
    ],
  },
];

const DIRECTION_READINGS: Record<string, { qualities: string[]; tensions: string[] }> = {
  "soft-focus": {
    qualities: ["Translucent", "Intimate", "Controlled"],
    tensions: ["Soft / Hard", "Clear / Obscured", "Skin / Surface"],
  },
  "after-dark": {
    qualities: ["Reflective", "Shadowed", "Controlled"],
    tensions: ["Warm / Cold", "Polished / Animalic", "Visible / Obscured"],
  },
  "warm-surface": {
    qualities: ["Tactile", "Resinous", "Dry"],
    tensions: ["Skin / Surface", "Warm / Mineral", "Soft / Structured"],
  },
};

function MoodboardDemo({ BASE }: { BASE: string }) {
  const [selectedDir, setSelectedDir] = useState<string>("soft-focus");
  const [selectedRefinement, setSelectedRefinement] = useState<string | null>(null);
  const [hoveredDir, setHoveredDir] = useState<string | null>(null);
  const [focusedImage, setFocusedImage] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);

  const direction = SCENT_DIRECTIONS.find(d => d.id === selectedDir) ?? SCENT_DIRECTIONS[0];
  const activeRefinements = REFINEMENTS.filter(r => r.directionId === selectedDir);
  const refinement = selectedRefinement ? REFINEMENTS.find(r => r.id === selectedRefinement) : null;

  const displayKeywords = refinement ? refinement.keywords : direction.keywords;
  const displayRationale = refinement ? refinement.rationale : direction.rationale;
  const displayMaterials = refinement ? refinement.materials : direction.materials;
  const activeReading = DIRECTION_READINGS[selectedDir] ?? DIRECTION_READINGS["soft-focus"];

  const handleDirSelect = (id: string) => {
    setSelectedDir(id);
    setSelectedRefinement(null);
    setSelectedMaterial(null);
    setShowReasoning(false);
  };

  const handleRefinement = (id: string) => {
    setSelectedRefinement(prev => prev === id ? null : id);
  };

  const handleReset = () => {
    setSelectedRefinement(null);
  };

  useEffect(() => {
    if (!focusedImage) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocusedImage(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [focusedImage]);

  return (
    <section
      id="moodboard-demo"
      className={`border-t border-border transition-colors duration-500 ${
        selectedDir === "after-dark" ? "bg-secondary/45" : selectedDir === "warm-surface" ? "bg-card/55" : "bg-background"
      }`}
      aria-label="One moodboard, three scent directions — interactive example"
      data-testid="section-moodboard-demo"
    >
      {/* ── Section header ── */}
      <motion.div
        className="px-8 py-10 sm:px-12 sm:py-12 border-b border-border"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <p className="font-mono-ui uppercase tracking-[.28em] text-muted-foreground" style={{ fontSize: "12px" }}>
            One moodboard → multiple possible scent worlds
          </p>
          <span className="inline-flex items-center gap-1.5 border border-accent/35 px-2.5 py-1" style={{ fontSize: "11px" }}>
            <span className="inline-block h-1.5 w-1.5 bg-accent shrink-0" aria-hidden />
            <span className="font-mono-ui uppercase tracking-[.18em] text-accent-foreground/80">Interactive example — curated responses</span>
          </span>
        </div>
        <h2
          className="font-display tracking-[-0.03em] leading-[.9] text-foreground"
          style={{ fontSize: "clamp(1.8rem, 3.8vw, 3.2rem)" }}
          data-testid="heading-moodboard-demo"
        >
          MATIÈRE makes hidden relationships visible.
        </h2>
        <p className="mt-4 leading-8 text-foreground/65 max-w-2xl" style={{ fontSize: "clamp(1rem, 1.6vw, 1.05rem)" }}>
          It does not simply read images. It notices what repeats, what contrasts, and what feels connected—then translates those relationships into several possible scent worlds. You remain the author.
        </p>
      </motion.div>

      {/* ── Board → reading → active direction ── */}
      <div className="grid grid-cols-1 gap-10 px-8 pb-12 sm:px-12 lg:grid-cols-12 lg:gap-7">

        {/* LEFT — Your moodboard */}
        <motion.div
          className="relative min-h-[540px] lg:col-span-5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55 }}
        >
          <div className="py-5 grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
            <p className="font-mono-ui uppercase tracking-[.22em] text-muted-foreground pt-1" style={{ fontSize: "12px" }}>
              Your prompt
            </p>
            <p className="font-display max-w-xl leading-[1.15] tracking-[-0.02em] text-foreground/80" style={{ fontSize: "clamp(1.35rem, 2.2vw, 2rem)" }}>
              &ldquo;Something intimate, warm, and a little strange. Nothing sugary.&rdquo;
            </p>
          </div>

          {/* Collage — three images: fogged glass, warm skin, dark lacquer */}
          <div className="relative mx-auto max-w-[660px]" style={{ height: "clamp(390px, 38vw, 560px)" }}>
            {/* Fogged glass — large anchor */}
            <button
              type="button"
              onClick={() => setFocusedImage(BASE + "lait-vert-02.jpg")}
              className={`absolute left-0 top-[4%] overflow-hidden text-left transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                hoveredDir === "after-dark" ? "opacity-45" : "opacity-100"
              }`}
              style={{ width: "62%", height: "78%", zIndex: selectedDir === "soft-focus" ? 3 : 1 }}
              aria-label="Focus fogged glass reference"
            >
              <img
                src={BASE + "lait-vert-02.jpg"}
                alt="Fogged glass — example reference"
                loading="lazy"
                className="h-full w-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).src = BASE + "glass-vessel-01.jpg"; }}
              />
              <span className="absolute bottom-3 left-3 font-mono-ui uppercase tracking-[.16em] text-white/80" style={{ fontSize: "11px" }}>Fogged glass</span>
            </button>
            {/* Warm skin — medium reference, restrained overlap */}
            <button
              type="button"
              onClick={() => setFocusedImage(BASE + "human-skin-01.jpg")}
              className={`absolute overflow-hidden text-left transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                hoveredDir === "after-dark" ? "opacity-60" : "opacity-100"
              }`}
              style={{ top: "16%", left: "56%", width: "38%", height: "56%", zIndex: selectedDir === "warm-surface" ? 4 : 2 }}
              aria-label="Focus warm skin reference"
            >
              <img
                src={BASE + "human-skin-01.jpg"}
                alt="Warm skin — example reference"
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-3 left-3 font-mono-ui uppercase tracking-[.16em] text-white/80" style={{ fontSize: "11px" }}>Warm skin</span>
            </button>
            {/* Dark lacquer — small lower reference */}
            <button
              type="button"
              onClick={() => setFocusedImage(BASE + "animal-mirror-01.jpg")}
              className={`absolute overflow-hidden text-left transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                hoveredDir === "soft-focus" ? "opacity-50" : "opacity-100"
              }`}
              style={{ bottom: "2%", right: "6%", width: "34%", height: "34%", zIndex: selectedDir === "after-dark" ? 5 : 3 }}
              aria-label="Focus dark lacquer reference"
            >
              <img
                src={BASE + "animal-mirror-01.jpg"}
                alt="Dark lacquer — example reference"
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-3 left-3 font-mono-ui uppercase tracking-[.16em] text-white/80" style={{ fontSize: "11px" }}>Dark lacquer</span>
            </button>
          </div>
        </motion.div>

          {/* CENTER — restrained interpretation layer */}
          <motion.div
            className="relative flex min-h-[360px] flex-col justify-center py-8 lg:col-span-2 lg:min-h-[540px] lg:py-24"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.3 }}
          >
            <span className="absolute left-0 top-1/2 hidden h-px w-5 -translate-x-full bg-accent/60 lg:block" aria-hidden />
            <span className="absolute right-0 top-1/2 hidden h-px w-5 translate-x-full bg-accent/60 lg:block" aria-hidden />
            <p className="font-mono-ui uppercase tracking-[.24em] text-accent-foreground/80" style={{ fontSize: "11px" }}>
              MATIÈRE reading
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDir}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="mt-7"
                aria-live="polite"
              >
                {activeReading.qualities.map((quality, index) => (
                  <div key={quality}>
                    {index > 0 && <div className="my-2 h-5 w-px bg-border" aria-hidden />}
                    <p className="font-display uppercase leading-none tracking-[-0.01em] text-foreground/80" style={{ fontSize: "clamp(1.1rem, 1.7vw, 1.5rem)" }}>{quality}</p>
                  </div>
                ))}
                <div className="mt-10">
                  <p className="font-mono-ui uppercase tracking-[.18em] text-muted-foreground" style={{ fontSize: "9px" }}>Tensions</p>
                  <div className="mt-3 space-y-2">
                    {activeReading.tensions.map(tension => (
                      <p key={tension} className="font-mono-ui uppercase tracking-[.12em] text-foreground/55" style={{ fontSize: "10px" }}>{tension}</p>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

        {/* RIGHT — one active olfactive direction */}
        <motion.div
          className="flex flex-col pt-4 lg:col-span-5 lg:pt-24"
          initial={{ opacity: 0, x: 8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          <div className="pb-7">
            <p className="font-mono-ui uppercase tracking-[.22em] text-muted-foreground mb-1" style={{ fontSize: "12px" }}>
              Possible readings
            </p>
            <p className="max-w-md text-muted-foreground/70 leading-6" style={{ fontSize: "clamp(0.875rem, 1.3vw, 0.9rem)" }}>
              One visual world can lead in several olfactive directions.
            </p>
          </div>

          {/* Quiet direction switcher */}
          <div
            role="list"
            aria-label="Scent directions"
            className="flex flex-wrap gap-x-5 gap-y-3"
          >
            {SCENT_DIRECTIONS.map((dir, index) => {
              const isActive = selectedDir === dir.id;
              return (
                <motion.button
                  key={dir.id}
                  role="listitem"
                  aria-pressed={isActive}
                  onClick={() => handleDirSelect(dir.id)}
                  onMouseEnter={() => setHoveredDir(dir.id)}
                  onMouseLeave={() => setHoveredDir(null)}
                  data-testid={`direction-card-${dir.id}`}
                  className={`group relative min-h-10 text-left font-mono-ui uppercase tracking-[.14em] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isActive ? "text-foreground" : "text-muted-foreground/55 hover:text-foreground"
                  }`}
                  transition={{ duration: 0.3 }}
                >
                  <span style={{ fontSize: "11px" }}>{String(index + 1).padStart(2, "0")} {dir.label}</span>
                  <span className="pointer-events-none absolute left-0 top-full z-10 hidden w-48 bg-background pt-2 normal-case tracking-normal text-muted-foreground group-hover:block" style={{ fontSize: "12px" }}>
                    {dir.tagline}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Selected direction output */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDir + (selectedRefinement ?? "")}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="px-7 py-6 sm:px-9 flex-1"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="font-title uppercase leading-[.9] tracking-[-0.04em] text-foreground" style={{ fontSize: "clamp(3rem, 5vw, 5.8rem)" }}>
                {direction.label}{refinement ? ` / ${refinement.label.replace("More ", "")}` : ""}
              </p>
              <p className="mt-4 max-w-lg text-foreground/65 leading-7" style={{ fontSize: "17px" }}>{direction.tagline}</p>

              {/* Keywords */}
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 mb-5">
                {displayKeywords.map(kw => (
                  <span
                    key={kw}
                    className="font-mono-ui uppercase tracking-[.12em] text-foreground/65"
                    style={{ fontSize: "11px" }}
                  >
                    {kw}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowReasoning(value => !value)}
                aria-expanded={showReasoning}
                className="mb-5 inline-flex min-h-10 items-center gap-2 font-mono-ui uppercase tracking-[.16em] text-foreground/65 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                style={{ fontSize: "12px" }}
              >
                Why this direction? <ArrowRight size={11} className={`transition-transform ${showReasoning ? "rotate-90 text-accent" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {showReasoning && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-7 overflow-hidden"
                  >
                    <p className="leading-8 text-foreground/70" style={{ fontSize: "clamp(1rem, 1.5vw, 1rem)" }}>
                      {displayRationale}
                    </p>
                    <p className="mt-4 font-mono-ui uppercase tracking-[.14em] text-muted-foreground" style={{ fontSize: "10px" }}>
                      Repeated relationship → {displayKeywords.join(" · ")}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {!showReasoning && (
                <p className="mb-7 max-w-lg leading-7 text-foreground/65" style={{ fontSize: "15px" }}>
                  {direction.derivedFrom.join(", ")} repeatedly introduce {activeReading.qualities.join(", ").toLowerCase()} qualities.
                </p>
              )}

              {/* Material discoveries */}
              <div className="mb-8">
                <p className="font-mono-ui uppercase tracking-[.18em] text-muted-foreground" style={{ fontSize: "11px" }}>
                  Material territory
                </p>
                <div className="mt-4 grid gap-5 sm:grid-cols-3">
                  {displayMaterials.map(mat => {
                    const isOpen = selectedMaterial === mat.name;
                    return (
                      <button
                        type="button"
                        key={mat.name}
                        onClick={() => setSelectedMaterial(isOpen ? null : mat.name)}
                        aria-expanded={isOpen}
                        className="group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                      >
                        <span className="block h-[1px] w-5 bg-accent transition-all duration-200 group-hover:w-12" aria-hidden />
                        <span className="mt-3 block font-mono-ui uppercase tracking-[.14em] text-foreground/90" style={{ fontSize: "13px" }}>
                          {mat.name}
                        </span>
                        <span className="mt-2 block text-muted-foreground leading-6" style={{ fontSize: "14px" }}>
                          {mat.reason.split(".")[0]}.
                        </span>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.span
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-3 block overflow-hidden"
                            >
                              <span className="block text-foreground/65 leading-6" style={{ fontSize: "14px" }}>{mat.reason}</span>
                              <span className="mt-3 block font-mono-ui uppercase tracking-[.12em] text-foreground/55" style={{ fontSize: "11px" }}>
                                One material possibility—not a prescription.
                              </span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Link
                href="/studio"
                data-testid={`link-explore-direction-${direction.id}`}
                className="mb-7 inline-flex min-h-11 items-center gap-2 font-mono-ui uppercase tracking-[.16em] text-foreground hover:text-foreground/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                style={{ fontSize: "12px" }}
              >
                Explore {direction.label} <ArrowRight size={12} className="text-accent" />
              </Link>

              {/* Refinement controls */}
              <div className="pt-4">
                <p className="font-mono-ui uppercase tracking-[.18em] text-muted-foreground mb-3" style={{ fontSize: "12px" }}>
                  Refine the reading
                </p>
                <div className="flex flex-wrap gap-2 mb-2" role="group" aria-label="Refinement options">
                  {activeRefinements.map(ref => (
                    <button
                      key={ref.id}
                      onClick={() => handleRefinement(ref.id)}
                      aria-pressed={selectedRefinement === ref.id}
                      data-testid={`refinement-${ref.id}`}
                      className={[
                        "py-2 pr-5 font-mono-ui uppercase tracking-[.14em] transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
                        selectedRefinement === ref.id
                          ? "text-foreground"
                          : "text-foreground/55 hover:text-foreground",
                      ].join(" ")}
                      style={{ fontSize: "14px", minHeight: "40px" }}
                    >
                      {ref.label === "Explore another direction" ? "More abstract →" : `${ref.label} →`}
                    </button>
                  ))}
                  {selectedRefinement && (
                    <button
                      onClick={handleReset}
                      data-testid="refinement-reset"
                      className="px-4 py-2 font-mono-ui uppercase tracking-[.14em] text-muted-foreground/55 hover:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                      style={{ fontSize: "14px", minHeight: "40px" }}
                      aria-label="Reset to original direction"
                    >
                      Reset direction
                    </button>
                  )}
                </div>
                <p className="font-mono-ui text-muted-foreground/45" style={{ fontSize: "11px" }}>
                  Curated responses — not live generation
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── CTA ── */}
      <div className="px-8 py-8 sm:px-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <p className="leading-8 text-foreground/65 max-w-md" style={{ fontSize: "clamp(1rem, 1.6vw, 1.05rem)" }}>
          Your references start the conversation. You decide where it goes.
        </p>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            href="/studio"
            data-testid="button-demo-create-moodboard"
            className="inline-flex items-center gap-2.5 bg-foreground text-background px-6 py-3.5 font-mono-ui uppercase tracking-[.18em] hover:opacity-80 transition-opacity"
            style={{ fontSize: "14px", minHeight: "48px" }}
          >
            Create your own moodboard
            <ArrowRight size={11} strokeWidth={1.5} />
          </Link>
          <Link
            href="/example"
            data-testid="button-demo-explore-example"
            className="inline-flex items-center gap-2 border border-foreground/20 px-5 py-3.5 font-mono-ui uppercase tracking-[.18em] text-foreground/55 hover:border-foreground/40 hover:text-foreground transition-colors"
            style={{ fontSize: "14px", minHeight: "48px" }}
          >
            Explore an example
          </Link>
        </div>
      </div>
      <p className="px-8 pb-5 sm:px-12 font-mono-ui text-muted-foreground/45" style={{ fontSize: "11px" }}>
        An account is required to create and save your own moodboard. Exploring this example does not require sign-in.
      </p>

      <AnimatePresence>
        {focusedImage && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Focused moodboard reference"
            className="fixed inset-0 z-50 grid place-items-center bg-foreground/90 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFocusedImage(null)}
          >
            <motion.img
              src={focusedImage}
              alt="Focused moodboard reference"
              className="max-h-[82vh] max-w-[88vw] object-contain"
              onClick={event => event.stopPropagation()}
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4 }}
            />
            <button
              type="button"
              onClick={() => setFocusedImage(null)}
              className="absolute right-6 top-6 font-mono-ui uppercase tracking-[.18em] text-background"
              style={{ fontSize: "13px" }}
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function EditorialFeatureModules({ BASE }: { BASE: string }) {
  /* ══════════════════════════════════════════════════════════════════════
      SECTION 2 — EDITORIAL FEATURE MODULES
      Four modular panels. Moodboard is primary.
      Typography: headings ~28–40px, body 16–18px, labels 14px.
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <section className="border-t border-border" aria-label="Feature modules">
      {/* Row 1 — four columns, moodboard dominant */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]"
        style={{ minHeight: "clamp(360px, 48vw, 600px)" }}
      >
        {/* A — Botanical still life */}
        <motion.div
          className="relative overflow-hidden"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ minHeight: "clamp(260px, 30vw, 400px)" }}
        >
          <img
            src={BASE + "petal-01.jpg"}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).src = BASE + "lait-vert-01.jpg"; }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(var(--foreground)/0.55) 28%, transparent 66%)" }} />
          <div className="absolute bottom-0 left-0 p-6 sm:p-8" aria-hidden>
            <p className="font-mono-ui uppercase tracking-[.18em] text-white/50 mb-1" style={{ fontSize: "12px" }}>Raw</p>
            <p className="font-mono-ui uppercase tracking-[.14em] text-white/45" style={{ fontSize: "12px" }}>Natural · synthetic · together</p>
          </div>
        </motion.div>

        {/* B — Ingredient world (dark) */}
        <motion.div
          className="relative flex flex-col justify-end p-6 sm:p-8 dark-cinematic"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.06 }}
        >
          <img src={BASE + "animal-mirror-01.jpg"} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-20" />
          <div className="relative z-10">
            <h3 className="font-display leading-[.88] tracking-[-0.02em] text-white" style={{ fontSize: "clamp(1.4rem, 2.6vw, 2.2rem)" }}>Explore a world of ingredients</h3>
            <div className="mt-4 h-[1px] w-5 bg-white/25" aria-hidden />
            <Link href="/sign-up" data-testid="link-landing-discover" className="mt-4 inline-flex items-center gap-2 font-mono-ui uppercase tracking-[.20em] text-white/55 hover:text-white transition-colors" style={{ fontSize: "13px" }}>
              Browse the library <ArrowRight size={10} strokeWidth={1.5} />
            </Link>
            <p className="mt-2 font-mono-ui uppercase tracking-[.12em] text-white/30" style={{ fontSize: "11px" }}>Sign in required</p>
          </div>
        </motion.div>

        {/* C — Moodboard / Canvas (light, most prominent text) */}
        <motion.div
          className="relative overflow-hidden bg-card"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <img src={BASE + "moodboard-01.jpg"} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-60" onError={e => { (e.currentTarget as HTMLImageElement).src = BASE + "sel-gris-01.jpg"; }} />
          <div className="absolute inset-0 bg-background/45" />
          <div className="relative z-10 flex flex-col justify-between h-full p-6 sm:p-7">
            <div>
              <h3 className="font-display leading-[.90] tracking-[-0.02em] text-foreground" style={{ fontSize: "clamp(1.2rem, 2.2vw, 1.8rem)" }}>Build your moodboard</h3>
              <p className="mt-3 leading-7 text-muted-foreground" style={{ fontSize: "clamp(0.875rem, 1.4vw, 0.9rem)" }}>Images, video, and notes. Visual culture and formula precision as one process.</p>
            </div>
            <div>
              <div className="mb-4 h-[1px] w-5 bg-foreground/25" aria-hidden />
              <Link href="/sign-up" data-testid="link-landing-canvas" className="inline-flex items-center gap-2 font-mono-ui uppercase tracking-[.20em] text-foreground/55 hover:text-foreground transition-colors" style={{ fontSize: "13px" }}>
                Create a moodboard <ArrowRight size={10} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* D — Precision meets poetry (dropper dark) — heading always visible */}
        <motion.div
          className="relative overflow-hidden dark-cinematic"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.14 }}
        >
          <img src={BASE + "dropper-01.jpg"} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-50" onError={e => { (e.currentTarget as HTMLImageElement).src = BASE + "resine-noire-01.jpg"; }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(var(--foreground)/0.78) 18%, transparent 65%)" }} />
          <div className="relative z-10 flex flex-col justify-between h-full p-6 sm:p-7">
            <div className="text-right"><h3 className="font-display leading-[.88] tracking-[-0.02em] text-white" style={{ fontSize: "clamp(1.2rem, 2.2vw, 1.8rem)" }}>Precision meets poetry</h3></div>
            <div>
              <div className="mb-3 h-[1px] w-5 bg-white/22" aria-hidden />
              <Link href="/sign-up" data-testid="link-landing-formula-workspace" className="inline-flex items-center gap-2 font-mono-ui uppercase tracking-[.20em] text-white/45 hover:text-white transition-colors" style={{ fontSize: "13px" }}>
                Formula workspace <ArrowRight size={10} strokeWidth={1.5} />
              </Link>
              <p className="mt-1 font-mono-ui uppercase tracking-[.12em] text-white/28" style={{ fontSize: "11px" }}>Sign in required</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Row 2 — human portrait + platform text */}
      <div className="grid grid-cols-1 sm:grid-cols-[3fr_2fr] border-t border-border">
        <motion.div className="relative overflow-hidden" style={{ minHeight: "clamp(300px, 40vw, 480px)" }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <img src={BASE + "human-skin-01.jpg"} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-top" onError={e => { (e.currentTarget as HTMLImageElement).src = BASE + "hero-editorial.jpg"; }} />
          <div className="absolute top-0 right-0 p-7 flex flex-col gap-1.5 text-right hidden sm:flex" aria-hidden>
            {["A new", "language", "for scent"].map(w => <p key={w} className="font-mono-ui uppercase tracking-[.20em] text-white/45" style={{ fontSize: "11px" }}>{w}</p>)}
          </div>
        </motion.div>
        <motion.div className="flex flex-col justify-between p-8 sm:p-12 bg-background border-l border-border" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.08 }}>
          <div>
            <h3 className="font-display leading-[.9] tracking-[-0.02em] text-foreground" style={{ fontSize: "clamp(1.5rem, 2.8vw, 2.4rem)" }}>A fragrance workspace for what comes next</h3>
            <div className="mt-4 h-[1px] w-6 bg-foreground/22" aria-hidden />
            <p className="mt-5 font-mono-ui uppercase tracking-[.16em] text-muted-foreground" style={{ fontSize: "13px" }}>Sillage Lab — the MATIÈRE creation workspace</p>
            <p className="mt-5 leading-8 text-muted-foreground max-w-xs" style={{ fontSize: "clamp(0.95rem, 1.5vw, 1rem)" }}>Where visual culture, olfactive science, and AI interpretation work as one creative system. Your moodboards, notes, materials, and formula versions stay connected.</p>
          </div>
          <div className="mt-8">
            <div className="mb-4 h-[1px] w-6 bg-foreground/18" aria-hidden />
            <a href="#platform" data-testid="link-landing-learn-more" className="inline-flex items-center gap-2 font-mono-ui uppercase tracking-[.22em] text-foreground/50 hover:text-foreground transition-colors" style={{ fontSize: "13px" }}>Learn more <ArrowRight size={10} strokeWidth={1.5} /></a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Landing() {
  const BASE = import.meta.env.BASE_URL + "images/";

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-background">
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
          Monumental MATIÈRE masthead (800–900 weight), secondary proposition,
          explanatory copy, dual CTAs. Readable nav at 14–15px.
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: "100dvh" }}
        data-testid="landing-hero"
        aria-label="Hero"
      >
        {/* Warm parchment ground */}
        <div className="absolute inset-0 bg-background" />

        {/* Right-side photograph — warm skin, editorial */}
        <motion.div
          className="absolute inset-y-0 right-0 overflow-hidden"
          style={{ width: "55%" }}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        >
          <img
            src={BASE + "human-skin-01.jpg"}
            alt=""
            aria-hidden
            className="h-full w-full object-cover object-center"
            onError={e => { (e.currentTarget as HTMLImageElement).src = BASE + "hero-editorial.jpg"; }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background)/0.55) 22%, transparent 55%)" }}
          />
        </motion.div>

        {/* ── Nav ── */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-8 py-7 sm:px-12"
        >
          {/* Logo — always readable */}
          <Link
            href="/"
            data-testid="link-brand-landing"
            className="font-mono-ui font-medium tracking-[.32em] uppercase text-foreground/85 hover:opacity-60 transition-opacity"
            style={{ fontSize: "11px" }}
          >
            MATIÈ<span>R</span>E
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Site navigation">
            <Link
              href="/example"
              data-testid="link-landing-nav-example"
              className="font-mono-ui uppercase tracking-[.22em] text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontSize: "14px" }}
            >
              See an example
            </Link>
            <Link
              href="/studio"
              data-testid="link-landing-nav-platform"
              className="font-mono-ui uppercase tracking-[.22em] text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontSize: "14px" }}
            >
              The workspace
            </Link>
            <Link
              href="/studio"
              data-testid="link-landing-nav-create"
              className="font-mono-ui uppercase tracking-[.22em] text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontSize: "14px" }}
            >
              Create
            </Link>
          </nav>

          <div className="flex items-center gap-5">
            <Link
              href="/sign-in"
              data-testid="link-landing-sign-in"
              className="font-mono-ui uppercase tracking-[.22em] text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontSize: "14px" }}
            >
              Sign in
            </Link>
          </div>
        </motion.header>

        {/* ── Hero copy ── */}
        <div
          className="relative z-10 flex flex-col justify-center px-8 sm:px-12 font-medium"
          style={{ minHeight: "100dvh" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[52%] min-w-[280px] mt-[-42px] mb-[-42px]"
          >
            {/* ── Secondary proposition — above the masthead ── */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="font-mono-ui uppercase tracking-[.30em] text-muted-foreground font-medium text-[19px] mt-[-12px] mb-[10px]"
            >
              Fragrance beyond boundaries
            </motion.p>

            {/* ── Monumental MATIÈRE masthead ── */}
            <h1
              data-testid="heading-landing"
              className="font-title text-foreground text-[109px] pt-[0px] pb-[0px]"
              style={{
                fontSize: "clamp(4.5rem, 13vw, 14rem)",
                fontWeight: 900,
                letterSpacing: "-0.025em",
              }}
            >
              MATI<span>È</span>RE
            </h1>

            {/* ── Explanatory copy ── */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="leading-8 text-foreground/65 max-w-sm mt-[-12px]"
              style={{ fontSize: "clamp(1rem, 1.6vw, 1.1rem)" }}
            >
              Build a moodboard from images, video, and notes. Explore possible scent interpretations and material territories, then shape them into a fragrance in one creative workspace.
            </motion.p>

            {/* ── CTAs ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.62 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Link
                href="/studio"
                data-testid="button-landing-create-moodboard"
                className="inline-flex items-center gap-2.5 bg-foreground text-background px-6 py-3.5 font-mono-ui uppercase tracking-[.20em] hover:opacity-80 transition-opacity text-[20px]"
                style={{ minHeight: "48px" }}
              >
                Create a moodboard
                <ArrowRight size={12} strokeWidth={1.5} />
              </Link>
              <Link
                href="/example"
                data-testid="button-landing-explore-example"
                className="inline-flex items-center gap-2 border border-foreground/20 px-6 py-3.5 font-mono-ui uppercase tracking-[.20em] text-foreground/60 hover:border-foreground/50 hover:text-foreground transition-colors"
                style={{ fontSize: "14px", minHeight: "48px" }}
              >
                Explore an example
              </Link>
            </motion.div>
          </motion.div>

          {/* Decorative vertical micro-copy — non-essential */}
          <motion.div
            className="absolute bottom-9 left-8 sm:left-12 z-10 flex flex-col gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            aria-hidden
          >
            <div className="h-[1px] w-6 bg-foreground/25" />
            <p
              className="font-mono-ui uppercase tracking-[.24em] text-foreground/30 leading-5"
              style={{ fontSize: "9px", writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              A new language for scent
            </p>
          </motion.div>
        </div>
      </section>
      <EditorialFeatureModules BASE={BASE} />
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — ONE MOODBOARD. THREE SCENT DIRECTIONS.
          Interactive demo: left collage + note, right selectable directions.
          Fully curated — no live AI. Keyboard/touch/reduced-motion accessible.
      ══════════════════════════════════════════════════════════════════════ */}
      <MoodboardDemo BASE={BASE} />
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — PLATFORM FUNCTIONALITY
          Accurate descriptions of what exists. Planned features labeled.
          id="platform" for Learn more link target.
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="platform"
        className="border-t border-border px-8 py-16 sm:px-12 sm:py-20"
        aria-label="What MATIÈRE does"
        data-testid="section-platform"
      >
        <div className="mb-12">
          <p className="font-mono-ui uppercase tracking-[.28em] text-muted-foreground mb-3" style={{ fontSize: "12px" }}>
            The workspace
          </p>
          <h2
            className="font-display leading-[.9] tracking-[-0.03em] text-foreground max-w-2xl"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
          >
            One process from inspiration to formula
          </h2>
          <p className="mt-5 leading-8 text-foreground/65 max-w-2xl" style={{ fontSize: "clamp(1rem, 1.7vw, 1.1rem)" }}>
            MATIÈRE keeps the visual world and the developing fragrance in one continuous creative loop.
          </p>
        </div>

        <div className="relative">
          {[
            {
              number: "01",
              label: "Canvas",
              body: "Build the world.",
              artifact: "stacked imagery",
            },
            {
              number: "02",
              label: "Interpret",
              body: "Discover olfactive possibilities.",
              artifact: "transparent · skin-close · mineral",
            },
            {
              number: "03",
              label: "Materialize",
              body: "Connect visual ideas to materials.",
              artifact: "Ambroxan / mineral skin",
            },
            {
              number: "04",
              label: "Formulate",
              body: "Construct and iterate.",
              artifact: "Ambroxan 1.50 · Iso E Super 7.00",
            },
            {
              number: "05",
              label: "Evaluate",
              body: "Smell, observe and refine.",
              artifact: "The opening is still too polished.",
            },
            {
              number: "06",
              label: "Return",
              body: "Feed evaluation back into the creative world.",
              artifact: "Bring back the cold surface.",
            },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              className={`grid grid-cols-[52px_1fr] gap-5 py-8 sm:grid-cols-[70px_minmax(180px,0.7fr)_minmax(220px,1fr)] sm:items-center ${
                index < 5 ? "border-b border-border/60" : ""
              }`}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.45, delay: index * 0.04 }}
            >
              <div className="relative self-stretch">
                <span className="font-mono-ui text-muted-foreground" style={{ fontSize: "12px" }}>{item.number}</span>
                {index < 5 && <span className="absolute left-[4px] top-7 h-[calc(100%+28px)] w-px bg-border" aria-hidden />}
              </div>
              <div>
                <h3 className="font-title uppercase tracking-[-0.03em] text-foreground" style={{ fontSize: "clamp(1.8rem, 3vw, 3.1rem)" }}>{item.label}</h3>
                <p className="mt-1 text-foreground/60" style={{ fontSize: "17px" }}>{item.body}</p>
              </div>
              <div className="col-start-2 sm:col-start-3">
                {index === 0 ? (
                  <div className="relative h-20 w-36">
                    <img src={BASE + "lait-vert-02.jpg"} alt="" className="absolute left-0 top-0 h-16 w-20 object-cover" />
                    <img src={BASE + "human-skin-01.jpg"} alt="" className="absolute bottom-0 right-0 h-14 w-20 object-cover" />
                  </div>
                ) : (
                  <p className={`max-w-sm ${index === 4 || index === 5 ? "font-display italic" : "font-mono-ui uppercase tracking-[.13em]"} text-foreground/55`} style={{ fontSize: index === 4 || index === 5 ? "18px" : "12px" }}>
                    {item.artifact}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — FUTURE ECOSYSTEM (compact, clearly labeled)
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="border-t border-border px-8 py-12 sm:px-12"
        aria-label="MATIÈRE ecosystem"
        data-testid="section-ecosystem"
      >
        <p className="font-mono-ui uppercase tracking-[.26em] text-muted-foreground mb-8" style={{ fontSize: "12px" }}>
          Beyond the workspace
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          {[
            {
              name: "Shop",
              status: "Coming soon",
              body: "Curated materials, accords, and sample collections for the working perfumer.",
            },
            {
              name: "Custom fragrance experiences",
              status: "Coming soon",
              body: "Guided commissions — a bespoke fragrance developed with a MATIÈRE perfumer, using the same tools.",
            },
            {
              name: "Workshops",
              status: "Planned",
              body: "In-person and digital workshops connecting the platform's creative process with hands-on blending.",
            },
            {
              name: "Artist collaborations",
              status: "Planned",
              body: "Projects with artists, designers, and cultural figures — fragrance as material in a broader practice.",
            },
          ].map(item => (
            <div key={item.name} className="bg-background p-6 sm:p-7">
              <p className="font-mono-ui uppercase tracking-[.16em] text-foreground/75 mb-1" style={{ fontSize: "13px" }}>
                {item.name}
              </p>
              <span
                className="inline-block font-mono-ui uppercase tracking-[.12em] border border-border text-muted-foreground/50 px-1.5 py-0.5 mb-4"
                style={{ fontSize: "10px" }}
              >
                {item.status}
              </span>
              <p className="leading-7 text-muted-foreground" style={{ fontSize: "clamp(0.875rem, 1.3vw, 0.9rem)" }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-5 font-mono-ui uppercase tracking-[.14em] text-muted-foreground/50" style={{ fontSize: "11px" }}>
          The creative workspace is the primary focus. All ecosystem offerings will be introduced here as they become available.
        </p>
      </section>
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6 — FINAL CTA
          Strong "Create a moodboard" close.
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="border-t border-border grid grid-cols-1 sm:grid-cols-[1fr_1fr]"
        aria-label="Create a moodboard"
      >
        <motion.div
          className="relative overflow-hidden"
          style={{ minHeight: "clamp(200px, 24vw, 300px)" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          aria-hidden
        >
          <img
            src={BASE + "glass-vessel-01.jpg"}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).src = BASE + "lait-vert-02.jpg"; }}
          />
        </motion.div>
        <motion.div
          className="flex flex-col justify-center px-8 py-12 sm:px-12 bg-background border-l border-border"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.08 }}
        >
          <p className="font-mono-ui uppercase tracking-[.26em] text-muted-foreground mb-4" style={{ fontSize: "12px" }}>
            Sillage Lab — the MATIÈRE creation workspace
          </p>
          <h2
            className="font-display leading-[.9] tracking-[-0.03em] text-foreground"
            style={{ fontSize: "clamp(1.8rem, 3.6vw, 3.2rem)" }}
          >
            From world<br />to scent.
          </h2>
          <p className="mt-5 leading-8 text-foreground/65 max-w-xs" style={{ fontSize: "clamp(1rem, 1.5vw, 1rem)" }}>
            Your moodboard, notes, materials, and formula — one connected workspace, private to your account.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/studio"
              data-testid="link-landing-create-final"
              className="group inline-flex items-center gap-2.5 bg-foreground text-background px-6 py-3.5 font-mono-ui uppercase tracking-[.20em] hover:opacity-80 transition-opacity"
              style={{ fontSize: "14px", minHeight: "48px" }}
            >
              Create a moodboard
              <ArrowRight size={11} strokeWidth={1.5} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/example"
              data-testid="link-landing-example-final"
              className="inline-flex items-center gap-2 border border-foreground/20 px-6 py-3.5 font-mono-ui uppercase tracking-[.20em] text-foreground/55 hover:border-foreground/40 hover:text-foreground transition-colors"
              style={{ fontSize: "14px", minHeight: "48px" }}
            >
              Explore an example
            </Link>
          </div>
        </motion.div>
      </section>
      {/* ── Footer ── */}
      <footer className="border-t border-border px-8 py-6 sm:px-12">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="font-mono-ui uppercase tracking-[.20em] text-muted-foreground" style={{ fontSize: "11px" }}>
            MATIÈRE
          </span>
          <span className="font-mono-ui text-muted-foreground/45" style={{ fontSize: "10px" }}>
            Made for the long drydown.
          </span>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
