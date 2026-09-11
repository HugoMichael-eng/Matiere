import { NotebookEntry } from "#components/ui/notebook-entry";
import { SectionRule } from "#components/ui/section-rule";

export function NotebookEntryDemo() {
  return (
    <div className="max-w-2xl space-y-0 p-6">
      <p className="mb-4 font-mono text-[9px] uppercase tracking-[.2em] text-muted-foreground">
        Notebook Entry — studio log record
      </p>

      <SectionRule label="MOD 04 Evaluation" />

      <NotebookEntry
        label="Opening"
        body="Clean, cold minerality. The calone is right — imperceptible but present."
        date="2025-01-14"
        timeline
      />
      <div className="border-t border-border/40" />
      <NotebookEntry
        label="15 min"
        body="Salt note settles. Ambroxan begins to warm the skin accord."
        timeline
      />
      <div className="border-t border-border/40" />
      <NotebookEntry
        label="1 hour"
        body="Lovely drydown. Very smooth, almost quiet."
        timeline
      />
      <div className="border-t border-border/40" />
      <NotebookEntry
        label="Drydown"
        body="Warm musk with a trace of wood. The driftwood accord is subtle."
        timeline
      />

      <SectionRule label="Notes" className="mt-4" />

      <NotebookEntry
        label="Direction"
        body="MOD 04 is the closest so far. The calone is at 0.08% — any higher and it reads 'swimming pool'. Keep it geological, not aquatic."
        date="Jan 14"
        tag="evaluation"
      />
      <div className="border-t border-border/40" />
      <NotebookEntry
        label="Material consideration"
        body="Consider swapping the hawthorn absolute for flouve — wants something more hay-like, less floral in the transition."
        date="Jan 8"
        tag="material direction"
      />
    </div>
  );
}
