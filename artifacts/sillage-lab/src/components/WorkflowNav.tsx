import { motion } from "framer-motion";
import { Link } from "wouter";
import type { WorkflowStageId } from "../types/workflow";
import { WORKFLOW_STAGES } from "../lib/workflow";

export function WorkflowNav({
  activeStage,
  formulaId,
  onSelect,
  completedStages,
  compact = false,
}: {
  activeStage?: WorkflowStageId;
  formulaId?: number;
  onSelect?: (stage: WorkflowStageId) => void;
  completedStages?: Set<WorkflowStageId>;
  compact?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-x-auto border-b border-border"
      data-testid="workflow-nav"
    >
      <div className="flex min-w-max">
        {WORKFLOW_STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const isActive = activeStage === stage.id;
          const isDone = completedStages?.has(stage.id);
          const isClickable = !!onSelect || !!formulaId;
          const href = formulaId ? `/formulas/${formulaId}?stage=${stage.id}` : undefined;
          const className = [
            "relative flex flex-col items-start px-4 py-4 transition-colors",
            compact ? "min-w-[96px]" : "min-w-[110px]",
            i < WORKFLOW_STAGES.length - 1 ? "border-r border-border" : "",
            isActive ? "bg-secondary/50" : "",
            isClickable ? "cursor-pointer hover:bg-secondary" : "",
          ].join(" ");
          const content = (
            <>
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="workflow-active-bar"
                  className="absolute inset-x-0 top-0 h-[2px] bg-foreground"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <div className={`flex items-center gap-1.5 ${isActive ? "text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                <Icon size={compact ? 11 : 12} strokeWidth={1.8} />
                <span className={`font-mono-ui uppercase tracking-[.14em] ${compact ? "text-[8px]" : "text-[8px]"}`}>{stage.short}</span>
              </div>
              <p className={`mt-1.5 font-mono-ui text-[10px] font-medium uppercase tracking-[.08em] transition-colors ${isActive ? "text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                {stage.label}
              </p>
              {isDone && !isActive && (
                <div className="absolute bottom-2 right-2 h-[3px] w-[3px] bg-accent" />
              )}
            </>
          );

          if (href && !onSelect) {
            return (
              <div key={stage.id} data-testid={`link-workflow-${stage.id}`}>
                <Link
                  href={href}
                  data-testid={`workflow-stage-${stage.id}`}
                  aria-current={isActive ? "step" : undefined}
                  className={className}
                >
                  {content}
                </Link>
              </div>
            );
          }

          return (
            <motion.button
              key={stage.id}
              type="button"
              data-testid={`workflow-stage-${stage.id}`}
              aria-current={isActive ? "step" : undefined}
              disabled={!onSelect}
              whileHover={onSelect ? { backgroundColor: "hsl(var(--secondary))" } : {}}
              className={className}
              onClick={onSelect ? () => onSelect(stage.id) : undefined}
            >
              {content}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
