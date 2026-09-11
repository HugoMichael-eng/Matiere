/**
 * AtmosphereStrip — a full-bleed image or colour bar that establishes visual
 * atmosphere at the top of a content surface. Used in project overviews,
 * material detail headers, and editorial intros.
 *
 * Props:
 *   src       — image URL (optional; falls back to a dark surface)
 *   height    — CSS height string, default "200px"
 *   opacity   — image opacity 0–1, default 0.35
 *   grayscale — apply grayscale filter, default true
 *   label     — optional mono overlay label (bottom-left)
 *   children  — arbitrary overlay content
 */

import { cn } from "#lib/utils";
import type { ReactNode } from "react";

export interface AtmosphereStripProps {
  src?: string;
  height?: string;
  opacity?: number;
  grayscale?: boolean;
  label?: string;
  children?: ReactNode;
  className?: string;
}

export function AtmosphereStrip({
  src,
  height = "200px",
  opacity = 0.35,
  grayscale = true,
  label,
  children,
  className,
}: AtmosphereStripProps) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ height }}
    >
      {src && (
        <img
          src={src}
          alt=""
          aria-hidden
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            grayscale && "grayscale"
          )}
          style={{ opacity }}
        />
      )}
      {/* Token surface wash keeps overlaid content legible without decorative effects. */}
      <div className="absolute inset-0 bg-background/55" />
      {/* Bottom label */}
      {label && (
        <div className="absolute bottom-5 left-0 px-0">
          <p className="font-mono text-[8px] uppercase tracking-[.28em] text-muted-foreground">
            {label}
          </p>
        </div>
      )}
      {/* Arbitrary overlay */}
      {children && (
        <div className="absolute inset-0 flex flex-col justify-end">
          {children}
        </div>
      )}
    </div>
  );
}
