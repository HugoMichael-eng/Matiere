export type StudioFileCategory = "formula" | "document" | "image" | "other";

export type StudioFile = {
  id: number;
  name: string;
  contentType: string;
  size: number;
  category: StudioFileCategory;
  createdAt: string;
  updatedAt?: string;
  url?: string | null;
  extractedText?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type FormulaFileAnalysisIngredient = {
  materialName: string;
  materialId: number | null;
  matchedName: string | null;
  percentage?: number;
  grams?: number;
  dilution?: number;
  role?: string;
  allergens: string[];
  ifraWarning: string | null;
};

export type FormulaFileAnalysis = {
  sourceFile: string;
  formulaName: string;
  concentration: number | null;
  totalMl: number | null;
  ingredientCount: number;
  ingredients: FormulaFileAnalysisIngredient[];
  allergens: string[];
  unknownMaterials: string[];
  ifraWarnings: Array<{ material: string; warning: string }>;
  interpretation: string;
};

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const FILE_ACCEPT = "*/*";

export function fileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function canAnalyzeFormulaFile(file: Pick<StudioFile, "category" | "contentType" | "name">): boolean {
  return file.category === "formula"
    || file.contentType.includes("pdf")
    || file.contentType.startsWith("text/")
    || /\.(pdf|txt)$/i.test(file.name);
}