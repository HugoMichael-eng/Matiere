/**
 * SectionRule — a hairline horizontal rule with a centred monospace label.
 * Used as a structural divider between named sections in editorial layouts
 * and lab notebooks. Sharp, restrained — no gradients or decorations.
 */

import { cn } from "#lib/utils";

export interface SectionRuleProps {
  label: string;
  className?: string;
}

export function SectionRule({ label, className }: SectionRuleProps) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-4 py-6",
        className
      )}
      role="separator"
      aria-label={label}
    >
      <div className="h-px flex-1 bg-border" />
      <span className="shrink-0 bg-background px-3 font-mono text-[8px] uppercase tracking-[.28em] text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
