import type { Formula, FormulaIngredientRecord, Material } from "@workspace/db";

type FormulaSafety = {
  safetyStatus: "clear" | "review" | "blocked";
  allergenCount: number;
  ifraStatus: "within_limit" | "review" | "exceeds_limit";
};

export function calculateSafety(
  ingredients: FormulaIngredientRecord[],
  materials: Material[],
): FormulaSafety {
  const materialMap = new Map(materials.map((material) => [material.id, material]));
  const allergenNames = new Set<string>();
  let exceedsIfra = false;
  let missingIfraData = false;

  for (const ingredient of ingredients) {
    const material = materialMap.get(ingredient.materialId);
    if (!material) {
      missingIfraData = true;
      continue;
    }
    for (const allergen of material.allergens ?? []) allergenNames.add(allergen);
    if (ingredient.percentage > material.ifraLimit) exceedsIfra = true;
  }

  return {
    safetyStatus: exceedsIfra ? "blocked" : allergenNames.size > 0 || missingIfraData ? "review" : "clear",
    allergenCount: allergenNames.size,
    ifraStatus: exceedsIfra ? "exceeds_limit" : missingIfraData ? "review" : "within_limit",
  };
}

export function toFormulaResponse(formula: Formula, materials: Material[]) {
  const ingredients = formula.ingredients ?? [];
  const safety = calculateSafety(ingredients, materials);
  return {
    id: formula.id,
    name: formula.name,
    brief: formula.brief,
    status: formula.status,
    concentration: formula.concentration,
    totalMl: formula.totalMl,
    version: formula.version,
    ingredients,
    ...safety,
    notes: formula.notes,
    updatedAt: formula.updatedAt,
    createdAt: formula.createdAt,
  };
}