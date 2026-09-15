import { Leaf } from "lucide-react";
import { Link } from "wouter";
import type { Material } from "@workspace/api-client-react";
import { normalizeMaterialFamilies } from "@workspace/material-families";
import { StatusPill } from "./StatusPill";

const FAMILY_WASH: Record<string, { bg: string; img: string; pos: string }> = {
  citrus:    { bg: "bg-secondary",  img: "botanicals.jpg", pos: "center top"    },
  floral:    { bg: "bg-accent/30",  img: "jasmine.jpg",    pos: "center"        },
  woody:     { bg: "bg-secondary",  img: "leaves.jpg",     pos: "center bottom" },
  resinous:  { bg: "bg-muted",      img: "resin.jpg",      pos: "center"        },
  fresh:     { bg: "bg-secondary",  img: "botanicals.jpg", pos: "top left"      },
  musk:      { bg: "bg-accent/20",  img: "molecule.jpg",   pos: "center"        },
  spicy:     { bg: "bg-muted",      img: "spice.jpg",      pos: "center"        },
  green:     { bg: "bg-secondary",  img: "leaves.jpg",     pos: "bottom"        },
};

export function MaterialCard({ material }: { material: Material }) {
  const familyKey = normalizeMaterialFamilies(material.family)[0] ?? "";
  const wash = FAMILY_WASH[familyKey] ?? { bg: "bg-secondary", img: "botanicals.jpg", pos: "center" };
  return (
    <Link href={`/materials/${material.id}`} data-testid={`card-material-${material.id}`}>
      <article className="group relative border border-border bg-card overflow-hidden p-5 transition-colors hover:bg-secondary/20">
        {/* Tinted background image */}
        <img
          src={`${import.meta.env.BASE_URL}images/${wash.img}`}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.12] mix-blend-multiply"
          style={{ objectPosition: wash.pos }}
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className={`grid size-10 place-items-center ${wash.bg} text-foreground`}>
              <Leaf size={18} strokeWidth={1.5} />
            </div>
            <StatusPill value={material.safetyStatus} />
          </div>
          <h3 className="mt-5 font-display text-2xl leading-none" data-testid={`text-material-name-${material.id}`}>{material.name}</h3>
          <p className="mt-2 text-xs text-muted-foreground">{material.family} · {material.origin}</p>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4 font-mono-ui text-[9px] uppercase tracking-[.11em] text-muted-foreground">
            <span>IFRA {material.ifraLimit}%</span>
            <span>{material.inStock ? "In stock" : "To source"}</span>
          </div>
          {material.usageNotes && (
            <p className="mt-3 text-xs leading-5 text-muted-foreground line-clamp-2">{material.usageNotes}</p>
          )}
          <p className="mt-3 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/50">
            Read more →
          </p>
        </div>
      </article>
    </Link>
  );
}
