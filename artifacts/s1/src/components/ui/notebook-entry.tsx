/**
 * NotebookEntry — a single studio-notebook record.
 * Used for evaluation phases, project notes, and lab observations.
 *
 * Design language:
 *   - Monospace label + date pair above
 *   - Plain prose body
 *   - Optional tag badge (inline-border chip)
 *   - Optional hairline timeline rule on the left (lab-notebook vertical axis)
 *
 * This is a display-only primitive. Editing lives in the consuming app.
 */

import { cn } from "#lib/utils";
import type { ReactNode } from "react";

export interface NotebookEntryProps {
  /** Primary label (e.g. "Opening", "MOD 04", "15 min") */
  label: string;
  /** Prose body text */
  body: string;
  /** ISO date string or formatted date */
  date?: string;
  /** Short tag or category chip */
  tag?: string;
  /** Show vertical timeline line on left */
  timeline?: boolean;
  /** Extra class names */
  className?: string;
  /** Optional trailing actions */
  actions?: ReactNode;
}

export function NotebookEntry({
  label,
  body,
  date,
  tag,
  timeline = false,
  className,
  actions,
}: NotebookEntryProps) {
  return (
    <div
      className={cn(
        "relative py-5",
        timeline && "pl-5 border-l border-border",
        className
      )}
    >
      {/* Timeline dot */}
      {timeline && (
        <div className="absolute left-0 top-6 -translate-x-[3px] h-[5px] w-[5px] border border-muted-foreground/40 bg-background" />
      )}

      {/* Header row */}
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <p className="font-mono text-[9px] uppercase tracking-[.2em] text-muted-foreground">
          {label}
        </p>
        {date && (
          <p className="font-mono text-[8px] text-muted-foreground/50">
            {date}
          </p>
        )}
        {tag && (
          <span className="inline-block border border-border px-2 py-0.5 font-mono text-[7px] uppercase tracking-widest text-muted-foreground">
            {tag}
          </span>
        )}
        {actions && (
          <div className="ml-auto shrink-0">{actions}</div>
        )}
      </div>

      {/* Body */}
      <p className="text-sm leading-6 text-foreground/80 max-w-2xl">
        {body}
      </p>
    </div>
  );
}
