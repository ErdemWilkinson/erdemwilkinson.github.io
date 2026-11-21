/* Portre katmanları: fare paralaksı + girişte kademeli açılış.
   Boşta durma animasyonları CSS'te; burada yalnızca etkileşim var. */
(() => {
  'use strict';
  // RPG istatistik çubukları (10 kutu)
  document.querySelectorAll('.rpg b[data-v]').forEach((b) => {
    const v = Number(b.dataset.v) || 0;
    b.innerHTML = Array.from({ length: 10 }, (_, k) => `<i${k < v ? ' class="on"' : ''}></i>`).join('');
  });

  const stage = document.getElementById('portrait-stage');
  if (!stage) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Girişte alttan yukarı kademeli açılış (JS yoksa görüntü zaten açık)
  if (!reduce && 'IntersectionObserver' in window) {
    stage.classList.add('p-pre');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          stage.classList.remove('p-pre');
          io.disconnect();
        }
      });
    }, { threshold: 0.25 });
    io.observe(stage.parentElement);
  }

  if (reduce || !fine) return;

  // Fare paralaksı: arka plan ters yöne, ön plan daha fazla kayar
  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;
  let raf = 0;

  function tick() {
    cx += (tx - cx) * 0.09;
    cy += (ty - cy) * 0.09;
    stage.style.setProperty('--px', cx.toFixed(3));
    stage.style.setProperty('--py', cy.toFixed(3));
    if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) raf = requestAnimationFrame(tick);
    else raf = 0;
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    stage.style.setProperty('--mx', ((tx + 1) * 50).toFixed(1) + '%');
    stage.style.setProperty('--my', ((ty + 1) * 50).toFixed(1) + '%');
    stage.classList.add('p-hot');
    kick();
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { tx = 0; ty = 0; stage.classList.remove('p-hot'); kick(); });
})();
