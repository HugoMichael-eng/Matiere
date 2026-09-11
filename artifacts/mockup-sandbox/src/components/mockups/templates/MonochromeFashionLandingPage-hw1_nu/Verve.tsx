import React from 'react';

export default function Verve() {
  return (
    <div className="w-full h-full bg-[#dfddd9] text-[#1a1a1a] overflow-hidden flex flex-col relative font-['Inter',sans-serif] antialiased box-border">
      
      {/* Structural Grid Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 bottom-0 left-[40px] w-[1px] bg-[#1a1a1a]/10"></div>
        <div className="absolute top-0 bottom-0 left-[340px] w-[1px] bg-[#1a1a1a]/10"></div>
        <div className="absolute top-0 bottom-0 left-[640px] w-[1px] bg-[#1a1a1a]/10"></div>
        <div className="absolute top-0 bottom-0 left-[940px] w-[1px] bg-[#1a1a1a]/10"></div>
        <div className="absolute top-0 bottom-0 right-[40px] w-[1px] bg-[#1a1a1a]/10"></div>
        
        <div className="absolute left-0 right-0 top-[40px] h-[1px] bg-[#1a1a1a]/10"></div>
        <div className="absolute left-0 right-0 top-[200px] h-[1px] bg-[#1a1a1a]/10"></div>
        <div className="absolute left-0 right-0 bottom-[40px] h-[1px] bg-[#1a1a1a]/10"></div>
      </div>

      {/* Top Header */}
      <header className="w-full z-20 relative flex text-[12px] font-bold tracking-[0.08em] uppercase px-[40px] pt-[60px] pb-[40px]">
        <div className="w-[300px] pr-8">
          <span className="block mb-3 text-[#1a1a1a]/40 text-[10px]">Brand</span>
          <div className="text-[14px]">Verve&trade;</div>
        </div>
        <div className="w-[300px] pr-8">
          <span className="block mb-3 text-[#1a1a1a]/40 text-[10px]">Index</span>
          <nav className="flex flex-col gap-2">
            <a href="#" className="hover:text-black transition-colors">01. Footwear</a>
            <a href="#" className="hover:text-black transition-colors">02. Apparel</a>
            <a href="#" className="hover:text-black transition-colors">03. Objects</a>
          </nav>
        </div>
        <div className="w-[300px] pr-8">
          <span className="block mb-3 text-[#1a1a1a]/40 text-[10px]">Manifesto</span>
          <p className="max-w-[240px] leading-[1.4] text-justify normal-case font-medium">
            Radical restraint. Engineered for the modern environment. Form follows brutal function. Built to last.
          </p>
        </div>
        <div className="w-[300px] flex flex-col items-end">
          <div className="w-full text-right">
            <span className="block mb-3 text-[#1a1a1a]/40 text-[10px]">Cart</span>
            [ 0 ]
          </div>
        </div>
      </header>

      {/* Display Typography */}
      <div className="flex-1 flex flex-col justify-center px-[40px] z-10 relative">
        <h1 className="text-[250px] leading-[0.8] font-['Bricolage_Grotesque',sans-serif] font-black tracking-[-0.04em] uppercase text-[#1a1a1a] flex flex-col">
          <span className="block -ml-2">VERVE</span>
          <span className="block text-right -mr-2 text-transparent" style={{ WebkitTextStroke: '2px #1a1a1a' }}>
            SYSTEMS
          </span>
        </h1>
      </div>

      {/* Lower Section */}
      <div className="w-full z-20 relative flex items-end px-[40px] pb-[60px]">
        <div className="w-[300px] pr-8 pb-1">
          <div className="w-14 h-14 bg-[#1a1a1a] text-[#dfddd9] flex items-center justify-center rounded-full hover:scale-105 transition-transform cursor-pointer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter"/>
            </svg>
          </div>
        </div>
        
        <div className="w-[600px] pr-8">
          <div className="text-[28px] font-['Bricolage_Grotesque',sans-serif] font-bold leading-[1.05] uppercase tracking-[-0.02em] max-w-[500px]">
            The inaugural drop explores the tension between organic movement and rigid architecture.
          </div>
        </div>

        <div className="w-[300px] flex justify-end">
          <button className="h-[60px] px-10 bg-[#1a1a1a] text-[#dfddd9] text-[12px] font-bold tracking-[0.1em] uppercase hover:bg-black transition-colors flex items-center justify-center">
            Access Store
          </button>
        </div>
      </div>
      
    </div>
  );
}
