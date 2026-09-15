import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Material } from "@workspace/api-client-react";

export function MaterialCombobox({ materials, value, onChange, index }: {
  materials: Material[];
  value: { materialId: number; materialName: string };
  onChange: (materialId: number, materialName: string) => void;
  index: number;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? materials.filter(m =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.family.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 40)
    : materials.slice(0, 40);
  const listboxId = `material-options-${index}`;

  const isAiSuggested = value.materialId === 0 && value.materialName.length > 0;
  const selectedName = value.materialName;

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, open]);

  const selectMaterial = (material: Material) => {
    onChange(material.id, material.name);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative min-w-0">
      <div className={`flex items-center border bg-card ${isAiSuggested && !open ? "border-accent/40" : "border-border"}`}>
        <Search size={12} className="ml-3 shrink-0 text-muted-foreground" />
        <input
          type="text"
          data-testid={`select-ingredient-material-${index}`}
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-xs outline-none placeholder:text-muted-foreground/50"
          placeholder="Search material…"
          value={open ? query : selectedName}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open && filtered[highlightedIndex] ? `${listboxId}-option-${filtered[highlightedIndex].id}` : undefined}
          onFocus={() => { setOpen(true); setQuery(isAiSuggested ? value.materialName : ""); }}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onKeyDown={e => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setHighlightedIndex(current => Math.min(current + 1, Math.max(0, filtered.length - 1)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightedIndex(current => Math.max(current - 1, 0));
            } else if (e.key === "Enter" && open && filtered[highlightedIndex]) {
              e.preventDefault();
              selectMaterial(filtered[highlightedIndex]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {!open && value.materialId > 0 && (
          <span className="mr-2 shrink-0 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/60">
            {materials.find(m => m.id === value.materialId)?.family ?? ""}
          </span>
        )}
        {!open && isAiSuggested && (
          <span className="mr-2 shrink-0 font-mono-ui text-[8px] uppercase tracking-widest text-accent/70">AI</span>
        )}
      </div>
      {open && (
        <div id={listboxId} role="listbox" className="absolute left-0 right-0 top-full z-50 max-h-52 overflow-y-auto border border-t-0 border-border bg-card shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-[11px] text-muted-foreground">No materials found.</p>
          ) : (
            filtered.map(m => (
              <button
                key={m.id}
                type="button"
                id={`${listboxId}-option-${m.id}`}
                role="option"
                aria-selected={m.id === value.materialId}
                onMouseEnter={() => setHighlightedIndex(filtered.indexOf(m))}
                onMouseDown={() => selectMaterial(m)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-secondary ${m.id === value.materialId || filtered[highlightedIndex]?.id === m.id ? "bg-secondary font-medium" : ""}`}
              >
                <span>{m.name}</span>
                <span className="ml-2 shrink-0 font-mono-ui text-[8px] uppercase tracking-wider text-muted-foreground/60">{m.family}</span>
              </button>
            ))
          )}
          {!query && materials.length > 40 && (
            <p className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">Type to search all {materials.length} materials</p>
          )}
        </div>
      )}
    </div>
  );
}
