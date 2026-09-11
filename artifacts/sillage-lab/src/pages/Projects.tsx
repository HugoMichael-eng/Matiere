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

function statusDot(s: DemoProject["status"]) {
  return s === "active" ? "bg-foreground" : s === "resting" ? "bg-muted-foreground" : "bg-border";
}

export function Projects() {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const visible = filter === "all" ? DEMO_PROJECTS : DEMO_PROJECTS.filter((p) => p.status === filter);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="border-b border-border pt-8 pb-6">
        <p className="font-mono-ui text-[9px] uppercase tracking-[.3em] text-muted-foreground">Workspace</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1
            className="font-display text-5xl tracking-[-0.03em] leading-[.88] sm:text-6xl"
            data-testid="heading-projects"
          >
            Projects
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            Each project traces the development of a fragrance — brief, materials, mods, and evaluation.
          </p>
        </div>
      </header>

      {/* Representative data notice */}
      <div className="mt-5 border-l-2 border-border pl-4 py-2">
        <p className="font-mono-ui text-[8px] uppercase tracking-[.18em] text-muted-foreground/60">
          Representative workspace · read-only · no backend Project entity yet
        </p>
      </div>

      {/* Filter */}
      <div className="mt-6 flex flex-wrap items-center gap-1">
        {(["all", "active", "resting", "archived"] as FilterStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            data-testid={`filter-projects-${f}`}
            className={`px-3 py-1.5 font-mono-ui text-[9px] uppercase tracking-[.14em] transition-colors ${
              filter === f
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : statusLabel(f as DemoProject["status"])}
          </button>
        ))}
      </div>

      {/* Project list */}
      <div className="mt-8 space-y-px">
        {visible.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-display text-2xl text-muted-foreground/50">No projects here.</p>
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
              <div className="grid grid-cols-[auto_1fr_auto] items-start gap-6 border-b border-border py-6 transition-colors hover:bg-secondary/20 -mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
                {/* Cover thumbnail */}
                <div className="hidden h-20 w-28 overflow-hidden sm:block">
                  <img
                    src={project.coverImage}
                    alt=""
                    aria-hidden
                    className="h-full w-full object-cover grayscale opacity-50 group-hover:opacity-70 transition-opacity"
                  />
                </div>

                {/* Content */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusDot(project.status)}`} />
                    <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">
                      {statusLabel(project.status)}
                    </p>
                  </div>
                  <h2 className="mt-2 font-display text-2xl leading-tight sm:text-3xl">{project.name}</h2>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground max-w-xl line-clamp-2">
                    {project.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4">
                    <span className="font-mono-ui text-[8px] uppercase tracking-[.1em] text-muted-foreground/60">
                      {project.modCount} mods
                    </span>
                    <span className="font-mono-ui text-[8px] uppercase tracking-[.1em] text-muted-foreground/60">
                      {project.linkedMaterialNames.length} materials
                    </span>
                    <span className="font-mono-ui text-[8px] uppercase tracking-[.1em] text-muted-foreground/60">
                      Updated{" "}
                      {new Date(project.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="mt-1.5 font-mono-ui text-[8px] uppercase tracking-[.1em] text-muted-foreground/50 italic">
                    {project.olfactiveDirection}
                  </p>
                </div>

                {/* Arrow */}
                <div className="self-center">
                  <ArrowRight
                    size={14}
                    strokeWidth={1.3}
                    className="text-muted-foreground/30 transition-transform group-hover:translate-x-1 group-hover:text-muted-foreground"
                  />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="py-10 border-t border-border mt-2">
        <p className="text-sm text-muted-foreground">
          Projects connect brief, materials, mods, and evaluation. A backend Project entity is needed to persist them.
        </p>
      </div>
    </div>
  );
}
