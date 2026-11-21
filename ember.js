/* Alt bilgi adı: "ERDEM WILKINSON" etiketi ve altındaki ASLAN.
   Soyadı WILKINSON, ASLAN'ın üstüne yapıştırılmış yıpranmış bir kâğıt etiket gibi durur
   (uçları yırtık, yer yer aşınmış, bir köşesi kalkık). Etiketin arkasındaki ASLAN okunur.
   Sayfanın en altına inince ya da tıklayınca etiket sağdan sola doğru sökülür ve ASLAN açılır;
   tekrar tıklarsan yeniden yapışır. Kor, kıvılcım ve Bayer dithering sitenin piksel diliyle aynı. */
(() => {
  'use strict';
  const cv = document.getElementById('wordmark');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SERIF = '"Geist Serif", Georgia, serif';
  const LABEL = '"Geist Pixel", ui-monospace, monospace';
  const PAL = [
    [29, 23, 19],
    [59, 36, 23],
    [122, 47, 8],
    [178, 74, 10],
    [237, 103, 15],
    [255, 164, 59],
    [246, 245, 241],
  ];
  const PAPER = [236, 230, 218];
  const PAPER_D = [212, 203, 187];
  const PAPER_BACK = [250, 246, 238];
  const INK = [22, 10, 2];
  const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

  let P = 5;
  let cols = 0;
  let rows = 0;
  let img = null;
  let maskE = null; // ERDEM
  let maskA = null; // ASLAN
  let yn = null;
  let tape = null; // etiket kâğıdı
  let ink = null; // etiket yazısı
  let tx0 = 0;
  let tx1 = 0;
  let topA = [];
  let sparks = [];
  const mouse = { x: -999, y: -999 };

  let started = false;
  let visible = false;
  let t0 = 0;
  let peel = 0; // 0 yapışık .. 1 tamamen sökülmüş
  let drift = 0; // 0 .. uçuş süresi (söküm bittiği noktadan kesintisiz sola devam eder)
  let target = 0;
  let autoDone = false;
  let lastT = 0;

  // Sınırsız piksel uçuş katmanı: footer içinde position:absolute olduğu için scroll'da kaymaz,
  // üst menünün (.nav z-index:50) altına kalır ve ekranın en soluna kadar uzanır
  const footHost = cv.closest('footer') || cv.parentElement || document.body;
  if (getComputedStyle(footHost).position === 'static') footHost.style.position = 'relative';
  footHost.style.overflowX = 'clip';
  const flyCv = document.createElement('canvas');
  flyCv.style.cssText = 'position:absolute;z-index:5;pointer-events:none;image-rendering:pixelated;display:none;';
  flyCv.setAttribute('aria-hidden', 'true');
  footHost.appendChild(flyCv);
  const flyCtx = flyCv.getContext('2d');
  let flyImg = null;
  let flyCols = 0;
  let flyRows = 0;
  let flyLeftPad = 0;
  const FLY_TOP_PAD = 28;

  function hash(x, y) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function vnoise(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = x - xi;
    const fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  }
  const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

  function build() {
    const cssW = Math.max(280, cv.clientWidth || cv.parentElement.clientWidth || 1000);
    P = cssW < 640 ? 3 : 5;
    cols = Math.floor(cssW / P);

    const m = document.createElement('canvas');
    const mc = m.getContext('2d');
    mc.font = `800 100px ${SERIF}`;
    const wA = mc.measureText('ASLAN').width;
    const fsA = (100 * cols * 0.84) / wA;
    const capA = fsA * 0.72;
    const fsE = fsA * 0.56;
    const capE = fsE * 0.72;
    const pad = 16;
    const gap = Math.max(6, fsA * 0.12);
    rows = Math.ceil(pad + capE + gap + capA + 8);
    m.width = cols;
    m.height = rows;
    const c = m.getContext('2d');
    c.textAlign = 'center';
    c.fillStyle = '#fff';

    const baseE = pad + capE;
    const baseA = baseE + gap + capA;

    const read = (draw) => {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, cols, rows);
      c.save();
      draw();
      c.restore();
      return c.getImageData(0, 0, cols, rows).data;
    };

    const dE = read(() => { c.font = `800 ${fsE}px ${SERIF}`; c.fillText('ERDEM', cols / 2, baseE); });
    const dA = read(() => { c.font = `800 ${fsA}px ${SERIF}`; c.fillText('ASLAN', cols / 2, baseA); });

    // etiket: ASLAN'ın ortasından geçen, hafif eğik kâğıt bant
    const probe = document.createElement('canvas').getContext('2d');
    probe.font = `400 100px ${LABEL}`;
    const wW = probe.measureText('WILKINSON').width;
    const fsT = (100 * cols * 0.62) / wW;
    const capT = fsT * 0.7;
    const th = capT * 1.3;
    const tw = cols * 0.8;
    const tcy = baseA - capA * 0.4;
    const rot = -0.032;
    const dT = read(() => {
      c.translate(cols / 2, tcy);
      c.rotate(rot);
      c.fillRect(-tw / 2, -th / 2, tw, th);
    });
    const dI = read(() => {
      c.translate(cols / 2, tcy);
      c.rotate(rot);
      c.font = `400 ${fsT}px ${LABEL}`;
      c.fillText('WILKINSON', 0, capT * 0.36);
      c.fillText('WILKINSON', 0.6, capT * 0.36); // yazıyı biraz kalınlaştır
    });

    maskE = new Uint8Array(cols * rows);
    maskA = new Uint8Array(cols * rows);
    yn = new Float32Array(cols * rows);
    tape = new Uint8Array(cols * rows);
    ink = new Uint8Array(cols * rows);
    topA = [];
    let minX = cols;
    let maxX = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        if (dE[i * 4 + 3] > 120) { maskE[i] = 1; yn[i] = Math.min(1, Math.max(0, (y - (baseE - capE)) / capE)); }
        if (dA[i * 4 + 3] > 120) {
          maskA[i] = 1;
          yn[i] = Math.min(1, Math.max(0, (y - (baseA - capA)) / capA));
          topA.push(i);
        }
        if (dT[i * 4 + 3] > 120) {
          tape[i] = 1;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
    // yırtık uçlar + yüzülmüş yerler
    for (let y = 0; y < rows; y++) {
      const tearL = 2 + vnoise(y * 0.33, 3.1) * 6 + vnoise(y * 0.9, 7.7) * 2.5;
      const tearR = 2 + vnoise(y * 0.29, 11.3) * 6 + vnoise(y * 0.8, 5.2) * 2.5;
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        if (!tape[i]) continue;
        if (x - minX < tearL || maxX - x < tearR) { tape[i] = 0; continue; }
        const edge = Math.min(x - minX, maxX - x) / (maxX - minX);
        const scuff = vnoise(x * 0.06, y * 0.5 + 9);
        const holes = vnoise(x * 0.22, y * 0.22 + 4);
        if (scuff > 0.8 - (1 - Math.min(1, edge * 6)) * 0.08 || holes > 0.9 || hash(x, y) < 0.004) { tape[i] = 0; continue; }
        if (dI[i * 4 + 3] > 120 && vnoise(x * 0.45, y * 0.45 + 20) < 0.9) ink[i] = 1;
      }
    }
    tx0 = minX;
    tx1 = maxX;

    cv.width = cols;
    cv.height = rows;
    img = ctx.createImageData(cols, rows);
    sparks = [];
  }

  function put(d, i, p) {
    const o = i * 4;
    d[o] = p[0]; d[o + 1] = p[1]; d[o + 2] = p[2]; d[o + 3] = 255;
  }
  function darken(d, i, k) {
    const o = i * 4;
    if (d[o + 3] === 0) { d[o] = 6; d[o + 1] = 5; d[o + 2] = 4; d[o + 3] = 255; return; }
    d[o] *= k; d[o + 1] *= k; d[o + 2] *= k;
  }

  function render(now) {
    const t = (now - t0) / 1000;
    const ign = reduce ? 1 : Math.min(1, t / 2);
    const ig = ign * ign * (3 - 2 * ign);
    const d = img.data;
    d.fill(0);
    const so = P < 5 ? 1 : 2;

    // 1) harfler için sert gölge
    for (let y = 0; y < rows - so; y++) {
      for (let x = 0; x < cols - so; x++) {
        const i = y * cols + x;
        if (!(maskE[i] || maskA[i])) continue;
        const j = (y + so) * cols + (x + so);
        if (maskE[j] || maskA[j]) continue;
        put(d, j, PAL[2]);
      }
    }
    // 2) ERDEM (krem -> turuncu) ve ASLAN (turuncu kor)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const isE = maskE[i];
        if (!isE && !maskA[i]) continue;
        const n = vnoise(x * 0.11, y * 0.2 + t * 1.5) - 0.5;
        let h = isE ? 0.97 - 0.34 * yn[i] * yn[i] + n * 0.3 : 0.7 - 0.18 * yn[i] + n * 0.5;
        h = 0.5 + (h - 0.5) * (0.35 + 0.65 * ig);
        const dx = x - mouse.x;
        const dy = y - mouse.y;
        h += 0.5 * Math.exp(-(dx * dx + dy * dy) / (2 * 80 * (5 / P) * (5 / P)));
        if (h < 0) h = 0;
        if (h > 0.999) h = 0.999;
        const L = h * 6;
        const lo = Math.floor(L);
        const lv = L - lo > B4[(y & 3) * 4 + (x & 3)] ? lo + 1 : lo;
        put(d, i, PAL[Math.min(6, lv)]);
      }
    }

    // 3) etiket: kalkık köşe nefes alır; peel 0..1 söküm, ardından drift > 0 ile aynı parça kesintisiz sola uçar
    const w = Math.max(1, tx1 - tx0);
    const curl = 0.075 + (reduce ? 0 : Math.sin(t * 2.1) * 0.012);
    const q = curl + ease(peel) * (1 - curl);
    const xf = tx1 - q * w;

    const detached = peel >= 0.999;
    // etiketin arka plana düşürdüğü sert gölge (yalnızca yapışık kısım)
    for (let y = 0; y < rows - so - 1 && !detached; y++) {
      for (let x = 0; x < xf && x < cols - so; x++) {
        if (!tape[y * cols + x]) continue;
        const j = (y + so + 1) * cols + (x + so);
        if (x + so >= xf || !tape[j]) darken(d, j, 0.35);
      }
    }
    // yapışık kâğıt
    for (let y = 0; y < rows && !detached; y++) {
      for (let x = 0; x < cols && x < xf; x++) {
        const i = y * cols + x;
        if (!tape[i]) continue;
        if (ink[i]) put(d, i, INK);
        else put(d, i, hash(x >> 1, y >> 1) < 0.16 + (y / rows) * 0.1 ? PAPER_D : PAPER);
      }
    }
    // kıvrım çizgisi vurgusu
    if (!detached && xf < tx1 - 1 && xf > tx0) {
      for (let y = 0; y < rows; y++) {
        for (let dx = -1; dx <= 0; dx++) {
          const x = Math.round(xf) + dx;
          if (x >= 0 && x < cols && tape[y * cols + x] && x < xf) put(d, y * cols + x, [255, 253, 246]);
        }
      }
    }

    // kalkan & ekranın soluna kesintisiz uçan kısım (tx0 veya canvas sınırında kesilmez!)
    const r = cv.getBoundingClientRect();
    const hr = footHost.getBoundingClientRect();
    const relLeft = r.left - hr.left;
    const relTop = r.top - hr.top;
    const scaleX = r.width / Math.max(1, cols);
    const scaleY = r.height / Math.max(1, rows);
    const needLeftPad = Math.ceil(Math.max(0, relLeft) / Math.max(1, scaleX)) + 4;
    const needCols = needLeftPad + cols;
    const needRows = FLY_TOP_PAD + rows + 8;

    const shiftX = detached ? -(drift * w * 0.68 + drift * drift * w * 0.58) : 0;
    const shiftY = detached ? -drift * 11 : 0;
    const flutterAmp = detached ? Math.min(3.5, drift * 4.5) : 0;

    // Ekranın solundan tamamen çıkıp çıkmadığını kontrol et
    const paperRightEdge = (detached ? tx0 : Math.min(cols, xf)) + shiftX;
    const showFlap = visible && !(reduce && detached) && (paperRightEdge > -needLeftPad - 4);

    if (showFlap && flyCtx) {
      if (flyCols !== needCols || flyRows !== needRows) {
        flyCols = needCols;
        flyRows = needRows;
        flyLeftPad = needLeftPad;
        flyCv.width = flyCols;
        flyCv.height = flyRows;
        flyImg = flyCtx.createImageData(flyCols, flyRows);
      } else {
        flyLeftPad = needLeftPad;
      }

      flyCv.style.display = 'block';
      flyCv.style.left = `${(relLeft - flyLeftPad * scaleX).toFixed(1)}px`;
      flyCv.style.top = `${(relTop - FLY_TOP_PAD * scaleY).toFixed(1)}px`;
      flyCv.style.width = `${(flyCols * scaleX).toFixed(1)}px`;
      flyCv.style.height = `${(flyRows * scaleY).toFixed(1)}px`;

      const fd = flyImg.data;
      fd.fill(0);
      const mark = new Uint8Array(flyCols * flyRows);
      const flap = [];
      const foldX = detached ? tx0 : xf;
      const startX = Math.max(0, Math.floor(foldX));

      for (let y = 0; y < rows; y++) {
        for (let x = startX; x < cols; x++) {
          if (!tape[y * cols + x]) continue;
          const xd = x - foldX;
          const waveY = flutterAmp > 0 ? Math.sin(drift * 6.5 + xd * 0.11) * flutterAmp : 0;
          const nx = Math.round(2 * foldX - x + shiftX);
          const ny = Math.round(y - 0.16 * xd + shiftY + waveY);
          const fx = nx + flyLeftPad;
          const fy = ny + FLY_TOP_PAD;
          if (fx < 0 || fx >= flyCols || fy < 0 || fy >= flyRows) continue;
          const fi = fy * flyCols + fx;
          flap.push(fi);
          const sh = Math.min(1, xd / (w * 0.16));
          const col = hash(x >> 1, y >> 1) < 0.12 + (1 - sh) * 0.35 ? PAPER_D : PAPER_BACK;
          const fo = fi * 4;
          fd[fo] = col[0]; fd[fo + 1] = col[1]; fd[fo + 2] = col[2]; fd[fo + 3] = 255;
          mark[fi] = 1;
        }
      }
      // Kalkan kâğıdın kendi piksel gölgesi (söküm sırasında koyu, uçarken hafifler)
      const shadowA = detached ? Math.max(0, Math.round(115 * (1 - drift * 0.45))) : 125;
      if (shadowA > 8) {
        for (const f of flap) {
          const j = f + flyCols + 1;
          if (j < mark.length && !mark[j]) {
            const jo = j * 4;
            fd[jo] = 6; fd[jo + 1] = 5; fd[jo + 2] = 4; fd[jo + 3] = shadowA;
          }
        }
      }
      flyCtx.putImageData(flyImg, 0, 0);
    } else {
      flyCv.style.display = 'none';
    }

    // 4) kıvılcımlar (ASLAN'ın görünen yerlerinden)
    if (!reduce && ig > 0.35 && topA.length && visible) {
      for (let k = 0; k < 2 && sparks.length < 70; k++) {
        if (Math.random() < 0.55) {
          const i = topA[(Math.random() * topA.length) | 0];
          if (!tape[i]) sparks.push({ x: i % cols, y: Math.floor(i / cols), vy: -(0.25 + Math.random() * 0.55), ph: Math.random() * 6.28, life: 0, max: 40 + Math.random() * 60 });
        }
      }
      if (mouse.x > 0 && sparks.length < 90) {
        sparks.push({ x: mouse.x + (Math.random() - 0.5) * 8, y: mouse.y + (Math.random() - 0.5) * 4, vy: -(0.4 + Math.random() * 0.7), ph: Math.random() * 6.28, life: 0, max: 24 + Math.random() * 30 });
      }
    }
    sparks = sparks.filter((s) => s.life < s.max && s.y > 0);
    for (const s of sparks) {
      s.life++;
      s.y += s.vy;
      s.x += Math.sin(s.life * 0.18 + s.ph) * 0.22;
      const px = Math.round(s.x);
      const py = Math.round(s.y);
      if (px < 0 || px >= cols || py < 0 || py >= rows) continue;
      const k = s.life / s.max;
      if (k < 0.9) put(d, py * cols + px, k < 0.3 ? PAL[6] : k < 0.65 ? PAL[5] : PAL[4]);
    }
    ctx.putImageData(img, 0, 0);
  }

  function loop(now) {
    const peeling = Math.abs(peel - target) > 0.001;
    const flying = target > 0.5 && peel >= 0.999 && drift < 3.2;
    const gap = peeling || flying ? 33 : 55;
    if (visible && now - lastT >= gap) {
      const dt = Math.min(0.1, (now - lastT) / 1000);
      lastT = now;
      if (peeling) {
        const step = dt / 1.45;
        peel = target > peel ? Math.min(target, peel + step) : Math.max(target, peel - step);
        if (target < 0.5) drift = 0;
      } else if (flying) {
        drift += dt;
      }
      render(now);
    } else if (!visible && flyCv.style.display !== 'none') {
      flyCv.style.display = 'none';
    }
    if (!reduce) requestAnimationFrame(loop);
  }

  function setTarget(v) {
    target = v;
    if (v < 0.5) drift = 0;
    cv.setAttribute('data-cur', v > 0.5 ? 'etiketi geri yapıştır' : 'etiketi sök');
    if (reduce) { peel = v; drift = v > 0.5 ? 4 : 0; render(performance.now()); }
  }

  cv.addEventListener('click', () => setTarget(target > 0.5 ? 0 : 1));
  cv.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTarget(target > 0.5 ? 0 : 1); }
  });
  cv.addEventListener('pointermove', (e) => {
    const r = cv.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * cols;
    mouse.y = ((e.clientY - r.top) / r.height) * rows;
  }, { passive: true });
  cv.addEventListener('pointerleave', () => { mouse.x = -999; mouse.y = -999; });

  // sayfanın en altına inince etiket kendiliğinden sökülür (bir kez)
  window.addEventListener('scroll', () => {
    if (autoDone) return;
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 40) {
      autoDone = true;
      if (!visible) { peel = 1; target = 1; cv.setAttribute('data-cur', 'etiketi geri yapıştır'); return; }
      setTimeout(() => setTarget(1), 500);
    }
  }, { passive: true });

  function start() {
    build();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => {
        es.forEach((e) => {
          visible = e.isIntersecting;
          if (visible && !started) { started = true; t0 = performance.now(); render(t0); }
        });
      }, { threshold: 0.15 }).observe(cv);
    } else { visible = true; started = true; t0 = performance.now(); }
    if (reduce) { started = true; t0 = performance.now() - 4000; visible = true; render(performance.now()); }
    else requestAnimationFrame(loop);
  }

  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (img) { build(); if (started) render(performance.now()); } }, 200);
  });

  const ready = document.fonts && document.fonts.load
    ? Promise.all([document.fonts.load(`800 100px ${SERIF}`), document.fonts.load(`400 100px ${LABEL}`)])
    : Promise.resolve();
  Promise.race([ready, new Promise((r) => setTimeout(r, 1500))]).then(start, start);
})();
