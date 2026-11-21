/* Sayfa geçişi: eski televizyon / piksel çözülmesi.
   Bölüm bağlantılarına tıklayınca ekran piksel bloklarla kararır, sayfa o sırada
   hedefe atlar, sonra bloklar çözülerek yeni bölüm görünür. */
(() => {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const CELL = 28; // bir blok = 28 CSS pikseli
  const cv = document.createElement('canvas');
  cv.id = 'warp';
  cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');

  // 8x8 Bayer eşik matrisi (özyinelemeli)
  function bayer(n) {
    if (n === 1) return [[0]];
    const p = bayer(n / 2);
    const s = n / 2;
    const m = Array.from({ length: n }, () => new Array(n));
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const v = p[y][x] * 4;
        m[y][x] = v;
        m[y][x + s] = v + 2;
        m[y + s][x] = v + 3;
        m[y + s][x + s] = v + 1;
      }
    }
    return m;
  }
  const B8 = bayer(8).map((r) => r.map((v) => (v + 0.5) / 64));
  const hash = (x, y) => {
    let h = (x * 374761393 + y * 668265263) >>> 0;
    h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  let cols = 0;
  let rows = 0;
  let thr = null;
  let tone = null;
  function build() {
    cols = Math.ceil(window.innerWidth / CELL);
    rows = Math.ceil(window.innerHeight / CELL);
    cv.width = cols;
    cv.height = rows;
    thr = new Float32Array(cols * rows);
    tone = new Uint8Array(cols * rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        // blok bloğa titreşen eşik: Bayer + rastgelelik
        thr[i] = B8[y & 7][x & 7] * 0.72 + hash(x, y) * 0.28;
        const r = hash(x + 91, y + 17);
        tone[i] = r < 0.07 ? 2 : r < 0.24 ? 1 : 0;
      }
    }
  }

  const COL = ['#0b0907', '#ed670f', '#f6f5f1'];
  function draw(k) {
    ctx.clearRect(0, 0, cols, rows);
    for (let t = 0; t < 3; t++) {
      ctx.fillStyle = COL[t];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          if (tone[i] === t && k > thr[i]) ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  let busy = false;
  function run(from, to, ms) {
    return new Promise((res) => {
      const t0 = performance.now();
      let lastStep = -1;
      const step = (now) => {
        const u = Math.min(1, (now - t0) / ms);
        const q = Math.floor(u * 9); // 9 basamak: titrek TV hissi
        if (q !== lastStep) {
          lastStep = q;
          draw(from + (to - from) * (q / 9) * 1.001);
        }
        if (u < 1) requestAnimationFrame(step);
        else { draw(to); res(); }
      };
      requestAnimationFrame(step);
    });
  }

  async function go(target, hash) {
    busy = true;
    build();
    cv.classList.add('on');
    await run(-0.02, 1.02, 380);
    const y = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: 'instant' });
    if (hash && history.pushState) history.pushState(null, '', hash);
    await new Promise((r) => setTimeout(r, 90));
    await run(1.02, -0.02, 440);
    cv.classList.remove('on');
    busy = false;
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    if (!hash || hash === '#') return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    const dist = Math.abs(target.getBoundingClientRect().top);
    e.preventDefault();
    if (busy) return;
    if (dist < 40) return;
    go(target, hash);
  });

  window.addEventListener('resize', () => { if (!busy) cv.classList.remove('on'); });
})();
