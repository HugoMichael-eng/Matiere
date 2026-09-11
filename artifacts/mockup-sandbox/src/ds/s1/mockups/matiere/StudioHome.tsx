import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { NotebookEntry } from "@workspace/s1/components/ui/notebook-entry";
import { Button } from "@workspace/s1/components/ui/button";
import { Shell, Image, Mono, PageLabel, Rule, formulas, materials } from "./_shared";

export function StudioHome() {
  return <Shell>
    <section className="relative min-h-[620px] overflow-hidden bg-background text-foreground">
      <Image src="mood-fresh.jpg" alt="" className="absolute inset-y-0 right-0 h-full w-[58%] opacity-90" />
      <div className="absolute inset-0 bg-background/45" />
      <div className="relative grid min-h-[620px] items-end gap-12 px-6 py-14 lg:grid-cols-[1fr_1fr] lg:px-16">
        <div className="max-w-xl"><PageLabel>Current focus · 02 / active</PageLabel><h1 className="mt-5 font-display text-7xl leading-[.8] tracking-[-.06em] sm:text-9xl">Lait<br />Vert</h1><p className="mt-7 max-w-sm text-sm leading-6 text-foreground/75">Green · violet leaf · milky skin · transparent</p><p className="mt-4 max-w-md text-sm leading-6 text-foreground/65">A green floral built around violet leaf absolute and galbanum, with a milky-skin base from Hedione and Cashmeran.</p><Button className="mt-8 rounded-none" variant="secondary">Continue project <ArrowRight size={14} /></Button></div>
        <div className="self-end lg:justify-self-end"><Mono className="text-foreground/60">Current reading</Mono><p className="mt-3 max-w-xs font-display text-2xl leading-tight">The violet leaf finally reads wet rather than cosmetic.</p><Mono className="mt-8 block text-foreground/50">MOD 02 · edited today</Mono></div>
      </div>
    </section>
    <div className="bg-foreground text-background px-6 py-14 lg:px-16">
      <section><div className="flex items-end justify-between"><PageLabel>Projects in motion</PageLabel><Mono>03 active</Mono></div><div className="mt-7 grid gap-8 lg:grid-cols-3">
        {[["leaves.jpg","Lait Vert","Green · violet leaf · milky skin","The violet leaf finally reads wet rather than cosmetic."],["hero-droplets.jpg","Sel Gris","Marine mineral · warm skin · driftwood","Less amber. More distance."],["resin.jpg","Résine Noire","Resinous · warm amber · dry woods","Push the resin without becoming sweet."]].map(([img,name,direction,note]) => <a href="#/matiere/ProjectOverview" key={name} className="group"><Image src={img} alt="" className="h-64 w-full transition-transform duration-500 group-hover:scale-[1.02]" /><div className="border-t border-border py-4"><div className="flex justify-between"><h2 className="font-display text-3xl">{name}</h2><ChevronRight size={16} /></div><Mono className="mt-2 block text-muted-foreground">{direction}</Mono><p className="mt-4 text-sm leading-6 text-muted-foreground">“{note}”</p><Mono className="mt-5 block text-muted-foreground/60">MOD 02 · ACTIVE</Mono></div></a>)}
      </div></section>
      <Rule>Current formula</Rule>
      <section className="grid gap-8 lg:grid-cols-[1fr_1.5fr]"><div><PageLabel>Lait Vert — Mod 02</PageLabel><h2 className="mt-3 font-display text-5xl tracking-[-.04em]">A colder<br />green structure.</h2><a href="#/matiere/FormulaLab" className="mt-8 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.18em]">Open formula <ArrowRight size={12} /></a></div><div className="border-y border-border font-mono text-xs">{formulas.slice(0, 1).map(f => <div key={f[0]} className="flex justify-between border-b border-border py-3"><span>Hedione HC</span><span>24.00%</span></div>)}{[["Ambrettolide","11.50%"],["Iso E Super","10.00%"],["Cashmeran","3.80%"],["Violet Leaf Absolute","2.40%"],["Galbanum Resinoid","1.20%"],["Stemone","0.35%"]].map(r => <div key={r[0]} className="flex justify-between border-b border-border py-3"><span>{r[0]}</span><span>{r[1]}</span></div>)}<div className="py-3 text-muted-foreground">+ 8 more materials</div></div></section>
      <Rule>Latest evaluation</Rule>
      <section className="grid gap-8 lg:grid-cols-[1fr_1.5fr]"><div><PageLabel>MOD 02 · sensory notebook</PageLabel><h2 className="mt-3 font-display text-4xl">The quiet<br />after the rain.</h2></div><div><NotebookEntry label="15 min" body="The opening is finally green enough. Violet leaf reads wet rather than cosmetic." timeline /><NotebookEntry label="1 hour" body="The transition into Hedione is beautiful but slightly too soft." timeline /><NotebookEntry label="4 hours" body="Cashmeran may still be warming the base too much." timeline /></div></section>
      <Rule>Materials in play</Rule>
      <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">{materials.slice(0,4).map(m => <a href="#/matiere/MaterialDetail" key={m[0]} className="border-t border-border py-4 transition-colors hover:bg-muted"><PageLabel>{m[0]}</PageLabel><p className="mt-3 text-sm leading-6 text-muted-foreground">{m[2]}</p><Mono className="mt-4 block text-muted-foreground/60"><Check size={10} className="mr-1 inline" /> in stock</Mono></a>)}</div>
    </div>
  </Shell>;
}