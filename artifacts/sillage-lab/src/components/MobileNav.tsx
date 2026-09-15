import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Logo } from "./Logo";

const navItems = [
  { href: "/studio", label: "Studio" },
  { href: "/projects", label: "Projects" },
  { href: "/formulas", label: "Formulas" },
  { href: "/materials", label: "Materials" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  return (
    <div className="relative flex items-center justify-between border-b border-border bg-background px-5 py-4 md:hidden">
      <Logo />
      <button onClick={() => setOpen(!open)} data-testid="button-mobile-menu" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} className="p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none">
        {open ? <X size={14} strokeWidth={1.5} /> : <Menu size={14} strokeWidth={1.5} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.nav key="mobile-menu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }} className="absolute left-0 right-0 top-full z-40 border-b border-border bg-background">
            {navItems.map(({ href, label }) => {
              const active = location === href || (href !== "/studio" && location.startsWith(href));
              return <Link key={href} href={href} onClick={() => setOpen(false)} data-testid={`link-mobile-${label.toLowerCase().replaceAll(" ", "-")}`} className={[
                "flex items-center gap-3 border-t border-border px-5 py-4",
                "font-mono-ui text-[9px] uppercase tracking-[.22em]",
                "transition-colors duration-150",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              ].join(" ")}>
                {active && <span className="h-[1px] w-3 bg-accent shrink-0" aria-hidden />}{label}
              </Link>;
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}