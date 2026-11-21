/* Piksel sanat katmanı: hero manzarası, masaüstü simgeleri, orman, yaprak çerçeve,
   pırıltılar ve imleç izi. Hepsi kodla çiziliyor, görsel dosya yok. */
(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- yardımcılar ---------- */
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
  const px = (h) => {
    const n = parseInt(h.slice(1), 16);
    return (255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | ((n >> 16) & 255);
  };

  function makeBuf(w, h) {
    const data = new Uint32Array(w * h);
    return {
      w, h, data,
      set(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) data[y * w + x] = c; },
      get(x, y) { return data[y * w + x]; },
    };
  }

  function flush(buf, cv) {
    cv.width = buf.w;
    cv.height = buf.h;
    const ctx = cv.getContext('2d');
    ctx.putImageData(new ImageData(new Uint8ClampedArray(buf.data.buffer), buf.w, buf.h), 0, 0);
  }

  // 0..1 değerini sıralı bir paletin tonlarına, Bayer dithering ile dağıtır
  function tone(pal, v, x, y) {
    const n = pal.length - 1;
    const l = Math.max(0, Math.min(1, v)) * n;
    const b = Math.floor(l);
    if (b >= n) return pal[n];
    return l - b > BAYER[(y & 3) * 4 + (x & 3)] ? pal[b + 1] : pal[b];
  }

  /* ---------- çam ağacı ve bulut ---------- */
  // ls: ışığın geldiği taraf (+1 sağdan, -1 soldan), vb: taban parlaklık
  function pine(buf, pal, cx, base, h, ls, vb) {
    const tiers = Math.max(3, Math.round(h / 9));
    const maxHalf = h * 0.2;
    const trunkH = Math.max(2, Math.round(h * 0.06));
    const crownH = h - trunkH;
    const top = base - h;
    for (let y = 0; y < crownH; y++) {
      const tp = (y / crownH) * tiers;
      const tier = Math.floor(tp);
      const q = tp - tier;
      const half = Math.max(0.6, (0.12 + 0.88 * ((tier + 0.25 + 0.75 * q) / tiers)) * maxHalf);
      const yy = Math.round(top + y);
      for (let x = Math.ceil(cx - half); x <= Math.floor(cx + half); x++) {
        const u = (x - cx) / half;
        let v = vb + 0.5 * u * ls;
        if (q > 0.78) v -= 0.3;
        buf.set(x, yy, tone(pal, v, x, yy));
      }
    }
    for (let y = crownH; y < h; y++) {
      const yy = Math.round(top + y);
      buf.set(Math.round(cx), yy, pal[0]);
      buf.set(Math.round(cx) - 1, yy, pal[0]);
    }
  }

  function cloud(buf, pal, cx, cy, w, h, rand) {
    const n = 7;
    const cs = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      cs.push({
        x: cx + (t - 0.5) * w + (rand() - 0.5) * w * 0.1,
        y: cy + (rand() - 0.5) * h * 0.4 - Math.sin(t * Math.PI) * h * 0.25,
        r: h * (0.28 + 0.22 * Math.sin(t * Math.PI) + 0.1 * rand()),
      });
    }
    for (let y = Math.floor(cy - h); y <= cy + h; y++) {
      for (let x = Math.floor(cx - w * 0.7); x <= cx + w * 0.7; x++) {
        let best = 0;
        let hit = null;
        for (const c of cs) {
          const d = Math.hypot(x - c.x, (y - c.y) * 1.15);
          if (d < c.r) {
            const k = 1 - d / c.r;
            if (k > best) { best = k; hit = c; }
          }
        }
        if (hit) buf.set(x, y, tone(pal, 0.62 - 0.55 * ((y - hit.y) / hit.r), x, y));
      }
    }
  }

  /* ---------- hero manzarası ---------- */
  function drawScene(cv) {
    const stage = cv.parentElement;
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    if (!W || !H) return;
    const S = W < 700 ? 3 : 4;
    const bw = Math.ceil(W / S);
    const bh = Math.ceil(H / S);
    const buf = makeBuf(bw, bh);
    const r = rng(7);

    const CLOUD = [px('#3b342d'), px('#8d8a83'), px('#cecdc9'), px('#f6f5f1')];
    [[0.08, 0.6, 0.34, 0.3], [0.93, 0.56, 0.36, 0.32], [0.2, 0.9, 0.4, 0.22], [0.8, 0.92, 0.4, 0.22],
      [0.5, 0.98, 0.5, 0.2], [0.03, 0.28, 0.22, 0.2], [0.98, 0.26, 0.22, 0.2]].forEach(([fx, fy, fw, fh]) => {
      cloud(buf, CLOUD, fx * bw, fy * bh, fw * bw, fh * bh, r);
    });

    const FAR = [px('#0b0907'), px('#1d1814'), px('#2c2621'), px('#463e36')];
    for (let i = 0; i < 28; i++) {
      const x = r() * bw;
      const edge = Math.abs(x / bw - 0.5) * 2;
      const h = Math.max(8, bh * (0.16 + 0.5 * edge) * (0.7 + 0.5 * r()));
      pine(buf, FAR, x, bh + 2, h, x < bw / 2 ? 1 : -1, 0.5);
    }

    const FRONT = [px('#0b0907'), px('#3b342d'), px('#cecdc9'), px('#f6f5f1')];
    for (const side of [0, 1]) {
      for (let i = 0; i < 9; i++) {
        const t = r();
        const x = side ? bw * (1 - 0.01 - 0.27 * t) : bw * (0.01 + 0.27 * t);
        const h = bh * (0.3 + 0.62 * (1 - t)) * (0.8 + 0.3 * r());
        pine(buf, FRONT, x, bh + 2, h, side ? -1 : 1, 0.55);
      }
    }
    for (let x = 0; x < bw; x += 5 + Math.floor(r() * 7)) {
      pine(buf, FAR, x, bh + 2, bh * (0.05 + 0.07 * r()), 1, 0.4);
    }

    // üst kenarda dithering ile erime
    const fade = bh * 0.3;
    for (let y = 0; y < fade; y++) {
      for (let x = 0; x < bw; x++) {
        if (y / fade < BAYER[(y & 3) * 4 + (x & 3)]) buf.data[y * bw + x] = 0;
      }
    }
    flush(buf, cv);
  }

  /* ---------- footer ormanı (turuncu ışık) ---------- */
  function drawForest(cv) {
    const W = cv.parentElement.clientWidth;
    const S = W < 700 ? 3 : 4;
    const bw = Math.ceil(W / S);
    const bh = Math.ceil((cv.clientHeight || 420) / S);
    const buf = makeBuf(bw, bh);
    const r = rng(23);

    // büyük merkez ışığı
    const GLOW = ['#0b0907', '#2a1409', '#6e2f08', '#b24d0a', '#ed670f', '#ffb98a'].map(px);
    const gx = bw * 0.5;
    const gy = bh * 1.02;
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        const d = Math.hypot((x - gx) / (bw * 0.5), (y - gy) / (bh * 1.0));
        buf.set(x, y, tone(GLOW, Math.pow(Math.max(0, 1 - d), 1.05), x, y));
      }
    }
    // kıvılcımlar
    for (let i = 0; i < 110; i++) {
      const x = gx + (r() - 0.5) * bw * 0.6;
      const y = bh * (0.04 + r() * 0.7);
      buf.set(x, y, r() < 0.3 ? px('#ffb98a') : px('#ed670f'));
    }

    // arka çamlar (orta mesafe)
    const BACK = [px('#0b0907'), px('#1d0d05'), px('#6e2f08'), px('#ed670f')];
    for (let i = 0; i < 40; i++) {
      const x = r() * bw;
      const edge = Math.abs(x / bw - 0.5) * 2;
      const h = Math.max(10, bh * (0.34 + 0.36 * edge) * (0.75 + 0.4 * r()));
      pine(buf, BACK, x, bh + 2, h, x < bw / 2 ? 1 : -1, 0.1);
    }

    // ön plan: üstten alta uzanan kalın koyu gövdeler (Overmind'daki gibi ağaç gövdeleri)
    const TRUNK = px('#0b0907');
    const TRUNK_RIM = px('#3a1a08');
    const xs = [0.03, 0.11, 0.21, 0.3, 0.7, 0.79, 0.89, 0.97].map((v) => v * bw + (r() - 0.5) * bw * 0.03);
    xs.forEach((cx, k) => {
      const wTop = 3 + Math.floor(r() * 4) + (k === 0 || k === xs.length - 1 ? 4 : 0);
      for (let y = 0; y < bh; y++) {
        const wob = Math.round(Math.sin(y * 0.09 + k * 2.3) * 1.4);
        const w = wTop + Math.floor(y / bh * 3);
        for (let x = -w; x <= w; x++) {
          buf.set(cx + x + wob, y, x === (cx < gx ? w : -w) && r() < 0.65 ? TRUNK_RIM : TRUNK);
        }
      }
    });
    const NEAR = [px('#0b0907'), px('#0b0907'), px('#3a1a08'), px('#b24d0a')];
    for (let i = 0; i < 34; i++) {
      const x = r() * bw;
      const edge = Math.abs(x / bw - 0.5) * 2;
      if (edge < 0.2 && r() < 0.8) continue;
      const h = Math.max(12, bh * (0.3 + 0.55 * edge) * (0.75 + 0.4 * r()));
      pine(buf, NEAR, x, bh + 2, h, x < bw / 2 ? 1 : -1, 0.08);
    }

    // üstte sayfa zeminine dithering ile erime
    const fade = bh * 0.38;
    for (let y = 0; y < fade; y++) {
      for (let x = 0; x < bw; x++) {
        if (y / fade < BAYER[(y & 3) * 4 + (x & 3)]) buf.data[y * bw + x] = 0;
      }
    }
    // alt kenar: koyu zemin
    for (let x = 0; x < bw; x++) {
      for (let y = bh - 2; y < bh; y++) buf.set(x, y, px('#0b0907'));
    }
    flush(buf, cv);
  }

  /* ---------- sarmaşık bandı (bölüm ayırıcı) ---------- */
  function drawVineBand(cv) {
    const W = cv.parentElement.clientWidth;
    if (!W) return;
    const S = 3;
    const bw = Math.ceil(W / S);
    const bh = Math.ceil(96 / S);
    const buf = makeBuf(bw, bh);
    const r = rng(57);
    const L = [px('#b24d0a'), px('#ed670f'), px('#ffb98a')];
    const mid = bh / 2;
    for (let pass = 0; pass < 3; pass++) {
      const ph = pass * 2.1;
      const amp = bh * 0.2;
      const freq = 0.21 + pass * 0.05;
      for (let x = 0; x < bw; x++) {
        const y = Math.round(mid + Math.sin(x * freq + ph) * amp + Math.sin(x * 0.07 + ph * 3) * amp * 0.6);
        buf.set(x, y, px('#6e2f08'));
        if (x % 4 === pass) {
          const dir = Math.floor(x / 4) % 2 === 0 ? -1 : 1;
          const len = 3 + Math.floor(r() * 4);
          for (let t = 1; t <= len; t++) {
            const wid = t < 2 ? 0 : t < len ? 1 : 0;
            for (let o = -wid; o <= wid; o++) buf.set(x + o, y + dir * t, o === 0 ? L[1] : L[r() < 0.25 ? 2 : 0]);
          }
          if (r() < 0.18) buf.set(x + 1, y + dir * (len + 1), px('#f6f5f1'));
        }
      }
    }
    flush(buf, cv);
  }

  /* ---------- yaprak çerçeve ---------- */
  function drawVine(cv) {
    const W = cv.parentElement.clientWidth;
    const H = cv.parentElement.clientHeight;
    if (!W || !H) return;
    const S = 3;
    const bw = Math.ceil(W / S);
    const bh = Math.ceil(H / S);
    const buf = makeBuf(bw, bh);
    const r = rng(41);
    const m = 9; // kenardan içeri
    const LEAF = [px('#b24d0a'), px('#ed670f'), px('#ffb98a')];

    const pts = [];
    const loop = [[m, m, bw - m, m], [bw - m, m, bw - m, bh - m], [bw - m, bh - m, m, bh - m], [m, bh - m, m, m]];
    loop.forEach(([x0, y0, x1, y1], side) => {
      const len = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      const dx = Math.sign(x1 - x0);
      const dy = Math.sign(y1 - y0);
      // dışa bakan normal
      const nx = side === 1 ? 1 : side === 3 ? -1 : 0;
      const ny = side === 0 ? -1 : side === 2 ? 1 : 0;
      for (let i = 0; i <= len; i++) {
        const w = Math.round(Math.sin(i * 0.28 + side) * 1.6);
        pts.push({ x: x0 + dx * i + nx * w, y: y0 + dy * i + ny * w, nx, ny, i, len });
      }
    });
    pts.forEach((p) => buf.set(p.x, p.y, LEAF[0]));

    pts.forEach((p, k) => {
      if (k % 5 !== 0) return;
      const dir = (k / 5) % 2 === 0 ? 1 : -1; // dışa / içe dönüşümlü
      const len = 3 + Math.floor(r() * 4);
      const sx = p.nx * dir;
      const sy = p.ny * dir;
      for (let t = 1; t <= len; t++) {
        const wid = t < 2 ? 0 : t < len ? 1 : 0;
        for (let o = -wid; o <= wid; o++) {
          const ox = sy !== 0 ? o : 0;
          const oy = sx !== 0 ? o : 0;
          const c = o === 0 ? LEAF[1] : LEAF[r() < 0.2 ? 2 : 0];
          buf.set(p.x + sx * t + ox, p.y + sy * t + oy, c);
        }
      }
      if (r() < 0.22) {
        const bx = p.x + sx * (len + 1);
        const by = p.y + sy * (len + 1);
        buf.set(bx, by, px('#f6f5f1'));
        buf.set(bx + 1, by, px('#f6f5f1'));
      }
    });
    flush(buf, cv);
  }

  /* ---------- masaüstü simgeleri ---------- */
  function iconSvg(name) {
    const N = 12;
    const g = Array.from({ length: N }, () => Array(N).fill(''));
    const P = (x, y, c) => { if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = c; };
    const R = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(x + i, y + j, c); };
    const O = (x, y, w, h, c) => { R(x, y, w, 1, c); R(x, y + h - 1, w, 1, c); R(x, y, 1, h, c); R(x + w - 1, y, 1, h, c); };
    const L = (x0, y0, x1, y1, c) => {
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        P(x0, y0, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    };
    switch (name) {
      case 'cube':
        O(4, 1, 7, 7, 'c'); R(1, 4, 7, 7, 'o'); O(1, 4, 7, 7, 'c');
        L(1, 4, 4, 1, 'c'); L(7, 4, 10, 1, 'c'); L(7, 10, 10, 7, 'c');
        break;
      case 'folder':
        R(0, 1, 5, 2, 'c'); O(0, 3, 12, 8, 'c'); R(1, 4, 10, 6, 'o');
        break;
      case 'chip':
        O(2, 2, 8, 8, 'c'); R(4, 4, 4, 4, 'o');
        [3, 5, 7].forEach((i) => { R(i, 0, 1, 2, 'c'); R(i, 10, 1, 2, 'c'); R(0, i, 2, 1, 'c'); R(10, i, 2, 1, 'c'); });
        break;
      case 'floppy':
        O(0, 0, 12, 12, 'c'); R(3, 0, 6, 4, 'o'); R(2, 7, 8, 5, 'c'); R(3, 8, 6, 1, 'o'); R(3, 10, 4, 1, 'o');
        break;
      case 'scroll':
        O(1, 0, 10, 12, 'c'); R(3, 3, 6, 1, 'o'); R(3, 5, 6, 1, 'c'); R(3, 7, 6, 1, 'c'); R(3, 9, 4, 1, 'c');
        break;
      default: // mail
        O(0, 2, 12, 8, 'c'); L(0, 2, 5, 6, 'o'); L(11, 2, 6, 6, 'o');
    }
    let rects = '';
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (g[y][x]) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${g[y][x] === 'o' ? '#ed670f' : '#f6f5f1'}"/>`;
      }
    }
    return `<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
  }

  function buildIcons() {
    document.querySelectorAll('.desk-icons[data-icons]').forEach((nav) => {
      nav.innerHTML = nav.dataset.icons.split('|').map((spec) => {
        const [icon, label, ...rest] = spec.split(':');
        const href = rest.join(':');
        return `<a class="desk-icon" href="${href}">${iconSvg(icon)}<span>${label}</span></a>`;
      }).join('');
    });
  }

  /* ---------- pırıltılar ---------- */
  function buildSparks() {
    const stage = document.querySelector('.crt-stage');
    if (!stage) return;
    const star = '<svg viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true"><path d="M3 0h1v3h3v1h-3v3h-1v-3h-3v-1h3z" fill="#f6f5f1"/></svg>';
    [[5, 3, 26, 0], [95, 2, 18, 1.1], [20, 1, 14, 0.6], [80, 1, 20, 1.7], [3, 24, 14, 0.9], [97, 26, 12, 1.4]].forEach(([x, y, s, d]) => {
      const el = document.createElement('span');
      el.className = 'spark';
      el.innerHTML = star;
      el.style.cssText = `left:${x}%;top:${y}%;width:${s}px;height:${s}px;animation-delay:${d}s`;
      stage.appendChild(el);
    });
  }

  /* ---------- imleç izi ---------- */
  function initTrail() {
    if (!finePointer || reduce) return;
    const cv = document.createElement('canvas');
    cv.className = 'cursor-trail';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    const dots = [];
    let running = false;
    let lx = -100;
    let ly = -100;
    const size = () => { cv.width = innerWidth; cv.height = innerHeight; };
    size();
    window.addEventListener('resize', size);

    function frame(t) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (let i = dots.length - 1; i >= 0; i--) {
        const d = dots[i];
        const k = (t - d.t) / 520;
        if (k >= 1) { dots.splice(i, 1); continue; }
        const s = Math.max(2, Math.round((1 - k) * d.s / 2) * 2);
        ctx.fillStyle = d.c;
        ctx.globalAlpha = 1 - k;
        ctx.fillRect(Math.round(d.x / 2) * 2 - s / 2, Math.round((d.y + k * 10) / 2) * 2 - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      if (dots.length) requestAnimationFrame(frame);
      else running = false;
    }

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (Math.hypot(e.clientX - lx, e.clientY - ly) < 16) return;
      lx = e.clientX;
      ly = e.clientY;
      dots.push({ x: lx + 6, y: ly + 10, t: performance.now(), s: 8, c: Math.random() < 0.25 ? '#f6f5f1' : '#ed670f' });
      if (!running) { running = true; requestAnimationFrame(frame); }
    }, { passive: true });
  }

  /* ---------- başlat ---------- */
  function paintAll() {
    const scene = document.getElementById('scene');
    const forest = document.getElementById('forest');
    const vine = document.querySelector('.vine');
    if (scene) drawScene(scene);
    if (forest) drawForest(forest);
    if (vine) drawVine(vine);
    document.querySelectorAll('.vine-band canvas').forEach(drawVineBand);
  }

  function init() {
    buildIcons();
    buildSparks();
    paintAll();
    initTrail();
    let timer = 0;
    const again = () => { clearTimeout(timer); timer = setTimeout(paintAll, 160); };
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(again);
      document.querySelectorAll('.crt-stage, .foot, .cta-frame, .vine-band').forEach((el) => ro.observe(el));
    } else {
      window.addEventListener('resize', again);
    }
    window.addEventListener('load', again);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
