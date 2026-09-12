import './fonts.css';
import React from 'react';

export default function SageSalt() {
  return (
    <div className="w-full h-full bg-[#EBECE7] text-[#242923] overflow-hidden flex flex-col relative font-['Inter',sans-serif] antialiased box-border">
      {/* Subtle Grid overlay for structural editorial feel */}
      <div className="absolute inset-0 pointer-events-none grid grid-cols-12 gap-4 px-10 h-full w-full opacity-[0.08]">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={`v-${i}`} className="h-full border-l border-[#242923]" />
        ))}
      </div>
      <div className="absolute inset-0 pointer-events-none grid grid-rows-6 gap-4 py-10 h-full w-full opacity-[0.08]">
         {Array.from({ length: 6 }).map((_, i) => (
          <div key={`h-${i}`} className="w-full border-t border-[#242923]" />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-between p-10 z-10 h-full">
        {/* Header */}
        <header className="grid grid-cols-12 gap-4 items-start w-full text-[12px] font-mono tracking-[0.05em] uppercase border-b border-[#242923] pb-6">
          <div className="col-span-3">
            <div className="font-['Space_Grotesk'] text-[20px] font-bold tracking-widest leading-none mb-1">SAGESALT</div>
            <div className="opacity-60">CLINICAL DEODORANT</div>
          </div>
          <div className="col-span-6 flex justify-between px-16 opacity-80 pt-1">
            <a href="#" className="hover:underline underline-offset-4 decoration-1">FORMULA</a>
            <a href="#" className="hover:underline underline-offset-4 decoration-1">EFFICACY</a>
            <a href="#" className="hover:underline underline-offset-4 decoration-1">IMPACT</a>
          </div>
          <div className="col-span-3 text-right pt-1">
            <div className="font-bold">BATCH Nº 042</div>
            <div className="opacity-60">CALIFORNIA, USA</div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col justify-center relative w-full -mt-8">
          <h1 className="text-[170px] leading-[0.82] font-['Space_Grotesk'] font-medium tracking-[-0.05em] uppercase w-full flex flex-col justify-center items-center">
            <span className="block text-left w-full pl-[5%]">RADICAL</span>
            <span className="block text-center w-full">TRANSPARENCY</span>
            <span className="block text-right w-full pr-[5%]">IN SKINCARE</span>
          </h1>
          
          <div className="absolute left-[5%] top-[10%] w-[120px] h-[120px] rounded-full border border-[#242923] flex items-center justify-center text-center font-mono text-[9px] uppercase tracking-widest leading-tight opacity-70 animate-[spin_30s_linear_infinite]">
            <div className="absolute inset-0 rounded-full border border-dashed border-[#242923] scale-110"></div>
            Pure<br/>Clinical<br/>Actives
          </div>
        </main>

        {/* Footer / Info Grid */}
        <footer className="grid grid-cols-12 gap-4 items-end w-full border-t border-[#242923] pt-6 font-mono text-[11px] uppercase tracking-widest">
          <div className="col-span-3 text-justify opacity-80 leading-relaxed pr-8 border-r border-[#242923]/20">
            Formulated with clinical-grade minerals to neutralize bacteria without disrupting the microbiome. 100% transparent ingredients.
          </div>
          <div className="col-span-3 opacity-80 leading-relaxed pl-4 border-r border-[#242923]/20">
            01_ MAGNESIUM HYDROXIDE<br/>
            02_ ZINC RICINOLEATE<br/>
            03_ KAOLIN CLAY<br/>
            04_ SAGE OIL
          </div>
          <div className="col-span-3 flex justify-center items-center px-4">
            <a href="#" className="h-14 bg-[#242923] text-[#EBECE7] rounded-none flex items-center justify-center font-['Space_Grotesk'] font-bold text-[14px] tracking-widest hover:bg-black transition-colors w-full border border-[#242923] hover:text-white group">
              SHOP FORMULA 01
              <svg className="ml-3 group-hover:translate-x-1 transition-transform" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
          <div className="col-span-3 text-right opacity-60 leading-relaxed pl-4 border-l border-[#242923]/20">
            © 2025 SAGESALT INC.<br/>
            ALUMINUM FREE<br/>
            ALL RIGHTS RESERVED
          </div>
        </footer>
      </div>
    </div>
  );
}
