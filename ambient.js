/* Ortam katmanı: sayfa boyunca sabit duran, kaydırmayla farklı hızlarda kayan piksel arka plan.
   Toz bulutları, yanıp sönen yıldızlar, turuncu ışık ve iki katman çam silueti.
   Böylece hiçbir kaydırma noktasında arka plan boş kalmaz. */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = 4; // bir piksel = 4 CSS pikseli

  const cv = document.createElement('canvas');
  cv.id = 'ambient';
  cv.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(cv, document.body.firstChild);
  const ctx = cv.getContext('2d');

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

  let bw = 0;
  let bh = 0;
  let glow = null;
  let far = null;
  let near = null;
  let dust = null;
  let stars = [];

  function mk(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  // Toz: kümeler halinde, çok soluk benekler (döşenebilir doku)
  function buildDust() {
    const N = 160;
    const c = mk(N, N);
    const g = c.getContext('2d');
    const r = rng(11);
    // düşük frekanslı yoğunluk haritası
    const cells = 10;
    const dens = Array.from({ length: cells * cells }, () => r());
    const dAt = (x, y) => {
      const fx = (x / N) * cells;
      const fy = (y / N) * cells;
      const x0 = Math.floor(fx) % cells;
      const y0 = Math.floor(fy) % cells;
      const x1 = (x0 + 1) % cells;
      const y1 = (y0 + 1) % cells;
      const tx = fx - Math.floor(fx);
      const ty = fy - Math.floor(fy);
      const a = dens[y0 * cells + x0] * (1 - tx) + dens[y0 * cells + x1] * tx;
      const b = dens[y1 * cells + x0] * (1 - tx) + dens[y1 * cells + x1] * tx;
      return a * (1 - ty) + b * ty;
    };
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const d = dAt(x, y);
        if (r() < Math.max(0, d - 0.42) * 0.55) {
          const v = r();
          g.fillStyle = v < 0.7 ? 'rgba(159,155,146,0.16)' : v < 0.95 ? 'rgba(246,245,241,0.22)' : 'rgba(237,103,15,0.4)';
          g.fillRect(x, y, 1, 1);
        }
      }
    }
    return c;
  }

  function pine(g, cx, base, h, col) {
    const tiers = Math.max(3, Math.round(h / 7));
    const maxHalf = h * 0.2;
    g.fillStyle = col;
    for (let y = 0; y < h; y++) {
      const tp = (y / h) * tiers;
      const tier = Math.floor(tp);
      const q = tp - tier;
      const half = Math.max(0.6, (0.12 + 0.88 * ((tier + 0.25 + 0.75 * q) / tiers)) * maxHalf);
      g.fillRect(Math.round(cx - half), Math.round(base - h + y), Math.round(half * 2) + 1, 1);
    }
    g.fillRect(Math.round(cx) - 1, Math.round(base) - 3, 2, 3);
  }

  // yatay döşenebilir çam şeridi
  function buildStrip(w, h, count, hMin, hMax, col, rimCol, seed) {
    const c = mk(w, h);
    const g = c.getContext('2d');
    const r = rng(seed);
    for (let i = 0; i < count; i++) {
      const x = r() * w;
      const th = hMin + r() * (hMax - hMin);
      for (const dx of [-w, 0, w]) pine(g, x + dx, h, th, col);
    }
    // turuncu ışığın vurduğu üst kenar: yalnızca bazı piksellerde
    if (rimCol) {
      const img = g.getImageData(0, 0, w, h);
      const d = img.data;
      for (let y = 1; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const up = ((y - 1) * w + x) * 4;
          if (d[i + 3] > 0 && d[up + 3] === 0 && BAYER[(y & 3) * 4 + (x & 3)] < 0.5) {
            d[i] = rimCol[0]; d[i + 1] = rimCol[1]; d[i + 2] = rimCol[2];
          }
        }
      }
      g.putImageData(img, 0, 0);
    }
    return c;
  }

  // altta turuncu ışık: Bayer dithering ile kademeli
  function buildGlow(w, h) {
    const c = mk(w, h);
    const g = c.getContext('2d');
    const img = g.createImageData(w, h);
    const pal = [[0, 0, 0, 0], [58, 24, 8, 255], [110, 47, 8, 255], [178, 77, 10, 255]];
    const gx = w * 0.5;
    const gy = h * 1.05;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const d = Math.hypot((x - gx) / (w * 0.62), (y - gy) / (h * 0.7));
        const v = Math.pow(Math.max(0, 1 - d), 1.6) * 0.62;
        const l = v * 3;
        const b = Math.floor(l);
        const pick = b >= 3 ? 3 : l - b > BAYER[(y & 3) * 4 + (x & 3)] ? b + 1 : b;
        const p = pal[pick];
        const i = (y * w + x) * 4;
        img.data[i] = p[0]; img.data[i + 1] = p[1]; img.data[i + 2] = p[2]; img.data[i + 3] = p[3];
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  function build() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    bw = Math.ceil(W / S);
    bh = Math.ceil(H / S);
    cv.width = bw;
    cv.height = bh;
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    glow = buildGlow(bw, bh);
    const stripW = Math.max(bw * 2, 360);
    far = buildStrip(stripW, Math.round(bh * 0.26), Math.round(stripW / 14), bh * 0.1, bh * 0.22, '#17120e', [110, 47, 8], 5);
    near = buildStrip(stripW, Math.round(bh * 0.17), Math.round(stripW / 22), bh * 0.07, bh * 0.15, '#100c09', [178, 77, 10], 9);
    dust = buildDust();
    const r = rng(33);
    stars = Array.from({ length: Math.max(18, Math.round(bw / 7)) }, () => ({
      x: Math.floor(r() * bw),
      y: r() * bh * 1.6,
      big: r() < 0.22,
      ph: r() * 6.28,
      sp: 0.6 + r() * 1.2,
      depth: 0.05 + r() * 0.1,
    }));
  }

  function draw(t) {
    const sy = window.scrollY || 0;
    const total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const prog = Math.min(1, sy / total);
    ctx.clearRect(0, 0, bw, bh);
    ctx.imageSmoothingEnabled = false;

    // toz: yavaş kayar
    const dOff = (sy * 0.05) / S;
    const dy = -(dOff % 160);
    for (let ox = 0; ox < bw; ox += 160) {
      for (let oy = dy; oy < bh; oy += 160) ctx.drawImage(dust, ox, Math.round(oy));
    }

    // ışık: sayfa sonuna doğru güçlenir
    ctx.globalAlpha = 0.5 + 0.5 * prog * prog;
    ctx.drawImage(glow, 0, 0);
    ctx.globalAlpha = 1;

    // yıldızlar
    for (const s of stars) {
      const y = (((s.y - (sy * s.depth) / S) % (bh * 1.6)) + bh * 1.6) % (bh * 1.6);
      if (y > bh) continue;
      const tw = reduce ? 1 : 0.5 + 0.5 * Math.sin(t / 1000 * s.sp + s.ph);
      if (tw < 0.25) continue;
      ctx.fillStyle = tw > 0.7 ? 'rgba(246,245,241,0.85)' : 'rgba(246,245,241,0.45)';
      const X = s.x;
      const Y = Math.round(y);
      ctx.fillRect(X, Y, 1, 1);
      if (s.big && tw > 0.55) {
        ctx.fillRect(X - 1, Y, 3, 1);
        ctx.fillRect(X, Y - 1, 1, 3);
        if (tw > 0.85) { ctx.fillStyle = 'rgba(237,103,15,0.7)'; ctx.fillRect(X - 2, Y, 1, 1); ctx.fillRect(X + 2, Y, 1, 1); ctx.fillRect(X, Y - 2, 1, 1); ctx.fillRect(X, Y + 2, 1, 1); }
      }
    }

    // iki katman çam: kaydırdıkça yatayda farklı hızlarla kayar
    const fOff = Math.round(((sy * 0.06) / S) % far.width);
    const nOff = Math.round(((sy * 0.14) / S) % near.width);
    for (let x = -fOff; x < bw; x += far.width) ctx.drawImage(far, x, bh - far.height);
    for (let x = -nOff; x < bw; x += near.width) ctx.drawImage(near, x, bh - near.height);
  }

  let last = 0;
  let queued = false;
  function frame(t) {
    queued = false;
    if (document.hidden) return;
    if (t - last < 90) { schedule(); return; } // ~11 kare/sn: piksel hissi, düşük maliyet
    last = t;
    draw(t);
    if (!reduce) schedule();
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(frame);
  }

  build();
  draw(0);
  if (!reduce) schedule();
  let sq = false;
  window.addEventListener('scroll', () => {
    if (sq) return;
    sq = true;
    requestAnimationFrame(() => { sq = false; draw(performance.now()); });
  }, { passive: true });
  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { build(); draw(performance.now()); }, 160);
  });
})();
