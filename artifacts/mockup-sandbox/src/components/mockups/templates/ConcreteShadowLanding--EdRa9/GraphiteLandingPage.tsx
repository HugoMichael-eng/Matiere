import './fonts.css';
import asset0 from "./assets/lp-43-hero.png";

import React from "react";

export default function GraphiteLandingPage() {
  return (
    <div
      style={{ width: "100%", height: "100%" }}
      className="bg-[#080808] text-[#e0e0e0] font-['Inter'] flex flex-col overflow-hidden relative select-none"
    >
      {/* Structural SVG Noise for concrete texture */}
      <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen z-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <filter id="noise-lp43">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="3"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise-lp43)" />
        </svg>
      </div>

      {/* Grid Overlay for architectural feel */}
      <div className="absolute inset-0 pointer-events-none z-0 flex">
        <div className="w-[380px] h-full border-r border-[#222]" />
        <div className="flex-1 h-full" />
      </div>

      <div className="absolute inset-0 pointer-events-none z-0 flex flex-col">
        <div className="h-[80px] w-full border-b border-[#222]" />
        <div className="flex-1 w-full" />
        <div className="h-[60px] w-full border-t border-[#222]" />
      </div>

      {/* Header */}
      <header className="h-[80px] flex items-center px-10 justify-between shrink-0 relative z-10">
        <div className="font-['Space_Mono'] text-sm tracking-[0.4em] uppercase text-white font-bold">
          Graphite<span className="text-[#555]">.</span>
        </div>
        <nav className="flex gap-16 font-['Space_Mono'] text-[10px] tracking-[0.2em] uppercase text-[#777]">
          <a href="#" className="hover:text-white transition-colors duration-300">Architecture</a>
          <a href="#" className="hover:text-white transition-colors duration-300">Exhibitions</a>
          <a href="#" className="hover:text-white transition-colors duration-300">Journal</a>
          <a href="#" className="hover:text-white transition-colors duration-300">Studio</a>
        </nav>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex relative z-10 h-[760px]">
        {/* Left Column - Typography & Info */}
        <div className="w-[380px] flex flex-col justify-between p-10 h-full">
          <div className="space-y-12">
            <div className="inline-block px-3 py-1.5 border border-[#333] text-[9px] font-['Space_Mono'] tracking-[0.3em] uppercase text-[#666] bg-[#111]">
              Vol. 04 — Structural Mass
            </div>
            
            <h1 className="text-7xl leading-[0.85] tracking-tighter uppercase font-light">
              <span className="block text-white">Concrete</span>
              <span className="block text-[#888]">Shadow</span>
              <span className="block text-[#444]">Form</span>
            </h1>

            <p className="font-['Space_Mono'] text-[11px] tracking-[0.15em] leading-loose text-[#777] uppercase max-w-[280px]">
              We engineer spaces that command presence. A brutalist approach to modern spatial design, stripped of the unnecessary, leaving only the essential truth of the material.
            </p>
          </div>

          <div className="space-y-6">
            <button className="h-12 px-8 bg-white text-black font-['Space_Mono'] text-[10px] tracking-[0.2em] uppercase hover:bg-[#ccc] transition-colors flex items-center gap-4">
              Explore Collection
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <div className="h-[1px] w-16 bg-[#333]"></div>
            <div className="font-['Space_Mono'] space-y-3">
              <div className="flex justify-between text-[9px] tracking-[0.2em] text-[#555] uppercase">
                <span>Material</span>
                <span className="text-[#999]">Cast-in-place</span>
              </div>
              <div className="flex justify-between text-[9px] tracking-[0.2em] text-[#555] uppercase">
                <span>Location</span>
                <span className="text-[#999]">40.7128° N, 74.0060° W</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Image Gallery Focus */}
        <div className="flex-1 p-10 pl-16 h-full flex flex-col justify-center">
          <div className="w-full h-full relative group">
            {/* Image Container with precise framing */}
            <div className="absolute inset-0 bg-[#111] overflow-hidden border border-[#333]">
              <img 
                src={asset0} 
                alt="Brutalist Architecture" 
                className="w-full h-full object-cover object-center grayscale contrast-125 brightness-90 transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out" 
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-1000" />
            </div>
            
            {/* Image Meta Data */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end mix-blend-difference pointer-events-none">
              <div className="font-['Space_Mono'] text-[10px] tracking-[0.3em] uppercase text-white/80">
                Fig. 01<br/>
                <span className="text-[8px] text-white/50 tracking-[0.2em]">The Monolith</span>
              </div>
              <div className="font-['Space_Mono'] text-[10px] tracking-[0.3em] uppercase text-white/80 text-right">
                2024<br/>
                <span className="text-[8px] text-white/50 tracking-[0.2em]">Arch. Series</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-[60px] flex items-center px-10 justify-between shrink-0 relative z-10 font-['Space_Mono'] text-[9px] tracking-[0.3em] uppercase text-[#666]">
        <div>© 2024 Graphite Architecture Studio.</div>
        <div className="flex items-center gap-4">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          System Online
        </div>
        <div>All rights reserved.</div>
      </footer>
    </div>
  );
}
