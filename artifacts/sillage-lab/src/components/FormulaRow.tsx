import { ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import type { Formula } from "@workspace/api-client-react";
import { StatusPill } from "./StatusPill";

export function FormulaRow({ formula }: { formula: Formula }) {
  return (
    <Link href={`/formulas/${formula.id}`} data-testid={`row-formula-${formula.id}`}>
      <motion.div
        className="group relative hidden grid-cols-[1fr_auto] items-center gap-4 overflow-hidden border-b border-border py-5 sm:grid sm:grid-cols-[1.5fr_1fr_110px_110px_24px]"
        whileHover="hovered" initial="idle"
      >
        {/* Sweep bar */}
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-secondary/70 origin-left"
          variants={{ idle: { scaleX: 0 }, hovered: { scaleX: 1 } }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="relative min-w-0"
          variants={{ idle: { x: 0 }, hovered: { x: 6 } }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="truncate text-sm font-medium">{formula.name}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{formula.brief || "No brief yet"}</p>
        </motion.div>
        <div className="relative hidden text-xs text-muted-foreground sm:block">{formula.ingredients?.length ?? 0} materials</div>
        <div className="relative hidden sm:block"><StatusPill value={formula.status} /></div>
        <div className="relative hidden text-right font-mono-ui text-[10px] text-muted-foreground sm:block">
          {new Date(formula.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </div>
        <motion.div
          className="relative"
          variants={{ idle: { x: 0 }, hovered: { x: 4 } }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <ChevronRight size={15} className="text-muted-foreground" />
        </motion.div>
      </motion.div>
    </Link>
  );
}
