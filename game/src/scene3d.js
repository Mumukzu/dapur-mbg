// Dapur MBG — the 3D kitchen itself, built from primitives in Three.js.
// A fixed 3/4 view over a bright sunny kitchen: pale cream tiled floor,
// soft sky-blue walls with a teal wainscot, a back counter (chop board,
// wok stove, fryer), pantry shelves with the six ingredient bins, a front
// island (plating + serve hatch), and a trash bin. Flames flicker over the wok, steam rises from every
// hot pot, and the key light casts real shadows across the floor.
//
// Station world positions (x right, y up, z toward the camera):
//   pantry (-5.7, wall shelves) · board (-2.6) · wok (0.2) · fryer (2.9)
//   plate (-1.3, island) · serve (2.4, island) · fridge (6.9, back wall right)
//   trash (5.2)

import * as THREE from '../vendor/three.module.min.js';
import { makeIngredient, makePlate } from './ingredients3d.js';
import { createChef } from './chef3d.js';

export const STATION_POS = {
  pantry: new THREE.Vector3(-5.7, 2.2, -4.9),
  board: new THREE.Vector3(-2.6, 1.12, -3.6),
  wok: new THREE.Vector3(0.2, 1.12, -3.6),
  fryer: new THREE.Vector3(2.9, 1.12, -3.6),
  plate: new THREE.Vector3(-1.3, 1.12, 0.4),
  serve: new THREE.Vector3(2.4, 1.12, 0.4),
  fridge: new THREE.Vector3(6.9, 2.2, -4.3),
  trash: new THREE.Vector3(5.2, 0.7, 0.8),
};

// Pantry bin slots: three rows of four on the wall shelves (dry goods).
export const PANTRY_BINS = [
  { ing: 'rice', pos: new THREE.Vector3(-7.05, 1.62, -4.85) },
  { ing: 'noodle', pos: new THREE.Vector3(-6.15, 1.62, -4.85) },
  { ing: 'chicken', pos: new THREE.Vector3(-5.25, 1.62, -4.85) },
  { ing: 'egg', pos: new THREE.Vector3(-4.35, 1.62, -4.85) },
  { ing: 'chili', pos: new THREE.Vector3(-7.05, 2.72, -4.85) },
  { ing: 'veg', pos: new THREE.Vector3(-6.15, 2.72, -4.85) },
  { ing: 'potato', pos: new THREE.Vector3(-5.25, 2.72, -4.85) },
  { ing: 'carrot', pos: new THREE.Vector3(-4.35, 2.72, -4.85) },
  { ing: 'tomato', pos: new THREE.Vector3(-7.05, 3.82, -4.85) },
  { ing: 'onion', pos: new THREE.Vector3(-6.15, 3.82, -4.85) },
  { ing: 'tempeh', pos: new THREE.Vector3(-5.25, 3.82, -4.85) },
  { ing: 'beef', pos: new THREE.Vector3(-4.35, 3.82, -4.85) },
];

// Fridge bin slots: cold goods on two shelves on the fridge's front.
export const FRIDGE_BINS = [
  { ing: 'fish', pos: new THREE.Vector3(6.35, 1.62, -3.8) },
  { ing: 'tofu', pos: new THREE.Vector3(7.45, 1.62, -3.8) },
  { ing: 'milk', pos: new THREE.Vector3(6.35, 2.72, -3.8) },
  { ing: 'fruit', pos: new THREE.Vector3(7.45, 2.72, -3.8) },
];

const WOOD = 0xa87c42;
const WOOD_TOP = 0xd2a25e;
const STEEL = 0xc9ced6;

function std(color, rough, metal) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough ?? 0.8, metalness: metal ?? 0.05 });
}
function box(w, h, d, material, x, y, z, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}
function cyl(rt, rb, h, material, x, y, z, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// Checkerboard floor texture, painted at runtime — no image files.
function floorTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 4; x += 1) {
      g.fillStyle = (x + y) % 2 ? '#f0d9a8' : '#fbf0cf';
      g.fillRect(x * 64, y * 64, 64, 64);
      g.strokeStyle = 'rgba(160, 120, 60, 0.18)';
      g.strokeRect(x * 64 + 0.5, y * 64 + 0.5, 63, 63);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// A big wall sign with the kitchen's name, painted at runtime.
function signTexture(text, sub) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = '#3a2415';
  g.fillRect(0, 0, 512, 160);
  g.strokeStyle = '#f2c94c';
  g.lineWidth = 6;
  g.strokeRect(8, 8, 496, 144);
  g.fillStyle = '#ffd23c';
  g.font = '900 64px system-ui, sans-serif';
  g.textAlign = 'center';
  g.fillText(text, 256, 82);
  g.fillStyle = '#fff6e8';
  g.font = '700 26px system-ui, sans-serif';
  g.fillText(sub, 256, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// A frosty badge for the freezer door: a snowflake drawn with lines plus
// the word FREEZER, painted at runtime.
function freezerBadgeTexture() {
  const c = document.createElement('canvas');
  c.width = 320;
  c.height = 128;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 320, 128);
  g.strokeStyle = '#2f8fb5';
  g.lineWidth = 7;
  g.lineCap = 'round';
  const cx = 44;
  const cy = 64;
  for (let i = 0; i < 3; i += 1) {
    const a = (i * Math.PI) / 3;
    g.beginPath();
    g.moveTo(cx - Math.cos(a) * 30, cy - Math.sin(a) * 30);
    g.lineTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30);
    g.stroke();
  }
  g.fillStyle = '#1f6f8f';
  g.font = '900 40px system-ui, sans-serif';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillText('FREEZER', 84, 66);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// A soft round sprite for steam puffs.
function softDotTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,255,0.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// Rising steam: a small pool of points that loop upward and fade.
function makeSteam(origin, count, tint, spread, rise) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const seeds = [];
  for (let i = 0; i < count; i += 1) {
    seeds.push({ a: Math.random() * Math.PI * 2, r: Math.random() * spread, s: 0.5 + Math.random() * 0.8, o: Math.random() });
    pos[i * 3] = origin.x;
    pos[i * 3 + 1] = origin.y;
    pos[i * 3 + 2] = origin.z;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const material = new THREE.PointsMaterial({
    size: 0.55, map: softDotTexture(), transparent: true, opacity: 0.5,
    color: tint, depthWrite: false, sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  return {
    points,
    update(t) {
      for (let i = 0; i < count; i += 1) {
        const s = seeds[i];
        const life = ((t * s.s * 0.35 + s.o) % 1);
        const px = origin.x + Math.cos(s.a + life * 2.2) * (s.r + life * 0.22);
        const py = origin.y + life * rise;
        const pz = origin.z + Math.sin(s.a + life * 2.2) * (s.r + life * 0.22);
        pos[i * 3] = px;
        pos[i * 3 + 1] = py;
        pos[i * 3 + 2] = pz;
      }
      geo.attributes.position.needsUpdate = true;
      material.opacity = 0.34 + 0.16 * Math.sin(t * 1.7);
    },
  };
}

export function buildWorld(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd6ecf5);
  scene.fog = new THREE.Fog(0xd6ecf5, 22, 34);

  const camera = new THREE.PerspectiveCamera(52, container.clientWidth / container.clientHeight, 0.1, 60);
  camera.position.set(0, 6.2, 8.6);
  camera.lookAt(0, 1.0, -3.0);

  // --- Lights: warm key sun through the window, soft fill, hot wok glow.
  const hemi = new THREE.HemisphereLight(0xfff2d8, 0xe8cfa8, 1.0);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe0a8, 2.3);
  sun.position.set(6, 10, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -10;
  sun.shadow.camera.far = 30;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  const wokLight = new THREE.PointLight(0xff8a2a, 12, 6, 1.6);
  wokLight.position.set(0.2, 2.0, -3.2);
  scene.add(wokLight);
  const serveLight = new THREE.PointLight(0xffd23c, 5, 4, 1.8);
  serveLight.position.set(2.4, 2.6, 0.4);
  scene.add(serveLight);

  const world = new THREE.Group();
  scene.add(world);

  // --- Room: floor, soft sky-blue back wall, light teal wainscot, side walls.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -1);
  floor.receiveShadow = true;
  world.add(floor);
  const backWall = box(20, 7, 0.3, std(0xa5d8e8, 0.95), 0, 3.5, -5.6, false);
  backWall.castShadow = false;
  world.add(backWall);
  world.add(box(20, 1.6, 0.34, std(0x7fd1c0, 0.95), 0, 0.8, -5.58, false));
  const leftWall = box(0.3, 7, 14, std(0xc2e6f2, 0.95), -9.2, 3.5, -1, false);
  leftWall.castShadow = false;
  const rightWall = box(0.3, 7, 14, std(0xc2e6f2, 0.95), 9.2, 3.5, -1, false);
  rightWall.castShadow = false;
  world.add(leftWall, rightWall);

  // Wall sign + window with daylight.
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 1.45),
    new THREE.MeshBasicMaterial({ map: signTexture('DAPUR MBG', 'FREE NUTRITIOUS MEALS') }),
  );
  sign.position.set(0, 4.6, -5.42);
  world.add(sign);
  const winFrame = box(2.4, 2.0, 0.12, std(0x5d3a1e, 0.8), 4.4, 3.6, -5.45, false);
  const winGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 1.7),
    new THREE.MeshBasicMaterial({ color: 0xbfe3ff }),
  );
  winGlass.position.set(4.4, 3.6, -5.38);
  world.add(winFrame, winGlass);
  world.add(box(0.06, 1.7, 0.05, std(0x5d3a1e, 0.8), 4.4, 3.6, -5.36, false));
  world.add(box(2.1, 0.06, 0.05, std(0x5d3a1e, 0.8), 4.4, 3.6, -5.36, false));

  // Hanging pans on the back wall (up high, clear of the pantry's top row).
  for (let i = 0; i < 3; i += 1) {
    const pan = cyl(0.34, 0.34, 0.07, std(0x3c3c46, 0.5, 0.7), -7.6 + i * 0.85, 4.6, -5.4);
    pan.rotation.x = Math.PI / 2 - 0.12;
    const handle = box(0.07, 0.5, 0.04, std(0x3c3c46, 0.5, 0.7), -7.6 + i * 0.85, 5.05, -5.42, false);
    world.add(pan, handle);
  }

  // --- Back counter run: chop board, wok stove, fryer.
  world.add(box(11, 1.0, 1.5, std(WOOD, 0.85), 1.3, 0.5, -3.6));
  world.add(box(11, 0.14, 1.6, std(WOOD_TOP, 0.7), 1.3, 1.06, -3.6));
  world.add(box(11, 0.1, 0.08, std(0x5d3a1e, 0.8), 1.3, 1.0, -2.82, false));

  // Chop board: pale board + knife.
  const boardSlab = box(1.15, 0.09, 0.8, std(0xe9d8a6, 0.8), -2.6, 1.17, -3.6);
  world.add(boardSlab);
  const knifeBlade = box(0.62, 0.03, 0.14, std(STEEL, 0.3, 0.8), -2.25, 1.24, -3.85);
  knifeBlade.rotation.y = 0.5;
  const knifeHandle = box(0.3, 0.05, 0.09, std(0x3a2415, 0.8), -1.95, 1.24, -3.72);
  knifeHandle.rotation.y = 0.5;
  world.add(knifeBlade, knifeHandle);

  // Wok stove: steel body, two burners, one wok with flames.
  world.add(box(1.9, 0.5, 1.3, std(0x4a4a55, 0.5, 0.6), 0.2, 1.35, -3.6));
  const wokBowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.52, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.45, metalness: 0.75, side: THREE.DoubleSide }),
  );
  wokBowl.rotation.x = Math.PI;
  wokBowl.position.set(0.2, 1.72, -3.6);
  wokBowl.castShadow = true;
  world.add(wokBowl);
  const wokRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.04, 8, 28),
    std(0x55555f, 0.4, 0.8),
  );
  wokRim.rotation.x = Math.PI / 2;
  wokRim.position.set(0.2, 1.72, -3.6);
  world.add(wokRim);
  const wokHandle = cyl(0.04, 0.04, 0.7, std(0x2a2a30, 0.5, 0.7), 0.85, 1.66, -3.6);
  wokHandle.rotation.z = Math.PI / 2 - 0.25;
  world.add(wokHandle);
  const flames = [];
  const flameCols = [0xff5a2a, 0xff9a3c, 0xffd23c];
  for (let i = 0; i < 3; i += 1) {
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.34 - i * 0.06, 1.0 - i * 0.12, 12),
      new THREE.MeshBasicMaterial({ color: flameCols[i], transparent: true, opacity: 0.9 }),
    );
    flame.position.set(0.2 + (i - 1) * 0.2, 1.62, -3.6 + (i % 2 ? 0.1 : -0.1));
    world.add(flame);
    flames.push(flame);
  }

  // Fryer: steel box, dark oil vat, basket handle.
  world.add(box(1.7, 0.62, 1.3, std(STEEL, 0.35, 0.7), 2.9, 1.42, -3.6));
  const oil = box(1.3, 0.06, 0.95, new THREE.MeshStandardMaterial({ color: 0xc07f1a, roughness: 0.2, metalness: 0.2, emissive: 0x664411, emissiveIntensity: 0.7 }), 2.9, 1.72, -3.6, false);
  world.add(oil);
  const basket = box(1.1, 0.3, 0.8, new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.4, metalness: 0.8, wireframe: false }), 2.9, 1.86, -3.6);
  basket.material.transparent = true;
  basket.material.opacity = 0.55;
  world.add(basket);

  // Shelf above the back counter with jars.
  world.add(box(7.5, 0.08, 0.5, std(WOOD_TOP, 0.8), 1.3, 3.1, -5.15));
  const jarCols = [0xd93a2b, 0xf0b429, 0x4caf50, 0xf6d860, 0xe8a87c];
  jarCols.forEach((c, i) => {
    world.add(cyl(0.16, 0.16, 0.42, std(c, 0.5), -1.4 + i * 0.75, 3.35, -5.15, 14));
    world.add(cyl(0.17, 0.17, 0.06, std(0x5d3a1e, 0.7), -1.4 + i * 0.75, 3.58, -5.15, 14));
  });

  // --- Pantry shelves on the left wall, with twelve ingredient bins.
  const shelfMat = std(WOOD_TOP, 0.8);
  world.add(box(3.9, 0.1, 0.7, shelfMat, -5.7, 1.5, -4.95));
  world.add(box(3.9, 0.1, 0.7, shelfMat, -5.7, 2.6, -4.95));
  world.add(box(3.9, 0.1, 0.7, shelfMat, -5.7, 3.7, -4.95));
  world.add(box(0.1, 3.4, 0.7, std(WOOD, 0.85), -7.65, 2.6, -4.95, false));
  world.add(box(0.1, 3.4, 0.7, std(WOOD, 0.85), -3.75, 2.6, -4.95, false));
  const binMeshes = [];
  for (const bin of [...PANTRY_BINS, ...FRIDGE_BINS]) {
    const crate = box(0.78, 0.34, 0.6, std(0xb98a4e, 0.85), bin.pos.x, bin.pos.y - 0.1, bin.pos.z);
    world.add(crate);
    const sample = makeIngredient(bin.ing, 'raw', 0.85);
    sample.position.copy(bin.pos).add(new THREE.Vector3(0, 0.12, 0));
    world.add(sample);
    binMeshes.push({ ing: bin.ing, crate, sample });
  }

  // --- The fridge (kulkas): a big tall white double-door unit against the
  // back wall, freezer compartment on top with its own door and handle,
  // two long vertical door handles, colourful magnets, a FREEZER badge,
  // and two steel shelves on its front holding the cold ingredients.
  // Cold air mist drifts from its base (see the steams list below).
  const fridgeMat = std(0xeef3f5, 0.35, 0.35);
  world.add(box(2.4, 3.9, 1.1, fridgeMat, 6.9, 1.95, -4.45));
  world.add(box(2.44, 0.08, 1.12, std(0x9fb4bc, 0.4, 0.6), 6.9, 3.92, -4.45, false)); // top cap
  // Freezer door on top (icy blue panel) with a horizontal handle bar.
  world.add(box(2.3, 0.85, 0.06, std(0xdceef7, 0.35, 0.3), 6.9, 3.42, -3.88, false));
  const freezerHandle = cyl(0.035, 0.035, 1.0, std(0x5d6b73, 0.4, 0.7), 6.9, 3.04, -3.82, 8);
  freezerHandle.rotation.z = Math.PI / 2;
  world.add(freezerHandle);
  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(1.25, 0.5),
    new THREE.MeshBasicMaterial({ map: freezerBadgeTexture(), transparent: true }),
  );
  badge.position.set(6.9, 3.48, -3.84);
  world.add(badge);
  // Main double doors below: two white panels with a centre seam and a
  // horizontal seam under the freezer.
  world.add(box(1.12, 2.85, 0.06, std(0xf7fbfc, 0.35, 0.35), 6.32, 1.47, -3.88, false));
  world.add(box(1.12, 2.85, 0.06, std(0xf7fbfc, 0.35, 0.35), 7.48, 1.47, -3.88, false));
  world.add(box(0.04, 2.85, 0.03, std(0x5d6b73, 0.5, 0.5), 6.9, 1.47, -3.86, false)); // centre seam
  world.add(box(2.3, 0.05, 0.03, std(0x5d6b73, 0.5, 0.5), 6.9, 2.95, -3.86, false)); // freezer seam
  // Long vertical door handles on the outer edges (clear of the shelves).
  world.add(cyl(0.04, 0.04, 1.7, std(0x5d6b73, 0.4, 0.7), 5.86, 1.6, -3.74, 8));
  world.add(cyl(0.04, 0.04, 1.7, std(0x5d6b73, 0.4, 0.7), 7.94, 1.6, -3.74, 8));
  // Colourful magnets on the freezer door, left of the badge.
  for (const [mx, my, mc] of [[5.95, 3.55, 0xd93a2b], [6.15, 3.68, 0xf2c94c], [6.05, 3.32, 0x4caf50]]) {
    world.add(cyl(0.05, 0.05, 0.03, std(mc, 0.5), mx, my, -3.84, 10));
  }
  // Steel shelves on the fridge front for the cold bins.
  world.add(box(2.1, 0.06, 0.5, std(STEEL, 0.4, 0.6), 6.9, 1.35, -3.75));
  world.add(box(2.1, 0.06, 0.5, std(STEEL, 0.4, 0.6), 6.9, 2.45, -3.75));
  // A faint cold blue glow in front of the fridge.
  const fridgeLight = new THREE.PointLight(0xbfe3ff, 3, 3.5, 1.8);
  fridgeLight.position.set(6.9, 2.0, -3.3);
  scene.add(fridgeLight);

  // Rice sacks by the pantry.
  for (const [x, z] of [[-7.6, -3.4], [-6.9, -3.1]]) {
    const sack = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10), std(0xd9c39a, 0.95));
    sack.scale.set(1, 0.85, 0.8);
    sack.position.set(x, 0.45, z);
    sack.castShadow = true;
    sack.receiveShadow = true;
    world.add(sack);
  }

  // --- Front island: plating counter + serve hatch.
  world.add(box(7.6, 1.0, 1.3, std(WOOD, 0.85), 0.4, 0.5, 0.4));
  world.add(box(7.6, 0.14, 1.45, std(0xf3e2b8, 0.6), 0.4, 1.06, 0.4));
  const plateMesh = makePlate();
  plateMesh.position.set(-1.3, 1.13, 0.4);
  world.add(plateMesh);
  // Serve hatch: two posts, a lintel, a bell and a warm lamp.
  world.add(box(0.12, 1.5, 0.12, std(0x5d3a1e, 0.8), 1.35, 1.85, -0.15));
  world.add(box(0.12, 1.5, 0.12, std(0x5d3a1e, 0.8), 3.45, 1.85, -0.15));
  world.add(box(2.34, 0.14, 0.14, std(0x5d3a1e, 0.8), 2.4, 2.62, -0.15));
  const bellBase = cyl(0.2, 0.25, 0.12, std(0xf2c94c, 0.3, 0.9), 2.4, 1.2, 0.4);
  const bellDome = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(0xf2c94c, 0.3, 0.9));
  bellDome.position.set(2.4, 1.25, 0.4);
  bellDome.castShadow = true;
  world.add(bellBase, bellDome);
  const lampShade = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 0.3, 18, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xd64533, roughness: 0.5, side: THREE.DoubleSide }),
  );
  lampShade.position.set(2.4, 2.5, 0.4);
  lampShade.castShadow = true;
  const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd23c }));
  lampBulb.position.set(2.4, 2.38, 0.4);
  world.add(lampShade, lampBulb);

  // Trash bin.
  const trash = cyl(0.42, 0.34, 0.85, std(0x5a6b7a, 0.6, 0.4), 5.2, 0.43, 0.8, 18);
  world.add(trash);
  world.add(cyl(0.44, 0.44, 0.06, std(0x3c4a58, 0.6, 0.4), 5.2, 0.88, 0.8, 18));

  // Pendant lamps over the island.
  for (const x of [-1.3, 2.4]) {
    const cord = cyl(0.02, 0.02, 1.6, std(0x2b1a0e, 0.9), x, 5.2, 0.4, 6);
    cord.castShadow = false;
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.4, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x2fb3a6, roughness: 0.6, side: THREE.DoubleSide }));
    shade.position.set(x, 4.35, 0.4);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
    bulb.position.set(x, 4.2, 0.4);
    world.add(cord, shade, bulb);
  }

  // --- Chef Sari, the head cook: presentational only, never game logic.
  const chef = createChef();
  world.add(chef.group);

  // --- Steam jets: wok, fryer, a gentle one over the plate, and cold
  // air mist drifting from the base of the fridge.
  const steams = [
    makeSteam(new THREE.Vector3(0.2, 1.75, -3.6), 16, 0xffffff, 0.25, 1.6),
    makeSteam(new THREE.Vector3(2.9, 1.8, -3.6), 12, 0xffffff, 0.2, 1.3),
    makeSteam(new THREE.Vector3(-1.3, 1.3, 0.4), 8, 0xffffff, 0.3, 0.9),
    makeSteam(new THREE.Vector3(6.9, 0.3, -3.5), 12, 0xd6ecff, 0.9, 1.4),
  ];
  for (const s of steams) world.add(s.points);

  // --- Dynamic holders: hand item, chop job, wok/fryer jobs, plate items.
  const handAnchor = new THREE.Group();
  handAnchor.position.set(-0.2, 1.75, 1.5);
  handAnchor.scale.setScalar(0.85);
  world.add(handAnchor);
  const chopAnchor = new THREE.Group();
  chopAnchor.position.set(-2.6, 1.22, -3.6);
  world.add(chopAnchor);
  const wokAnchor = new THREE.Group();
  wokAnchor.position.set(0.2, 1.78, -3.6);
  world.add(wokAnchor);
  const fryerAnchor = new THREE.Group();
  fryerAnchor.position.set(2.9, 1.8, -3.6);
  world.add(fryerAnchor);
  const plateAnchor = new THREE.Group();
  plateAnchor.position.set(-1.3, 1.22, 0.4);
  world.add(plateAnchor);
  const serveAnchor = new THREE.Group();
  serveAnchor.position.set(2.4, 1.25, 0.4);
  world.add(serveAnchor);

  // Invisible hit boxes for raycast picking (opacity 0, still raycastable).
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const hitMeshes = [];
  function addHit(station, arg, cx, cy, cz, w, h, d) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitMat);
    m.position.set(cx, cy, cz);
    m.userData = { station, arg: arg || null };
    world.add(m);
    hitMeshes.push(m);
    return m;
  }
  // Hit boxes are tall on purpose: they reach up through the floating
  // station labels, so clicking a label hits its own station. (The label
  // anchor sits inside its station's box.)
  // Bin hit boxes are 1.0 tall: the three pantry rows are 1.1 apart, so
  // a taller box would let one row steal clicks from its neighbour.
  for (const bin of PANTRY_BINS) addHit('pantry', bin.ing, bin.pos.x, bin.pos.y, bin.pos.z, 0.88, 1.0, 1.0);
  for (const bin of FRIDGE_BINS) addHit('fridge', bin.ing, bin.pos.x, bin.pos.y, bin.pos.z, 0.88, 1.0, 1.0);
  addHit('board', null, -2.6, 1.95, -3.6, 1.6, 2.4, 1.6);
  addHit('wok', null, 0.2, 1.95, -3.6, 2.0, 2.4, 1.6);
  addHit('fryer', null, 2.9, 1.95, -3.6, 1.9, 2.4, 1.6);
  addHit('plate', null, -1.3, 1.95, 0.4, 2.2, 2.4, 1.5);
  addHit('serve', null, 2.4, 1.9, 0.15, 2.4, 2.4, 1.6);
  addHit('trash', null, 5.2, 0.9, 0.8, 1.2, 2.0, 1.2);

  // Hover highlight rings under the active station.
  const ringGeo = new THREE.RingGeometry(0.55, 0.75, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd23c, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const hoverRing = new THREE.Mesh(ringGeo, ringMat);
  hoverRing.rotation.x = -Math.PI / 2;
  hoverRing.visible = false;
  world.add(hoverRing);
  const selectRing = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.8, 32), new THREE.MeshBasicMaterial({ color: 0x3f9d4e, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
  selectRing.rotation.x = -Math.PI / 2;
  selectRing.visible = false;
  world.add(selectRing);

  function clearGroup(g) {
    while (g.children.length) {
      const child = g.children[0];
      g.remove(child);
      child.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); } });
    }
  }

  // Sync the 3D props to the game state. Called every frame; cheap because
  // it only rebuilds a holder when its contents actually changed.
  const lastSeen = { hand: '', chop: '', wok: '', fryer: '', plate: '', serve: '' };
  function keyOf(item) { return item ? `${item.ing}:${item.state}` : 'none'; }
  function sync(game) {
    const k = game.kitchen;
    const handKey = keyOf(k.hand);
    if (handKey !== lastSeen.hand) {
      lastSeen.hand = handKey;
      clearGroup(handAnchor);
      if (k.hand) {
        const m = makeIngredient(k.hand.ing, k.hand.state, 1);
        handAnchor.add(m);
      }
    }
    const chopKey = k.chop ? `${k.chop.ing}:${k.chop.done ? 'done' : Math.floor(k.chop.progress * 10)}` : 'none';
    if (chopKey !== lastSeen.chop) {
      lastSeen.chop = chopKey;
      clearGroup(chopAnchor);
      if (k.chop) {
        const m = k.chop.done ? makeIngredient(k.chop.ing, 'chopped', 1) : makeIngredient(k.chop.ing, 'raw', 1);
        chopAnchor.add(m);
      }
    }
    for (const slot of ['wok', 'fryer']) {
      const job = k[slot];
      const anchor = slot === 'wok' ? wokAnchor : fryerAnchor;
      const jk = job ? `${job.ing}:${job.burnt ? 'burnt' : job.done ? 'done' : 'cooking'}` : 'none';
      if (jk !== lastSeen[slot]) {
        lastSeen[slot] = jk;
        clearGroup(anchor);
        if (job) anchor.add(makeIngredient(job.ing, job.burnt ? 'burnt' : job.done ? 'cooked' : 'raw', 0.9));
      }
    }
    const plateKey = k.plate.map(keyOf).join('|');
    if (plateKey !== lastSeen.plate) {
      lastSeen.plate = plateKey;
      clearGroup(plateAnchor);
      k.plate.forEach((item, i) => {
        const m = makeIngredient(item.ing, item.state, 0.62);
        m.position.set((i - (k.plate.length - 1) / 2) * 0.42, 0.06, 0);
        plateAnchor.add(m);
      });
    }
    // A finished plate glows at the serve hatch.
    const ready = game.board && game.screen === 'playing' && k.plate.length > 0;
    serveLight.intensity = ready ? 14 : 5;
  }

  function update(dt, t, game) {
    chef.update(dt, t, game);
    for (const s of steams) s.update(t);
    flames.forEach((f, i) => {
      const flick = 0.82 + 0.22 * Math.sin(t * 13 + i * 2.1) + 0.08 * Math.sin(t * 29 + i);
      f.scale.set(flick, flick * (0.9 + 0.15 * Math.sin(t * 17 + i * 3)), flick);
      f.visible = game.screen === 'playing' || game.screen === 'title';
    });
    wokLight.intensity = 10 + 3.5 * Math.sin(t * 11) + 1.5 * Math.sin(t * 23);
    // Knife chops while a chop job runs; the hand item bobs gently.
    if (game.kitchen.chop && !game.kitchen.chop.done) {
      knifeBlade.position.y = 1.24 + Math.abs(Math.sin(t * 9)) * 0.22;
      knifeHandle.position.y = 1.24 + Math.abs(Math.sin(t * 9)) * 0.22;
    } else {
      knifeBlade.position.y = 1.24;
      knifeHandle.position.y = 1.24;
    }
    handAnchor.position.y = 1.75 + Math.sin(t * 2.2) * 0.06;
    handAnchor.rotation.y = t * 0.7;
    sync(game);
  }

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', resize);

  return {
    renderer, scene, camera, hitMeshes, hoverRing, selectRing, chef,
    update, resize, sync,
    project(vec) {
      const v = vec.clone().project(camera);
      return {
        x: (v.x * 0.5 + 0.5) * container.clientWidth,
        y: (-v.y * 0.5 + 0.5) * container.clientHeight,
        behind: v.z > 1,
      };
    },
  };
}
