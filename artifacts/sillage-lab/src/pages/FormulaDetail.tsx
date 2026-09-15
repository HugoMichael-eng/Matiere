import { useState, useMemo, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useLocation, useParams, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetDashboardSummaryQueryKey, getGetFormulaEventsQueryKey,
  getGetFormulaQueryKey, getListFormulasQueryKey,
  useDeleteFormula, useGetFormulaEvents, useUpdateFormula,
} from "@workspace/api-client-react";
import type { FormulaIngredientInput } from "@workspace/api-client-react";
import { IngredientBuilder } from "../components/IngredientBuilder";
import { FormulaToolFileUpload } from "../components/FormulaToolFileUpload";
import { WorkflowNav } from "../components/WorkflowNav";
import { WORKFLOW_STAGES, getCompletedWorkflowStages, getSuggestedWorkflowStage } from "../lib/workflow";
import type { WorkflowStageId } from "../types/workflow";
import { Button } from "../components/Button";
import { ErrorState } from "../components/ErrorState";
import { IfraCategoryPicker, IFRA_CATEGORIES } from "../components/IfraCategoryPicker";
import { PageHeader } from "../components/PageHeader";
import { SectionRule } from "../components/SectionRule";
import { Skeleton } from "../components/Skeleton";
import { StatusPill } from "../components/StatusPill";
import { Shell } from "../components/Shell";
import { WorkflowStagePanel } from "../components/WorkflowStagePanel";
import { useFormula } from "../hooks/useFormula";
import { useMaterials } from "../hooks/useMaterials";
export function FormulaDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const rawSearch = useSearch();
  const searchParams = new URLSearchParams(rawSearch);
  const stageParam = searchParams.get("stage") as WorkflowStageId | null;
  const requestedStage: WorkflowStageId | null = stageParam && WORKFLOW_STAGES.some(stage => stage.id === stageParam) ? stageParam : null;

  const query = useFormula(id);
  const update = useUpdateFormula();
  const remove = useDeleteFormula();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const formula = query.data;

  const materialsQuery = useMaterials();
  const materials = materialsQuery.data ?? [];

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"draft" | "resting" | "approved" | "archived">("draft");
  const [editConcentration, setEditConcentration] = useState(20);
  const [editTotalMl, setEditTotalMl] = useState(30);
  const [editIfraCategory, setEditIfraCategory] = useState("");
  const [editIngredients, setEditIngredients] = useState<FormulaIngredientInput[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

  const begin = () => {
    if (!formula) return;
    setSaveError(null);
    setName(formula.name);
    setBrief(formula.brief);
    setNotes(formula.notes ?? "");
    setStatus(formula.status);
    setEditConcentration(formula.concentration);
    setEditTotalMl(formula.totalMl);
    setEditIfraCategory(formula.ifraCategory ?? "");
    setEditIngredients(formula.ingredients.map(i => ({
      materialId: i.materialId,
      materialName: i.materialName,
      percentage: i.percentage,
      grams: i.grams,
      dilution: i.dilution ?? 100,
      role: i.role as FormulaIngredientInput["role"],
      allergenFlags: i.allergenFlags ?? [],
    })));
    setEditing(true);
  };

  const save = () => {
    if (!formula) return;
    setSaveError(null);
    update.mutate(
      { id, data: { expectedVersion: formula.version, name, brief, notes, status, concentration: editConcentration, totalMl: editTotalMl, ifraCategory: editIfraCategory || undefined, ingredients: editIngredients } },
      {
        onSuccess: result => {
          qc.setQueryData(getGetFormulaQueryKey(id), result);
          qc.invalidateQueries({ queryKey: getListFormulasQueryKey() });
          qc.invalidateQueries({ queryKey: getGetFormulaEventsQueryKey(id) });
          qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          setEditing(false);
        },
        onError: error => {
          const isConflict = (error as { status?: number }).status === 409;
          setSaveError(isConflict
            ? "This formula changed in another editor. Your work is still open here; close and reopen Edit to reconcile with the latest version."
            : "Couldn't save this revision. Your work is still open; try again.");
          if (isConflict) query.refetch();
        },
      },
    );
  };

  const destroy = () => {
    if (window.confirm("Delete this formula from the library?"))
      remove.mutate({ id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListFormulasQueryKey() }); setLocation("/formulas"); } });
  };

  const eventsQuery = useGetFormulaEvents(id, { query: { queryKey: getGetFormulaEventsQueryKey(id), enabled: Number.isFinite(id) } });
  const events = eventsQuery.data ?? [];

  // Determine which stages are "done" based on formula data
  const completedStages = useMemo(
    () => getCompletedWorkflowStages(formula, materials),
    [formula, materials],
  );
  const activeStage = requestedStage ?? getSuggestedWorkflowStage(formula, materials);

  // Stage navigation helper — updates URL query string
  const navigateToStage = useCallback((stage: WorkflowStageId) => {
    setLocation(`/formulas/${id}?stage=${stage}`);
  }, [id, setLocation]);

  // Next stage in the workflow
  const currentIdx = WORKFLOW_STAGES.findIndex(s => s.id === activeStage);
  const nextStage = WORKFLOW_STAGES[currentIdx + 1];
  const prevStage = WORKFLOW_STAGES[currentIdx - 1];

  if (query.isLoading) return <Shell><div className="space-y-4 pt-8"><Skeleton className="h-20 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-72 w-full" /></div></Shell>;
  if (query.isError || !formula) return <Shell><ErrorState retry={() => query.refetch()} /></Shell>;

  return (
    <Shell>
      {/* ── Header ───────────────────────────────────────────── */}
      <PageHeader
        eyebrow={`Formula ${String(formula.id).padStart(3, "0")} · v${formula.version}`}
        title={formula.name}
        description={formula.brief}
        action={
          <div className="flex flex-wrap gap-2">
            <FormulaToolFileUpload testId="button-formula-upload-file" />
            <Button onClick={begin} variant="outline" testId="button-edit-formula">Edit</Button>
            <Button onClick={destroy} variant="quiet" testId="button-delete-formula">Delete</Button>
          </div>
        }
      />

      {/* ── Workflow navigation ───────────────────────────────── */}
      <WorkflowNav
        activeStage={activeStage}
        formulaId={id}
        completedStages={completedStages}
      />

      {/* ── Status strip ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-4">
        <div className="flex items-center gap-3">
          <StatusPill value={formula.status} />
          <StatusPill value={formula.safetyStatus} />
          <StatusPill value={formula.ifraStatus} />
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono-ui text-[10px] text-muted-foreground">{formula.concentration}% · {formula.totalMl} ml · {formula.ingredients.length} materials</span>
        </div>
      </div>

      {/* ── Main content: stage panel + sidebar ──────────────── */}
      <div className="grid gap-6 py-6 lg:grid-cols-[1.35fr_.65fr]">
        {/* Stage panel */}
        <div>
          {/* Stage header */}
          <div className="mb-4">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground">
              {WORKFLOW_STAGES.find(s => s.id === activeStage)?.label}
            </p>
            <h2 className="mt-0.5 font-display text-2xl">{WORKFLOW_STAGES[currentIdx]?.description}</h2>
          </div>

          {/* Stage content */}
          <AnimatePresence mode="wait">
            <WorkflowStagePanel
              key={activeStage}
              stage={activeStage}
              formula={formula}
              materials={materials}
              events={events}
              onEdit={begin}
            />
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Quick actions */}
          <div className="border border-border bg-card p-5">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground mb-4">Actions</p>
            <div className="space-y-2">
              <Button onClick={begin} variant="outline" testId="button-formula-edit-sidebar">Edit formula</Button>
            </div>
          </div>

          {/* Stage jump */}
          <div className="border border-border bg-secondary/30 p-5">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground mb-3">Jump to stage</p>
            <div className="space-y-1">
              {WORKFLOW_STAGES.map(stage => {
                const Icon = stage.icon;
                const isActive = stage.id === activeStage;
                const isDone = completedStages.has(stage.id);
                return (
                  <button
                    key={stage.id}
                    onClick={() => navigateToStage(stage.id)}
                    data-testid={`button-jump-${stage.id}`}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-secondary/70 ${isActive ? "bg-secondary/80" : ""}`}
                  >
                    <Icon size={11} strokeWidth={1.8} className={isActive ? "text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/40"} />
                    <span className={`font-mono-ui text-[9px] uppercase tracking-[.1em] ${isActive ? "text-foreground font-medium" : isDone ? "text-muted-foreground" : "text-muted-foreground/50"}`}>{stage.label}</span>
                    {isDone && !isActive && <div className="ml-auto h-[3px] w-[3px] bg-accent/80" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metadata */}
          <div className="border border-border bg-card p-5">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground mb-3">Details</p>
            <div className="space-y-2 text-xs">
              {formula.ifraCategory && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Category</span>
                  <span className="text-right">{IFRA_CATEGORIES.find(c => c.value === formula.ifraCategory)?.label ?? `Cat ${formula.ifraCategory}`}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Allergen notes</span>
                <span data-testid="text-formula-allergens">{formula.allergenCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last updated</span>
                <span>{new Date(formula.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span>{formula.version}</span>
              </div>
            </div>
          </div>

          {/* Notes preview */}
          {formula.notes && (
            <div className="border border-border bg-card p-5">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground mb-3">Notes</p>
              <p className="line-clamp-4 text-xs leading-5 text-muted-foreground" data-testid="text-formula-notes">{formula.notes}</p>
              {formula.notes.length > 200 && (
                <button onClick={() => navigateToStage("document")} className="mt-2 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Read all →</button>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* ── Edit dialog (full-screen overlay) ────────────────── */}
      {editing && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-background">
          <div className="mx-auto max-w-5xl px-5 pb-20 pt-6 sm:px-10">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Editing · formula {String(formula.id).padStart(3, "0")}</p>
                <h2 className="mt-1 font-display text-4xl">Stay curious.</h2>
              </div>
              <button onClick={() => setEditing(false)} data-testid="button-close-edit" className="grid size-9 place-items-center border border-border bg-card hover:bg-secondary">
                <X size={16} />
              </button>
            </div>
            <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
              <div className="space-y-5">
                <div className="border border-border bg-card p-6 sm:p-7">
                  <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">The intention</p>
                  <label className="mt-5 block text-xs font-medium">Name
                    <input value={name} onChange={e => setName(e.target.value)} data-testid="input-edit-name" className="mt-2 w-full border-b border-border bg-transparent py-2 font-display text-2xl outline-none focus:border-foreground" />
                  </label>
                  <label className="mt-5 block text-xs font-medium">Brief
                    <textarea value={brief} onChange={e => setBrief(e.target.value)} data-testid="textarea-edit-brief" className="mt-2 min-h-20 w-full resize-none border border-border bg-secondary/45 p-3 text-sm leading-6 outline-none focus:border-foreground/40" />
                  </label>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <label className="text-xs font-medium">Concentration %
                      <input type="number" min="0" max="100" value={editConcentration} onChange={e => setEditConcentration(Number(e.target.value))} data-testid="input-edit-concentration" className="mt-2 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40" />
                    </label>
                    <label className="text-xs font-medium">Batch size ml
                      <input type="number" min="0" value={editTotalMl} onChange={e => setEditTotalMl(Number(e.target.value))} data-testid="input-edit-total-ml" className="mt-2 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40" />
                    </label>
                  </div>
                  <label className="mt-5 block text-xs font-medium">Stage
                    <select value={status} onChange={e => setStatus(e.target.value as typeof status)} data-testid="select-edit-status" className="mt-2 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40">
                      <option value="draft">Draft</option>
                      <option value="resting">Resting</option>
                      <option value="approved">Approved</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                  <IfraCategoryPicker value={editIfraCategory} onChange={setEditIfraCategory} testId="select-edit-ifra-category" />
                  <label className="mt-7 block text-xs font-medium">Notebook notes
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} data-testid="textarea-edit-notes" className="mt-2 min-h-24 w-full resize-none border border-border bg-secondary/45 p-4 text-sm leading-6 outline-none focus:border-foreground/40" placeholder="Observations, references, things to remember..." />
                  </label>
                </div>
              </div>
              <div className="space-y-5">
                <IngredientBuilder ingredients={editIngredients} setIngredients={setEditIngredients} totalMl={editTotalMl} concentration={editConcentration} />
                <div className="flex items-center justify-between border border-border bg-card p-5">
                  <div>
                    <p className="font-display text-2xl">Save the revision.</p>
                    <p className="mt-1 text-xs text-muted-foreground">Each save advances the version and records a revision summary.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setEditing(false)} variant="quiet" testId="button-cancel-edit">Cancel</Button>
                    <Button onClick={save} disabled={update.isPending || !name} testId="button-update-formula">{update.isPending ? "Saving…" : "Save changes"}</Button>
                  </div>
                </div>
                {saveError && <p className="text-sm text-destructive" data-testid="status-update-error">{saveError}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

export default FormulaDetail;
