import { useState } from "react";
import { motion } from "framer-motion";
import { Paperclip, Search } from "lucide-react";
import { useSearch } from "wouter";
import { useListFormulas } from "@workspace/api-client-react";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { FormulaCard } from "../components/FormulaCard";
import { FormulaRow } from "../components/FormulaRow";
import { PageHeader } from "../components/PageHeader";
import { SectionRule } from "../components/SectionRule";
import { Shell } from "../components/Shell";
import { Skeleton } from "../components/Skeleton";

export function Formulas() {
  const [search, setSearch] = useState("");
  const rawSearch = useSearch();
  const urlStatus = new URLSearchParams(rawSearch).get("status") as "draft" | "resting" | "approved" | null;
  const [status, setStatus] = useState<"all" | "draft" | "resting" | "approved">(urlStatus ?? "all");
  const query = useListFormulas({ search: search || undefined, status: status === "all" ? undefined : status });
  const formulas = query.data ?? [];

  return (
    <Shell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} className="relative -mx-5 h-[120px] overflow-hidden border-b border-border sm:-mx-8 lg:-mx-12">
        <img src={`${import.meta.env.BASE_URL}images/molecule.jpg`} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-20 grayscale mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="relative flex h-full flex-col justify-center px-5 sm:px-8 lg:px-12">
          <p className="font-mono-ui text-[8px] uppercase tracking-[.3em] text-muted-foreground">The notebook · all formulas</p>
          <p className="mt-1 font-mono-ui text-[9px] text-muted-foreground/60">A living record of each composition</p>
        </div>
      </motion.div>
      <PageHeader eyebrow="Library · formulas" title="Formula library" description="The living record of what you've made, paused, and almost made." action={
        <div className="flex flex-wrap gap-2">
          <Button href="/files" variant="outline" testId="button-library-import-file"><Paperclip size={13} /> Import file</Button>
          <Button href="/formulas/new" testId="button-library-new">New formula</Button>
        </div>
      } />
      <SectionRule label="Filter · search" />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search size={16} className="absolute left-4 top-3.5 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or brief..." data-testid="input-formula-search" className="w-full border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-foreground/40" /></div>
        <select value={status} data-testid="select-formula-status" className="border border-border bg-card px-4 py-3 text-xs outline-none focus:border-foreground/40" onChange={e => setStatus(e.target.value as typeof status)}><option value="all">All stages</option><option value="draft">Drafts</option><option value="resting">Resting</option><option value="approved">Approved</option></select>
      </div>
      <div className="border border-border bg-card px-5 sm:px-7">
        <div className="hidden grid-cols-[1.5fr_1fr_110px_110px_24px] gap-4 border-b border-border py-3 font-mono-ui text-[9px] uppercase tracking-[.14em] text-muted-foreground sm:grid"><span>Formula</span><span>Palette</span><span>Stage</span><span className="text-right">Changed</span><span /></div>
        {query.isLoading ? [1, 2, 3].map(i => <Skeleton key={i} className="my-5 h-14" />) : query.isError ? <ErrorState retry={() => query.refetch()} /> : formulas.length ? formulas.map(formula => <div key={formula.id}><FormulaCard formula={formula} /><FormulaRow formula={formula} /></div>) : <EmptyState title="No formulas found." copy="Try another search, or give the next one a name." href="/formulas/new" label="Start a formula" />}
      </div>
    </Shell>
  );
}

export default Formulas;