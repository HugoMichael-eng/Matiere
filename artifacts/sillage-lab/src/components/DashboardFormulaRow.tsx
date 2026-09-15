import { motion } from "framer-motion";
import { Link } from "wouter";
import type { Formula } from "@workspace/api-client-react";

export function DashboardFormulaRow({ formula, index }: { formula: Formula; index: number }) {
  const num = String(formula.id).padStart(3, "0");
  const name = formula.name || "Untitled";
  const updated = new Date(formula.updatedAt);
  const modified = updated.toDateString() === new Date().toDateString()
    ? "MODIFIED TODAY"
    : `MODIFIED ${updated.toLocaleDateString(undefined, { day: "2-digit", month: "short" }).toUpperCase()}`;
  return (
    <Link href={`/formulas/${formula.id}`} data-testid={`row-dashboard-formula-${formula.id}`}>
      <motion.div
        className="group grid grid-cols-[32px_1fr_auto] items-baseline gap-4 border-t border-border py-4 sm:grid-cols-[32px_1fr_120px_auto] cursor-pointer"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 * index, ease: [0.22, 1, 0.36, 1] }}
        whileHover="hovered"
      >
        <span className="font-mono-ui text-[9px] text-muted-foreground/60 tabular-nums">{num}</span>
        <span className="font-display text-xl uppercase leading-tight tracking-[-0.02em] transition-colors group-hover:text-accent">{name}</span>
        <span className="hidden font-mono-ui text-[9px] uppercase tracking-widest text-muted-foreground sm:block">{modified}</span>
        <motion.span
          className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground/50 transition-colors group-hover:text-foreground"
          variants={{ hovered: { x: 3 }, idle: { x: 0 } }}
          transition={{ duration: 0.2 }}
        >
          &rarr;
        </motion.span>
      </motion.div>
    </Link>
  );
}
