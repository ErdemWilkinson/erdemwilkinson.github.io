/* Dil değiştirme: TR / EN.
   Sayfadaki (ve JS'in sonradan ürettiği) Türkçe metinleri bir sözlükle İngilizceye çevirir.
   Özgün Türkçe metin her düğümde saklanır, TR'ye dönünce geri yazılır.
   Tercih localStorage'da ('lang') ya da ?lang=en ile belirlenir. */
(() => {
  'use strict';

  const DICT = {
    /* ---------- üst menü / hero ---------- */
    'Erdem Aslan · Gömülü Sistemler, TinyML, Web ve Mobil': 'Erdem Aslan · Embedded Systems, TinyML, Web and Mobile',
    '3D model': '3D model',
    'İşler': 'Work',
    'Süreç': 'Process',
    'Disket': 'Floppy',
    'Geçmiş': 'History',
    'E-posta gönder': 'Send email',
    'E-posta': 'Email',
    'Junior yazılım geliştirici · staj ve freelance işlere açığım': 'Junior software developer · open to internships and freelance work',
    'Yapay zekâyı': 'I fit AI',
    'mikrodenetleyiciye sığdırıyorum.': 'onto microcontrollers.',
    'Ben Erdem. ESP32 için C ile yazılım yazıyor ve tam int8 modeller eğitiyorum. Web ve mobilde TypeScript, React ve Kotlin kullanıyorum. Aşağıda projelerimi, ölçtüğüm sayıları ve henüz denemediğim şeyleri bulabilirsin.':
      "I'm Erdem. I write C software for the ESP32 and train full-int8 models. On web and mobile I use TypeScript, React and Kotlin. Below you'll find my projects, the numbers I measured, and the things I haven't tried yet.",
    'İşlere bak ↓': 'See my work ↓',
    'Dosya': 'File',
    'Düzen': 'Edit',
    'Görünüm': 'View',
    'Tara': 'Scan',
    '▶ otomatik tara': '▶ auto scan',
    '■ durdur': '■ stop',
    '↻ yeni arazi': '↻ new terrain',
    'Bir karonun üstünde dur.': 'Hover over a tile.',
    'Bir karonun üstünde dur ya da tıkla (321 ms / karo).': 'Hover over a tile or click it (321 ms / tile).',
    "197 KB · int8 · 24 karo. Bu bir simülasyon ve hedefleri şaka olsun diye böyle çizdim: kişiyi bulma olasılığı (%83,9) ve karo başına yanlış alarm (0,35) VoxHOD v3'ün HERIDAL test sonuçlarından, karo süresi (321 ms) ESP32-P4 ölçümünden alındı.":
      "197 KB · int8 · 24 tiles. This is a simulation, and I drew the targets like this as a joke: the chance of finding a person (83.9%) and the false alarms per tile (0.35) come from VoxHOD v3's HERIDAL test results; the tile time (321 ms) comes from an ESP32-P4 measurement.",
    'görülmemiş satırda tam doğru': 'exact match on unseen lines',
    "int8, HERIDAL'da %83,9 kişi": 'int8, 83.9% of people found on HERIDAL',
    '%77,3': '77.3%',
    'karo başına, kartta ölçüldü': 'per tile, measured on the board',
    'int8, arama-kurtarma kişi tespiti': 'int8, search-and-rescue person detection',
    'dünyanın en küçük dedektörlerinden biri': 'one of the smallest detectors in the world',

    /* ---------- 3D atölye ---------- */
    '3D atölye': '3D workshop',
    'Dronlar ve makeshift-flipper': 'Drones and makeshift-flipper',
    'sürükle: döndür · tekerlek: yakınlaştır': 'drag: rotate · wheel: zoom',
    '⊞ Patlatılmış Görünüm': '⊞ Exploded View',
    '⊟ Birleştir': '⊟ Assemble',
    '◎ Arama Konisi: AÇIK': '◎ Search Cone: ON',
    '◎ Arama Konisi: KAPALI': '◎ Search Cone: OFF',
    '◎ Posibrain Oto-Rota: AÇIK': '◎ Posibrain Auto-Route: ON',
    '◎ Posibrain Oto-Rota: KAPALI': '◎ Posibrain Auto-Route: OFF',
    '▶ LCD Ekran Değiştir': '▶ Switch LCD Screen',
    '↗ Oklar: AÇIK': '↗ Arrows: ON',
    '↗ Oklar: KAPALI': '↗ Arrows: OFF',
    '↻ Kamerayı Sıfırla': '↻ Reset Camera',
    '4S LiPo Batarya': '4S LiPo Battery',
    '1850 mAh · XT60 Güç': '1850 mAh · XT60 Power',
    'ESP32-P4 v1.3 Kartı': 'ESP32-P4 v1.3 Board',
    'VoxHOD v3 · 197 KB int8': 'VoxHOD v3 · 197 KB int8',
    '4-in-1 45A ESC + FC': '4-in-1 45A ESC + FC',
    'STM32 · 3-Faz Motor Sürücü': 'STM32 · 3-Phase Motor Driver',
    'M10 GPS + 5.8GHz Anten': 'M10 GPS + 5.8GHz Antenna',
    'SAR Koordinat & Telemetri': 'SAR Coordinates & Telemetry',
    'Ön FPV Kamera (+Z)': 'Front FPV Camera (+Z)',
    'İleri Görüş · Seyir': 'Forward View · Navigation',
    'Alt Nadir Kamera (-Y)': 'Lower Nadir Camera (-Y)',
    'Aşağı Tarama · MIPI-CSI': 'Downward Scan · MIPI-CSI',
    '2S Mikro LiPo + Kanopi': '2S Micro LiPo + Canopy',
    'Hafif Güç Paketi': 'Lightweight Power Pack',
    'Posibrain RL Kartı': 'Posibrain RL Board',
    '60,8 KB · PPO Arama Politikası': '60.8 KB · PPO Search Policy',
    'VoxHOD Nano Kartı': 'VoxHOD Nano Board',
    '75 KB · 151 ms · 218 KB Arena': '75 KB · 151 ms · 218 KB Arena',
    'Kanallı Koruma (Ducted)': 'Ducted Prop Guards',
    '4× Dar Alan Pervane Koruması': '4× Tight-Space Prop Shrouds',
    'Ön Seyir Kamerası (+Z)': 'Front Nav Camera (+Z)',
    'ToF Engel Algılama': 'ToF Obstacle Sensing',
    '15×15 Posibrain Tarama': '15×15 Posibrain Scan',
    'Pico-LCD-1.3 Ekran': 'Pico-LCD-1.3 Display',
    '240×240 IPS · Joystick + 4 Tuş': '240×240 IPS · Joystick + 4 Keys',
    'ESP32-C6-DEV-KIT-N8': 'ESP32-C6-DEV-KIT-N8',
    'Wi-Fi 6 · BLE 5 · 8 MB Flash': 'Wi-Fi 6 · BLE 5 · 8 MB Flash',
    'TP4056 + MT3608 Güç': 'TP4056 + MT3608 Power',
    'USB-C Şarj · 5V Boost': 'USB-C Charger · 5V Boost',
    '46×18 Perfboard Omurga': '46×18 Perfboard Spine',
    '118×46 mm · 64 Lehimli Tel': '118×46 mm · 64 Soldered Wires',
    'RC522 NFC (13.56 MHz)': 'RC522 NFC (13.56 MHz)',
    'SPI · Açık Okuma Yüzü': 'SPI · Open Reading Face',
    'RDM6300 + 125 kHz Bobin': 'RDM6300 + 125 kHz Coil',
    'Bobin İçi RFID · Karton/LiPo': 'In-Coil RFID · Cardboard/LiPo',
    'HAVA ARACI · TINYML PAYLOAD': 'AIRCRAFT · TINYML PAYLOAD',
    'ESP32-P4 üzerinde 197 KB tam int8 kişi tespit modeli (VoxHOD v3) ve 60,8 KB arama politikası (Posibrain) taşımak üzere kurgulanmış dört pervaneli arama-kurtarma drone konsepti.':
      'A four-propeller search-and-rescue drone concept built to carry a 197 KB full-int8 person detector (VoxHOD v3) and a 60.8 KB search policy (Posibrain) on an ESP32-P4.',
    '1. NESİL SAHA ARACI · AÇIK X-ŞASİ': '1ST-GEN FIELD VEHICLE · OPEN X-FRAME',
    '4S 1850 mAh LiPo, 4-in-1 45A ESC (3-faz kablolu), STM32 uçuş kontrolcüsü, M10 GPS direği ve MIPI-CSI şerit kablosuyla alt nadir kameraya bağlı ESP32-P4 v1.3 kartı. Ön FPV kamera ileri (+Z), alt gimbal tam aşağı (-Y) bakar.':
      '4S 1850 mAh LiPo, 4-in-1 45A ESC (3-phase wired), STM32 flight controller, M10 GPS mast, and an ESP32-P4 v1.3 board linked to the downward nadir camera by a MIPI-CSI ribbon cable. The front FPV camera looks forward (+Z); the lower gimbal looks straight down (-Y).',
    'Dedektör': 'Detector',
    'Hız (ESP32-P4)': 'Speed (ESP32-P4)',
    '321 ms/karo · 332 KB Arena': '321 ms/tile · 332 KB arena',
    'HERIDAL Yakalama': 'HERIDAL Catch Rate',
    '%83,9 @ 0,35 yanlış alarm': '83.9% @ 0.35 false alarms',
    'Çift Kamera': 'Dual Camera',
    'Ön FPV (+Z) · Alt Nadir (-Y)': 'Front FPV (+Z) · Lower Nadir (-Y)',
    'Patlatılmış Görünüm ve Oklar düğmesiyle 4-in-1 ESC, Uçuş Kontrolcüsü, ESP32-P4 v1.3 kartı ve MIPI-CSI bağlantısını tek tek inceleyebilirsin.':
      'Use Exploded View and the Arrows toggle to inspect the 4-in-1 ESC, flight controller, ESP32-P4 v1.3 board, and MIPI-CSI link up close.',
    'NANO (75 KB) + POSIBRAIN (60.8 KB) // MİKRO-SAR': 'NANO (75 KB) + POSIBRAIN (60.8 KB) // MICRO-SAR',
    '2. NESİL MİKRO KEŞİF · KANALLI (DUCTED)': '2ND-GEN MICRO RECON · DUCTED',
    'Ağır gimbal ve açık pervaneler yerine orman-içi/dar alan taraması için 4 kanallı koruma halkası, 2S mikro LiPo, gömülü alt kamera ve üst üste VOXHOD NANO (75 KB) + POSIBRAIN RL (60,8 KB) çift kart mimarisi.':
      'Instead of a heavy gimbal and open propellers: four ducted guard rings for under-canopy and tight-space scanning, a 2S micro LiPo, an embedded lower camera, and a stacked dual-board architecture of VOXHOD NANO (75 KB) + POSIBRAIN RL (60.8 KB).',
    'Toplam Flash (2 Model)': 'Total Flash (2 Models)',
    '135,8 KB (Yarım Posi ile 96,8 KB)': '135.8 KB (96.8 KB with half Posi)',
    'Toplam Tensor Arena': 'Total Tensor Arena',
    '218 KB (paylaşımlı) / ~230 KB (ayrı)': '218 KB (shared) / ~230 KB (separate)',
    'ESP32-P4 (569 KB boş)': 'ESP32-P4 (569 KB free)',
    '✅ %38–40 SRAM · ~153 ms/adım': '✅ 38–40% SRAM · ~153 ms/step',
    'ESP32-S3 (350 KB boş)': 'ESP32-S3 (350 KB free)',
    '✅ %62–66 SRAM (Wi-Fi açıkken %87)': '✅ 62–66% SRAM (87% with Wi-Fi on)',
    'Sonuç: KALDIRIYOR. İki model birlikte tek bir VoxHOD v3’ten (197 KB) bile hafiftir; Patlatılmış Görünüm ve Oklar ile iki kartı yakından inceleyebilirsin.':
      'Result: IT FITS. The two models together are lighter than even a single VoxHOD v3 (197 KB); use Exploded View and Arrows to inspect both boards closely.',
    'GERÇEK BOM · 46×18 PERFBOARD + 26 PARÇA': 'REAL BOM · 46×18 PERFBOARD + 26 PARTS',
    'Repodaki (hardware/perfboard/bare_stack.html) kasasız mimari: 118×46 mm perfboard üstünde Waveshare ESP32-C6-DEV-KIT-N8, Pico-LCD-1.3, TP4056 ve MT3608; altında karton-LiPo sandviçi, RC522 ve bobin içi RDM6300.':
      'The caseless architecture in the repo (hardware/perfboard/bare_stack.html): a Waveshare ESP32-C6-DEV-KIT-N8, Pico-LCD-1.3, TP4056 and MT3608 on a 118×46 mm perfboard; underneath a cardboard-LiPo sandwich, an RC522 and an in-coil RDM6300.',
    'Üst Yüz': 'Top Face',
    'Güç & Sürücü': 'Power & Driver',
    'Omurga & Sandviç': 'Spine & Sandwich',
    '46×18 Perfboard (64 tel) + Karton/LiPo': '46×18 Perfboard (64 wires) + Cardboard/LiPo',
    'Açık Okuma Yüzü': 'Open Reading Face',
    'RC522 (13.56MHz) + RDM6300 Bobin İçi': 'RC522 (13.56MHz) + RDM6300 In-Coil',
    'Patlatılmış Görünüm ve Oklar düğmesiyle RC522, RDM6300, TP4056, MT3608 ve ESP32-C6 katmanlarını tek tek inceleyebilirsin.':
      'Use Exploded View and the Arrows toggle to inspect the RC522, RDM6300, TP4056, MT3608, and ESP32-C6 layers one by one.',

    /* ---------- işler ---------- */
    'İşler ve ölçümler': 'Work and measurements',
    'Ürettiğim, ölçtüğüm ve sınırlarını yazdığım projeler': 'Projects I built, measured, and wrote the limits of',
    'TinyML · Türkçe OCR': 'TinyML · Turkish OCR',
    'Tek satır basılı Türkçe metni okuyan, tam int8 evrişimli CTC tanıyıcı. Üç boyutta Hugging Face\'te yayında.':
      'A full-int8 convolutional CTC recognizer that reads a single line of printed Turkish text. Published on Hugging Face in three sizes.',
    'eğitimde görülmemiş 12.093 satırda tam doğru': 'exact match on 12,093 lines unseen in training',
    "Nano, ESP32-P4'te satır başına": 'Nano, per line on the ESP32-P4',
    'ölçüldü': 'measured',
    'Gerçek sahne metninde (TS-TR) %56,2, basılı belge satırlarında %46,5 tam doğru.': '56.2% exact on real scene text (TS-TR), 46.5% on printed document lines.',
    "BiLSTM yerine evrişimli çıkış: int8'e geçişteki kayıp 26–48 puandan yaklaşık 1 puana indi.": 'A convolutional output instead of a BiLSTM: the int8 conversion loss dropped from 26–48 points to about 1 point.',
    "Small ve Nano, Base'den kanal budanarak elde edildi; sıfırdan eğitilen kontrolleri üç test setinde geçti (McNemar, p ≤ 0,016).":
      'Small and Nano were obtained by channel-pruning Base; they beat from-scratch controls on three test sets (McNemar, p ≤ 0.016).',
    '240 gerçek fotoğrafta kart ile bilgisayar arasındaki fark en fazla 1,7 puan.': 'On 240 real photos, the gap between the board and the computer is at most 1.7 points.',
    'sınır': 'limits',
    'Yalnızca tek satır okur; satırları sayfada bulmak ayrı bir adım.': 'Reads only a single line; finding the lines on a page is a separate step.',
    'Basılı belge satırlarında doğruluk hâlâ yarının altında.': 'Accuracy on printed document lines is still below half.',
    'TinyML · Arama-kurtarma': 'TinyML · Search and rescue',
    'Drone görüntüsünde kişi bulan, tamamen sıfırdan kurulup eğitilmiş, çapasız (CenterNet tarzı) dedektör. Yalnızca TFLite Micro işlemleri kullanır.':
      'A person detector for drone imagery, built and trained entirely from scratch, anchor-free (CenterNet style). Uses only TFLite Micro ops.',
    'v3 int8 · 136.547 parametre · nano 75 KB': 'v3 int8 · 136,547 parameters · nano 75 KB',
    "HERIDAL'da (3.507 karo) bulunan kişi, karo başına 0,35 yanlış alarm": 'people found on HERIDAL (3,507 tiles), 0.35 false alarms per tile',
    "ESP32-P4'te karo başına · nano 151 ms": 'per tile on the ESP32-P4 · nano 151 ms',
    'Nicemleme farkındalıklı eğitim (QAT) ile int8 sürüm float modelden en fazla yarım puan geride.': 'With quantization-aware training (QAT), the int8 version trails the float model by at most half a point.',
    "Yayımlanan dosyalar ESP32-P4'te birebir ölçüldü.": 'The published files were measured one-to-one on the ESP32-P4.',
    "Ticari olmayan VoxHOD-NC (v2): Türk drone görüntülerinde bulunan kişi oranı %32,9'dan %62,2'ye çıktı.": 'Non-commercial VoxHOD-NC (v2): the share of people found in Turkish drone footage rose from 32.9% to 62.2%.',
    'ölçülmedi / geçemedi': "not measured / didn't pass",
    'Henüz uçuşta denenmedi.': 'Not yet tested in flight.',
    "Başka bir kamerada (WiSARD) oran %61,3'e düşüyor.": 'On another camera (WiSARD) the rate drops to 61.3%.',
    "Damıtma (8'e karşı 8 koşu) ve SARD verisi eşiği geçemedi, yayımlanmadı.": "Distillation (8-vs-8 runs) and SARD data didn't pass the threshold and were not published.",
    'Yer istasyonu · İkinci aşama': 'Ground station · Second stage',
    "VoxHOD'un büyük kardeşi. Google'ın EfficientNet-B0 gövdesine (ImageNet) VoxHOD'un tespit başlığı eklenip tüm ağ HERIDAL ile eğitildi. Mikrodenetleyici için değil.":
      "VoxHOD's bigger sibling. Google's EfficientNet-B0 backbone (ImageNet) with VoxHOD's detection head, the whole network trained on HERIDAL. Not for microcontrollers.",
    '5,2 MB': '5.2 MB',
    'int8 · 4,4 milyon parametre': 'int8 · 4.4 million parameters',
    'aynı yakalama oranında daha az yanlış alarm': 'fewer false alarms at the same catch rate',
    'cihaz hızı henüz ölçülmedi': 'on-device speed not measured yet',
    'Aynı veriyle eğitilmiş VoxHOD modellerine göre 4–5 kat daha az yanlış alarm (int8).': '4–5× fewer false alarms than VoxHOD models trained on the same data (int8).',
    'Kazancın kaynağı boyut değil, ImageNet ön eğitimi.': 'The gain comes from ImageNet pretraining, not size.',
    'ölçülmedi': 'not measured',
    'Cihazdaki hızı.': 'Speed on the device.',
    'Tek eğitim koşusu; tekrar sayısı yok.': 'A single training run; no repeats.',
    'Tek bir ESP32-C6 üzerinde Flipper Zero benzeri el cihazı. OLED menü arayüzü, Wi-Fi ve BLE araçları, RFID ve IR sürücüleri.':
      'A Flipper Zero-style handheld on a single ESP32-C6. OLED menu interface, Wi-Fi and BLE tools, RFID and IR drivers.',
    '1 çip': '1 chip',
    'ESP32-C6, tamamı C ile': 'ESP32-C6, all in C',
    'tarama, erişim noktası, pasif izleme, kanal haritası, BLE radarı': 'scanning, access point, passive monitoring, channel map, BLE radar',
    "her push'ta derleme ve mantık testleri": 'build and logic tests on every push',
    'donanımda çalışıyor': 'works on hardware',
    'Ekran, tuşlar, menüler ve çip üzerindeki Wi-Fi ve BLE araçları gerçek donanımda.': 'The display, buttons, menus and the on-chip Wi-Fi and BLE tools run on real hardware.',
    "GitHub Actions her push'ta yazılımı ESP32-C6 için derliyor, bilgisayar tarafındaki mantık testlerini çalıştırıyor.": 'GitHub Actions builds the firmware for the ESP32-C6 on every push and runs the host-side logic tests.',
    'doğrulanmadı': 'not verified',
    'RFID ve IR sürücüleri yazıldı, monte edilmiş donanımda doğrulanmadı.': 'RFID and IR drivers are written but not verified on assembled hardware.',
    "Yalnızca 2,4 GHz; C6'da 5 GHz radyo yok.": '2.4 GHz only; the C6 has no 5 GHz radio.',
    'Yerel LLM · Yorumlanabilirlik': 'Local LLM · Interpretability',
    "Bilgisayarındaki dil modelini yükler; hangi attention head'in ve davranış yönünün ne yaptığını gösterir, seçtiğin parçaları ölçüp susturur ve sonucu yeni bir model dosyası olarak kaydeder. Bulut API'si, hesap ve telemetri yok.":
      'Loads the language model on your computer; shows what each attention head and behavior direction does, measures and silences the parts you pick, and saves the result as a new model file. No cloud API, no account, no telemetry.',
    'iki head kesilince " Paris" olasılığı (SmolLM2-135M, CPU)': 'probability of " Paris" after cutting two heads (SmolLM2-135M, CPU)',
    'Llama, Qwen2 ve Gemma2 aileleri': 'Llama, Qwen2 and Gemma2 families',
    'bulut çağrısı · telemetri': 'cloud calls · telemetry',
    'doğrulandı': 'verified',
    'Head ablation ve davranış yönü ortogonalizasyonu; tensör şekilleri korunur, çıktı GGUF uyumlu.': 'Head ablation and behavior-direction orthogonalization; tensor shapes are preserved, output is GGUF-compatible.',
    'Gerçek ağırlıklarda: Qwen2.5-0.5B ve SmolLM2-135M.': 'On real weights: Qwen2.5-0.5B and SmolLM2-135M.',
    'Android uygulaması modeli cihazda çalıştırır (llama.cpp, GGUF), sunucusuz.': 'The Android app runs the model on-device (llama.cpp, GGUF), serverless.',
    'yok': 'missing',
    "Yapısal budama v0.1'de yok.": 'Structured pruning is not in v0.1.',
    'Diğer mimariler reddedilir.': 'Other architectures are rejected.',
    'Pekiştirmeli öğrenme · Simülasyon': 'Reinforcement learning · Simulation',
    "Bir kurtarma drone'u için arama beyni. İnsanın yerini bilmeden harita taramayı sıfır ağırlıktan, hızlı ve görselsiz bir simülasyonda öğreniyor; sonra int8'e nicemleniyor.":
      'A search brain for a rescue drone. Without knowing where the person is, it learns to sweep a map from zero weights in a fast, image-free simulation, then gets quantized to int8.',
    'int8 · 52 bin parametre': 'int8 · 52k parameters',
    'yarım genişlik, elle yazılmış kuralla başa baş': 'half width, on par with the hand-written rule',
    'tek dronda en iyi kuralı küçük farkla geçti': 'beat the best rule by a small margin with a single drone',
    'sonuç': 'result',
    'int8 boyutları gerçek dosya boyutları.': 'int8 sizes are real file sizes.',
    'Öğrenen ajan, en iyi elle yazılmış kuralı (yüksek irtifada tara) simülasyonda küçük bir farkla geçti.': 'The learning agent beat the best hand-written rule (sweep at high altitude) in simulation by a small margin.',
    'başarısız / ölçülmedi': 'failed / not measured',
    "Her şey simülasyon: drone'da ya da mikrodenetleyicide hiç çalışmadı.": 'Everything is simulation: it never ran on a drone or a microcontroller.',
    "Çoklu dron, başarı olasılığı head'i ve budama denemeleri başarısız ya da kötü çıktı.": 'Multi-drone, success-probability head and pruning experiments failed or came out poor.',
    'Diğer': 'Other',
    'Diğer projeler': 'Other projects',
    'Küçük ama bitmiş sistemler.': 'Small but finished systems.',
    'Belediye BT teknisyenleri için USB destek terminali. ESP32-P4 seri bağlantıyla dinleyiciye sinyal gönderir; DeepSeek ajanı yalnızca beyaz listedeki araçları çağırır ve bir şey değiştirmeden önce onay ister.':
      'A USB support terminal for municipal IT technicians. An ESP32-P4 sends a signal to the listener over a serial link; a DeepSeek agent calls only whitelisted tools and asks for approval before changing anything.',
    'oyna': 'play',
    'Gezegen ölçeğinde evrim simülasyonu. Her tohum kendi kimyasına sahip bir gezegen üretir; 38 organ tipine sahip canlılar mutasyon ve seçilimle evrimleşir. Android sürümü kapalı testte.':
      'A planet-scale evolution simulation. Each seed produces a planet with its own chemistry; creatures with 38 organ types evolve through mutation and selection. The Android version is in closed testing.',
    'Bir DM ile bir oyuncu için çevrim içi D&D 5e masası. Bitti.': 'An online D&D 5e table for one DM and one player. Finished.',
    'Belirti anketine göre olası hastalıkları sıralayan Android uygulaması. Bitirme projem.': 'An Android app that ranks likely conditions from a symptom survey. My graduation project.',
    'Fısıltı dahil çevrim dışı Türkçe sesli komutlar için eğitim hattı. Komut veri seti henüz kaydedilmedi.':
      'A training pipeline for offline Turkish voice commands, including whispered speech. The command dataset has not been recorded yet.',
    'köprü': 'bridge',
    "İki laptopu tek masaüstü yapar: ana PC'nin ekranını ikinci laptopa 60 FPS uzatır.": "Turns two laptops into one desktop: extends the main PC's screen to the second laptop at 60 FPS.",
    'Türkçe trend veri seti': 'Turkish trends dataset',
    "Hugging Face'te Türkçe trend tahmini veri seti: 24 ay, 66 milyon satır.": 'A Turkish trend-forecasting dataset on Hugging Face: 24 months, 66 million rows.',
    'Python · veri hattı': 'Python · data pipeline',

    /* ---------- süreç çarkı ---------- */
    'Bir modeli karta nasıl indiriyorum': 'How I get a model onto the board',
    'AŞAMA': 'STAGE',
    'AYIR': 'SPLIT',
    'KUR': 'BUILD',
    'BUDA': 'PRUNE',
    'NİCEMLE': 'QUANT',
    'ELE': 'FILTER',
    'ÖLÇ': 'MEASURE',
    'REPO TELEMETRİSİ': 'REPO TELEMETRY',
    'Kaynaktan Bağımsız Test Ayrımı': 'Source-Independent Test Split',
    'Test metriklerinin eğitim dağılımını sızdırmaması için veri setlerini kaynağa ve sahneye göre en baştan ayırıyorum.': "I split the datasets by source and scene from the very start so the test metrics don't leak the training distribution.",
    'InviolusOCR; eğitimde hiç görülmemiş 12.093 satırda (%77,3), gerçek sahne metinlerinde (TS-TR, %56,2) ve basılı belgelerde (%46,5) ayrı ayrı ölçüldü.':
      'InviolusOCR was measured separately on 12,093 lines never seen in training (77.3%), on real scene text (TS-TR, 56.2%) and on printed documents (46.5%).',
    'Kartın İşlemlerine Göre Mimari': "Architecture Built Around the Board's Ops",
    'Modeli önce GPU’da şişirip sonra karta sıkıştırmaya çalışmak yerine doğrudan TFLite Micro işlemlerine uygun kuruyorum.': 'Instead of bloating the model on a GPU and then squeezing it onto the board, I build it directly around the operations TFLite Micro supports.',
    'InviolusOCR’da BiLSTM yerine evrişimli CTC çıkışı kullanmak, int8’e geçişteki doğruluk kaybını 26–48 puandan yaklaşık 1 puana indirdi.':
      'In InviolusOCR, using a convolutional CTC output instead of a BiLSTM cut the accuracy loss at the int8 conversion from 26–48 points to about 1 point.',
    'Yapısal Kanal Budama': 'Structured Channel Pruning',
    'Büyük modeli eğittikten sonra kanalları yapısal olarak budayıp aynı süre sıfırdan eğitilen kontrol modelleriyle kıyaslıyorum.': 'After training the large model I prune channels structurally and compare against control models trained from scratch for the same time.',
    'Small (298 KB) ve Nano (171 KB), Base’den kanal budanarak üretildi ve üç test setinde de sıfırdan eğitilen kontrolleri eşleştirilmiş testte geçti (McNemar, p ≤ 0,016).':
      'Small (298 KB) and Nano (171 KB) were produced by channel-pruning Base, and beat the from-scratch controls on all three test sets in a paired test (McNemar, p ≤ 0.016).',
    'Tam int8 ve QAT': 'Full int8 and QAT',
    'Nicemleme farkındalıklı eğitim (QAT) ile hem ağırlıkları hem aktivasyonları tam int8’e indirip float modelle farkı ölçüyorum.': 'With quantization-aware training (QAT) I take both weights and activations down to full int8 and measure the gap to the float model.',
    'VoxHOD v3 tam int8 olarak 197 KB (136.547 parametre) yer kaplıyor ve QAT sayesinde float modelden en fazla yarım puan geride kalıyor.':
      'VoxHOD v3 takes 197 KB as full int8 (136,547 parameters) and, thanks to QAT, trails the float model by at most half a point.',
    'Önceden Konmuş Eşik Kapısı': 'Pre-Set Threshold Gate',
    'Her fikir önceden belirlenmiş bir eşiği geçerse yayımlanıyor; geçemeyen denemeler repoda açıkça başarısız olarak yazılıyor.': 'Each idea ships only if it passes a threshold set beforehand; experiments that fail are written up in the repo as failures.',
    'VoxHOD’da büyük öğretmenden damıtma (8’e karşı 8 koşu) ve SARD verisi eşiği geçemedi; Posibrain’de çoklu dron ve budama denemeleri başarısız çıktı.':
      "In VoxHOD, distillation from a large teacher (8-vs-8 runs) and the SARD data didn't pass the threshold; in Posibrain, the multi-drone and pruning experiments failed.",
    'Gerçek Kartta Hız ve Sınırlar': 'Speed and Limits on a Real Board',
    'Yayımlanan TFLite dosyasını ESP32-P4 veya ESP32-C6 kartına yükleyip milisaniye ve doğruluk farkını birebir ölçüyorum.': 'I load the published TFLite file onto an ESP32-P4 or ESP32-C6 and measure the milliseconds and the accuracy gap one-to-one.',
    'ESP32-P4’te VoxHOD karo başına 321 ms (nano 151 ms), InviolusOCR Nano ~420 ms. Henüz uçuşta veya monte donanımda denenmeyenler README’de açıkça yazılı.':
      'On the ESP32-P4, VoxHOD takes 321 ms per tile (nano 151 ms), InviolusOCR Nano ~420 ms. What has not yet been tried in flight or on assembled hardware is written plainly in the README.',

    /* ---------- disket ---------- */
    'Modellerim bir diskete sığar mı?': 'Do my models fit on a floppy disk?',
    "1,44 MB'lık bir disket bugün çok küçük. Mikrodenetleyici modellerimin hepsi yine de tek bir diskete sığıyor. Modelleri seçip toplamı kendin gör.":
      'A 1.44 MB floppy is tiny today. Still, all my microcontroller models fit on a single one. Pick the models and see the total yourself.',
    'int8 dosya boyutları': 'int8 file sizes',
    '0 model': '0 models',
    'Soldan en az bir model seç.': 'Pick at least one model on the left.',
    'Posibrain (yarım genişlik)': 'Posibrain (half width)',
    'int8 · 13,7 bin parametre · simülasyon': 'int8 · 13.7k parameters · simulation',
    'simülasyon (kuralla başa baş)': 'simulation (on par with the rule)',
    'Posibrain (tam)': 'Posibrain (full)',
    'int8 · 52 bin parametre · simülasyon': 'int8 · 52k parameters · simulation',
    'simülasyon (1 km’de kuralı geçti)': 'simulation (beat the rule at 1 km)',
    'int8 · arama-kurtarma kişi tespiti': 'int8 · search-and-rescue person detection',
    'ESP32-P4: 151 ms / karo': 'ESP32-P4: 151 ms / tile',
    'int8 · Türkçe satır OCR (budanmış)': 'int8 · Turkish line OCR (pruned)',
    'ESP32-P4: ~420 ms / satır': 'ESP32-P4: ~420 ms / line',
    'int8 · 136.547 parametre · HERIDAL %83,9': 'int8 · 136,547 parameters · HERIDAL 83.9%',
    'ESP32-P4: 321 ms / karo': 'ESP32-P4: 321 ms / tile',
    'ESP32-P4: 760 ms / satır': 'ESP32-P4: 760 ms / line',
    'int8 · %77,3 görülmemiş satırda tam doğru': 'int8 · 77.3% exact on unseen lines',
    'referans int8 model': 'reference int8 model',
    'VoxScout (yer istasyonu)': 'VoxScout (ground station)',
    'int8 · EfficientNet-B0 · 4,4M parametre': 'int8 · EfficientNet-B0 · 4.4M parameters',
    '4–5× daha az yanlış alarm (yer istasyonu)': '4–5× fewer false alarms (ground station)',

    /* ---------- kayıt ---------- */
    'Kod dışında da bir geçmişim var': "There's a history beyond code",
    'Kaydırdıkça dosyalar yana akar. Birine tıklarsan oraya gider.': 'As you scroll, the files slide sideways. Click one to jump to it.',
    '↓ kaydır': '↓ scroll',
    'DENEYİM · SÖZLEŞMELİ / STAJYER': 'EXPERIENCE · CONTRACT / INTERN',
    'SAHA VERİSİ · İŞ BİRLİĞİ': 'FIELD DATA · COLLABORATION',
    'EĞİTİM · ÖN LİSANS': 'EDUCATION · ASSOCIATE DEGREE',
    'DENEYİM · TAM ZAMANLI': 'EXPERIENCE · FULL-TIME',
    'BAŞLANGIÇ · ALGORİTMA & ARDUINO': 'BEGINNINGS · ALGORITHMS & ARDUINO',
    'OCAK 2027': 'JAN 2027',
    'OME Marketing (Dubai, uzaktan) için Expo (React Native) ve Supabase kullanarak "Onaylı Emlak" emlak pazaryeri mobil uygulamasını geliştirdim ve Stripe ödeme entegrasyonunu ekledim.':
      'For OME Marketing (Dubai, remote) I built the "Onaylı Emlak" real-estate marketplace mobile app with Expo (React Native) and Supabase, and added the Stripe payment integration.',
    'OME Marketing · Dubai (Uzaktan)': 'OME Marketing · Dubai (Remote)',
    'Hava Kuvvetlerinde 21 yıl görev yapmış Ferhat Tatık’ın çektiği Türk drone görüntüleriyle VoxHOD-NC (v2) dalını eğittim; o görüntülerde bulunan kişi oranı %32,9’dan %62,2’ye çıktı.':
      'I trained the VoxHOD-NC (v2) branch on Turkish drone footage shot by Ferhat Tatık, who served 21 years in the Air Force; the share of people found in that footage rose from 32.9% to 62.2%.',
    'Türk drone görüntüleri · yanlış alarm hâlâ yüksek, deneysel': 'Turkish drone footage · false alarms still high, experimental',
    'Karadeniz Teknik Üniversitesi Trabzon MYO Bilgisayar Programcılığı programında C#, Python, Kotlin/Android, SQL Server ve Orange3 ile makine öğrenmesi iş akışları üzerine çalıştım.':
      "In the Computer Programming program at Karadeniz Technical University Trabzon Vocational School I worked on machine-learning workflows with C#, Python, Kotlin/Android, SQL Server and Orange3.",
    'Karadeniz Teknik Üniversitesi': 'Karadeniz Technical University',
    'Bilgisayar Programcılığı · Ocak 2027 mezuniyet beklentisi': 'Computer Programming · expected graduation January 2027',
    'Ankara’da Infrew bünyesinde geliri artırmaya yönelik satış planları hazırlayıp uyguladım; şirketin web sitesi ve çevrimiçi yayınları için teknik ve ticari içerik yazdım.':
      "At Infrew in Ankara I prepared and carried out sales plans aimed at growing revenue, and wrote technical and commercial content for the company's website and online publications.",
    'Satış Uzmanı · Ocak 2022 – Ocak 2024': 'Sales Specialist · Jan 2022 – Jan 2024',
    'Gençlik ve Spor Bakanlığı’nın Sinop’taki devlet destekli "Kod Adı 2023" programında temel algoritmaları öğrendim ve Arduino ile ilk donanım adımlarımı burada attım.':
      'In the Ministry of Youth and Sports’ state-backed "Kod Adı 2023" program in Sinop I learned basic algorithms and took my first hardware steps with Arduino.',
    'Ekim 2018 – Nisan 2019': 'Oct 2018 – Apr 2019',
    'Expo büyüsü': 'Expo sorcery',
    'Stripe sabrı': 'Stripe patience',
    'Saat dilimi uyumu': 'Time-zone harmony',
    'int8 nicemleme': 'int8 quantization',
    'Yanlış alarm affı': 'False-alarm forgiveness',
    'Drone görüntü açlığı': 'Drone-footage hunger',
    'Staj motivasyonu': 'Internship motivation',
    'Orange3 sevgisi': 'Orange3 love',
    'Sabah dersi': 'Morning lectures',
    'İkna gücü': 'Persuasion',
    'Excel dayanıklılığı': 'Excel endurance',
    'Telefon ezberi': 'Phone-script memory',
    'Arduino LED yakma': 'Arduino LED blinking',
    'Algoritma sezgisi': 'Algorithm intuition',
    'Kablo karmaşası': 'Cable chaos',

    /* ---------- notlar ---------- */
    'Notlar': 'Notes',
    'Kısaca bilmen gerekenler': 'What you should know, briefly',
    'Bir başlığa tıkla, kısa notu oku.': 'Click a heading to read the short note.',
    'Başarısız denemeleri de yazıyorum': 'I write up the failed attempts too',
    "Gömülü ML'de iyi görünen bir model int8'e inince ya da kamera değişince çökebilir. Her sürüm önceden belirlediğim bir eşiği geçerse yayımlanıyor. VoxHOD'da damıtma ve SARD verisi geçemedi; Posibrain'de çoklu dron ve budama kötü çıktı. Bunları README'ye yazmak, modeli kullanacak kişinin haftalarını kurtarır.":
      "In embedded ML, a model that looks good can fall apart when it goes to int8 or the camera changes. Each release ships only if it passes a threshold I set beforehand. In VoxHOD, distillation and the SARD data didn't pass; in Posibrain, multi-drone and pruning came out poor. Writing that in the README saves whoever uses the model weeks.",
    "200 KB'ın altına böyle sığıyor": "That's how it fits under 200 KB",
    "İlk günden kartın desteklediği işlemlere göre tasarlayarak: çapasız başlık, yalnızca TFLite Micro işlemleri, eğitim sırasında nicemleme (QAT) ve yapısal kanal budama. OCR'da BiLSTM'i evrişimli bir çıkışla değiştirmek, int8 kaybını 26–48 puandan yaklaşık 1 puana indirdi.":
      'By designing for the operations the board supports from day one: anchor-free head, only TFLite Micro ops, quantization-aware training (QAT) and structured channel pruning. In the OCR model, replacing the BiLSTM with a convolutional output cut the int8 loss from 26–48 points to about 1 point.',
    'Yalnızca gömülü değilim': "I'm not only embedded",
    'TypeScript, React, Vite, Node.js/Express, WebSocket, WebRTC, React Native (Expo), Kotlin (Jetpack Compose), Firebase, Supabase ve Stripe ile çalışıyorum. OME Marketing için emlak pazaryeri uygulaması, Açık Masa, Shaman ve evosim bu taraftan.':
      'I work with TypeScript, React, Vite, Node.js/Express, WebSocket, WebRTC, React Native (Expo), Kotlin (Jetpack Compose), Firebase, Supabase and Stripe. The real-estate marketplace app for OME Marketing, Açık Masa, Shaman and evosim are on this side.',
    'Şu an aradığım iş': "The job I'm looking for right now",
    "Junior yazılım geliştirici rolleri, staj, freelance işler ve iş birlikleri; uzaktan da olur. Karadeniz Teknik Üniversitesi Bilgisayar Programcılığı ön lisansından staj zorunluluğunun ardından Ocak 2027'de mezun olmayı bekliyorum. En kolay ulaşım: e-posta ya da GitHub.":
      'Junior software developer roles, internships, freelance work and collaborations; remote is fine. I expect to graduate from the Computer Programming associate degree at Karadeniz Technical University in January 2027, after the mandatory internship. Easiest way to reach me: email or GitHub.',
    'Kahve dayanıklılığı': 'Coffee endurance',
    'LARPER': 'LARPER',
    'Uyku düzeni': 'Sleep schedule',
    'd20 şansı': 'd20 luck',
    'Kablo düzeni': 'Cable management',
    'ÖLÇ.': 'MEASURE.',
    'BUDA.': 'PRUNE.',
    'KARTA': 'FLASH',
    'YAZ.': 'IT.',
    'Junior yazılım geliştirici, staj ya da freelance iş arıyorum. Gömülü sistemler, TinyML, web ve mobil üzerinde çalışabilirim; uzaktan da olur. Neyi ölçtüğümü de neyi ölçemediğimi de açıkça yazarım. Benimle çalışmak isterseniz:':
      "I'm looking for a junior software developer role, an internship or freelance work. I can work on embedded systems, TinyML, web and mobile; remote is fine. I write down what I measured and what I couldn't measure, plainly. If you'd like to work with me:",
    'e-posta': 'email',
    'yalan': 'lie',
    '© 2026 Erdem Aslan · Elle yazılmış HTML, CSS ve JS. Çerçeve yok, takip yok.': '© 2026 Erdem Aslan · Hand-written HTML, CSS and JS. No framework, no tracking.',

    /* ---------- imleç etiketleri, açılış, öznitelikler ---------- */
    'sürükle': 'drag',
    'tara': 'scan',
    'dosyaya git': 'go to file',
    'yaz': 'write',
    'git': 'go',
    'aç ↗': 'open ↗',
    'aç / kapat': 'open / close',
    'etiketi sök': 'peel the label',
    'etiketi geri yapıştır': 'stick the label back',
    'yükleniyor': 'loading',
    'ready: ölçülen ve ölçülmeyen her şey açık.': 'ready: everything measured and unmeasured is out in the open.',
    'Bölümler': 'Sections',
    'Erdem Aslan, başa dön': 'Erdem Aslan, back to top',
    'Kısayollar': 'Shortcuts',
    'Drone görüntüsünde insan arama canlandırması': 'Person-search animation on drone footage',
    '3D model seçimi': '3D model selection',
    '3 boyutlu etkileşimli model alanı': 'Interactive 3D model area',
    'Süreç aşamaları': 'Process stages',
    'Önceki aşama': 'Previous stage',
    'Sonraki aşama': 'Next stage',
    'Erdem Aslan: halftone portre': 'Erdem Aslan: halftone portrait',
    'Karakter istatistikleri': 'Character stats',
    'Erdem Wilkinson. Etiketi sökersen arkasında Erdem Aslan yazıyor': 'Erdem Wilkinson. Peel the label and Erdem Aslan is underneath',
    'Erdem Aslan: ESP32 için C (ESP-IDF) yazılımı, mikrodenetleyicide çalışan tam int8 modeller, web ve mobil uygulamalar. Ölçülen ve ölçülmeyen her şey açıkça yazılı.':
      'Erdem Aslan: C (ESP-IDF) firmware for the ESP32, full-int8 models running on microcontrollers, web and mobile apps. Everything measured and unmeasured is written plainly.',
  };

  /* ---------- sayı ve kalıp çevirileri (dinamik metinler) ---------- */
  const numFix = (s) => s.replace(/(\d),(\d)/g, '$1.$2').replace(/(\d)\.(\d{3})(?!\d)/g, '$1,$2');
  const PATS = [
    [/^(\d+)\/(\d+) insan$/, (m) => `${m[1]}/${m[2]} humans`],
    [/^AŞAMA \/\/ (\d+) \/ (\d+)$/, (m) => `STAGE // ${m[1]} / ${m[2]}`],
    [/^(\d+) model seçili$/, (m) => `${m[1]} models selected`],
    [/^(\d+)% \/ 1,44 MB$/, (m) => `${m[1]}% / 1.44 MB`],
    [/^([\d.,]+) (KB|MB)$/, (m) => `${numFix(m[1])} ${m[2]}`],
    [/^karo #(\d+) · ESP32-P4 ölçüyor \(321 ms\)\.\.\.$/, (m) => `tile #${m[1]} · ESP32-P4 measuring (321 ms)...`],
    [/^karo #(\d+) · 321 ms · İNSAN BULUNDU \(int8\) · honk$/, (m) => `tile #${m[1]} · 321 ms · HUMAN FOUND (int8) · honk`],
    [/^karo #(\d+) · 321 ms · yanlış alarm \(0,35\/karo\)$/, (m) => `tile #${m[1]} · 321 ms · false alarm (0.35/tile)`],
    [/^karo #(\d+) · 321 ms · kaçırıldı \(%16,1 pay\)$/, (m) => `tile #${m[1]} · 321 ms · missed (16.1% share)`],
    [/^karo #(\d+) · 321 ms · temiz$/, (m) => `tile #${m[1]} · 321 ms · clean`],
    [/^Seçtiğin (\d+) modelin tamamı tek bir 1,44 MB diskete sığıyor; geriye ([\d,]+) KB boş yer kalıyor\.$/, (m) => `All ${m[1]} models you picked fit on a single 1.44 MB floppy; ${numFix(m[2])} KB left over.`],
    [/^Yer istasyonu modeli \(VoxScout, 5,2 MB\) eklendiğinde toplam (\d+) disket gerekiyor; mikrodenetleyici modellerinin tamamı ise tek diskete sığıyor\.$/,
      (m) => `With the ground-station model (VoxScout, 5.2 MB) added you need ${m[1]} floppies in total; all the microcontroller models still fit on one.`],
  ];

  const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
  const MAP = new Map(Object.entries(DICT).map(([k, v]) => [norm(k), v]));

  function tr(text) {
    const lead = text.match(/^\s*/)[0];
    const trail = text.match(/\s*$/)[0];
    let core = norm(text);
    if (!core) return null;
    let wrapped = false;
    if (core.length > 2 && core[0] === '“' && core[core.length - 1] === '”') { core = core.slice(1, -1); wrapped = true; }
    let out = MAP.get(core);
    if (out === undefined) {
      for (const [re, fn] of PATS) {
        const m = core.match(re);
        if (m) { out = fn(m); break; }
      }
    }
    if (out === undefined) return null;
    if (wrapped) out = `“${out}”`;
    return lead + out + trail;
  }

  /* ---------- durum ---------- */
  const KEY = 'lang';
  let lang = 'tr';
  try {
    const q = new URLSearchParams(location.search).get('lang');
    const saved = localStorage.getItem(KEY);
    lang = q === 'en' || q === 'tr' ? q : saved === 'en' || saved === 'tr' ? saved : /^tr\b/i.test(navigator.language || '') ? 'tr' : 'en';
  } catch (e) { lang = 'tr'; }

  const orig = new WeakMap(); // düğüm -> {tr, en}
  const origAttr = new WeakMap(); // eleman -> {attr: {tr, en}}
  const ATTRS = ['aria-label', 'alt', 'title', 'data-cur'];
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CANVAS']);

  function okNode(n) {
    const p = n.parentElement;
    return p && !SKIP.has(p.tagName) && !p.closest('[data-no-i18n]');
  }

  function applyText(n) {
    if (lang !== 'en' || !okNode(n)) return;
    const v = n.nodeValue;
    const o = orig.get(n);
    if (o && o.en === v) return;
    const e = tr(v);
    if (e !== null && e !== v) { orig.set(n, { tr: v, en: e }); n.nodeValue = e; }
  }

  function applyAttrs(el) {
    if (lang !== 'en' || el.nodeType !== 1) return;
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      const v = el.getAttribute(a);
      const rec = origAttr.get(el) || {};
      if (rec[a] && rec[a].en === v) continue;
      const e = tr(v);
      if (e !== null && e !== v) {
        rec[a] = { tr: v, en: e };
        origAttr.set(el, rec);
        el.setAttribute(a, e);
      }
    }
  }

  function walk(root) {
    if (root.nodeType === 3) { applyText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1) applyAttrs(root);
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n = tw.nextNode();
    while (n) {
      if (n.nodeType === 3) applyText(n);
      else applyAttrs(n);
      n = tw.nextNode();
    }
  }

  function restore(root) {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n = tw.nextNode();
    while (n) {
      if (n.nodeType === 3) {
        const o = orig.get(n);
        if (o && n.nodeValue === o.en) n.nodeValue = o.tr;
      } else {
        const rec = origAttr.get(n);
        if (rec) {
          for (const a in rec) if (n.getAttribute(a) === rec[a].en) n.setAttribute(a, rec[a].tr);
          origAttr.delete(n);
        }
      }
      n = tw.nextNode();
    }
  }

  let titleTr = '';
  let descTr = '';
  function setMeta() {
    const m = document.querySelector('meta[name="description"]');
    if (!titleTr) titleTr = document.title;
    if (m && !descTr) descTr = m.getAttribute('content') || '';
    if (lang === 'en') {
      const t = tr(titleTr);
      if (t) document.title = t;
      if (m) { const d = tr(descTr); if (d) m.setAttribute('content', d); }
    } else {
      document.title = titleTr;
      if (m) m.setAttribute('content', descTr);
    }
  }

  const mo = new MutationObserver((muts) => {
    if (lang !== 'en') return;
    for (const mu of muts) {
      if (mu.type === 'characterData') applyText(mu.target);
      else if (mu.type === 'childList') mu.addedNodes.forEach((n) => walk(n));
      else if (mu.type === 'attributes') applyAttrs(mu.target);
    }
  });
  function observe() {
    mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  /* ---------- düğme ---------- */
  let btn = null;
  function paintBtn() {
    if (!btn) return;
    btn.querySelectorAll('[data-l]').forEach((s) => s.classList.toggle('on', s.dataset.l === lang));
    btn.setAttribute('aria-pressed', lang === 'en' ? 'true' : 'false');
  }

  function setLang(l, save) {
    lang = l;
    document.documentElement.lang = l;
    if (save !== false) { try { localStorage.setItem(KEY, l); } catch (e) { /* yoksay */ } }
    if (l === 'en') walk(document.body);
    else restore(document.body);
    setMeta();
    paintBtn();
    window.dispatchEvent(new CustomEvent('langchange', { detail: l }));
  }

  function mountBtn() {
    const host = document.querySelector('.nav-right');
    if (!host) return;
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-btn';
    btn.setAttribute('aria-label', 'Dil / Language');
    btn.setAttribute('data-no-i18n', '');
    btn.innerHTML = '<span data-l="tr">TR</span><i></i><span data-l="en">EN</span>';
    btn.addEventListener('click', () => setLang(lang === 'en' ? 'tr' : 'en'));
    host.insertBefore(btn, host.firstChild);
    paintBtn();
  }

  window.i18n = { t: (s) => (lang === 'en' ? tr(s) || s : s), get lang() { return lang; }, set: setLang };

  function start() {
    mountBtn();
    document.documentElement.lang = lang;
    observe();
    if (lang === 'en') { walk(document.body); setMeta(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
