import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CircleAlert } from "lucide-react";
import { Link } from "wouter";
import { useLocation } from "wouter";
import type { Formula, Material } from "@workspace/api-client-react";
import { IFRA_CATEGORIES } from "./IfraCategoryPicker";
import { StatusPill } from "./StatusPill";
import { WORKFLOW_STAGES } from "../lib/workflow";
import type { WorkflowStageId } from "../types/workflow";
export function WorkflowStagePanel({
  stage,
  formula,
  materials,
  events,
  onEdit,
}: {
  stage: WorkflowStageId;
  formula: Formula;
  materials: Material[];
  events: Array<{ id: number; formulaId: number; formulaName: string; type: string; summary: string; createdAt: string }>;
  onEdit: () => void;
}) {
  const [, setLocation] = useLocation();
  const [batchMl, setBatchMl] = useState(formula.totalMl);

  useEffect(() => {
    setBatchMl(formula.totalMl);
  }, [formula.id, formula.totalMl]);

  if (stage === "formulate") {
    // Show the ingredient map — prompt to edit
    const unlinked = formula.ingredients.filter(i => i.materialId === 0).length;
    const totalPct = formula.ingredients.reduce((s, i) => s + i.percentage, 0);
    return (
      <motion.div key="formulate" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
        <div className="border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Formulate · palette</p>
              <h2 className="mt-1 font-display text-3xl">Materials in the blend</h2>
            </div>
            <button onClick={onEdit} data-testid="button-wf-edit" className="border border-border px-3 py-1.5 font-mono-ui text-[9px] uppercase tracking-widest transition-colors hover:bg-secondary">Edit blend</button>
          </div>
          {unlinked > 0 && (
            <div className="mt-4 flex items-start gap-2.5 border border-accent/30 bg-accent/10 px-4 py-3">
              <CircleAlert size={13} className="mt-0.5 shrink-0 text-accent-foreground/70" />
              <p className="font-mono-ui text-[10px] uppercase tracking-[.1em] leading-5 text-accent-foreground/70">{unlinked} ingredient{unlinked !== 1 ? "s" : ""} not yet linked to your library</p>
            </div>
          )}
          <div className="mt-5 space-y-1">
            {formula.ingredients.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_70px_70px_80px] items-center gap-2 border-t border-border py-3 first:border-t-0">
                <div>
                  <p className="text-sm font-medium">{item.materialName}</p>
                  <p className="mt-0.5 font-mono-ui text-[9px] uppercase tracking-[.1em] text-muted-foreground">{item.role}</p>
                </div>
                <p className="text-right font-mono-ui text-xs">{item.percentage}%</p>
                <p className="text-right font-mono-ui text-xs text-muted-foreground">{item.grams}g</p>
                <p className="text-right font-mono-ui text-[9px] text-muted-foreground">dil {item.dilution ?? 100}%</p>
              </div>
            ))}
            {!formula.ingredients.length && <p className="py-6 text-center text-sm text-muted-foreground">No materials added yet.</p>}
          </div>
          {formula.ingredients.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div className="h-[2px] w-24 overflow-hidden bg-border">
                <div className="h-full bg-foreground" style={{ width: `${formula.concentration > 0 ? Math.min((totalPct / formula.concentration) * 100, 100) : 0}%` }} />
              </div>
              <span className={`font-mono-ui text-[10px] ${totalPct > formula.concentration ? "text-destructive" : Math.abs(totalPct - formula.concentration) <= 0.1 ? "text-accent-foreground" : "text-muted-foreground"}`}>{Math.round(totalPct * 10) / 10}% of {formula.concentration}% target</span>
            </div>
          )}
        </div>
        <div className="border border-border bg-card p-5 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Ready to read the olfactive structure?</p>
          <button onClick={() => setLocation(`/formulas/${formula.id}?stage=analyze`)} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline">Continue to Analyze</button>
        </div>
      </motion.div>
    );
  }

  if (stage === "analyze") {
    // Olfactive structure by role and family
    const byRole: Record<string, typeof formula.ingredients> = { top: [], heart: [], base: [], modifier: [] };
    formula.ingredients.forEach(i => { (byRole[i.role] ??= []).push(i); });
    const roleLabels: Record<string, string> = { top: "Top notes", heart: "Heart notes", base: "Base notes", modifier: "Modifiers" };
    const totalGrams = formula.ingredients.reduce((s, i) => s + i.grams, 0);

    // Families from materials library cross-reference
    const matById = new Map(materials.map(m => [m.id, m]));
    const familyCounts: Record<string, number> = {};
    formula.ingredients.forEach(ing => {
      const mat = matById.get(ing.materialId);
      if (mat?.family) {
        familyCounts[mat.family] = (familyCounts[mat.family] ?? 0) + ing.percentage;
      }
    });
    const families = Object.entries(familyCounts).sort((a, b) => b[1] - a[1]);

    return (
      <motion.div key="analyze" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
        <div className="border border-border bg-card p-6">
          <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Analyze · olfactive profile</p>
          <h2 className="mt-1 font-display text-3xl">Structure</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="border border-border bg-secondary/20 px-4 py-4">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Reading source</p>
              <p className="mt-2 text-sm">Stored formula v{formula.version} · {formula.ingredients.length} materials</p>
            </div>
            <div className="border border-border bg-secondary/20 px-4 py-4">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Interpretation</p>
              <p className="mt-2 text-sm">Role proportions and linked material families, calculated from this formula.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {(["top", "heart", "base", "modifier"] as const).map(role => {
              const items = byRole[role] ?? [];
              if (!items.length) return null;
              const rolePct = items.reduce((s, i) => s + i.percentage, 0);
              const barW = totalGrams > 0 ? `${Math.round((items.reduce((s, i) => s + i.grams, 0) / totalGrams) * 100)}%` : "0%";
              return (
                <div key={role}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-muted-foreground">{roleLabels[role]}</p>
                    <span className="font-mono-ui text-[10px] text-muted-foreground">{Math.round(rolePct * 10) / 10}%</span>
                  </div>
                  <div className="h-[2px] w-full bg-border mb-3">
                    <motion.div className="h-full bg-foreground" initial={{ width: 0 }} animate={{ width: barW }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} />
                  </div>
                  <div className="space-y-2">
                    {items.map((ing, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <p className="text-sm">{ing.materialName}</p>
                        <span className="font-mono-ui text-[10px] text-muted-foreground">{ing.grams}g</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {families.length > 0 && (
          <div className="border border-border bg-card p-6">
            <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground mb-4">Material families</p>
            <div className="space-y-3">
              {families.map(([family, pct]) => (
                <div key={family}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs">{family}</p>
                    <span className="font-mono-ui text-[9px] text-muted-foreground">{Math.round(pct * 10) / 10}%</span>
                  </div>
                  <div className="h-[2px] w-full bg-border">
                    <motion.div className="h-full bg-accent" initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
                  </div>
                </div>
              ))}
            </div>
            {families.length === 0 && <p className="text-sm text-muted-foreground">Link ingredients to your library to see family breakdown.</p>}
          </div>
        )}
        <div className="border border-border bg-card px-5 py-3">
          <p className="text-xs text-muted-foreground">Olfactive structure derived from current ingredients and linked material families.</p>
        </div>
      </motion.div>
    );
  }

  if (stage === "check") {
    const flaggedIngredients = formula.ingredients.filter(i => (i.allergenFlags ?? []).length > 0);
    const ifraCat = IFRA_CATEGORIES.find(c => c.value === formula.ifraCategory);
    const statusIsOk = formula.safetyStatus === "clear" && formula.ifraStatus === "within_limit";

    return (
      <motion.div key="check" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
        <div className="border border-border bg-card p-6">
          <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Check · safety screening</p>
          <h2 className="mt-1 font-display text-3xl">IFRA &amp; allergens</h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="border border-border bg-secondary/20 px-4 py-4">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Safety status</p>
              <p className="mt-2"><StatusPill value={formula.safetyStatus} /></p>
            </div>
            <div className="border border-border bg-secondary/20 px-4 py-4">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">IFRA status</p>
              <p className="mt-2"><StatusPill value={formula.ifraStatus} /></p>
            </div>
            <div className="border border-border bg-secondary/20 px-4 py-4">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Allergen notes</p>
              <p className="mt-2 font-mono-ui text-[11px]">{formula.allergenCount}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-2">Product category</p>
            {ifraCat
              ? <p className="text-sm">{ifraCat.label}</p>
              : <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground italic">Not set.</p>
                  <button onClick={onEdit} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline">Set category in Edit</button>
                </div>
            }
          </div>

          {flaggedIngredients.length > 0 ? (
            <div className="mt-6 space-y-3">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Flagged ingredients</p>
              {flaggedIngredients.map((item, i) => (
                <div key={i} className="border-l-2 border-destructive/60 bg-destructive/5 pl-4 py-2">
                  <p className="text-sm font-medium">{item.materialName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{(item.allergenFlags ?? []).join(", ")}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">No allergen flags on any ingredient.</p>
          )}

          {!statusIsOk && (
            <div className="mt-5 border border-accent/30 bg-accent/10 px-4 py-4">
              <p className="text-sm text-accent-foreground/80">This formula has items that need review. Edit the formula to adjust concentrations.</p>
            </div>
          )}
          <p className="mt-5 font-mono-ui text-[8px] uppercase tracking-[.12em] leading-5 text-muted-foreground/60">
            Screening guidance only. Confirm the latest supplier documentation and current IFRA standards before production.
          </p>
        </div>
        <div className="border border-border bg-card px-5 py-3">
          <p className="text-xs text-muted-foreground">Screening guidance only — confirm current IFRA standards and supplier documentation before production.</p>
        </div>
      </motion.div>
    );
  }

  if (stage === "optimize") {
    const totalPct = formula.ingredients.reduce((s, i) => s + i.percentage, 0);
    const overFormulaIngredients = formula.ingredients.filter(i => i.percentage > 30);
    const minorIngredients = formula.ingredients.filter(i => i.percentage < 1 && i.percentage > 0);
    const unlinked = formula.ingredients.filter(i => i.materialId === 0);
    const materialById = new Map(materials.map(material => [material.id, material]));

    return (
      <motion.div key="optimize" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
        <div className="border border-border bg-card p-6">
          <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Optimize · next iteration</p>
          <h2 className="mt-1 font-display text-3xl">Observations</h2>

          <div className="mt-6 space-y-4">
            {Math.abs(totalPct - formula.concentration) > 0.1 && (
              <div className="flex items-start gap-3 border-l-2 border-border pl-4 py-1">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Aromatic total is {Math.round(totalPct * 10) / 10}% of the finished batch</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{totalPct < formula.concentration ? `${Math.round((formula.concentration - totalPct) * 10) / 10}% remains below the ${formula.concentration}% concentration target.` : `Exceeds the ${formula.concentration}% concentration target — reduce one or more materials.`}</p>
                </div>
              </div>
            )}
            {overFormulaIngredients.map(ing => (
              <div key={ing.materialName} className="flex items-start gap-3 border-l-2 border-accent/40 pl-4 py-1">
                <div>
                  <p className="text-sm font-medium">{ing.materialName} at {ing.percentage}%</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">High proportion — consider splitting with a complementary material or reducing to improve balance.</p>
                </div>
              </div>
            ))}
            {minorIngredients.map(ing => (
              <div key={ing.materialName} className="flex items-start gap-3 border-l-2 border-muted pl-4 py-1">
                <div>
                  <p className="text-sm font-medium">{ing.materialName} at {ing.percentage}%</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Very minor amount — check if this is intentional or a trace left from an earlier version.</p>
                </div>
              </div>
            ))}
            {unlinked.length > 0 && (
              <div className="flex items-start gap-3 border-l-2 border-destructive/50 pl-4 py-1">
                <div>
                  <p className="text-sm font-medium">{unlinked.length} unlinked ingredient{unlinked.length !== 1 ? "s" : ""}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Link these to your library to unlock allergen data, IFRA limits, and material family analysis.</p>
                </div>
              </div>
            )}
            {Math.abs(totalPct - formula.concentration) <= 0.1 && !overFormulaIngredients.length && !unlinked.length && (
              <p className="text-sm text-muted-foreground">No structural flags — the formula looks balanced at current proportions.</p>
            )}
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Material comparison</p>
            <div className="mt-3 overflow-x-auto">
              <div className="min-w-[560px]">
                <div className="grid grid-cols-[1fr_100px_150px_110px] gap-3 border-b border-border pb-2 font-mono-ui text-[8px] uppercase tracking-[.12em] text-muted-foreground">
                  <span>Material</span><span>Availability</span><span>Known restrictions</span><span>Cost</span>
                </div>
                {formula.ingredients.map((ingredient, index) => {
                  const material = materialById.get(ingredient.materialId);
                  const restrictions = material
                    ? [
                        material.allergens.length ? `${material.allergens.length} allergen note${material.allergens.length === 1 ? "" : "s"}` : null,
                        material.ifraLimit > 0 ? `IFRA limit ${material.ifraLimit}%` : null,
                        material.safetyStatus !== "low" ? material.safetyStatus : null,
                      ].filter(Boolean).join(" · ") || "None recorded"
                    : "Unknown — not linked";
                  return (
                    <div key={`${ingredient.materialId}-${index}`} className="grid grid-cols-[1fr_100px_150px_110px] gap-3 border-b border-border py-3 text-xs">
                      <span className="font-medium">{ingredient.materialName}</span>
                      <span className="text-muted-foreground">{material ? (material.inStock ? "In stock" : "Out of stock") : "Unknown"}</span>
                      <span className="text-muted-foreground">{restrictions}</span>
                      <span className="text-muted-foreground">Not recorded</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {!formula.ingredients.length && <p className="mt-3 text-sm text-muted-foreground">Add materials to compare availability and known restrictions.</p>}
            <p className="mt-4 font-mono-ui text-[8px] uppercase tracking-[.14em] leading-5 text-muted-foreground/60">Cost data is unavailable because supplier pricing and cost-per-gram are not currently tracked. No estimate has been substituted.</p>
          </div>
        </div>
        <div className="border border-border bg-card p-5">
          <button onClick={onEdit} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline" data-testid="button-wf-optimize-edit">Edit formula</button>
        </div>
      </motion.div>
    );
  }

  if (stage === "document") {
    return (
      <motion.div key="document" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
        <div className="border border-border bg-card p-6">
          <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Document · notes and history</p>
          <h2 className="mt-1 font-display text-3xl">Notebook</h2>
          <div className="mt-5">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-3">Notes</p>
            {formula.notes
              ? <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{formula.notes}</p>
              : <div className="flex items-center gap-3 py-2">
                  <p className="text-sm text-muted-foreground italic">No notes yet.</p>
                  <button onClick={onEdit} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline">Add notes in Edit</button>
                </div>
            }
          </div>
        </div>
        {events.length > 0 && (
          <div className="border border-border bg-card p-6">
            <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground mb-4">Change history</p>
            <div className="space-y-0">
              {events.map((ev, i) => (
                <div key={ev.id} className={`flex items-start gap-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                  <div className="shrink-0 w-16 font-mono-ui text-[8px] text-muted-foreground pt-0.5">
                    {new Date(ev.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-5">{ev.summary}</p>
                    <p className="mt-0.5 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/50">{ev.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {events.length === 0 && (
          <div className="border border-border bg-card p-6">
            <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Change history</p>
            <p className="mt-3 text-sm text-muted-foreground">No changes recorded yet.</p>
          </div>
        )}
        <div className="border border-border bg-card p-5">
          <button onClick={onEdit} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline">Update stage in Edit</button>
        </div>
      </motion.div>
    );
  }

  if (stage === "source") {
    const matById = new Map(materials.map(m => [m.id, m]));
    const missingStock = formula.ingredients
      .map(ing => ({ ing, mat: matById.get(ing.materialId) }))
      .filter(({ mat }) => mat && !mat.inStock);
    const unlinked = formula.ingredients.filter(i => i.materialId === 0);
    const linkedUnknown = formula.ingredients.filter(ingredient => ingredient.materialId > 0 && !matById.has(ingredient.materialId));

    return (
      <motion.div key="source" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
        <div className="border border-border bg-card p-6">
          <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Source · material gaps</p>
          <h2 className="mt-1 font-display text-3xl">Stock check</h2>

          {missingStock.length > 0 ? (
            <div className="mt-5 space-y-2">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-3">Not in stock ({missingStock.length})</p>
              {missingStock.map(({ ing, mat }) => (
                <div key={ing.materialName} className="flex items-center justify-between border border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{ing.materialName}</p>
                    <p className="mt-0.5 font-mono-ui text-[9px] uppercase tracking-[.1em] text-muted-foreground">{mat?.family} · {mat?.origin}</p>
                  </div>
                  <Link href={`/shop`} className="font-mono-ui text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors" data-testid={`link-source-${ing.materialName}`}>Source ↗</Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">All linked materials are marked in stock.</p>
          )}

          {unlinked.length > 0 && (
            <div className="mt-5">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-3">Unlinked — stock unknown ({unlinked.length})</p>
              {unlinked.map((ing, i) => (
                <div key={i} className="flex items-center justify-between border border-border px-4 py-3 mb-1">
                  <p className="text-sm">{ing.materialName}</p>
                  <Link href={`/materials?search=${encodeURIComponent(ing.materialName)}`} className="font-mono-ui text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Search library ↗</Link>
                </div>
              ))}
            </div>
          )}
          {linkedUnknown.length > 0 && (
            <div className="mt-5">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-3">Availability unknown ({linkedUnknown.length})</p>
              {linkedUnknown.map((ingredient, index) => (
                <div key={`${ingredient.materialId}-${index}`} className="border border-border px-4 py-3 mb-1">
                  <p className="text-sm">{ingredient.materialName}</p>
                </div>
              ))}
            </div>
          )}

          <p className="mt-5 font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground/50">Real-time pricing data is not available. Stock status reflects what you have marked in the Materials library.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 border border-border bg-card p-5">
          <Link href="/shop" className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline" data-testid="link-wf-source-shop">Browse suppliers</Link>
          <span className="text-muted-foreground/30">·</span>
          <Link href="/materials" className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline">Review material library</Link>
        </div>
      </motion.div>
    );
  }

  if (stage === "make") {
    const totalIngredientPct = formula.ingredients.reduce((s, i) => s + i.percentage, 0);
    const concentrateGrams = batchMl * (formula.concentration / 100);
    const solventGrams = Math.max(batchMl - concentrateGrams, 0);
    const makeRows = formula.ingredients.map(ingredient => {
      const weighedGrams = concentrateGrams * (ingredient.percentage / 100);
      const dilution = ingredient.dilution ?? 100;
      return {
        ...ingredient,
        weighedGrams,
        activeGrams: weighedGrams * (dilution / 100),
      };
    });
    const allocatedConcentrateGrams = makeRows.reduce((sum, row) => sum + row.weighedGrams, 0);
    const unallocatedConcentrateGrams = concentrateGrams - allocatedConcentrateGrams;
    const benchSummary = [
      `${formula.name} · version ${formula.version}`,
      `${batchMl} ml finished batch at ${formula.concentration}% concentration`,
      ...makeRows.map(row => `${row.materialName}: ${row.weighedGrams.toFixed(3)} g at ${row.dilution ?? 100}% dilution (${row.activeGrams.toFixed(3)} g active)`),
      `Allocated concentrate: ${allocatedConcentrateGrams.toFixed(3)} g of ${concentrateGrams.toFixed(3)} g target`,
      `Carrier / solvent target: ${solventGrams.toFixed(3)} g`,
      "Bench proxy assumes 1 ml = 1 g until material densities are recorded.",
    ].join("\n");

    return (
      <motion.div key="make" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
        <div className="border border-border bg-card p-6">
          <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Make · bench batch</p>
          <h2 className="mt-1 font-display text-3xl">Batch calculator</h2>

          <div className="mt-5 flex items-end gap-4">
            <label className="block text-xs font-medium">
              Batch volume (ml)
              <input
                type="number"
                min="1"
                value={batchMl}
                onChange={e => setBatchMl(Number(e.target.value) || formula.totalMl)}
                data-testid="input-wf-batch-ml"
                className="mt-2 w-32 border border-border bg-secondary/45 px-3 py-2 text-sm outline-none focus:border-foreground/40"
              />
            </label>
            <p className="pb-2 font-mono-ui text-[9px] text-muted-foreground">Stored target: {formula.totalMl} ml · {formula.concentration}% concentration</p>
          </div>

          {formula.ingredients.length > 0 ? (
            <div className="mt-5">
              <div className="hidden grid-cols-[1fr_80px_80px_80px] gap-2 border-b border-border pb-2 font-mono-ui text-[8px] uppercase tracking-[.12em] text-muted-foreground sm:grid">
                <span>Material</span><span className="text-right">Original</span><span className="text-right">Scaled</span><span className="text-right">Role</span>
              </div>
              <div className="space-y-0">
                {makeRows.map((ing, i) => {
                  return (
                    <div key={i} className="grid grid-cols-[1fr_auto] gap-2 border-t border-border py-3 sm:grid-cols-[1fr_80px_80px_80px]">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{ing.materialName}</p>
                        <p className="mt-0.5 font-mono-ui text-[9px] text-muted-foreground">{ing.activeGrams.toFixed(3)}g active · dilution {ing.dilution ?? 100}%</p>
                      </div>
                      <p className="text-right font-mono-ui text-xs text-muted-foreground">{ing.grams}g</p>
                      <p className="text-right font-mono-ui text-xs font-medium">{ing.weighedGrams.toFixed(3)}g</p>
                      <p className="hidden text-right font-mono-ui text-[9px] text-muted-foreground sm:block">{ing.role}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <p className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-muted-foreground">Fragrance concentrate / carrier</p>
                <p className="font-mono-ui text-xs font-medium">{concentrateGrams.toFixed(3)}g / {solventGrams.toFixed(3)}g</p>
              </div>
              {Math.abs(totalIngredientPct - formula.concentration) > 0.1 && (
                <p className="mt-3 font-mono-ui text-[8px] uppercase tracking-[.1em] text-muted-foreground/60">
                  Aromatic materials total {Math.round(totalIngredientPct * 10) / 10}% against the {formula.concentration}% concentration target — {Math.abs(unallocatedConcentrateGrams).toFixed(3)}g is {unallocatedConcentrateGrams >= 0 ? "unallocated" : "over-allocated"}. Weights have not been silently normalized.
                </p>
              )}
              <p className="mt-3 font-mono-ui text-[8px] uppercase tracking-[.1em] leading-5 text-muted-foreground/60">Bench proxy assumes 1 ml = 1 g until individual material densities are recorded.</p>
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">Add ingredients to the formula to generate a batch sheet.</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 border border-border bg-card p-5">
          <button onClick={onEdit} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline" data-testid="button-wf-make-edit">Edit formula</button>
          <span className="text-muted-foreground/30">·</span>
          <button onClick={() => navigator.clipboard.writeText(benchSummary)} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline" data-testid="button-wf-copy-batch">Copy batch</button>
          <span className="text-muted-foreground/30">·</span>
          <button onClick={() => window.print()} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline" data-testid="button-wf-print-batch">Print</button>
          <span className="text-muted-foreground/30">·</span>
          <Link href={`/formulas/${formula.id}?stage=source`} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline">Check sourcing gaps</Link>
        </div>
      </motion.div>
    );
  }

  // Default / conceive / create — show formula overview with a "Start working" prompt
  return (
    <motion.div key={stage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
      <div className="border border-border bg-card p-6">
        <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">{WORKFLOW_STAGES.find(s => s.id === stage)?.label} · overview</p>
        <h2 className="mt-1 font-display text-3xl">{WORKFLOW_STAGES.find(s => s.id === stage)?.description}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="border border-border bg-secondary/20 px-4 py-4">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Status</p>
            <p className="mt-2"><StatusPill value={formula.status} /></p>
          </div>
          <div className="border border-border bg-secondary/20 px-4 py-4">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Concentration</p>
            <p className="mt-2 font-mono-ui text-[11px]">{formula.concentration}% · {formula.totalMl} ml</p>
          </div>
          <div className="border border-border bg-secondary/20 px-4 py-4">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Materials</p>
            <p className="mt-2 font-mono-ui text-[11px]">{formula.ingredients.length} in blend</p>
          </div>
        </div>
        {formula.brief && <p className="mt-5 text-sm leading-6 text-muted-foreground">{formula.brief}</p>}
      </div>
      <div className="border border-border bg-card p-5">
        <button onClick={() => setLocation(`/formulas/${formula.id}?stage=formulate`)} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline">Open ingredient workspace →</button>
      </div>
    </motion.div>
  );
}

/** Dashboard workflow entry strip — kept for FormulaDetail use; not used on dashboard page */
