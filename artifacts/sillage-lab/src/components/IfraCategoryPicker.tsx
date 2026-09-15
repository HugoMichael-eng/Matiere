import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export const IFRA_CATEGORIES: { value: string; label: string }[] = [
  { value: "1", label: "Cat 1 — Lip products" },
  { value: "2", label: "Cat 2 — Deodorant & antiperspirant" },
  { value: "3", label: "Cat 3 — Eye area products" },
  { value: "4", label: "Cat 4 — Fine fragrance (EdT, EdP, cologne)" },
  { value: "5a", label: "Cat 5a — Body lotion / body cream" },
  { value: "5b", label: "Cat 5b — Face moisturiser (leave-on)" },
  { value: "5c", label: "Cat 5c — Hand cream" },
  { value: "5d", label: "Cat 5d — Baby products (leave-on)" },
  { value: "6", label: "Cat 6 — Oral care (mouthwash)" },
  { value: "7a", label: "Cat 7a — Leave-on hair products" },
  { value: "7b", label: "Cat 7b — Aerosol hair products (leave-on)" },
  { value: "8", label: "Cat 8 — Makeup (non-eye, non-lip)" },
  { value: "9a", label: "Cat 9a — Rinse-off hair (shampoo)" },
  { value: "9b", label: "Cat 9b — Rinse-off hair colouring" },
  { value: "10a", label: "Cat 10a — Home care / spray cleaners" },
  { value: "10b", label: "Cat 10b — Fabric softener" },
  { value: "11a", label: "Cat 11a — Candles" },
  { value: "11b", label: "Cat 11b — Room / reed diffusers" },
  { value: "12", label: "Cat 12 — Other (industrial / professional)" },
];

export function IfraCategoryPicker({ value, onChange, testId }: {
  value: string;
  onChange: (value: string) => void;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = IFRA_CATEGORIES.find((category) => category.value === value);
  return (
    <div className="mt-7">
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex w-full items-center justify-between gap-3">
        <span className="text-xs font-medium">IFRA product category</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {selected ? selected.label : <span className="italic">Not set</span>}
          <ChevronDown size={13} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <select autoFocus value={value} onChange={(event) => { onChange(event.target.value); setOpen(false); }} data-testid={testId} className="mt-3 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40">
              <option value="">— Not set</option>
              {IFRA_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
            </select>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}