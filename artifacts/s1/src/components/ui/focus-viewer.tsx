/**
 * FocusViewer — full-viewport low-chrome focus overlay for inspecting a
 * single piece of content (image, text, material reference, document).
 *
 * Accessibility:
 *   - role="dialog" aria-modal="true" with an aria-label
 *   - Focus is trapped inside the panel on open; panel itself is a
 *     focusable fallback (tabIndex={-1}) when children/actions have none
 *   - Previous focus is restored on close
 *   - Escape has exactly ONE authoritative handler (keydown on the panel
 *     element) — the backdrop onClick does NOT call onClose; it dispatches
 *     to the same path so there is no double-fire risk
 *   - Backdrop click dismisses via the single close path
 *
 * Design:
 *   - Zero-radius, sharp industrial edges
 *   - Minimal chrome — a thin bottom bar with label + contextual actions
 *   - Restrained opacity entry only (no springs, no scale)
 *   - Mobile: bottom sheet-like contextual actions strip
 */

import { useEffect, useRef, useCallback, type ReactNode, type KeyboardEvent } from "react";
import { cn } from "#lib/utils";

export interface FocusViewerProps {
  /** Accessible label describing the content */
  label: string;
  /** Whether the viewer is open */
  open: boolean;
  /** Called when the viewer should close */
  onClose: () => void;
  /** Main content area */
  children: ReactNode;
  /** Bottom bar actions */
  actions?: ReactNode;
  /** Optional caption shown in bottom bar */
  caption?: string;
  className?: string;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/**
 * Trap focus inside `ref` while `active` is true.
 * The panel element itself carries tabIndex={-1} so there is always at
 * least one focusable node — the panel — even when children have none.
 * Escape is NOT handled here; it is handled by the panel's onKeyDown so
 * there is exactly one authoritative handler and no risk of double-fire.
 */
function useFocusTrap(
  ref: React.RefObject<HTMLElement | null>,
  active: boolean,
  restoreTo: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!active) return;

    const el = ref.current;
    if (!el) return;

    // Focus the first focusable node, or the panel itself as fallback
    const nodes = getFocusable(el);
    (nodes[0] ?? el).focus();

    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = getFocusable(el);
      // Always include the panel itself as the ultimate fallback
      const all = nodes.length > 0 ? nodes : [el];
      const first = all[0];
      const last = all[all.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    el.addEventListener("keydown", handler);
    return () => {
      el.removeEventListener("keydown", handler);
      // Restore focus on unmount
      restoreTo.current?.focus();
    };
  }, [active, ref, restoreTo]);
}

export function FocusViewer({
  label,
  open,
  onClose,
  children,
  actions,
  caption,
  className,
}: FocusViewerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Capture the element that was focused before open so we can restore it
  const previousFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  useFocusTrap(panelRef, open, previousFocusRef);

  // Single authoritative close path — used by both Escape and backdrop
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    /* Backdrop — click delegates through handleClose, does NOT call onClose directly */
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: "hsl(var(--background) / 0.96)" }}
      onClick={handleClose}
    >
      {/* Panel — the dialog landmark; handles Escape exactly once */}
      <div
        ref={panelRef}
        /* tabIndex={-1} makes the panel itself focusable as a fallback
           when no interactive children are present */
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          "relative flex flex-col w-full max-w-4xl mx-4 max-h-[94dvh] overflow-hidden",
          "border border-border bg-card",
          "animate-fade-in",
          "focus:outline-none",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            e.preventDefault();
            handleClose();
          }
        }}
      >
        {/* Content */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {children}
        </div>

        {/* Bottom bar */}
        <div className="shrink-0 border-t border-border bg-card px-5 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {caption && (
              <p className="flex-1 min-w-0 truncate font-mono text-[8px] uppercase tracking-[.2em] text-muted-foreground">
                {caption}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 ml-auto shrink-0">
              {actions}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
