/* ==========================================================
   3D DONANIM ATÖLYESİ — STİLİZE RETRO-TECH / CEL-SHADED CAD
   - Havada uçuşan etiket kirliliği YOK: tüm yazılar doğrudan
     fiziksel kartların, çiplerin ve bataryaların üzerinde
     yüksek kontrastlı ve net okunabilir silkscreen dokularla yer alır.
   - Mekanik ve görsel mantık bütünlüğü:
     · 4-in-1 ESC → kollardan motorlara giden 3-faz kabloları
     · 4S LiPo XT60 → ESC güç kablosu
     · ESP32-P4 → Alt Nadir Kameraya inen MIPI-CSI şerit kablosu
     · 01 VoxHOD v3 (Uzun menzil saha quadcopter + GPS direği + 3 eksen gimbal)
       → 02 VoxHOD Nano + Posibrain (Kompakt orman-içi kanallı mikro keşif İHA)
       arasında net mühendislik ve boyut/mimari ilerlemesi
     · 03 makeshift-flipper (26 parçalı gerçek bare perfboard stack)
   ========================================================== */

import * as THREE from './three.module.js';

const viewport = document.getElementById('lab3d-viewport');
if (viewport) {
  initStylizedLab3D(viewport);
}

/* ----------------------------------------------------------
   4 Basamaklı Cel-Shading Gradyan Haritası
   ---------------------------------------------------------- */
function createToonGradient() {
  const data = new Uint8Array([
    74, 74, 74, 255,
    138, 138, 138, 255,
    202, 202, 202, 255,
    255, 255, 255, 255,
  ]);
  const tex = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

/* ----------------------------------------------------------
   Yüksek Çözünürlüklü, Net Okunabilir Kart & Donanım Dokuları
   ---------------------------------------------------------- */
function createCarbonTexture(maxAniso) {
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 128;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#171310';
  ctx.fillRect(0, 0, 128, 128);
  const step = 8;
  for (let y = 0; y < 128; y += step) {
    for (let x = 0; x < 128; x += step) {
      const d = ((x + y) / step) % 4;
      ctx.fillStyle = d < 2 ? '#27211b' : '#120f0c';
      ctx.fillRect(x, y, step - 1, step - 1);
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  tex.anisotropy = maxAniso;
  return tex;
}

/**
 * Yazısız, saf donanım dokulu PCB yüzeyi (bakır yollar + altın montaj halkaları).
 */
function createBoardFaceTexture(maxAniso, opts) {
  const { bg = '#15291e', trace = '#1f4530', border = '#e6b84c' } = opts;

  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 128;
  const ctx = cv.getContext('2d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 128, 128);

  // Temiz piksel bakır yollar
  ctx.strokeStyle = trace;
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const y = 12 + i * 12;
    ctx.beginPath();
    ctx.moveTo(6, y);
    ctx.lineTo(42 + (i % 3) * 14, y);
    ctx.lineTo(52 + (i % 3) * 14, y + 6);
    ctx.lineTo(122, y + 6);
    ctx.stroke();
  }

  // Köşe altın montaj halkaları
  [
    [12, 12],
    [116, 12],
    [12, 116],
    [116, 116],
  ].forEach(([cx, cy]) => {
    ctx.fillStyle = '#e6b84c';
    ctx.fillRect(cx - 4, cy - 4, 8, 8);
    ctx.fillStyle = '#0b0907';
    ctx.fillRect(cx - 2, cy - 2, 4, 4);
  });

  // İnce dış kenar şeridi
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, 120, 120);

  // Küçük altın test pedleri
  ctx.fillStyle = '#e6b84c';
  for (let i = 0; i < 12; i++) {
    ctx.fillRect(24 + (i * 23) % 80, 24 + (i * 19) % 80, 3, 3);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.anisotropy = maxAniso;
  return tex;
}

/**
 * Yazısız, saf teknik batarya sargı dokusu (koyu gövde + turuncu şerit).
 */
function createBatteryTexture(maxAniso) {
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 64;
  const ctx = cv.getContext('2d');

  ctx.fillStyle = '#181411';
  ctx.fillRect(0, 0, 128, 64);

  ctx.fillStyle = '#ed670f';
  ctx.fillRect(0, 0, 32, 64);

  ctx.fillStyle = '#2a241e';
  for (let x = 40; x < 120; x += 8) {
    ctx.fillRect(x, 8, 4, 48);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.anisotropy = maxAniso;
  return tex;
}

function createRoundedBox(width, height, depth, segments = 3, radius = 0.03) {
  const r = Math.min(radius, width * 0.25, height * 0.25, depth * 0.25);
  const w = Math.max(0.001, width - r * 2);
  const h = Math.max(0.001, height - r * 2);
  const d = Math.max(0.001, depth - r * 2);
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  const cr = r * 0.6;
  shape.moveTo(-hw + cr, -hh);
  shape.lineTo(hw - cr, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + cr);
  shape.lineTo(hw, hh - cr);
  shape.quadraticCurveTo(hw, hh, hw - cr, hh);
  shape.lineTo(-hw + cr, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - cr);
  shape.lineTo(-hw, -hh + cr);
  shape.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: true,
    bevelSegments: Math.max(2, segments),
    steps: 1,
    bevelSize: r,
    bevelThickness: r,
    curveSegments: 6,
  });
  geo.center();
  return geo;
}

function initStylizedLab3D(container) {
  const badgeEl = document.getElementById('lab3d-badge');
  const kickerEl = document.getElementById('lab3d-kicker');
  const titleEl = document.getElementById('lab3d-title');
  const descEl = document.getElementById('lab3d-desc');
  const dlEl = document.getElementById('lab3d-dl');
  const noteEl = document.getElementById('lab3d-note');
  const explodeBtn = document.getElementById('lab3d-explode');
  const actionBtn = document.getElementById('lab3d-action');
  const calloutBtn = document.getElementById('lab3d-callouts');
  const resetBtn = document.getElementById('lab3d-reset');
  const tabBtns = Array.from(document.querySelectorAll('.lab3d-tab'));

  // Eski bir overlay varsa temizle
  container.innerHTML = '';

  // Tasteful 3D Piksel-Art Render (1.8x piksel ölçeği, antialias kapalı — temiz PS1/Retro-3D görünümü)
  const PIXEL_DIV = 1.8;
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(1);
  renderer.setSize(
    Math.max(200, Math.floor(container.clientWidth / PIXEL_DIV)),
    Math.max(140, Math.floor(container.clientHeight / PIXEL_DIV)),
    false
  );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  container.appendChild(renderer.domElement);

  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    36,
    container.clientWidth / Math.max(1, container.clientHeight),
    0.1,
    120
  );

  // Sıcak Retro-Tech Stüdyo Işıkları
  scene.add(new THREE.HemisphereLight(0xf6f5f1, 0x201c19, 1.05));

  const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.05);
  keyLight.position.set(5, 9, 6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  const sd = 4.6;
  keyLight.shadow.camera.left = -sd;
  keyLight.shadow.camera.right = sd;
  keyLight.shadow.camera.top = sd;
  keyLight.shadow.camera.bottom = -sd;
  keyLight.shadow.bias = -0.0008;
  scene.add(keyLight);

  const rimOrange = new THREE.DirectionalLight(0xed670f, 1.3);
  rimOrange.position.set(-6, 4, -5);
  scene.add(rimOrange);

  // Zemin gölge + sıcak ızgara (Yalnızca Makeshift-Flipper için)
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 18),
    new THREE.ShadowMaterial({ opacity: 0.42 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -1.6;
  shadowPlane.receiveShadow = true;
  shadowPlane.visible = false;
  scene.add(shadowPlane);

  const floorGrid = new THREE.GridHelper(12, 24, 0xed670f, 0x2a231d);
  floorGrid.position.y = -1.61;
  floorGrid.material.transparent = true;
  floorGrid.material.opacity = 0.24;
  floorGrid.visible = false;
  scene.add(floorGrid);

  // Cel-Shaded (Toon) Materyaller + İnce Teknik CAD Kenar Çizgisi
  const toonGrad = createToonGradient();
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x0b0907,
    transparent: true,
    opacity: 0.55,
  });

  function toonMat(color, opts = {}) {
    return new THREE.MeshToonMaterial({
      color,
      gradientMap: toonGrad,
      ...opts,
    });
  }

  /* ==========================================================
     EĞİMLİ 3D ÇİMEN ARAZİ DÜZLEMİ (Yalnızca Dronlar İçin)
     Sade, doğal eğimli çimen yüzey — ağaç/prop yok
     ========================================================== */
  const TERRAIN_SIZE = 5.6;
  const TERRAIN_SEGS = 30;
  const TERRAIN_BASE_Y = -2.22;

  function terrainHeight(x, z) {
    const slope = x * 0.08 - z * 0.06;
    const hill1 = 0.28 * Math.exp(-((x - 1.5) ** 2 + (z + 1.35) ** 2) * 0.42);
    const hill2 = 0.24 * Math.exp(-((x + 1.6) ** 2 + (z - 1.15) ** 2) * 0.46);
    const ridge = 0.16 * Math.exp(-((x + 1.25) ** 2 + (z + 1.45) ** 2) * 0.52);
    const valley = -0.17 * Math.exp(-(x * x + z * z) * 0.52);
    const ripples =
      Math.sin(x * 1.45 + 0.4) * Math.cos(z * 1.3 - 0.2) * 0.055 +
      Math.sin((x + z) * 2.1) * 0.024;
    return -1.62 + slope + hill1 + hill2 + ridge + valley + ripples;
  }

  const terrainRoot = new THREE.Group();

  // Eğimli çimen düzlemi
  const terrainGeo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGS, TERRAIN_SEGS);
  terrainGeo.rotateX(-Math.PI / 2);
  const tPos = terrainGeo.attributes.position;
  const tColors = new Float32Array(tPos.count * 3);
  const cTmp = new THREE.Color();

  for (let i = 0; i < tPos.count; i++) {
    const vx = tPos.getX(i);
    const vz = tPos.getZ(i);
    const vy = terrainHeight(vx, vz);
    tPos.setY(i, vy);

    if (vy > -1.30) {
      cTmp.setHex(0x698c44); // Güneşli yüksek tepe çimeni
    } else if (vy > -1.48) {
      cTmp.setHex(0x527a37); // Üst yamaç çimeni
    } else if (vy > -1.68) {
      cTmp.setHex(0x3f662e); // Orta eğim çimeni
    } else {
      cTmp.setHex(0x2e4f24); // Vadi koyu çimeni
    }
    tColors[i * 3] = cTmp.r;
    tColors[i * 3 + 1] = cTmp.g;
    tColors[i * 3 + 2] = cTmp.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(tColors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMesh = new THREE.Mesh(
    terrainGeo,
    new THREE.MeshToonMaterial({
      vertexColors: true,
      gradientMap: toonGrad,
      flatShading: true,
    })
  );
  terrainMesh.receiveShadow = true;
  terrainRoot.add(terrainMesh);

  // İnce toprak kesit yan duvarları
  const skirtVerts = [];
  const skirtCols = [];
  const cSoilTop = new THREE.Color(0x473525);
  const cSoilBot = new THREE.Color(0x1f1712);
  const halfT = TERRAIN_SIZE / 2;
  const stepT = TERRAIN_SIZE / TERRAIN_SEGS;

  function addSkirtQuad(x0, z0, x1, z1) {
    const y0 = terrainHeight(x0, z0);
    const y1 = terrainHeight(x1, z1);
    skirtVerts.push(
      x0, y0, z0, x0, TERRAIN_BASE_Y, z0, x1, y1, z1,
      x1, y1, z1, x0, TERRAIN_BASE_Y, z0, x1, TERRAIN_BASE_Y, z1
    );
    const pushC = (c) => skirtCols.push(c.r, c.g, c.b);
    pushC(cSoilTop); pushC(cSoilBot); pushC(cSoilTop);
    pushC(cSoilTop); pushC(cSoilBot); pushC(cSoilBot);
  }

  for (let i = 0; i < TERRAIN_SEGS; i++) {
    const a = -halfT + i * stepT;
    const b = a + stepT;
    addSkirtQuad(a, halfT, b, halfT);
    addSkirtQuad(b, -halfT, a, -halfT);
    addSkirtQuad(halfT, b, halfT, a);
    addSkirtQuad(-halfT, a, -halfT, b);
  }

  const skirtGeo = new THREE.BufferGeometry();
  skirtGeo.setAttribute('position', new THREE.Float32BufferAttribute(skirtVerts, 3));
  skirtGeo.setAttribute('color', new THREE.Float32BufferAttribute(skirtCols, 3));
  skirtGeo.computeVertexNormals();
  terrainRoot.add(
    new THREE.Mesh(
      skirtGeo,
      new THREE.MeshToonMaterial({
        vertexColors: true,
        gradientMap: toonGrad,
        flatShading: true,
        side: THREE.DoubleSide,
      })
    )
  );

  const terrainBottom = new THREE.Mesh(
    new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE),
    toonMat(0x15110e)
  );
  terrainBottom.rotation.x = Math.PI / 2;
  terrainBottom.position.y = TERRAIN_BASE_Y;
  terrainRoot.add(terrainBottom);
  scene.add(terrainRoot);

  // Yerin şeklini alan (terrainHeight'e oturan) tarama ızgarası, koni ve işaretçi yardımcıları
  function createDrapedGrid(size, divisions, mainHex, subHex, yOffset = 0.025) {
    const half = size / 2;
    const verts = [];
    const cols = [];
    const cMain = new THREE.Color(mainHex);
    const cSub = new THREE.Color(subHex);
    const subSteps = 20;

    for (let i = 0; i <= divisions; i++) {
      const u = -half + (i / divisions) * size;
      const isBorder = i === 0 || i === divisions;
      const c = isBorder ? cMain : cSub;
      for (let s = 0; s < subSteps; s++) {
        const a = -half + (s / subSteps) * size;
        const b = -half + ((s + 1) / subSteps) * size;
        // X boyunca çizgi
        verts.push(a, terrainHeight(a, u) + yOffset, u, b, terrainHeight(b, u) + yOffset, u);
        cols.push(c.r, c.g, c.b, c.r, c.g, c.b);
        // Z boyunca çizgi
        verts.push(u, terrainHeight(u, a) + yOffset, a, u, terrainHeight(u, b) + yOffset, b);
        cols.push(c.r, c.g, c.b, c.r, c.g, c.b);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    return new THREE.LineSegments(
      geo,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.62 })
    );
  }

  function createDrapedCone(size, apexY, yOffset = 0.025) {
    const half = size / 2;
    const segs = 16;
    const faceVerts = [];
    const wireVerts = [];
    const faceApexIdx = [];
    const wireApexIdx = [];
    const edges = [
      [[-half, -half], [half, -half]],
      [[half, -half], [half, half]],
      [[half, half], [-half, half]],
      [[-half, half], [-half, -half]],
    ];
    edges.forEach(([[x0, z0], [x1, z1]]) => {
      // Köşe ışını (lensten arazi köşesine)
      wireApexIdx.push(wireVerts.length / 3);
      wireVerts.push(0, apexY, 0, x0, terrainHeight(x0, z0) + yOffset, z0);
      for (let s = 0; s < segs; s++) {
        const t0 = s / segs;
        const t1 = (s + 1) / segs;
        const ax = x0 + (x1 - x0) * t0;
        const az = z0 + (z1 - z0) * t0;
        const bx = x0 + (x1 - x0) * t1;
        const bz = z0 + (z1 - z0) * t1;
        const ay = terrainHeight(ax, az) + yOffset;
        const by = terrainHeight(bx, bz) + yOffset;
        faceApexIdx.push(faceVerts.length / 3);
        faceVerts.push(0, apexY, 0, ax, ay, az, bx, by, bz);
        wireVerts.push(ax, ay, az, bx, by, bz);
      }
    });
    const g = new THREE.Group();
    const fGeo = new THREE.BufferGeometry();
    fGeo.setAttribute('position', new THREE.Float32BufferAttribute(faceVerts, 3));
    g.add(
      new THREE.Mesh(
        fGeo,
        new THREE.MeshBasicMaterial({
          color: 0xf6f5f1,
          transparent: true,
          opacity: 0.08,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      )
    );
    const wGeo = new THREE.BufferGeometry();
    wGeo.setAttribute('position', new THREE.Float32BufferAttribute(wireVerts, 3));
    g.add(
      new THREE.LineSegments(
        wGeo,
        new THREE.LineBasicMaterial({ color: 0xf6f5f1, transparent: true, opacity: 0.42 })
      )
    );
    g.userData = { fGeo, wGeo, faceApexIdx, wireApexIdx };
    return g;
  }

  function updateDrapedConeApex(coneGroup, ax, ay, az) {
    const { fGeo, wGeo, faceApexIdx, wireApexIdx } = coneGroup.userData;
    const fPos = fGeo.attributes.position;
    for (let i = 0; i < faceApexIdx.length; i++) fPos.setXYZ(faceApexIdx[i], ax, ay, az);
    fPos.needsUpdate = true;
    const wPos = wGeo.attributes.position;
    for (let i = 0; i < wireApexIdx.length; i++) wPos.setXYZ(wireApexIdx[i], ax, ay, az);
    wPos.needsUpdate = true;
  }

  function createDrapedStrip(width, thickness, segs, colorHex, opacity = 0.78) {
    const geo = new THREE.BufferGeometry();
    const verts = new Float32Array((segs + 1) * 2 * 3);
    const indices = [];
    for (let i = 0; i < segs; i++) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setIndex(indices);
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity, side: THREE.DoubleSide })
    );
    mesh.userData = { width, thickness, segs };
    return mesh;
  }

  function updateDrapedStrip(mesh, zPos, yOffset = 0.04) {
    const { width, thickness, segs } = mesh.userData;
    const pos = mesh.geometry.attributes.position;
    const halfW = width / 2;
    const halfT = thickness / 2;
    for (let i = 0; i <= segs; i++) {
      const x = -halfW + (i / segs) * width;
      const z0 = zPos - halfT;
      const z1 = zPos + halfT;
      pos.setXYZ(i * 2, x, terrainHeight(x, z0) + yOffset, z0);
      pos.setXYZ(i * 2 + 1, x, terrainHeight(x, z1) + yOffset, z1);
    }
    pos.needsUpdate = true;
  }

  function createDrapedBoxRing(outerHalf, innerHalf, colorHex, opacity = 0.95) {
    const perSide = 6;
    const total = perSide * 4;
    const verts = new Float32Array((total + 1) * 2 * 3);
    const indices = [];
    for (let i = 0; i < total; i++) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setIndex(indices);
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity, side: THREE.DoubleSide })
    );
    mesh.userData = { outerHalf, innerHalf, perSide };
    return mesh;
  }

  function updateDrapedBoxRing(mesh, cx, cz, scale = 1, yOffset = 0.045) {
    const { outerHalf, innerHalf, perSide } = mesh.userData;
    const pos = mesh.geometry.attributes.position;
    const oh = outerHalf * scale;
    const ih = innerHalf * scale;
    const sides = [
      [[-1, -1], [1, -1]],
      [[1, -1], [1, 1]],
      [[1, 1], [-1, 1]],
      [[-1, 1], [-1, -1]],
    ];
    let idx = 0;
    for (let s = 0; s < 4; s++) {
      const [[ax, az], [bx, bz]] = sides[s];
      for (let k = 0; k < perSide; k++) {
        const f = k / perSide;
        const ux = ax + (bx - ax) * f;
        const uz = az + (bz - az) * f;
        const ox = cx + ux * oh;
        const oz = cz + uz * oh;
        const ix = cx + ux * ih;
        const iz = cz + uz * ih;
        pos.setXYZ(idx * 2, ox, terrainHeight(ox, oz) + yOffset, oz);
        pos.setXYZ(idx * 2 + 1, ix, terrainHeight(ix, iz) + yOffset, iz);
        idx++;
      }
    }
    // Kapanış köşesi
    const ox0 = cx - oh;
    const oz0 = cz - oh;
    const ix0 = cx - ih;
    const iz0 = cz - ih;
    pos.setXYZ(idx * 2, ox0, terrainHeight(ox0, oz0) + yOffset, oz0);
    pos.setXYZ(idx * 2 + 1, ix0, terrainHeight(ix0, iz0) + yOffset, iz0);
    pos.needsUpdate = true;
  }

  function createDrapedCircleRing(outerR, innerR, segs, colorHex, opacity = 0.85) {
    const verts = new Float32Array((segs + 1) * 2 * 3);
    const indices = [];
    for (let i = 0; i < segs; i++) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setIndex(indices);
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity, side: THREE.DoubleSide })
    );
    mesh.userData = { outerR, innerR, segs };
    return mesh;
  }

  function updateDrapedCircleRing(mesh, cx, cz, scale = 1, yOffset = 0.05) {
    const { outerR, innerR, segs } = mesh.userData;
    const pos = mesh.geometry.attributes.position;
    const or = outerR * scale;
    const ir = innerR * scale;
    for (let i = 0; i <= segs; i++) {
      const ang = (i / segs) * Math.PI * 2;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      const ox = cx + ca * or;
      const oz = cz + sa * or;
      const ix = cx + ca * ir;
      const iz = cz + sa * ir;
      pos.setXYZ(i * 2, ox, terrainHeight(ox, oz) + yOffset, oz);
      pos.setXYZ(i * 2 + 1, ix, terrainHeight(ix, iz) + yOffset, iz);
    }
    pos.needsUpdate = true;
  }

  function addCadEdge(mesh, threshold = 24) {
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, threshold), edgeMat);
    mesh.add(edges);
    return mesh;
  }

  // Üst yüzü yüksek kontrastlı okunaklı silkscreen olan PCB kartı oluşturur
  function createLabeledBoard(w, h, d, sideHex, topTex) {
    const side = toonMat(sideHex);
    const top = new THREE.MeshBasicMaterial({ map: topTex });
    const m = addCadEdge(
      new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, top, side, side, side])
    );
    return m;
  }

  // İki 3D nokta arasında gerçekçi kavisli kablo (TubeGeometry)
  function addCable(parent, pts, colorHex, radius = 0.022) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, radius, 6, false), toonMat(colorHex));
    parent.add(mesh);
    return mesh;
  }

  const matCarbon = toonMat(0xffffff, { map: createCarbonTexture(maxAniso) });
  const matDark = toonMat(0x231e1a);
  const matHot = toonMat(0xed670f);
  const matCopper = toonMat(0xc97a3d);
  const matGold = toonMat(0xe6b84c);
  const matSilver = toonMat(0xd9d6cf);
  const matBone = toonMat(0xf6f5f1);
  const matGlass = new THREE.MeshStandardMaterial({
    color: 0x15100c,
    roughness: 0.12,
    metalness: 0.85,
  });
  const matHotLed = new THREE.MeshBasicMaterial({ color: 0xed670f });
  const matBoneLed = new THREE.MeshBasicMaterial({ color: 0xf6f5f1 });

  function enableShadows(root) {
    root.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
  }

  function registerExplode(arr, obj, offset) {
    arr.push({ obj, base: obj.position.clone(), offset: new THREE.Vector3(...offset) });
  }

  // Kavisli Airfoil Pervane Kanadı
  function createAirfoilBlade() {
    const s = new THREE.Shape();
    s.moveTo(0.06, -0.024);
    s.quadraticCurveTo(0.44, -0.088, 0.8, -0.02);
    s.quadraticCurveTo(0.84, 0.0, 0.8, 0.032);
    s.quadraticCurveTo(0.4, 0.072, 0.06, 0.024);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    return g;
  }
  const bladeGeo = createAirfoilBlade();
  const matBlade = toonMat(0x1b1714);

  /* ==========================================================
     MODEL 1: VOXHOD v3 SAR DRONE (UZUN MENZİL SAHA QUADCOPTER)
     Mantık: GPS Direği + 4S LiPo (XT60 kablolu) + 4-in-1 ESC (3-faz
     motor kabloları) + FC + ESP32-P4 (MIPI-CSI şerit kablosuyla
     alt nadir kameraya bağlı) + ayrı Ön FPV Seyir Kamerası
     ========================================================== */
  const droneRoot = new THREE.Group();
  const droneExplodeParts = [];
  const propellers = [];

  // Alt Karbon Şasi Plakası
  const bottomPlate = addCadEdge(new THREE.Mesh(createRoundedBox(1.5, 0.08, 1.96, 2, 0.025), matCarbon));
  droneRoot.add(bottomPlate);

  // 6 Turuncu Standoff Sütunu
  const standoffsGroup = new THREE.Group();
  [
    [-0.54, 0.19, -0.74],
    [0.54, 0.19, -0.74],
    [-0.54, 0.19, 0.74],
    [0.54, 0.19, 0.74],
    [-0.54, 0.19, 0],
    [0.54, 0.19, 0],
  ].forEach(([x, y, z]) => {
    const post = addCadEdge(new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.36, 10), matHot));
    post.position.set(x, y, z);
    standoffsGroup.add(post);
  });
  droneRoot.add(standoffsGroup);
  registerExplode(droneExplodeParts, standoffsGroup, [0, 0.44, 0]);

  // Katman A: 4-in-1 45A ESC (Üzerinde büyük okunaklı yazı + altın faz padleri + kondansatör)
  const escGroup = new THREE.Group();
  escGroup.position.y = 0.09;
  const escTex = createBoardFaceTexture(maxAniso, {
    bg: '#15291e',
    trace: '#1e422e',
    border: '#e6b84c',
    badge: 'POWER // 4S-6S',
    title: '4-IN-1 ESC',
    line1: '45A · BLHELI_32',
    line2: 'M1 · M2 · M3 · M4',
  });
  escGroup.add(createLabeledBoard(1.06, 0.05, 1.12, 0x15291e, escTex));
  [-0.48, 0.48].forEach((px) => {
    [-0.36, -0.2, 0.2, 0.36].forEach((pz) => {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.058, 0.07), matGold);
      pad.position.set(px, 0, pz);
      escGroup.add(pad);
    });
  });
  // 1000uF filtre kondansatörü + XT60 güç girişi
  const cap = addCadEdge(new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.26, 12), matDark));
  cap.rotation.x = Math.PI / 2;
  cap.position.set(0.32, 0.02, -0.66);
  escGroup.add(cap);
  droneRoot.add(escGroup);
  registerExplode(droneExplodeParts, escGroup, [0, 0.16, 0]);

  // Katman B: Uçuş Kontrolcüsü (Flight Controller · ▲ ÖN yön okuyla okunaklı kart!)
  const fcLayerGroup = new THREE.Group();
  fcLayerGroup.position.y = 0.18;
  const fcTex = createBoardFaceTexture(maxAniso, {
    bg: '#1c1814',
    trace: '#2e2620',
    border: '#f6f5f1',
    badge: 'FLIGHT CTRL',
    title: 'STM32 · IMU',
    line1: 'BARO · GPS · RC',
    line2: 'MAVLINK TELEMETRİ',
    arrow: true,
  });
  fcLayerGroup.add(createLabeledBoard(0.98, 0.045, 1.0, 0x1c1814, fcTex));
  droneRoot.add(fcLayerGroup);
  registerExplode(droneExplodeParts, fcLayerGroup, [0, 0.44, 0]);

  // Katman C: ESP32-P4 v1.3 TinyML Kartı (Okunaklı kart + alt nadir kameraya inen MIPI-CSI şerit kablosu!)
  const avionicsGroup = new THREE.Group();
  avionicsGroup.position.y = 0.27;
  const p4Tex = createBoardFaceTexture(maxAniso, {
    bg: '#15110e',
    trace: '#2b221a',
    border: '#ed670f',
    badge: 'TINYML PAYLOAD',
    title: 'ESP32-P4 v1.3',
    line1: 'VOXHOD v3 · 197 KB',
    line2: '321 MS · 32MB PSRAM',
  });
  avionicsGroup.add(createLabeledBoard(0.96, 0.05, 0.98, 0x15110e, p4Tex));

  // MIPI-CSI Turuncu Esnek Şerit Kablo (FPC): ESP32-P4 → Alt Nadir Kameraya iner!
  const csiRibbon = addCadEdge(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.52, 0.02), matCopper));
  csiRibbon.position.set(0, -0.26, 0.26);
  avionicsGroup.add(csiRibbon);

  droneRoot.add(avionicsGroup);
  registerExplode(droneExplodeParts, avionicsGroup, [0, 0.74, 0]);

  // Üst Karbon Güverte + Katlanır GPS/Pusula Direği + 5.8GHz Telemetri Anteni
  const topDeckGroup = new THREE.Group();
  topDeckGroup.position.y = 0.38;
  topDeckGroup.add(addCadEdge(new THREE.Mesh(createRoundedBox(1.34, 0.075, 1.82, 2, 0.025), matCarbon)));

  // Arka Sağ: 5.8GHz / Telemetri Anteni
  const smaNut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 6), matGold);
  smaNut.position.set(0.32, 0.08, -0.82);
  topDeckGroup.add(smaNut);
  const antStem = addCadEdge(new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.52, 10), matDark));
  antStem.position.set(0.32, 0.33, -0.9);
  antStem.rotation.x = -0.32;
  topDeckGroup.add(antStem);
  const antCap = addCadEdge(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.12, 16), matHot));
  antCap.position.set(0.32, 0.56, -0.98);
  antCap.rotation.x = -0.32;
  topDeckGroup.add(antCap);

  // Arka Sol: GPS + Pusula Modülü (SAR koordinat işaretleme için mantıklı donanım!)
  const gpsMast = addCadEdge(new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.44, 10), matCarbon));
  gpsMast.position.set(-0.36, 0.24, -0.76);
  topDeckGroup.add(gpsMast);
  const gpsTex = createBoardFaceTexture(maxAniso, {
    bg: '#15110e',
    trace: '#201c19',
    border: '#f6f5f1',
    badge: 'GNSS',
    title: 'M10 GPS',
    line1: 'SAR KOORDİNAT',
    line2: 'PUSULA + TELEMETRİ',
    arrow: true,
  });
  const gpsDisc = addCadEdge(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.09, 16),
      [matDark, new THREE.MeshBasicMaterial({ map: gpsTex }), matDark]
    )
  );
  gpsDisc.position.set(-0.36, 0.48, -0.76);
  topDeckGroup.add(gpsDisc);

  droneRoot.add(topDeckGroup);
  registerExplode(droneExplodeParts, topDeckGroup, [0, 1.04, 0]);

  // Üst 4S 1850mAh LiPo Batarya + Çift Kayış + Sarı XT60 + Silikon Güç Kablosu
  const batteryGroup = new THREE.Group();
  batteryGroup.position.y = 0.62;
  const batMat = toonMat(0xffffff, {
    map: createBatteryTexture(maxAniso, '4S', '14.8V', '1850 mAh'),
  });
  batteryGroup.add(addCadEdge(new THREE.Mesh(createRoundedBox(0.86, 0.4, 1.32, 2, 0.04), batMat)));
  const strap1 = addCadEdge(new THREE.Mesh(createRoundedBox(0.9, 0.43, 0.18, 2, 0.02), matHot));
  strap1.position.z = 0.22;
  batteryGroup.add(strap1);
  const strap2 = strap1.clone();
  strap2.position.z = -0.24;
  batteryGroup.add(strap2);
  const xt60 = addCadEdge(new THREE.Mesh(createRoundedBox(0.22, 0.14, 0.24, 2, 0.02), matGold));
  xt60.position.set(0.28, -0.05, -0.74);
  batteryGroup.add(xt60);
  // Bataryadan ESC'ye inen güç kabloları (turuncu + siyah)
  addCable(batteryGroup, [[0.24, -0.06, -0.84], [0.22, -0.26, -0.94], [0.16, -0.48, -0.62]], 0xed670f, 0.026);
  addCable(batteryGroup, [[0.32, -0.06, -0.84], [0.34, -0.26, -0.94], [0.26, -0.48, -0.62]], 0x15110e, 0.026);

  droneRoot.add(batteryGroup);
  registerExplode(droneExplodeParts, batteryGroup, [0, 1.56, 0]);

  // 4 Karbon Kol + 3-Faz Motor Kabloları + Fırçasız Motor + Airfoil Pervane
  [
    { deg: 40, front: true, dir: 1 },
    { deg: 140, front: false, dir: -1 },
    { deg: 220, front: false, dir: 1 },
    { deg: 320, front: true, dir: -1 },
  ].forEach(({ deg, front, dir }) => {
    const rad = (deg * Math.PI) / 180;
    const armLen = 2.04;
    const mx = Math.cos(rad) * armLen;
    const mz = Math.sin(rad) * armLen;
    const armGroup = new THREE.Group();

    const armMesh = addCadEdge(new THREE.Mesh(createRoundedBox(armLen, 0.11, 0.22, 2, 0.02), matCarbon));
    armMesh.position.set(mx * 0.5, 0.02, mz * 0.5);
    armMesh.rotation.y = -rad;
    armGroup.add(armMesh);

    // Koldan ESC'ye uzanan 3-faz örgülü motor kabloları (mantıksal kablo bağlantısı!)
    [-0.04, 0, 0.04].forEach((off, wi) => {
      const px = -Math.sin(rad) * off;
      const pz = Math.cos(rad) * off;
      addCable(
        armGroup,
        [
          [mx * 0.24 + px, 0.09, mz * 0.24 + pz],
          [mx * 0.6 + px, 0.09, mz * 0.6 + pz],
          [mx * 0.88 + px, 0.1, mz * 0.88 + pz],
        ],
        wi === 1 ? 0xed670f : 0x15110e,
        0.015
      );
    });

    const mountDisc = addCadEdge(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, 0.08, 16), matCarbon));
    mountDisc.position.set(mx, 0.04, mz);
    armGroup.add(mountDisc);

    const stator = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.16, 14), matCopper);
    stator.position.set(mx, 0.15, mz);
    armGroup.add(stator);

    const bellGroup = new THREE.Group();
    bellGroup.position.set(mx, 0.18, mz);
    bellGroup.add(addCadEdge(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.25, 0.16, 16), matDark)));
    const bellTop = addCadEdge(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.045, 16), matHot));
    bellTop.position.y = 0.095;
    bellGroup.add(bellTop);
    armGroup.add(bellGroup);
    registerExplode(droneExplodeParts, bellGroup, [0, 0.34, 0]);

    const ledBar = new THREE.Mesh(createRoundedBox(0.35, 0.035, 0.09, 1, 0.01), front ? matBoneLed : matHotLed);
    ledBar.position.set(mx * 0.72, -0.045, mz * 0.72);
    ledBar.rotation.y = -rad;
    armGroup.add(ledBar);

    const legGroup = new THREE.Group();
    const leg = addCadEdge(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.44, 10), matCarbon));
    leg.position.set(mx * 0.94, -0.22, mz * 0.94);
    legGroup.add(leg);
    const footPad = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), matHot);
    footPad.position.set(mx * 0.94, -0.44, mz * 0.94);
    legGroup.add(footPad);
    armGroup.add(legGroup);
    registerExplode(droneExplodeParts, legGroup, [0, -0.34, 0]);

    const propGroup = new THREE.Group();
    propGroup.position.set(mx, 0.31, mz);
    propGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.06, 14), matBlade));
    const lockNut = addCadEdge(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 6), front ? matBone : matHot));
    lockNut.position.y = 0.07;
    propGroup.add(lockNut);
    registerExplode(droneExplodeParts, lockNut, [0, 0.28, 0]);

    for (let b = 0; b < 3; b++) {
      const bw = new THREE.Group();
      bw.rotation.y = (b * Math.PI * 2) / 3;
      const blade = new THREE.Mesh(bladeGeo, matBlade);
      blade.rotation.x = 0.22 * dir;
      bw.add(blade);
      propGroup.add(bw);
    }
    armGroup.add(propGroup);
    propellers.push({ group: propGroup, dir });
    registerExplode(droneExplodeParts, propGroup, [0, 0.72, 0]);

    droneRoot.add(armGroup);
    registerExplode(droneExplodeParts, armGroup, [Math.cos(rad) * 0.45, 0, Math.sin(rad) * 0.45]);
  });

  // KAMERA 1: ÖN KAMERA (SEYİR / FPV — İleri +Z)
  const frontCamGroup = new THREE.Group();
  frontCamGroup.position.set(0, 0.19, 0.88);
  [-0.22, 0.22].forEach((cx) => {
    const p = addCadEdge(new THREE.Mesh(createRoundedBox(0.04, 0.28, 0.26, 2, 0.01), matHot));
    p.position.x = cx;
    frontCamGroup.add(p);
  });
  frontCamGroup.add(addCadEdge(new THREE.Mesh(createRoundedBox(0.34, 0.24, 0.24, 2, 0.025), matDark)));
  const fpvBarrel = addCadEdge(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.14, 18), matDark));
  fpvBarrel.rotation.x = Math.PI / 2;
  fpvBarrel.position.z = 0.16;
  frontCamGroup.add(fpvBarrel);
  const fpvRing = new THREE.Mesh(new THREE.TorusGeometry(0.108, 0.012, 8, 20), matHot);
  fpvRing.position.z = 0.22;
  frontCamGroup.add(fpvRing);
  const fpvLens = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), matGlass);
  fpvLens.rotation.x = Math.PI / 2;
  fpvLens.position.z = 0.16;
  frontCamGroup.add(fpvLens);
  const frontFovCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.68, 1.32, 4, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xed670f, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false })
  );
  frontFovCone.rotation.x = -Math.PI / 2;
  frontFovCone.rotation.y = Math.PI / 4;
  frontFovCone.position.set(0, 0, 0.9);
  frontCamGroup.add(frontFovCone);
  droneRoot.add(frontCamGroup);
  registerExplode(droneExplodeParts, frontCamGroup, [0, 0.15, 0.85]);

  // KAMERA 2: ALT TARAMA KAMERASI (VOXHOD NADİR — Tam Aşağı -Y)
  const gimbalGroup = new THREE.Group();
  gimbalGroup.position.set(0, -0.24, 0);
  [
    [-0.18, 0.18, -0.16],
    [0.18, 0.18, -0.16],
    [-0.18, 0.18, 0.16],
    [0.18, 0.18, 0.16],
  ].forEach(([dx, dy, dz]) => {
    const dmp = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), matHot);
    dmp.position.set(dx, dy, dz);
    gimbalGroup.add(dmp);
  });
  const yokeTop = addCadEdge(new THREE.Mesh(createRoundedBox(0.56, 0.05, 0.42, 2, 0.015), matDark));
  yokeTop.position.y = 0.13;
  gimbalGroup.add(yokeTop);
  gimbalGroup.add(addCadEdge(new THREE.Mesh(createRoundedBox(0.42, 0.26, 0.42, 2, 0.03), matDark)));

  const barrel = addCadEdge(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.16, 20), matDark));
  barrel.position.y = -0.18;
  gimbalGroup.add(barrel);
  const redRing = new THREE.Mesh(new THREE.TorusGeometry(0.162, 0.015, 8, 22), matHot);
  redRing.rotation.x = Math.PI / 2;
  redRing.position.y = -0.25;
  gimbalGroup.add(redRing);
  const lensEl = new THREE.Mesh(new THREE.SphereGeometry(0.145, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), matGlass);
  lensEl.rotation.x = Math.PI;
  lensEl.position.y = -0.18;
  gimbalGroup.add(lensEl);

  // VoxHOD v3 / VoxScout Arazi Tarama Projeksiyonu (Eğimli arazinin şeklini alır!)
  const v3HoloGroup = new THREE.Group();
  const v3HoloGrid = createDrapedGrid(2.3, 12, 0xf6f5f1, 0xed670f, 0.025);
  v3HoloGroup.add(v3HoloGrid);
  const v3Cone = createDrapedCone(2.3, -0.44, 0.025);
  v3HoloGroup.add(v3Cone);

  const v3ScanBar = createDrapedStrip(2.26, 0.075, 22, 0xed670f, 0.72);
  updateDrapedStrip(v3ScanBar, 0, 0.04);
  v3HoloGroup.add(v3ScanBar);

  const v3TargetCell = createDrapedBoxRing(0.21, 0.14, 0xed670f, 0.95);
  updateDrapedBoxRing(v3TargetCell, 0.4, 0.2, 1, 0.045);
  v3HoloGroup.add(v3TargetCell);

  const v3LockRing = createDrapedCircleRing(0.29, 0.255, 24, 0xf6f5f1, 0.85);
  updateDrapedCircleRing(v3LockRing, 0.4, 0.2, 1, 0.05);
  v3HoloGroup.add(v3LockRing);

  terrainRoot.add(v3HoloGroup);
  droneRoot.add(gimbalGroup);
  registerExplode(droneExplodeParts, gimbalGroup, [0, -0.46, 0]);

  enableShadows(droneRoot);
  scene.add(droneRoot);

  /* ==========================================================
     MODEL 2: VOXHOD NANO + POSIBRAIN (2. NESİL MİKRO DUCTED İHA)
     Mantık İlerlemesi: Ağır açık gimbal & 4S yerine ağaç altı/dar alan
     için 4 kanallı koruma (duct), tek entegre gömülü alt kamera,
     okunaklı VOXHOD NANO (75 KB) + POSIBRAIN RL (60.8 KB) çift kartı,
     2S mikro LiPo ve burunda ToF mesafe/seyir modülü!
     ========================================================== */
  const nanoRoot = new THREE.Group();
  const nanoExplodeParts = [];
  const nanoProps = [];
  nanoRoot.visible = false;

  nanoRoot.add(addCadEdge(new THREE.Mesh(createRoundedBox(1.12, 0.08, 1.38, 2, 0.025), matCarbon)));

  [
    { x: 0.96, z: 0.96, front: true, dir: 1 },
    { x: -0.96, z: 0.96, front: true, dir: -1 },
    { x: -0.96, z: -0.96, front: false, dir: 1 },
    { x: 0.96, z: -0.96, front: false, dir: -1 },
  ].forEach(({ x, z, front, dir }) => {
    const ductGroup = new THREE.Group();
    const ang = Math.atan2(z, x);
    const strut = addCadEdge(new THREE.Mesh(createRoundedBox(1.28, 0.07, 0.14, 2, 0.015), matCarbon));
    strut.position.set(x * 0.5, 0, z * 0.5);
    strut.rotation.y = -ang;
    ductGroup.add(strut);

    // Koldan mikro motora giden 3-faz kablo
    addCable(
      ductGroup,
      [[x * 0.25, 0.06, z * 0.25], [x * 0.62, 0.06, z * 0.62], [x * 0.92, 0.07, z * 0.92]],
      front ? 0xed670f : 0x15110e,
      0.014
    );

    const shroudGroup = new THREE.Group();
    const shroud = addCadEdge(new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.62, 0.24, 24, 1, true), matDark));
    shroud.position.set(x, 0.09, z);
    shroudGroup.add(shroud);
    const rimRing = new THREE.Mesh(new THREE.TorusGeometry(0.635, 0.02, 8, 28), front ? matBoneLed : matHotLed);
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.set(x, 0.21, z);
    shroudGroup.add(rimRing);
    ductGroup.add(shroudGroup);
    registerExplode(nanoExplodeParts, shroudGroup, [0, 0.35, 0]);

    const mBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 14), matCarbon);
    mBase.position.set(x, 0.02, z);
    ductGroup.add(mBase);
    const mStator = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 14), matCopper);
    mStator.position.set(x, 0.09, z);
    ductGroup.add(mStator);
    const mBell = addCadEdge(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 16), matHot));
    mBell.position.set(x, 0.14, z);
    ductGroup.add(mBell);
    registerExplode(nanoExplodeParts, mBell, [0, 0.24, 0]);

    const pGroup = new THREE.Group();
    pGroup.position.set(x, 0.17, z);
    pGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12), matSilver));
    for (let b = 0; b < 4; b++) {
      const bw = new THREE.Group();
      bw.rotation.y = (b * Math.PI) / 2;
      const bl = new THREE.Mesh(bladeGeo, matBlade);
      bl.scale.set(0.66, 0.8, 0.72);
      bl.rotation.x = 0.25 * dir;
      bw.add(bl);
      pGroup.add(bw);
    }
    ductGroup.add(pGroup);
    nanoProps.push({ group: pGroup, dir });
    registerExplode(nanoExplodeParts, pGroup, [0, 0.65, 0]);

    const foot = addCadEdge(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.24, 8), matHot));
    foot.position.set(x * 1.15, -0.12, z * 1.15);
    ductGroup.add(foot);

    nanoRoot.add(ductGroup);
    registerExplode(nanoExplodeParts, ductGroup, [Math.sign(x) * 0.45, 0, Math.sign(z) * 0.45]);
  });

  // Katman 1: VoxHOD Nano (75 KB · 151 ms · 218 KB Arena) — Kart üzerinde net okunur!
  const nanoVisionBoard = new THREE.Group();
  nanoVisionBoard.position.y = 0.1;
  const nanoBoardTex = createBoardFaceTexture(maxAniso, {
    bg: '#15291e',
    trace: '#1e422e',
    border: '#f6f5f1',
    badge: 'VISION · INT8',
    title: 'VOXHOD NANO',
    line1: '75 KB · 151 MS/KARO',
    line2: '218 KB PAYLAŞIMLI ARENA',
  });
  nanoVisionBoard.add(createLabeledBoard(0.92, 0.045, 0.96, 0x15291e, nanoBoardTex));
  // Alt kameraya inen kısa FPC şerit kablosu
  const nanoFpc = addCadEdge(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 0.02), matCopper));
  nanoFpc.position.set(0, -0.12, 0.16);
  nanoVisionBoard.add(nanoFpc);
  nanoRoot.add(nanoVisionBoard);
  registerExplode(nanoExplodeParts, nanoVisionBoard, [0, 0.28, 0]);

  // Katman 2: Posibrain RL (60.8 KB · PPO · <2 ms) — Kart üzerinde net okunur!
  const posiBoardGroup = new THREE.Group();
  posiBoardGroup.position.y = 0.22;
  const posiBoardTex = createBoardFaceTexture(maxAniso, {
    bg: '#15110e',
    trace: '#2b221a',
    border: '#ed670f',
    badge: 'POLICY · PPO',
    title: 'POSIBRAIN RL',
    line1: '60.8 KB · < 2 MS KARAR',
    line2: '15×15 YEREL · 20×20 HARİTA',
    arrow: true,
  });
  posiBoardGroup.add(createLabeledBoard(0.86, 0.045, 0.9, 0x15110e, posiBoardTex));
  nanoRoot.add(posiBoardGroup);
  registerExplode(nanoExplodeParts, posiBoardGroup, [0, 0.64, 0]);

  // Üst 2S Mikro LiPo + Aerodinamik Koruma Kubbesi
  const canopyGroup = new THREE.Group();
  canopyGroup.position.y = 0.38;
  const microBatMat = toonMat(0xffffff, {
    map: createBatteryTexture(maxAniso, '2S', '7.4V', '650 mAh'),
  });
  canopyGroup.add(addCadEdge(new THREE.Mesh(createRoundedBox(0.64, 0.22, 0.96, 2, 0.03), microBatMat)));
  const canopyShell = addCadEdge(new THREE.Mesh(createRoundedBox(0.74, 0.13, 1.08, 2, 0.04), matBone));
  canopyShell.position.y = 0.15;
  canopyGroup.add(canopyShell);
  const canopyStripe = addCadEdge(new THREE.Mesh(createRoundedBox(0.24, 0.14, 0.92, 2, 0.02), matHot));
  canopyStripe.position.y = 0.155;
  canopyGroup.add(canopyStripe);
  nanoRoot.add(canopyGroup);
  registerExplode(nanoExplodeParts, canopyGroup, [0, 1.08, 0]);

  // Nano Ön Kamera (+Z Seyir & ToF Engel Sensörü)
  const nanoFrontCam = new THREE.Group();
  nanoFrontCam.position.set(0, 0.16, 0.68);
  nanoFrontCam.add(addCadEdge(new THREE.Mesh(createRoundedBox(0.28, 0.2, 0.2, 2, 0.02), matDark)));
  const nfBarrel = addCadEdge(new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.12, 16), matHot));
  nfBarrel.rotation.x = Math.PI / 2;
  nfBarrel.position.z = 0.12;
  nanoFrontCam.add(nfBarrel);
  const nfLens = new THREE.Mesh(new THREE.SphereGeometry(0.072, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), matGlass);
  nfLens.rotation.x = Math.PI / 2;
  nfLens.position.z = 0.13;
  nanoFrontCam.add(nfLens);
  const nfCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 1.1, 4, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xed670f, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false })
  );
  nfCone.rotation.x = -Math.PI / 2;
  nfCone.rotation.y = Math.PI / 4;
  nfCone.position.set(0, 0, 0.72);
  nanoFrontCam.add(nfCone);
  nanoRoot.add(nanoFrontCam);
  registerExplode(nanoExplodeParts, nanoFrontCam, [0, 0.12, 0.7]);

  // Nano Alt Kamera (-Y Nadir) + 15x15 Posibrain Izgarası
  const nanoCamGroup = new THREE.Group();
  nanoCamGroup.position.set(0, -0.14, 0);
  nanoCamGroup.add(addCadEdge(new THREE.Mesh(createRoundedBox(0.34, 0.22, 0.34, 2, 0.03), matDark)));
  const nanoBarrel = addCadEdge(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.14, 18), matDark));
  nanoBarrel.position.y = -0.15;
  nanoCamGroup.add(nanoBarrel);
  const nanoRing = new THREE.Mesh(new THREE.TorusGeometry(0.122, 0.013, 8, 20), matHot);
  nanoRing.rotation.x = Math.PI / 2;
  nanoRing.position.y = -0.21;
  nanoCamGroup.add(nanoRing);
  const nanoLens = new THREE.Mesh(new THREE.SphereGeometry(0.108, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), matGlass);
  nanoLens.rotation.x = Math.PI;
  nanoLens.position.y = -0.15;
  nanoCamGroup.add(nanoLens);

  const posiHoloGroup = new THREE.Group();
  posiHoloGroup.visible = false;
  const holoGrid = createDrapedGrid(2.3, 15, 0xf6f5f1, 0xed670f, 0.025);
  posiHoloGroup.add(holoGrid);
  const nanoCone = createDrapedCone(2.3, -0.31, 0.025);
  posiHoloGroup.add(nanoCone);

  const targetCell = createDrapedBoxRing(0.19, 0.125, 0xed670f, 0.95);
  updateDrapedBoxRing(targetCell, 0.48, 0.32, 1, 0.045);
  posiHoloGroup.add(targetCell);

  terrainRoot.add(posiHoloGroup);
  nanoRoot.add(nanoCamGroup);
  registerExplode(nanoExplodeParts, nanoCamGroup, [0, -0.4, 0]);

  enableShadows(nanoRoot);
  scene.add(nanoRoot);

  /* ==========================================================
     MODEL 3: MAKESHIFT-FLIPPER — 26 PARÇALI GERÇEK BARE STACK
     Kartlar üzerinde net okunaklı silkscreen yazılar + canlı LCD!
     ========================================================== */
  const flipperRoot = new THREE.Group();
  const flipperExplodeParts = [];
  flipperRoot.visible = false;

  const MM = 0.036;
  const FL_L = 118;
  const FL_W = 46;
  const PLATE_Z = 13.0;
  const FL_T = PLATE_Z + 1.6 + 17.55;

  const bareWrap = new THREE.Group();
  bareWrap.scale.set(MM, MM, MM);
  bareWrap.position.set(0, (-FL_T * MM) / 2, 0);
  flipperRoot.add(bareWrap);

  const oledCanvas = document.createElement('canvas');
  oledCanvas.width = 512;
  oledCanvas.height = 512;
  const oledCtx = oledCanvas.getContext('2d');
  const oledTex = new THREE.CanvasTexture(oledCanvas);
  oledTex.colorSpace = THREE.SRGBColorSpace;
  oledTex.anisotropy = maxAniso;

  const OLED_MODES = ['ANA MENÜ', 'BİRLEŞİK RADAR', 'KANAL HARİTASI', 'WIFI AĞIM'];
  let oledModeIdx = 0;

  function drawOled(t) {
    if (!oledCtx) return;
    const S = 512;
    const c2 = oledCtx;
    c2.fillStyle = '#0b0907';
    c2.fillRect(0, 0, S, S);
    c2.fillStyle = '#ed670f';
    c2.fillRect(0, 0, S, 68);
    c2.fillStyle = '#160a02';
    c2.font = 'bold 30px monospace';
    c2.textBaseline = 'middle';

    if (oledModeIdx === 0) {
      c2.fillText('Makeshift Flipper', 16, 34);
      const items = ['RFID / NFC', 'Kızılötesi (IR)', 'WiFi Araçları', 'Bluetooth / BLE', 'Hacking (Pasif)'];
      const sel = Math.floor(t * 0.9) % items.length;
      items.forEach((txt, i) => {
        const y = 114 + i * 74;
        if (i === sel) {
          c2.fillStyle = '#201c19';
          c2.fillRect(10, y - 30, S - 20, 60);
          c2.fillStyle = '#ed670f';
          c2.fillRect(10, y - 30, 10, 60);
        }
        c2.fillStyle = i === sel ? '#f6f5f1' : '#9f9b92';
        c2.font = 'bold 28px monospace';
        c2.fillText(txt, 36, y);
      });
    } else if (oledModeIdx === 1) {
      c2.fillText('BİRLEŞİK RADAR', 16, 34);
      const cx = 256, cy = 274;
      c2.strokeStyle = '#ed670f';
      c2.lineWidth = 3;
      [55, 110, 165].forEach((r) => {
        c2.beginPath();
        c2.arc(cx, cy, r, 0, Math.PI * 2);
        c2.stroke();
      });
      const ang = (t * 2.1) % (Math.PI * 2);
      c2.beginPath();
      c2.moveTo(cx, cy);
      c2.lineTo(cx + Math.cos(ang) * 165, cy + Math.sin(ang) * 165);
      c2.stroke();
      c2.fillStyle = '#f6f5f1';
      c2.fillRect(cx + 54, cy - 54, 16, 16);
      c2.fillStyle = '#ed670f';
      c2.fillRect(cx + 72, cy - 38, 16, 16);
    } else if (oledModeIdx === 2) {
      c2.fillText('KANAL HARİTASI', 16, 34);
      for (let ch = 1; ch <= 13; ch++) {
        const h = 44 + Math.abs(Math.sin(ch * 1.2 + t * 1.1)) * 270;
        const x = 18 + (ch - 1) * 37;
        c2.fillStyle = ch === 1 || ch === 6 || ch === 11 ? '#ed670f' : '#e6e5e0';
        c2.fillRect(x, 420 - h, 26, h);
        c2.fillStyle = '#9f9b92';
        c2.font = 'bold 20px monospace';
        c2.fillText(String(ch), x + 2, 456);
      }
    } else {
      c2.fillText('WiFi Ağım (WPA2 AP)', 16, 34);
      c2.fillStyle = '#f6f5f1';
      c2.font = 'bold 26px monospace';
      c2.fillText('SSID : ErdemFlip_AP', 24, 130);
      c2.fillText('CH   : 6 (2.4 GHz)', 24, 178);
      c2.fillText('MCU  : ESP32-C6-N8', 24, 226);
      c2.fillStyle = '#ed670f';
      c2.fillText('RC522/RDM/IR: TEST', 24, 290);
    }
    oledTex.needsUpdate = true;
  }

  const BARE_PARTS = [
    ['coil', [64, 6.5, 0, 46, 33, 3], 0xc97a3d],
    ['card1', [61, 5, 3, 52, 36, 1], 0xc49f68],
    ['bat', [62, 6, 4, 50, 34, 5.5], 0x6e6a64],
    ['card2', [61, 5, 9.5, 52, 36, 1], 0xc49f68],
    ['rc522', [1, 3, 0, 60, 40, 3.4], 0x244c8a],
    ['rdm', [67.75, 13.5, 0, 38.5, 19, 3], 0x6b1d1d],
    ['ft1', [1.2, 3.2, 3.4, 4, 4, 9.6], 0xb89a5a],
    ['ft2', [1.2, 38.8, 3.4, 4, 4, 9.6], 0xb89a5a],
    ['ft3', [56.2, 3.2, 3.4, 4, 4, 9.6], 0xb89a5a],
    ['ft4', [56.2, 38.8, 3.4, 4, 4, 9.6], 0xb89a5a],
    ['ft5', [73, 7, 10.5, 4, 4, 2.5], 0xb89a5a],
    ['ft6', [73, 35, 10.5, 4, 4, 2.5], 0xb89a5a],
    ['ft7', [108, 7, 10.5, 4, 4, 2.5], 0xb89a5a],
    ['ft8', [108, 35, 10.5, 4, 4, 2.5], 0xb89a5a],
    ['plate', [0, 0, PLATE_Z, 118, 46, 1.6], 0x9c7b3c],
    ['c6', [0, 2.6, PLATE_Z + 1.6, 51.8, 22.86, 7.5], 0x1b5e36],
    ['tp', [2, 28.5, PLATE_Z + 2.6, 26, 17, 5], 0x244c8a],
    ['mt', [29, 28.5, PLATE_Z + 2.6, 37, 17, 14], 0x182f5c],
    ['lcd', [66, 9.75, PLATE_Z + 1.6, 52, 26.5, 17.55], 0x181411],
    ['drv', [69.5, 37, PLATE_Z + 1.6, 32, 8.5, 5], 0x2b2621],
    ['mot', [102, 3, PLATE_Z + 1.6, 14, 6, 6], 0xd9d6cf],
    ['irtx', [109.1, 39.1, PLATE_Z + 1.6, 5.8, 5.8, 8], 0x6e1414],
    ['sw', [57.5, 18, PLATE_Z + 1.6, 8.5, 9.4, 10], 0x2b2621],
    ['c2', [72.5, 1.3, PLATE_Z + 1.6, 5, 5, 11], 0x1f1b18],
    ['c1', [84, 0, PLATE_Z + 1.6, 8, 8, 11.5], 0x1f1b18],
    ['irrx', [93, 1, PLATE_Z + 1.6, 7, 6, 5.5], 0x181411],
  ];

  const wc = (x, y, z) => new THREE.Vector3(x - FL_L / 2, z, y - FL_W / 2);
  const barePartGroups = {};

  function addMmBox(g, w, h, d, col, x, y, z, edged = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), col.isMaterial ? col : toonMat(col));
    m.position.set(x, y, z);
    if (edged) addCadEdge(m);
    g.add(m);
    return m;
  }

  function addMmCyl(g, r, h, col, x, y, z, seg = 16) {
    const m = addCadEdge(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), col.isMaterial ? col : toonMat(col)));
    m.position.set(x, y, z);
    g.add(m);
    return m;
  }

  BARE_PARTS.forEach(([key, b, col]) => {
    const [x0, y0, z0, dx, dy, dz] = b;
    const g = new THREE.Group();
    const zc = z0 + dz / 2;
    g.position.copy(wc(x0 + dx / 2, y0 + dy / 2, zc));
    bareWrap.add(g);
    barePartGroups[key] = g;
    registerExplode(flipperExplodeParts, g, [0, (zc - FL_T / 2) * 2.2, 0]);

    if (key.startsWith('ft')) {
      const ext = dz > 5 ? 1.8 : 0;
      addMmBox(g, dx, dz + ext, dy, col, 0, -ext / 2, 0);
      return;
    }
    if (key === 'card1' || key === 'card2') {
      addMmBox(g, dx, dz, dy, col, 0, 0, 0);
      return;
    }

    switch (key) {
      case 'coil': {
        for (let i = 0; i < 4; i++) {
          const tr = new THREE.Mesh(new THREE.TorusGeometry(16 - i * 1.4, 0.55, 8, 36), matCopper);
          tr.rotation.x = Math.PI / 2;
          tr.position.y = 0.6;
          tr.scale.set(1.45, 1.0, 0.85);
          g.add(tr);
        }
        break;
      }
      case 'rc522': {
        const rcTex = createBoardFaceTexture(maxAniso, {
          bg: '#1c3b6e',
          trace: '#285294',
          border: '#e6b84c',
          badge: '13.56 MHZ NFC',
          title: 'MFRC522',
          line1: 'SPI 3.3V · AÇIK YÜZ',
          line2: 'SCK/MOSI LCD ORTAK',
        });
        const rcMesh = createLabeledBoard(dx, 1.6, dy, 0x1c3b6e, rcTex);
        rcMesh.position.y = -dz / 2 + 0.8;
        g.add(rcMesh);
        addMmBox(g, 50, 0.35, 2.5, matCopper, 0, -dz / 2 - 0.05, -13, false);
        addMmBox(g, 50, 0.35, 2.5, matCopper, 0, -dz / 2 - 0.05, 13, false);
        addMmBox(g, 2.5, 0.35, 28, matCopper, -24, -dz / 2 - 0.05, 0, false);
        addMmBox(g, 2.5, 0.35, 28, matCopper, 24, -dz / 2 - 0.05, 0, false);
        for (let k = 0; k < 8; k++) {
          addMmBox(g, 1.4, 0.5, 1.4, matGold, -26, -dz / 2 + 2.0, (k - 3.5) * 2.54, false);
        }
        break;
      }
      case 'plate': {
        addMmBox(g, dx, dz, dy, col, 0, 0, 0);
        const nx = Math.floor(dx / 2.54);
        const ny = Math.floor(dy / 2.54);
        const dots = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 6), matGold, nx * ny * 2);
        let idx = 0;
        const m4 = new THREE.Matrix4();
        for (const sgn of [1, -1]) {
          for (let a = 0; a < nx; a++) {
            for (let b2 = 0; b2 < ny; b2++) {
              m4.makeTranslation(-dx / 2 + 1.6 + a * 2.54, sgn * (dz / 2 + 0.04), -dy / 2 + 1.6 + b2 * 2.54);
              dots.setMatrixAt(idx++, m4);
            }
          }
        }
        g.add(dots);
        break;
      }
      case 'c6': {
        const yb = -dz / 2;
        addMmBox(g, 51.8, 1.6, dy, col, 0, yb + 3.3, 0);
        const c6Tex = createBoardFaceTexture(maxAniso, {
          bg: '#d9d6cf',
          trace: '#c4c0b7',
          border: '#ed670f',
          badge: 'ESPRESSIF',
          title: 'ESP32-C6',
          line1: 'WROOM-1 · N8',
          line2: 'WIFI 6 · BLE 5',
        });
        const shield = createLabeledBoard(19.5, 2.6, 18, 0xd9d6cf, c6Tex);
        shield.position.set(10.15, yb + 5.4, 0);
        g.add(shield);
        addMmBox(g, 6, 0.4, 18, 0x0f3b21, 22.9, yb + 4.3, 0);
        addMmBox(g, 7.3, 3.4, 8.9, matSilver, -23.5, yb + 5.8, 0);
        addMmBox(g, 42, 2.5, 2.4, matDark, 0, yb + 1.25, -dy / 2 + 1.2);
        addMmBox(g, 42, 2.5, 2.4, matDark, 0, yb + 1.25, dy / 2 - 1.2);
        break;
      }
      case 'tp': {
        const tpTex = createBoardFaceTexture(maxAniso, {
          bg: '#1c3b6e',
          trace: '#285294',
          border: '#f6f5f1',
          badge: 'CHARGER',
          title: 'TP4056',
          line1: 'USB-C 5V IN',
          line2: '3.7V LiPo',
        });
        const tpMesh = createLabeledBoard(26, 1.6, 17, 0x1c3b6e, tpTex);
        tpMesh.position.y = -dz / 2 + 0.8;
        g.add(tpMesh);
        addMmBox(g, 7.5, 3.2, 9, matSilver, -11.2, -dz / 2 + 3.2, 0);
        break;
      }
      case 'mt': {
        const mtTex = createBoardFaceTexture(maxAniso, {
          bg: '#182f5c',
          trace: '#22407a',
          border: '#ed670f',
          badge: 'BOOST',
          title: 'MT3608',
          line1: '3.7V → 5.3V',
          line2: 'DC-DC STEP UP',
        });
        const mtMesh = createLabeledBoard(37, 1.6, 17, 0x182f5c, mtTex);
        mtMesh.position.y = -dz / 2 + 0.8;
        g.add(mtMesh);
        addMmBox(g, 10, dz - 2.2, 10, matDark, 8, 0.8, 0);
        addMmBox(g, 6.5, 4.5, 6.5, matHot, -12, -dz / 2 + 3.8, 0);
        break;
      }
      case 'rdm': {
        const rdmTex = createBoardFaceTexture(maxAniso, {
          bg: '#6b1d1d',
          trace: '#8a2828',
          border: '#e6b84c',
          badge: '125 KHZ',
          title: 'RDM6300',
          line1: 'BOBİN İÇİ PCB',
          line2: 'TX → GPIO15',
        });
        const rdmMesh = createLabeledBoard(38.5, 1.6, 19, 0x6b1d1d, rdmTex);
        rdmMesh.position.y = -dz / 2 + 1.1;
        g.add(rdmMesh);
        break;
      }
      case 'bat': {
        const batFlipMat = toonMat(0xffffff, {
          map: createBatteryTexture(maxAniso, '1S', '3.7V', '1000 mAh'),
        });
        addMmBox(g, dx, dz, dy, batFlipMat, 0, 0, 0);
        const bh = 7.7;
        const bw = dy + 2.2;
        const bc = 6.75 - zc;
        for (const bx of [-14, 14]) {
          addMmBox(g, 4, 0.25, bw, 0x0b0907, bx, bc + bh / 2 + 0.12, 0, false);
          addMmBox(g, 4, 0.25, bw, 0x0b0907, bx, bc - bh / 2 - 0.12, 0, false);
          for (const sgn of [1, -1]) {
            addMmBox(g, 4, bh, 0.25, 0x0b0907, bx, bc, sgn * (bw / 2 - 0.12), false);
          }
        }
        break;
      }
      case 'lcd': {
        const py = dz / 2 - 5.8;
        addMmBox(g, 52, 1.6, 26.5, col, 0, py, 0);
        addMmBox(g, 27.5, 1.2, 25, 0x0b0907, -10, py + 1.4, 0);
        const sc = new THREE.Mesh(new THREE.PlaneGeometry(23.4, 23.4), new THREE.MeshBasicMaterial({ map: oledTex }));
        sc.rotation.x = -Math.PI / 2;
        sc.position.set(-10, py + 2.1, 0);
        g.add(sc);
        addMmCyl(g, 3.2, 4.6, matHot, 16, py + 2.5, 5, 16);
        for (const [bx, bz] of [[16, -5], [12, -8], [20, -8], [16, -11]]) {
          addMmCyl(g, 1.9, 2.4, matBone, bx, py + 1.8, bz, 12);
        }
        for (const z of [-8.89, 8.89]) {
          addMmBox(g, 50, 10.8, 2.5, matDark, 0, -dz / 2 + 5.4, z);
        }
        break;
      }
      case 'mot': {
        const m = addMmCyl(g, 3, 14, matSilver, 0, 0, 0, 16);
        m.rotation.z = Math.PI / 2;
        const e = addMmCyl(g, 1.2, 3, matCopper, 8, 0, 0, 12);
        e.rotation.z = Math.PI / 2;
        break;
      }
      case 'irtx': {
        addMmCyl(g, 2.5, dz - 2.5, col, 0, -1.25, 0, 14);
        const dm = new THREE.Mesh(new THREE.SphereGeometry(2.5, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), toonMat(col));
        dm.position.y = dz / 2 - 2.5;
        g.add(dm);
        break;
      }
      case 'c1':
      case 'c2': {
        addMmCyl(g, dx / 2, dz, col, 0, 0, 0, 14);
        break;
      }
      case 'sw': {
        addMmCyl(g, 5, 8, col, 0, -1, 0, 14);
        const kb = addMmCyl(g, 1.5, 4, matHot, 0, 4, 0, 10);
        kb.rotation.x = Math.PI / 2;
        break;
      }
      default:
        addMmBox(g, dx, dz, dy, col, 0, 0, 0);
    }
  });

  // Plaka altındaki renkli lehim telleri
  const HX = (v) => (v - 1) * 2.54 + 1.3;
  const BARE_WIRES = [
    [18, 2, 28, 6, 0xed670f], [18, 10, 29, 6, 0xd9d6cf], [12, 10, 43, 13, 0xf6f5f1],
    [8, 10, 38, 13, 0x3ecf8e], [10, 2, 37, 13, 0xe6b84c], [11, 10, 42, 13, 0xed670f],
    [10, 10, 41, 13, 0xc97a3d], [9, 10, 40, 13, 0xe6b84c], [14, 10, 46, 6, 0x3ecf8e],
    [28, 6, 34, 3, 0xed670f], [15, 2, 30, 3, 0xe6b84c], [41, 13, 29, 3, 0xc97a3d],
    [13, 2, 27, 3, 0x3ecf8e], [7, 2, 33, 3, 0xed670f], [5, 2, 29, 1, 0xe6b84c],
  ];
  const plateGroup = barePartGroups.plate;
  if (plateGroup) {
    const pPos = plateGroup.position;
    BARE_WIRES.forEach(([ax, ay, bx, by, hex]) => {
      const p1 = wc(HX(ax), HX(ay), PLATE_Z - 0.55).sub(pPos);
      const p2 = wc(HX(bx), HX(by), PLATE_Z - 0.55).sub(pPos);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p1, p2]), 2, 0.28, 5),
        new THREE.MeshBasicMaterial({ color: hex })
      );
      plateGroup.add(tube);
    });
  }

  enableShadows(flipperRoot);
  scene.add(flipperRoot);

  /* ==========================================================
     MODEL BİLGİLERİ & ETKİLEŞİM
     ========================================================== */
  const MODEL_META = {
    drone: {
      badge: 'VOXHOD-P4 // QUAD-SAR',
      kicker: '1. NESİL SAHA ARACI · AÇIK X-ŞASİ',
      title: 'VoxHOD v3 SAR Drone',
      desc: '4S 1850 mAh LiPo, 4-in-1 45A ESC (3-faz kablolu), STM32 uçuş kontrolcüsü, M10 GPS direği ve MIPI-CSI şerit kablosuyla alt nadir kameraya bağlı ESP32-P4 v1.3 kartı. Ön FPV kamera ileri (+Z), alt gimbal tam aşağı (-Y) bakar.',
      specs: [
        ['Dedektör', 'VoxHOD v3 · 197 KB int8'],
        ['Hız (ESP32-P4)', '321 ms/karo · 332 KB Arena'],
        ['HERIDAL Yakalama', '%83,9 @ 0,35 yanlış alarm'],
        ['Çift Kamera', 'Ön FPV (+Z) · Alt Nadir (-Y)'],
      ],
      note: 'Patlatılmış Görünüm ve Oklar düğmesiyle 4-in-1 ESC, Uçuş Kontrolcüsü, ESP32-P4 v1.3 kartı ve MIPI-CSI bağlantısını tek tek inceleyebilirsin.',
      actionLabelOn: '◎ Arama Konisi: AÇIK',
      actionLabelOff: '◎ Arama Konisi: KAPALI',
    },
    nano: {
      badge: 'NANO (75 KB) + POSIBRAIN (60.8 KB) // MİKRO-SAR',
      kicker: '2. NESİL MİKRO KEŞİF · KANALLI (DUCTED)',
      title: 'VoxHOD Nano + Posibrain',
      desc: 'Ağır gimbal ve açık pervaneler yerine orman-içi/dar alan taraması için 4 kanallı koruma halkası, 2S mikro LiPo, gömülü alt kamera ve üst üste VOXHOD NANO (75 KB) + POSIBRAIN RL (60,8 KB) çift kart mimarisi.',
      specs: [
        ['Toplam Flash (2 Model)', '135,8 KB (Yarım Posi ile 96,8 KB)'],
        ['Toplam Tensor Arena', '218 KB (paylaşımlı) / ~230 KB (ayrı)'],
        ['ESP32-P4 (569 KB boş)', '✅ %38–40 SRAM · ~153 ms/adım'],
        ['ESP32-S3 (350 KB boş)', '✅ %62–66 SRAM (Wi-Fi açıkken %87)'],
      ],
      note: 'Sonuç: KALDIRIYOR. İki model birlikte tek bir VoxHOD v3’ten (197 KB) bile hafiftir; Patlatılmış Görünüm ve Oklar ile iki kartı yakından inceleyebilirsin.',
      actionLabelOn: '◎ Posibrain Oto-Rota: AÇIK',
      actionLabelOff: '◎ Posibrain Oto-Rota: KAPALI',
    },
    flipper: {
      badge: '118×46×32.1 MM // BARE PERFBOARD STACK',
      kicker: 'GERÇEK BOM · 46×18 PERFBOARD + 26 PARÇA',
      title: 'makeshift-flipper (Bare Stack)',
      desc: 'Repodaki (hardware/perfboard/bare_stack.html) kasasız mimari: 118×46 mm perfboard üstünde Waveshare ESP32-C6-DEV-KIT-N8, Pico-LCD-1.3, TP4056 ve MT3608; altında karton-LiPo sandviçi, RC522 ve bobin içi RDM6300.',
      specs: [
        ['Üst Yüz', 'ESP32-C6-DEV-KIT-N8 + Pico-LCD-1.3'],
        ['Güç & Sürücü', 'TP4056 + MT3608 + 2×2N2222A + Motor'],
        ['Omurga & Sandviç', '46×18 Perfboard (64 tel) + Karton/LiPo'],
        ['Açık Okuma Yüzü', 'RC522 (13.56MHz) + RDM6300 Bobin İçi'],
      ],
      note: 'Patlatılmış Görünüm ve Oklar düğmesiyle RC522, RDM6300, TP4056, MT3608 ve ESP32-C6 katmanlarını tek tek inceleyebilirsin.',
      actionLabelOn: '▶ LCD Ekran Değiştir',
      actionLabelOff: '▶ LCD Ekran Değiştir',
    },
  };

  let activeModel = 'drone';
  let exploded = false;
  let explodeAmount = 0;
  let scanConeVisible = true;
  let posiHoloVisible = true;
  let showCallouts = false;

  // Bilgilendirme Okları (3D → 2D projeksiyonlu ok + etiket katmanı, TR/EN destekli)
  const overlayEl = document.createElement('div');
  overlayEl.className = 'lab3d-overlay is-hidden';
  overlayEl.setAttribute('aria-hidden', 'true');
  const svgNS = 'http://www.w3.org/2000/svg';
  const svgEl = document.createElementNS(svgNS, 'svg');
  svgEl.setAttribute('class', 'lab3d-lines');
  const defsEl = document.createElementNS(svgNS, 'defs');
  [
    ['lab3d-arrow', '#f6f5f1'],
    ['lab3d-arrow-hot', '#ed670f'],
  ].forEach(([id, fill]) => {
    const marker = document.createElementNS(svgNS, 'marker');
    marker.setAttribute('id', id);
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto');
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M 0 1 L 10 5 L 0 9 z');
    path.setAttribute('fill', fill);
    marker.appendChild(path);
    defsEl.appendChild(marker);
  });
  svgEl.appendChild(defsEl);
  const svgLinesGroup = document.createElementNS(svgNS, 'g');
  svgEl.appendChild(svgLinesGroup);
  overlayEl.appendChild(svgEl);
  container.appendChild(overlayEl);

  const CALLOUT_DEFS = {
    drone: [
      { obj: batteryGroup, offset: new THREE.Vector3(0, 0.08, 0), side: 'left', title: '4S LiPo Batarya', sub: '1850 mAh · XT60 Güç', hot: false },
      { obj: avionicsGroup, offset: new THREE.Vector3(0.25, 0.04, 0), side: 'right', title: 'ESP32-P4 v1.3 Kartı', sub: 'VoxHOD v3 · 197 KB int8', hot: true },
      { obj: escGroup, offset: new THREE.Vector3(-0.35, 0.02, 0), side: 'left', title: '4-in-1 45A ESC + FC', sub: 'STM32 · 3-Faz Motor Sürücü', hot: false },
      { obj: topDeckGroup, offset: new THREE.Vector3(0, 0.45, -0.82), side: 'right', title: 'M10 GPS + 5.8GHz Anten', sub: 'SAR Koordinat & Telemetri', hot: false },
      { obj: frontCamGroup, offset: new THREE.Vector3(0, 0, 0.2), side: 'left', title: 'Ön FPV Kamera (+Z)', sub: 'İleri Görüş · Seyir', hot: false },
      { obj: gimbalGroup, offset: new THREE.Vector3(0, -0.18, 0), side: 'right', title: 'Alt Nadir Kamera (-Y)', sub: 'Aşağı Tarama · MIPI-CSI', hot: true },
    ],
    nano: [
      { obj: canopyGroup, offset: new THREE.Vector3(0, 0.12, 0), side: 'left', title: '2S Mikro LiPo + Kanopi', sub: 'Hafif Güç Paketi', hot: false },
      { obj: posiBoardGroup, offset: new THREE.Vector3(0.3, 0.04, 0), side: 'right', title: 'Posibrain RL Kartı', sub: '60,8 KB · PPO Arama Politikası', hot: true },
      { obj: nanoVisionBoard, offset: new THREE.Vector3(-0.3, 0.02, 0), side: 'left', title: 'VoxHOD Nano Kartı', sub: '75 KB · 151 ms · 218 KB Arena', hot: true },
      { obj: nanoRoot, offset: new THREE.Vector3(0.95, 0.12, 0.95), side: 'right', title: 'Kanallı Koruma (Ducted)', sub: '4× Dar Alan Pervane Koruması', hot: false },
      { obj: nanoFrontCam, offset: new THREE.Vector3(0, 0, 0.14), side: 'left', title: 'Ön Seyir Kamerası (+Z)', sub: 'ToF Engel Algılama', hot: false },
      { obj: nanoCamGroup, offset: new THREE.Vector3(0, -0.16, 0), side: 'right', title: 'Alt Nadir Kamera (-Y)', sub: '15×15 Posibrain Tarama', hot: true },
    ],
    flipper: [
      { obj: barePartGroups.lcd, offset: new THREE.Vector3(0, 4, 0), side: 'left', title: 'Pico-LCD-1.3 Ekran', sub: '240×240 IPS · Joystick + 4 Tuş', hot: true },
      { obj: barePartGroups.c6, offset: new THREE.Vector3(0, 4, 0), side: 'right', title: 'ESP32-C6-DEV-KIT-N8', sub: 'Wi-Fi 6 · BLE 5 · 8 MB Flash', hot: true },
      { obj: barePartGroups.tp, offset: new THREE.Vector3(0, 3, 0), side: 'right', title: 'TP4056 + MT3608 Güç', sub: 'USB-C Şarj · 5V Boost', hot: false },
      { obj: barePartGroups.plate, offset: new THREE.Vector3(-30, 0, 0), side: 'left', title: '46×18 Perfboard Omurga', sub: '118×46 mm · 64 Lehimli Tel', hot: false },
      { obj: barePartGroups.rc522, offset: new THREE.Vector3(0, -2, 0), side: 'left', title: 'RC522 NFC (13.56 MHz)', sub: 'SPI · Açık Okuma Yüzü', hot: false },
      { obj: barePartGroups.rdm, offset: new THREE.Vector3(0, -2, 0), side: 'right', title: 'RDM6300 + 125 kHz Bobin', sub: 'Bobin İçi RFID · Karton/LiPo', hot: false },
    ],
  };

  function trText(s) {
    return window.i18n && typeof window.i18n.t === 'function' ? window.i18n.t(s) : s;
  }

  let activeCalloutItems = [];
  const tmpProj = new THREE.Vector3();

  function rebuildCallouts(key) {
    activeCalloutItems.forEach((it) => {
      if (it.tagEl.parentNode) it.tagEl.parentNode.removeChild(it.tagEl);
    });
    svgLinesGroup.innerHTML = '';
    activeCalloutItems = [];

    const defs = CALLOUT_DEFS[key] || [];
    defs.forEach((def) => {
      if (!def.obj) return;
      const tag = document.createElement('div');
      tag.className = `lab3d-tag side-${def.side}${def.hot ? ' hot' : ''}`;
      const b = document.createElement('b');
      b.textContent = trText(def.title);
      const sp = document.createElement('span');
      sp.textContent = trText(def.sub);
      tag.appendChild(b);
      tag.appendChild(sp);
      overlayEl.appendChild(tag);

      const poly = document.createElementNS(svgNS, 'polyline');
      poly.setAttribute('fill', 'none');
      poly.setAttribute('stroke', def.hot ? '#ed670f' : 'rgba(246, 245, 241, 0.72)');
      poly.setAttribute('stroke-width', def.hot ? '1.6' : '1.2');
      poly.setAttribute('marker-end', def.hot ? 'url(#lab3d-arrow-hot)' : 'url(#lab3d-arrow)');
      svgLinesGroup.appendChild(poly);

      const dot = document.createElementNS(svgNS, 'circle');
      dot.setAttribute('r', def.hot ? '3.2' : '2.5');
      dot.setAttribute('fill', def.hot ? '#ed670f' : '#f6f5f1');
      svgLinesGroup.appendChild(dot);

      activeCalloutItems.push({ def, tagEl: tag, titleEl: b, subEl: sp, poly, dot });
    });
  }

  function refreshCalloutButton() {
    if (!calloutBtn) return;
    calloutBtn.classList.toggle('on', showCallouts);
    calloutBtn.textContent = trText(showCallouts ? '↗ Oklar: AÇIK' : '↗ Oklar: KAPALI');
  }

  function updateCallouts() {
    if (!showCallouts || activeCalloutItems.length === 0) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w < 10 || h < 10) return;
    svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const leftItems = [];
    const rightItems = [];
    activeCalloutItems.forEach((it) => {
      tmpProj.copy(it.def.offset);
      it.def.obj.localToWorld(tmpProj);
      tmpProj.project(camera);
      it.ax = (tmpProj.x * 0.5 + 0.5) * w;
      it.ay = (-tmpProj.y * 0.5 + 0.5) * h;
      if (it.def.side === 'left') leftItems.push(it);
      else rightItems.push(it);
    });

    const placeSide = (list, isLeft) => {
      list.sort((a, b) => a.ay - b.ay);
      const count = list.length;
      const topPad = 42;
      const botPad = 42;
      const usableH = Math.max(40, h - topPad - botPad);
      const marginX = w < 520 ? 8 : 14;

      list.forEach((it, idx) => {
        const ty = count === 1 ? h * 0.5 : topPad + (idx / (count - 1)) * usableH;
        const tx = isLeft ? marginX : w - marginX;
        it.tagEl.style.left = `${tx}px`;
        it.tagEl.style.top = `${ty}px`;

        const tw = it.tagEl.offsetWidth || 120;
        const startX = isLeft ? tx + tw : tx - tw;
        const elbowX = isLeft ? startX + 16 : startX - 16;
        // Ok ucunun noktadan 5px geride bitmesi için
        const dx = it.ax - elbowX;
        const dy = it.ay - ty;
        const dist = Math.hypot(dx, dy) || 1;
        const endX = it.ax - (dx / dist) * 5;
        const endY = it.ay - (dy / dist) * 5;

        it.poly.setAttribute(
          'points',
          `${startX.toFixed(1)},${ty.toFixed(1)} ${elbowX.toFixed(1)},${ty.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`
        );
        it.dot.setAttribute('cx', it.ax.toFixed(1));
        it.dot.setAttribute('cy', it.ay.toFixed(1));
      });
    };

    placeSide(leftItems, true);
    placeSide(rightItems, false);
  }

  window.addEventListener('langchange', () => {
    refreshCalloutButton();
    if (explodeBtn) explodeBtn.textContent = trText(exploded ? '⊟ Birleştir' : '⊞ Patlatılmış Görünüm');
    applyMeta(activeModel);
    activeCalloutItems.forEach((it) => {
      it.titleEl.textContent = trText(it.def.title);
      it.subEl.textContent = trText(it.def.sub);
    });
  });

  let targetTheta = 0.62;
  let targetPhi = 1.08;
  let targetRadius = 5.4;
  let curTheta = targetTheta;
  let curPhi = targetPhi;
  let curRadius = targetRadius;

  function applyMeta(key) {
    const m = MODEL_META[key];
    if (badgeEl) badgeEl.textContent = m.badge;
    if (kickerEl) kickerEl.textContent = m.kicker;
    if (titleEl) titleEl.textContent = m.title;
    if (descEl) descEl.textContent = m.desc;
    if (noteEl) noteEl.textContent = m.note;
    if (dlEl) {
      dlEl.innerHTML = m.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    }
    if (actionBtn) {
      if (key === 'drone') {
        actionBtn.textContent = scanConeVisible ? m.actionLabelOn : m.actionLabelOff;
        actionBtn.classList.toggle('on', scanConeVisible);
      } else if (key === 'nano') {
        actionBtn.textContent = posiHoloVisible ? m.actionLabelOn : m.actionLabelOff;
        actionBtn.classList.toggle('on', posiHoloVisible);
      } else {
        actionBtn.textContent = m.actionLabelOn;
        actionBtn.classList.add('on');
      }
    }
  }

  function switchModel(key) {
    activeModel = key;
    const isDrone = key !== 'flipper';
    droneRoot.visible = key === 'drone';
    nanoRoot.visible = key === 'nano';
    flipperRoot.visible = key === 'flipper';
    terrainRoot.visible = isDrone;
    v3HoloGroup.visible = key === 'drone' && scanConeVisible;
    posiHoloGroup.visible = key === 'nano' && posiHoloVisible;
    floorGrid.visible = !isDrone;
    shadowPlane.visible = !isDrone;
    tabBtns.forEach((b) => {
      const on = b.dataset.model === key;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (key === 'flipper') {
      targetTheta = 0.55;
      targetPhi = 1.02;
      targetRadius = 5.0;
    } else if (key === 'nano') {
      targetTheta = -0.52;
      targetPhi = 1.06;
      targetRadius = 5.3;
    } else {
      targetTheta = 0.62;
      targetPhi = 1.1;
      targetRadius = 5.7;
    }
    applyMeta(key);
    rebuildCallouts(key);
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => switchModel(btn.dataset.model || 'drone'));
  });

  if (explodeBtn) {
    explodeBtn.addEventListener('click', () => {
      exploded = !exploded;
      explodeBtn.classList.toggle('on', exploded);
      explodeBtn.textContent = trText(exploded ? '⊟ Birleştir' : '⊞ Patlatılmış Görünüm');
    });
  }

  if (calloutBtn) {
    calloutBtn.addEventListener('click', () => {
      showCallouts = !showCallouts;
      overlayEl.classList.toggle('is-hidden', !showCallouts);
      refreshCalloutButton();
    });
  }

  if (actionBtn) {
    actionBtn.addEventListener('click', () => {
      if (activeModel === 'drone') {
        scanConeVisible = !scanConeVisible;
        v3HoloGroup.visible = scanConeVisible;
        applyMeta('drone');
      } else if (activeModel === 'nano') {
        posiHoloVisible = !posiHoloVisible;
        posiHoloGroup.visible = posiHoloVisible;
        applyMeta('nano');
      } else {
        oledModeIdx = (oledModeIdx + 1) % OLED_MODES.length;
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => switchModel(activeModel));
  }

  let isDown = false;
  let lastX = 0;
  let lastY = 0;

  container.addEventListener('pointerdown', (e) => {
    isDown = true;
    lastX = e.clientX;
    lastY = e.clientY;
    container.setPointerCapture(e.pointerId);
  });

  container.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    targetTheta -= dx * 0.008;
    targetPhi = Math.max(0.25, Math.min(Math.PI - 0.25, targetPhi - dy * 0.008));
  });

  const endPointer = () => {
    isDown = false;
  };
  container.addEventListener('pointerup', endPointer);
  container.addEventListener('pointercancel', endPointer);

  container.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      targetRadius = Math.max(2.6, Math.min(9.5, targetRadius + e.deltaY * 0.0035));
    },
    { passive: false }
  );

  const onResize = () => {
    const w = container.clientWidth;
    const h = Math.max(1, container.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(
      Math.max(200, Math.floor(w / PIXEL_DIV)),
      Math.max(140, Math.floor(h / PIXEL_DIV)),
      false
    );
  };
  window.addEventListener('resize', onResize);

  applyMeta('drone');
  rebuildCallouts('drone');
  refreshCalloutButton();
  drawOled(0);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let inView = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        inView = entries[0].isIntersecting;
        if (inView) clock.getDelta();
      },
      { rootMargin: '140px' }
    ).observe(container);
  }

  const clock = new THREE.Clock();
  const lensWorld = new THREE.Vector3();
  function animate() {
    requestAnimationFrame(animate);
    if (!inView && !isDown) return;
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.getElapsedTime();

    if (!isDown && !reduceMotion) {
      targetTheta += dt * 0.2;
    }

    curTheta += (targetTheta - curTheta) * 0.09;
    curPhi += (targetPhi - curPhi) * 0.09;
    curRadius += (targetRadius - curRadius) * 0.09;

    const targetExp = exploded ? 1 : 0;
    explodeAmount += (targetExp - explodeAmount) * 0.09;

    const effRadius = curRadius + explodeAmount * (activeModel === 'flipper' ? 0.85 : 1.55);
    const lookY = (activeModel === 'flipper' ? 0 : -0.32) + explodeAmount * 0.3;
    camera.position.set(
      effRadius * Math.sin(curPhi) * Math.sin(curTheta),
      effRadius * Math.cos(curPhi) + lookY,
      effRadius * Math.sin(curPhi) * Math.cos(curTheta)
    );
    camera.lookAt(0, lookY, 0);

    droneExplodeParts.forEach(({ obj, base, offset }) => {
      obj.position.copy(base).addScaledVector(offset, explodeAmount);
    });
    nanoExplodeParts.forEach(({ obj, base, offset }) => {
      obj.position.copy(base).addScaledVector(offset, explodeAmount);
    });
    flipperExplodeParts.forEach(({ obj, base, offset }) => {
      obj.position.copy(base).addScaledVector(offset, explodeAmount);
    });

    if (activeModel === 'drone') {
      droneRoot.position.y = Math.sin(t * 2.1) * 0.07;
      droneRoot.rotation.z = Math.sin(t * 1.4) * 0.022;
      droneRoot.updateMatrixWorld(true);
      propellers.forEach(({ group, dir }) => {
        group.rotation.y += dt * 28 * dir;
      });
      if (scanConeVisible) {
        lensWorld.set(0, -0.25, 0);
        gimbalGroup.localToWorld(lensWorld);
        updateDrapedConeApex(v3Cone, lensWorld.x, lensWorld.y, lensWorld.z);
        updateDrapedStrip(v3ScanBar, Math.sin(t * 1.8) * 0.96, 0.04);
        const tx = Math.round(Math.sin(t * 0.95) * 3) * 0.2;
        const tz = Math.round(Math.cos(t * 0.75) * 3) * 0.2;
        updateDrapedBoxRing(v3TargetCell, tx, tz, 1, 0.045);
        const pulse = 1 + Math.sin(t * 6) * 0.12;
        updateDrapedCircleRing(v3LockRing, tx, tz, pulse, 0.05);
      }
    } else if (activeModel === 'nano') {
      nanoRoot.position.y = Math.sin(t * 2.8) * 0.06;
      nanoRoot.rotation.x = Math.sin(t * 1.9) * 0.03;
      nanoRoot.rotation.z = Math.cos(t * 1.6) * 0.03;
      nanoRoot.updateMatrixWorld(true);
      nanoProps.forEach(({ group, dir }) => {
        group.rotation.y += dt * 36 * dir;
      });
      if (posiHoloVisible) {
        lensWorld.set(0, -0.21, 0);
        nanoCamGroup.localToWorld(lensWorld);
        updateDrapedConeApex(nanoCone, lensWorld.x, lensWorld.y, lensWorld.z);
        const nx = Math.round(Math.sin(t * 1.1) * 3) * 0.16;
        const nz = Math.round(Math.cos(t * 0.85) * 3) * 0.16;
        updateDrapedBoxRing(targetCell, nx, nz, 1, 0.045);
      }
    } else {
      flipperRoot.position.y = Math.sin(t * 1.8) * 0.05;
      drawOled(t);
    }

    renderer.render(scene, camera);
    updateCallouts();
  }

  animate();
}
