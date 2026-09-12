/**
 * Studio — creative front door.
 * MATIÈRE redesign: bright gallery white, editorial composition, spatial canvas preview.
 * FROM WORLD → TO SCENT.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useGetDashboardSummary, useListFormulas } from "@workspace/api-client-react";
import { DEMO_PROJECTS } from "../data/projects";

// ─── Utilities ────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted ${className}`} />;
}

function relativeDate(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86_400_000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ─── Types ────────────────────────────────────────────────────────────────────

type WorkType = "MOD" | "EVALUATION" | "INSPIRATION" | "MATERIAL";

interface WorkItem {
  id: string;
  type: WorkType;
  title: string;
  subtitle: string;
  date: string;
  href: string;
}

function buildRecentWork(): WorkItem[] {
  const items: WorkItem[] = [];
  for (const p of DEMO_PROJECTS) {
    if (p.modCount > 0) {
      items.push({
        id: `mod-${p.id}`,
        type: "MOD",
        title: `MOD ${String(p.modCount).padStart(2, "0")}`,
        subtitle: p.name,
        date: p.updatedAt,
        href: `/projects/${p.id}`,
      });
    }
    if (p.evaluations[0]) {
      const ev = p.evaluations[0];
      items.push({
        id: `eval-${ev.id}`,
        type: "EVALUATION",
        title: ev.modLabel,
        subtitle: p.name,
        date: ev.date,
        href: `/projects/${p.id}`,
      });
    }
    if (p.inspiration.filter((i) => i.type === "image").length > 0) {
      items.push({
        id: `insp-${p.id}`,
        type: "INSPIRATION",
        title: p.name,
        subtitle: `${p.inspiration.length} references`,
        date: p.createdAt,
        href: `/projects/${p.id}/inspiration`,
      });
    }
    const matNote = p.notes.find((n) => n.tag === "material direction" || n.tag === "direction");
    if (matNote && p.linkedMaterialNames[0]) {
      items.push({
        id: `mat-${p.id}`,
        type: "MATERIAL",
        title: p.linkedMaterialNames[0],
        subtitle: "Note updated",
        date: matNote.createdAt,
        href: `/materials`,
      });
    }
  }
  return items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);
}

// ─── Row shared style ─────────────────────────────────────────────────────────

const rowCls = [
  "group flex min-w-0 items-start gap-5",
  "border-t border-border py-4 sm:py-5",
  "-mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12",
  "transition-colors duration-150",
  "hover:bg-secondary/30 focus-visible:outline-none focus-visible:bg-secondary/30",
].join(" ");

// ─── Canvas preview — spatial composition ────────────────────────────────────

const BASE = import.meta.env.BASE_URL + "images/";

function CanvasPreview({ projectId }: { projectId: string }) {
  const lv = DEMO_PROJECTS.find((p) => p.id === "proj-03")!;
  const sg = DEMO_PROJECTS.find((p) => p.id === "proj-01")!;

  return (
    <Link
      href={`/projects/${projectId}/inspiration`}
      data-testid="link-studio-canvas"
      className="group relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="Enter canvas"
    >
      {/* Warm white working surface */}
      <div
        className="relative w-full overflow-hidden bg-card"
        style={{ height: "clamp(280px, 44vw, 480px)" }}
      >
        {/* Large background image — dominates left */}
        <motion.div
          className="absolute top-0 left-0 w-[54%] h-[88%] overflow-hidden"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src={lv.inspiration.find((i) => i.type === "image" && i.src)?.src ?? lv.coverImage}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        </motion.div>

        {/* Portrait image — overlapping right */}
        <div className="absolute top-[8%] left-[36%] w-[26%] h-[65%] overflow-hidden" style={{ zIndex: 2 }}>
          <img
            src={lv.coverImage}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Small texture image — bottom left anchor */}
        <div className="absolute bottom-0 left-[6%] w-[18%] h-[32%] overflow-hidden" style={{ zIndex: 3 }}>
          <img
            src={sg.coverImage}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Text object — upper right, editorial scale */}
        <div
          className="absolute top-[5%] right-[4%] max-w-[200px] select-none"
          style={{ zIndex: 4 }}
        >
          <p className="font-display text-xl leading-tight text-foreground">
            Not botanical.<br />Architectural green.
          </p>
        </div>

        {/* Material object — lower right */}
        <div
          className="absolute bottom-[10%] right-[3%] border border-border bg-background/95 px-3 py-2.5"
          style={{ zIndex: 5 }}
        >
          <p className="font-mono-ui text-[6px] uppercase tracking-[.18em] text-muted-foreground">Material</p>
          <p className="mt-0.5 font-display text-sm">Violet Leaf Absolute</p>
          <p className="mt-0.5 font-mono-ui text-[6px] uppercase tracking-[.10em] text-muted-foreground">Green · wet leaf · metallic</p>
        </div>

        {/* Olfactive direction — accent border */}
        <div
          className="absolute bottom-[10%] left-[28%] bg-background/90 border-l-2 border-accent px-3 py-2"
          style={{ zIndex: 5 }}
        >
          <p className="font-mono-ui text-[6px] uppercase tracking-[.16em] text-muted-foreground">Olfactive direction</p>
          <p className="mt-0.5 font-mono-ui text-[8px] text-foreground">Green · transparent · mineral skin</p>
        </div>

        {/* CTA overlay — appears on hover */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ zIndex: 10 }}
        >
          <div className="bg-foreground/90 text-background px-5 py-3 font-mono-ui text-[9px] uppercase tracking-[.22em] inline-flex items-center gap-2">
            Enter Canvas <ArrowRight size={10} strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Project row ──────────────────────────────────────────────────────────────

function ProjectRow({ project, index }: { project: (typeof DEMO_PROJECTS)[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.05 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/projects/${project.id}`}
        data-testid={`link-studio-project-${project.id}`}
        className={rowCls}
      >
        {/* Small image — subtle visual anchor */}
        <div className="hidden sm:block shrink-0 w-14 h-14 overflow-hidden">
          <img
            src={project.coverImage}
            alt=""
            aria-hidden
            className="w-full h-full object-cover opacity-60 transition-opacity duration-200 group-hover:opacity-90"
          />
        </div>
        {/* Name + direction */}
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium leading-tight text-foreground">{project.name}</p>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{project.olfactiveDirection}</p>
          <p className="mt-1.5 font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground/50">
            MOD {String(project.modCount).padStart(2, "0")} · {relativeDate(project.updatedAt)}
          </p>
        </div>
        {/* Arrow */}
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          <span className="hidden sm:block font-mono-ui text-[8px] uppercase tracking-[.1em] text-muted-foreground/40">
            {project.status}
          </span>
          <ArrowRight
            size={11}
            strokeWidth={1.5}
            className="text-muted-foreground/25 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground/50"
          />
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Work row ─────────────────────────────────────────────────────────────────

function WorkRow({ item, index }: { item: WorkItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.06 + index * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={item.href} data-testid={`link-recent-work-${item.id}`} className={rowCls}>
        <div className="shrink-0 w-20 pt-0.5 hidden sm:block">
          <span className="font-mono-ui text-[7px] uppercase tracking-[.18em] text-muted-foreground/50">
            {item.type}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="sm:hidden font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground/50 mb-0.5">
            {item.type}
          </p>
          <p className="text-sm leading-snug text-foreground">{item.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 pt-0.5">
          <span className="font-mono-ui text-[8px] text-muted-foreground/50">{relativeDate(item.date)}</span>
          <ArrowRight
            size={11}
            strokeWidth={1.5}
            className="text-muted-foreground/25 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground/50"
          />
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const FOCUS_PROJECT_ID = "proj-03";

export function Studio() {
  const summaryQuery = useGetDashboardSummary();
  const formulasQuery = useListFormulas();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning." : h < 18 ? "Good afternoon." : "Good evening.";
  }, []);

  const focusProject =
    DEMO_PROJECTS.find((p) => p.id === FOCUS_PROJECT_ID) ?? DEMO_PROJECTS[0];

  const activeProjects = DEMO_PROJECTS.filter((p) => p.status === "active")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  const recentWork = useMemo(() => buildRecentWork(), []);
  const recentFormulas = (formulasQuery.data ?? summaryQuery.data?.recentFormulas ?? []).slice(0, 3);

  if (summaryQuery.isLoading) {
    return (
      <div className="animate-fade-in pt-10 space-y-8">
        <Skeleton className="h-[360px] w-full" />
        <div className="space-y-3 pt-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in overflow-x-hidden">

      {/* ── A. CURRENT FOCUS — editorial split hero ─────────────── */}
      <motion.section
        data-testid="studio-hero"
        className="-mx-5 sm:-mx-8 lg:-mx-12 relative overflow-hidden border-b border-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid lg:grid-cols-[1fr_1fr] min-h-[380px]">
          {/* Left — project content */}
          <div className="flex flex-col justify-end px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
            <motion.p
              className="font-mono-ui text-[8px] uppercase tracking-[.36em] text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              {greeting}
            </motion.p>
            <motion.p
              className="mt-6 font-mono-ui text-[8px] uppercase tracking-[.28em] text-muted-foreground/60"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, delay: 0.1 }}
            >
              Current project
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1
                data-testid="heading-studio"
                className="mt-2 font-display tracking-[-0.04em] leading-[.88] text-foreground"
                style={{ fontSize: "clamp(2.6rem, 6vw, 5rem)" }}
              >
                {focusProject.name}
              </h1>
              <p className="mt-3 font-mono-ui text-[8px] uppercase tracking-[.20em] text-muted-foreground max-w-sm">
                {focusProject.olfactiveDirection}
              </p>
              <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground/80 line-clamp-2">
                {focusProject.description}
              </p>
              <p className="mt-4 font-mono-ui text-[7px] uppercase tracking-[.22em] text-muted-foreground/40">
                MOD {String(focusProject.modCount).padStart(2, "0")} · {focusProject.status}
              </p>
              <Link
                href={`/projects/${focusProject.id}`}
                data-testid="link-studio-continue"
                className="group mt-7 inline-flex items-center gap-2.5 font-mono-ui text-[10px] uppercase tracking-[.22em] text-foreground/60 transition-all duration-200 hover:text-foreground hover:gap-3.5 focus-visible:outline-none focus-visible:text-foreground"
              >
                Continue project
                <ArrowRight size={11} strokeWidth={1.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </div>

          {/* Right — project image, physical and large */}
          <motion.div
            className="relative hidden lg:block overflow-hidden"
            style={{ minHeight: "380px" }}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={focusProject.coverImage}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Subtle left fade to blend with content column */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          </motion.div>
        </div>
      </motion.section>

      {/* ── B. CANVAS PREVIEW — the heart of MATIÈRE ────────────── */}
      <motion.section
        className="pt-12 pb-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.22 }}
        data-testid="section-inspiration-preview"
      >
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="font-mono-ui text-[8px] uppercase tracking-[.30em] text-muted-foreground">
              Current world
            </p>
            <h2 className="mt-1 font-display text-2xl tracking-[-0.02em] text-foreground">
              {focusProject.name}
            </h2>
          </div>
          <Link
            href={`/projects/${focusProject.id}/inspiration`}
            data-testid="link-studio-moodboards"
            className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground transition-colors hover:text-foreground inline-flex items-center gap-1.5"
          >
            Enter Canvas <ArrowRight size={9} strokeWidth={1.5} />
          </Link>
        </div>

        <CanvasPreview projectId={focusProject.id} />
      </motion.section>

      {/* ── C. PROJECTS IN MOTION ────────────────────────────────── */}
      <motion.section
        className="pt-12 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.28 }}
        data-testid="section-projects-in-motion"
      >
        <div className="flex items-center justify-between mb-1">
          <p className="font-mono-ui text-[8px] uppercase tracking-[.30em] text-muted-foreground">
            Projects in motion
          </p>
          <Link
            href="/projects"
            data-testid="link-studio-view-projects"
            className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
          </Link>
        </div>

        {activeProjects.length > 0 ? (
          activeProjects.map((p, i) => <ProjectRow key={p.id} project={p} index={i} />)
        ) : (
          <div className="border-t border-border py-8">
            <p className="text-sm text-muted-foreground">No active projects.</p>
          </div>
        )}
      </motion.section>

      {/* ── D. RECENT WORK ───────────────────────────────────────── */}
      <motion.section
        className="pt-12 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.34 }}
        data-testid="section-recent-work"
      >
        <p className="mb-1 font-mono-ui text-[8px] uppercase tracking-[.30em] text-muted-foreground">
          Recent work
        </p>
        {recentWork.map((item, i) => <WorkRow key={item.id} item={item} index={i} />)}

        {/* Pad with real formula rows */}
        {recentWork.length < 3 &&
          recentFormulas.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.26, delay: 0.08 + i * 0.04 }}
            >
              <Link href={`/formulas/${f.id}`} data-testid={`link-recent-formula-${f.id}`} className={rowCls}>
                <div className="shrink-0 w-20 pt-0.5 hidden sm:block">
                  <span className="font-mono-ui text-[7px] uppercase tracking-[.18em] text-muted-foreground/50">Formula</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{f.name || "Untitled"}</p>
                  {f.brief && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{f.brief}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-3 pt-0.5">
                  <span className="font-mono-ui text-[8px] text-muted-foreground/50">{relativeDate(f.updatedAt)}</span>
                  <ArrowRight size={11} strokeWidth={1.5} className="text-muted-foreground/25 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </motion.div>
          ))}
      </motion.section>

      {/* ── E. QUICK CREATE ──────────────────────────────────────── */}
      <motion.section
        className="border-t border-border mt-12 pt-8 pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        data-testid="section-quick-create"
      >
        <p className="mb-5 font-mono-ui text-[8px] uppercase tracking-[.30em] text-muted-foreground">
          Quick create
        </p>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Link
            href="/formulas/new"
            data-testid="link-qc-formula"
            className="group inline-flex items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-foreground"
          >
            New formula
            <ArrowRight size={10} strokeWidth={1.5} className="text-muted-foreground/35 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/materials"
            data-testid="link-qc-materials"
            className="group inline-flex items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-foreground"
          >
            Browse materials
            <ArrowRight size={10} strokeWidth={1.5} className="text-muted-foreground/35 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/files"
            data-testid="link-qc-import"
            className="group inline-flex items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-foreground"
          >
            Import file
            <ArrowRight size={10} strokeWidth={1.5} className="text-muted-foreground/35 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <span
            data-testid="link-qc-project"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground/30 cursor-default select-none"
            aria-disabled="true"
            title="Not yet available — no backend Project entity"
          >
            New project
            <span className="font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground/25">Preview</span>
          </span>
        </div>
      </motion.section>

      {/* Representative honesty note */}
      <div className="border-t border-border/40 pb-4">
        <p className="pt-4 font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground/30 leading-5">
          Project, inspiration and note data is representative — local demo workspace only.
          Formula and material data is live.
        </p>
      </div>
    </div>
  );
}
