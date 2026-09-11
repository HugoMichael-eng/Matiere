import { AtmosphereStrip } from "#components/ui/atmosphere-strip";

export function AtmosphereStripDemo() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <p className="mb-3 font-mono text-[9px] uppercase tracking-[.2em] text-muted-foreground">
          Default — no image, with label
        </p>
        <AtmosphereStrip label="Marine mineral · warm skin · driftwood base" />
      </div>

      <div>
        <p className="mb-3 font-mono text-[9px] uppercase tracking-[.2em] text-muted-foreground">
          Taller, with overlay children
        </p>
        <AtmosphereStrip height="300px" label="Resinous · warm amber · incense · dry wood">
          <div className="px-6 pb-8 pt-0">
            <p className="font-mono text-[7px] uppercase tracking-[.26em] text-muted-foreground mb-1">
              Résine Noire
            </p>
            <p
              className="font-sans leading-[.86] tracking-[-0.03em] text-foreground"
              style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)" }}
            >
              Résine Noire
            </p>
          </div>
        </AtmosphereStrip>
      </div>

      <div>
        <p className="mb-3 font-mono text-[9px] uppercase tracking-[.2em] text-muted-foreground">
          No image — pure surface
        </p>
        <AtmosphereStrip height="120px" label="Surface only · no image" grayscale={false} />
      </div>
    </div>
  );
}
