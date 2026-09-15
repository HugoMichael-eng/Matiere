import { ChevronRight } from "lucide-react";
import { Link } from "wouter";
import type { Formula } from "@workspace/api-client-react";
import { StatusPill } from "./StatusPill";

export function FormulaCard({ formula }: { formula: Formula }) {
  return (
    <Link href={`/formulas/${formula.id}`} className="sm:hidden">
      <div className="flex items-center justify-between gap-4 border-b border-border py-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{formula.name}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{formula.brief || "No brief yet"}</p>
          <div className="mt-3 flex items-center gap-3">
            <StatusPill value={formula.status} />
            <span className="font-mono-ui text-[9px] text-muted-foreground">{formula.ingredients?.length ?? 0} materials</span>
          </div>
        </div>
        <ChevronRight size={15} className="shrink-0 text-muted-foreground" />
      </div>
    </Link>
  );
}