/* ==========================================================
   Bağımsız WebKit (Safari / iOS Chrome) Piksel Başlık Eklentisi
   Yalnızca html.wk sınıfı aktifken çalışır.
   Aynı Geist Serif fontunu düşük çözünürlüklü piksel kanvasına
   çizerek SVG feTile filtresinin WebKit'te çalışmamasını telafi eder.
   ========================================================== */
(() => {
  'use strict';

  if (!document.documentElement.classList.contains('wk')) return;

  /* ----------------------------------------------------------
     A) Safari / iOS WebKit Animasyon & Etkileşim Yamaları
        (Ana JS dosyalarına dokunmadan yalnızca html.wk'da çalışır)
     ---------------------------------------------------------- */

  // 1. warp.js TV geçişi: Safari'de behavior:'instant' yerine smooth-scroll takılmasını düzelt
  const nativeScrollTo = window.scrollTo.bind(window);
  window.scrollTo = function patchedScrollTo(arg1, arg2) {
    if (arg1 && typeof arg1 === 'object' && arg1.behavior === 'instant') {
      const root = document.documentElement;
      const prev = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      nativeScrollTo(arg1.left ?? window.scrollX, arg1.top ?? window.scrollY);
      root.style.scrollBehavior = prev;
      return;
    }
    return arg2 === undefined ? nativeScrollTo(arg1) : nativeScrollTo(arg1, arg2);
  };

  // 2. 3D sahnede iOS Safari çoklu dokunma / hızlı dokunmada setPointerCapture hatasını yut
  if (Element.prototype.setPointerCapture) {
    const origCapture = Element.prototype.setPointerCapture;
    Element.prototype.setPointerCapture = function safeCapture(id) {
      try {
        return origCapture.call(this, id);
      } catch (_) {
        return undefined;
      }
    };
  }

  // 3. iOS Safari momentum kaydırma sonrası scroll-bağlı animasyonları (kart, çark, geçmiş) tazele
  let momentumTimer = 0;
  const nudgeScroll = () => {
    clearTimeout(momentumTimer);
    momentumTimer = setTimeout(() => {
      window.dispatchEvent(new Event('scroll'));
    }, 120);
  };
  window.addEventListener('touchend', nudgeScroll, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('scroll'));
  }, 250));
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', nudgeScroll, { passive: true });
  }

  /* ----------------------------------------------------------
     B) Safari / iOS WebKit Pikselli Geist Serif Başlık Katmanı
     ---------------------------------------------------------- */
  const TARGETS = [
    ['h1', 3.0],
    ['h2', 2.4],
    ['.card h3', 2.0],
    ['.wheel-detail h3', 2.0],
    ['.proof dd', 2.4],
    ['.lab3d-specs h3', 2.0],
    ['.fs-who', 2.0],
    ['.fold-q', 1.8],
  ];

  // Metin düğümlerini satır parçalarına bölerek gerçek canlı renk + konumla çizer
  function collectLines(el) {
    const hostRect = el.getBoundingClientRect();
    const pieces = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.nodeValue;
      if (!text || !text.trim()) continue;
      const parent = node.parentElement || el;
      const cs = getComputedStyle(parent);
      const color = cs.color || '#f6f5f1';
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const range = document.createRange();
      let start = 0;
      const len = text.length;
      while (start < len) {
        while (start < len && /\s/.test(text[start])) start++;
        if (start >= len) break;
        let end = start + 1;
        while (end < len && !/\s/.test(text[end])) end++;
        range.setStart(node, start);
        range.setEnd(node, end);
        const rects = range.getClientRects();
        if (rects.length) {
          const r = rects[0];
          pieces.push({
            text: text.slice(start, end),
            x: r.left - hostRect.left,
            y: r.top - hostRect.top,
            h: r.height,
            color,
            font,
          });
        }
        start = end;
      }
    }
    return { hostRect, pieces };
  }

  function paintElement(el, pxSize) {
    const hadHost = el.classList.contains('wk-px-host');
    if (hadHost) el.classList.remove('wk-px-host');

    const oldCanvas = el.querySelector(':scope > .wk-px-canvas');
    if (oldCanvas) oldCanvas.style.display = 'none';

    const { hostRect, pieces } = collectLines(el);
    if (hostRect.width < 4 || hostRect.height < 4 || pieces.length === 0) {
      if (oldCanvas) oldCanvas.remove();
      return;
    }

    const padY = 6;
    const w = Math.ceil(hostRect.width) + 4;
    const h = Math.ceil(hostRect.height) + padY * 2;
    const lw = Math.max(8, Math.round(w / pxSize));
    const lh = Math.max(6, Math.round(h / pxSize));

    let cv = oldCanvas;
    if (!cv) {
      cv = document.createElement('canvas');
      cv.className = 'wk-px-canvas';
      cv.setAttribute('aria-hidden', 'true');
      el.appendChild(cv);
    }
    cv.width = lw;
    cv.height = lh;
    cv.style.display = 'block';
    cv.style.top = `${-padY}px`;
    cv.style.width = `${w}px`;
    cv.style.height = `${h}px`;

    const ctx = cv.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.clearRect(0, 0, lw, lh);
    ctx.save();
    ctx.scale(lw / w, lh / h);
    // Safari'de textBaseline:'top' dikey kayma yaptığı için 'alphabetic' + güvenli taban çizgisi kullan
    ctx.textBaseline = 'alphabetic';
    for (const p of pieces) {
      ctx.font = p.font;
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y + padY + p.h * 0.78);
    }
    ctx.restore();

    const img = ctx.getImageData(0, 0, lw, lh);
    const d = img.data;
    for (let i = 3; i < d.length; i += 4) {
      d[i] = d[i] > 72 ? 255 : 0;
    }
    ctx.putImageData(img, 0, 0);

    el.classList.add('wk-px-host');
  }

  function paintAll() {
    TARGETS.forEach(([sel, px]) => {
      document.querySelectorAll(sel).forEach((el) => paintElement(el, px));
    });
  }

  let raf = 0;
  function schedulePaint() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      paintAll();
    });
  }

  function init() {
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).then(() => {
      paintAll();
      window.addEventListener('resize', schedulePaint, { passive: true });
      window.addEventListener('langchange', () => setTimeout(schedulePaint, 60));

      // Dinamik güncellenen başlıkları (#wd-title, #lab3d-title) izle
      ['wd-title', 'lab3d-title'].forEach((id) => {
        const node = document.getElementById(id);
        if (!node) return;
        new MutationObserver(schedulePaint).observe(node, { childList: true, characterData: true, subtree: true });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
