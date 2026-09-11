import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams } from "wouter";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { DEMO_PROJECTS } from "../data/projects";

type WorkspaceTab = "overview" | "inspiration" | "notes" | "materials" | "formulas" | "evaluation";

const TABS: { id: WorkspaceTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "inspiration", label: "Inspiration" },
  { id: "notes", label: "Notes" },
  { id: "materials", label: "Materials" },
  { id: "formulas", label: "Mods" },
  { id: "evaluation", label: "Evaluation" },
];

/** Derive a project-specific AI interpretation from local project data only.
 *  No backend call — visibly interpretive, not authoritative. */
function deriveAiObservation(project: (typeof DEMO_PROJECTS)[0]): {
  label: string;
  body: string;
} {
  const latestNote = project.notes[0];
  const latestEval = project.evaluations[0];
  const materialList = project.linkedMaterialNames.slice(0, 3).join(", ");

  if (latestEval) {
    return {
      label: "Possible direction — reading the latest evaluation",
      body: `One interpretation: the evaluation of ${latestEval.modLabel} noted "${latestEval.whatWorks}" as what's working. The adjustment direction ("${latestEval.adjustments}") suggests the composition is resolving toward its anchor. With ${project.modCount} mods in this project, the trajectory reads as refinement rather than reorientation.`,
    };
  }
  if (latestNote) {
    return {
      label: "Consider — reading the notes",
      body: `A possible reading of the studio notes: "${latestNote.body.slice(0, 120)}${latestNote.body.length > 120 ? "…" : ""}" — the framing here suggests the project is still finding its structural language. The materials on hand (${materialList}) provide a workable palette, but the direction seems to be asking for restraint.`,
    };
  }
  return {
    label: "Structural observation — early stage",
    body: `This project is at an early stage with ${project.modCount} mods recorded. The olfactive direction ("${project.olfactiveDirection}") suggests a clear intention. Consider what single material most fully expresses that direction, and let it anchor the structure.`,
  };
}

function ContextualAI({ project }: { project: (typeof DEMO_PROJECTS)[0] }) {
  const [open, setOpen] = useState(false);
  const obs = deriveAiObservation(project);

  return (
    <div className="border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/30"
        data-testid="button-ai-action"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={11} className="text-muted-foreground/60" />
          <span className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">
            {obs.label}
          </span>
        </div>
        <span className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/50 shrink-0">
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

function OverviewTab({ project }: { project: (typeof DEMO_PROJECTS)[0] }) {
  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Cover image strip */}
      <div className="relative overflow-hidden" style={{ height: "200px" }}>
        <img
          src={project.coverImage}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-35 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute bottom-5 left-0">
          <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground">
            {project.olfactiveDirection}
          </p>
        </div>
      </div>

      {/* Brief */}
      <div>
        <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground mb-3">Brief</p>
        <p className="text-sm leading-7 text-foreground/80 max-w-2xl">{project.description}</p>
      </div>

      {/* Metadata */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Status", value: project.status },
          { label: "Mods", value: String(project.modCount) },
          { label: "Materials", value: String(project.linkedMaterialNames.length) },
          { label: "Notes", value: String(project.notes.length) },
        ].map(({ label, value }) => (
          <div key={label} className="border border-border px-4 py-4">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">{label}</p>
            <p className="mt-2 font-mono-ui text-[11px] uppercase tracking-[.1em] text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-2">Created</p>
          <p className="text-sm">
            {new Date(project.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div>
          <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-2">Last edited</p>
          <p className="text-sm">
            {new Date(project.updatedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <ContextualAI project={project} />
    </motion.div>
  );
}

function NotesTab({ project }: { project: (typeof DEMO_PROJECTS)[0] }) {
  return (
    <motion.div
      key="notes"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground">
          {project.notes.length} notes · read-only
        </p>
      </div>
      {project.notes.length === 0 && (
        <div className="border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">No notes in this project.</p>
        </div>
      )}
      {project.notes.map((note, i) => (
        <div key={note.id} className={`py-5 ${i > 0 ? "border-t border-border" : "border-t border-border"}`}>
          <div className="flex items-center gap-3 mb-3">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">
              {new Date(note.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </p>
            {note.tag && (
              <span className="border border-border px-2 py-0.5 font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground">
                {note.tag}
              </span>
            )}
          </div>
          <p className="text-sm leading-6 text-foreground/80">{note.body}</p>
        </div>
      ))}
      <ContextualAI project={project} />
    </motion.div>
  );
}

function MaterialsTab({ project }: { project: (typeof DEMO_PROJECTS)[0] }) {
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
            className={`flex items-center justify-between py-4 ${i > 0 ? "border-t border-border" : "border-t border-border"}`}
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

function FormulasTab({ project }: { project: (typeof DEMO_PROJECTS)[0] }) {
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
          const modNum = String(project.modCount - i).padStart(2, "0");
          const isLatest = i === 0;
          return (
            <div
              key={modNum}
              className={`flex items-center justify-between py-4 ${i > 0 ? "border-t border-border" : "border-t border-border"}`}
            >
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
                  {new Date(project.updatedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              {/* No link — representative data cannot open real formulas */}
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
        >
          Browse formulas →
        </Link>
      </div>
    </motion.div>
  );
}

function EvaluationTab({ project }: { project: (typeof DEMO_PROJECTS)[0] }) {
  const [open, setOpen] = useState<string | null>(project.evaluations[0]?.id ?? null);

  return (
    <motion.div
      key="evaluation"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground">
        {project.evaluations.length} evaluation{project.evaluations.length !== 1 ? "s" : ""} · read-only
      </p>
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
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/20"
            data-testid={`button-evaluation-${ev.id}`}
          >
            <div>
              <p className="font-mono-ui text-[11px] uppercase tracking-[.1em]">{ev.modLabel}</p>
              <p className="mt-0.5 font-mono-ui text-[8px] text-muted-foreground/60">{ev.date}</p>
            </div>
            <span className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground shrink-0">
              {open === ev.id ? "Close" : "Read"}
            </span>
          </button>
          <AnimatePresence>
            {open === ev.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="border-t border-border px-5 py-5 space-y-4">
                  {(
                    [
                      { label: "Opening", value: ev.opening },
                      { label: "15 min", value: ev.fifteenMin },
                      ev.oneHour ? { label: "1 hour", value: ev.oneHour } : null,
                      ev.fourHour ? { label: "4 hours", value: ev.fourHour } : null,
                      ev.drydown ? { label: "Drydown", value: ev.drydown } : null,
                      { label: "Overall", value: ev.overall },
                      { label: "What works", value: ev.whatWorks },
                      { label: "Adjustments", value: ev.adjustments },
                    ] as Array<{ label: string; value: string } | null>
                  )
                    .filter(Boolean)
                    .map((item) => (
                      <div key={item!.label}>
                        <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-1">
                          {item!.label}
                        </p>
                        <p className="text-sm leading-6 text-foreground/80">{item!.value}</p>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
      {project.evaluations.length > 0 && <ContextualAI project={project} />}
    </motion.div>
  );
}

export function ProjectWorkspace() {
  const params = useParams<{ id: string }>();
  const project = DEMO_PROJECTS.find((p) => p.id === params.id);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");

  if (!project) {
    return (
      <div className="py-20 text-center">
        <p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground mb-4">
          Not found
        </p>
        <h1 className="font-display text-4xl">This project doesn't exist.</h1>
        <div className="mt-6">
          <Link
            href="/projects"
            className="font-mono-ui text-[9px] uppercase tracking-widest underline-offset-4 hover:underline"
            data-testid="link-back-projects"
          >
            ← Back to projects
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-border px-3 py-1.5 font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">
              {project.status} · {project.modCount} mods
            </span>
            <Link
              href={`/projects/${project.id}/inspiration`}
              data-testid="link-project-inspiration"
              className="border border-foreground/20 px-3 py-1.5 font-mono-ui text-[8px] uppercase tracking-[.14em] transition-colors hover:border-foreground"
            >
              Moodboard <ArrowRight size={10} className="inline ml-1" />
            </Link>
          </div>
        </div>
        <p className="mt-3 font-mono-ui text-[7px] uppercase tracking-[.12em] text-muted-foreground/50">
          Representative project · read-only · no backend entity yet
        </p>
      </header>

      {/* Tab navigation */}
      <div className="flex overflow-x-auto border-b border-border" data-testid="project-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`tab-${tab.id}`}
            className={`relative shrink-0 px-5 py-4 font-mono-ui text-[9px] uppercase tracking-[.14em] transition-colors ${
              activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="project-tab-bar"
                className="absolute inset-x-0 bottom-0 h-[2px] bg-foreground"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-8">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && <OverviewTab key="overview" project={project} />}
          {activeTab === "inspiration" && (
            <motion.div
              key="inspiration"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground">
                {project.inspiration.length} references collected · read-only
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {project.inspiration.slice(0, 3).map((item) => (
                  <div key={item.id} className="border border-border overflow-hidden">
                    {item.type === "image" && item.src && (
                      <img
                        src={item.src}
                        alt={item.caption ?? ""}
                        className="h-36 w-full object-cover grayscale opacity-60"
                      />
                    )}
                    <div className="p-4">
                      {item.type === "quote" && (
                        <p className="italic text-sm leading-6 text-foreground/80">
                          &ldquo;{item.body}&rdquo;
                        </p>
                      )}
                      {item.type === "material" && (
                        <p className="font-mono-ui text-[10px] uppercase tracking-[.1em]">
                          {item.materialName}
                        </p>
                      )}
                      {item.type === "note" && (
                        <p className="text-sm leading-6 text-foreground/80">{item.body}</p>
                      )}
                      {item.caption && (
                        <p className="mt-2 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">
                          {item.caption}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href={`/projects/${project.id}/inspiration`}
                data-testid="link-view-full-moodboard"
                className="inline-flex items-center gap-2 border border-border px-4 py-2 font-mono-ui text-[9px] uppercase tracking-widest transition-colors hover:bg-secondary"
              >
                Open moodboard <ArrowRight size={11} />
              </Link>
            </motion.div>
          )}
          {activeTab === "notes" && <NotesTab key="notes" project={project} />}
          {activeTab === "materials" && <MaterialsTab key="materials" project={project} />}
          {activeTab === "formulas" && <FormulasTab key="formulas" project={project} />}
          {activeTab === "evaluation" && <EvaluationTab key="evaluation" project={project} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
