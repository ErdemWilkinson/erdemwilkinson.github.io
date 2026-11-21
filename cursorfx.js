/* İmleç elemanları: tıklayınca piksel patlaması, üzerinde durulan şeyin kısa etiketi.
   İmlecin kendisi (ok, el, I, taşı, nişan) cursors/ klasöründeki SVG'lerdir. */
(() => {
  'use strict';
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- tıklama patlaması ---------- */
  const cv = document.createElement('canvas');
  cv.id = 'click-fx';
  cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  const U = 3; // bir piksel = 3 CSS pikseli
  let parts = [];
  let raf = 0;

  function size() {
    cv.width = Math.ceil(window.innerWidth / U);
    cv.height = Math.ceil(window.innerHeight / U);
  }
  size();
  window.addEventListener('resize', size);

  function burst(x, y) {
    if (reduce) return;
    const cx = x / U;
    const cy = y / U;
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (i % 2) * 0.2;
      const v = 1.1 + (i % 3) * 0.5;
      parts.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 7 + (i % 3), c: i % 4 === 0 ? '#f6f5f1' : '#ed670f' });
    }
    if (!raf) { last = 0; raf = requestAnimationFrame(loop); }
  }

  let last = 0;
  function loop(now) {
    raf = 0;
    if (now - last >= 45) { // ~22 kare/sn: basamaklı, piksel hissi
      last = now;
      ctx.clearRect(0, 0, cv.width, cv.height);
      parts = parts.filter((p) => p.t < p.life);
      parts.forEach((p) => {
        p.t++;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.86;
        p.vy *= 0.86;
        ctx.fillStyle = p.c;
        const s = p.t < p.life * 0.55 ? 2 : 1;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
      });
    }
    if (parts.length) raf = requestAnimationFrame(loop);
    else ctx.clearRect(0, 0, cv.width, cv.height);
  }

  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    burst(e.clientX, e.clientY);
  }, { passive: true });

  /* ---------- imleç etiketi ---------- */
  const tag = document.createElement('div');
  tag.id = 'cur-tag';
  tag.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tag);

  function labelFor(t) {
    if (!t || !t.closest) return '';
    const c = t.closest('[data-cur]');
    if (c) return c.getAttribute('data-cur');
    if (t.closest('.lab3d-viewport')) return 'sürükle';
    if (t.closest('#scan-canvas')) return 'tara';
    if (t.closest('.fs-tile')) return 'dosyaya git';
    const a = t.closest('a[href]');
    if (a) {
      const h = a.getAttribute('href') || '';
      if (h.startsWith('mailto:')) return 'yaz';
      if (h.startsWith('#')) return 'git';
      return 'aç ↗';
    }
    if (t.closest('.fold-head')) return 'aç / kapat';
    return '';
  }

  let mx = 0;
  let my = 0;
  let cur = '';
  let timer = 0;
  let pq = false;

  function place() {
    pq = false;
    const w = tag.offsetWidth || 80;
    const x = mx + 26 + w > window.innerWidth ? mx - 18 - w : mx + 26;
    const y = my + 34 > window.innerHeight ? my - 30 : my + 24;
    tag.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
  }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    mx = e.clientX;
    my = e.clientY;
    const l = labelFor(e.target);
    if (l !== cur) {
      cur = l;
      clearTimeout(timer);
      tag.classList.remove('on');
      if (l) {
        timer = setTimeout(() => {
          tag.textContent = l;
          place();
          tag.classList.add('on');
        }, 130);
      }
    }
    if (tag.classList.contains('on') && !pq) { pq = true; requestAnimationFrame(place); }
  }, { passive: true });

  document.documentElement.addEventListener('mouseleave', () => { cur = ''; tag.classList.remove('on'); });
  window.addEventListener('scroll', () => { tag.classList.remove('on'); cur = ''; }, { passive: true });
})();
