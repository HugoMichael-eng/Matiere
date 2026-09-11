import type { ReactNode } from "react";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Button } from "@workspace/s1/components/ui/button";
import { Badge } from "@workspace/s1/components/ui/badge";
import { AtmosphereStrip } from "@workspace/s1/components/ui/atmosphere-strip";
import { cn } from "@workspace/s1/lib/utils";

export const IMG = "/__mockup/images/matiere/";

export const formulas = [
  ["Lait Vert 0.1", "LV / 01", "14", "cold green · transparent floral", "28 Feb", "Opening"],
  ["Lait Vert 0.2", "LV / 02", "15", "green · violet leaf · milky skin", "Today", "4 hours"],
  ["Lait Vert 0.3", "LV / 03", "16", "wet leaf · mineral · pale woods", "26 Feb", "1 hour"],
  ["Lait Vert 0.4", "LV / 04", "16", "colder green · clean musk", "24 Feb", "15 min"],
  ["Glasshouse Study", "GH / 02", "11", "humid foliage · diffusive floral", "21 Feb", "Drydown"],
  ["Petrichor Skin", "PS / 05", "18", "earth · mineral skin · cedar", "18 Feb", "4 hours"],
  ["Resin Index", "RI / 07", "12", "amber resin · incense · dry woods", "12 Feb", "1 hour"],
  ["White Flower Trial", "WF / 03", "19", "hedione · petals · soft musk", "08 Feb", "15 min"],
] as const;

export const materials = [
  ["Violet Leaf Absolute", "Natural · Green", "Wet foliage · crushed stems · metallic", "0.80%", "In stock", "leaves.jpg"],
  ["Hedione HC", "Synthetic · Floral", "Transparent jasmine · radiance · diffusion", "18.00%", "In stock", "flower.jpg"],
  ["Stemone", "Synthetic · Green", "Wet leaf · fig stem · metallic", "1.20%", "In stock", "mood-fresh.jpg"],
  ["Galbanum EO", "Natural · Green", "Bitter sap · sharp green · resinous", "0.60%", "In stock", "botanicals.jpg"],
  ["Ambroxan", "Synthetic · Amber", "Mineral skin · dry amber · lift", "13.00%", "Low stock", "amber.jpg"],
  ["Orris Butter", "Natural · Powdery", "Violet root · cool powder · earth", "0.10%", "In stock", "petals.jpg"],
  ["Cedar Atlas", "Natural · Woody", "Pencil shavings · dry wood · warm", "8.00%", "In stock", "texture.jpg"],
  ["Muscenone", "Synthetic · Musk", "Skin warmth · clean musk · depth", "2.00%", "In stock", "vials.jpg"],
];

export const ingredientRows = [
  ["Hedione HC", "24.00", "2.400", "100%", "heart", "diffusion / jasmine air"],
  ["Ambrettolide", "11.50", "1.150", "10%", "base", "milky skin, soften"],
  ["Iso E Super", "10.00", "1.000", "100%", "base", "pale wood scaffold"],
  ["Cashmeran", "3.80", "0.380", "100%", "base", "dry warmth — watch"],
  ["Violet Leaf Absolute", "2.40", "0.240", "10%", "top", "wet green anchor"],
  ["Galbanum Resinoid", "1.20", "0.120", "50%", "top", "bitter sap"],
  ["Cedar Atlas", "1.00", "0.100", "10%", "base", "dry cedar line"],
  ["Stemone", "0.35", "0.035", "10%", "top", "fig stem / metallic"],
  ["Muscenone", "0.18", "0.018", "10%", "base", "quiet skin trail"],
];

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[10px] uppercase tracking-[.16em]", className)}>{children}</span>;
}

export function PageLabel({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[9px] uppercase tracking-[.28em] text-muted-foreground">{children}</p>;
}

export function Rule({ children }: { children: ReactNode }) {
  return <div className="relative flex items-center gap-4 py-6" role="separator" aria-label={String(children)}><div className="h-px flex-1 bg-current/15" /><span className="shrink-0 bg-inherit px-3 font-mono text-[8px] uppercase tracking-[.28em] text-current/55">{children}</span><div className="h-px flex-1 bg-current/15" /></div>;
}

export function Shell({ children, mode = "studio" }: { children: ReactNode; mode?: "studio" | "lab" | "gallery" }) {
  const [open, setOpen] = useState(false);
  const activePath = window.location.hash.split("/").pop();
  const links = [
    ["Studio", "StudioHome"],
    ["Projects", "ProjectOverview"],
    ["Inspiration", "Inspiration"],
    ["Formulas", "FormulaLibrary"],
    ["Materials", "MaterialsLibrary"],
  ];
  return (
    <div className={cn("min-h-[100dvh]", mode === "gallery" ? "bg-background text-foreground" : "bg-foreground text-background")}>
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r px-6 py-7 md:flex", mode === "gallery" ? "border-current/15 bg-background" : "border-current/15 bg-foreground")}>
        <a href="#/matiere/StudioHome" className="font-mono text-[11px] uppercase tracking-[.35em]">MATIÈRE</a>
        <div className="mt-16 space-y-1">
          {links.map(([label, path]) => <a key={path} href={`#/matiere/${path}`} className={cn("group flex items-center justify-between border-l-2 px-3 py-3 font-mono text-[10px] uppercase tracking-[.2em] transition-colors", path === activePath ? "border-accent text-current" : "border-transparent text-current/55 hover:border-current/40 hover:text-current")}>{label}<ArrowUpRight size={11} className="opacity-0 transition-opacity group-hover:opacity-70" /></a>)}
        </div>
        <div className="mt-auto border-t border-current/15 pt-5"><Mono className="text-current/45">Private workspace</Mono><p className="mt-2 text-xs opacity-65">A. Laurent<br />Paris / 2024</p></div>
      </aside>
      <div className="md:pl-56">
        <header className="flex items-center justify-between border-b border-current/15 px-5 py-4 md:hidden"><a href="#/matiere/StudioHome" className="font-mono text-[10px] uppercase tracking-[.3em]">MATIÈRE</a><Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X size={16} /> : <Menu size={16} />}</Button></header>
        {open && <nav className="border-b border-current/15 px-5 py-3 md:hidden">{links.map(([label, path]) => <a key={path} href={`#/matiere/${path}`} className="block py-3 font-mono text-[10px] uppercase tracking-[.2em]">{label}</a>)}</nav>}
        <main className="mx-auto max-w-[1440px]">{children}</main>
      </div>
    </div>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <Badge variant="outline" className={cn("rounded-none font-mono text-[8px] uppercase tracking-[.15em]", className)}>{children}</Badge>;
}

export function Image({ src, alt = "", className }: { src: string; alt?: string; className?: string }) {
  return <img src={`${IMG}${src}`} alt={alt} className={cn("object-cover", className)} />;
}

export function Atmosphere({ src, children }: { src: string; children?: ReactNode }) {
  return <AtmosphereStrip src={`${IMG}${src}`} grayscale={false} opacity={0.82} height="100%" className="absolute inset-0">{children}</AtmosphereStrip>;
}