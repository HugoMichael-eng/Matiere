import { useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { Shell, Image, Mono, PageLabel, Tag } from "./_shared";

const tiles = [
  ["leaves.jpg", "wide"], ["mood-fresh.jpg", "tall"], ["mood-clean.jpg", "square"], ["hero-droplets.jpg", "wide"], ["texture.jpg", "square"], ["petals.jpg", "tall"], ["vials.jpg", "square"],
] as const;

export function Inspiration() {
  const [focus, setFocus] = useState<string | null>(null);
  return <Shell mode="gallery"><div className="bg-background px-5 pb-20 text-foreground lg:px-12">
    <header className="flex items-end justify-between border-b border-current/15 py-10"><div><PageLabel>Project / Lait Vert</PageLabel><h1 className="mt-4 font-display text-6xl tracking-[-.06em] sm:text-8xl">Inspiration</h1></div><div className="hidden text-right sm:block"><Mono className="text-foreground/50">18 references</Mono><p className="mt-2 text-sm text-foreground/60">Cold / transparent / vegetal</p></div></header>
    <div className="grid gap-12 py-14 lg:grid-cols-[.7fr_2.3fr]"><div className="lg:sticky lg:top-8 lg:h-fit"><PageLabel>Olfactive direction</PageLabel><p className="mt-5 max-w-xs font-display text-4xl leading-[.95]">Not botanical.<br />Architectural green.</p><p className="mt-7 max-w-xs text-sm leading-6 text-foreground/55">The smell of a greenhouse after everyone has left.</p><div className="mt-12 flex flex-wrap gap-2"><Tag>wet foliage</Tag><Tag>cold light</Tag><Tag>milky skin</Tag></div></div><div className="columns-1 gap-4 sm:columns-2">{tiles.map(([src, shape], i) => <button key={src} onClick={() => setFocus(src)} className={`group mb-4 block w-full break-inside-avoid text-left ${shape === "wide" ? "sm:col-span-2" : ""}`}><Image src={src} alt="" className={`w-full transition-transform duration-500 group-hover:scale-[1.015] ${shape === "tall" ? "aspect-[3/4]" : shape === "wide" ? "aspect-[16/8]" : "aspect-square"}`} /><div className="mt-2 flex justify-between opacity-0 transition-opacity group-hover:opacity-100"><Mono className="text-foreground/55">reference {String(i + 1).padStart(2, "0")}</Mono><ArrowUpRight size={12} /></div></button>)}</div></div>
    <div className="grid gap-8 border-t border-current/15 pt-10 lg:grid-cols-3"><div className="lg:col-span-2"><p className="font-display text-4xl leading-tight">“The smell of a greenhouse after everyone has left.”</p></div><div><PageLabel>Material territories</PageLabel><p className="mt-4 text-sm leading-7 text-foreground/65">Violet leaf absolute · Stemone · Hedione HC · Galbanum EO · Ambrettolide · Ambroxan</p></div></div>
  </div>{focus && <div className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/95 p-6" onClick={() => setFocus(null)}><button className="absolute right-6 top-6" aria-label="Close"><X /></button><Image src={focus} alt="" className="max-h-[86vh] max-w-[90vw]" /></div>}</Shell>;
}