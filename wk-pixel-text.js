/* ==========================================================
   Bağımsız WebKit (Safari / iOS Chrome) Uyumluluk Eklentisi
   Yalnızca html.wk sınıfı aktifken çalışır.
   - warp.js instant scroll düzeltmesi
   - iOS setPointerCapture koruması
   - iOS momentum scroll & slogan (.seq-line) tetiklemesi
   (Fontlar doğrudan yerel @font-face ile net ve okunaklı çizilir)
   ========================================================== */
(() => {
  'use strict';

  if (!document.documentElement.classList.contains('wk')) return;

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

  // 3. iOS Safari momentum kaydırma sonrası scroll-bağlı animasyonları tazele
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

  // 4. Kapanış sloganındaki satırların (.seq-line, özellikle "KARTA YAZ.") Safari'de kesin yanması
  function ensureSlogan() {
    const lines = document.querySelectorAll('.seq-line');
    if (!lines.length) return;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add('on');
              io.unobserve(en.target);
            }
          });
        },
        { threshold: 0.05 }
      );
      lines.forEach((el) => io.observe(el));
    } else {
      lines.forEach((el) => el.classList.add('on'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureSlogan);
  } else {
    ensureSlogan();
  }
})();
