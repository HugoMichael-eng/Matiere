/**
 * /materials/:id — Material detail
 *
 * Architecture: sensory language leads; technical disclosure follows.
 * Structure:
 *   1. Atmosphere strip (family image, low opacity)
 *   2. Name + olfactive family heading — editorial scale
 *   3. Sensory portrait (usage notes in natural prose, usage role)
 *   4. Minimal metadata bar (origin, CAS, stock, safety)
 *   5. Technical & regulatory section (IFRA, allergens) — collapsible
 *   6. Stock & sourcing — collapsible
 *   7. Library links (formulas, materials search)
 *
 * Data: real API via useMaterials.
 * Context carry: referrer project/material from ?from= query param.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams, useSearch } from "wouter";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useMaterials } from "../hooks/useMaterials";
import type { Material } from "@workspace/api-client-react";
import { normalizeMaterialFamilies } from "@workspace/material-families";
// S1 primitives replaced with local equivalents below

// ─── Sensory portrait data ────────────────────────────────────────────────────
// Per-family olfactive descriptions that lead the page with sensory language.
// These are editorial — written as a perfumer would speak about the material.

const FAMILY_SENSORY: Record<string, string> = {
  floral: "Full, rich, and unmistakably alive. Floral materials carry the living quality of petals — their sweetness is never synthetic, always edged with the green of stems and the warmth of pollen. In a formula, they shift every hour: lighter and more transparent at the top, deeper and more complex as they dry.",
  woody: "Dry and resonant. Woody materials provide the invisible scaffolding of a fragrance — the part you feel more than smell. Cedar lifts; sandalwood grounds; vetiver anchors. Their dusty, earthy quality gives a formula its sense of weight and duration.",
  resinous: "Warm, sweet, and ancient. Resins carry the memory of trees — the amber of trapped time, the incense of ceremony. They slow everything down: in the base, they fix other materials, extend their presence, and lend depth that reads as expensive, considered, complete.",
  animalic: "Intimate and complex. Animalic materials operate at the threshold of recognition — their musk-like warmth is simultaneously human and uncanny. At controlled doses, they make a fragrance feel like skin rather than spray.",
  citrus: "Bright, clear, and immediate. Citrus materials are the closest thing to natural light in perfumery. Transparent, effervescent, fleeting — they last perhaps fifteen minutes but make those minutes feel like the most alive part of the formula.",
  aromatic: "Medicinal and precise. Aromatic materials — lavender, rosemary, thyme — have the clean clarity of an apothecary. They read as purposeful, almost architectural in the way they define a formula's character without sentiment.",
  green: "Cold, metallic, and vegetal. Green materials are the smell of chlorophyll and cut grass — precise, unsentimental, slightly raw. Violet leaf has a metallic ozonic edge that reads as contemporary; galbanum is sharper, almost aggressive.",
  spicy: "Warm and complex, with edges. Spicy materials carry heat without burning — cardamom's cold green facet, pepper's subtle earthiness, clove's almost medicinal precision. They create contrast, waking up whatever surrounds them.",
  fresh: "Transparent and airy. Fresh materials create the impression of space — of open windows, cold air, clean water. They are not so much a smell as the absence of heaviness, the suggestion of a cleared atmosphere.",
  musk: "Skin-like and enveloping. Musks are the softest thing in perfumery — warm, close, nearly imperceptible at the threshold. They are not a smell so much as a warmth, a proximity, the suggestion of another person in the room.",
  fougere: "Structured and classic. The fougere skeleton — lavender over oakmoss, anchored by coumarin — is perfumery's most recognisable architecture. It reads as disciplined, clean, and quietly masculine.",
  chypre: "Complex and structural. Chypre materials live in contradiction: mossy and floral, cool and warm, natural and synthetic. They require commitment — a formula built around them has an argument to make and makes it clearly.",
  gourmand: "Sweet and edible. Gourmand materials create the impression of warmth and comfort — vanilla, tonka, caramel, almond. They are pleasure without apology, but require restraint: the line between delicious and suffocating is thin.",
  aquatic: "Abstract and expansive. Aquatic materials do not smell of water so much as of the memory of water — calone's oceanic melon, the cool diffusion of dihydromyrcenol. They expand a formula's apparent volume without adding weight.",
  oriental: "Warm, dense, and rich. Oriental materials — resins, spices, heavy florals — create the impression of depth and duration. They are perfumery's most maximalist vocabulary, and their complexity requires patience: they need time to open.",
};

function familySensory(family: string): string {
  const normalized = normalizeMaterialFamilies(family)[0] ?? family.toLowerCase();
  return (
    FAMILY_SENSORY[normalized] ??
    Object.entries(FAMILY_SENSORY).find(([k]) => family.toLowerCase().includes(k))?.[1] ??
    `${family} materials have a distinct olfactive character that rewards careful study. Smell the material on its own first, then trace how it behaves in a blend over time.`
  );
}

// ─── Image mapping ────────────────────────────────────────────────────────────

const FAMILY_IMAGES: Record<string, string> = {
  floral: "rose.jpg",
  woody: "vetiver.jpg",
  resinous: "resine-noire-01.jpg",
  animalic: "animal-mirror-01.jpg",
  citrus: "lait-vert-02.jpg",
  aromatic: "botanicals.jpg",
  green: "lait-vert-01.jpg",
  spicy: "spice.jpg",
  fresh: "sel-gris-01.jpg",
  musk: "petals.jpg",
  fougere: "botanicals.jpg",
  chypre: "sel-gris-01.jpg",
  gourmand: "spice.jpg",
  aquatic: "sel-gris-01.jpg",
  oriental: "resine-noire-01.jpg",
};

function familyImage(family: string): string {
  const normalized = normalizeMaterialFamilies(family)[0] ?? "";
  return (
    FAMILY_IMAGES[normalized] ??
    Object.entries(FAMILY_IMAGES).find(([k]) => family.toLowerCase().includes(k))?.[1] ??
    "botanicals.jpg"
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted ${className}`} />;
}

function CollapsibleSection({
  label,
  children,
  defaultOpen = true,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left"
        aria-expanded={open}
      >
        <p className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-muted-foreground">
          {label}
        </p>
        <ChevronDown
          size={13}
          className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Material detail content ──────────────────────────────────────────────────

function MaterialDetailContent({
  material,
  fromProject,
}: {
  material: Material;
  fromProject?: string | null;
}) {
  const img = familyImage(material.family);
  const base = import.meta.env.BASE_URL + "images/";
  const sensory = familySensory(material.family);

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 pt-6 pb-4">
        {fromProject ? (
          <>
            <Link
              href="/projects"
              data-testid="link-breadcrumb-projects"
              className="inline-flex items-center gap-1.5 font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground hover:text-foreground transition-colors"
            >
              Projects
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <Link
              href={`/projects/${fromProject}`}
              data-testid="link-breadcrumb-project"
              className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground hover:text-foreground transition-colors"
            >
              Project
            </Link>
            <span className="text-muted-foreground/40">/</span>
          </>
        ) : (
          <>
            <Link
              href="/materials"
              data-testid="link-breadcrumb-materials"
              className="inline-flex items-center gap-1.5 font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={11} /> Materials
            </Link>
            <span className="text-muted-foreground/40">/</span>
          </>
        )}
        <span className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-foreground">
          {material.name}
        </span>
      </div>

      {/* ── 1. Atmosphere hero — local implementation ─────────────── */}
      <div
        className="-mx-5 sm:-mx-8 lg:-mx-12 relative overflow-hidden border-b border-border flex flex-col justify-end"
        style={{ height: "300px" }}
      >
        <img
          src={base + img}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="relative px-5 pb-8 sm:px-8 lg:px-12">
          <p className="font-mono-ui text-[8px] uppercase tracking-[.18em] text-muted-foreground mb-3">
            {material.family} · {material.origin || "Origin not listed"}
          </p>
          <h1
            className="font-display leading-[.85] tracking-[-0.03em] text-foreground"
            style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)" }}
            data-testid="heading-material-name"
          >
            {material.name}
          </h1>
        </div>
      </div>

      {/* ── 2. Sensory portrait — leads before technical data ───────────────── */}
      <div className="mt-8 max-w-2xl">
        <p className="font-mono-ui text-[8px] uppercase tracking-[.22em] text-muted-foreground mb-4">
          Olfactive character
        </p>
        <p className="text-sm leading-7 text-foreground/75">{sensory}</p>

        {material.usageNotes && (
          <div className="mt-5 border-l-2 border-border pl-4 py-1">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-1">
              Usage notes
            </p>
            <p className="text-sm leading-6 text-foreground/70">{material.usageNotes}</p>
          </div>
        )}
      </div>

      {/* ── 3. Compact metadata bar ─────────────────────────────────────────── */}
      <div className="mt-8 flex overflow-x-auto border-t border-b border-border">
        {[
          { label: "Family", value: material.family },
          { label: "Origin", value: material.origin || "Not listed" },
          { label: "IFRA limit", value: material.ifraLimit > 0 ? `${material.ifraLimit}%` : "Not set" },
          { label: "Stock", value: material.inStock ? "In stock" : "Not in stock" },
          {
            label: "Safety",
            value: material.safetyStatus.replace("_", " "),
            highlight: material.safetyStatus !== "low",
          },
          ...(material.casNumber ? [{ label: "CAS", value: material.casNumber }] : []),
        ].map(({ label, value, highlight }, i) => (
          <div
            key={label}
            className={`shrink-0 min-w-[88px] px-4 py-4 ${i > 0 ? "border-l border-border" : ""}`}
          >
            <p className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              {label}
            </p>
            <p
              className={`mt-1 font-mono-ui text-[10px] whitespace-nowrap ${
                highlight ? "text-destructive" : "text-foreground"
              }`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ── 4. Technical sections — progressive disclosure ───────────────────── */}
      <div className="mt-2 max-w-3xl">
        {/* Section divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="h-[1px] flex-1 bg-border" />
          <p className="font-mono-ui text-[7px] uppercase tracking-[.20em] text-muted-foreground/60 shrink-0">Technical and regulatory</p>
          <div className="h-[1px] flex-1 bg-border" />
        </div>
        {/* Technical & regulatory */}
        <CollapsibleSection label="Technical and regulatory" defaultOpen={false}>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border border-border px-4 py-4">
                <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">IFRA limit</p>
                <p className="mt-2 font-mono-ui text-[14px]">
                  {material.ifraLimit > 0 ? `${material.ifraLimit}%` : "Not set"}
                </p>
                <p className="mt-1 font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground/60">
                  Cat 4 fine fragrance
                </p>
              </div>
              <div className="border border-border px-4 py-4">
                <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Safety status</p>
                <p className={`mt-2 font-mono-ui text-[11px] uppercase tracking-[.06em] ${
                  material.safetyStatus !== "low" ? "text-destructive" : "text-muted-foreground"
                }`}>
                  {material.safetyStatus.replace("_", " ")}
                </p>
              </div>
              <div className="border border-border px-4 py-4">
                <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">CAS</p>
                <p className="mt-2 font-mono-ui text-[11px]">{material.casNumber ?? "Not listed"}</p>
              </div>
            </div>

            {material.allergens.length > 0 ? (
              <div>
                <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-3">
                  Allergen notes ({material.allergens.length})
                </p>
                <div className="space-y-1">
                  {material.allergens.map((a) => (
                    <div key={a} className="flex items-center gap-3 border-l-2 border-destructive/40 pl-3 py-1">
                      <p className="text-sm text-foreground/80">{a}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground/50 leading-5">
                  Confirm against current IFRA standards and supplier documentation before use.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No allergen notes recorded for this material.</p>
            )}
          </div>
        </CollapsibleSection>

        {/* Stock & sourcing */}
        <CollapsibleSection label="Stock and sourcing" defaultOpen={false}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-border px-4 py-4">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Stock status</p>
              <p className={`mt-2 font-mono-ui text-[11px] uppercase tracking-[.1em] ${
                material.inStock ? "text-foreground" : "text-muted-foreground"
              }`}>
                {material.inStock ? "In stock" : "Not in stock"}
              </p>
            </div>
            <div className="border border-border px-4 py-4">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Supplier pricing</p>
              <p className="mt-2 font-mono-ui text-[9px] text-muted-foreground/60">
                Not tracked · cost data unavailable
              </p>
            </div>
          </div>
          <p className="mt-4 font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground/50 leading-5">
            Stock status reflects what you have recorded in the library.
          </p>
        </CollapsibleSection>
      </div>

      {/* ── 5. Library links ─────────────────────────────────────────────────── */}
      <div className="border-t border-border mt-8 py-6">
        <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground mb-4">
          In your library
        </p>
        <div className="flex flex-wrap gap-6">
          <Link
            href={`/formulas?search=${encodeURIComponent(material.name)}`}
            data-testid="link-material-formulas"
            className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline"
          >
            Search formulas with this material →
          </Link>
          <Link
            href="/materials"
            data-testid="link-material-back-library"
            className="font-mono-ui text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to library →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MaterialDetail() {
  const params = useParams<{ id: string }>();
  const search = useSearch();
  const materialId = Number(params.id);

  // Parse referrer context — ?from=proj-01 carries project id through
  const fromProject = new URLSearchParams(search).get("from") ?? null;

  const query = useMaterials();
  const material = query.data?.find((m) => m.id === materialId);

  if (query.isLoading) {
    return (
      <div className="py-10 space-y-6 animate-fade-in">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-16 w-full" />
        <div className="space-y-4 max-w-2xl">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-2xl">Could not load materials.</p>
        <button
          onClick={() => query.refetch()}
          className="mt-4 border border-border px-4 py-2 font-mono-ui text-[9px] uppercase tracking-widest hover:bg-secondary"
          data-testid="button-retry-materials"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="py-20 text-center">
        <p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground mb-4">
          Material not found
        </p>
        <h1 className="font-display text-4xl">This material isn&apos;t in the library.</h1>
        <div className="mt-6">
          <Link
            href="/materials"
            className="font-mono-ui text-[9px] uppercase tracking-widest underline-offset-4 hover:underline"
            data-testid="link-back-materials"
          >
            Back to materials
          </Link>
        </div>
      </div>
    );
  }

  return <MaterialDetailContent material={material} fromProject={fromProject} />;
}
