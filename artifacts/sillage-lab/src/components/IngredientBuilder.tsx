import { Minus } from "lucide-react";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMaterials } from "../hooks/useMaterials";
import type { FormulaIngredientInput } from "@workspace/api-client-react";
import { Button } from "./Button";
import { MaterialCombobox } from "./MaterialCombobox";

export function IngredientBuilder({
  ingredients, setIngredients, totalMl, concentration,
}: {
  ingredients: FormulaIngredientInput[];
  setIngredients: (next: FormulaIngredientInput[]) => void;
  totalMl: number;
  concentration: number;
}) {
  const materialsQuery = useMaterials();
  const materials = materialsQuery.data ?? [];

  useEffect(() => {
    const next = ingredients.map(ingredient => ({
      ...ingredient,
      grams: parseFloat(((ingredient.percentage / 100) * totalMl).toFixed(3)),
    }));
    const changed = next.some((ingredient, index) => ingredient.grams !== ingredients[index]?.grams);
    if (changed) setIngredients(next);
  }, [totalMl]);

  const add = () => setIngredients([...ingredients, { materialId: 0, materialName: "", percentage: 0, grams: 0, dilution: 100, role: "heart" }]);

  const update = (index: number, patch: Partial<FormulaIngredientInput>) => {
    setIngredients(ingredients.map((item, i) => {
      if (i !== index) return item;
      const next = { ...item, ...patch };
      if ("grams" in patch) {
        // Ingredient percentages describe the finished batch. Their total
        // should match the formula's target concentration.
        next.percentage = totalMl > 0 ? parseFloat(((next.grams / totalMl) * 100).toFixed(4)) : 0;
      } else {
        // percentage changed (e.g. programmatic) — keep grams in sync
        next.grams = parseFloat(((next.percentage / 100) * totalMl).toFixed(3));
      }
      return next;
    }));
  };

  const totalPct = Math.round(ingredients.reduce((s, ing) => s + (ing.percentage || 0), 0) * 10) / 10;

  return (
    <div className="border border-border bg-card p-6 sm:p-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">The palette</p>
          <h2 className="mt-1 font-display text-3xl">Materials in the blend</h2>
        </div>
        <Button onClick={add} variant="outline" testId="button-add-ingredient">Add material</Button>
      </div>
      {materialsQuery.isLoading && <p className="mt-4 text-xs text-muted-foreground">Loading material library…</p>}

      <div className="mt-5 space-y-2">
        <AnimatePresence initial={false}>
          {ingredients.map((ingredient, index) => {
            const dilution = ingredient.dilution ?? 100;
            const grams = ingredient.grams;
            const activeGrams = parseFloat((grams * dilution / 100).toFixed(3));
            const pctOfConc = concentration > 0 ? Math.round((ingredient.percentage / concentration) * 1000) / 10 : 0;

            return (
              <motion.div
                key={`${index}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 16, transition: { duration: 0.14 } }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="bg-secondary/60 p-4"
              >
                {/* Material search */}
                <MaterialCombobox
                  materials={materials}
                  value={{ materialId: ingredient.materialId, materialName: ingredient.materialName }}
                  onChange={(materialId, materialName) => update(index, { materialId, materialName })}
                  index={index}
                />

                {/* Controls row */}
                <div className="mt-2 grid grid-cols-[1fr_1fr_1fr_28px] gap-2">
                  <label className="block">
                    <span className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">
                      Grams{ingredient.grams > 0 && (
                        <span className="ml-2 text-foreground">{ingredient.percentage}%</span>
                      )}
                    </span>
                    <input
                      type="number" min="0" step="0.001"
                      value={ingredient.grams}
                      onChange={e => update(index, { grams: Number(e.target.value) })}
                      data-testid={`input-ingredient-percentage-${index}`}
                      className="mt-1 w-full border border-border bg-card px-2 py-2 text-xs outline-none transition-colors focus:border-foreground/40"
                      placeholder="0"
                    />
                  </label>
                  <label className="block">
                    <span className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">Dilution %</span>
                    <input
                      type="number" min="0" max="100" step="1"
                      value={ingredient.dilution ?? 100}
                      onChange={e => update(index, { dilution: Number(e.target.value) })}
                      data-testid={`input-ingredient-dilution-${index}`}
                      className="mt-1 w-full border border-border bg-card px-2 py-2 text-xs outline-none transition-colors focus:border-foreground/40"
                      placeholder="100"
                    />
                  </label>
                  <label className="block">
                    <span className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">Role</span>
                    <select
                      value={ingredient.role}
                      onChange={e => update(index, { role: e.target.value as FormulaIngredientInput["role"] })}
                      data-testid={`select-ingredient-role-${index}`}
                      className="mt-1 w-full border border-border bg-card px-2 py-2 text-xs outline-none transition-colors focus:border-foreground/40"
                    >
                      <option value="top">Top</option>
                      <option value="heart">Heart</option>
                      <option value="base">Base</option>
                      <option value="modifier">Modifier</option>
                    </select>
                  </label>
                  <div className="flex items-end">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIngredients(ingredients.filter((_, i) => i !== index))}
                      data-testid={`button-remove-ingredient-${index}`}
                      className="mb-0.5 grid h-[30px] w-full place-items-center text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Minus size={14} />
                    </motion.button>
                  </div>
                </div>

                {/* Weight / quantity row */}
                {grams > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 overflow-hidden"
                  >
                    <div className="flex items-center gap-3">
                      {/* Progress bar — width driven by % of formula */}
                      <div className="h-[2px] flex-1 overflow-hidden bg-border">
                        <motion.div
                          className="h-full bg-accent"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(ingredient.percentage, 100)}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                      <div className="flex shrink-0 gap-3 font-mono-ui text-[9px] text-muted-foreground">
                        <span title="Share of the formula by weight">
                          <strong className="text-foreground">{ingredient.percentage}%</strong> of formula
                        </span>
                        {dilution < 100 && (
                          <span title={`${activeGrams}g is pure aromatic material; the rest is solvent`}>{activeGrams}g active</span>
                        )}
                        {concentration > 0 && (
                          <span title={`Share of the formula's ${concentration}% aromatic concentrate`}>{pctOfConc}% of conc.</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {!ingredients.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-border p-8 text-center text-xs text-muted-foreground"
          >
            No materials yet. Add the first thread.
          </motion.div>
        )}
      </div>

      {/* Running total */}
      {ingredients.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex items-center justify-between border-t border-border pt-4"
        >
          <div className="flex items-center gap-2">
            <div className="h-[3px] w-24 overflow-hidden bg-border">
              <motion.div
                className={`h-full ${totalPct > concentration ? "bg-destructive" : Math.abs(totalPct - concentration) <= 0.1 ? "bg-accent" : "bg-foreground"}`}
                animate={{ width: `${concentration > 0 ? Math.min((totalPct / concentration) * 100, 100) : 0}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <span className={`font-mono-ui text-[10px] ${totalPct > concentration ? "text-destructive" : Math.abs(totalPct - concentration) <= 0.1 ? "text-accent-foreground" : "text-muted-foreground"}`}>
              {totalPct}% of {concentration}% target
            </span>
          </div>
          {totalPct > concentration && <span className="font-mono-ui text-[9px] text-destructive">Exceeds concentration</span>}
          {Math.abs(totalPct - concentration) <= 0.1 && <span className="font-mono-ui text-[9px] text-accent-foreground">Palette complete</span>}
          {totalPct > 0 && totalPct < concentration && (
            <span className="font-mono-ui text-[9px] text-muted-foreground">{Math.round((concentration - totalPct) * 10) / 10}% remaining</span>
          )}
        </motion.div>
      )}
    </div>
  );
}
