/**
 * /projects/:id — Project workspace
 * MATIÈRE light: parchment ground, editorial image hero, direction strips.
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams, useSearch, useLocation } from "wouter";
import { ArrowRight, ChevronDown } from "lucide-react";
import { DEMO_PROJECTS, DEMO_FORMULAS } from "../data/projects";
import type { DemoProject, ProjectEvaluation, DemoFormula } from "../data/projects";

type WorkspaceTab = "overview" | "inspiration" | "evaluation" | "notes" | "materials" | "formulas";
const VALID_TABS = new Set<WorkspaceTab>(["overview", "inspiration", "evaluation", "notes", "materials", "formulas"]);
const TABS: { id: WorkspaceTab; label: string }[] = [
  { id: "overview",    label: "Overview"   },
  { id: "inspiration", label: "Canvas"     },
  { id: "evaluation",  label: "Evaluation" },
  { id: "notes",       label: "Notes"      },
  { id: "materials",   label: "Materials"  },
  { id: "formulas",    label: "Mods"       },
];

const TEMPORAL_KEYS = new Set<keyof ProjectEvaluation>(["opening", "fifteenMin", "oneHour", "fourHour", "drydown"]);
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

function statusLabel(s: DemoProject["status"]): string {
  return s === "active" ? "Active" : s === "resting" ? "Resting" : s === "archived" ? "Archived" : "Complete";
}

function DirectionStrip({ project, activeTab }: { project: DemoProject; activeTab: WorkspaceTab }) {
  if (activeTab === "overview") return null;
  return (
    <div className="flex items-center gap-4 border-b border-border mb-6 py-2.5">
      <span className="inline-block h-1 w-1 bg-accent shrink-0" aria-hidden />
      <p className="font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground truncate">{project.olfactiveDirection}</p>
      <span className="text-border text-xs shrink-0" aria-hidden>·</span>
      <p className="font-mono-ui text-[7px] uppercase tracking-[.12em] text-muted-foreground/60 shrink-0">MOD {String(project.modCount).padStart(2, "0")}</p>
    </div>
  );
}

function ContextualAI({ project }: { project: DemoProject }) {
  const [open, setOpen] = useState(false);
  const ev = project.evaluations[0];
  const obs = ev
    ? { label: "Reading the latest evaluation", body: `One interpretation: ${ev.modLabel} noted "${ev.whatWorks}" as what is working. The adjustment direction ("${ev.adjustments}") suggests the composition is resolving toward its anchor.` }
    : { label: "Structural observation", body: `This project is at an early stage with ${project.modCount} mods. The olfactive direction ("${project.olfactiveDirection}") suggests a clear intention.` };

  return (
    <div className="border-t border-border">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-3 py-4 text-left hover:opacity-70 transition-opacity"
        data-testid="button-ai-action">
        <div className="flex items-center gap-2.5">
          <span className="inline-block h-1 w-1 bg-accent shrink-0" aria-hidden />
          <span className="font-mono-ui text-[7px] uppercase tracking-[.18em] text-muted-foreground">{obs.label}</span>
        </div>
        <span className="font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground/50 shrink-0">{open ? "Close" : "Explore"}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="pb-5">
              <p className="text-xs leading-7 text-muted-foreground">{obs.body}</p>
              <p className="mt-3 font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground/40">Interpretive only · local project data</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EvalPhase({ label, body, isTimeline }: { label: string; body: string; isTimeline: boolean }) {
  return (
    <div className="py-5 border-t border-border">
      <div className="flex items-start gap-4">
        {isTimeline && <p className="font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground/60 w-12 shrink-0 mt-0.5">{label}</p>}
        <div className="min-w-0 flex-1">
          {!isTimeline && <p className="font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground mb-2">{label}</p>}
          <p className="text-sm leading-7 text-foreground/80">{body}</p>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ project }: { project: DemoProject }) {
  const BASE = import.meta.env.BASE_URL + "images/";
  const imgFile = (project.heroImage ?? project.coverImage ?? "sel-gris-01.jpg").replace(/^.*\/images\//, "");
  const latestEval = project.evaluations[0];
  const latestNote = project.notes[0];

  return (
    <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Hero — full-bleed, warm overlay keeps it light */}
      <div className="-mx-5 sm:-mx-8 lg:-mx-12 relative overflow-hidden flex flex-col justify-end" style={{ height: "clamp(260px, 36vw, 420px)" }}>
        <img src={BASE + imgFile} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-75" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(var(--foreground) / 0.55) 0%, transparent 60%)" }} />
        {project.creativeStatement && (
          <div className="relative px-5 pb-8 sm:px-8 lg:px-12">
            <p className="font-mono-ui text-[7px] uppercase tracking-[.20em] text-white/60 mb-1">{project.olfactiveDirection}</p>
            <p className="font-display leading-[.9] tracking-[-0.03em] text-white" style={{ fontSize: "clamp(1.8rem, 4vw, 3.5rem)" }}>
              {project.creativeStatement}
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      <section className="py-8">
        <p className="font-mono-ui text-[7px] uppercase tracking-[.26em] text-muted-foreground mb-2">Current world</p>
        <p className="text-base leading-8 text-foreground/80 max-w-2xl">{project.description}</p>
      </section>

      {/* Status strip */}
      <section className="flex overflow-x-auto border-t border-b border-border">
        {[
          { label: "Status",    value: statusLabel(project.status) },
          { label: "Mod",       value: `MOD ${String(project.modCount).padStart(2, "0")}` },
          { label: "Materials", value: String(project.linkedMaterialNames.length) },
          { label: "Notes",     value: String(project.notes.length) },
        ].map(({ label, value }, i) => (
          <div key={label} className={`shrink-0 px-5 py-5 ${i > 0 ? "border-l border-border" : ""}`}>
            <p className="font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground">{label}</p>
            <p className="mt-1.5 font-display text-2xl tracking-[-0.02em] text-foreground">{value}</p>
          </div>
        ))}
      </section>

      {/* Latest evaluation */}
      {latestEval && (
        <section className="py-8">
          <div className="flex items-center justify-between mb-5">
            <p className="font-mono-ui text-[7px] uppercase tracking-[.22em] text-muted-foreground">Latest evaluation · {latestEval.modLabel}</p>
            <p className="font-mono-ui text-[7px] text-muted-foreground/60">{latestEval.date}</p>
          </div>
          <EvalPhase label="Opening" body={latestEval.opening} isTimeline />
          <EvalPhase label="Overall" body={latestEval.overall} isTimeline={false} />
          <EvalPhase label="Adjustments" body={latestEval.adjustments} isTimeline={false} />
        </section>
      )}

      {/* Key materials */}
      {project.linkedMaterialNames.length > 0 && (
        <section className="border-t border-border py-8">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono-ui text-[7px] uppercase tracking-[.22em] text-muted-foreground">Key materials</p>
            <Link href="/materials" className="font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground hover:text-foreground transition-colors" data-testid="link-overview-materials">Library</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.linkedMaterialNames.map((name, i) => (
              <Link key={name} href={`/materials?search=${encodeURIComponent(name)}`} data-testid={`link-overview-material-${i}`}
                className="border border-border px-3 py-1.5 font-mono-ui text-[7px] uppercase tracking-[.10em] text-muted-foreground hover:border-foreground hover:text-foreground transition-colors">
                {name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest note */}
      {latestNote && (
        <section className="border-t border-border py-8">
          <p className="font-mono-ui text-[7px] uppercase tracking-[.22em] text-muted-foreground mb-4">Latest note</p>
          {latestNote.tag && <p className="font-mono-ui text-[7px] uppercase tracking-widest text-accent mb-2">{latestNote.tag}</p>}
          <p className="text-sm leading-7 text-foreground/75">{latestNote.body}</p>
          <p className="mt-3 font-mono-ui text-[7px] text-muted-foreground/60">{new Date(latestNote.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric" })}</p>
        </section>
      )}

      {/* Canvas fragment */}
      <section className="border-t border-border py-8">
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono-ui text-[7px] uppercase tracking-[.22em] text-muted-foreground">Canvas fragment</p>
          <Link href={`/projects/${project.id}/inspiration`} data-testid="link-overview-canvas"
            className="font-mono-ui text-[7px] uppercase tracking-[.14em] text-foreground hover:opacity-70 transition-opacity inline-flex items-center gap-1.5">
            Open canvas <ArrowRight size={9} strokeWidth={1.5} />
          </Link>
        </div>
        <div className="relative overflow-hidden bg-card" style={{ height: "clamp(130px, 18vw, 190px)" }}>
          {project.inspiration.filter(i => i.type === "image" && i.src).slice(0, 3).map((item, i) => {
            const pos = [
              { top: "0", left: "0", width: "54%", height: "100%", zIndex: 1 },
              { top: "5%", left: "38%", width: "34%", height: "85%", zIndex: 2 },
              { bottom: "0", right: "2%", width: "20%", height: "50%", zIndex: 3 },
            ][i];
            if (!pos) return null;
            return (
              <div key={item.id} className="absolute overflow-hidden" style={{ ...pos }}>
                <img src={item.src} alt="" loading="lazy" className="w-full h-full object-cover opacity-70" />
              </div>
            );
          })}
          <div className="absolute inset-0 flex items-end justify-end p-3 pointer-events-none" style={{ zIndex: 10 }}>
            <div className="border-l-2 border-accent bg-background/90 px-2 py-1.5">
              <p className="font-mono-ui text-[6px] uppercase tracking-[.14em] text-muted-foreground">Direction</p>
              <p className="font-mono-ui text-[7px] text-foreground">{project.olfactiveDirection.split("·")[0].trim()}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Next question */}
      {project.nextQuestion && (
        <section className="border-t border-border py-8">
          <p className="font-mono-ui text-[7px] uppercase tracking-[.22em] text-muted-foreground mb-4">Next question</p>
          <p className="font-display leading-[.92] tracking-[-0.02em] text-foreground/60" style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)" }}>
            &ldquo;{project.nextQuestion}&rdquo;
          </p>
        </section>
      )}

      <ContextualAI project={project} />
    </motion.div>
  );
}

function InspirationTab({ project }: { project: DemoProject }) {
  const images = project.inspiration.filter(i => i.type === "image").slice(0, 4);
  return (
    <motion.div key="inspiration-tab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-5">
        <p className="font-mono-ui text-[7px] uppercase tracking-[.20em] text-muted-foreground">{project.inspiration.length} references</p>
        <Link href={`/projects/${project.id}/inspiration`} data-testid="link-open-moodboard"
          className="font-mono-ui text-[7px] uppercase tracking-[.16em] text-foreground hover:opacity-70 transition-opacity inline-flex items-center gap-1.5">
          Open canvas <ArrowRight size={8} strokeWidth={1.5} />
        </Link>
      </div>
      {images.length > 0 && (
        <div className="relative w-full overflow-hidden bg-card" style={{ height: "clamp(240px, 36vw, 380px)" }}>
          {images.slice(0, 3).map((item, i) => {
            const positions = [
              { top: "0%", left: "0%", width: "54%", height: "90%", zIndex: 1 },
              { top: "6%", left: "37%", width: "34%", height: "70%", zIndex: 2 },
              { bottom: "0%", left: "58%", width: "28%", height: "44%", zIndex: 3 },
            ];
            const pos = positions[i];
            if (!pos) return null;
            return (
              <Link key={item.id} href={`/projects/${project.id}/inspiration`} data-testid={`link-insp-tab-${item.id}`}
                className="absolute group overflow-hidden block" style={{ ...pos, display: "block" } as React.CSSProperties}>
                <img src={item.src} alt={item.caption ?? ""} loading="lazy"
                  className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:opacity-100 group-hover:scale-[1.02]" />
              </Link>
            );
          })}
          <Link href={`/projects/${project.id}/inspiration`} data-testid="link-canvas-enter"
            className="absolute bottom-4 right-4 bg-foreground text-background px-4 py-2 font-mono-ui text-[7px] uppercase tracking-[.18em] inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            style={{ zIndex: 10 }}>
            Enter Canvas <ArrowRight size={8} strokeWidth={1.5} />
          </Link>
        </div>
      )}
      <div className="mt-5 space-y-0">
        {project.inspiration.filter(i => i.type !== "image").slice(0, 4).map(item => (
          <div key={item.id} className="border-l-2 border-border pl-4 py-2">
            {item.type === "quote" && <p className="italic text-sm leading-7 text-foreground/65">&ldquo;{item.body}&rdquo;</p>}
            {item.type === "material" && (<><p className="font-mono-ui text-[6px] uppercase tracking-[.18em] text-muted-foreground mb-1">Material</p><p className="text-sm text-foreground">{item.materialName}</p>{item.body && <p className="mt-1 text-xs text-muted-foreground leading-5">{item.body}</p>}</>)}
            {(item.type === "text" || item.type === "note") && (<>{item.tag && <p className="font-mono-ui text-[6px] uppercase tracking-widest text-muted-foreground/50 mb-1">{item.tag}</p>}<p className="text-sm leading-6 text-foreground/70">{item.body}</p></>)}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function EvaluationTab({ project }: { project: DemoProject }) {
  const [open, setOpen] = useState<string | null>(project.evaluations[0]?.id ?? null);
  return (
    <motion.div key="evaluation" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <p className="font-mono-ui text-[7px] uppercase tracking-[.20em] text-muted-foreground mb-6">{project.evaluations.length} evaluation{project.evaluations.length !== 1 ? "s" : ""} · read-only</p>
      {project.evaluations.length === 0 && (
        <div className="border border-dashed border-border py-12 text-center"><p className="text-sm text-muted-foreground">No evaluations recorded.</p></div>
      )}
      {project.evaluations.map(ev => (
        <div key={ev.id} className="border-t border-border">
          <button type="button" onClick={() => setOpen(open === ev.id ? null : ev.id)}
            aria-expanded={open === ev.id} aria-controls={`eval-body-${ev.id}`}
            className="flex w-full items-center justify-between gap-4 py-5 text-left hover:opacity-70 transition-opacity"
            data-testid={`button-evaluation-${ev.id}`}>
            <div>
              <p className="font-mono-ui text-[10px] uppercase tracking-[.10em] text-foreground">{ev.modLabel}</p>
              <p className="mt-0.5 font-mono-ui text-[7px] text-muted-foreground/60">{ev.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground/50 shrink-0">{open === ev.id ? "Close" : "Read"}</span>
              <ChevronDown size={11} className={`text-muted-foreground transition-transform ${open === ev.id ? "rotate-180" : ""}`} />
            </div>
          </button>
          <AnimatePresence>
            {open === ev.id && (
              <motion.div id={`eval-body-${ev.id}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                <div className="pb-6">
                  {EVAL_PHASES.filter(ph => typeof ev[ph.key] === "string" && (ev[ph.key] as string).length > 0).map(ph => (
                    <EvalPhase key={ph.key} label={ph.label} body={ev[ph.key] as string} isTimeline={TEMPORAL_KEYS.has(ph.key)} />
                  ))}
                </div>
                <div className="pb-5 border-t border-border pt-4">
                  <Link href={`/projects/${project.id}/inspiration`} data-testid={`link-eval-to-canvas-${ev.id}`}
                    className="font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5">
                    <span className="inline-block h-1 w-1 bg-accent" aria-hidden /> Add observation to canvas
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
      {project.evaluations.length > 0 && <div className="pt-6"><ContextualAI project={project} /></div>}
    </motion.div>
  );
}

function NotesTab({ project }: { project: DemoProject }) {
  return (
    <motion.div key="notes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <p className="font-mono-ui text-[7px] uppercase tracking-[.20em] text-muted-foreground mb-6">{project.notes.length} notes · read-only</p>
      {project.notes.length === 0 && (<div className="border border-dashed border-border py-12 text-center"><p className="text-sm text-muted-foreground">No notes.</p></div>)}
      {project.notes.map((note, i) => (
        <div key={note.id} className={`py-6 ${i > 0 ? "border-t border-border" : ""}`}>
          <div className="flex items-center gap-3 mb-3">
            <p className="font-mono-ui text-[7px] uppercase tracking-[.12em] text-muted-foreground/60">{new Date(note.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>
            {note.tag && <span className="font-mono-ui text-[7px] uppercase tracking-[.10em] text-accent border border-accent/30 px-1.5 py-0.5">{note.tag}</span>}
          </div>
          <p className="text-sm leading-7 text-foreground/75">{note.body}</p>
        </div>
      ))}
      <div className="pt-6 border-t border-border"><ContextualAI project={project} /></div>
    </motion.div>
  );
}

function MaterialsTab({ project }: { project: DemoProject }) {
  return (
    <motion.div key="materials" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="border-l-2 border-accent/40 pl-4 py-2 mb-6">
        <p className="font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground/60">Materials in this project · representative</p>
      </div>
      <div className="flex items-center justify-between mb-6">
        <p className="font-mono-ui text-[7px] uppercase tracking-[.20em] text-muted-foreground">{project.linkedMaterialNames.length} materials</p>
        <Link href="/materials" data-testid="link-project-browse-materials" className="font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground hover:text-foreground transition-colors">Browse library</Link>
      </div>
      {project.linkedMaterialNames.map((name, i) => {
        const ref = project.inspiration.find(it => it.type === "material" && it.materialName === name);
        return (
          <div key={name} className={`py-5 ${i > 0 ? "border-t border-border" : ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{name}</p>
                {ref?.body && <p className="mt-1 text-xs text-muted-foreground leading-5 max-w-sm">{ref.body}</p>}
              </div>
              <Link href={`/materials?search=${encodeURIComponent(name)}`} data-testid={`link-material-search-${i}`}
                className="font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 shrink-0">
                Search <ArrowRight size={8} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        );
      })}
      <div className="mt-8 border-t border-border pt-6">
        <Link href="/formulas/new" data-testid="link-materials-to-formula"
          className="font-mono-ui text-[7px] uppercase tracking-widest text-foreground inline-flex items-center gap-1.5 hover:opacity-70 transition-opacity">
          <span className="inline-block h-1 w-1 bg-accent" aria-hidden /> Add to current mod <ArrowRight size={8} strokeWidth={1.5} />
        </Link>
      </div>
    </motion.div>
  );
}

function FormulasTab({ project }: { project: DemoProject }) {
  const projectFormulas: DemoFormula[] = DEMO_FORMULAS.filter(f => f.project.toLowerCase() === project.name.toLowerCase());
  return (
    <motion.div key="formulas" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="border border-border bg-card/60 px-4 py-4 mb-6">
        <p className="font-mono-ui text-[6px] uppercase tracking-[.20em] text-muted-foreground mb-2">Current direction</p>
        <div className="flex flex-wrap gap-3">
          {project.olfactiveDirection.split("·").map(d => (
            <span key={d} className="font-mono-ui text-[8px] uppercase tracking-[.10em] text-foreground/70">{d.trim()}</span>
          ))}
        </div>
      </div>
      <p className="font-mono-ui text-[7px] uppercase tracking-[.20em] text-muted-foreground mb-6">
        {project.modCount} mods{projectFormulas.length > 0 ? ` · ${projectFormulas.length} with representative data` : ""}
      </p>
      {projectFormulas.length > 0 ? (
        <div>
          {projectFormulas.map((f, i) => (
            <div key={f.id} className={`py-5 ${i > 0 ? "border-t border-border" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-foreground">{f.mod}</p>
                    {f.status === "active" && <span className="border-l-2 border-accent pl-2 font-mono-ui text-[6px] uppercase tracking-widest text-muted-foreground">Active</span>}
                    {f.status === "archived" && <span className="font-mono-ui text-[6px] uppercase tracking-widest text-muted-foreground/40">Archived</span>}
                  </div>
                  <p className="font-mono-ui text-[7px] uppercase tracking-[.10em] text-muted-foreground mb-2">{f.direction}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {f.materials.slice(0, 3).map(m => <span key={m} className="font-mono-ui text-[6px] uppercase tracking-widest text-muted-foreground/60">{m}</span>)}
                  </div>
                  <p className="text-xs text-muted-foreground leading-5 italic max-w-md">&ldquo;{f.lastEvaluation}&rdquo;</p>
                </div>
                <span className="font-mono-ui text-[6px] uppercase tracking-widest text-muted-foreground/40 shrink-0 mt-1">[DEMO]</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {Array.from({ length: project.modCount }, (_, i) => {
            const modNum = String(project.modCount - i).padStart(2, "0");
            return (
              <div key={modNum} className={`flex items-center justify-between py-4 ${i > 0 ? "border-t border-border" : ""}`}>
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-foreground">MOD {modNum}</p>
                    {i === 0 && <span className="border-l-2 border-accent pl-2 font-mono-ui text-[6px] uppercase tracking-widest text-muted-foreground">Latest</span>}
                  </div>
                  <p className="mt-0.5 font-mono-ui text-[7px] text-muted-foreground/60">{new Date(project.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                </div>
                <span className="font-mono-ui text-[6px] uppercase tracking-widest text-muted-foreground/40">Representative</span>
              </div>
            );
          })}
        </div>
      )}
      <div className="border-t border-border pt-6 mt-4">
        <Link href="/formulas" className="font-mono-ui text-[7px] uppercase tracking-widest text-foreground inline-flex items-center gap-1.5 hover:opacity-70 transition-opacity" data-testid="link-project-browse-formulas">
          Browse formula library <ArrowRight size={8} strokeWidth={1.5} />
        </Link>
      </div>
    </motion.div>
  );
}

export function ProjectWorkspace() {
  const params = useParams<{ id: string }>();
  const search = useSearch();
  const [, setLocation] = useLocation();
  const project = DEMO_PROJECTS.find(p => p.id === params.id);

  const rawTab = new URLSearchParams(search).get("tab") ?? "";
  const activeTab: WorkspaceTab = VALID_TABS.has(rawTab as WorkspaceTab) ? (rawTab as WorkspaceTab) : "overview";

  const handleTabChange = useCallback((tab: WorkspaceTab) => {
    setLocation(`/projects/${params.id}${tab === "overview" ? "" : `?tab=${tab}`}`, { replace: true });
  }, [params.id, setLocation]);

  if (!project) {
    return (
      <div className="py-20 text-center animate-fade-in">
        <p className="font-mono-ui text-[7px] uppercase tracking-[.20em] text-muted-foreground mb-4">Not found</p>
        <h1 className="font-display text-4xl text-foreground">This project doesn&apos;t exist.</h1>
        <div className="mt-6">
          <Link href="/projects" className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-projects">Back to projects</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 pt-7 pb-4">
        <Link href="/projects" data-testid="link-breadcrumb-projects" className="font-mono-ui text-[7px] uppercase tracking-[.20em] text-muted-foreground hover:text-foreground transition-colors">Projects</Link>
        <span className="text-muted-foreground/40 text-xs">/</span>
        <span className="font-mono-ui text-[7px] uppercase tracking-[.20em] text-foreground">{project.name}</span>
      </div>

      {/* Header */}
      <header className="border-b border-border pb-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono-ui text-[7px] uppercase tracking-[.20em] text-muted-foreground">{project.olfactiveDirection}</p>
            <h1 className="mt-2 font-display tracking-[-0.04em] leading-[.88] text-foreground" style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)" }} data-testid="heading-project-name">
              {project.name}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="font-mono-ui text-[7px] uppercase tracking-[.12em] text-muted-foreground border border-border px-2.5 py-1.5">
              {statusLabel(project.status)} · MOD {String(project.modCount).padStart(2, "0")}
            </span>
            <Link href={`/projects/${project.id}/inspiration`} data-testid="link-project-inspiration"
              className="border border-border px-3 py-1.5 font-mono-ui text-[7px] uppercase tracking-[.12em] transition-colors hover:border-foreground inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <span className="inline-block h-1 w-1 bg-accent" aria-hidden /> Canvas
            </Link>
          </div>
        </div>
        <p className="mt-2 font-mono-ui text-[6px] uppercase tracking-[.10em] text-muted-foreground/50">Representative project · read-only</p>
      </header>

      {/* Tab bar */}
      <div role="tablist" aria-label="Project workspace tabs" className="flex overflow-x-auto border-b border-border" data-testid="project-tabs">
        {TABS.map(tab => (
          <button key={tab.id} id={`tab-${tab.id}`} type="button" role="tab"
            aria-selected={activeTab === tab.id} aria-controls={`tabpanel-${tab.id}`}
            onClick={() => handleTabChange(tab.id)} data-testid={`tab-${tab.id}`}
            className={["relative shrink-0 px-4 py-4 font-mono-ui text-[8px] uppercase tracking-[.14em] transition-colors focus-visible:outline-none",
              activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"].join(" ")}>
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="project-tab-bar" className="absolute inset-x-0 bottom-0 h-[1px] bg-accent" transition={{ type: "tween", duration: 0.16 }} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="pt-8">
        <DirectionStrip project={project} activeTab={activeTab} />
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
