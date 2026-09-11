import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams } from "wouter";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useListMaterials } from "@workspace/api-client-react";
import type { Material } from "@workspace/api-client-react";
import { normalizeMaterialFamilies } from "@workspace/material-families";

// Image mapping by family — same lookup used by MaterialCard
const FAMILY_IMAGES: Record<string, string> = {
  floral: "rose.jpg",
  woody: "vetiver.jpg",
  resinous: "resin.jpg",
  "animalic": "resin.jpg",
  citrus: "flower.jpg",
  aromatic: "botanicals.jpg",
  green: "leaves.jpg",
  spicy: "spice.jpg",
  "fresh": "hero-droplets.jpg",
  musk: "petals.jpg",
  fougere: "botanicals.jpg",
  chypre: "flower.jpg",
  gourmand: "spice.jpg",
  aquatic: "hero-droplets.jpg",
  "oriental": "amber.jpg",
};

function familyImage(family: string): string {
  const normalized = normalizeMaterialFamilies(family)[0] ?? "";
  return (
    FAMILY_IMAGES[normalized] ??
    Object.entries(FAMILY_IMAGES).find(([k]) => family.toLowerCase().includes(k))?.[1] ??
    "botanicals.jpg"
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted ${className}`} />;
}

function SafetyBadge({ status }: { status: string }) {
  const ok = status === "low" || status === "clear";
  return (
    <span
      className={`font-mono-ui text-[8px] uppercase tracking-[.1em] ${
        ok ? "text-muted-foreground" : "text-destructive"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function Section({
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
      >
        <p className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-muted-foreground">
          {label}
        </p>
        <ChevronDown
          size={13}
          className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
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

function MaterialDetailContent({ material }: { material: Material }) {
  const img = familyImage(material.family);
  const base = import.meta.env.BASE_URL + "images/";

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 pt-6 pb-4">
        <Link
          href="/materials"
          data-testid="link-breadcrumb-materials"
          className="inline-flex items-center gap-1.5 font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={11} /> Materials
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-foreground">
          {material.name}
        </span>
      </div>

      {/* Hero */}
      <div className="relative -mx-5 sm:-mx-8 lg:-mx-12 overflow-hidden border-b border-border">
        <div className="relative" style={{ height: "280px" }}>
          <img
            src={base + img}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-30 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 px-5 pb-8 sm:px-8 lg:px-12">
          <p className="font-mono-ui text-[8px] uppercase tracking-[.28em] text-muted-foreground">
            {material.family} · {material.origin}
          </p>
          <h1
            className="mt-2 font-display leading-[.85] tracking-[-0.03em]"
            style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}
            data-testid="heading-material-name"
          >
            {material.name}
          </h1>
        </div>
      </div>

      {/* Metadata strip */}
      <div className="flex overflow-x-auto border-b border-border">
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
            className={`shrink-0 min-w-[90px] px-4 py-4 ${i > 0 ? "border-l border-border" : ""}`}
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

      {/* Main content — progressive disclosure */}
      <div className="mt-2 max-w-3xl">
        {/* Olfactive profile */}
        <Section label="Olfactive profile">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-2">Family</p>
              <p className="text-sm">{material.family}</p>
            </div>
            <div>
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-2">Origin</p>
              <p className="text-sm">{material.origin || "Not listed"}</p>
            </div>
            {material.usageNotes && (
              <div className="sm:col-span-2">
                <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-2">
                  Usage notes
                </p>
                <p className="text-sm leading-7 text-foreground/80">{material.usageNotes}</p>
              </div>
            )}
          </div>
        </Section>

        {/* Technical & regulatory */}
        <Section label="Technical & regulatory" defaultOpen={false}>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border border-border px-4 py-4">
                <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">
                  IFRA limit
                </p>
                <p className="mt-2 font-mono-ui text-[14px]">
                  {material.ifraLimit > 0 ? `${material.ifraLimit}%` : "Not set"}
                </p>
                <p className="mt-1 font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground/60">
                  Cat 4 fine fragrance
                </p>
              </div>
              <div className="border border-border px-4 py-4">
                <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">
                  Safety status
                </p>
                <div className="mt-2">
                  <SafetyBadge status={material.safetyStatus} />
                </div>
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
        </Section>

        {/* Practical usage */}
        <Section label="Stock & sourcing" defaultOpen={false}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-border px-4 py-4">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Stock status</p>
              <p className={`mt-2 font-mono-ui text-[11px] uppercase tracking-[.1em] ${material.inStock ? "text-foreground" : "text-muted-foreground"}`}>
                {material.inStock ? "In stock" : "Not in stock"}
              </p>
            </div>
            <div className="border border-border px-4 py-4">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">
                Supplier pricing
              </p>
              <p className="mt-2 font-mono-ui text-[9px] text-muted-foreground/60">
                Not tracked · cost data unavailable
              </p>
            </div>
          </div>
          <p className="mt-4 font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground/50 leading-5">
            Stock status reflects what you have recorded in the library. Pricing data is not currently available.
          </p>
        </Section>
      </div>

      {/* Search formulas that might use this */}
      <div className="border-t border-border mt-8 py-6">
        <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground mb-3">
          In your library
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/formulas?search=${encodeURIComponent(material.name)}`}
            data-testid="link-material-formulas"
            className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline"
          >
            Search formulas with this material →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function MaterialDetail() {
  const params = useParams<{ id: string }>();
  const materialId = Number(params.id);

  // No individual material endpoint — find from the list
  const query = useListMaterials();
  const material = query.data?.find((m) => m.id === materialId);

  if (query.isLoading) {
    return (
      <div className="py-10 space-y-6 animate-fade-in">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-4 max-w-2xl">
          <Skeleton className="h-32" />
          <Skeleton className="h-24" />
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
        <h1 className="font-display text-4xl">This material isn't in the library.</h1>
        <div className="mt-6">
          <Link
            href="/materials"
            className="font-mono-ui text-[9px] uppercase tracking-widest underline-offset-4 hover:underline"
            data-testid="link-back-materials"
          >
            ← Back to materials
          </Link>
        </div>
      </div>
    );
  }

  return <MaterialDetailContent material={material} />;
}
