import { useEffect, useRef } from 'react';

/**
 * Fluid Dynamics — an interactive Jos Stam "stable fluids" simulation.
 * - Move the mouse over the surface to stir the fluid; velocity and dye
 *   are injected along the pointer's path.
 * - Ambient currents slowly ebb and flow on their own, so the piece is
 *   alive even when idle.
 * - CPU solver on a modest grid, rendered to 2D canvas with soft
 *   ocean-to-ember dye colors. Pauses entirely when offscreen.
 */

const N = 140; // simulation grid size (N x N cells, plus boundary)
const ITER = 14; // Gauss-Seidel iterations for diffusion / pressure
const DT = 1 / 45;
const VISC = 0.000006;
const CURL = 9; // vorticity confinement strength (Pavel-style curling tendrils)
const DIFF = 0.000001;
const DYE_FADE = 0.991;

/** hue (0..1) -> saturated neon RGB (0..1 components) */
function hueRgb(h: number): [number, number, number] {
  const f = (n: number) => {
    const k = (n + h * 6) % 6;
    return 1 - Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [f(5), f(3), f(1)];
}

function makeField() {
  return new Float32Array((N + 2) * (N + 2));
}
const IX = (x: number, y: number) => x + (N + 2) * y;

function setBnd(b: number, f: Float32Array) {
  for (let i = 1; i <= N; i++) {
    f[IX(0, i)] = b === 1 ? -f[IX(1, i)] : f[IX(1, i)];
    f[IX(N + 1, i)] = b === 1 ? -f[IX(N, i)] : f[IX(N, i)];
    f[IX(i, 0)] = b === 2 ? -f[IX(i, 1)] : f[IX(i, 1)];
    f[IX(i, N + 1)] = b === 2 ? -f[IX(i, N)] : f[IX(i, N)];
  }
  f[IX(0, 0)] = 0.5 * (f[IX(1, 0)] + f[IX(0, 1)]);
  f[IX(0, N + 1)] = 0.5 * (f[IX(1, N + 1)] + f[IX(0, N)]);
  f[IX(N + 1, 0)] = 0.5 * (f[IX(N, 0)] + f[IX(N + 1, 1)]);
  f[IX(N + 1, N + 1)] = 0.5 * (f[IX(N, N + 1)] + f[IX(N + 1, N)]);
}

function linSolve(b: number, f: Float32Array, f0: Float32Array, a: number, c: number) {
  const inv = 1 / c;
  for (let k = 0; k < ITER; k++) {
    for (let y = 1; y <= N; y++) {
      for (let x = 1; x <= N; x++) {
        f[IX(x, y)] =
          (f0[IX(x, y)] + a * (f[IX(x - 1, y)] + f[IX(x + 1, y)] + f[IX(x, y - 1)] + f[IX(x, y + 1)])) * inv;
      }
    }
    setBnd(b, f);
  }
}

function diffuse(b: number, f: Float32Array, f0: Float32Array, diff: number) {
  const a = DT * diff * N * N;
  linSolve(b, f, f0, a, 1 + 4 * a);
}

function advect(b: number, d: Float32Array, d0: Float32Array, u: Float32Array, v: Float32Array) {
  const dt0 = DT * N;
  for (let y = 1; y <= N; y++) {
    for (let x = 1; x <= N; x++) {
      let px = x - dt0 * u[IX(x, y)];
      let py = y - dt0 * v[IX(x, y)];
      if (px < 0.5) px = 0.5;
      if (px > N + 0.5) px = N + 0.5;
      if (py < 0.5) py = 0.5;
      if (py > N + 0.5) py = N + 0.5;
      const x0 = px | 0, x1 = x0 + 1;
      const y0 = py | 0, y1 = y0 + 1;
      const s1 = px - x0, s0 = 1 - s1;
      const t1 = py - y0, t0 = 1 - t1;
      d[IX(x, y)] =
        s0 * (t0 * d0[IX(x0, y0)] + t1 * d0[IX(x0, y1)]) +
        s1 * (t0 * d0[IX(x1, y0)] + t1 * d0[IX(x1, y1)]);
    }
  }
  setBnd(b, d);
}

function project(u: Float32Array, v: Float32Array, p: Float32Array, div: Float32Array) {
  const h = 1 / N;
  for (let y = 1; y <= N; y++) {
    for (let x = 1; x <= N; x++) {
      div[IX(x, y)] = -0.5 * h * (u[IX(x + 1, y)] - u[IX(x - 1, y)] + v[IX(x, y + 1)] - v[IX(x, y - 1)]);
      p[IX(x, y)] = 0;
    }
  }
  setBnd(0, div);
  setBnd(0, p);
  linSolve(0, p, div, 1, 4);
  for (let y = 1; y <= N; y++) {
    for (let x = 1; x <= N; x++) {
      u[IX(x, y)] -= 0.5 * (p[IX(x + 1, y)] - p[IX(x - 1, y)]) / h;
      v[IX(x, y)] -= 0.5 * (p[IX(x, y + 1)] - p[IX(x, y - 1)]) / h;
    }
  }
  setBnd(1, u);
  setBnd(2, v);
}

export default function FluidSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // fields
    let u = makeField(), v = makeField();
    let u0 = makeField(), v0 = makeField();
    let dyeR = makeField(), dyeG = makeField(), dyeB = makeField();
    let dyeT = makeField(); // scratch for advection
    const curl = makeField();

    // offscreen buffer at sim resolution, scaled up when drawn
    const buf = document.createElement('canvas');
    buf.width = N;
    buf.height = N;
    const bctx = buf.getContext('2d')!;
    const img = bctx.createImageData(N, N);

    let raf = 0;
    let pageVisible = document.visibilityState === 'visible';
    let inView = true;
    let time = 0;

    // pointer state (sim coordinates)
    let mx = -1, my = -1, pmx = -1, pmy = -1, hasPointer = false;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    const addSource = (f: Float32Array, x: number, y: number, amt: number, radius: number) => {
      const r = Math.ceil(radius);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 1 || xx > N || yy < 1 || yy > N) continue;
          const d2 = dx * dx + dy * dy;
          if (d2 > radius * radius) continue;
          f[IX(xx, yy)] += amt * Math.exp(-d2 / (radius * 0.9));
        }
      }
    };

    // inject colored dye at a hue (0..1)
    const addDye = (x: number, y: number, amt: number, radius: number, hue: number) => {
      const [r, g, b] = hueRgb(hue);
      addSource(dyeR, x, y, amt * (0.15 + r), radius);
      addSource(dyeG, x, y, amt * (0.15 + g), radius);
      addSource(dyeB, x, y, amt * (0.15 + b), radius);
    };

    const step = () => {
      time += DT;

      // ambient ebb-and-flow: two slow, wandering currents
      const a1 = time * 0.14, a2 = time * 0.09 + 2.1;
      const cx1 = (0.5 + 0.33 * Math.sin(a1)) * N;
      const cy1 = (0.5 + 0.33 * Math.cos(a1 * 0.8)) * N;
      const cx2 = (0.5 + 0.36 * Math.cos(a2)) * N;
      const cy2 = (0.5 + 0.3 * Math.sin(a2 * 1.15)) * N;
      const ebb = 0.6 + 0.4 * Math.sin(time * 0.25); // breathing strength
      addSource(u, cx1 | 0, cy1 | 0, Math.cos(a1 * 1.7) * 20 * ebb * DT, 5);
      addSource(v, cx1 | 0, cy1 | 0, Math.sin(a1 * 1.3) * 20 * ebb * DT, 5);
      addSource(u, cx2 | 0, cy2 | 0, Math.sin(a2) * 16 * (1.2 - ebb) * DT, 6);
      addSource(v, cx2 | 0, cy2 | 0, Math.cos(a2 * 0.7) * 16 * (1.2 - ebb) * DT, 6);
      addDye(cx1 | 0, cy1 | 0, 11 * ebb * DT, 3.2, (time * 0.02) % 1);
      addDye(cx2 | 0, cy2 | 0, 9 * (1.2 - ebb) * DT, 3.6, (time * 0.02 + 0.45) % 1);

      // pointer stirring
      if (hasPointer && mx >= 1 && my >= 1) {
        const dx = pmx >= 0 ? mx - pmx : 0;
        const dy = pmy >= 0 ? my - pmy : 0;
        const speed = Math.hypot(dx, dy);
        // gentle, clamped stirring — fast flicks shouldn't blast the fluid
        const cap = 4;
        const scale = speed > cap ? cap / speed : 1;
        addSource(u, mx | 0, my | 0, dx * scale * 0.9, 3.4);
        addSource(v, mx | 0, my | 0, dy * scale * 0.9, 3.4);
        addDye(mx | 0, my | 0, Math.min(1.4, 0.2 + speed * 0.25), 3, (time * 0.045) % 1);
        pmx = mx;
        pmy = my;
      }

      // vorticity confinement: measure curl, then push velocity toward the
      // whirls so small eddies sharpen into curling tendrils instead of
      // smearing out (same trick as PavelDoGreat/WebGL-Fluid-Simulation)
      for (let y = 1; y <= N; y++) {
        for (let x = 1; x <= N; x++) {
          curl[IX(x, y)] =
            0.5 * (v[IX(x + 1, y)] - v[IX(x - 1, y)] - u[IX(x, y + 1)] + u[IX(x, y - 1)]);
        }
      }
      for (let y = 2; y < N; y++) {
        for (let x = 2; x < N; x++) {
          const dx = 0.5 * (Math.abs(curl[IX(x + 1, y)]) - Math.abs(curl[IX(x - 1, y)]));
          const dy = 0.5 * (Math.abs(curl[IX(x, y + 1)]) - Math.abs(curl[IX(x, y - 1)]));
          const len = Math.hypot(dx, dy) + 1e-5;
          const w = curl[IX(x, y)] * CURL * DT;
          u[IX(x, y)] += (dy / len) * w;
          v[IX(x, y)] -= (dx / len) * w;
        }
      }

      // velocity step
      [u0, u] = [u, u0];
      diffuse(1, u, u0, VISC);
      [v0, v] = [v, v0];
      diffuse(2, v, v0, VISC);
      project(u, v, u0, v0);
      [u0, u] = [u, u0];
      [v0, v] = [v, v0];
      advect(1, u, u0, u0, v0);
      advect(2, v, v0, u0, v0);
      project(u, v, u0, v0);

      // dye step — pure advection keeps the colors crisp and neon
      [dyeT, dyeR] = [dyeR, dyeT];
      advect(0, dyeR, dyeT, u, v);
      [dyeT, dyeG] = [dyeG, dyeT];
      advect(0, dyeG, dyeT, u, v);
      [dyeT, dyeB] = [dyeB, dyeT];
      advect(0, dyeB, dyeT, u, v);
      for (let i = 0; i < dyeR.length; i++) {
        dyeR[i] *= DYE_FADE;
        dyeG[i] *= DYE_FADE;
        dyeB[i] *= DYE_FADE;
      }
    };

    const draw = () => {
      const px = img.data;
      for (let y = 1; y <= N; y++) {
        for (let x = 1; x <= N; x++) {
          const i = IX(x, y);
          const dr = dyeR[i], dg = dyeG[i], db = dyeB[i];
          // soft-saturating tone map -> vivid neon without harsh clipping
          let r = 255 * (1 - Math.exp(-dr * 5.5));
          let g = 255 * (1 - Math.exp(-dg * 5.5));
          let b = 255 * (1 - Math.exp(-db * 5.5));
          // bright cores whiten like the reference glow
          const lum = dr + dg + db;
          if (lum > 1.1) {
            const w = Math.min(1, (lum - 1.1) * 0.7) * 120;
            r += w; g += w; b += w;
          }
          const o = ((y - 1) * N + (x - 1)) * 4;
          px[o] = r;
          px[o + 1] = g;
          px[o + 2] = b;
          px[o + 3] = 255;
        }
      }
      bctx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.globalCompositeOperation = 'source-over';
      ctx.filter = 'none';
      ctx.drawImage(buf, 0, 0, N, N, 0, 0, canvas.width, canvas.height);
      // additive blurred pass = neon bloom
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(18px)';
      ctx.globalAlpha = 0.75;
      ctx.drawImage(buf, 0, 0, N, N, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'source-over';
    };

    // Event-driven loop control: RAF fully stops while hidden/offscreen and
    // restarts when the frame becomes visible again.
    let rafActive = false;
    const loop = () => {
      if (!pageVisible || !inView) {
        rafActive = false;
        return;
      }
      raf = requestAnimationFrame(loop);
      step();
      draw();
    };
    const syncLoop = () => {
      const shouldRun = pageVisible && inView;
      if (shouldRun && !rafActive) {
        rafActive = true;
        raf = requestAnimationFrame(loop);
      } else if (!shouldRun && rafActive) {
        rafActive = false;
        cancelAnimationFrame(raf);
      }
    };

    const toSim = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mx = ((e.clientX - rect.left) / rect.width) * N;
      my = ((e.clientY - rect.top) / rect.height) * N;
    };
    const onMove = (e: PointerEvent) => { hasPointer = true; toSim(e); };
    const onEnter = (e: PointerEvent) => { hasPointer = true; toSim(e); pmx = mx; pmy = my; };
    const onLeave = () => { hasPointer = false; pmx = pmy = -1; };

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerenter', onEnter);
    canvas.addEventListener('pointerleave', onLeave);

    const io = new IntersectionObserver((e) => { inView = e[0]?.isIntersecting ?? true; syncLoop(); }, { threshold: 0.05 });
    io.observe(wrap);
    const onVis = () => { pageVisible = document.visibilityState === 'visible'; syncLoop(); };
    document.addEventListener('visibilitychange', onVis);
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // Warm start: seed a few swirls and pre-run the sim so currents are
    // already flowing on first paint.
    const seeds = [
      { x: 0.3, y: 0.35, ux: 26, vy: 9, d: 1.8, hue: 0.62 }, // electric blue
      { x: 0.68, y: 0.28, ux: -14, vy: 22, d: 1.5, hue: 0.9 }, // magenta-pink
      { x: 0.55, y: 0.66, ux: 18, vy: -20, d: 1.7, hue: 0.35 }, // neon green
      { x: 0.25, y: 0.72, ux: -22, vy: -10, d: 1.3, hue: 0.08 }, // hot orange
    ];
    for (const sd of seeds) {
      addSource(u, (sd.x * N) | 0, (sd.y * N) | 0, sd.ux, 5);
      addSource(v, (sd.x * N) | 0, (sd.y * N) | 0, sd.vy, 5);
      addDye((sd.x * N) | 0, (sd.y * N) | 0, sd.d, 4.5, sd.hue);
    }
    for (let i = 0; i < 36; i++) step();

    resize();
    syncLoop();
    return () => {
      rafActive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerenter', onEnter);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={wrapRef} className="fixed inset-0 w-screen h-screen bg-[#070a12] overflow-hidden cursor-crosshair">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
