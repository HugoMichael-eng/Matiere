import { useState } from "react";
import { FocusViewer } from "#components/ui/focus-viewer";

export function FocusViewerDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <p className="mb-4 font-mono text-[9px] uppercase tracking-[.2em] text-muted-foreground">
        Focus Viewer — full-viewport overlay
      </p>
      <button
        onClick={() => setOpen(true)}
        className="border border-border px-4 py-2 font-mono text-[9px] uppercase tracking-widest hover:bg-secondary transition-colors"
        data-testid="button-open-focus-viewer"
      >
        Open Focus Viewer
      </button>

      <FocusViewer
        label="Demo reference"
        open={open}
        onClose={() => setOpen(false)}
        caption="Salt crystal texture — surface structure reference"
        actions={
          <>
            <button
              className="font-mono text-[8px] uppercase tracking-[.18em] text-foreground border border-border px-3 py-2 hover:bg-secondary transition-colors"
              onClick={() => setOpen(false)}
            >
              Interpret
            </button>
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="1" y1="1" x2="13" y2="13" />
                <line x1="13" y1="1" x2="1" y2="13" />
              </svg>
            </button>
          </>
        }
      >
        <div className="flex flex-1 items-center justify-center p-12 min-h-[40vh]">
          <blockquote className="font-sans text-2xl sm:text-3xl leading-snug text-center max-w-md text-foreground">
            The smell of a tide pool at low water. Salt and sun. Something alive underneath the stillness.
          </blockquote>
        </div>
      </FocusViewer>
    </div>
  );
}
