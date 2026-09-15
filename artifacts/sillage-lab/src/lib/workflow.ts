import type { Formula, Material } from "@workspace/api-client-react";
import type { WorkflowStage, WorkflowStageId } from "../types/workflow";
import {
  BarChart2,
  FileCheck,
  FlaskConical,
  Lightbulb,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  TestTube2,
  Zap,
} from "lucide-react";

export const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: "conceive",
    label: "Conceive",
    short: "01",
    icon: Lightbulb,
    description: "Define the feeling, brief, and olfactive direction. Explore AI-generated starting points.",
    nextAction: "Generate ideas or name this formula",
    nextHref: "/formulas/new",
  },
  {
    id: "create",
    label: "Create",
    short: "02",
    icon: Sparkles,
    description: "Crystallise the concept and seed the ingredient list from your brief or a blueprint.",
    nextAction: "Open a new formula",
    nextHref: "/formulas/new",
  },
  {
    id: "formulate",
    label: "Formulate",
    short: "03",
    icon: FlaskConical,
    description: "Add and balance every material in the blend. Set concentrations, dilutions, and roles.",
    nextAction: "Edit the formula builder",
  },
  {
    id: "analyze",
    label: "Analyze",
    short: "04",
    icon: BarChart2,
    description: "Review the olfactive profile by role and family. Identify top, heart, and base balance.",
    nextAction: "Review the olfactive structure",
  },
  {
    id: "check",
    label: "Check",
    short: "05",
    icon: ShieldCheck,
    description: "Run IFRA compliance and allergen review against the specified product category.",
    nextAction: "Review IFRA and allergen status",
  },
  {
    id: "optimize",
    label: "Optimize",
    short: "06",
    icon: Zap,
    description: "Identify adjustments, swap materials, and refine percentages for your next trial.",
    nextAction: "Plan the next iteration",
  },
  {
    id: "document",
    label: "Document",
    short: "07",
    icon: FileCheck,
    description: "Write the formula record, update notes, and review the full change history.",
    nextAction: "Review history and notes",
  },
  {
    id: "source",
    label: "Source",
    short: "08",
    icon: PackageSearch,
    description: "Identify gaps in your stock and link to trusted suppliers for missing materials.",
    nextAction: "Check material gaps",
    nextHref: "/shop",
  },
  {
    id: "make",
    label: "Make",
    short: "09",
    icon: TestTube2,
    description: "Calculate bench-ready batch weights for each material at your chosen volume.",
    nextAction: "Generate batch sheet",
  },
];

export function getCompletedWorkflowStages(
  formula?: Formula,
  materials: Material[] = [],
): Set<WorkflowStageId> {
  const done = new Set<WorkflowStageId>();
  if (!formula) return done;

  const hasIngredients = formula.ingredients.length > 0;
  const allLinked = hasIngredients && formula.ingredients.every((ingredient) => ingredient.materialId > 0);
  const totalPercentage = formula.ingredients.reduce((sum, ingredient) => sum + ingredient.percentage, 0);
  const materialById = new Map(materials.map((material) => [material.id, material]));
  const stockIsKnownAndAvailable = allLinked
    && materials.length > 0
    && formula.ingredients.every((ingredient) => materialById.get(ingredient.materialId)?.inStock === true);

  if (formula.brief.trim()) done.add("conceive");
  done.add("create");
  if (hasIngredients) done.add("formulate");
  if (allLinked) done.add("analyze");
  if (allLinked && !!formula.ifraCategory) done.add("check");
  if (hasIngredients && Math.abs(totalPercentage - formula.concentration) <= 0.1) done.add("optimize");
  if (formula.version >= 1) done.add("document");
  if (stockIsKnownAndAvailable) done.add("source");
  if (hasIngredients && formula.totalMl > 0 && formula.concentration > 0) done.add("make");
  return done;
}

export function getSuggestedWorkflowStage(
  formula?: Formula,
  materials: Material[] = [],
): WorkflowStageId {
  if (!formula) return "conceive";
  const completed = getCompletedWorkflowStages(formula, materials);
  return WORKFLOW_STAGES.find((stage) => !completed.has(stage.id))?.id ?? "make";
}