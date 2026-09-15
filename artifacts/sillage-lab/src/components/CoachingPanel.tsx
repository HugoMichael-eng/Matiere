import type { ReactNode } from "react";

/** Full-height conversation workspace with a live message-thread region. */
export function CoachingPanel({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-5 flex flex-col overflow-hidden sm:-mx-8 lg:-mx-12" style={{ height: "calc(100dvh - 3.5rem)" }}>
      <section aria-label="Coaching conversation" className="flex min-h-0 flex-1 flex-col" role="log" aria-live="polite">
        {children}
      </section>
    </div>
  );
}
