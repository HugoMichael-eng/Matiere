/**
 * Studio — creative front door for authenticated workspace.
 * MATIÈRE dark cinematic: image-led, restrained type, dark ground.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useGetDashboardSummary, useListFormulas } from "@workspace/api-client-react";
import { DEMO_PROJECTS } from "../data/projects";

// ─── Utilities ────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted/40 ${className}`} />;
}

function relativeDate(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86_400_000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ─── Work item type ───────────────────────────────────────────────────────────

type WorkType = "MOD" | "EVALUATION" | "CANVAS" | "MATERIAL";

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
      items.push({ id: `mod-${p.id}`, type: "MOD", title: `MOD ${String(p.modCount).padStart(2, "0")}`, subtitle: p.name, date: p.updatedAt, href: `/projects/${p.id}` });
    }
    if (p.evaluations[0]) {
      const ev = p.evaluations[0];
      items.push({ id: `eval-${ev.id}`, type: "EVALUATION", title: ev.modLabel, subtitle: p.name, date: ev.date, href: `/projects/${p.id}` });
    }
    if (p.inspiration.filter(i => i.type === "image").length > 0) {
      items.push({ id: `canvas-${p.id}`, type: "CANVAS", title: p.name, subtitle: `${p.inspiration.length} references`, date: p.createdAt, href: `/projects/${p.id}/inspiration` });
    }
  }
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7);
}

// ─── Row — dark, restrained ───────────────────────────────────────────────────

const rowBase = [
  "group flex min-w-0 items-center gap-5",
  "border-t py-4 sm:py-5",
  "-mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12",
  "transition-colors duration-150 hover:bg-white/[0.02]",
  "focus-visible:outline-none",
].join(" ");

function WorkRow({ item, index }: { item: WorkItem; index: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: 0.05 + index * 0.04 }}>
      <Link href={item.href} data-testid={`link-recent-work-${item.id}`} className={rowBase}>
        <div className="w-20 shrink-0 hidden sm:block">
          <span className="font-mono-ui text-[7px] uppercase tracking-[.18em] text-muted-foreground/35">{item.type}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="sm:hidden font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground/35 mb-0.5">{item.type}</p>
          <p className="text-sm text-foreground/75 leading-tight">{item.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground/40">{item.subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono-ui text-[7px] text-muted-foreground/30">{relativeDate(item.date)}</span>
          <ArrowRight size={9} strokeWidth={1.5} className="text-muted-foreground/20 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground/40" />
        </div>
      </Link>
    </motion.div>
  );
}

function ProjectRow({ project, index }: { project: (typeof DEMO_PROJECTS)[0]; index: number }) {
  const BASE = import.meta.env.BASE_URL + "images/";
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: 0.05 + index * 0.05 }}>
      <Link href={`/projects/${project.id}`} data-testid={`link-studio-project-${project.id}`} className={rowBase}>
        <div className="hidden sm:block shrink-0 w-12 h-12 overflow-hidden">
          <img
            src={BASE + (project.heroImage?.replace("/images/", "") ?? project.coverImage?.replace("/images/", "") ?? "sel-gris-01.jpg")}
            alt=""
            aria-hidden
            className="w-full h-full object-cover opacity-40 transition-opacity duration-200 group-hover:opacity-70"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground/80 leading-tight">{project.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground/35 leading-tight line-clamp-1">{project.olfactiveDirection}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono-ui text-[7px] uppercase tracking-[.12em] text-muted-foreground/25">{project.status}</span>
          <ArrowRight size={9} strokeWidth={1.5} className="text-muted-foreground/20 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground/40" />
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Canvas preview — dark composition ───────────────────────────────────────

function CanvasPreview({ projectId }: { projectId: string }) {
  const BASE = import.meta.env.BASE_URL + "images/";
  const lv = DEMO_PROJECTS.find(p => p.id === "proj-03") ?? DEMO_PROJECTS[0];
  const sg = DEMO_PROJECTS.find(p => p.id === "proj-01") ?? DEMO_PROJECTS[1];

  return (
    <Link
      href={`/projects/${projectId}/inspiration`}
      data-testid="link-studio-canvas"
      className="group relative block focus-visible:outline-none"
      aria-label="Enter canvas"
    >
      <div
        className="relative w-full overflow-hidden bg-card"
        style={{ height: "clamp(280px, 40vw, 480px)" }}
      >
        {/* Large image — left dominant */}
        <div className="absolute top-0 left-0 overflow-hidden" style={{ width: "54%", height: "87%", zIndex: 1 }}>
          <img
            src={BASE + "lait-vert-01.jpg"}
            alt="" loading="lazy"
            className="w-full h-full object-cover opacity-60 transition-all duration-700 group-hover:opacity-75 group-hover:scale-[1.02]"
          />
        </div>
        {/* Offset portrait */}
        <div className="absolute overflow-hidden" style={{ top: "8%", left: "37%", width: "30%", height: "60%", zIndex: 2 }}>
          <img src={BASE + "lait-vert-02.jpg"} alt="" loading="lazy" className="w-full h-full object-cover opacity-70" />
        </div>
        {/* Small anchor */}
        <div className="absolute overflow-hidden" style={{ bottom: 0, left: "6%", width: "18%", height: "28%", zIndex: 3 }}>
          <img src={lv.heroImage?.replace("/images/", "") ? BASE + lv.heroImage.replace("/images/", "") : BASE + "sel-gris-01.jpg"} alt="" loading="lazy" className="w-full h-full object-cover opacity-50" />
        </div>
        {/* Text object */}
        <div className="absolute select-none" style={{ top: "7%", right: "3%", maxWidth: "200px", zIndex: 4 }}>
          <p className="font-display leading-[.88] tracking-[-0.02em] text-foreground/70" style={{ fontSize: "clamp(1.1rem, 2.2vw, 1.8rem)" }}>
            Not botanical.<br />Architectural green.
          </p>
        </div>
        {/* Material object */}
        <div className="absolute border bg-background/90 px-3 py-2" style={{ bottom: "9%", right: "3%", zIndex: 5, minWidth: "150px", borderColor: "hsl(20 6% 16%)" }}>
          <p className="font-mono-ui text-[6px] uppercase tracking-[.18em] text-muted-foreground/50">Material</p>
          <p className="mt-0.5 font-display text-sm text-foreground/80">Violet Leaf Absolute</p>
          <p className="mt-0.5 font-mono-ui text-[6px] uppercase text-muted-foreground/40">Green · wet leaf</p>
        </div>
        {/* Direction marker */}
        <div className="absolute border-l-2 border-accent bg-background/80 px-2.5 py-1.5" style={{ bottom: "9%", left: "28%", zIndex: 5 }}>
          <p className="font-mono-ui text-[6px] uppercase tracking-[.14em] text-muted-foreground/50">Direction</p>
          <p className="mt-0.5 font-mono-ui text-[7px] text-foreground/60">Green · mineral skin</p>
        </div>
        {/* SVG connection line */}
        <svg className="pointer-events-none absolute inset-0 opacity-40" style={{ width: "100%", height: "100%", zIndex: 6 }} aria-hidden>
          <circle cx="40%" cy="76%" r="2.5" fill="hsl(68 80% 48%)" />
          <circle cx="54%" cy="76%" r="2.5" fill="hsl(68 80% 48%)" />
          <line x1="40%" y1="76%" x2="54%" y2="76%" stroke="hsl(20 6% 25%)" strokeWidth="0.5" strokeDasharray="2 3" />
        </svg>
        {/* Hover CTA */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ zIndex: 10 }}>
          <div className="bg-foreground/90 text-background px-5 py-2.5 font-mono-ui text-[8px] uppercase tracking-[.22em] inline-flex items-center gap-2">
            Enter Canvas <ArrowRight size={8} strokeWidth={1.5} />
          </div>
        </div>
        {/* Unused ref to sg to avoid lint */}
        <span className="hidden">{sg.id}</span>
      </div>
    </Link>
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

  const focusProject = DEMO_PROJECTS.find(p => p.id === FOCUS_PROJECT_ID) ?? DEMO_PROJECTS[0];
  const activeProjects = DEMO_PROJECTS.filter(p => p.status === "active")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);
  const recentWork = useMemo(() => buildRecentWork(), []);
  const recentFormulas = (formulasQuery.data ?? summaryQuery.data?.recentFormulas ?? []).slice(0, 3);
  const BASE = import.meta.env.BASE_URL + "images/";

  if (summaryQuery.isLoading) {
    return (
      <div className="animate-fade-in pt-10 space-y-8">
        <Skeleton className="h-[320px] w-full" />
        <div className="space-y-3 pt-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in overflow-x-hidden">

      {/* ── CURRENT FOCUS — full-bleed cinematic hero ───────────── */}
      <motion.section
        data-testid="studio-hero"
        className="-mx-5 sm:-mx-8 lg:-mx-12 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ minHeight: "clamp(340px, 46vw, 520px)" }}
      >
        {/* Background image — project hero */}
        <div className="absolute inset-0">
          <img
            src={BASE + (focusProject.heroImage?.replace("/images/", "") ?? "lait-vert-01.jpg")}
            alt=""
            aria-hidden
            className="h-full w-full object-cover opacity-40"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, hsl(20 8% 6% / 0.95) 0%, hsl(20 8% 6% / 0.5) 60%, hsl(20 8% 6% / 0.2) 100%)" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, hsl(20 8% 6% / 0.8) 0%, transparent 60%)" }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-end px-5 pb-10 pt-16 sm:px-8 lg:px-12">
          <motion.p
            className="font-mono-ui text-[7px] uppercase tracking-[.36em] text-muted-foreground/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            {greeting}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mt-5 font-mono-ui text-[7px] uppercase tracking-[.26em] text-muted-foreground/40">
              Current project
            </p>
            <h1
              data-testid="heading-studio"
              className="mt-1.5 font-display tracking-[-0.04em] leading-[.88] text-foreground"
              style={{ fontSize: "clamp(2.8rem, 6vw, 5.5rem)" }}
            >
              {focusProject.name}
            </h1>
            <p className="mt-2 font-mono-ui text-[7px] uppercase tracking-[.18em] text-muted-foreground/45">
              {focusProject.olfactiveDirection}
            </p>
            {focusProject.creativeStatement && (
              <p
                className="mt-4 font-display leading-[.92] text-foreground/40"
                style={{ fontSize: "clamp(1.1rem, 2.2vw, 1.8rem)" }}
              >
                {focusProject.creativeStatement}
              </p>
            )}
            <div className="mt-6">
              <Link
                href={`/projects/${focusProject.id}`}
                data-testid="link-studio-continue"
                className="group inline-flex items-center gap-2.5 font-mono-ui text-[9px] uppercase tracking-[.22em] text-foreground/40 hover:text-foreground/80 transition-colors"
              >
                Continue project
                <ArrowRight size={9} strokeWidth={1.5} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── CANVAS PREVIEW ──────────────────────────────────────── */}
      <motion.section
        className="pt-10 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.22 }}
        data-testid="section-inspiration-preview"
      >
        <div className="flex items-end justify-between mb-4">
          <p className="font-mono-ui text-[7px] uppercase tracking-[.28em] text-muted-foreground/50">
            Current canvas · {focusProject.name}
          </p>
          <Link
            href={`/projects/${focusProject.id}/inspiration`}
            data-testid="link-studio-moodboards"
            className="font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground/40 hover:text-foreground/70 transition-colors inline-flex items-center gap-1.5"
          >
            Enter <ArrowRight size={8} strokeWidth={1.5} />
          </Link>
        </div>
        <CanvasPreview projectId={focusProject.id} />
      </motion.section>

      {/* ── PROJECTS IN MOTION ───────────────────────────────────── */}
      <motion.section
        className="pt-10 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.28 }}
        data-testid="section-projects-in-motion"
      >
        <div className="flex items-center justify-between mb-0">
          <p className="font-mono-ui text-[7px] uppercase tracking-[.28em] text-muted-foreground/50">Projects</p>
          <Link href="/projects" data-testid="link-studio-view-projects"
            className="font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground/40 hover:text-foreground/70 transition-colors">
            View all
          </Link>
        </div>
        {activeProjects.map((p, i) => <ProjectRow key={p.id} project={p} index={i} />)}
      </motion.section>

      {/* ── RECENT WORK ─────────────────────────────────────────── */}
      <motion.section
        className="pt-10 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.34 }}
        data-testid="section-recent-work"
      >
        <p className="mb-0 font-mono-ui text-[7px] uppercase tracking-[.28em] text-muted-foreground/50">
          Recent work
        </p>
        {recentWork.map((item, i) => <WorkRow key={item.id} item={item} index={i} />)}

        {recentFormulas.length > 0 && recentWork.length < 4 && recentFormulas.map((f, i) => (
          <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: 0.08 + i * 0.04 }}>
            <Link href={`/formulas/${f.id}`} data-testid={`link-recent-formula-${f.id}`} className={rowBase}>
              <div className="w-20 shrink-0 hidden sm:block">
                <span className="font-mono-ui text-[7px] uppercase tracking-[.18em] text-muted-foreground/35">Formula</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground/75 truncate">{f.name || "Untitled"}</p>
                {f.brief && <p className="mt-0.5 text-xs text-muted-foreground/35 line-clamp-1">{f.brief}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono-ui text-[7px] text-muted-foreground/30">{relativeDate(f.updatedAt)}</span>
                <ArrowRight size={9} strokeWidth={1.5} className="text-muted-foreground/20 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.section>

      {/* ── QUICK CREATE ─────────────────────────────────────────── */}
      <motion.section
        className="border-t mt-10 pt-7 pb-8"
        style={{ borderColor: "hsl(20 6% 11%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        data-testid="section-quick-create"
      >
        <p className="mb-5 font-mono-ui text-[7px] uppercase tracking-[.28em] text-muted-foreground/40">
          Quick create
        </p>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {[
            { href: "/formulas/new", label: "New formula", testId: "link-qc-formula" },
            { href: "/materials", label: "Browse materials", testId: "link-qc-materials" },
            { href: "/files", label: "Import file", testId: "link-qc-import" },
          ].map(({ href, label, testId }) => (
            <Link key={href} href={href} data-testid={testId}
              className="group inline-flex items-center gap-2 text-sm text-foreground/35 hover:text-foreground/70 transition-colors">
              {label}
              <ArrowRight size={8} strokeWidth={1.5} className="text-muted-foreground/25 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground/15 cursor-default select-none" aria-disabled="true">
            New project
            <span className="font-mono-ui text-[6px] uppercase tracking-widest text-muted-foreground/15">Preview</span>
          </span>
        </div>
      </motion.section>

      {/* Data notice */}
      <div className="pb-4">
        <p className="font-mono-ui text-[6px] uppercase tracking-[.12em] text-muted-foreground/20 leading-5">
          Project, canvas and note data is representative. Formula and material data is live.
        </p>
      </div>
    </div>
  );
}
