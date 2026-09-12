/**
 * /projects — Project index
 * MATIÈRE redesign: bright editorial, image-led, specimen archive feel.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { DEMO_PROJECTS } from "../data/projects";
import type { DemoProject } from "../data/projects";

type FilterStatus = "all" | "active" | "resting" | "archived";

function statusLabel(s: DemoProject["status"]) {
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

// Active pill — small citron indicator for active projects
function StatusMark({ status }: { status: DemoProject["status"] }) {
  if (status === "active") {
    return <span className="inline-block h-1.5 w-1.5 bg-accent shrink-0" aria-hidden />;
  }
  return <span className="inline-block h-1.5 w-1.5 bg-border shrink-0" aria-hidden />;
}

export function Projects() {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const visible = filter === "all" ? DEMO_PROJECTS : DEMO_PROJECTS.filter((p) => p.status === filter);

  return (
    <div className="animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="border-b border-border pt-10 pb-8">
        <p className="font-mono-ui text-[8px] uppercase tracking-[.32em] text-muted-foreground">
          Workspace
        </p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1
            className="font-display tracking-[-0.04em] leading-[.88] text-foreground"
            style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)" }}
            data-testid="heading-projects"
          >
            Projects
          </h1>
          <p className="text-sm leading-7 text-muted-foreground max-w-xs">
            Each project traces the development of a fragrance — from world to scent.
          </p>
        </div>
      </header>

      {/* ── Representative data notice ─────────────────────────── */}
      <div className="mt-5 border-l-2 border-accent/30 pl-4 py-1.5">
        <p className="font-mono-ui text-[7px] uppercase tracking-[.18em] text-muted-foreground/50">
          Representative workspace · read-only · no backend Project entity yet
        </p>
      </div>

      {/* ── Filter ─────────────────────────────────────────────── */}
      <div className="mt-7 flex flex-wrap items-center gap-0 border-b border-border pb-0">
        {(["all", "active", "resting", "archived"] as FilterStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            data-testid={`filter-projects-${f}`}
            className={[
              "relative px-4 py-3 font-mono-ui text-[9px] uppercase tracking-[.16em] transition-colors",
              "focus-visible:outline-none",
              filter === f
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {f === "all" ? "All" : statusLabel(f as DemoProject["status"])}
            {filter === f && (
              <motion.div
                layoutId="project-filter-bar"
                className="absolute inset-x-0 bottom-0 h-[1px] bg-foreground"
                transition={{ type: "tween", duration: 0.16 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Project list ───────────────────────────────────────── */}
      <div className="mt-0">
        {visible.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-display text-2xl text-muted-foreground/40">No projects here.</p>
          </div>
        )}
        {visible.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={`/projects/${project.id}`}
              data-testid={`link-project-${project.id}`}
              className="group block"
            >
              <div className="grid grid-cols-[auto_1fr_auto] items-start gap-5 border-b border-border py-6 transition-colors hover:bg-secondary/20 -mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">

                {/* Cover image — physical, no heavy card */}
                <div className="hidden h-24 w-32 overflow-hidden sm:block shrink-0">
                  <img
                    src={project.coverImage}
                    alt=""
                    aria-hidden
                    className="h-full w-full object-cover opacity-65 transition-all duration-300 group-hover:opacity-90 group-hover:scale-[1.02]"
                  />
                </div>

                {/* Content */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <StatusMark status={project.status} />
                    <p className="font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground">
                      {statusLabel(project.status)}
                    </p>
                    <span className="text-muted-foreground/30 font-mono-ui text-[7px]">·</span>
                    <p className="font-mono-ui text-[7px] uppercase tracking-[.12em] text-muted-foreground/50">
                      {relativeDate(project.updatedAt)}
                    </p>
                  </div>
                  <h2
                    className="mt-2 font-display leading-[.92] tracking-[-0.03em]"
                    style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
                  >
                    {project.name}
                  </h2>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground max-w-xl line-clamp-2">
                    {project.description}
                  </p>
                  <p className="mt-2 font-mono-ui text-[7px] uppercase tracking-[.12em] text-muted-foreground/50 italic">
                    {project.olfactiveDirection}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4">
                    <span className="font-mono-ui text-[7px] uppercase tracking-[.10em] text-muted-foreground/50">
                      {project.modCount} mod{project.modCount !== 1 ? "s" : ""}
                    </span>
                    <span className="font-mono-ui text-[7px] uppercase tracking-[.10em] text-muted-foreground/50">
                      {project.linkedMaterialNames.length} materials
                    </span>
                    <Link
                      href={`/projects/${project.id}/inspiration`}
                      data-testid={`link-project-canvas-${project.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-mono-ui text-[7px] uppercase tracking-[.10em] text-accent/70 hover:text-accent transition-colors"
                    >
                      Canvas
                    </Link>
                  </div>
                </div>

                {/* Arrow */}
                <div className="self-center shrink-0">
                  <ArrowRight
                    size={13}
                    strokeWidth={1.3}
                    className="text-muted-foreground/30 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-foreground/50"
                  />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Footer note */}
      <div className="py-8 border-t border-border mt-2">
        <p className="text-sm text-muted-foreground/60">
          Projects connect brief, canvas, materials, mods, and evaluation. A backend Project entity is needed to persist them.
        </p>
      </div>
    </div>
  );
}
