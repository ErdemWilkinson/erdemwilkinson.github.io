/* ==========================================================
   Erdem Aslan · portfolyo (main.js)
   - Scroll ile teker teker dönen teknik çark (#surec)
   - Scroll ile teker teker geçen kayıt defteri kartları (#kayit)
   - SSS kâğıt kapak kartları (#sss)
   - Kapanış sloganı satırları (.seq-line)
   - El yapımı 5x7 piksel matrisli ERDEM ASLAN (#wordmark)
   ========================================================== */

(() => {
  'use strict';

  const INK = '#f6f5f1';
  const RED = '#ed670f';
  const CYAN = '#ffb98a';

  /* ----------------------------------------------------------
     1. 16x16 Piksel İkonlar (canvas.sprite)
     ---------------------------------------------------------- */
  const SPRITES = {
    chip: [
      '....11....11....',
      '....11....11....',
      '..111111111111..',
      '..1..........1..',
      '111..222222..111',
      '111..2....2..111',
      '..1..2.22.2..1..',
      '..1..2.22.2..1..',
      '111..2....2..111',
      '111..222222..111',
      '..1..........1..',
      '..111111111111..',
      '....11....11....',
      '....11....11....',
      '................',
      '................',
    ],
    ocr: [
      '.11111111111111.',
      '.1............1.',
      '.1.111.11.111.1.',
      '.1............1.',
      '.1.1111..1111.1.',
      '.1............1.',
      '2222222222222222',
      '.1.222.22222..1.',
      '2222222222222222',
      '.1............1.',
      '.1.11111.111..1.',
      '.1............1.',
      '.1.11..111111.1.',
      '.1............1.',
      '.11111111111111.',
      '................',
    ],
    drone: [
      '2222........2222',
      '.11..........11.',
      '..11........11..',
      '...1111111111...',
      '..111111111111..',
      '.111..1111..111.',
      '......1221......',
      '......1221......',
      '.....111111.....',
      '....11....11....',
      '...11......11...',
      '2222........2222',
      '................',
      '.......22.......',
      '......2..2......',
      '.......22.......',
    ],
    eye: [
      '................',
      '.....111111.....',
      '...11......11...',
      '..1..........1..',
      '.1....1111....1.',
      '1....112211....1',
      '1....122221....1',
      '1....122221....1',
      '1....112211....1',
      '.1....1111....1.',
      '..1..........1..',
      '...11......11...',
      '.....111111.....',
      '................',
      '..2..222222..2..',
      '................',
    ],
    handheld: [
      '..111111111111..',
      '.11..........11.',
      '.1.1111111111.1.',
      '.1.1222222221.1.',
      '.1.12......21.1.',
      '.1.12.222..21.1.',
      '.1.1222222221.1.',
      '.1.1111111111.1.',
      '.1............1.',
      '.1...11....22.1.',
      '.1..1111...22.1.',
      '.1...11.......1.',
      '.1........22..1.',
      '.11..........11.',
      '..111111111111..',
      '................',
    ],
    scalpel: [
      '................',
      '.....11111......',
      '....1222221.....',
      '...12.....221...',
      '..12.......21...',
      '..1.........21..',
      '............21..',
      '...........121..',
      '...........121..',
      '..........1221..',
      '.........12211..',
      '....1111122211..',
      '....12222221....',
      '...1211111......',
      '..121...........',
      '.121............',
    ],
    brain: [
      '....111..111....',
      '..11..1111..11..',
      '.1..11.11.11..1.',
      '.1.1...11...1.1.',
      '1..11.2112.11..1',
      '1....221122....1',
      '.1..11.11.11..1.',
      '.1.1...11...1.1.',
      '1..11..11..11..1',
      '1....111111....1',
      '.1..1..11..1..1.',
      '..11...11...11..',
      '....111..111....',
      '......1111......',
      '.......22.......',
      '................',
    ],
  };

  function drawSprites() {
    document.querySelectorAll('canvas.sprite').forEach((cv) => {
      const name = cv.dataset.sprite || 'chip';
      const scale = parseInt(cv.dataset.scale || '3', 10);
      const grid = SPRITES[name] || SPRITES.chip;
      cv.width = 16 * scale;
      cv.height = 16 * scale;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (let y = 0; y < 16; y++) {
        const row = grid[y] || '';
        for (let x = 0; x < 16; x++) {
          const ch = row[x];
          if (ch === '1') {
            ctx.fillStyle = INK;
            ctx.fillRect(x * scale, y * scale, scale, scale);
          } else if (ch === '2') {
            ctx.fillStyle = RED;
            ctx.fillRect(x * scale, y * scale, scale, scale);
          }
        }
      }
    });
  }

  /* ----------------------------------------------------------
     2. Açılış Ekranı (#boot)
     ---------------------------------------------------------- */
  function initBoot() {
    const boot = document.getElementById('boot');
    if (!boot) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      boot.style.display = 'none';
      document.body.classList.remove('is-loading');
      return;
    }
    // yalnızca giriş anı: simsiyah ekran kısa bir an durur, sonra TV gibi açılır
    setTimeout(() => {
      boot.classList.add('out');
      document.body.classList.remove('is-loading');
      setTimeout(() => {
        boot.style.display = 'none';
      }, 750);
    }, 44);
  }

  /* ----------------------------------------------------------
     3. Üst Menü Kaydırma Çizgisi
     ---------------------------------------------------------- */
  function initNav() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 16);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const burger = document.getElementById('nav-burger');
    const drawer = document.getElementById('nav-drawer');
    if (!burger || !drawer) return;

    const setOpen = (open) => {
      drawer.hidden = !open;
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.textContent = open ? '✕' : '☰';
    };

    burger.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(drawer.hidden);
    });
    drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('click', (e) => {
      if (!drawer.hidden && !drawer.contains(e.target) && !burger.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !drawer.hidden) setOpen(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 980 && !drawer.hidden) setOpen(false);
    });
  }

  /* ----------------------------------------------------------
     4. Hero: VoxHOD v3 Karo Tarama Oyuncağı (#scan-canvas)
     ---------------------------------------------------------- */
  function initScanner() {
    const cv = document.getElementById('scan-canvas');
    const countEl = document.getElementById('scan-count');
    const statusEl = document.getElementById('scan-status');
    const autoBtn = document.getElementById('scan-auto');
    const resetBtn = document.getElementById('scan-reset');
    if (!cv || !countEl || !statusEl) return;

    const COLS = 6;
    const ROWS = 4;
    const TOTAL = COLS * ROWS;
    const W = (cv.width = 540);
    const H = (cv.height = 360);
    const TW = W / COLS;
    const TH = H / ROWS;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const clown = new Image();
    clown.src = 'img/palyaco.png';
    clown.onload = () => render();

    let tiles = [];
    let hoverIdx = -1;
    let scanningIdx = -1;
    let scanTimer = 0;
    let autoTimer = 0;
    let autoCursor = 0;
    let totalPeople = 0;

    function buildTerrain() {
      clearTimeout(scanTimer);
      scanningIdx = -1;
      totalPeople = 4;
      const personIndices = new Set();
      while (personIndices.size < totalPeople) {
        personIndices.add(Math.floor(Math.random() * TOTAL));
      }

      tiles = Array.from({ length: TOTAL }, (_, idx) => {
        const hasPerson = personIndices.has(idx);
        const detectedPerson = hasPerson && Math.random() < 0.88;
        const falseAlarm = !hasPerson && Math.random() < 0.24;
        const trees = Array.from({ length: 7 }, () => ({
          x: 10 + Math.random() * (TW - 20),
          y: 10 + Math.random() * (TH - 20),
          r: 5 + Math.random() * 7,
          shade: Math.random() > 0.5 ? '#3b342d' : '#2c2621',
        }));
        const px = 22 + Math.random() * (TW - 44);
        const py = 20 + Math.random() * (TH - 40);
        return {
          idx,
          hasPerson,
          detectedPerson,
          falseAlarm,
          scanned: false,
          trees,
          px,
          py,
          shade: idx % 2 === 0 ? '#463e36' : '#40382f',
        };
      });

      updateCounter();
      statusEl.textContent = 'Bir karonun üstünde dur ya da tıkla (321 ms / karo).';
      render();
    }

    window.addEventListener('langchange', () => render());

    function updateCounter() {
      const found = tiles.filter((t) => t.scanned && t.detectedPerson).length;
      countEl.textContent = `${found}/${totalPeople} insan`;
    }

    function triggerScan(idx) {
      if (idx < 0 || idx >= TOTAL) return;
      const t = tiles[idx];
      if (t.scanned || scanningIdx === idx) return;

      clearTimeout(scanTimer);
      scanningIdx = idx;
      statusEl.textContent = `karo #${String(idx + 1).padStart(2, '0')} · ESP32-P4 ölçüyor (321 ms)...`;
      render();

      scanTimer = window.setTimeout(() => {
        t.scanned = true;
        scanningIdx = -1;
        updateCounter();
        if (t.detectedPerson) {
          statusEl.textContent = `karo #${String(idx + 1).padStart(2, '0')} · 321 ms · İNSAN BULUNDU (int8) · honk`;
        } else if (t.falseAlarm) {
          statusEl.textContent = `karo #${String(idx + 1).padStart(2, '0')} · 321 ms · yanlış alarm (0,35/karo)`;
        } else if (t.hasPerson && !t.detectedPerson) {
          statusEl.textContent = `karo #${String(idx + 1).padStart(2, '0')} · 321 ms · kaçırıldı (%16,1 pay)`;
        } else {
          statusEl.textContent = `karo #${String(idx + 1).padStart(2, '0')} · 321 ms · temiz`;
        }
        render();
      }, 321);
    }

    function render() {
      ctx.clearRect(0, 0, W, H);

      tiles.forEach((t, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x0 = col * TW;
        const y0 = row * TH;

        ctx.fillStyle = t.shade;
        ctx.fillRect(x0, y0, TW, TH);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(x0 + 8, y0 + TH * 0.55, TW - 16, 4);

        t.trees.forEach((tr) => {
          ctx.fillStyle = tr.shade;
          const s = Math.round(tr.r);
          ctx.fillRect(Math.round(x0 + tr.x), Math.round(y0 + tr.y), s, s);
        });

        if (t.hasPerson) {
          const px = Math.round(x0 + t.px);
          const py = Math.round(y0 + t.py);
          if (clown.complete && clown.naturalWidth) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(clown, px - 10, py - 8, 28, 28);
          } else {
            ctx.fillStyle = RED;
            ctx.fillRect(px, py, 6, 10);
          }
        }

        if (t.scanned) {
          ctx.fillStyle = 'rgba(11, 9, 7, 0.4)';
          ctx.fillRect(x0, y0, TW, TH);

          if (t.detectedPerson) {
            const bx = Math.round(x0 + t.px - 12);
            const by = Math.round(y0 + t.py - 10);
            ctx.strokeStyle = CYAN;
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, by, 32, 32);
            ctx.fillStyle = CYAN;
            ctx.font = '700 10px "Geist Pixel", monospace';
            ctx.fillText(window.i18n && window.i18n.lang === 'en' ? 'HUMAN' : 'İNSAN', bx - 6, by - 3);
          } else if (t.falseAlarm) {
            const bx = Math.round(x0 + TW * 0.35);
            const by = Math.round(y0 + TH * 0.32);
            ctx.strokeStyle = RED;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(bx, by, 20, 20);
            ctx.fillStyle = '#fff';
            ctx.font = '600 9px "Geist Pixel", monospace';
            ctx.fillText('FP', bx + 3, by - 2);
          }
        }

        if (i === scanningIdx) {
          ctx.strokeStyle = CYAN;
          ctx.lineWidth = 2.5;
          ctx.strokeRect(x0 + 2, y0 + 2, TW - 4, TH - 4);
        } else if (i === hoverIdx) {
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x0 + 1, y0 + 1, TW - 2, TH - 2);
        }

        ctx.strokeStyle = 'rgba(11, 13, 19, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x0 + 0.5, y0 + 0.5, TW, TH);

        ctx.fillStyle = t.scanned ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)';
        ctx.font = '600 10px "Geist Pixel", monospace';
        ctx.fillText(String(i + 1).padStart(2, '0'), x0 + 5, y0 + 13);
      });
    }

    function getIdxFromEvent(e) {
      const rect = cv.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      const y = ((e.clientY - rect.top) / rect.height) * H;
      const col = Math.floor(x / TW);
      const row = Math.floor(y / TH);
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return -1;
      return row * COLS + col;
    }

    cv.addEventListener('pointermove', (e) => {
      const idx = getIdxFromEvent(e);
      if (idx !== hoverIdx) {
        hoverIdx = idx;
        triggerScan(idx);
      }
    });

    cv.addEventListener('pointerdown', (e) => {
      const idx = getIdxFromEvent(e);
      triggerScan(idx);
    });

    cv.addEventListener('pointerleave', () => {
      hoverIdx = -1;
      render();
    });

    function stopAuto() {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = 0;
      }
      if (autoBtn) {
        autoBtn.classList.remove('on');
        autoBtn.textContent = '▶ otomatik tara';
      }
    }

    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        if (autoTimer) {
          stopAuto();
          return;
        }
        autoBtn.classList.add('on');
        autoBtn.textContent = '■ durdur';
        autoCursor = 0;
        const step = () => {
          while (autoCursor < TOTAL && tiles[autoCursor].scanned) {
            autoCursor++;
          }
          if (autoCursor >= TOTAL) {
            stopAuto();
            return;
          }
          triggerScan(autoCursor);
          autoCursor++;
        };
        step();
        autoTimer = window.setInterval(step, 380);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        stopAuto();
        buildTerrain();
      });
    }

    buildTerrain();
  }

  /* ----------------------------------------------------------
     5. Üst Üste Binen Kartlar (Overstack --p hesabı)
     ---------------------------------------------------------- */
  function initStackCards() {
    const cards = Array.from(document.querySelectorAll('.stack .card'));
    if (!cards.length) return;

    const onScroll = () => {
      for (let i = 0; i < cards.length; i++) {
        const next = cards[i + 1];
        if (!next) {
          cards[i].style.setProperty('--p', '0');
          continue;
        }
        const r1 = cards[i].getBoundingClientRect();
        const r2 = next.getBoundingClientRect();
        const dist = Math.max(0, Math.min(1, 1 - (r2.top - r1.top) / 420));
        cards[i].style.setProperty('--p', dist.toFixed(3));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------------
     6. Süreç Çarkı (#wheel) — AŞAĞI KAYDIRDIKÇA TEKER TEKER DÖNER
     ---------------------------------------------------------- */
  const WHEEL_DATA = [
    {
      num: '01',
      short: 'AYIR',
      title: 'Kaynaktan Bağımsız Test Ayrımı',
      desc: 'Test metriklerinin eğitim dağılımını sızdırmaması için veri setlerini kaynağa ve sahneye göre en baştan ayırıyorum.',
      ex: 'InviolusOCR; eğitimde hiç görülmemiş 12.093 satırda (%77,3), gerçek sahne metinlerinde (TS-TR, %56,2) ve basılı belgelerde (%46,5) ayrı ayrı ölçüldü.',
    },
    {
      num: '02',
      short: 'KUR',
      title: 'Kartın İşlemlerine Göre Mimari',
      desc: 'Modeli önce GPU’da şişirip sonra karta sıkıştırmaya çalışmak yerine doğrudan TFLite Micro işlemlerine uygun kuruyorum.',
      ex: 'InviolusOCR’da BiLSTM yerine evrişimli CTC çıkışı kullanmak, int8’e geçişteki doğruluk kaybını 26–48 puandan yaklaşık 1 puana indirdi.',
    },
    {
      num: '03',
      short: 'BUDA',
      title: 'Yapısal Kanal Budama',
      desc: 'Büyük modeli eğittikten sonra kanalları yapısal olarak budayıp aynı süre sıfırdan eğitilen kontrol modelleriyle kıyaslıyorum.',
      ex: 'Small (298 KB) ve Nano (171 KB), Base’den kanal budanarak üretildi ve üç test setinde de sıfırdan eğitilen kontrolleri eşleştirilmiş testte geçti (McNemar, p ≤ 0,016).',
    },
    {
      num: '04',
      short: 'NİCEMLE',
      title: 'Tam int8 ve QAT',
      desc: 'Nicemleme farkındalıklı eğitim (QAT) ile hem ağırlıkları hem aktivasyonları tam int8’e indirip float modelle farkı ölçüyorum.',
      ex: 'VoxHOD v3 tam int8 olarak 197 KB (136.547 parametre) yer kaplıyor ve QAT sayesinde float modelden en fazla yarım puan geride kalıyor.',
    },
    {
      num: '05',
      short: 'ELE',
      title: 'Önceden Konmuş Eşik Kapısı',
      desc: 'Her fikir önceden belirlenmiş bir eşiği geçerse yayımlanıyor; geçemeyen denemeler repoda açıkça başarısız olarak yazılıyor.',
      ex: 'VoxHOD’da büyük öğretmenden damıtma (8’e karşı 8 koşu) ve SARD verisi eşiği geçemedi; Posibrain’de çoklu dron ve budama denemeleri başarısız çıktı.',
    },
    {
      num: '06',
      short: 'ÖLÇ',
      title: 'Gerçek Kartta Hız ve Sınırlar',
      desc: 'Yayımlanan TFLite dosyasını ESP32-P4 veya ESP32-C6 kartına yükleyip milisaniye ve doğruluk farkını birebir ölçüyorum.',
      ex: 'ESP32-P4’te VoxHOD karo başına 321 ms (nano 151 ms), InviolusOCR Nano ~420 ms. Henüz uçuşta veya monte donanımda denenmeyenler README’de açıkça yazılı.',
    },
  ];

  function initWheel() {
    const track = document.getElementById('surec');
    const wheel = document.getElementById('wheel');
    const ring = document.getElementById('wheel-ring');
    const ticksSvg = document.getElementById('wheel-ticks');
    const numEl = document.getElementById('wheel-num');
    const nameEl = document.getElementById('wheel-name');
    const idxEl = document.getElementById('wd-idx');
    const barEl = document.getElementById('wd-progress-bar');
    const titleEl = document.getElementById('wd-title');
    const descEl = document.getElementById('wd-desc');
    const exEl = document.getElementById('wd-ex');
    const prevBtn = document.getElementById('wd-prev');
    const nextBtn = document.getElementById('wd-next');
    const detailBox = document.querySelector('.wheel-detail');

    if (!wheel || !ring || !ticksSvg || !titleEl) return;

    // Zindan haritası: 6 aşama 6 oda, aralarında yol; Erdem seçili odaya yürür (yılan düzeni: üstte soldan sağa, altta sağdan sola)
    const ns = 'http://www.w3.org/2000/svg';
    const N = WHEEL_DATA.length;
    const POS = [[16, 27], [50, 27], [84, 27], [84, 76], [50, 76], [16, 76]];
    const segs = [];
    for (let i = 0; i < N - 1; i++) {
      const ln = document.createElementNS(ns, 'line');
      ln.setAttribute('x1', POS[i][0]);
      ln.setAttribute('y1', POS[i][1]);
      ln.setAttribute('x2', POS[i + 1][0]);
      ln.setAttribute('y2', POS[i + 1][1]);
      ln.setAttribute('class', 'seg');
      ticksSvg.appendChild(ln);
      segs.push(ln);
    }
    const hero = document.createElement('img');
    hero.className = 'wheel-hero';
    hero.src = 'img/logo-nav.png';
    hero.alt = '';
    hero.setAttribute('aria-hidden', 'true');
    wheel.appendChild(hero);
    const labels = WHEEL_DATA.map((item, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'wheel-label';
      btn.style.left = POS[i][0] + '%';
      btn.style.top = POS[i][1] + '%';
      btn.innerHTML = `<b>${item.num}</b>${item.short}`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        scrollToStage(i);
      });
      ring.appendChild(btn);
      return btn;
    });
    let active = -1;
    let lockUntil = 0;
    let lockTarget = 0;
    function selectStage(idx) {
      const nextIdx = ((idx % N) + N) % N;
      if (nextIdx === active) return;
      active = nextIdx;

      labels.forEach((lb, i) => lb.classList.toggle('active', i === active));
      segs.forEach((sg, i) => sg.classList.toggle('done', i < active));
      labels.forEach((lb, i) => lb.classList.toggle('past', i < active));
      hero.style.left = POS[active][0] + '%';
      hero.style.top = POS[active][1] + '%';

      const d = WHEEL_DATA[active];
      numEl.textContent = d.num;
      nameEl.textContent = d.short;
      idxEl.textContent = `AŞAMA // ${d.num} / 06`;
      if (barEl) barEl.style.width = `${((active + 1) / N) * 100}%`;
      titleEl.textContent = d.title;
      descEl.textContent = d.desc;
      exEl.textContent = d.ex;

      if (detailBox) {
        detailBox.classList.remove('swap');
        void detailBox.offsetWidth;
        detailBox.classList.add('swap');
      }
    }

    function scrollToStage(targetIdx) {
      const clamped = Math.max(0, Math.min(N - 1, targetIdx));
      if (track) {
        const rect = track.getBoundingClientRect();
        const trackTop = window.scrollY + rect.top;
        const scrollable = Math.max(1, track.offsetHeight - window.innerHeight);
        const y = trackTop + (clamped / (N - 0.15)) * scrollable + 8;
        lockUntil = performance.now() + 1600;
        lockTarget = y;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      selectStage(clamped);
    }

    // Sayfa aşağı kaydıkça çark teker teker döner
    if (track) {
      const onScroll = () => {
        if (lockUntil) {
          if (performance.now() > lockUntil || Math.abs(window.scrollY - lockTarget) < 6) lockUntil = 0;
          else return;
        }
        const rect = track.getBoundingClientRect();
        const scrollable = Math.max(1, track.offsetHeight - window.innerHeight);
        const scrolled = -rect.top;
        if (scrolled < -window.innerHeight || scrolled > scrollable + window.innerHeight) return;
        const p = Math.max(0, Math.min(0.9999, scrolled / scrollable));
        const stageIdx = Math.floor(p * N);
        selectStage(stageIdx);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    if (prevBtn) prevBtn.addEventListener('click', () => scrollToStage((active - 1 + N) % N));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollToStage((active + 1) % N));

    wheel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToStage((active + 1) % N);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToStage((active - 1 + N) % N);
      }
    });

    selectStage(0);
  }

  /* ----------------------------------------------------------
     7. Sığar mı? — Disket Karşılaştırması (#sigar)
     ---------------------------------------------------------- */
  const MODELS = [
    {
      id: 'pos-half',
      name: 'Posibrain (yarım genişlik)',
      sub: 'int8 · 13,7 bin parametre · simülasyon',
      kb: 21.8,
      lat: 'simülasyon (kuralla başa baş)',
      on: true,
    },
    {
      id: 'pos-full',
      name: 'Posibrain (tam)',
      sub: 'int8 · 52 bin parametre · simülasyon',
      kb: 60.8,
      lat: 'simülasyon (1 km’de kuralı geçti)',
      on: true,
    },
    {
      id: 'vox-nano',
      name: 'VoxHOD Nano',
      sub: 'int8 · arama-kurtarma kişi tespiti',
      kb: 75,
      lat: 'ESP32-P4: 151 ms / karo',
      on: true,
    },
    {
      id: 'ocr-nano',
      name: 'InviolusOCR Nano',
      sub: 'int8 · Türkçe satır OCR (budanmış)',
      kb: 171,
      lat: 'ESP32-P4: ~420 ms / satır',
      on: true,
    },
    {
      id: 'vox-v3',
      name: 'VoxHOD v3',
      sub: 'int8 · 136.547 parametre · HERIDAL %83,9',
      kb: 197,
      lat: 'ESP32-P4: 321 ms / karo',
      on: true,
    },
    {
      id: 'ocr-small',
      name: 'InviolusOCR Small',
      sub: 'int8 · Türkçe satır OCR (budanmış)',
      kb: 298,
      lat: 'ESP32-P4: 760 ms / satır',
      on: true,
    },
    {
      id: 'ocr-base',
      name: 'InviolusOCR Base',
      sub: 'int8 · %77,3 görülmemiş satırda tam doğru',
      kb: 598,
      lat: 'referans int8 model',
      on: true,
    },
    {
      id: 'vox-scout',
      name: 'VoxScout (yer istasyonu)',
      sub: 'int8 · EfficientNet-B0 · 4,4M parametre',
      kb: 5324.8,
      lat: '4–5× daha az yanlış alarm (yer istasyonu)',
      on: false,
    },
  ];

  function initFloppyFit() {
    const listEl = document.getElementById('fit-list');
    const sumSmall = document.getElementById('fit-sum-small');
    const totalEl = document.getElementById('fit-total');
    const countEl = document.getElementById('fit-count');
    const floppiesEl = document.getElementById('fit-floppies');
    const verdictEl = document.getElementById('fit-verdict');
    const latEl = document.getElementById('fit-lat');
    if (!listEl || !totalEl || !floppiesEl) return;

    const FLOPPY_KB = 1440;

    function formatKB(kb) {
      if (kb >= 1024) {
        return (kb / 1024).toFixed(2).replace('.', ',') + ' MB';
      }
      return (kb % 1 === 0 ? String(kb) : kb.toFixed(1).replace('.', ',')) + ' KB';
    }

    function render() {
      listEl.innerHTML = '';
      MODELS.forEach((m) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fit-row';
        btn.setAttribute('aria-pressed', m.on ? 'true' : 'false');
        btn.innerHTML = `
          <span class="ar">↳</span>
          <span class="bx">[${m.on ? 'x' : ' '}]</span>
          <span class="nm">${m.name}<small>${m.sub}</small></span>
          <span class="kb">${formatKB(m.kb)}</span>
        `;
        btn.addEventListener('click', () => {
          m.on = !m.on;
          render();
        });
        li.appendChild(btn);
        listEl.appendChild(li);
      });

      const active = MODELS.filter((m) => m.on);
      const sum = active.reduce((acc, m) => acc + m.kb, 0);
      totalEl.textContent = formatKB(sum);
      countEl.textContent = `${active.length} model seçili`;
      if (sumSmall) sumSmall.textContent = `${Math.round((sum / FLOPPY_KB) * 100)}% / 1,44 MB`;

      const diskCount = Math.max(1, Math.ceil(sum / FLOPPY_KB));
      floppiesEl.innerHTML = '';
      for (let i = 0; i < diskCount; i++) {
        const rem = Math.max(0, Math.min(FLOPPY_KB, sum - i * FLOPPY_KB));
        const pct = Math.round((rem / FLOPPY_KB) * 100);
        const d = document.createElement('div');
        d.className = 'floppy';
        d.innerHTML = `<div class="fl-label"><div class="fl-fill" style="width:${pct}%"></div><span>${pct}%</span></div>`;
        floppiesEl.appendChild(d);
      }

      if (sum === 0) {
        verdictEl.textContent = 'Soldan en az bir model seç.';
      } else if (sum <= FLOPPY_KB) {
        const left = (FLOPPY_KB - sum).toFixed(1).replace('.', ',');
        verdictEl.textContent = `Seçtiğin ${active.length} modelin tamamı tek bir 1,44 MB diskete sığıyor; geriye ${left} KB boş yer kalıyor.`;
      } else {
        verdictEl.textContent = `Yer istasyonu modeli (VoxScout, 5,2 MB) eklendiğinde toplam ${diskCount} disket gerekiyor; mikrodenetleyici modellerinin tamamı ise tek diskete sığıyor.`;
      }

      if (latEl) {
        latEl.innerHTML = active
          .map((m) => `<li><span>${m.name}</span><span>${m.lat}</span></li>`)
          .join('');
      }
    }

    render();
  }

  /* ----------------------------------------------------------
     8. Kayıt Defteri (#deck) — AŞAĞI KAYDIRDIKÇA TEKER TEKER GEÇER
     ---------------------------------------------------------- */
  const LOG_ENTRIES = [
    {
      tag: 'DENEYİM · SÖZLEŞMELİ / STAJYER',
      when: '2026',
      text: 'OME Marketing (Dubai, uzaktan) için Expo (React Native) ve Supabase kullanarak "Onaylı Emlak" emlak pazaryeri mobil uygulamasını geliştirdim ve Stripe ödeme entegrasyonunu ekledim.',
      who: 'OME Marketing · Dubai (Uzaktan)',
      sub: 'Onaylı Emlak · Expo, React Native, Supabase, Stripe',
    },
    {
      tag: 'SAHA VERİSİ · İŞ BİRLİĞİ',
      when: '2026',
      text: 'Hava Kuvvetlerinde 21 yıl görev yapmış Ferhat Tatık’ın çektiği Türk drone görüntüleriyle VoxHOD-NC (v2) dalını eğittim; o görüntülerde bulunan kişi oranı %32,9’dan %62,2’ye çıktı.',
      who: 'VoxHOD-NC (CC BY-NC 4.0)',
      sub: 'Türk drone görüntüleri · yanlış alarm hâlâ yüksek, deneysel',
    },
    {
      tag: 'EĞİTİM · ÖN LİSANS',
      when: 'OCAK 2027',
      text: 'Karadeniz Teknik Üniversitesi Trabzon MYO Bilgisayar Programcılığı programında C#, Python, Kotlin/Android, SQL Server ve Orange3 ile makine öğrenmesi iş akışları üzerine çalıştım.',
      who: 'Karadeniz Teknik Üniversitesi',
      sub: 'Bilgisayar Programcılığı · Ocak 2027 mezuniyet beklentisi',
    },
    {
      tag: 'DENEYİM · TAM ZAMANLI',
      when: '2022–2024',
      text: 'Ankara’da Infrew bünyesinde geliri artırmaya yönelik satış planları hazırlayıp uyguladım; şirketin web sitesi ve çevrimiçi yayınları için teknik ve ticari içerik yazdım.',
      who: 'Infrew · Ankara',
      sub: 'Satış Uzmanı · Ocak 2022 – Ocak 2024',
    },
    {
      tag: 'BAŞLANGIÇ · ALGORİTMA & ARDUINO',
      when: '2018–2019',
      text: 'Gençlik ve Spor Bakanlığı’nın Sinop’taki devlet destekli "Kod Adı 2023" programında temel algoritmaları öğrendim ve Arduino ile ilk donanım adımlarımı burada attım.',
      who: 'Kod Adı 2023 · Sinop',
      sub: 'Ekim 2018 – Nisan 2019',
    },
  ];

  const LOG_META = [["ome-marketing.log", "312kb", [["Expo büyüsü", 9], ["Stripe sabrı", 7], ["Saat dilimi uyumu", 4]]], ["voxhod-nc.bin", "197kb", [["int8 nicemleme", 9], ["Yanlış alarm affı", 3], ["Drone görüntü açlığı", 10]]], ["ktu-myo.pdf", "2027kb", [["Staj motivasyonu", 1], ["Orange3 sevgisi", 1], ["Sabah dersi", 1]]], ["infrew-satis.xlsx", "24kb", [["İkna gücü", 8], ["Excel dayanıklılığı", 9], ["Telefon ezberi", 5]]], ["kod-adi-2023.ino", "8kb", [["Arduino LED yakma", 10], ["Algoritma sezgisi", 5], ["Kablo karmaşası", 9]]]];

  function initDeck() {
    const track = document.getElementById('kayit');
    const deck = document.getElementById('deck');
    const countEl = document.getElementById('deck-count');
    const stepsEl = document.getElementById('deck-steps');
    if (!deck || !track) return;

    const N = LOG_ENTRIES.length;
    const pips = (v) => Array.from({ length: 10 }, (_, k) => `<i${k < v ? ' class="on"' : ''}></i>`).join('');

    deck.innerHTML = LOG_ENTRIES.map((it, i) => {
      const m = LOG_META[i];
      return `
      <article class="fs-tile" data-i="${i}">
        <div class="fs-img">
          <p class="fs-tag">${it.tag}</p>
          <h3 class="fs-who">${it.who}</h3>
          <p class="fs-text">“${it.text}”</p>
          <span class="fs-year" aria-hidden="true">${it.when}</span>
        </div>
        <div class="fs-cap"><span>${m[0]}</span><span>${m[1]}</span></div>
        <ul class="fs-stats">${m[2].map((r) => `<li><span>${r[0]}</span><b>${pips(r[1])}</b></li>`).join('')}</ul>
      </article>`;
    }).join('');

    const tiles = [...deck.querySelectorAll('.fs-tile')];
    const dots = [];
    if (stepsEl) {
      for (let i = 0; i < N; i++) {
        const d = document.createElement('span');
        d.className = 'deck-step-dot';
        stepsEl.appendChild(d);
        dots.push(d);
      }
    }

    let maxShift = 0;
    function measure() {
      const view = deck.parentElement;
      maxShift = Math.max(0, deck.scrollWidth - view.clientWidth);
    }

    let activeIdx = -1;
    function update() {
      const rect = track.getBoundingClientRect();
      const scrollable = Math.max(1, track.offsetHeight - window.innerHeight);
      const p = Math.max(0, Math.min(1, -rect.top / scrollable));
      deck.style.transform = `translate3d(${(-p * maxShift).toFixed(1)}px,0,0)`;
      const idx = Math.max(0, Math.min(N - 1, Math.round(p * (N - 1))));
      if (idx !== activeIdx) {
        activeIdx = idx;
        tiles.forEach((t, i) => t.classList.toggle('on', i === idx));
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        if (countEl) countEl.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
      }
    }

    tiles.forEach((t, i) => t.addEventListener('click', () => {
      const rect = track.getBoundingClientRect();
      const scrollable = Math.max(1, track.offsetHeight - window.innerHeight);
      const y = window.scrollY + rect.top + (i / (N - 1)) * scrollable;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }));

    let q = false;
    window.addEventListener('scroll', () => {
      if (q) return;
      q = true;
      requestAnimationFrame(() => { q = false; update(); });
    }, { passive: true });
    window.addEventListener('resize', () => { measure(); update(); });
    measure();
    update();
    window.addEventListener('load', () => { measure(); update(); });
  }

  /* ----------------------------------------------------------
     9. SSS: Kâğıt Kapak → Açılan Kapı (.faq-item)
     ---------------------------------------------------------- */
  function initFaq() {
    const folds = [...document.querySelectorAll('.fold')];
    folds.forEach((f) => {
      const head = f.querySelector('.fold-head');
      head.addEventListener('click', () => {
        const willOpen = !f.classList.contains('open');
        folds.forEach((o) => {
          o.classList.remove('open');
          o.querySelector('.fold-head').setAttribute('aria-expanded', 'false');
        });
        if (willOpen) {
          f.classList.add('open');
          head.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ----------------------------------------------------------
     10. Kapanış sloganı: satırlar görününce yanar
     ---------------------------------------------------------- */
  function initSlogan() {
    const seqLines = document.querySelectorAll('.seq-line');
    if (seqLines.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) en.target.classList.add('on');
          });
        },
        { threshold: 0.35 }
      );
      seqLines.forEach((el) => io.observe(el));
    } else {
      seqLines.forEach((el) => el.classList.add('on'));
    }
  }

  /* ----------------------------------------------------------
     Hero: nokta alanı. Pürüzsüz dalga (float), imleç yakınında
     basamaklı değerlere (int8) yuvarlanır ve turuncuya döner.
     ---------------------------------------------------------- */
  function initHeroField() {
    const cv = document.getElementById('field');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const STEP = 24;
    const R = 150;
    let w = 0;
    let h = 0;
    let pts = [];
    let visible = true;
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width;
      h = r.height;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = [];
      for (let y = STEP / 2; y < h; y += STEP) {
        for (let x = STEP / 2; x < w; x += STEP) pts.push({ x, y });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const z = Math.sin(p.x * 0.011 + t * 0.0007) * Math.cos(p.y * 0.015 - t * 0.0005);
        let oy = z * 13;
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < R) {
          const k = 1 - dist / R;
          const snapped = Math.round(oy / 6.5) * 6.5;
          oy = oy + (snapped - oy) * Math.min(1, k * 2.2);
          const size = 2 + k * 3;
          ctx.fillStyle = `rgba(237, 103, 15, ${0.35 + k * 0.65})`;
          ctx.fillRect(Math.round(p.x - size / 2), Math.round(p.y + oy - size / 2), size, size);
        } else {
          const a = 0.22 + (z + 1) * 0.14;
          ctx.fillStyle = `rgba(246, 245, 241, ${a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y + oy, 1.15, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function loop(t) {
      if (visible) draw(t);
      requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener('resize', resize);
    const hero = cv.parentElement;
    hero.addEventListener('pointermove', (e) => {
      const r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', () => {
      mouse.x = -9999;
      mouse.y = -9999;
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => {
        visible = en[0].isIntersecting;
      }).observe(hero);
    }
    if (reduce) {
      draw(0);
    } else {
      requestAnimationFrame(loop);
    }
  }

  /* ----------------------------------------------------------
     Başlat
     ---------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    drawSprites();
    initBoot();
    initNav();
    initHeroField();
    initScanner();
    initStackCards();
    initWheel();
    initFloppyFit();
    initDeck();
    initFaq();
    initSlogan();
    // alt bilgi adı artık ember.js içinde
  });
})();
