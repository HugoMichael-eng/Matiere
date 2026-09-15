import type { ReactNode } from "react";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] bg-background animate-fade-in overflow-x-hidden">
      <Sidebar />
      <div className="min-w-0 flex-1 overflow-x-hidden">
        <MobileNav />
        <main className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 pb-20 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}