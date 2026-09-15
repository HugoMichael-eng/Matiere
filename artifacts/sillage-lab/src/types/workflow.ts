import type { LucideIcon } from "lucide-react";

export type WorkflowStageId =
  | "conceive"
  | "create"
  | "formulate"
  | "analyze"
  | "check"
  | "optimize"
  | "document"
  | "source"
  | "make";

export interface WorkflowStage {
  id: WorkflowStageId;
  label: string;
  short: string;
  icon: LucideIcon;
  description: string;
  nextAction: string;
  nextHref?: string;
}