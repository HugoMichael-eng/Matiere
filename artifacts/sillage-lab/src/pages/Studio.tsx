/**
 * Studio — authenticated creative front door.
 * MATIÈRE light: warm parchment, editorial composition, image-led.
 * Matches reference: restrained, image-first, large display type, negative space.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useGetDashboardSummary, useListFormulas } from "@workspace/api-client-react";
import { DEMO_PROJECTS } from "../data/projects";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted ${className}`} />;
}

function relativeDate(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86_400_000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

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
    if (p.modCount > 0)
      items.push({ id: `mod-${p.id}`, type: "MOD", title: `MOD ${String(p.modCount).padStart(2, "0")}`, subtitle: p.name, date: p.updatedAt, href: `/projects/${p.id}` });
    if (p.evaluations[0]) {
      const ev = p.evaluations[0];
      items.push({ id: `eval-${ev.id}`, type: "EVALUATION", title: ev.modLabel, subtitle: p.name, date: ev.date, href: `/projects/${p.id}` });
    }
    if (p.inspiration.filter(i => i.type === "image").length > 0)
      items.push({ id: `canvas-${p.id}`, type: "CANVAS", title: p.name, subtitle: `${p.inspiration.length} references`, date: p.createdAt, href: `/projects/${p.id}/inspiration` });
  }
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7);
}

const rowCls = [
  "group flex min-w-0 items-center gap-5",
  "border-t border-border py-4 sm:py-5",
  "-mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12",
  "transition-colors hover:bg-secondary/40",
  "focus-visible:outline-none",
].join(" ");

function WorkRow({ item, index }: { item: WorkItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, delay: 0.05 + index * 0.04 }}
    >
      <Link href={item.href} data-testid={`link-recent-work-${item.id}`} className={rowCls}>
        <div className="w-20 shrink-0 hidden sm:block">
          <span className="font-mono-ui text-[7px] uppercase tracking-[.18em] text-muted-foreground">{item.type}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="sm:hidden font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground mb-0.5">{item.type}</p>
          <p className="text-sm text-foreground leading-tight">{item.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono-ui text-[7px] text-muted-foreground">{relativeDate(item.date)}</span>
          <ArrowRight size={9} strokeWidth={1.5} className="text-muted-foreground/40 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground" />
        </div>
      </Link>
    </motion.div>
  );
}

function ProjectRow({ project, index }: { project: (typeof DEMO_PROJECTS)[0]; index: number }) {
  const BASE = import.meta.env.BASE_URL + "images/";
  const imgFile = (project.heroImage ?? project.coverImage ?? "sel-gris-01.jpg").replace(/^.*\/images\//, "");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, delay: 0.05 + index * 0.05 }}
    >
      <Link href={`/projects/${project.id}`} data-testid={`link-studio-project-${project.id}`} className={rowCls}>
        <div className="hidden sm:block shrink-0 w-12 h-12 overflow-hidden">
          <img
            src={BASE + imgFile}
            alt=""
            aria-hidden
            className="w-full h-full object-cover opacity-70 transition-opacity duration-200 group-hover:opacity-90"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground leading-tight">{project.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-tight line-clamp-1">{project.olfactiveDirection}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono-ui text-[7px] uppercase tracking-[.12em] text-muted-foreground hidden sm:block">{project.status}</span>
          <ArrowRight size={9} strokeWidth={1.5} className="text-muted-foreground/40 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground" />
        </div>
      </Link>
    </motion.div>
  );
}

function CanvasPreview({ projectId }: { projectId: string }) {
  const BASE = import.meta.env.BASE_URL + "images/";
  return (
    <Link
      href={`/projects/${projectId}/inspiration`}
      data-testid="link-studio-canvas"
      className="group relative block focus-visible:outline-none"
      aria-label="Enter canvas"
    >
      <div className="relative w-full overflow-hidden bg-card border border-border" style={{ height: "clamp(260px, 38vw, 440px)" }}>
        {/* Dominant image — left 55% */}
        <div className="absolute top-0 left-0 overflow-hidden" style={{ width: "55%", height: "88%", zIndex: 1 }}>
          <img
            src={BASE + "lait-vert-01.jpg"}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.02]"
          />
        </div>
        {/* Offset portrait — right side */}
        <div className="absolute overflow-hidden" style={{ top: "7%", left: "38%", width: "32%", height: "62%", zIndex: 2 }}>
          <img
            src={BASE + "glass-vessel-01.jpg"}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover opacity-90"
            onError={e => { (e.currentTarget as HTMLImageElement).src = BASE + "lait-vert-02.jpg"; }}
          />
        </div>
        {/* Small anchor — bottom left */}
        <div className="absolute overflow-hidden" style={{ bottom: 0, left: "5%", width: "20%", height: "30%", zIndex: 3 }}>
          <img
            src={BASE + "sel-gris-01.jpg"}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Text object — like reference canvas */}
        <div
          className="absolute select-none"
          style={{ top: "6%", right: "2%", maxWidth: "180px", zIndex: 4 }}
        >
          <p
            className="font-display leading-[.88] tracking-[-0.02em] text-foreground"
            style={{ fontSize: "clamp(1rem, 2vw, 1.6rem)" }}
          >
            Not botanical.<br />Architectural green.
          </p>
        </div>
        {/* Material card */}
        <div
          className="absolute border border-border bg-background/95 px-3 py-2"
          style={{ bottom: "8%", right: "3%", zIndex: 5, minWidth: "140px" }}
        >
          <p className="font-mono-ui text-[6px] uppercase tracking-[.18em] text-muted-foreground">Material</p>
          <p className="mt-0.5 font-display text-sm text-foreground">Violet Leaf Absolute</p>
          <p className="mt-0.5 font-mono-ui text-[6px] uppercase text-muted-foreground">Green · wet leaf</p>
        </div>
        {/* Direction marker */}
        <div
          className="absolute border-l-2 border-accent bg-background/90 px-2.5 py-1.5"
          style={{ bottom: "8%", left: "27%", zIndex: 5 }}
        >
          <p className="font-mono-ui text-[6px] uppercase tracking-[.14em] text-muted-foreground">Direction</p>
          <p className="mt-0.5 font-mono-ui text-[7px] text-foreground">Green · mineral skin</p>
        </div>
        {/* Connection nodes */}
        <svg
          className="pointer-events-none absolute inset-0"
          style={{ width: "100%", height: "100%", zIndex: 6 }}
          aria-hidden
        >
          <circle cx="40%" cy="77%" r="2.5" fill="hsl(var(--accent))" />
          <circle cx="54%" cy="77%" r="2.5" fill="hsl(var(--accent))" />
          <line x1="40%" y1="77%" x2="54%" y2="77%" stroke="hsl(var(--border))" strokeWidth="0.7" strokeDasharray="2 3" />
        </svg>
        {/* Hover CTA */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/20"
          style={{ zIndex: 10 }}
        >
          <div className="bg-foreground text-background px-5 py-2.5 font-mono-ui text-[8px] uppercase tracking-[.22em] inline-flex items-center gap-2">
            Enter Canvas <ArrowRight size={8} strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </Link>
  );
}

const FOCUS_PROJECT_ID = "proj-03";

export function Studio() {
  const summaryQuery = useGetDashboardSummary();
  const formulasQuery = useListFormulas();
  const BASE = import.meta.env.BASE_URL + "images/";

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning." : h < 18 ? "Good afternoon." : "Good evening.";
  }, []);

  const focusProject = DEMO_PROJECTS.find(p => p.id === FOCUS_PROJECT_ID) ?? DEMO_PROJECTS[0];
  const activeProjects = DEMO_PROJECTS
    .filter(p => p.status === "active")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);
  const recentWork = useMemo(() => buildRecentWork(), []);
  const recentFormulas = (formulasQuery.data ?? summaryQuery.data?.recentFormulas ?? []).slice(0, 3);

  if (summaryQuery.isLoading) {
    return (
      <div className="animate-fade-in pt-10 space-y-8">
        <Skeleton className="h-[300px] w-full" />
        <div className="space-y-3 pt-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
        </div>
      </div>
    );
  }

  const heroImgFile = (focusProject.heroImage ?? focusProject.coverImage ?? "lait-vert-01.jpg").replace(/^.*\/images\//, "");

  return (
    <div className="animate-fade-in overflow-x-hidden">

      {/* ── CURRENT FOCUS — full-bleed editorial, light ground ── */}
      <motion.section
        data-testid="studio-hero"
        className="-mx-5 sm:-mx-8 lg:-mx-12 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ minHeight: "clamp(280px, 40vw, 460px)" }}
      >
        {/* Photography */}
        <div className="absolute inset-0">
          <img
            src={BASE + heroImgFile}
            alt=""
            aria-hidden
            className="h-full w-full object-cover opacity-60"
          />
          {/* Warm parchment wash from left — text on light ground */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to right, hsl(var(--background) / 0.97) 0%, hsl(var(--background) / 0.78) 42%, hsl(var(--background) / 0.22) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, hsl(var(--background) / 0.65) 0%, transparent 55%)" }}
          />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-end px-5 pb-10 pt-14 sm:px-8 lg:px-12">
          <motion.p
            className="font-mono-ui text-[7px] uppercase tracking-[.36em] text-muted-foreground"
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
            <p className="mt-5 font-mono-ui text-[7px] uppercase tracking-[.26em] text-muted-foreground">
              Current project
            </p>
            <h1
              data-testid="heading-studio"
              className="mt-1.5 font-display tracking-[-0.04em] leading-[.88] text-foreground"
              style={{ fontSize: "clamp(2.6rem, 5.5vw, 5rem)" }}
            >
              {focusProject.name}
            </h1>
            <p className="mt-2 font-mono-ui text-[7px] uppercase tracking-[.18em] text-muted-foreground">
              {focusProject.olfactiveDirection}
            </p>
            {focusProject.creativeStatement && (
              <p
                className="mt-4 font-display leading-[.92] text-foreground/45"
                style={{ fontSize: "clamp(1rem, 2vw, 1.6rem)" }}
              >
                {focusProject.creativeStatement}
              </p>
            )}
            <div className="mt-6">
              <Link
                href={`/projects/${focusProject.id}`}
                data-testid="link-studio-continue"
                className="group inline-flex items-center gap-2.5 font-mono-ui text-[9px] uppercase tracking-[.22em] text-muted-foreground hover:text-foreground transition-colors"
              >
                Continue project
                <ArrowRight size={9} strokeWidth={1.5} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── CANVAS PREVIEW ── */}
      <motion.section
        className="pt-10 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.22 }}
        data-testid="section-inspiration-preview"
      >
        <div className="flex items-end justify-between mb-4">
          <p className="font-mono-ui text-[7px] uppercase tracking-[.28em] text-muted-foreground">
            Current canvas · {focusProject.name}
          </p>
          <Link
            href={`/projects/${focusProject.id}/inspiration`}
            data-testid="link-studio-moodboards"
            className="font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            Enter <ArrowRight size={8} strokeWidth={1.5} />
          </Link>
        </div>
        <CanvasPreview projectId={focusProject.id} />
      </motion.section>

      {/* ── PROJECTS ── */}
      <motion.section
        className="pt-10 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.28 }}
        data-testid="section-projects-in-motion"
      >
        <div className="flex items-center justify-between mb-0">
          <p className="font-mono-ui text-[7px] uppercase tracking-[.28em] text-muted-foreground">Projects</p>
          <Link
            href="/projects"
            data-testid="link-studio-view-projects"
            className="font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>
        {activeProjects.map((p, i) => <ProjectRow key={p.id} project={p} index={i} />)}
      </motion.section>

      {/* ── RECENT WORK ── */}
      <motion.section
        className="pt-10 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.34 }}
        data-testid="section-recent-work"
      >
        <p className="mb-0 font-mono-ui text-[7px] uppercase tracking-[.28em] text-muted-foreground">Recent work</p>
        {recentWork.map((item, i) => <WorkRow key={item.id} item={item} index={i} />)}
        {recentFormulas.length > 0 && recentWork.length < 4 && recentFormulas.map((f, i) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.08 + i * 0.04 }}
          >
            <Link href={`/formulas/${f.id}`} data-testid={`link-recent-formula-${f.id}`} className={rowCls}>
              <div className="w-20 shrink-0 hidden sm:block">
                <span className="font-mono-ui text-[7px] uppercase tracking-[.18em] text-muted-foreground">Formula</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">{f.name || "Untitled"}</p>
                {f.brief && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{f.brief}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono-ui text-[7px] text-muted-foreground">{relativeDate(f.updatedAt)}</span>
                <ArrowRight size={9} strokeWidth={1.5} className="text-muted-foreground/40 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.section>

      {/* ── EDITORIAL IMAGE STRIP — 3 images, generous negative space ── */}
      <motion.section
        className="pt-10 -mx-5 sm:-mx-8 lg:-mx-12 grid grid-cols-3 gap-px bg-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.38 }}
        aria-hidden
      >
        {[
          { src: "petal-01.jpg", fallback: "lait-vert-01.jpg", h: "clamp(100px, 14vw, 160px)" },
          { src: "glass-vessel-01.jpg", fallback: "lait-vert-02.jpg", h: "clamp(120px, 16vw, 190px)" },
          { src: "dropper-01.jpg", fallback: "resine-noire-01.jpg", h: "clamp(100px, 14vw, 160px)" },
        ].map(({ src, fallback, h }, i) => (
          <div key={i} className="overflow-hidden bg-card" style={{ height: h }}>
            <img
              src={BASE + src}
              alt=""
              className="w-full h-full object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).src = BASE + fallback; }}
            />
          </div>
        ))}
      </motion.section>

      {/* ── QUICK CREATE ── */}
      <motion.section
        className="border-t border-border mt-10 pt-7 pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        data-testid="section-quick-create"
      >
        <p className="mb-5 font-mono-ui text-[7px] uppercase tracking-[.28em] text-muted-foreground">Quick create</p>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {[
            { href: "/formulas/new", label: "New formula", testId: "link-qc-formula" },
            { href: "/materials", label: "Browse materials", testId: "link-qc-materials" },
            { href: "/files", label: "Import file", testId: "link-qc-import" },
          ].map(({ href, label, testId }) => (
            <Link
              key={href}
              href={href}
              data-testid={testId}
              className="group inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              {label}
              <ArrowRight size={8} strokeWidth={1.5} className="text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
          <span
            className="inline-flex items-center gap-2 text-sm text-muted-foreground/40 cursor-default select-none"
            aria-disabled="true"
          >
            New project{" "}
            <span className="font-mono-ui text-[6px] uppercase tracking-widest text-muted-foreground/30">
              Preview
            </span>
          </span>
        </div>
      </motion.section>

      <div className="pb-4">
        <p className="font-mono-ui text-[6px] uppercase tracking-[.12em] text-muted-foreground/50 leading-5">
          Project, canvas and note data is representative. Formula and material data is live.
        </p>
      </div>
    </div>
  );
}
