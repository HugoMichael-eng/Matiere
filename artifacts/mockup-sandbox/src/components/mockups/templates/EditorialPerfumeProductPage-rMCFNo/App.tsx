import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ArrowRight, ArrowUpRight } from 'lucide-react';

const SIZES = [
  { ml: '50 ml', price: 245 },
  { ml: '100 ml', price: 385 },
  { ml: '150 ml', price: 520 },
];

const GALLERY = [
  'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200&h=1500&fit=crop',
  'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&h=1500&fit=crop',
  'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=1200&h=1500&fit=crop',
];

const ACCORDIONS = [
  {
    title: 'Composition',
    body: 'A 31% parfum concentration, macerated for eleven weeks in oak before bottling. Each batch is limited to four hundred flacons, numbered by hand in our atelier in Grasse. Free of phthalates, parabens, and synthetic colourants.',
  },
  {
    title: 'The Ritual',
    body: 'Warm a single drop between the wrists — never rub. Apply to the pulse of the throat and the nape of the neck, where heat carries the amber accord through the evening. One application endures twelve hours on skin, longer on cloth.',
  },
  {
    title: 'Provenance & Delivery',
    body: 'Dispatched from Paris within 48 hours in a lacquered presentation case with wax seal. Complimentary worldwide courier. Engraving of the flacon is offered without charge — allow three additional days.',
  },
];

const NOTES = [
  { tier: 'Head', desc: 'The first breath', items: ['Bergamote de Calabre', 'Saffron Threads', 'Pink Peppercorn'] },
  { tier: 'Heart', desc: 'The hour after', items: ['Bulgarian Rose Absolute', 'Iris Pallida', 'Smoked Oud'] },
  { tier: 'Base', desc: 'What remains', items: ['Grey Ambergris', 'Vetiver de Haïti', 'Tonka Bean'] },
];

const RELATED = [
  { name: 'Lumière d\u2019Été', type: 'Eau de Parfum', price: 310, img: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=800&h=1000&fit=crop' },
  { name: 'Cuir Velours', type: 'Extrait de Parfum', price: 425, img: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&h=1000&fit=crop' },
  { name: 'Santal Sacré', type: 'Bougie Parfumée', price: 145, img: 'https://images.unsplash.com/photo-1602910344008-22f323cc1817?w=800&h=1000&fit=crop' },
  { name: 'Ombre № II', type: 'Huile Précieuse', price: 190, img: 'https://images.unsplash.com/photo-1610461888750-10bfc601b874?w=800&h=1000&fit=crop' },
];

export default function App() {
  const [size, setSize] = useState(1);
  const [qty, setQty] = useState(1);
  const [openAcc, setOpenAcc] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div className="min-h-screen bg-[#F4F0E9] text-[#1C1812] antialiased selection:bg-[#1C1812] selection:text-[#F4F0E9]">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Italiana&family=Manrope:wght@300;400;500&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        .font-display { font-family: 'Cormorant Garamond', serif; }
        .font-logo { font-family: 'Italiana', serif; }
        .font-sans-l { font-family: 'Manrope', sans-serif; }
        .eyebrow { font-family: 'Manrope', sans-serif; font-size: 10px; letter-spacing: 0.32em; text-transform: uppercase; }
        .hairline { border-color: rgba(28,24,18,0.16); }
        .img-zoom { transition: transform 1.6s cubic-bezier(0.19,1,0.22,1); }
        .group:hover .img-zoom { transform: scale(1.045); }
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: #F4F0E9; }
        ::-webkit-scrollbar-thumb { background: #C8BFAE; border-radius: 0; }
        @keyframes grain {
          0%,100% { transform: translate(0,0) } 30% { transform: translate(-2%,1%) } 60% { transform: translate(1%,-2%) }
        }
        .grain::after {
          content:''; position: fixed; inset: -50%; pointer-events:none; z-index: 60; opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          animation: grain 8s steps(4) infinite;
        }
        .btn-fill { position: relative; overflow: hidden; }
        .btn-fill span { position: relative; z-index: 1; }
        .btn-fill::before { content:''; position:absolute; inset:0; background:#A3815A; transform: translateY(101%); transition: transform .6s cubic-bezier(0.19,1,0.22,1); }
        .btn-fill:hover::before { transform: translateY(0); }
      `}} />

      <div className="grain" />

      {/* announcement */}
      <div className="bg-[#1C1812] text-[#D8CFBE] text-center py-2.5 eyebrow">
        Numbered Edition — Autumn 2024 · Complimentary Engraving Until November 30
      </div>

      {/* nav */}
      <header className="border-b hairline">
        <div className="max-w-[1500px] mx-auto px-6 lg:px-12 h-20 grid grid-cols-3 items-center">
          <nav className="hidden md:flex gap-8 eyebrow">
            <a href="#" className="hover:text-[#A3815A] transition-colors">Fragrances</a>
            <a href="#" className="hover:text-[#A3815A] transition-colors">Maison</a>
            <a href="#" className="hover:text-[#A3815A] transition-colors">Journal</a>
          </nav>
          <div className="font-logo text-[26px] tracking-[0.18em] text-center col-start-2">VERLAINE</div>
          <div className="flex justify-end gap-8 eyebrow">
            <a href="#" className="hover:text-[#A3815A] transition-colors hidden md:block">Account</a>
            <a href="#" className="hover:text-[#A3815A] transition-colors">Cart ({added ? qty : 0})</a>
          </div>
        </div>
      </header>

      {/* product section */}
      <main className="max-w-[1500px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-24 py-10 lg:py-16">

          {/* gallery */}
          <div className="flex gap-5">
            <div className="hidden md:flex flex-col gap-4 w-[72px] shrink-0">
              {GALLERY.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-[4/5] overflow-hidden transition-opacity duration-500 ${activeImg === i ? 'opacity-100 ring-1 ring-[#1C1812]' : 'opacity-50 hover:opacity-80'}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="relative flex-1 overflow-hidden bg-[#E6E0D4]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImg}
                  src={GALLERY[activeImg]}
                  alt="Ombre de Minuit flacon"
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
                  className="w-full h-full object-cover aspect-[4/5] lg:aspect-auto lg:absolute lg:inset-0"
                />
              </AnimatePresence>
              <div className="absolute bottom-5 left-5 eyebrow text-[#F4F0E9] mix-blend-difference">
                Flacon № 217 / 400
              </div>
            </div>
          </div>

          {/* details */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
            className="lg:py-6 lg:max-w-[520px]"
          >
            <p className="eyebrow text-[#A3815A] mb-5">Extrait de Parfum · Édition Numérotée</p>
            <h1 className="font-display font-light text-[56px] lg:text-[72px] leading-[0.95] tracking-[-0.01em]">
              Ombre <em className="italic">de</em> Minuit
            </h1>
            <p className="font-display italic text-[20px] text-[#6B6253] mt-4 leading-snug">
              "The hour when the rose forgets the sun, and remembers smoke."
            </p>

            <div className="flex items-baseline justify-between mt-10 pb-6 border-b hairline">
              <span className="font-display text-[32px] font-light">${SIZES[size].price}</span>
              <span className="eyebrow text-[#6B6253]">Inclusive of duties</span>
            </div>

            {/* size */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <span className="eyebrow">Contenance</span>
                <span className="eyebrow text-[#A3815A] cursor-pointer hover:text-[#1C1812] transition-colors">Size guide</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {SIZES.map((s, i) => (
                  <button
                    key={s.ml}
                    onClick={() => setSize(i)}
                    className={`py-4 border text-center transition-all duration-300 ${
                      size === i
                        ? 'border-[#1C1812] bg-[#1C1812] text-[#F4F0E9]'
                        : 'hairline hover:border-[#1C1812]'
                    }`}
                  >
                    <span className="font-display text-[18px] block leading-none">{s.ml}</span>
                    <span className="eyebrow mt-1.5 block opacity-60">${s.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* qty + cta */}
            <div className="flex gap-3 mt-8">
              <div className="flex items-center border hairline">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-4 hover:text-[#A3815A] transition-colors"><Minus size={14} strokeWidth={1.5} /></button>
                <span className="w-8 text-center font-display text-[18px]">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-4 py-4 hover:text-[#A3815A] transition-colors"><Plus size={14} strokeWidth={1.5} /></button>
              </div>
              <button
                onClick={handleAdd}
                className="btn-fill flex-1 bg-[#1C1812] text-[#F4F0E9] eyebrow tracking-[0.28em] flex items-center justify-center gap-3"
              >
                <span>{added ? 'Added to your cart' : `Add to cart — $${SIZES[size].price * qty}`}</span>
              </button>
            </div>
            <p className="eyebrow text-center text-[#6B6253] mt-4">Hand-sealed in Grasse · Dispatched within 48 hours</p>

            {/* accordions */}
            <div className="mt-10 border-t hairline">
              {ACCORDIONS.map((a, i) => (
                <div key={a.title} className="border-b hairline">
                  <button
                    onClick={() => setOpenAcc(openAcc === i ? -1 : i)}
                    className="w-full flex items-center justify-between py-5 group"
                  >
                    <span className="font-display text-[20px] font-light group-hover:italic transition-all">{a.title}</span>
                    <motion.span animate={{ rotate: openAcc === i ? 45 : 0 }} transition={{ duration: 0.4 }}>
                      <Plus size={16} strokeWidth={1} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {openAcc === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="font-sans-l text-[13px] font-light leading-[1.9] text-[#4A4336] pb-6 pr-8">{a.body}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* olfactory pyramid */}
      <section className="bg-[#1C1812] text-[#E8E1D3] mt-8">
        <div className="max-w-[1500px] mx-auto px-6 lg:px-12 py-20 lg:py-28">
          <div className="flex items-end justify-between mb-16">
            <div>
              <p className="eyebrow text-[#A3815A] mb-4">The Architecture of Scent</p>
              <h2 className="font-display font-light text-[40px] lg:text-[56px] leading-[1.02]">
                Nine materials,<br />three movements
              </h2>
            </div>
            <p className="hidden lg:block font-sans-l text-[13px] font-light leading-[1.9] text-[#9A9180] max-w-[340px]">
              Composed by master perfumer Hélène Marchetti over twenty-six months. Each accord is weighed by hand to a tolerance of one tenth of a gram.
            </p>
          </div>

          <div className="grid md:grid-cols-3">
            {NOTES.map((n, i) => (
              <div key={n.tier} className={`py-10 md:py-2 md:px-10 ${i > 0 ? 'border-t md:border-t-0 md:border-l border-[#3A3328]' : 'md:pl-0'}`}>
                <div className="flex items-baseline gap-4 mb-8">
                  <span className="font-display italic text-[18px] text-[#A3815A]">0{i + 1}</span>
                  <div>
                    <h3 className="font-display text-[28px] font-light">{n.tier}</h3>
                    <p className="eyebrow text-[#9A9180] mt-1">{n.desc}</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  {n.items.map((item) => (
                    <li key={item} className="font-sans-l text-[13px] font-light tracking-[0.06em] text-[#CFC6B4] flex items-center gap-3">
                      <span className="w-5 h-px bg-[#A3815A]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* editorial band */}
      <section className="grid lg:grid-cols-2">
        <div className="relative overflow-hidden group min-h-[480px]">
          <img
            src="https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=1400&h=1200&fit=crop"
            alt="Atelier"
            className="img-zoom absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="bg-[#E9E3D6] flex items-center">
          <div className="px-8 lg:px-20 py-20 lg:py-32 max-w-[640px]">
            <p className="eyebrow text-[#A3815A] mb-6">From the Maison</p>
            <p className="font-display font-light text-[30px] lg:text-[40px] leading-[1.25]">
              Founded in 1924, Verlaine still distills its rose absolute on the original copper alembics — three hundred kilograms of petals, gathered before dawn, for a single litre of essence.
            </p>
            <a href="#" className="inline-flex items-center gap-3 mt-10 eyebrow border-b border-[#1C1812] pb-2 hover:gap-5 hover:text-[#A3815A] hover:border-[#A3815A] transition-all duration-300">
              Discover our heritage <ArrowRight size={14} strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </section>

      {/* related */}
      <section className="max-w-[1500px] mx-auto px-6 lg:px-12 py-20 lg:py-28">
        <div className="flex items-end justify-between mb-12">
          <h2 className="font-display font-light text-[36px] lg:text-[48px] leading-none">Complete the ritual</h2>
          <a href="#" className="eyebrow flex items-center gap-2 hover:text-[#A3815A] transition-colors">
            View all <ArrowUpRight size={14} strokeWidth={1.5} />
          </a>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {RELATED.map((p) => (
            <a key={p.name} href="#" className="group block">
              <div className="overflow-hidden bg-[#E6E0D4] aspect-[4/5] mb-5">
                <img src={p.img} alt={p.name} className="img-zoom w-full h-full object-cover" />
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="font-display text-[22px] font-light leading-tight group-hover:italic transition-all">{p.name}</h3>
                  <p className="eyebrow text-[#6B6253] mt-1.5">{p.type}</p>
                </div>
                <span className="font-display text-[18px] font-light">${p.price}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* footer */}
      <footer className="border-t hairline">
        <div className="max-w-[1500px] mx-auto px-6 lg:px-12 py-16 grid md:grid-cols-3 gap-10 items-center">
          <div className="font-logo text-[22px] tracking-[0.18em]">VERLAINE</div>
          <div className="flex justify-center gap-8 eyebrow text-[#6B6253]">
            <a href="#" className="hover:text-[#1C1812] transition-colors">Boutiques</a>
            <a href="#" className="hover:text-[#1C1812] transition-colors">Care</a>
            <a href="#" className="hover:text-[#1C1812] transition-colors">Press</a>
            <a href="#" className="hover:text-[#1C1812] transition-colors">Legal</a>
          </div>
          <p className="eyebrow text-right text-[#6B6253]">Paris · Grasse · Kyoto — Est. 1924</p>
        </div>
      </footer>
    </div>
  );
}