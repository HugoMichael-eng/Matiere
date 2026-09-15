import type { FormulaIngredientInput, Material } from "@workspace/api-client-react";

export function normalizeImportRole(role?: string): FormulaIngredientInput["role"] {
  return role === "top" || role === "heart" || role === "base" || role === "modifier" ? role : "modifier";
}

export function matchBlueprintToLibrary(
  ingredients: FormulaIngredientInput[],
  materials: Material[],
): FormulaIngredientInput[] {
  if (!materials.length) return ingredients;
  return ingredients.map((ingredient) => {
    if (ingredient.materialId !== 0 || !ingredient.materialName) return ingredient;
    const nameLower = ingredient.materialName.toLowerCase();
    let match = materials.find((material) => material.name.toLowerCase() === nameLower);
    if (!match) {
      match = materials.find((material) => (
        material.name.toLowerCase().includes(nameLower)
        || nameLower.includes(material.name.toLowerCase())
      ));
    }
    return match ? { ...ingredient, materialId: match.id, materialName: match.name } : ingredient;
  });
}
