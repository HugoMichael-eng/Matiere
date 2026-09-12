import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Circle, Sparkles, Copy, Check, ArrowRight, ArrowUpRight, Moon, Sun,
  PawPrint, Stethoscope, HeartPulse, CalendarDays, ChevronRight, Eye,
  Type, Palette, Component, Layers, BookOpen, X, Plus, Minus, Bell,
  Search, Syringe, Bone, Cat, Dog, Bird, Leaf
} from 'lucide-react';

const TOKENS = {
  colors: [
    { name: 'sumi.900', hex: '#2B2926', usage: 'Primary ink — headlines, body copy', role: 'ink' },
    { name: 'sumi.600', hex: '#5C564E', usage: 'Secondary text, captions', role: 'ink' },
    { name: 'washi.50', hex: '#F6F2EB', usage: 'Page ground, light surfaces', role: 'surface' },
    { name: 'washi.100', hex: '#EDE7DC', usage: 'Cards, raised panels', role: 'surface' },
    { name: 'clay.500', hex: '#B07D5B', usage: 'Primary action, warmth accent', role: 'accent' },
    { name: 'moss.500', hex: '#7A8471', usage: 'Wellness, success states', role: 'accent' },
    { name: 'mist.400', hex: '#A8ABA3', usage: 'Borders, dividers, disabled', role: 'neutral' },
    { name: 'ember.500', hex: '#A4543B', usage: 'Urgent care, critical alerts', role: 'semantic' },
  ],
  type: [
    { name: 'display.totem', spec: 'Fraunces · 14vw / 0.82 / -0.04em', sample: 'Anima', px: 'clamp(96px, 14vw, 220px)' },
    { name: 'heading.shrine', spec: 'Fraunces · 40px / 1.05 / -0.02em', sample: 'Every visit, a small transformation.', px: '40px' },
    { name: 'heading.lantern', spec: 'Fraunces · 24px / 1.2', sample: 'Wellness exam, reimagined', px: '24px' },
    { name: 'body.tatami', spec: 'Inter · 15px / 1.6', sample: 'Calm rooms, soft light, and a record that follows your companion through every season of their life.', px: '15px' },
    { name: 'label.stone', spec: 'Inter · 11px / 1.3 / 0.12em caps', sample: 'INTAKE · ROOM 03 · DR. HOSHI', px: '11px' },
  ],
  spacing: [4, 8, 12, 16, 24, 32, 48, 64, 96],
};

const NAV = [
  { id: 'foundations', label: 'Foundations', icon: Layers, items: ['Color rituals', 'Typography', 'Spacing & rhythm'] },
  { id: 'components', label: 'Components', icon: Component, items: ['Buttons', 'Appointment card', 'Patient chip', 'Inputs', 'Alerts'] },
  { id: 'patterns', label: 'Patterns', icon: BookOpen, items: ['Intake flow', 'Vitals panel', 'Follow-up rite'] },
];

const ONBOARDING = [
  { step: 1, title: 'The threshold', body: 'Begin with foundations — color and type are the clinic\'s breath. Hover any swatch to copy its token.', anchor: 'foundations' },
  { step: 2, title: 'The instruments', body: 'Components are the hands of the system. Every button, chip, and card carries the same quiet weight.', anchor: 'components' },
  { step: 3, title: 'The ceremony', body: 'Patterns compose components into rituals: intake, vitals, follow-up. Use them whole; do not improvise.', anchor: 'patterns' },
];

function useCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const move = (e) => { pos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', move);
    let raf;
    const loop = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.16;
      ring.current.y += (pos.current.y - ring.current.y) * 0.16;
      if (dotRef.current) dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%,-50%)`;
      if (ringRef.current) ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%,-50%) scale(${hovering ? 2.2 : 1})`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf); };
  }, [hovering]);

  return { dotRef, ringRef, setHovering };
}

export default function App() {
  const { dotRef, ringRef, setHovering } = useCursor();
  const [section, setSection] = useState('foundations');
  const [copied, setCopied] = useState(null);
  const [obStep, setObStep] = useState(0);
  const [obOpen, setObOpen] = useState(true);
  const [btnVariant, setBtnVariant] = useState('primary');
  const [counter, setCounter] = useState(2);
  const [chipActive, setChipActive] = useState('Mochi');

  const copy = (token) => {
    setCopied(token);
    setTimeout(() => setCopied(null), 1400);
  };

  const hov = {
    onMouseEnter: () => setHovering(true),
    onMouseLeave: () => setHovering(false),
  };

  const goSection = (id) => {
    setSection(id);
    document.getElementById('panel-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="anima-root min-h-screen bg-[#F6F2EB] text-[#2B2926] antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        .anima-root, .anima-root * { cursor: none !important; }
        .cursor-dot { position: fixed; top:0; left:0; width:6px; height:6px; border-radius:50%; background:#2B2926; pointer-events:none; z-index:9999; }
        .cursor-ring { position: fixed; top:0; left:0; width:34px; height:34px; border-radius:50%; border:1px solid rgba(43,41,38,.45); pointer-events:none; z-index:9998; transition: width .25s, height .25s; }
        .grain::after { content:''; position:fixed; inset:0; pointer-events:none; opacity:.35; z-index:1;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.04'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: #F6F2EB; }
        ::-webkit-scrollbar-thumb { background: #C9C2B4; border-radius: 8px; border: 3px solid #F6F2EB; }
        .display-totem { font-family: 'Fraunces', serif; font-size: clamp(110px, 15vw, 260px); line-height: 0.8; letter-spacing: -0.045em; font-weight: 400; }
        .enso { animation: ensoSpin 40s linear infinite; }
        @keyframes ensoSpin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes breathe { 0%,100% { opacity: .5; transform: scale(1);} 50% { opacity: 1; transform: scale(1.08);} }
        .breathe { animation: breathe 4s ease-in-out infinite; }
      `}} />

      <div ref={ringRef} className="cursor-ring hidden md:block" />
      <div ref={dotRef} className="cursor-dot hidden md:block" />
      <div className="grain" />

      {/* ───────── Top bar ───────── */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 border-b border-[#DCD5C7]">
        <div className="flex items-center gap-3" {...hov}>
          <div className="w-8 h-8 rounded-full border border-[#2B2926] flex items-center justify-center">
            <PawPrint size={14} strokeWidth={1.5} />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-medium tracking-wide" style={{ fontFamily: "'Fraunces', serif" }}>Anima Veterinary</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#8B8478]">Design System · v3.2</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(n => (
            <button key={n.id} {...hov} onClick={() => goSection(n.id)}
              className={`px-4 py-2 rounded-full text-[12px] tracking-wide transition-colors ${section === n.id ? 'bg-[#2B2926] text-[#F6F2EB]' : 'text-[#5C564E] hover:bg-[#EDE7DC]'}`}>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <button {...hov} onClick={() => { setObOpen(true); setObStep(0); }}
            className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#5C564E] hover:text-[#2B2926] transition-colors">
            <Sparkles size={13} strokeWidth={1.5} /> Begin the rite
          </button>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="relative z-10 px-6 md:px-10 pt-12 md:pt-16 pb-10 border-b border-[#DCD5C7] overflow-hidden">
        <div className="flex items-end justify-between flex-wrap gap-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#8B8478]">The Magician archetype</span>
              <span className="w-10 h-px bg-[#C9C2B4]" />
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#B07D5B]">Transform · Heal · Reveal</span>
            </div>
            <h1 className="display-totem">
              Anima<span className="text-[#B07D5B]">.</span>
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-[1.65] text-[#5C564E]">
              The interface language of Anima Veterinary. Quiet surfaces, warm earth, and
              one rule above all — every screen should feel like a room an anxious animal
              could rest in.
            </p>
          </div>
          <div className="relative w-[260px] h-[260px] hidden lg:block shrink-0">
            <svg viewBox="0 0 200 200" className="enso w-full h-full opacity-70">
              <circle cx="100" cy="100" r="86" fill="none" stroke="#2B2926" strokeWidth="1.4" strokeDasharray="480 60" strokeLinecap="round" />
              <circle cx="100" cy="100" r="62" fill="none" stroke="#B07D5B" strokeWidth="0.8" strokeDasharray="300 90" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <PawPrint size={22} strokeWidth={1.2} className="breathe text-[#7A8471]" />
              <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[#8B8478]">87 components<br />12 patterns · 41 tokens</div>
            </div>
          </div>
        </div>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-px bg-[#DCD5C7] border border-[#DCD5C7]">
          {[
            { k: 'Adoption', v: 'WCAG 2.2 AA', d: 'Contrast & motion safety' },
            { k: 'Coverage', v: '94%', d: 'Product surfaces on system' },
            { k: 'Cadence', v: 'New moon', d: 'Release every 28 days' },
            { k: 'Stewards', v: '6 keepers', d: 'Design 3 · Engineering 3' },
          ].map(s => (
            <div key={s.k} className="bg-[#F6F2EB] px-5 py-4" {...hov}>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#8B8478]">{s.k}</div>
              <div className="mt-1 text-[22px]" style={{ fontFamily: "'Fraunces', serif" }}>{s.v}</div>
              <div className="text-[11px] text-[#8B8478]">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Body: sidebar + panel ───────── */}
      <div id="panel-top" className="relative z-10 grid grid-cols-12 min-h-[70vh]">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2 border-r border-[#DCD5C7] px-6 py-8">
          {NAV.map(group => (
            <div key={group.id} className="mb-8">
              <button {...hov} onClick={() => goSection(group.id)}
                className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] mb-3 transition-colors ${section === group.id ? 'text-[#B07D5B]' : 'text-[#8B8478] hover:text-[#2B2926]'}`}>
                <group.icon size={13} strokeWidth={1.5} /> {group.label}
              </button>
              <ul className="space-y-1.5 border-l border-[#DCD5C7] pl-4">
                {group.items.map(it => (
                  <li key={it}>
                    <button {...hov} onClick={() => goSection(group.id)}
                      className="text-[13px] text-[#5C564E] hover:text-[#2B2926] hover:translate-x-0.5 transition-all block">
                      {it}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mt-12 p-4 bg-[#EDE7DC] rounded-sm">
            <Leaf size={14} strokeWidth={1.5} className="text-[#7A8471]" />
            <p className="mt-2 text-[12px] leading-relaxed text-[#5C564E]">
              "Restraint is the most generous thing a screen can offer a frightened patient."
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[#8B8478]">— System principle 01</p>
          </div>
        </aside>

        {/* Panel */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10 px-6 md:px-10 py-10">
          <AnimatePresence mode="wait">

            {/* ── FOUNDATIONS ── */}
            {section === 'foundations' && (
              <motion.div key="foundations" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <SectionHead kicker="Foundations / 01" title="Color rituals" desc="Eight tokens. No more. Each carries a role and a temperature — warm earth for action, moss for wellbeing, ember reserved for genuine urgency." />

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#DCD5C7] border border-[#DCD5C7] mb-16">
                  {TOKENS.colors.map(c => (
                    <button key={c.name} {...hov} onClick={() => copy(c.name)}
                      className="group bg-[#F6F2EB] text-left p-5 hover:bg-[#EDE7DC] transition-colors">
                      <div className="h-20 rounded-sm mb-4 relative overflow-hidden" style={{ background: c.hex }}>
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {copied === c.name ? <Check size={14} className="text-white" /> : <Copy size={14} className="text-white/80" />}
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[13px] font-medium" style={{ fontFamily: "'Fraunces', serif" }}>{c.name}</span>
                        <span className="text-[11px] text-[#8B8478] font-mono">{c.hex}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-[#8B8478]">{c.usage}</p>
                      <span className="mt-3 inline-block text-[9px] uppercase tracking-[0.18em] px-2 py-0.5 border border-[#DCD5C7] rounded-full text-[#5C564E]">{c.role}</span>
                    </button>
                  ))}
                </div>

                <SectionHead kicker="Foundations / 02" title="Typography" desc="Fraunces speaks for the brand — measured, slightly old-soul. Inter does the clinical work: charts, dosages, schedules." />
                <div className="border border-[#DCD5C7] divide-y divide-[#DCD5C7] mb-16">
                  {TOKENS.type.map(t => (
                    <div key={t.name} className="grid grid-cols-12 gap-4 p-6 hover:bg-[#EDE7DC]/60 transition-colors" {...hov}>
                      <div className="col-span-12 md:col-span-3">
                        <div className="text-[12px] font-medium" style={{ fontFamily: "'Fraunces', serif" }}>{t.name}</div>
                        <div className="text-[11px] text-[#8B8478] mt-1">{t.spec}</div>
                      </div>
                      <div className="col-span-12 md:col-span-9 overflow-hidden">
                        <div style={{
                          fontFamily: t.name.startsWith('display') || t.name.startsWith('heading') ? "'Fraunces', serif" : "'Inter', sans-serif",
                          fontSize: t.px,
                          lineHeight: t.name.startsWith('display') ? 0.82 : 1.3,
                          letterSpacing: t.name.startsWith('display') ? '-0.04em' : t.name.startsWith('label') ? '0.12em' : '0',
                          textTransform: t.name.startsWith('label') ? 'uppercase' : 'none',
                          color: '#2B2926',
                        }}>
                          {t.sample}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <SectionHead kicker="Foundations / 03" title="Spacing & rhythm" desc="A tatami scale — proportions borrowed from the mat. Vertical rhythm uses 8 as its base breath." />
                <div className="flex items-end gap-3 border border-[#DCD5C7] p-8 flex-wrap">
                  {TOKENS.spacing.map(s => (
                    <div key={s} className="flex flex-col items-center gap-2" {...hov}>
                      <div className="bg-[#B07D5B]/80 rounded-sm transition-all hover:bg-[#B07D5B]" style={{ width: s, height: s }} />
                      <span className="text-[10px] text-[#8B8478] font-mono">{s}</span>
                    </div>
                  ))}
                  <div className="ml-auto max-w-[220px] text-[12px] leading-relaxed text-[#8B8478]">
                    Use <span className="text-[#2B2926] font-medium">space.24</span> between unrelated groups,
                    <span className="text-[#2B2926] font-medium"> space.8</span> within a single thought.
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── COMPONENTS ── */}
            {section === 'components' && (
              <motion.div key="components" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <SectionHead kicker="Components / 01" title="Buttons" desc="Three weights of intention. The primary is reserved — one per view, like a single object on a shelf." />

                <div className="grid grid-cols-12 gap-px bg-[#DCD5C7] border border-[#DCD5C7] mb-16">
                  <div className="col-span-12 lg:col-span-8 bg-[#F6F2EB] p-10 flex flex-wrap items-center gap-5 min-h-[220px]">
                    {btnVariant === 'primary' && (
                      <>
                        <button {...hov} className="px-6 py-3 bg-[#2B2926] text-[#F6F2EB] text-[13px] tracking-wide rounded-full flex items-center gap-2 hover:bg-[#B07D5B] transition-colors duration-300">
                          Book wellness exam <ArrowRight size={14} strokeWidth={1.5} />
                        </button>
                        <button {...hov} className="px-6 py-3 bg-[#2B2926]/40 text-[#F6F2EB] text-[13px] tracking-wide rounded-full flex items-center gap-2" disabled>
                          Book wellness exam
                        </button>
                      </>
                    )}
                    {btnVariant === 'secondary' && (
                      <>
                        <button {...hov} className="px-6 py-3 border border-[#2B2926] text-[13px] tracking-wide rounded-full hover:bg-[#2B2926] hover:text-[#F6F2EB] transition-colors duration-300">
                          View vaccination history
                        </button>
                        <button {...hov} className="px-6 py-3 border border-[#B07D5B] text-[#B07D5B] text-[13px] tracking-wide rounded-full hover:bg-[#B07D5B] hover:text-[#F6F2EB] transition-colors duration-300">
                          Request records
                        </button>
                      </>
                    )}
                    {btnVariant === 'quiet' && (
                      <>
                        <button {...hov} className="text-[13px] tracking-wide flex items-center gap-1.5 text-[#5C564E] hover:text-[#2B2926] transition-colors group">
                          Reschedule <ArrowUpRight size={14} strokeWidth={1.5} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                        <button {...hov} className="text-[13px] tracking-wide flex items-center gap-1.5 text-[#A4543B] hover:underline underline-offset-4">
                          Mark as urgent
                        </button>
                      </>
                    )}
                  </div>
                  <div className="col-span-12 lg:col-span-4 bg-[#EDE7DC] p-6">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#8B8478] mb-4">Variant</div>
                    {['primary', 'secondary', 'quiet'].map(v => (
                      <button key={v} {...hov} onClick={() => setBtnVariant(v)}
                        className={`w-full text-left px-4 py-2.5 mb-1.5 rounded-sm text-[13px] capitalize transition-colors ${btnVariant === v ? 'bg-[#2B2926] text-[#F6F2EB]' : 'text-[#5C564E] hover:bg-[#F6F2EB]'}`}>
                        {v}
                      </button>
                    ))}
                    <div className="mt-5 text-[11px] leading-relaxed text-[#8B8478]">
                      Border radius: <span className="font-mono text-[#2B2926]">999px</span> on actions only.
                      Cards stay near-square (<span className="font-mono text-[#2B2926]">2px</span>).
                    </div>
                  </div>
                </div>

                <SectionHead kicker="Components / 02" title="Appointment card & patient chips" desc="The most-touched component in the clinic. Density is welcome; clutter is not." />
                <div className="grid grid-cols-12 gap-8 mb-16">
                  <div className="col-span-12 lg:col-span-7">
                    <div className="border border-[#DCD5C7] bg-[#FBF8F2] p-6 hover:shadow-[0_8px_40px_-12px_rgba(43,41,38,0.18)] transition-shadow" {...hov}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#EDE7DC] flex items-center justify-center">
                            <Cat size={20} strokeWidth={1.4} className="text-[#7A8471]" />
                          </div>
                          <div>
                            <div className="text-[18px]" style={{ fontFamily: "'Fraunces', serif" }}>Mochi · Domestic Shorthair</div>
                            <div className="text-[11px] uppercase tracking-[0.14em] text-[#8B8478] mt-0.5">Senior wellness · Dr. Hoshi · Room 03</div>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.16em] px-2.5 py-1 bg-[#7A8471]/15 text-[#5d6656] rounded-full">Checked in</span>
                      </div>
                      <div className="mt-5 grid grid-cols-3 gap-px bg-[#DCD5C7] border border-[#DCD5C7]">
                        {[
                          { icon: HeartPulse, l: 'Heart rate', v: '168 bpm' },
                          { icon: Stethoscope, l: 'Weight', v: '4.6 kg ↓0.2' },
                          { icon: Syringe, l: 'FVRCP due', v: 'Mar 12' },
                        ].map(m => (
                          <div key={m.l} className="bg-[#FBF8F2] px-4 py-3">
                            <m.icon size={13} strokeWidth={1.5} className="text-[#B07D5B]" />
                            <div className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-[#8B8478]">{m.l}</div>
                            <div className="text-[14px] font-medium">{m.v}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[12px] text-[#8B8478]">
                          <CalendarDays size={13} strokeWidth={1.5} /> Today, 14:30 — 15:00
                        </div>
                        <button {...hov} className="text-[12px] flex items-center gap-1 text-[#B07D5B] hover:gap-2 transition-all">
                          Open chart <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-5">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#8B8478] mb-3">Patient chip — selectable</div>
                    <div className="flex flex-wrap gap-2 mb-8">
                      {[{ n: 'Mochi', i: Cat }, { n: 'Banjo', i: Dog }, { n: 'Pico', i: Bird }, { n: 'Umi', i: Cat }].map(p => (
                        <button key={p.n} {...hov} onClick={() => setChipActive(p.n)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] border transition-all ${chipActive === p.n ? 'bg-[#2B2926] text-[#F6F2EB] border-[#2B2926]' : 'border-[#C9C2B4] text-[#5C564E] hover:border-[#2B2926]'}`}>
                          <p.i size={14} strokeWidth={1.5} /> {p.n}
                        </button>
                      ))}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#8B8478] mb-3">Stepper — medication count</div>
                    <div className="inline-flex items-center border border-[#C9C2B4] rounded-full overflow-hidden">
                      <button {...hov} onClick={() => setCounter(Math.max(0, counter - 1))} className="px-4 py-2.5 hover:bg-[#EDE7DC] transition-colors"><Minus size={14} /></button>
                      <span className="px-5 text-[14px] font-medium tabular-nums" style={{ fontFamily: "'Fraunces', serif" }}>{counter} doses</span>
                      <button {...hov} onClick={() => setCounter(counter + 1)} className="px-4 py-2.5 hover:bg-[#EDE7DC] transition-colors"><Plus size={14} /></button>
                    </div>
                    <div className="mt-8">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[#8B8478] mb-3">Alert — ember, used sparingly</div>
                      <div className="border-l-2 border-[#A4543B] bg-[#A4543B]/8 px-4 py-3 flex items-start gap-3" style={{ background: 'rgba(164,84,59,0.07)' }}>
                        <Bell size={14} strokeWidth={1.5} className="text-[#A4543B] mt-0.5" />
                        <div>
                          <div className="text-[13px] font-medium text-[#A4543B]">Anesthesia consent missing</div>
                          <div className="text-[12px] text-[#5C564E] mt-0.5">Banjo's dental procedure cannot proceed. Request signature from owner.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <SectionHead kicker="Components / 03" title="Inputs" desc="Underline fields keep the chart calm. The label never disappears — memory should not be a requirement." />
                <div className="grid md:grid-cols-2 gap-10 border border-[#DCD5C7] p-8">
                  <div {...hov}>
                    <label className="text-[10px] uppercase tracking-[0.18em] text-[#8B8478]">Companion name</label>
                    <input defaultValue="Mochi" className="mt-2 w-full bg-transparent border-b border-[#C9C2B4] focus:border-[#B07D5B] outline-none py-2 text-[16px] transition-colors" style={{ fontFamily: "'Fraunces', serif" }} />
                  </div>
                  <div {...hov}>
                    <label className="text-[10px] uppercase tracking-[0.18em] text-[#8B8478]">Search the formulary</label>
                    <div className="mt-2 flex items-center gap-3 border-b border-[#C9C2B4] focus-within:border-[#B07D5B] transition-colors">
                      <Search size={15} strokeWidth={1.5} className="text-[#8B8478]" />
                      <input placeholder="Gabapentin 50mg…" className="w-full bg-transparent outline-none py-2 text-[14px] placeholder:text-[#A8ABA3]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── PATTERNS ── */}
            {section === 'patterns' && (
              <motion.div key="patterns" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <SectionHead kicker="Patterns / 01" title="The intake rite" desc="Three movements: arrival, observation, plan. Each screen in the flow uses exactly one primary action and ends with a moment of confirmation — the small transformation." />
                <div className="grid md:grid-cols-3 gap-px bg-[#DCD5C7] border border-[#DCD5C7] mb-16">
                  {[
                    { n: '一', t: 'Arrival', d: 'Patient chip selected, weight captured, anxiety score logged before anything else.', icon: PawPrint },
                    { n: '二', t: 'Observation', d: 'Vitals panel left, clinical notes right. Nothing modal; nothing interrupts the exam.', icon: Eye },
                    { n: '三', t: 'Plan', d: 'Treatment plan composed from formulary chips, then sealed with a single primary action.', icon: Sparkles },
                  ].map(s => (
                    <div key={s.t} className="bg-[#F6F2EB] p-8 hover:bg-[#EDE7DC]/70 transition-colors group" {...hov}>
                      <div className="text-[40px] leading-none text-[#C9C2B4] group-hover:text-[#B07D5B] transition-colors" style={{ fontFamily: "'Fraunces', serif" }}>{s.n}</div>
                      <s.icon size={18} strokeWidth={1.4} className="mt-6 text-[#7A8471]" />
                      <div className="mt-3 text-[20px]" style={{ fontFamily: "'Fraunces', serif" }}>{s.t}</div>
                      <p className="mt-2 text-[13px] leading-relaxed text-[#5C564E]">{s.d}</p>
                    </div>
                  ))}
                </div>

                <SectionHead kicker="Patterns / 02" title="Vitals panel" desc="High density, low noise. Numbers in tabular figures, trend arrows in moss or ember only." />
                <div className="border border-[#DCD5C7] bg-[#FBF8F2] divide-y divide-[#DCD5C7]">
                  {[
                    { p: 'Mochi', sp: 'Feline · 11y', hr: '168', temp: '38.4°C', wt: '4.6 kg', trend: 'stable', dr: 'Hoshi' },
                    { p: 'Banjo', sp: 'Canine · 4y', hr: '92', temp: '39.1°C', wt: '27.2 kg', trend: 'watch', dr: 'Lindqvist' },
                    { p: 'Umi', sp: 'Feline · 2y', hr: '154', temp: '38.2°C', wt: '3.9 kg', trend: 'stable', dr: 'Hoshi' },
                    { p: 'Pico', sp: 'Avian · 6y', hr: '310', temp: '40.6°C', wt: '0.41 kg', trend: 'improving', dr: 'Aoki' },
                  ].map(r => (
                    <div key={r.p} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-[#EDE7DC]/60 transition-colors text-[13px]" {...hov}>
                      <div className="col-span-3">
                        <span className="font-medium" style={{ fontFamily: "'Fraunces', serif", fontSize: '15px' }}>{r.p}</span>
                        <span className="ml-2 text-[11px] text-[#8B8478]">{r.sp}</span>
                      </div>
                      <div className="col-span-2 tabular-nums">{r.hr} <span className="text-[#8B8478] text-[11px]">bpm</span></div>
                      <div className="col-span-2 tabular-nums">{r.temp}</div>
                      <div className="col-span-2 tabular-nums">{r.wt}</div>
                      <div className="col-span-2">
                        <span className={`text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full ${r.trend === 'watch' ? 'bg-[#A4543B]/12 text-[#A4543B]' : 'bg-[#7A8471]/15 text-[#5d6656]'}`}>{r.trend}</span>
                      </div>
                      <div className="col-span-1 text-right text-[11px] text-[#8B8478]">Dr. {r.dr}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ───────── Footer ───────── */}
      <footer className="relative z-10 border-t border-[#DCD5C7] px-6 md:px-10 py-8 flex flex-wrap items-center justify-between gap-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[#8B8478]">Anima Design System · Kept by the Studio of Quiet Rooms</div>
        <div className="flex items-center gap-6 text-[12px] text-[#5C564E]">
          <span {...hov} className="hover:text-[#2B2926] transition-colors">Figma library</span>
          <span {...hov} className="hover:text-[#2B2926] transition-colors">Token JSON</span>
          <span {...hov} className="hover:text-[#2B2926] transition-colors">Changelog 3.2</span>
        </div>
      </footer>

      {/* ───────── Onboarding rite ───────── */}
      <AnimatePresence>
        {obOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 right-6 z-50 w-[340px] bg-[#2B2926] text-[#F6F2EB] p-6 shadow-[0_24px_80px_-20px_rgba(43,41,38,0.6)]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#B89F8A]">
                <Sparkles size={12} /> Initiation · {ONBOARDING[obStep].step} of 3
              </div>
              <button {...hov} onClick={() => setObOpen(false)} className="text-[#8B8478] hover:text-[#F6F2EB] transition-colors"><X size={15} /></button>
            </div>
            <h3 className="mt-4 text-[24px] leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>{ONBOARDING[obStep].title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#C9C2B4]">{ONBOARDING[obStep].body}</p>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-1.5">
                {ONBOARDING.map((_, i) => (
                  <span key={i} className={`h-1 rounded-full transition-all duration-500 ${i === obStep ? 'w-8 bg-[#B07D5B]' : 'w-3 bg-[#5C564E]'}`} />
                ))}
              </div>
              <button {...hov}
                onClick={() => {
                  const next = ONBOARDING[obStep];
                  goSection(next.anchor);
                  if (obStep < 2) setObStep(obStep + 1);
                  else setObOpen(false);
                }}
                className="flex items-center gap-2 text-[12px] tracking-wide px-4 py-2 bg-[#F6F2EB] text-[#2B2926] rounded-full hover:bg-[#B07D5B] hover:text-[#F6F2EB] transition-colors duration-300">
                {obStep < 2 ? 'Reveal next' : 'Complete the rite'} <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionHead({ kicker, title, desc }) {
  return (
    <div className="mb-8 max-w-2xl">
      <div className="text-[10px] uppercase tracking-[0.22em] text-[#B07D5B] mb-2">{kicker}</div>
      <h2 className="text-[34px] leading-[1.05]" style={{ fontFamily: "'Fraunces', serif" }}>{title}</h2>
      <p className="mt-3 text-[14px] leading-relaxed text-[#5C564E]">{desc}</p>
    </div>
  );
}