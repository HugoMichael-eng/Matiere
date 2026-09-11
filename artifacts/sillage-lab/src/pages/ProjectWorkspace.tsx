/**
 * /projects/:id — Project overview workspace
 *
 * Tab state is encoded in the URL as ?tab=<id> so that links from other
 * pages can deep-link directly to a tab.  Default is "overview" (no param).
 *
 * All data is representative — read-only, no backend Project entity yet.
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams, useSearch, useLocation } from "wouter";
import { ArrowRight, Sparkles } from "lucide-react";
import { AtmosphereStrip } from "@workspace/s1/components/ui/atmosphere-strip";
import { NotebookEntry } from "@workspace/s1/components/ui/notebook-entry";
import { SectionRule } from "@workspace/s1/components/ui/section-rule";
import { DEMO_PROJECTS } from "../data/projects";
import type { DemoProject, ProjectEvaluation } from "../data/projects";

// ─── Tab types ────────────────────────────────────────────────────────────────

type WorkspaceTab = "overview" | "inspiration" | "evaluation" | "notes" | "materials" | "formulas";

const VALID_TABS = new Set<WorkspaceTab>([
  "overview", "inspiration", "evaluation", "notes", "materials", "formulas",
]);

const TABS: { id: WorkspaceTab; label: string }[] = [
  { id: "overview",    label: "Overview"    },
  { id: "inspiration", label: "Inspiration" },
  { id: "evaluation",  label: "Evaluation"  },
  { id: "notes",       label: "Notes"       },
  { id: "materials",   label: "Materials"   },
  { id: "formulas",    label: "Mods"        },
];

// Temporal evaluation phases — classified by key, never by array index.
const TEMPORAL_PHASE_KEYS = new Set<keyof ProjectEvaluation>([
  "opening", "fifteenMin", "oneHour", "fourHour", "drydown",
]);

// All phases in display order
const EVAL_PHASES: Array<{ key: keyof ProjectEvaluation; label: string }> = [
  { key: "opening",     label: "Opening"     },
  { key: "fifteenMin",  label: "15 min"      },
  { key: "oneHour",     label: "1 hour"      },
  { key: "fourHour",    label: "4 hours"     },
  { key: "drydown",     label: "Drydown"     },
  { key: "overall",     label: "Overall"     },
  { key: "whatWorks",   label: "What works"  },
  { key: "adjustments", label: "Adjustments" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusLabel(s: DemoProject["status"]): string {
  return s === "active" ? "Active"
       : s === "resting" ? "Resting"
       : s === "archived" ? "Archived"
       : "Complete";
}

// ─── Contextual AI panel ──────────────────────────────────────────────────────

function deriveAiObservation(project: DemoProject): { label: string; body: string } {
  const latestEval  = project.evaluations[0];
  const latestNote  = project.notes[0];
  const materialList = project.linkedMaterialNames.slice(0, 3).join(", ");

  if (latestEval) {
    return {
      label: "Possible direction — reading the latest evaluation",
      body: `One interpretation: the evaluation of ${latestEval.modLabel} noted "${latestEval.whatWorks}" as what is working. The adjustment direction ("${latestEval.adjustments}") suggests the composition is resolving toward its anchor. With ${project.modCount} mods in this project, the trajectory reads as refinement rather than reorientation.`,
    };
  }
  if (latestNote) {
    return {
      label: "Consider — reading the notes",
      body: `A possible reading of the studio notes: "${latestNote.body.slice(0, 120)}${latestNote.body.length > 120 ? "…" : ""}" — the framing suggests the project is still finding its structural language. The materials on hand (${materialList}) provide a workable palette, but the direction seems to be asking for restraint.`,
    };
  }
  return {
    label: "Structural observation — early stage",
    body: `This project is at an early stage with ${project.modCount} mods recorded. The olfactive direction ("${project.olfactiveDirection}") suggests a clear intention. Consider what single material most fully expresses that direction, and let it anchor the structure.`,
  };
}

function ContextualAI({ project }: { project: DemoProject }) {
  const [open, setOpen] = useState(false);
  const obs = deriveAiObservation(project);

  return (
    <div className="border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/20"
        data-testid="button-ai-action"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={11} className="text-muted-foreground/60" />
          <span className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">
            {obs.label}
          </span>
        </div>
        <span className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/50 shrink-0" aria-hidden>
          {open ? "Close" : "Explore"}
        </span>
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
            <div className="border-t border-border px-4 py-4">
              <p className="text-xs leading-6 text-muted-foreground">{obs.body}</p>
              <p className="mt-3 font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground/40">
                Interpretive only · derived from local project data
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Phased Evaluation notebook ───────────────────────────────────────────────

function EvaluationNotebook({ ev }: { ev: ProjectEvaluation }) {
  const phases = EVAL_PHASES.filter((ph) => {
    const val = ev[ph.key];
    return typeof val === "string" && val.length > 0;
  });
  return (
    <div>
      {phases.map((ph) => (
        <NotebookEntry
          key={ph.key}
          label={ph.label}
          body={ev[ph.key] as string}
          /* timeline determined by phase KEY, not array position */
          timeline={TEMPORAL_PHASE_KEYS.has(ph.key)}
          className="border-t border-border first:border-t-0"
        />
      ))}
    </div>
  );
}

// ─── Tab panels ───────────────────────────────────────────────────────────────

function OverviewTab({ project }: { project: DemoProject }) {
  const latestEval = project.evaluations[0];
  const latestNote = project.notes[0];

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Cover atmosphere strip — S1 primitive */}
      <AtmosphereStrip
        src={project.coverImage}
        height="220px"
        opacity={0.30}
        label={project.olfactiveDirection}
        className="-mx-5 sm:-mx-8 lg:-mx-12 border-b border-border"
      />

      {/* Brief */}
      <section>
        <p className="font-mono-ui text-[8px] uppercase tracking-[.22em] text-muted-foreground mb-3">Brief</p>
        <p className="text-sm leading-7 text-foreground/80 max-w-2xl">{project.description}</p>
      </section>

      {/* Status grid */}
      <section className="grid gap-px sm:grid-cols-4">
        {[
          { label: "Status",    value: statusLabel(project.status) },
          { label: "Mods",      value: String(project.modCount).padStart(2, "0") },
          { label: "Materials", value: String(project.linkedMaterialNames.length) },
          { label: "Notes",     value: String(project.notes.length) },
        ].map(({ label, value }) => (
          <div key={label} className="border border-border px-4 py-4">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">{label}</p>
            <p className="mt-2 font-mono-ui text-[13px] uppercase tracking-[.08em] text-foreground">{value}</p>
          </div>
        ))}
      </section>

      {/* Current mod snapshot */}
      {latestEval && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.24em] text-muted-foreground">
              Current mod · {latestEval.modLabel}
            </p>
            <p className="font-mono-ui text-[8px] text-muted-foreground/50">{latestEval.date}</p>
          </div>
          <div className="border border-border px-5 py-5 space-y-4">
            <div>
              <p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground mb-1">Opening</p>
              <p className="text-sm leading-6 text-foreground/80">{latestEval.opening}</p>
            </div>
            <div className="border-t border-border/40 pt-4">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground mb-1">Overall</p>
              <p className="text-sm leading-6 text-foreground/80">{latestEval.overall}</p>
            </div>
            <div className="border-t border-border/40 pt-4">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground mb-1">Next adjustments</p>
              <p className="text-sm leading-6 text-foreground/70">{latestEval.adjustments}</p>
            </div>
          </div>
        </section>
      )}

      {/* Materials */}
      {project.linkedMaterialNames.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.24em] text-muted-foreground">
              Materials · representative
            </p>
            <Link
              href="/materials"
              data-testid="link-overview-materials"
              className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Library →
            </Link>
          </div>
          <div className="space-y-px">
            {project.linkedMaterialNames.map((name, i) => (
              <div
                key={name}
                className={`flex items-center justify-between py-3 border-t border-border ${i === 0 ? "" : ""}`}
              >
                <p className="text-sm">{name}</p>
                <Link
                  href={`/materials?search=${encodeURIComponent(name)}`}
                  data-testid={`link-overview-material-${i}`}
                  className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  Search →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Latest note — S1 SectionRule + NotebookEntry */}
      {latestNote && (
        <section>
          <SectionRule label="Latest note" />
          <NotebookEntry
            label={new Date(latestNote.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            body={latestNote.body}
            tag={latestNote.tag}
          />
        </section>
      )}

      {/* Contextual AI */}
      <ContextualAI project={project} />

      {/* Dates */}
      <section className="grid gap-4 sm:grid-cols-2 border-t border-border pt-6">
        <div>
          <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-1">Created</p>
          <p className="text-sm">
            {new Date(project.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div>
          <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-1">Last edited</p>
          <p className="text-sm">
            {new Date(project.updatedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </section>
    </motion.div>
  );
}

function InspirationTab({ project }: { project: DemoProject }) {
  const board  = project.inspiration;
  const images = board.filter((i) => i.type === "image").slice(0, 6);

  return (
    <motion.div
      key="inspiration-tab"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground">
          {board.length} references · representative
        </p>
        <Link
          href={`/projects/${project.id}/inspiration`}
          data-testid="link-open-moodboard"
          className="font-mono-ui text-[8px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Open moodboard →
        </Link>
      </div>

      {images.length > 0 && (
        <>
          <style>{`@media (min-width: 768px) { .insp-tab-grid { column-count: 3; } }`}</style>
          <div className="insp-tab-grid" style={{ columnCount: 2, columnGap: "3px" }}>
            {images.map((item) => (
              <div key={item.id} style={{ breakInside: "avoid", marginBottom: "3px" }}>
                <Link
                  href={`/projects/${project.id}/inspiration`}
                  data-testid={`link-insp-tab-${item.id}`}
                  className="group relative block overflow-hidden"
                >
                  <div className="aspect-square">
                    <img
                      src={item.src}
                      alt={item.caption ?? ""}
                      loading="lazy"
                      className="h-full w-full object-cover grayscale opacity-50 transition-opacity duration-300 group-hover:opacity-70"
                    />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </>
      )}

      {board.filter((i) => i.type !== "image").slice(0, 3).map((item) => (
        <div key={item.id} className="border border-border px-4 py-4">
          {item.type === "quote" && (
            <p className="italic text-sm leading-6 text-foreground/70">&ldquo;{item.body}&rdquo;</p>
          )}
          {item.type === "material" && (
            <>
              <p className="font-mono-ui text-[7px] uppercase tracking-[.18em] text-muted-foreground/60 mb-1">Material reference</p>
              <p className="text-sm font-medium">{item.materialName}</p>
              {item.body && <p className="mt-1 text-xs text-muted-foreground leading-5">{item.body}</p>}
            </>
          )}
          {(item.type === "text" || item.type === "note") && (
            <>
              {item.tag && (
                <p className="font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground/50 mb-1">{item.tag}</p>
              )}
              <p className="text-sm leading-6 text-foreground/70">{item.body}</p>
            </>
          )}
        </div>
      ))}

      <Link
        href={`/projects/${project.id}/inspiration`}
        data-testid="link-view-full-moodboard"
        className="inline-flex items-center gap-2 border border-border px-4 py-2 font-mono-ui text-[8px] uppercase tracking-widest transition-colors hover:bg-secondary"
      >
        Full moodboard <ArrowRight size={11} />
      </Link>
    </motion.div>
  );
}

function EvaluationTab({ project }: { project: DemoProject }) {
  const [open, setOpen] = useState<string | null>(project.evaluations[0]?.id ?? null);

  return (
    <motion.div
      key="evaluation"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-2"
    >
      <SectionRule
        label={`${project.evaluations.length} evaluation${project.evaluations.length !== 1 ? "s" : ""} · read-only`}
      />

      {project.evaluations.length === 0 && (
        <div className="border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">No evaluations recorded for this project.</p>
        </div>
      )}

      {project.evaluations.map((ev) => (
        <div key={ev.id} className="border border-border">
          <button
            type="button"
            onClick={() => setOpen(open === ev.id ? null : ev.id)}
            aria-expanded={open === ev.id}
            aria-controls={`eval-body-${ev.id}`}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/20"
            data-testid={`button-evaluation-${ev.id}`}
          >
            <div>
              <p className="font-mono-ui text-[11px] uppercase tracking-[.1em]">{ev.modLabel}</p>
              <p className="mt-0.5 font-mono-ui text-[8px] text-muted-foreground/60">{ev.date}</p>
            </div>
            <span className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground shrink-0" aria-hidden>
              {open === ev.id ? "Close" : "Read"}
            </span>
          </button>

          <AnimatePresence>
            {open === ev.id && (
              <motion.div
                id={`eval-body-${ev.id}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="border-t border-border px-5 py-5">
                  <EvaluationNotebook ev={ev} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {project.evaluations.length > 0 && (
        <div className="pt-4">
          <ContextualAI project={project} />
        </div>
      )}
    </motion.div>
  );
}

function NotesTab({ project }: { project: DemoProject }) {
  return (
    <motion.div
      key="notes"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-0"
    >
      <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground mb-4">
        {project.notes.length} notes · read-only
      </p>

      {project.notes.length === 0 && (
        <div className="border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">No notes in this project.</p>
        </div>
      )}

      {project.notes.map((note, i) => (
        <NotebookEntry
          key={note.id}
          label={new Date(note.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          body={note.body}
          tag={note.tag}
          className={i > 0 ? "border-t border-border" : ""}
        />
      ))}

      <div className="pt-4">
        <ContextualAI project={project} />
      </div>
    </motion.div>
  );
}

function MaterialsTab({ project }: { project: DemoProject }) {
  return (
    <motion.div
      key="materials"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground">
          {project.linkedMaterialNames.length} materials · representative
        </p>
        <Link
          href="/materials"
          data-testid="link-project-browse-materials"
          className="font-mono-ui text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          Browse library →
        </Link>
      </div>

      {project.linkedMaterialNames.length === 0 && (
        <div className="border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">No materials listed for this project.</p>
        </div>
      )}

      <div className="space-y-px">
        {project.linkedMaterialNames.map((name, i) => (
          <div
            key={name}
            className={`flex items-center justify-between py-4 border-t border-border ${i === 0 ? "" : ""}`}
          >
            <p className="text-sm">{name}</p>
            <Link
              href={`/materials?search=${encodeURIComponent(name)}`}
              data-testid={`link-material-search-${i}`}
              className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Search →
            </Link>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function FormulasTab({ project }: { project: DemoProject }) {
  return (
    <motion.div
      key="formulas"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground">
        {project.modCount} mods recorded · representative
      </p>

      <div className="space-y-px">
        {Array.from({ length: project.modCount }, (_, i) => {
          const modNum   = String(project.modCount - i).padStart(2, "0");
          const isLatest = i === 0;
          return (
            <div key={modNum} className="flex items-center justify-between py-4 border-t border-border">
              <div>
                <div className="flex items-center gap-3">
                  <p className="font-mono-ui text-[11px] uppercase tracking-[.12em]">MOD {modNum}</p>
                  {isLatest && (
                    <span className="border border-foreground/20 px-1.5 py-0.5 font-mono-ui text-[7px] uppercase tracking-widest text-foreground">
                      Latest
                    </span>
                  )}
                </div>
                <p className="mt-0.5 font-mono-ui text-[8px] text-muted-foreground/60">
                  {new Date(project.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </div>
              <span className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/40">
                Representative
              </span>
            </div>
          );
        })}
      </div>

      <div className="border border-dashed border-border p-4">
        <p className="text-xs text-muted-foreground">
          Link this project to real formulas once a backend Project entity exists.
        </p>
        <Link
          href="/formulas"
          className="mt-3 inline-block font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline"
          data-testid="link-project-browse-formulas"
        >
          Browse formulas →
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProjectWorkspace() {
  const params  = useParams<{ id: string }>();
  const search  = useSearch();
  const [, setLocation] = useLocation();
  const project = DEMO_PROJECTS.find((p) => p.id === params.id);

  // Derive active tab from ?tab= query param; default "overview"
  const rawTab  = new URLSearchParams(search).get("tab") ?? "";
  const activeTab: WorkspaceTab = VALID_TABS.has(rawTab as WorkspaceTab)
    ? (rawTab as WorkspaceTab)
    : "overview";

  // Write the chosen tab back into the URL (replace so Back button works naturally)
  const handleTabChange = useCallback(
    (tab: WorkspaceTab) => {
      const qs = tab === "overview" ? "" : `?tab=${tab}`;
      setLocation(`/projects/${params.id}${qs}`, { replace: true });
    },
    [params.id, setLocation],
  );

  if (!project) {
    return (
      <div className="py-20 text-center animate-fade-in">
        <p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground mb-4">
          Not found
        </p>
        <h1 className="font-display text-4xl">This project doesn&apos;t exist.</h1>
        <div className="mt-6">
          <Link
            href="/projects"
            className="font-mono-ui text-[9px] uppercase tracking-widest underline-offset-4 hover:underline"
            data-testid="link-back-projects"
          >
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 pt-6 pb-4">
        <Link
          href="/projects"
          data-testid="link-breadcrumb-projects"
          className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground hover:text-foreground transition-colors"
        >
          Projects
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-foreground">
          {project.name}
        </span>
      </div>

      {/* Header */}
      <header className="border-b border-border pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground">
              {project.olfactiveDirection}
            </p>
            <h1
              className="mt-2 font-display text-5xl tracking-[-0.03em] leading-[.88] sm:text-6xl"
              data-testid="heading-project-name"
            >
              {project.name}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <span className="border border-border px-3 py-1.5 font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">
              {statusLabel(project.status)} · MOD {String(project.modCount).padStart(2, "0")}
            </span>
            <Link
              href={`/projects/${project.id}/inspiration`}
              data-testid="link-project-inspiration"
              className="border border-foreground/20 px-3 py-1.5 font-mono-ui text-[8px] uppercase tracking-[.14em] transition-colors hover:border-foreground flex items-center gap-1"
            >
              Moodboard <ArrowRight size={10} className="inline" />
            </Link>
          </div>
        </div>
        <p className="mt-2 font-mono-ui text-[7px] uppercase tracking-[.12em] text-muted-foreground/40">
          Representative project · read-only · no backend entity yet
        </p>
      </header>

      {/* Tab bar — native keyboard-accessible <button> elements, role="tablist" */}
      <div
        role="tablist"
        aria-label="Project workspace tabs"
        className="flex overflow-x-auto border-b border-border"
        data-testid="project-tabs"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => handleTabChange(tab.id)}
            data-testid={`tab-${tab.id}`}
            className={[
              "relative shrink-0 px-5 py-4 font-mono-ui text-[9px] uppercase tracking-[.14em] transition-colors",
              "focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4",
              activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="project-tab-bar"
                className="absolute inset-x-0 bottom-0 h-[2px] bg-foreground"
                transition={{ type: "tween", duration: 0.18 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="py-8"
      >
        <AnimatePresence mode="wait">
          {activeTab === "overview"    && <OverviewTab    key="overview"    project={project} />}
          {activeTab === "inspiration" && <InspirationTab key="inspiration" project={project} />}
          {activeTab === "evaluation"  && <EvaluationTab  key="evaluation"  project={project} />}
          {activeTab === "notes"       && <NotesTab       key="notes"       project={project} />}
          {activeTab === "materials"   && <MaterialsTab   key="materials"   project={project} />}
          {activeTab === "formulas"    && <FormulasTab    key="formulas"    project={project} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
