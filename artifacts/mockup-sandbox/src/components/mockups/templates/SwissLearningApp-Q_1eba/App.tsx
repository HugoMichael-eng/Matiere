import { Check, Plus, ArrowDownRight, ArrowRight, Lock, Bookmark } from 'lucide-react';

const GRAY = '#9C9C9C';

function Crosshair({ className }) {
  return (
    <span className={`pointer-events-none absolute ${className}`} aria-hidden="true">
      <span className="block relative w-4 h-4">
        <span className="absolute left-1/2 top-0 w-px h-4 bg-black -translate-x-1/2" />
        <span className="absolute top-1/2 left-0 h-px w-4 bg-black -translate-y-1/2" />
      </span>
    </span>
  );
}

function Label({ children, dark }) {
  return (
    <span
      className={`text-[10px] uppercase ${dark ? 'text-white' : 'text-black'}`}
      style={{ letterSpacing: '0.18em', fontWeight: 500 }}
    >
      {children}
    </span>
  );
}

const lessons = [
  { no: '12', title: 'Optical kerning', dur: '14 MIN', state: 'done' },
  { no: '13', title: 'Grid construction', dur: '11 MIN', state: 'done' },
  { no: '14', title: 'The Brockmann system', dur: '18 MIN', state: 'current' },
  { no: '15', title: 'Hierarchy under constraint', dur: '09 MIN', state: 'locked' },
  { no: '16', title: 'Setting the long read', dur: '16 MIN', state: 'locked' },
];

const features = [
  {
    n: '01',
    title: 'The Method',
    body:
      'Every lesson is written, cut, and re-cut by a working practitioner. Nothing ships until it survives three rounds of internal critique.',
  },
  {
    n: '02',
    title: 'The Ledger',
    body:
      'Progress is recorded to the repetition. You will know exactly what you practised, when, and how long it held.',
  },
  {
    n: '03',
    title: 'The Critique',
    body:
      'Submit your work. A senior reviewer returns line-by-line annotations within 48 hours. No rubber stamps.',
  },
  {
    n: '04',
    title: 'The Bench',
    body:
      'Reference sheets, drills, and worked examples — organised the way a workshop is organised. Everything in its place.',
  },
];

const stats = [
  { v: '214', k: 'Lessons, hand-built' },
  { v: '36', k: 'Craft tracks' },
  { v: '11', k: 'Min — median lesson' },
  { v: '48H', k: 'Critique turnaround' },
  { v: '0', k: 'Filler content' },
];

export default function App() {
  return (
    <div className="bg-white text-black antialiased" style={{ fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            * { -webkit-font-smoothing: antialiased; }
            ::selection { background: #000; color: #fff; }
            .hairline { border-color: #000; }
            .num-tab { font-variant-numeric: tabular-nums; }
          `,
        }}
      />

      {/* ───────────────────── TOP BAR ───────────────────── */}
      <header className="border-b border-black">
        <div className="grid grid-cols-12 items-stretch">
          <div className="col-span-3 flex items-center gap-3 px-6 py-4 border-r border-black">
            <span className="block w-3 h-3 bg-black" />
            <Label>Atelier</Label>
          </div>
          <div className="col-span-3 hidden md:flex items-center px-6 py-4 border-r border-black">
            <Label>Study system for serious craft</Label>
          </div>
          <div className="col-span-3 hidden md:flex items-center px-6 py-4 border-r border-black">
            <Label>App Store · Launch edition</Label>
          </div>
          <div className="col-span-9 md:col-span-3 flex items-center justify-end px-6 py-4">
            <Label>Nº 01 — 10 / 2025</Label>
          </div>
        </div>
      </header>

      {/* ───────────────────── HERO ───────────────────── */}
      <section className="relative border-b border-black">
        <div className="grid grid-cols-12">
          <div className="col-span-12 md:col-span-9 px-6 md:px-10 pt-14 md:pt-20 pb-12 md:pb-16 border-b md:border-b-0 md:border-r border-black">
            <h1
              className="uppercase font-bold leading-[0.98]"
              style={{
                letterSpacing: '0.10em',
                fontSize: 'clamp(2.4rem, 7.2vw, 7.5rem)',
                fontWeight: 800,
              }}
            >
              Measure
              <br />
              twice.
              <br />
              <span style={{ color: GRAY }}>Learn once.</span>
            </h1>
          </div>
          <div className="col-span-12 md:col-span-3 flex flex-col">
            <div className="px-6 md:px-8 py-8 border-b border-black flex-1">
              <p className="text-[13px] leading-[1.7]" style={{ color: '#000' }}>
                Atelier is the learning platform for people who refuse to know things halfway.
                Short lessons. Exact drills. Real critique from working practitioners.
              </p>
            </div>
            <div className="px-6 md:px-8 py-8 border-b border-black">
              <Label>Now on iPhone</Label>
              <div className="mt-4 flex items-center gap-2">
                <ArrowDownRight size={16} strokeWidth={1.5} />
                <span className="text-[12px] num-tab" style={{ letterSpacing: '0.06em' }}>
                  Free to begin · 84.2 MB
                </span>
              </div>
            </div>
            <div className="px-6 md:px-8 py-6 flex items-center justify-between">
              <Label>Fig. 01</Label>
              <Plus size={14} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── DEVICE / SCREENSHOT ───────────────────── */}
      <section className="relative bg-black text-white border-b border-black">
        <div className="grid grid-cols-12">
          {/* Left annotations */}
          <div className="hidden md:flex col-span-3 flex-col justify-between border-r px-8 py-10" style={{ borderColor: GRAY }}>
            <div>
              <Label dark>Track 04</Label>
              <p className="mt-3 text-[13px] leading-[1.7]" style={{ color: GRAY }}>
                Typography — twenty-two lessons, sequenced from optical fundamentals to setting the long read.
              </p>
            </div>
            <div className="space-y-5">
              <div className="flex items-baseline justify-between border-t pt-4" style={{ borderColor: GRAY }}>
                <Label dark>Lessons held</Label>
                <span className="num-tab text-[13px]">13 / 22</span>
              </div>
              <div className="flex items-baseline justify-between border-t pt-4" style={{ borderColor: GRAY }}>
                <Label dark>Practice logged</Label>
                <span className="num-tab text-[13px]">06 H 41</span>
              </div>
              <div className="flex items-baseline justify-between border-t pt-4" style={{ borderColor: GRAY }}>
                <Label dark>Critiques returned</Label>
                <span className="num-tab text-[13px]">04</span>
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="relative col-span-12 md:col-span-6 flex items-center justify-center py-14 md:py-20 px-6">
            <Crosshair className="top-6 left-6 text-white invert" />
            <Crosshair className="top-6 right-6" />
            <Crosshair className="bottom-6 left-6" />
            <Crosshair className="bottom-6 right-6" />
            {/* white crosshairs on black bg */}
            <span className="pointer-events-none absolute inset-0" aria-hidden="true">
              {['top-6 left-6', 'top-6 right-6', 'bottom-6 left-6', 'bottom-6 right-6'].map((pos) => (
                <span key={pos} className={`absolute ${pos} block w-4 h-4`}>
                  <span className="absolute left-1/2 top-0 w-px h-4 bg-white -translate-x-1/2" />
                  <span className="absolute top-1/2 left-0 h-px w-4 bg-white -translate-y-1/2" />
                </span>
              ))}
            </span>

            <div
              className="relative w-[340px] bg-white text-black border border-white"
              style={{ borderRadius: '28px', overflow: 'hidden', boxShadow: '0 0 0 6px #000, 0 0 0 7px ' + GRAY }}
            >
              {/* status bar */}
              <div className="flex items-center justify-between px-6 pt-4 pb-2">
                <span className="text-[11px] num-tab font-semibold">09:41</span>
                <span className="flex items-center gap-1">
                  <span className="block w-3 h-[7px] border border-black" />
                  <span className="block w-[18px] h-[9px] border border-black p-[1.5px]">
                    <span className="block h-full w-3/4 bg-black" />
                  </span>
                </span>
              </div>

              {/* app header */}
              <div className="px-6 pt-3 pb-4 border-b border-black flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="block w-2.5 h-2.5 bg-black" />
                  <span className="text-[11px] uppercase font-semibold" style={{ letterSpacing: '0.18em' }}>
                    Atelier
                  </span>
                </span>
                <Bookmark size={15} strokeWidth={1.5} />
              </div>

              {/* track header */}
              <div className="px-6 pt-5 pb-5 border-b border-black">
                <span className="text-[10px] uppercase" style={{ letterSpacing: '0.18em', color: GRAY }}>
                  Track 04 — Typography
                </span>
                <div className="mt-2 flex items-end justify-between">
                  <h2 className="uppercase font-bold leading-none" style={{ letterSpacing: '0.10em', fontSize: '22px' }}>
                    The grid
                  </h2>
                  <span className="num-tab text-[28px] font-bold leading-none">59%</span>
                </div>
                {/* progress: 22 ticks */}
                <div className="mt-4 grid grid-cols-22 gap-[3px]" style={{ gridTemplateColumns: 'repeat(22, 1fr)' }}>
                  {Array.from({ length: 22 }).map((_, i) => (
                    <span key={i} className="h-[14px]" style={{ background: i < 13 ? '#000' : '#fff', border: '1px solid #000' }} />
                  ))}
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-[9px] num-tab" style={{ color: GRAY, letterSpacing: '0.12em' }}>13 HELD</span>
                  <span className="text-[9px] num-tab" style={{ color: GRAY, letterSpacing: '0.12em' }}>09 REMAIN</span>
                </div>
              </div>

              {/* lesson list */}
              <div>
                {lessons.map((l, i) => (
                  <div
                    key={l.no}
                    className={`flex items-center gap-4 px-6 py-[14px] ${i !== lessons.length - 1 ? 'border-b' : ''} ${
                      l.state === 'current' ? 'bg-black text-white' : 'bg-white'
                    }`}
                    style={{ borderColor: l.state === 'current' ? '#000' : '#000' }}
                  >
                    <span className="num-tab text-[11px] w-6" style={{ color: l.state === 'current' ? '#fff' : GRAY }}>
                      {l.no}
                    </span>
                    <span className="flex-1 text-[13px] font-medium" style={{ letterSpacing: '0.01em' }}>
                      {l.title}
                    </span>
                    <span className="num-tab text-[10px]" style={{ letterSpacing: '0.1em', color: l.state === 'current' ? '#fff' : GRAY }}>
                      {l.dur}
                    </span>
                    {l.state === 'done' && <Check size={14} strokeWidth={2} />}
                    {l.state === 'current' && <ArrowRight size={14} strokeWidth={2} />}
                    {l.state === 'locked' && <Lock size={13} strokeWidth={1.5} color={GRAY} />}
                  </div>
                ))}
              </div>

              {/* bottom action */}
              <div className="border-t border-black">
                <button className="w-full bg-black text-white py-4 text-[11px] uppercase font-semibold flex items-center justify-center gap-3" style={{ letterSpacing: '0.2em' }}>
                  Resume lesson 14 <ArrowRight size={14} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>

          {/* Right annotations */}
          <div className="hidden md:flex col-span-3 flex-col justify-between border-l px-8 py-10" style={{ borderColor: GRAY }}>
            <div className="flex items-start justify-between">
              <Label dark>Fig. 02</Label>
              <Label dark>Screen 04 / 11</Label>
            </div>
            <div>
              <p className="text-[13px] leading-[1.7]" style={{ color: GRAY }}>
                The ledger view. Thirteen lessons held, nine remaining, every minute of practice accounted for. Nothing decorative — only what you need to keep working.
              </p>
              <div className="mt-8 border-t pt-4 flex items-center justify-between" style={{ borderColor: GRAY }}>
                <Label dark>iPhone 16 Pro</Label>
                <span className="num-tab text-[11px]" style={{ color: GRAY }}>1320 × 2868</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── FEATURES ───────────────────── */}
      <section className="border-b border-black">
        <div className="px-6 md:px-10 py-6 border-b border-black flex items-center justify-between">
          <h3 className="uppercase font-bold" style={{ letterSpacing: '0.14em', fontSize: '13px' }}>
            Built like a workshop
          </h3>
          <Label>Four principles</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4">
          {features.map((f, i) => (
            <div
              key={f.n}
              className={`group px-6 md:px-8 pt-8 pb-12 ${i < features.length - 1 ? 'border-b md:border-b-0 md:border-r' : ''} border-black hover:bg-black hover:text-white transition-colors duration-150`}
            >
              <span className="num-tab text-[12px]" style={{ color: GRAY }}>
                {f.n}
              </span>
              <h4 className="mt-10 uppercase font-bold" style={{ letterSpacing: '0.14em', fontSize: '14px' }}>
                {f.title}
              </h4>
              <p className="mt-4 text-[13px] leading-[1.7] group-hover:text-white" style={{ color: '#000' }}>
                <span className="group-hover:hidden">{f.body}</span>
                <span className="hidden group-hover:inline">{f.body}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────── SPECIFICATION ROW ───────────────────── */}
      <section className="border-b border-black">
        <div className="grid grid-cols-2 md:grid-cols-5">
          {stats.map((s, i) => (
            <div
              key={s.k}
              className={`px-6 md:px-8 py-10 border-black ${i < stats.length - 1 ? 'md:border-r' : ''} ${i % 2 === 0 ? 'border-r md:border-r' : ''} ${i < stats.length - (stats.length % 2 || 2) ? 'border-b md:border-b-0' : 'md:border-b-0'}`}
            >
              <span className="num-tab font-bold leading-none block" style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4rem)' }}>
                {s.v}
              </span>
              <span className="mt-4 block text-[10px] uppercase" style={{ letterSpacing: '0.18em', color: GRAY }}>
                {s.k}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────── FOOTER / CTA ───────────────────── */}
      <footer className="bg-black text-white">
        <div className="grid grid-cols-12 items-stretch">
          <div className="col-span-12 md:col-span-7 px-6 md:px-10 py-10 md:py-14 border-b md:border-b-0 md:border-r" style={{ borderColor: GRAY }}>
            <h3
              className="uppercase font-bold leading-[1.05]"
              style={{ letterSpacing: '0.10em', fontSize: 'clamp(1.4rem, 3.2vw, 2.6rem)' }}
            >
              Slow is smooth.
              <br />
              <span style={{ color: GRAY }}>Smooth is fast.</span>
            </h3>
          </div>
          <div className="col-span-12 md:col-span-5 flex flex-col">
            <div className="flex-1 px-6 md:px-10 py-8 border-b flex items-center justify-between" style={{ borderColor: GRAY }}>
              <Label dark>Download on the App Store</Label>
              <ArrowRight size={16} strokeWidth={1.5} />
            </div>
            <div className="px-6 md:px-10 py-6 flex items-center justify-between">
              <span className="text-[10px] uppercase num-tab" style={{ letterSpacing: '0.18em', color: GRAY }}>
                Atelier Learning GmbH — Zürich
              </span>
              <span className="text-[10px] num-tab" style={{ letterSpacing: '0.18em', color: GRAY }}>
                14.10.2025
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}