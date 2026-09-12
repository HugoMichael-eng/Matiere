import './fonts.css';
import React from 'react';

export default function Goldgrove() {
  return (
    <div className="w-full h-full bg-[#e6e3da] text-[#212519] overflow-hidden flex flex-col relative font-['Inter',sans-serif] antialiased box-border">
      
      {/* Background Grid Lines for Editorial Vibe */}
      <div className="absolute inset-0 pointer-events-none flex z-0">
        <div className="w-[200px] h-full border-r border-[#212519]/10 shrink-0" />
        <div className="flex-1 h-full border-r border-[#212519]/10" />
        <div className="w-[380px] h-full shrink-0" />
      </div>

      <div className="absolute inset-0 pointer-events-none flex flex-col z-0">
        <div className="h-[80px] w-full border-b border-[#212519]/10 shrink-0" />
        <div className="flex-1 w-full" />
        <div className="h-[80px] w-full border-t border-[#212519]/10 shrink-0" />
      </div>

      {/* Top Nav */}
      <header className="h-[80px] flex items-center px-12 z-20 shrink-0 text-[13px] font-medium tracking-[0.05em] uppercase">
        <div className="w-[152px] font-bold font-['Space_Grotesk'] tracking-[0.1em] text-[16px]">
          GOLDGROVE
        </div>
        <nav className="flex-1 flex gap-12 px-8">
          <a href="#" className="hover:opacity-60 transition-opacity">The Groves</a>
          <a href="#" className="hover:opacity-60 transition-opacity">Process</a>
          <a href="#" className="hover:opacity-60 transition-opacity">Journal</a>
        </nav>
        <div className="w-[332px] flex justify-between items-center pl-8">
          <a href="#" className="hover:opacity-60 transition-opacity">Log In</a>
          <a href="#" className="hover:opacity-60 transition-opacity">Cart (0)</a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex w-full z-10">
        
        {/* Left Col - Meta */}
        <div className="w-[200px] flex flex-col justify-between py-12 px-12 shrink-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.15em] leading-[1.6]">
            No. 04 <br />
            Single Origin <br />
            Harvest '24
          </div>

          <div className="text-[11px] font-bold uppercase tracking-[0.15em] leading-[1.6] opacity-60">
            Acidity: 0.12% <br />
            Polyphenols: 450+
          </div>
        </div>

        {/* Center Col - Typography & Graphic */}
        <div className="flex-1 flex flex-col items-center justify-center relative p-12">
          {/* CSS Graphic - Abstract Olive Shape */}
          <div className="absolute top-[15%] right-[10%] w-[240px] h-[360px] bg-[#313725] rounded-[120px] rotate-[15deg] mix-blend-multiply opacity-90 shadow-2xl z-0 blur-[1px]"></div>

          <div className="z-10 w-full">
            <h1 className="text-[180px] leading-[0.75] font-black tracking-[-0.04em] uppercase font-['Bricolage_Grotesque',sans-serif] text-left">
              FIRST<br/>
              COLD<br/>
              PRESS
            </h1>
          </div>
        </div>

        {/* Right Col - Details & CTA */}
        <div className="w-[380px] flex flex-col justify-between p-12 shrink-0">
          <div className="text-[15px] font-medium leading-[1.6] pr-8 text-justify mt-8">
            Cultivated in the arid, sun-drenched hills of the family estate. Our single-origin extra virgin olive oil is pressed within hours of harvest to preserve its robust, peppery finish and vibrant emerald hue.
          </div>

          <div className="flex flex-col gap-6 mb-16">
            <div className="h-[1px] w-full bg-[#212519]/20" />
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[12px] font-bold tracking-[0.1em] uppercase mb-1">Reserve Batch</div>
                <div className="text-[24px] font-['Space_Grotesk'] font-medium">500 ML</div>
              </div>
              <div className="text-[24px] font-['Space_Grotesk'] font-medium">$48</div>
            </div>
            
            <button className="w-full bg-[#212519] text-[#e6e3da] text-[13px] font-bold tracking-[0.1em] uppercase py-5 mt-4 hover:bg-[#313725] transition-colors cursor-pointer">
              Acquire a Bottle
            </button>
          </div>
        </div>
      </main>

      {/* Footer / Bottom Bar */}
      <footer className="h-[80px] flex items-center px-12 z-20 shrink-0 text-[11px] font-bold tracking-[0.15em] uppercase border-t border-[#212519]/10">
        <div className="w-[152px]">Est. 1984</div>
        <div className="flex-1 flex justify-center opacity-50">
          Earth to Bottle. Purity Guaranteed.
        </div>
        <div className="w-[332px] text-right">
          Family Owned & Operated
        </div>
      </footer>

    </div>
  );
}
