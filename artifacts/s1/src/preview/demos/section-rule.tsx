import { SectionRule } from "#components/ui/section-rule";

export function SectionRuleDemo() {
  return (
    <div className="max-w-2xl space-y-0 p-6">
      <p className="mb-4 font-mono text-[9px] uppercase tracking-[.2em] text-muted-foreground">
        Section rule — structural divider with centred mono label
      </p>

      {/* Default */}
      <SectionRule label="Materials" />

      {/* Between content blocks */}
      <div className="py-4">
        <p className="text-sm text-foreground/70 leading-6">
          The bottle arrived on a Thursday. I opened it and immediately smelled the lab —
          that particular combination of ethanol and cold glass that means something is about to begin.
        </p>
      </div>

      <SectionRule label="Evaluation · MOD 04" />

      <div className="py-4">
        <p className="text-sm text-foreground/70 leading-6">
          Opening is clean. The calone is imperceptible — exactly where it should be.
          By fifteen minutes the salt note has settled and the skin accord begins.
        </p>
      </div>

      <SectionRule label="Adjustments" />

      <div className="py-4">
        <p className="text-sm text-foreground/70 leading-6">
          Reduce hawthorn by 10%. The floral edge pulls it away from the mineral character
          the direction requires.
        </p>
      </div>

      {/* Long label */}
      <SectionRule label="Technical and regulatory · IFRA 50th amendment" />

      {/* Custom spacing */}
      <SectionRule label="Applied example · custom className" className="py-2" />

      <p className="mt-2 font-mono text-[8px] uppercase tracking-[.18em] text-muted-foreground/50">
        Use SectionRule at page level between named content groups — not as a sub-label inside
        panels or modals (where SectionLabel inline text is more appropriate).
      </p>
    </div>
  );
}
