import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useSearch } from "wouter";
import { useMaterials } from "../hooks/useMaterials";
import { MaterialsGrid } from "../components/MaterialsGrid";
import { PageHeader } from "../components/PageHeader";
import { Shell } from "../components/Shell";

export function Materials() {
  const rawSearch = useSearch();
  const urlSearch = new URLSearchParams(rawSearch).get("search") ?? "";
  const [search, setSearch] = useState(urlSearch);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  const query = useMaterials(search);
  const materials = query.data ?? [];

  return (
    <Shell>
      <PageHeader eyebrow="Library · raw materials" title="Materials" description="A tactile index of the things that make a formula feel alive." />
      <div className="mb-6 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search size={16} className="absolute left-4 top-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials, families, origins..." data-testid="input-material-search" className="w-full border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none focus:border-foreground/40" />
        </div>
        <span className="hidden font-mono-ui text-[10px] text-muted-foreground sm:block" data-testid="text-material-count">{materials.length} indexed</span>
      </div>
      <MaterialsGrid materials={materials} isLoading={query.isLoading} isError={query.isError} retry={() => query.refetch()} />
    </Shell>
  );
}

export default Materials;