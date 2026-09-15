import { motion } from "framer-motion";

/** Lab-notebook section separator: hairline rule with a centred monospace label */
export function SectionRule({ label }: { label: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="relative flex items-center gap-4 py-6">
      <div className="h-px flex-1 bg-border" />
      <span className="shrink-0 bg-background px-3 font-mono-ui text-[8px] uppercase tracking-[.28em] text-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </motion.div>
  );
}
