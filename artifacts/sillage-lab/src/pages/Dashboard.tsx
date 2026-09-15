import { useMemo, useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useGetActivity, useGetDashboardSummary, useListFormulas } from "@workspace/api-client-react";
import type { Formula, Material } from "@workspace/api-client-react";
import { DashboardFormulaRow } from "../components/DashboardFormulaRow";
import { WorkflowNav } from "../components/WorkflowNav";
import { getCompletedWorkflowStages, getSuggestedWorkflowStage } from "../lib/workflow";
import { ErrorState } from "../components/ErrorState";
import { Skeleton } from "../components/Skeleton";
import { StatusPill } from "../components/StatusPill";
import { Shell } from "../components/Shell";
function DashboardWorkflow({ formula }: { formula?: Formula }) {
  const [, setLocation] = useLocation();
  const entryStage = getSuggestedWorkflowStage(formula);
  const completedStages = getCompletedWorkflowStages(formula);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="border-b border-border"
    >
      <div className="flex items-center justify-between px-0 pt-5 pb-3">
        <div>
          <p className="font-mono-ui text-[8px] uppercase tracking-[.28em] text-muted-foreground">The process</p>
          <p className="mt-0.5 font-mono-ui text-[10px] uppercase tracking-[.12em] text-foreground">Studio workflow</p>
        </div>
        <button
          onClick={() => setLocation(formula ? `/formulas/${formula.id}?stage=${entryStage}` : "/formulas/new")}
          data-testid="button-workflow-entry"
          className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          {formula ? `Continue ${formula.name}` : "Start a formula"} →
        </button>
      </div>
      <WorkflowNav activeStage={entryStage} formulaId={formula?.id} completedStages={completedStages} compact />
    </motion.div>
  );
}

/** Contact-sheet image tile with a monospace caption */
function ImageTile({ src, caption, objectPosition = "center" }: { src: string; caption: string; objectPosition?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col"
    >
      <div className="overflow-hidden" style={{ height: "40vh", minHeight: 220 }}>
        <img
          src={src}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
          style={{ objectPosition }}
        />
      </div>
      <p className="mt-2 font-mono-ui text-[8px] uppercase tracking-[.22em] text-muted-foreground">{caption}</p>
    </motion.div>
  );
}



// ── Dashboard: editorial formula row (minimal, hairline-rule list) ──


// ── Spotlight: cursor-glow + parallax layers ──────────────
function SpotlightCard({ formula }: { formula: Formula }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 90, damping: 18 });
  const sy = useSpring(my, { stiffness: 90, damping: 18 });

  const titleX = useTransform(sx, [0, 1], [-12, 12]);
  const titleY = useTransform(sy, [0, 1], [-6, 6]);
  const statsX = useTransform(sx, [0, 1], [7, -7]);
  const glowL = useTransform(sx, [0, 1], ["0%", "100%"]);
  const glowT = useTransform(sy, [0, 1], ["0%", "100%"]);
  const glowBg = useMotionTemplate`radial-gradient(420px circle at ${glowL} ${glowT}, hsl(var(--secondary) / 0.18) 0%, transparent 65%)`;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="border-b border-border"
    >
      <Link href={`/formulas/${formula.id}`} data-testid="link-spotlight-formula">
        <div
          ref={cardRef}
          onMouseMove={onMove}
          onMouseLeave={() => { mx.set(0.5); my.set(0.5); }}
          className="group relative overflow-hidden bg-secondary/20"
        >
          {/* Cursor glow layer */}
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: glowBg }} />

          <div className="flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
            {/* Left */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground">
                  Formula {String(formula.id).padStart(3, "0")} · most recent
                </p>
                <StatusPill value={formula.status} />
                <StatusPill value={formula.ifraStatus} />
              </div>
              <motion.h2
                style={{ x: titleX, y: titleY }}
                className="mt-4 font-display text-[clamp(2.6rem,5.5vw,5.5rem)] leading-[.86] tracking-[-.03em] will-change-transform transition-colors duration-300 group-hover:text-accent"
              >
                {formula.name}
              </motion.h2>
              {formula.brief && (
                <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground line-clamp-2">{formula.brief}</p>
              )}
            </div>

            {/* Right: stats at opposite parallax depth */}
            <motion.div
              style={{ x: statsX }}
              className="flex shrink-0 flex-wrap items-end gap-6 lg:pb-1 will-change-transform"
            >
              <div className="text-right">
                <p className="font-display text-5xl">{formula.concentration}%</p>
                <p className="mt-0.5 font-mono-ui text-[9px] uppercase text-muted-foreground">{formula.totalMl} ml batch</p>
              </div>
              <div className="border-l border-border pl-6">
                <p className="font-display text-5xl">{formula.ingredients.length}</p>
                <p className="mt-0.5 font-mono-ui text-[9px] uppercase text-muted-foreground">materials</p>
              </div>
              <motion.div
                className="flex items-center gap-1.5 pb-1 font-mono-ui text-[10px] uppercase tracking-widest transition-colors group-hover:text-accent"
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                Continue <ArrowUpRight size={13} />
              </motion.div>
            </motion.div>
          </div>

          {/* Ingredient strip — each cell lights up individually */}
          {formula.ingredients.length > 0 && (
            <div className="flex border-t border-border">
              {formula.ingredients.slice(0, 6).map((ing, i) => (
                <motion.div
                  key={i}
                  whileHover={{ backgroundColor: "hsl(var(--secondary) / 0.5)" }}
                  className={`flex-1 px-3 py-3 min-w-0 ${i > 0 ? "border-l border-border" : ""}`}
                >
                  <p className="truncate font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">{ing.materialName}</p>
                  <p className="mt-0.5 font-mono-ui text-[9px] text-foreground">{ing.grams}g</p>
                </motion.div>
              ))}
              {formula.ingredients.length > 6 && (
                <div className="border-l border-border px-3 py-3">
                  <p className="font-mono-ui text-[8px] text-muted-foreground">+{formula.ingredients.length - 6}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// StageTrack removed — dashboard uses editorial list layout instead.

// ── Scent of the day: full-width hero with cursor glow + parallax ──
function MaterialHero({ material }: { material: Material }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 90, damping: 18 });
  const sy = useSpring(my, { stiffness: 90, damping: 18 });

  const nameX = useTransform(sx, [0, 1], [-14, 14]);
  const nameY = useTransform(sy, [0, 1], [-6, 6]);
  const statsX = useTransform(sx, [0, 1], [8, -8]);
  const glowL = useTransform(sx, [0, 1], ["0%", "100%"]);
  const glowT = useTransform(sy, [0, 1], ["0%", "100%"]);
  const glowBg = useMotionTemplate`radial-gradient(520px circle at ${glowL} ${glowT}, hsl(var(--secondary) / 0.22) 0%, transparent 62%)`;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };

  const stripItems = [
    { label: "Family", value: material.family },
    { label: "Origin", value: material.origin },
    { label: "IFRA limit", value: `${material.ifraLimit}%` },
    { label: "Stock", value: material.inStock ? "In stock" : "To source" },
    { label: "Allergens", value: material.allergens.length > 0 ? material.allergens.length.toString() : "None flagged" },
    ...(material.casNumber ? [{ label: "CAS", value: material.casNumber }] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className="border-b border-border"
    >
      <Link href={`/materials/${material.id}`} data-testid="link-material-hero">
        <div
          ref={cardRef}
          onMouseMove={onMove}
          onMouseLeave={() => { mx.set(0.5); my.set(0.5); }}
          className="group relative overflow-hidden bg-secondary/20"
        >
          {/* Background leaves image */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <img
              src={`${import.meta.env.BASE_URL}images/leaves.jpg`}
              alt=""
              className="h-full w-full object-cover opacity-[0.08] mix-blend-luminosity grayscale"
            />
          </div>
          {/* Cursor glow */}
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: glowBg }} />

          {/* Main section */}
          <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
            {/* Left: name + meta + notes */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground">Scent of the day</p>
                <StatusPill value={material.safetyStatus} />
              </div>
              <motion.h2
                style={{ x: nameX, y: nameY }}
                className="mt-4 font-display text-[clamp(3rem,6.5vw,7.5rem)] leading-[.82] tracking-[-.03em] will-change-transform transition-colors duration-300 group-hover:text-accent"
              >
                {material.name}
              </motion.h2>
              <p className="mt-3 font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                {material.family} · {material.origin}
              </p>
              {material.usageNotes && (
                <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground line-clamp-2">{material.usageNotes}</p>
              )}
            </div>

            {/* Right: IFRA + allergen count at opposite parallax depth */}
            <motion.div
              style={{ x: statsX }}
              className="flex shrink-0 flex-col gap-5 lg:items-end lg:pb-1 will-change-transform"
            >
              <div className="flex flex-wrap items-end gap-6">
                <div className="text-right">
                  <p className="font-display text-5xl">{material.ifraLimit}%</p>
                  <p className="mt-0.5 font-mono-ui text-[9px] uppercase text-muted-foreground">IFRA limit</p>
                </div>
                <div className="border-l border-border pl-6 text-right">
                  <p className="font-display text-5xl">{material.allergens.length}</p>
                  <p className="mt-0.5 font-mono-ui text-[9px] uppercase text-muted-foreground">allergen{material.allergens.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <motion.div
                className="flex items-center gap-1.5 font-mono-ui text-[10px] uppercase tracking-widest transition-colors group-hover:text-accent"
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                Browse library <ArrowUpRight size={13} />
              </motion.div>
            </motion.div>
          </div>

          {/* Metadata strip */}
          <div className="flex border-t border-border overflow-x-auto">
            {stripItems.map(({ label, value }, i) => (
              <motion.div
                key={label}
                whileHover={{ backgroundColor: "hsl(var(--secondary) / 0.5)" }}
                className={`flex-1 min-w-[80px] px-4 py-3 ${i > 0 ? "border-l border-border" : ""}`}
              >
                <p className="whitespace-nowrap font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="mt-0.5 truncate font-mono-ui text-[9px] text-foreground">{value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// QuickPrompt kept for backwards-compat reference; Dashboard uses DashboardHero instead.

export function Dashboard() {
  const summaryQuery = useGetDashboardSummary();
  const formulasQuery = useListFormulas();
  const activityQuery = useGetActivity({ limit: 6 });

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "GOOD MORNING" : h < 18 ? "GOOD AFTERNOON" : "GOOD EVENING";
  }, []);

  const summary = summaryQuery.data;

  // ── Loading state ────────────────────────────────────────────
  if (summaryQuery.isLoading) return (
    <Shell>
      <div className="py-16 space-y-10 max-w-2xl">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-px w-full" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
    </Shell>
  );
  if (summaryQuery.isError || !summary) return <Shell><ErrorState retry={() => summaryQuery.refetch()} /></Shell>;

  const allFormulas = formulasQuery.data ?? summary.recentFormulas;
  const inProgress = allFormulas.filter(f => f.status === "draft" || f.status === "resting");
  const recentFormulas = summary.recentFormulas;
  const hasFormulas = summary.formulaCount > 0;
  const continueTarget = inProgress[0] ?? recentFormulas[0];

  return (
    <Shell>
      {/* ── HERO: greeting + continue action ────────────────────── */}
      <motion.section
        className="-mx-5 sm:-mx-8 lg:-mx-12 border-b border-border bg-background px-5 py-12 sm:px-8 sm:py-14 lg:px-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        data-testid="dashboard-hero"
      >
        <motion.p
          className="font-mono-ui text-[8px] uppercase tracking-[.36em] text-muted-foreground"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.04 }}
        >
          {greeting}
        </motion.p>
        <motion.h1
          data-testid="heading-dashboard-greeting"
          className="mt-3 font-display leading-[.88] tracking-[-0.04em] text-foreground"
          style={{ fontSize: "clamp(2.6rem, 7vw, 5.5rem)" }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          Formula Library.
        </motion.h1>

        {/* ── PRIMARY ACTION: continue or create ────────────────── */}
        {hasFormulas && continueTarget ? (
          <motion.div
            className="mt-10 border-t border-border pt-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.18 }}
          >
            <p className="font-mono-ui text-[8px] uppercase tracking-[.28em] text-muted-foreground mb-5">
              {inProgress.length > 0
                ? `${String(inProgress.length).padStart(2, "0")} formula${inProgress.length !== 1 ? "s" : ""} in progress`
                : "Continue"}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <Link
                href={`/formulas/${continueTarget.id}`}
                data-testid="link-dashboard-continue"
                className="group flex items-baseline gap-4"
              >
                <span className="font-display text-[clamp(1.5rem,3.5vw,2.6rem)] leading-tight tracking-[-0.03em] text-foreground transition-opacity group-hover:opacity-60">
                  {continueTarget.name || "Untitled"}
                  {continueTarget.id && (
                    <span className="ml-3 font-mono-ui text-[9px] font-normal uppercase tracking-[.18em] text-muted-foreground align-middle">
                      / {String(continueTarget.id).padStart(3, "0")}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-mono-ui text-[10px] uppercase tracking-[.22em] text-muted-foreground transition-all group-hover:text-foreground group-hover:translate-x-1">
                  Continue →
                </span>
              </Link>
            </div>
            <div className="mt-7 border-t border-border pt-5">
              <Link
                href="/formulas/new"
                data-testid="button-new-formula"
                className="group inline-flex items-center gap-3 font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground transition-colors hover:text-foreground"
              >
                New formula
                <Plus size={14} strokeWidth={1.5} className="transition-transform group-hover:rotate-90" />
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="mt-10 border-t border-border pt-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.18 }}
          >
            <p className="font-mono-ui text-[8px] uppercase tracking-[.28em] text-muted-foreground mb-6">
              Begin here
            </p>
            <div className="flex flex-col gap-0 sm:flex-row sm:gap-0">
              {[
                { label: "Start with an idea", href: "/formulas/new", testId: "link-start-idea" },
                { label: "Explore materials", href: "/materials", testId: "link-explore-materials" },
                { label: "Formula library", href: "/formulas", testId: "link-browse-formulas" },
              ].map(({ label, href, testId }, i) => (
                <Link
                  key={href}
                  href={href}
                  data-testid={testId}
                  className={`group flex items-center justify-between py-4 font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground transition-colors hover:text-foreground sm:flex-col sm:items-start sm:pr-10 ${i > 0 ? "border-t border-border sm:border-t-0 sm:border-l sm:pl-8" : ""}`}
                >
                  <span>{label}</span>
                  <ArrowRight size={10} className="sm:mt-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </motion.section>

      {/* ── RECENT FORMULAS — editorial list ───────────────────── */}
      {hasFormulas && (
        <motion.section
          className="py-10"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          data-testid="section-recent-formulas"
        >
          <div className="flex items-center justify-between pb-2">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.3em] text-muted-foreground">
              RECENT
            </p>
            <Link
              href="/formulas"
              data-testid="link-view-all-formulas"
              className="font-mono-ui text-[8px] uppercase tracking-[.22em] text-muted-foreground transition-colors hover:text-foreground"
            >
              View all &rarr;
            </Link>
          </div>
          {/* List */}
          {recentFormulas.length > 0 ? (
            <div>
              {recentFormulas.slice(0, 8).map((formula, i) => (
                <DashboardFormulaRow key={formula.id} formula={formula} index={i} />
              ))}
            </div>
          ) : (
            <div className="border-t border-border py-14 text-center">
              <p className="font-display text-2xl text-muted-foreground/50">No formulas yet.</p>
            </div>
          )}
        </motion.section>
      )}

      {/* ── SUPPORTING TOOLS — minimal secondary strip ──────────── */}
      <motion.section
        className="border-t border-border py-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.28 }}
        data-testid="section-tools"
      >
        <p className="mb-6 font-mono-ui text-[8px] uppercase tracking-[.3em] text-muted-foreground">STUDIO TOOLS</p>
        <div className="grid grid-cols-1 border-b border-border sm:grid-cols-3">
          {[
            { label: "Materials", sub: `${summary.materialCount} in library`, href: "/materials", testId: "link-tool-materials" },
            { label: "IFRA", sub: summary.reviewCount > 0 ? `${summary.reviewCount} need review` : "Review formula safety", href: "/formulas?status=resting", testId: "link-tool-ifra" },
            { label: "Import", sub: "File drawer", href: "/files", testId: "link-tool-files" },
          ].map(({ label, sub, href, testId }, index) => (
            <Link
              key={href}
              href={href}
              data-testid={testId}
              className={`group flex items-end justify-between border-t border-border py-5 transition-colors hover:text-accent sm:px-5 ${index === 0 ? "sm:pl-0" : "sm:border-l"} ${index === 2 ? "sm:pr-0" : ""}`}
            >
              <div>
                <p className="font-display text-xl uppercase tracking-[-0.01em]">{label}</p>
                <p className="mt-1 font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">{sub}</p>
              </div>
              <ArrowRight size={12} strokeWidth={1.5} className="mb-1 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-accent" />
            </Link>
          ))}
        </div>
      </motion.section>

      {/* ── ACTIVITY LOG — quiet, collapsible feel ───────────────── */}
      {(activityQuery.data?.length ?? 0) > 0 && (
        <motion.section
          className="border-t border-border pb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          data-testid="section-activity"
        >
          <p className="py-6 font-mono-ui text-[8px] uppercase tracking-[.3em] text-muted-foreground">STUDIO LOG</p>
          {activityQuery.data!.slice(0, 6).map((ev, i) => (
            <div
              key={ev.id}
              data-testid={`row-activity-${ev.id}`}
              className="grid grid-cols-[80px_1fr] items-baseline gap-4 border-t border-border py-3 sm:grid-cols-[80px_1fr_140px]"
            >
              <p className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/50">
                {new Date(ev.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
              <p className="text-xs text-foreground/80">{ev.summary}</p>
              <p className="hidden font-mono-ui text-[8px] text-muted-foreground truncate sm:block">{ev.formulaName}</p>
            </div>
          ))}
        </motion.section>
      )}
    </Shell>
  );
}


export default Dashboard;
