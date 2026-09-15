import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { getGetDashboardSummaryQueryKey, getListFormulasQueryKey, useCreateFormula } from "@workspace/api-client-react";
import type { FormulaIngredientInput } from "@workspace/api-client-react";
import { Sparkles } from "lucide-react";
import { FormulaIdeaGenerator } from "../components/FormulaIdeaGenerator";
import { IngredientBuilder } from "../components/IngredientBuilder";
import { FormulaToolFileUpload } from "../components/FormulaToolFileUpload";
import type { FormulaIdeaMaterial } from "../types/ideas";
import { matchBlueprintToLibrary } from "../lib/formulas";
import { useMaterials } from "../hooks/useMaterials";
import { Button } from "../components/Button";
import { IfraCategoryPicker } from "../components/IfraCategoryPicker";
import { PageHeader } from "../components/PageHeader";
import { Shell } from "../components/Shell";
export function NewFormula() {
  const [, setLocation] = useLocation();
  const rawSearch = useSearch();
  const params = new URLSearchParams(rawSearch);
  const create = useCreateFormula();
  const qc = useQueryClient();
  const [name, setName] = useState(params.get("name") ?? "");
  const [brief, setBrief] = useState(params.get("brief") ?? "");
  const [concentration, setConcentration] = useState(20);
  const [totalMl, setTotalMl] = useState(30);
  const [notes, setNotes] = useState("");
  const [ifraCategory, setIfraCategory] = useState("");
  const [ingredients, setIngredients] = useState<FormulaIngredientInput[]>(() => {
    try {
      const stored = sessionStorage.getItem("matiere-blueprint");
      if (stored) {
        sessionStorage.removeItem("matiere-blueprint");
        const mats: FormulaIdeaMaterial[] = JSON.parse(stored);
        return mats.map(mat => ({
          materialId: 0,
          materialName: mat.name,
          percentage: mat.pct * 0.2,
          grams: parseFloat(((mat.pct / 100) * 30 * 0.2).toFixed(3)),
          dilution: 100,
          role: mat.role,
        }));
      }
    } catch {}
    return [];
  });

  // Fetch the material library so we can auto-match blueprint ingredients.
  // React Query deduplicates this request — IngredientBuilder makes the same call.
  const libraryQuery = useMaterials();
  const libraryMaterials = libraryQuery.data ?? [];

  // One-shot auto-match: fires once when the library first loads. Guards via ref
  // so it won't re-run if the user manually edits ingredients afterwards.
  const blueprintMatchedRef = useRef(false);
  useEffect(() => {
    if (blueprintMatchedRef.current || !libraryMaterials.length) return;
    blueprintMatchedRef.current = true;
    setIngredients(prev => matchBlueprintToLibrary(prev, libraryMaterials));
  }, [libraryMaterials]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate(
      { data: { name, brief, status: "draft", concentration, totalMl, notes, ifraCategory: ifraCategory || undefined, ingredients } },
      { onSuccess: formula => {
        qc.invalidateQueries({ queryKey: getListFormulasQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setLocation(`/formulas/${formula.id}?stage=formulate`);
      }}
    );
  };

  return (
    <Shell>
      <PageHeader
        eyebrow="Formula lab · new"
        title="Start here."
        description="Name it, describe the intention, then build out the palette. Everything can be revised."
        action={<FormulaToolFileUpload testId="button-new-formula-upload-file" />}
      />
      <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
        <div className="space-y-5">
          {/* Intention — always visible first */}
          <div className="border border-border bg-card p-6 sm:p-7">
            <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Intention</p>
            <label className="mt-5 block text-xs font-medium">Name
              <input required value={name} onChange={e => setName(e.target.value)} data-testid="input-formula-name" className="mt-2 w-full border-b border-border bg-transparent py-3 font-display text-3xl outline-none placeholder:text-muted-foreground/45 focus:border-foreground" placeholder="A name with a little weather" />
            </label>
            <label className="mt-7 block text-xs font-medium">Brief <span className="font-normal text-muted-foreground">(optional)</span>
              <textarea value={brief} onChange={e => setBrief(e.target.value)} data-testid="textarea-formula-brief" className="mt-2 min-h-24 w-full resize-none border border-border bg-secondary/45 p-4 text-sm leading-6 outline-none focus:border-foreground/40" placeholder="The feeling, the direction, the thing you're after." />
            </label>
            <label className="mt-7 block text-xs font-medium">Notes <span className="font-normal text-muted-foreground">(optional)</span>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} data-testid="textarea-formula-notes" className="mt-2 min-h-20 w-full resize-none border border-border bg-secondary/45 p-4 text-sm leading-6 outline-none focus:border-foreground/40" placeholder="Observations, references, what to try next." />
            </label>
          </div>

          {/* Technical parameters — secondary */}
          <div className="border border-border bg-card p-6">
            <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Technical</p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <label className="text-xs font-medium">Concentration %
                <input type="number" min="0" max="100" value={concentration} onChange={e => setConcentration(Number(e.target.value))} data-testid="input-formula-concentration" className="mt-2 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40" />
              </label>
              <label className="text-xs font-medium">Batch size ml
                <input type="number" min="0" value={totalMl} onChange={e => setTotalMl(Number(e.target.value))} data-testid="input-formula-total-ml" className="mt-2 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40" />
              </label>
            </div>
            <IfraCategoryPicker value={ifraCategory} onChange={setIfraCategory} testId="select-formula-ifra-category" />
          </div>

          {/* AI idea generator — optional/contextual, revealed on demand */}
          <details className="group border border-border">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground hover:text-foreground transition-colors select-none">
              <span className="flex items-center gap-2"><Sparkles size={11} />Generate from a brief</span>
              <span className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/60 group-open:hidden">Explore</span>
              <span className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/60 hidden group-open:block">Close</span>
            </summary>
            <div className="border-t border-border">
              <FormulaIdeaGenerator onSelect={(n, b, mats) => {
                setName(n);
                setBrief(b);
                const rawIngs: FormulaIngredientInput[] = mats.map(mat => ({
                  materialId: 0,
                  materialName: mat.name,
                  percentage: mat.pct * (concentration / 100),
                  grams: parseFloat(((mat.pct / 100) * totalMl * (concentration / 100)).toFixed(3)),
                  dilution: 100,
                  role: mat.role,
                }));
                blueprintMatchedRef.current = true;
                setIngredients(matchBlueprintToLibrary(rawIngs, libraryMaterials));
              }} />
            </div>
          </details>
        </div>
        <div className="space-y-5">
          <IngredientBuilder ingredients={ingredients} setIngredients={setIngredients} totalMl={totalMl} concentration={concentration} />
          <div className="flex items-center justify-between border border-border bg-card p-5">
            <div>
              <p className="font-display text-xl">Ready to save.</p>
              <p className="mt-1 text-xs text-muted-foreground">Every field can be revised after saving.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button href="/formulas" variant="quiet" testId="button-cancel-new">Cancel</Button>
              <Button type="submit" disabled={create.isPending || !name} testId="button-save-formula">{create.isPending ? "Saving..." : "Save draft"}</Button>
            </div>
          </div>
          {create.isError && <p className="text-sm text-destructive" data-testid="status-create-error">Couldn't save this formula. Try again.</p>}
        </div>
      </form>
    </Shell>
  );
}


export default NewFormula;
