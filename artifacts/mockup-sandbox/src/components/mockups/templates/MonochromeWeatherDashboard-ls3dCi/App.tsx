import { useState, useEffect, useMemo } from 'react';
import {
  Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, Wind, Droplets,
  Eye, Gauge, Sunrise, Sunset, ArrowUpRight, ArrowDownRight, Moon,
  Navigation, CircleDot
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';

const CITIES = {
  BERLIN: {
    label: 'BERLIN',
    coords: '52.5200° N, 13.4050° E',
    tz: 'CET +1',
    temp: 7,
    feels: 4,
    condition: 'OVERCAST',
    icon: Cloud,
    high: 9,
    low: 2,
    humidity: 81,
    wind: 18,
    windDir: 'WNW',
    pressure: 1009,
    visibility: 8,
    uv: 1,
    sunrise: '07:42',
    sunset: '16:58',
    aqi: 23,
    hourly: [
      { h: '06', t: 3 }, { h: '08', t: 4 }, { h: '10', t: 6 }, { h: '12', t: 7 },
      { h: '14', t: 8 }, { h: '16', t: 7 }, { h: '18', t: 5 }, { h: '20', t: 4 },
      { h: '22', t: 3 }, { h: '00', t: 2 },
    ],
    week: [
      { d: 'TUE', hi: 9, lo: 2, c: 'Cloud' },
      { d: 'WED', hi: 8, lo: 3, c: 'CloudRain' },
      { d: 'THU', hi: 6, lo: 1, c: 'CloudDrizzle' },
      { d: 'FRI', hi: 5, lo: -1, c: 'CloudSnow' },
      { d: 'SAT', hi: 7, lo: 0, c: 'Cloud' },
      { d: 'SUN', hi: 10, lo: 3, c: 'Sun' },
      { d: 'MON', hi: 11, lo: 4, c: 'Sun' },
    ],
  },
  TOKYO: {
    label: 'TOKYO',
    coords: '35.6762° N, 139.6503° E',
    tz: 'JST +9',
    temp: 14,
    feels: 13,
    condition: 'CLEAR SKY',
    icon: Sun,
    high: 16,
    low: 8,
    humidity: 47,
    wind: 11,
    windDir: 'NE',
    pressure: 1021,
    visibility: 16,
    uv: 4,
    sunrise: '06:31',
    sunset: '16:42',
    aqi: 41,
    hourly: [
      { h: '06', t: 9 }, { h: '08', t: 10 }, { h: '10', t: 13 }, { h: '12', t: 15 },
      { h: '14', t: 16 }, { h: '16', t: 15 }, { h: '18', t: 12 }, { h: '20', t: 11 },
      { h: '22', t: 10 }, { h: '00', t: 9 },
    ],
    week: [
      { d: 'TUE', hi: 16, lo: 8, c: 'Sun' },
      { d: 'WED', hi: 17, lo: 9, c: 'Sun' },
      { d: 'THU', hi: 15, lo: 10, c: 'Cloud' },
      { d: 'FRI', hi: 13, lo: 9, c: 'CloudRain' },
      { d: 'SAT', hi: 14, lo: 8, c: 'Cloud' },
      { d: 'SUN', hi: 16, lo: 9, c: 'Sun' },
      { d: 'MON', hi: 17, lo: 10, c: 'Sun' },
    ],
  },
  'NEW YORK': {
    label: 'NEW YORK',
    coords: '40.7128° N, 74.0060° W',
    tz: 'EST −5',
    temp: 3,
    feels: -2,
    condition: 'LIGHT SNOW',
    icon: CloudSnow,
    high: 4,
    low: -3,
    humidity: 68,
    wind: 26,
    windDir: 'NNW',
    pressure: 1014,
    visibility: 5,
    uv: 1,
    sunrise: '07:08',
    sunset: '16:34',
    aqi: 18,
    hourly: [
      { h: '06', t: -2 }, { h: '08', t: -1 }, { h: '10', t: 1 }, { h: '12', t: 3 },
      { h: '14', t: 4 }, { h: '16', t: 3 }, { h: '18', t: 1 }, { h: '20', t: 0 },
      { h: '22', t: -1 }, { h: '00', t: -2 },
    ],
    week: [
      { d: 'TUE', hi: 4, lo: -3, c: 'CloudSnow' },
      { d: 'WED', hi: 2, lo: -5, c: 'CloudSnow' },
      { d: 'THU', hi: 5, lo: -2, c: 'Cloud' },
      { d: 'FRI', hi: 7, lo: 0, c: 'Sun' },
      { d: 'SAT', hi: 8, lo: 1, c: 'Sun' },
      { d: 'SUN', hi: 6, lo: 0, c: 'CloudDrizzle' },
      { d: 'MON', hi: 5, lo: -1, c: 'Cloud' },
    ],
  },
};

const ICON_MAP = { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle };

function Clock({ inverted }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="tabular-nums tracking-widest">
      {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

const CustomTooltip = ({ active, payload, label, inverted }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`px-3 py-2 text-[11px] font-mono border ${inverted ? 'bg-black border-white text-white' : 'bg-white border-black text-black'}`}>
      <div className="opacity-50">{label}:00</div>
      <div className="text-base font-bold">{payload[0].value}°C</div>
    </div>
  );
};

export default function App() {
  const [city, setCity] = useState('BERLIN');
  const [dark, setDark] = useState(false);
  const data = CITIES[city];
  const Icon = data.icon;

  const ink = dark ? '#F4F2EC' : '#0A0A0A';
  const paper = dark ? '#0A0A0A' : '#F4F2EC';
  const hairline = dark ? 'border-[#F4F2EC]' : 'border-[#0A0A0A]';
  const muted = dark ? 'text-[#F4F2EC]/50' : 'text-[#0A0A0A]/50';

  const dateStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
  }, []);

  // temperature scale for week bars
  const allTemps = data.week.flatMap(w => [w.hi, w.lo]);
  const wkMin = Math.min(...allTemps);
  const wkMax = Math.max(...allTemps);

  return (
    <div
      className="min-h-screen w-full transition-colors duration-500"
      style={{ backgroundColor: paper, color: ink, fontFamily: "'Archivo', sans-serif" }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=IBM+Plex+Mono:wght@300;400;500&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; }
        ::selection { background: ${ink}; color: ${paper}; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        .font-display { font-family: 'Archivo', sans-serif; font-stretch: 125%; }
        .font-condensed { font-family: 'Archivo', sans-serif; font-stretch: 72%; }
        .big-temp { font-size: clamp(140px, 22vw, 320px); line-height: 0.82; letter-spacing: -0.04em; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .marquee-track { animation: marquee 28s linear infinite; }
        .city-btn { transition: all .25s cubic-bezier(.6,0,.2,1); }
        .grain::after {
          content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 60; opacity: .045;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .vert-text { writing-mode: vertical-rl; }
      `}} />

      <div className="grain" />

      {/* ───────── TOP BAR ───────── */}
      <header className={`flex items-stretch border-b ${hairline}`}>
        <div className={`flex items-center gap-3 px-5 py-4 border-r ${hairline}`}>
          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: ink }} />
          <span className="font-display font-black text-lg tracking-tight whitespace-nowrap">STUDIO MONO</span>
        </div>
        <div className={`hidden md:flex items-center px-5 border-r ${hairline} font-mono text-[11px] tracking-widest ${muted}`}>
          ATMOSPHERIC INDEX — INTERNAL TOOL Nº 04
        </div>
        <div className="flex-1" />
        <div className={`hidden sm:flex items-center px-5 border-l ${hairline} font-mono text-[11px]`}>
          <Clock />
        </div>
        <button
          onClick={() => setDark(!dark)}
          className={`flex items-center gap-2 px-5 border-l ${hairline} font-mono text-[11px] tracking-widest hover:opacity-60 transition-opacity`}
        >
          {dark ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
          <span className="hidden sm:inline">{dark ? 'LIGHT' : 'DARK'}</span>
        </button>
      </header>

      {/* ───────── CITY TABS ───────── */}
      <nav className={`grid grid-cols-3 border-b ${hairline}`}>
        {Object.keys(CITIES).map((c, i) => (
          <button
            key={c}
            onClick={() => setCity(c)}
            className={`city-btn relative py-4 px-5 text-left font-display font-bold tracking-tight text-sm sm:text-base
              ${i < 2 ? `border-r ${hairline}` : ''}
              ${city === c ? '' : 'hover:opacity-60'}`}
            style={city === c ? { backgroundColor: ink, color: paper } : {}}
          >
            <span className="font-mono text-[10px] block mb-0.5 opacity-50">0{i + 1}</span>
            {c}
            {city === c && (
              <CircleDot size={12} className="absolute top-4 right-4" strokeWidth={1.5} />
            )}
          </button>
        ))}
      </nav>

      {/* ───────── HERO ───────── */}
      <AnimatePresence mode="wait">
        <motion.section
          key={city}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.6, 0, 0.2, 1] }}
        >
          <div className={`grid grid-cols-1 lg:grid-cols-12 border-b ${hairline}`}>
            {/* Left: vertical label */}
            <div className={`hidden lg:flex lg:col-span-1 border-r ${hairline} items-center justify-center py-10`}>
              <span className={`vert-text font-mono text-[10px] tracking-[0.4em] ${muted}`}>
                CURRENT CONDITIONS · {dateStr} · {data.tz}
              </span>
            </div>

            {/* Temperature */}
            <div className={`lg:col-span-7 border-b lg:border-b-0 lg:border-r ${hairline} px-6 sm:px-10 pt-10 pb-8 relative overflow-hidden`}>
              <div className="flex justify-between items-start font-mono text-[11px] tracking-widest mb-6">
                <span className={muted}>{data.coords}</span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ink }} />
                  LIVE
                </span>
              </div>
              <div className="flex items-end gap-2">
                <h1 className="big-temp font-display font-black tabular-nums">{data.temp}</h1>
                <span className="font-display font-light text-5xl sm:text-7xl mb-2 sm:mb-6">°C</span>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2">
                <span className="font-condensed font-bold text-2xl sm:text-3xl tracking-tight">{data.condition}</span>
                <span className="font-mono text-[11px] tracking-widest flex items-center gap-1.5">
                  <ArrowUpRight size={13} strokeWidth={1.5} /> H {data.high}°
                </span>
                <span className="font-mono text-[11px] tracking-widest flex items-center gap-1.5">
                  <ArrowDownRight size={13} strokeWidth={1.5} /> L {data.low}°
                </span>
                <span className={`font-mono text-[11px] tracking-widest ${muted}`}>FEELS LIKE {data.feels}°</span>
              </div>
            </div>

            {/* Right: icon + sun times */}
            <div className="lg:col-span-4 flex flex-col">
              <div className={`flex-1 flex items-center justify-center border-b ${hairline} py-12`}>
                <Icon size={120} strokeWidth={0.6} />
              </div>
              <div className="grid grid-cols-2">
                <div className={`px-6 py-5 border-r ${hairline}`}>
                  <div className={`font-mono text-[10px] tracking-[0.25em] mb-2 ${muted} flex items-center gap-2`}>
                    <Sunrise size={12} strokeWidth={1.5} /> SUNRISE
                  </div>
                  <div className="font-display font-bold text-2xl tabular-nums">{data.sunrise}</div>
                </div>
                <div className="px-6 py-5">
                  <div className={`font-mono text-[10px] tracking-[0.25em] mb-2 ${muted} flex items-center gap-2`}>
                    <Sunset size={12} strokeWidth={1.5} /> SUNSET
                  </div>
                  <div className="font-display font-bold text-2xl tabular-nums">{data.sunset}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ───────── METRICS STRIP ───────── */}
          <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 border-b ${hairline}`}>
            {[
              { k: 'HUMIDITY', v: `${data.humidity}`, u: '%', I: Droplets },
              { k: 'WIND', v: `${data.wind}`, u: `KM/H ${data.windDir}`, I: Wind },
              { k: 'PRESSURE', v: `${data.pressure}`, u: 'HPA', I: Gauge },
              { k: 'VISIBILITY', v: `${data.visibility}`, u: 'KM', I: Eye },
              { k: 'UV INDEX', v: `${data.uv}`, u: '/ 11', I: Sun },
              { k: 'AIR QUALITY', v: `${data.aqi}`, u: 'AQI', I: Navigation },
            ].map((m, i, arr) => (
              <div
                key={m.k}
                className={`px-5 py-6 group transition-colors duration-300
                  ${i !== arr.length - 1 ? `border-r ${hairline}` : ''}
                  ${i < 4 ? `border-b lg:border-b-0 ${hairline}` : ''}
                  ${i === 1 ? 'md:border-r' : ''}
                  hover:bg-current/0`}
                style={{}}
              >
                <div className={`flex items-center justify-between mb-4 font-mono text-[10px] tracking-[0.25em] ${muted}`}>
                  {m.k}
                  <m.I size={13} strokeWidth={1.25} />
                </div>
                <div className="font-display font-bold text-3xl tabular-nums leading-none">
                  {m.v}<span className={`font-mono text-[10px] tracking-widest ml-1.5 ${muted}`}>{m.u}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ───────── HOURLY + WEEK ───────── */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 border-b ${hairline}`}>
            {/* hourly chart */}
            <div className={`lg:col-span-7 border-b lg:border-b-0 lg:border-r ${hairline}`}>
              <div className={`flex items-center justify-between px-6 py-4 border-b ${hairline}`}>
                <h2 className="font-condensed font-bold tracking-tight text-lg">HOURLY TEMPERATURE</h2>
                <span className={`font-mono text-[10px] tracking-[0.25em] ${muted}`}>NEXT 18H · °C</span>
              </div>
              <div className="px-2 pt-6 pb-2 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.hourly} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                    <defs>
                      <pattern id="diag" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="6" stroke={ink} strokeWidth="1" opacity="0.18" />
                      </pattern>
                    </defs>
                    <XAxis
                      dataKey="h"
                      axisLine={{ stroke: ink, strokeWidth: 1 }}
                      tickLine={false}
                      tick={{ fill: ink, fontSize: 10, fontFamily: 'IBM Plex Mono', opacity: 0.6 }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: ink, fontSize: 10, fontFamily: 'IBM Plex Mono', opacity: 0.6 }}
                      width={36}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <Tooltip content={<CustomTooltip inverted={dark} />} cursor={{ stroke: ink, strokeDasharray: '3 3', opacity: 0.4 }} />
                    <ReferenceLine y={0} stroke={ink} strokeDasharray="2 4" opacity={0.3} />
                    <Area
                      type="stepAfter"
                      dataKey="t"
                      stroke={ink}
                      strokeWidth={1.5}
                      fill="url(#diag)"
                      dot={{ r: 2.5, fill: paper, stroke: ink, strokeWidth: 1.5 }}
                      activeDot={{ r: 4, fill: ink }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 7-day */}
            <div className="lg:col-span-5">
              <div className={`flex items-center justify-between px-6 py-4 border-b ${hairline}`}>
                <h2 className="font-condensed font-bold tracking-tight text-lg">SEVEN DAYS</h2>
                <span className={`font-mono text-[10px] tracking-[0.25em] ${muted}`}>HI / LO</span>
              </div>
              <div>
                {data.week.map((w, i) => {
                  const WIcon = ICON_MAP[w.c];
                  const left = ((w.lo - wkMin) / (wkMax - wkMin)) * 100;
                  const width = ((w.hi - w.lo) / (wkMax - wkMin)) * 100;
                  return (
                    <div
                      key={w.d}
                      className={`grid grid-cols-[44px_28px_1fr_84px] items-center gap-3 px-6 py-[13px] group hover:cursor-default transition-colors duration-200
                        ${i !== data.week.length - 1 ? `border-b ${hairline}` : ''}`}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = ink; e.currentTarget.style.color = paper; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = ''; }}
                    >
                      <span className="font-mono text-[11px] tracking-widest">{w.d}</span>
                      <WIcon size={16} strokeWidth={1.25} />
                      <div className="relative h-[3px] w-full" style={{ backgroundColor: 'currentColor', opacity: 1 }}>
                        <div className="absolute inset-0" style={{ backgroundColor: 'currentColor', opacity: 0.15 }} />
                        <div
                          className="absolute top-0 h-full"
                          style={{ left: `${left}%`, width: `${Math.max(width, 6)}%`, backgroundColor: 'currentColor' }}
                        />
                      </div>
                      <span className="font-mono text-[11px] tabular-nums text-right tracking-wider">
                        {w.hi}° <span className="opacity-40">/ {w.lo}°</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.section>
      </AnimatePresence>

      {/* ───────── MARQUEE ───────── */}
      <div className={`overflow-hidden border-b ${hairline} py-3 select-none`}>
        <div className="marquee-track flex whitespace-nowrap font-mono text-[11px] tracking-[0.3em]">
          {[0, 1].map((n) => (
            <span key={n} className="flex">
              {Object.values(CITIES).map((c) => (
                <span key={c.label + n} className="mx-8 flex items-center gap-3">
                  <span className="font-bold">{c.label}</span>
                  <span className={muted}>{c.temp}°C / {c.condition}</span>
                  <span className="opacity-30">●</span>
                </span>
              ))}
              <span className="mx-8 flex items-center gap-3">
                <span className="font-bold">STUDIO MONO</span>
                <span className={muted}>WEATHER IS A DESIGN MATERIAL</span>
                <span className="opacity-30">●</span>
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ───────── FOOTER ───────── */}
      <footer className="grid grid-cols-2 md:grid-cols-4">
        <div className={`px-6 py-5 border-r ${hairline} font-mono text-[10px] tracking-[0.25em] ${muted}`}>
          © 2025 STUDIO MONO GMBH
        </div>
        <div className={`px-6 py-5 md:border-r ${hairline} font-mono text-[10px] tracking-[0.25em] ${muted}`}>
          DATA — DWD / JMA / NOAA
        </div>
        <div className={`hidden md:block px-6 py-5 border-r ${hairline} font-mono text-[10px] tracking-[0.25em] ${muted}`}>
          REFRESH CYCLE — 60 SEC
        </div>
        <div className="px-6 py-5 font-mono text-[10px] tracking-[0.25em] flex items-center justify-between">
          <span className={muted}>BUILD 1.4.2</span>
          <span className="w-2 h-2" style={{ backgroundColor: ink }} />
        </div>
      </footer>
    </div>
  );
}