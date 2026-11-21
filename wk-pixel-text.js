/* ==========================================================
   Bağımsız WebKit (Safari / iOS Chrome) Uyumluluk & Piksel Başlık Eklentisi
   Yalnızca html.wk (Apple WebKit) üzerinde çalışır:
   1) warp.js instant scroll, iOS setPointerCapture & momentum scroll yamaları
   2) Geist Serif başlıklarını Safari/iOS'ta da (SVG feTile çalışmadığı için)
      yazı boyutuna orantılı, kaymasız ve okunaklı piksel kanvasla çizer.
   ========================================================== */
(() => {
  'use strict';

  if (!document.documentElement.classList.contains('wk')) return;

  // 1. warp.js TV geçişi: Safari'de behavior:'instant' düzeltmesi
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

  // 2. 3D sahnede iOS Safari setPointerCapture hatasını yut
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

  // 3. Yalnızca ekran döndürüldüğünde ölçümü tazele (touchend/visualViewport'ta sahte scroll titreme yapar!)
  window.addEventListener('orientationchange', () => setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 260));

  /* ----------------------------------------------------------
     4. Safari / iOS Pikselli Geist Serif Başlık Çizicisi
        - Yazı boyutuna orantılı piksel boyu (en az ~18 piksel harf boyu -> bozulmaz!)
        - Satır bazlı Range ölçümü (kelime aralıkları ve ortalamalar 1:1 korunur)
        - actualBoundingBoxAscent ile sıfır dikey kayma (Ğ, Ş, İ, Ö, Ü kesilmez)
     ---------------------------------------------------------- */
  const SELECTORS = [
    'h1',
    'h2',
    '.card h3',
    '.wheel-detail h3',
    '.proof dd',
    '.seq-line',
    '.lab3d-specs h3',
    '.fold-q',
  ];

  // Metin düğümlerindeki her görsel satır parçasını (renk + konum + metin) çıkar
  function collectRuns(el) {
    const hostRect = el.getBoundingClientRect();
    const runs = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      const raw = node.nodeValue;
      if (!raw || !raw.trim()) continue;
      const parent = node.parentElement || el;
      const cs = getComputedStyle(parent);
      const color = cs.color || '#f6f5f1';
      const fontSize = parseFloat(cs.fontSize) || 24;
      const font = `${cs.fontStyle} ${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`;
      const upper = cs.textTransform === 'uppercase';
      const letterSpacing = cs.letterSpacing;

      // Karakterleri görsel satırlara (aynı y rect) grupla
      const range = document.createRange();
      let curLineTop = null;
      let curStart = -1;
      let curRect = null;

      const flushRun = (endIdx) => {
        if (curStart < 0 || !curRect) return;
        let slice = raw.slice(curStart, endIdx).replace(/\s+/g, ' ');
        if (!slice.trim()) return;
        if (upper) slice = slice.toLocaleUpperCase('tr-TR');
        runs.push({
          text: slice.trim(),
          x: curRect.left - hostRect.left,
          y: curRect.top - hostRect.top,
          w: curRect.width,
          h: curRect.height,
          color,
          font,
          fontSize,
          letterSpacing,
        });
      };

      for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        if (/\s/.test(ch)) {
          if (curStart < 0) continue;
        }
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const rects = range.getClientRects();
        if (!rects.length) continue;
        const r = rects[0];
        if (r.width === 0 && r.height === 0) continue;

        if (curLineTop === null) {
          curLineTop = r.top;
          curStart = i;
          curRect = { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
        } else if (Math.abs(r.top - curLineTop) > fontSize * 0.45) {
          flushRun(i);
          curLineTop = r.top;
          curStart = i;
          curRect = { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
        } else {
          curRect.left = Math.min(curRect.left, r.left);
          curRect.top = Math.min(curRect.top, r.top);
          curRect.right = Math.max(curRect.right, r.right);
          curRect.bottom = Math.max(curRect.bottom, r.bottom);
          curRect.width = curRect.right - curRect.left;
          curRect.height = curRect.bottom - curRect.top;
        }
      }
      flushRun(raw.length);
    }
    return { hostRect, runs };
  }

  function paintElement(el) {
    // Mevcut canvas'ı gizleyip CSS transition olmadan gerçek hedef rengi & metrikleri oku
    const hadHost = el.classList.contains('wk-px-host');
    el.classList.add('wk-px-measuring');
    if (hadHost) el.classList.remove('wk-px-host');
    const oldCv = el.querySelector(':scope > .wk-px-canvas');
    if (oldCv) oldCv.style.display = 'none';
    void el.offsetWidth;

    const { hostRect, runs } = collectRuns(el);
    el.classList.remove('wk-px-measuring');
    if (hostRect.width < 8 || hostRect.height < 8 || !runs.length) {
      if (oldCv) oldCv.remove();
      return;
    }

    // Harf boyutuna orantılı piksel karesi: büyük başlıkta 3-4px, mobilde 1.6-2px -> her zaman net okunur!
    const maxFs = runs.reduce((m, r) => Math.max(m, r.fontSize), 20);
    const px = Math.max(1.5, Math.min(3.8, maxFs / 22));

    const padX = 4;
    const padY = Math.ceil(maxFs * 0.22) + 4;
    const w = Math.ceil(hostRect.width) + padX * 2;
    const h = Math.ceil(hostRect.height) + padY * 2;
    const lw = Math.max(16, Math.round(w / px));
    const lh = Math.max(12, Math.round(h / px));

    let cv = oldCv;
    if (!cv) {
      cv = document.createElement('canvas');
      cv.className = 'wk-px-canvas';
      cv.setAttribute('aria-hidden', 'true');
      el.appendChild(cv);
    }
    cv.width = lw;
    cv.height = lh;
    cv.style.display = 'block';
    cv.style.left = `${-padX}px`;
    cv.style.top = `${-padY}px`;
    cv.style.width = `${w}px`;
    cv.style.height = `${h}px`;

    const ctx = cv.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.clearRect(0, 0, lw, lh);
    ctx.save();
    ctx.scale(lw / w, lh / h);
    ctx.textBaseline = 'alphabetic';

    for (const run of runs) {
      ctx.font = run.font;
      ctx.fillStyle = run.color;
      const m = ctx.measureText(run.text);
      const asc = m.actualBoundingBoxAscent || run.fontSize * 0.72;
      const desc = m.actualBoundingBoxDescent || run.fontSize * 0.2;
      const glyphH = asc + desc;
      // Gerçek kutunun dikey ortasına hizala -> Safari'de sıfır kayma!
      const baseY = run.y + padY + (run.h - glyphH) * 0.5 + asc;
      ctx.fillText(run.text, run.x + padX, baseY);
    }
    ctx.restore();

    // Temiz piksel kenarı (ince çizgileri koparmayan dengeli eşik)
    const img = ctx.getImageData(0, 0, lw, lh);
    const d = img.data;
    for (let i = 3; i < d.length; i += 4) {
      d[i] = d[i] > 96 ? 255 : 0;
    }
    ctx.putImageData(img, 0, 0);

    el.classList.add('wk-px-host');
  }

  function paintAll() {
    SELECTORS.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => paintElement(el));
    });
  }

  let raf = 0;
  function schedulePaint() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(paintAll);
  }

  function ensureSlogan() {
    const lines = document.querySelectorAll('.seq-line');
    if (!lines.length) return;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add('on');
              // Slogan yandığında rengi (YAZ. turuncu/kırmızı!) yeni renkle piksel çiz
              setTimeout(() => paintElement(en.target), 80);
              setTimeout(() => paintElement(en.target), 450);
              setTimeout(() => paintElement(en.target), 900);
              io.unobserve(en.target);
            }
          });
        },
        { threshold: 0.05 }
      );
      lines.forEach((el) => io.observe(el));
    } else {
      lines.forEach((el) => {
        el.classList.add('on');
        paintElement(el);
      });
    }
  }

  function init() {
    ensureSlogan();
    const loadSerif = document.fonts && document.fonts.load
      ? document.fonts.load('400 48px "Geist Serif"')
      : Promise.resolve();
    const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

    Promise.race([Promise.all([loadSerif, ready]), new Promise((r) => setTimeout(r, 1800))]).then(() => {
      paintAll();
      // Geç yüklenen font veya yerleşim oturduktan sonra bir kez daha tazele
      setTimeout(paintAll, 350);

      let lastW = window.innerWidth;
      window.addEventListener('resize', () => {
        if (Math.abs(window.innerWidth - lastW) > 6) {
          lastW = window.innerWidth;
          schedulePaint();
        }
      }, { passive: true });
      window.addEventListener('langchange', () => setTimeout(paintAll, 80));

      ['wd-title', 'lab3d-title'].forEach((id) => {
        const node = document.getElementById(id);
        if (!node) return;
        new MutationObserver(() => paintElement(node)).observe(node, {
          childList: true,
          characterData: true,
          subtree: true,
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
