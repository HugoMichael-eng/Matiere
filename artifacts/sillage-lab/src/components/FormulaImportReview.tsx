import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, CircleAlert, Pencil, Plus, Trash2, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateFormula,
  getListFormulasQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import type { FormulaFileAnalysis } from "../types/files";
import type { FormulaIngredientInput } from "@workspace/api-client-react";
import { normalizeImportRole } from "../lib/formulas";
import { Button } from "./Button";
import { useMaterials } from "../hooks/useMaterials";

export function renderCoachInlineText(value: string): ReactNode {
  return value.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index} className="font-medium text-foreground">{part.slice(2, -2)}</strong>
      : <span key={index}>{part}</span>,
  );
}

function CoachReading({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-sm leading-6">
      {text.split("\n").map((rawLine, index) => {
        const line = rawLine.trim();
        if (!line) return <div key={index} className="h-1" />;
        const heading = line.match(/^#{1,3}\s+(.*)$/);
        if (heading) {
          return <p key={index} className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-muted-foreground">{renderCoachInlineText(heading[1])}</p>;
        }
        if (/^[-*]\s+/.test(line)) {
          return <p key={index} className="flex gap-2"><span className="text-accent-foreground">—</span><span>{renderCoachInlineText(line.replace(/^[-*]\s+/, ""))}</span></p>;
        }
        return <p key={index}>{renderCoachInlineText(line)}</p>;
      })}
    </div>
  );
}

function ImportDisclosure({
  id,
  eyebrow,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`import-section-${id}`}
        data-testid={`button-toggle-import-${id}`}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/30 sm:px-6"
      >
        <span className="min-w-0">
          <span className="block font-mono-ui text-[8px] uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</span>
          <span className="mt-1 block font-display text-2xl">{title}</span>
          <span className="mt-1 block truncate text-xs text-muted-foreground">{summary}</span>
        </span>
        <ChevronDown size={17} className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div id={`import-section-${id}`} className="border-t border-border px-5 py-5 sm:px-6">{children}</div>}
    </section>
  );
}

export function FormulaImportReview({
  analysis,
  onClose,
}: {
  analysis: FormulaFileAnalysis;
  onClose: () => void;
}) {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const materialsQuery = useMaterials();
  const materials = materialsQuery.data ?? [];
  const create = useCreateFormula();
  const [name, setName] = useState(analysis.formulaName);
  const [concentration, setConcentration] = useState(analysis.concentration ?? 20);
  const [totalMl, setTotalMl] = useState(analysis.totalMl ?? 30);
  const [confirmUnlinked, setConfirmUnlinked] = useState(false);
  const [openSection, setOpenSection] = useState<"reading" | "safety" | "details" | "materials">("reading");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [ingredients, setIngredients] = useState<FormulaIngredientInput[]>(() => analysis.ingredients.map((ingredient) => {
    const percentage = Math.max(0, ingredient.percentage ?? (ingredient.grams && totalMl > 0 ? (ingredient.grams / totalMl) * 100 : 0));
    const grams = Math.max(0, ingredient.grams ?? ((percentage / 100) * totalMl));
    return {
      materialId: ingredient.materialId ?? 0,
      materialName: ingredient.matchedName ?? ingredient.materialName,
      percentage: Number(percentage.toFixed(4)),
      grams: Number(grams.toFixed(3)),
      dilution: ingredient.dilution ?? 100,
      role: normalizeImportRole(ingredient.role),
      allergenFlags: ingredient.allergens,
    };
  }));
  const unmapped = ingredients.filter(ingredient => ingredient.materialId === 0);
  const totalPercentage = ingredients.reduce((total, ingredient) => total + ingredient.percentage, 0);
  const linkedCount = ingredients.length - unmapped.length;
  useEffect(() => {
    setIngredients(current => current.map(ingredient => ({
      ...ingredient,
      grams: Number(((ingredient.percentage / 100) * totalMl).toFixed(3)),
    })));
  }, [totalMl]);
  const updateIngredient = (index: number, patch: Partial<FormulaIngredientInput>) => {
    setIngredients(current => current.map((ingredient, ingredientIndex) => {
      if (ingredientIndex !== index) return ingredient;
      const next = { ...ingredient, ...patch };
      if (patch.grams !== undefined) next.percentage = totalMl > 0 ? Number(((next.grams / totalMl) * 100).toFixed(4)) : 0;
      if (patch.percentage !== undefined) next.grams = Number(((next.percentage / 100) * totalMl).toFixed(3));
      return next;
    }));
  };
  const removeIngredient = (index: number) => {
    setIngredients(current => current.filter((_, ingredientIndex) => ingredientIndex !== index));
    setEditingIndex(current => current === index ? null : current !== null && current > index ? current - 1 : current);
  };
  const addIngredient = () => {
    setIngredients(current => [...current, {
      materialId: 0,
      materialName: "New material",
      percentage: 0,
      grams: 0,
      dilution: 100,
      role: "modifier",
      allergenFlags: [],
    }]);
    setOpenSection("materials");
    setEditingIndex(ingredients.length);
  };
  const saveDraft = () => {
    if (!name.trim() || !ingredients.length || unmapped.length && !confirmUnlinked) return;
    create.mutate({
      data: {
        name: name.trim(),
        brief: `Imported from ${analysis.sourceFile}`,
        status: "draft",
        concentration,
        totalMl,
        notes: `Imported from ${analysis.sourceFile}.\n\nFormula file analysis:\n${analysis.interpretation}`,
        ingredients,
      },
    }, {
      onSuccess: formula => {
        qc.invalidateQueries({ queryKey: getListFormulasQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setLocation(`/formulas/${formula.id}`);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 px-4 py-6 backdrop-blur-sm sm:px-8" data-testid="modal-formula-import-review">
      <div className="mx-auto max-w-5xl border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-5 border-b border-border px-6 py-5 sm:px-8">
          <div>
            <p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground">Formula import · review before saving</p>
            <h2 className="mt-1 font-display text-4xl">Make it editable.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Source file: {analysis.sourceFile}. The original stays safely filed.</p>
          </div>
          <button onClick={onClose} aria-label="Close formula import" className="grid size-9 place-items-center border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"><X size={16} /></button>
        </div>

        <div className="space-y-2 p-6 sm:p-8">
          <div className="mb-5 grid gap-2 sm:grid-cols-3">
            <div className="border border-border bg-secondary/20 px-4 py-3"><p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground">Materials</p><p className="mt-1 text-sm">{linkedCount} linked · {unmapped.length} to review</p></div>
            <div className="border border-border bg-secondary/20 px-4 py-3"><p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground">Composition</p><p className="mt-1 text-sm">{totalPercentage.toFixed(1)}% total</p></div>
            <div className="border border-border bg-secondary/20 px-4 py-3"><p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground">Safety</p><p className="mt-1 text-sm">{analysis.allergens.length} allergen · {analysis.ifraWarnings.length} IFRA note{analysis.ifraWarnings.length === 1 ? "" : "s"}</p></div>
          </div>
          <ImportDisclosure id="reading" eyebrow="01 · Coach reading" title="What the file suggests" summary="Interpretation, facets, and overall effect" open={openSection === "reading"} onToggle={() => setOpenSection(openSection === "reading" ? "details" : "reading")}>
            <CoachReading text={analysis.interpretation} />
          </ImportDisclosure>
          <ImportDisclosure id="safety" eyebrow="02 · Safety review" title="What needs attention" summary={`${analysis.allergens.length} allergen note${analysis.allergens.length === 1 ? "" : "s"} · ${analysis.ifraWarnings.length} IFRA item${analysis.ifraWarnings.length === 1 ? "" : "s"} · ${analysis.unknownMaterials.length} unknown`} open={openSection === "safety"} onToggle={() => setOpenSection(openSection === "safety" ? "details" : "safety")}>
            <div className="grid gap-5 md:grid-cols-3">
              <div><p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground">Known allergens</p>{analysis.allergens.length ? <div className="mt-3 flex flex-wrap gap-2">{analysis.allergens.map(allergen => <span key={allergen} className="border border-accent/40 bg-accent/10 px-2 py-1 text-xs">{allergen}</span>)}</div> : <p className="mt-3 text-sm text-muted-foreground">None detected.</p>}</div>
              <div><p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground">Unknown materials</p>{analysis.unknownMaterials.length ? <div className="mt-3 space-y-2 text-sm">{analysis.unknownMaterials.map(material => <p key={material}>· {material}</p>)}</div> : <p className="mt-3 text-sm text-muted-foreground">Everything matched your library.</p>}</div>
              <div><p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground">IFRA review</p>{analysis.ifraWarnings.length ? <div className="mt-3 space-y-3 border-l-2 border-destructive/60 bg-destructive/5 px-3 py-2 text-xs leading-5 text-muted-foreground">{analysis.ifraWarnings.map(item => <p key={item.material}><strong className="text-foreground">{item.material}:</strong> {item.warning}</p>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No flagged items.</p>}</div>
            </div>
          </ImportDisclosure>
          <ImportDisclosure id="details" eyebrow="03 · Draft details" title="Name the working formula" summary={`${concentration}% concentration · ${totalMl} ml batch`} open={openSection === "details"} onToggle={() => setOpenSection(openSection === "details" ? "reading" : "details")}>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_180px]">
              <label className="block text-xs font-medium">Formula name<input value={name} onChange={event => setName(event.target.value)} data-testid="input-import-formula-name" className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm outline-none focus:border-foreground/40" /></label>
              <label className="block text-xs font-medium">Concentration %<input type="number" min="0" max="100" value={concentration} onChange={event => setConcentration(Number(event.target.value))} className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm outline-none focus:border-foreground/40" /></label>
              <label className="block text-xs font-medium">Batch size ml<input type="number" min="0" value={totalMl} onChange={event => setTotalMl(Number(event.target.value))} className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm outline-none focus:border-foreground/40" /></label>
            </div>
          </ImportDisclosure>
          <ImportDisclosure id="materials" eyebrow="04 · Confirm the palette" title="Edit each material" summary={`${ingredients.length} rows · ${linkedCount} linked · ${unmapped.length} unlinked`} open={openSection === "materials"} onToggle={() => setOpenSection(openSection === "materials" ? "details" : "materials")}>
            <p className="max-w-3xl text-xs leading-5 text-muted-foreground">Open Edit to correct an imported name, map it to your library, change its amount or role, or delete a row that does not belong in this formula.</p>
            <div className="mt-5 space-y-2">
              {ingredients.map((ingredient, index) => {
                const isEditing = editingIndex === index;
                return (
                  <div key={`${ingredient.materialName}-${index}`} className={`border ${isEditing ? "border-foreground/40 bg-secondary/30" : "border-border bg-secondary/20"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium">{ingredient.materialName}</p>
                          {ingredient.materialId === 0 && <span className="border border-accent/40 px-1.5 py-0.5 font-mono-ui text-[8px] uppercase tracking-widest text-accent-foreground/70">Unlinked</span>}
                        </div>
                        <p className="mt-1 font-mono-ui text-[9px] uppercase tracking-[.12em] text-muted-foreground">{ingredient.percentage.toFixed(2)}% · {ingredient.grams.toFixed(3)}g · {ingredient.role}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button type="button" onClick={() => setEditingIndex(isEditing ? null : index)} aria-expanded={isEditing} data-testid={`button-edit-import-material-${index}`} className="inline-flex items-center gap-1.5 border border-border bg-background px-2.5 py-2 font-mono-ui text-[9px] uppercase tracking-widest transition-colors hover:border-foreground"><Pencil size={12} /> {isEditing ? "Done" : "Edit"}</button>
                        <button type="button" onClick={() => removeIngredient(index)} aria-label={`Delete ${ingredient.materialName}`} data-testid={`button-delete-import-material-${index}`} className="inline-flex items-center gap-1.5 border border-destructive/30 px-2.5 py-2 font-mono-ui text-[9px] uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10"><Trash2 size={12} /> Delete</button>
                      </div>
                    </div>
                    {isEditing && <div className="grid gap-3 border-t border-border px-3 py-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_88px_76px_100px]">
                      <label className="min-w-0 text-xs font-medium">Imported name<input value={ingredient.materialName} onChange={event => updateIngredient(index, { materialName: event.target.value })} data-testid={`input-edit-import-name-${index}`} className="mt-1 w-full border border-border bg-background px-2 py-2 text-xs outline-none focus:border-foreground/40" /></label>
                      <label className="min-w-0 text-xs font-medium">Library match
                        <select value={ingredient.materialId} onChange={event => {
                          const materialId = Number(event.target.value);
                          const material = materials.find(item => item.id === materialId);
                          updateIngredient(index, { materialId, materialName: material?.name ?? ingredient.materialName, allergenFlags: material?.allergens ?? [] });
                        }} data-testid={`select-import-material-${index}`} className="mt-1 w-full truncate border border-border bg-background px-2 py-2 text-xs outline-none focus:border-foreground/40">
                          <option value={0}>Keep unlinked</option>
                          {materials.map(material => <option key={material.id} value={material.id}>{material.name}</option>)}
                        </select>
                      </label>
                      <label className="text-xs font-medium">%<input type="number" min="0" step="0.001" value={ingredient.percentage} onChange={event => updateIngredient(index, { percentage: Number(event.target.value) })} className="mt-1 w-full border border-border bg-background px-2 py-2 text-xs outline-none focus:border-foreground/40" /></label>
                      <label className="text-xs font-medium">g<input type="number" min="0" step="0.001" value={ingredient.grams} onChange={event => updateIngredient(index, { grams: Number(event.target.value) })} className="mt-1 w-full border border-border bg-background px-2 py-2 text-xs outline-none focus:border-foreground/40" /></label>
                      <label className="text-xs font-medium">Role<select value={ingredient.role} onChange={event => updateIngredient(index, { role: event.target.value as FormulaIngredientInput["role"] })} className="mt-1 w-full border border-border bg-background px-2 py-2 text-xs outline-none focus:border-foreground/40"><option value="top">Top</option><option value="heart">Heart</option><option value="base">Base</option><option value="modifier">Modifier</option></select></label>
                    </div>}
                  </div>
                );
              })}
              {ingredients.length === 0 && <div className="border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">No materials remain in this draft.</div>}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={addIngredient} data-testid="button-add-import-material" className="inline-flex items-center gap-2 border border-border px-3 py-2 font-mono-ui text-[9px] uppercase tracking-widest transition-colors hover:border-foreground"><Plus size={13} /> Add material</button>
              <p className="font-mono-ui text-[10px] text-muted-foreground">{totalPercentage.toFixed(1)}% total</p>
            </div>
            {unmapped.length > 0 && <label className="mt-4 flex items-start gap-3 border border-accent/30 bg-accent/10 p-4 text-xs leading-5">
              <input type="checkbox" checked={confirmUnlinked} onChange={event => setConfirmUnlinked(event.target.checked)} className="mt-0.5" data-testid="checkbox-confirm-unlinked-import" />
              <span><strong className="text-foreground">{unmapped.length} material{unmapped.length === 1 ? "" : "s"} remain unlinked.</strong> I understand they will be saved as editable names and need resolving in the Formula Builder.</span>
            </label>}
            {create.isError && <p className="mt-3 text-sm text-destructive" data-testid="status-import-formula-error">The draft could not be saved. Check the amounts and try again.</p>}
          </ImportDisclosure>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-5 sm:px-8">
          <p className="text-xs text-muted-foreground">Saving creates a new editable draft and never deletes {analysis.sourceFile}.</p>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="quiet" testId="button-cancel-formula-import">Cancel</Button>
            <Button onClick={saveDraft} disabled={!name.trim() || !ingredients.length || (!!unmapped.length && !confirmUnlinked) || create.isPending} testId="button-save-imported-formula">{create.isPending ? "Saving draft…" : "Save editable draft"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

