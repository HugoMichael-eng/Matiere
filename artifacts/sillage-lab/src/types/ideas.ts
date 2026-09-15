export type FormulaIdeaMaterial = {
  name: string;
  role: "top" | "heart" | "base";
  pct: number;
};

export type FormulaIdea = {
  name: string;
  brief: string;
  direction: string;
};