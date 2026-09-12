/**
 * /projects — Project index
 * MATIÈRE dark cinematic: image-led, alternating compositions, restrained type.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { DEMO_PROJECTS } from "../data/projects";
import type { DemoProject } from "../data/projects";

type FilterStatus = "all" | "active" | "resting" | "archived";

function statusLabel(s: DemoProject["status"]): string {
  return s === "active" ? "Active" : s === "resting" ? "Resting" : s === "archived" ? "Archived" : "Complete";
}

function relativeDate(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86_400_000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ─── Project card — alternating image left/right ──────────────────────────────

function ProjectCard({ project, index }: { project: DemoProject; index: number }) {
  const BASE = import.meta.env.BASE_URL + "images/";
  const imageLeft = index % 2 === 0;
  const imgFile = (project.heroImage ?? project.coverImage ?? "sel-gris-01.jpg").replace("/images/", "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="border-b"
      style={{ borderColor: "hsl(20 6% 11%)" }}
    >
      <Link
        href={`/projects/${project.id}`}
        data-testid={`link-project-${project.id}`}
        className="group block"
      >
        <div className={[
          "grid items-stretch",
          "-mx-5 sm:-mx-8 lg:-mx-12",
          "transition-colors hover:bg-white/[0.018]",
          imageLeft ? "sm:grid-cols-[2fr_3fr]" : "sm:grid-cols-[3fr_2fr]",
        ].join(" ")}>

          {/* Image */}
          <div
            className={["hidden sm:block overflow-hidden relative", imageLeft ? "order-1" : "order-2"].join(" ")}
            style={{ minHeight: "clamp(180px, 20vw, 280px)" }}
          >
            <img
              src={BASE + imgFile}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover opacity-45 transition-all duration-700 group-hover:opacity-65 group-hover:scale-[1.02]"
            />
            {/* Hover — creative statement */}
            {project.creativeStatement && (
              <div className="absolute inset-0 flex items-end p-6" style={{ background: "linear-gradient(to top, hsl(20 8% 5% / 0.5) 0%, transparent 60%)" }}>
                <p className="font-display text-lg leading-tight text-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {project.creativeStatement}
                </p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className={["flex flex-col justify-between px-5 py-8 sm:px-8 lg:px-12", imageLeft ? "order-2" : "order-1"].join(" ")}>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                {project.status === "active" && (
                  <span className="inline-block h-1 w-1 bg-accent shrink-0" aria-hidden />
                )}
                <p className="font-mono-ui text-[7px] uppercase tracking-[.18em] text-muted-foreground/40">
                  {statusLabel(project.status)}
                </p>
                <span className="text-muted-foreground/20 font-mono-ui text-[7px]" aria-hidden>·</span>
                <p className="font-mono-ui text-[7px] uppercase tracking-[.12em] text-muted-foreground/30">
                  {relativeDate(project.updatedAt)}
                </p>
              </div>

              <h2
                className="font-display leading-[.88] tracking-[-0.04em] text-foreground/90"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
              >
                {project.name}
              </h2>

              {/* Mobile image */}
              <div className="sm:hidden mt-4 overflow-hidden" style={{ height: "130px" }}>
                <img src={BASE + imgFile} alt="" aria-hidden className="w-full h-full object-cover opacity-35" />
              </div>

              <p className="mt-3 font-mono-ui text-[7px] uppercase tracking-[.12em] text-muted-foreground/35 italic">
                {project.olfactiveDirection}
              </p>

              <p className="mt-3 text-sm leading-7 text-muted-foreground/45 max-w-sm line-clamp-2">
                {project.description}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-5">
                <span className="font-mono-ui text-[7px] uppercase tracking-[.10em] text-muted-foreground/30">
                  {project.modCount} mod{project.modCount !== 1 ? "s" : ""}
                </span>
                <span className="font-mono-ui text-[7px] uppercase tracking-[.10em] text-muted-foreground/30">
                  {project.linkedMaterialNames.length} materials
                </span>
                <Link
                  href={`/projects/${project.id}/inspiration`}
                  data-testid={`link-project-canvas-${project.id}`}
                  onClick={e => e.stopPropagation()}
                  className="font-mono-ui text-[7px] uppercase tracking-[.10em] text-accent/40 hover:text-accent/80 transition-colors"
                >
                  Canvas
                </Link>
              </div>
              <ArrowRight
                size={11}
                strokeWidth={1.3}
                className="text-muted-foreground/20 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-foreground/40"
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Projects() {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const visible = filter === "all" ? DEMO_PROJECTS : DEMO_PROJECTS.filter(p => p.status === filter);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="border-b pt-10 pb-8 -mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12" style={{ borderColor: "hsl(20 6% 11%)" }}>
        <p className="font-mono-ui text-[7px] uppercase tracking-[.32em] text-muted-foreground/40">Workspace</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1
            className="font-display tracking-[-0.04em] leading-[.88] text-foreground/90"
            style={{ fontSize: "clamp(2.8rem, 6vw, 5.5rem)" }}
            data-testid="heading-projects"
          >
            Projects
          </h1>
          <p className="text-sm leading-7 text-muted-foreground/35 max-w-xs">
            Each project traces the development of a fragrance from world to scent.
          </p>
        </div>
      </header>

      {/* Data notice */}
      <div className="mt-4 border-l-2 border-accent/20 pl-4 py-1">
        <p className="font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground/25">
          Representative workspace · read-only
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mt-5 flex flex-wrap items-center border-b" style={{ borderColor: "hsl(20 6% 11%)" }}>
        {(["all", "active", "resting", "archived"] as FilterStatus[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            data-testid={`filter-projects-${f}`}
            className={[
              "relative px-4 py-3 font-mono-ui text-[8px] uppercase tracking-[.16em] transition-colors focus-visible:outline-none",
              filter === f ? "text-foreground/80" : "text-muted-foreground/35 hover:text-foreground/60",
            ].join(" ")}
          >
            {f === "all" ? "All" : statusLabel(f as DemoProject["status"])}
            {filter === f && (
              <motion.div
                layoutId="project-filter-bar"
                className="absolute inset-x-0 bottom-0 h-[1px] bg-foreground/50"
                transition={{ type: "tween", duration: 0.16 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div>
        {visible.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-display text-2xl text-muted-foreground/20">No projects here.</p>
          </div>
        )}
        {visible.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} />
        ))}
      </div>

      <div className="py-6">
        <p className="font-mono-ui text-[6px] uppercase tracking-[.12em] text-muted-foreground/20 leading-5">
          A backend Project entity is needed to persist projects.
        </p>
      </div>
    </div>
  );
}
