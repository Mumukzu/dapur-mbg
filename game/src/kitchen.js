// kitchen.js — builds the whole 3D kitchen: sky-blue walls, cream floor,
// back counter row (fridge, pantry, chopping board, stove, sink, serve window),
// central island, props, steam and fridge mist. All geometry is procedural.
import * as THREE from 'three';
import { INGREDIENTS } from './config.js';

const SKY_BLUE = 0x7ec8f2;
const SKY_BLUE_DARK = 0x5aa8dd;
const CREAM = 0xf6e7c8;
const CREAM_DARK = 0xe8d3a8;
const WHITE = 0xf8f8f4;
const STEEL = 0xb9c2c9;
const WOOD = 0xc98d4e;
const WOOD_DARK = 0x9a6a33;

function mat(color, rough = 0.85, metal = 0.0) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}

function box(w, h, d, color, x = 0, y = 0, z = 0, rough = 0.85) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, rough));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(rt, rb, h, color, x = 0, y = 0, z = 0, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function sph(r, color, x = 0, y = 0, z = 0, ws = 16, hs = 12) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function textTexture(lines, w, h, bg, fg, sub = null) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = Math.floor(h * 0.42);
  g.font = `bold ${size}px Arial, sans-serif`;
  while (g.measureText(lines[0]).width > w * 0.92 && size > 10) { size -= 2; g.font = `bold ${size}px Arial, sans-serif`; }
  g.fillText(lines[0], w / 2, h * 0.36);
  if (lines[1]) {
    let s2 = Math.floor(h * 0.16);
    g.font = `bold ${s2}px Arial, sans-serif`;
    while (g.measureText(lines[1]).width > w * 0.94 && s2 > 8) { s2 -= 1; g.font = `bold ${s2}px Arial, sans-serif`; }
    g.fillText(lines[1], w / 2, h * 0.74);
  }
  if (sub) {
    let s3 = Math.floor(h * 0.12);
    g.font = `${s3}px Arial, sans-serif`;
    while (g.measureText(sub).width > w * 0.94 && s3 > 8) { s3 -= 1; g.font = `${s3}px Arial, sans-serif`; }
    g.fillText(sub, w / 2, h * 0.9);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// One small readable prop per ingredient, built from primitives.
export function buildIngredientProp(id, scale = 1) {
  const g = new THREE.Group();
  const c = INGREDIENTS[id].color;
  switch (id) {
    case 'rice': {
      g.add(box(0.34, 0.22, 0.26, 0xf5f0dc, 0, 0.11, 0));
      g.add(cyl(0.16, 0.13, 0.1, 0xffffff, 0, 0.27, 0)); break;
    }
    case 'egg': {
      g.add(box(0.34, 0.1, 0.24, 0xd8c49a, 0, 0.05, 0));
      g.add(sph(0.07, 0xfff3c4, -0.09, 0.15, 0)); g.add(sph(0.07, 0xfff3c4, 0.08, 0.15, 0)); break;
    }
    case 'chili': {
      for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 10), mat(0xd7263d));
        cone.position.set(-0.1 + i * 0.1, 0.15, (i % 2) * 0.08 - 0.04);
        cone.rotation.z = 0.5 - i * 0.4; cone.castShadow = true; g.add(cone);
      } break;
    }
    case 'veggies': {
      g.add(sph(0.13, 0x3fa34d, -0.06, 0.11, 0)); g.add(sph(0.11, 0x57b368, 0.09, 0.1, 0.03));
      g.add(sph(0.08, 0x2c7a3a, 0.02, 0.2, -0.05)); break;
    }
    case 'noodle': {
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.06, 10, 20), mat(0xf2c14e));
      t.rotation.x = Math.PI / 2; t.position.y = 0.08; t.castShadow = true; g.add(t); break;
    }
    case 'chicken': {
      g.add(sph(0.14, 0xf2b8a0, 0, 0.12, 0)); g.add(cyl(0.045, 0.045, 0.2, 0xf8e0c8, 0.16, 0.1, 0)); break;
    }
    case 'fish': {
      const b = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.42, 12), mat(0x7fb3d5));
      b.rotation.z = Math.PI / 2; b.position.y = 0.1; b.castShadow = true; g.add(b);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 4), mat(0x5b8fb5));
      tail.rotation.z = -Math.PI / 2; tail.position.set(-0.26, 0.1, 0); g.add(tail); break;
    }
    case 'tofu': g.add(box(0.24, 0.16, 0.24, 0xfbf7ef, 0, 0.08, 0)); break;
    case 'tempeh': g.add(box(0.3, 0.12, 0.2, 0xc68a4b, 0, 0.06, 0)); g.add(box(0.3, 0.03, 0.2, 0xa06a30, 0, 0.13, 0)); break;
    case 'beef': g.add(box(0.3, 0.14, 0.22, 0x8e3b2f, 0, 0.07, 0)); g.add(box(0.2, 0.05, 0.14, 0xc96a55, 0, 0.15, 0)); break;
    case 'potato': g.add(sph(0.11, 0xd9a441, -0.07, 0.1, 0)); g.add(sph(0.1, 0xc98f2e, 0.08, 0.09, 0.04)); break;
    case 'carrot': {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.32, 10), mat(0xe8722a));
      cone.rotation.z = Math.PI / 2.4; cone.position.set(0, 0.12, 0); cone.castShadow = true; g.add(cone);
      g.add(sph(0.05, 0x3fa34d, 0.16, 0.22, 0)); break;
    }
    case 'tomato': g.add(sph(0.12, 0xe63946, 0, 0.11, 0)); g.add(sph(0.05, 0x3fa34d, 0.02, 0.22, 0)); break;
    case 'onion': g.add(sph(0.12, 0xe8d8f0, 0, 0.11, 0)); g.add(sph(0.1, 0xc9a8d8, 0, 0.1, 0.02)); break;
    case 'milk': {
      g.add(box(0.18, 0.26, 0.18, 0xffffff, 0, 0.13, 0));
      g.add(box(0.18, 0.08, 0.18, 0x3fa7d6, 0, 0.3, 0)); break;
    }
    case 'fruit': {
      g.add(cyl(0.17, 0.12, 0.12, 0xb0793f, 0, 0.06, 0));
      g.add(sph(0.08, 0xff8c42, -0.06, 0.17, 0)); g.add(sph(0.08, 0x7bc043, 0.07, 0.17, 0.02)); break;
    }
    default: g.add(sph(0.12, c, 0, 0.12, 0));
  }
  g.scale.setScalar(scale);
  return g;
}

// A plated dish that looks worth serving: food mound (rice / noodle nest),
// mains arranged around it, golden yolk on egg dishes, chili + herb garnish,
// a sauce drizzle ring, and rising steam wisps (animated by buildKitchen).
export function buildPlatedDish(dish) {
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.27, 0.06, 22), mat(0xffffff, 0.4));
  plate.position.y = 0.03; plate.castShadow = true; g.add(plate);
  const has = (id) => dish.recipe.includes(id);
  if (has('rice')) {
    const mound = sph(0.2, 0xfff8dc, 0, 0.12, 0); mound.scale.y = 0.55; g.add(mound);
  } else if (has('noodle')) {
    const nest = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.07, 10, 20), mat(0xf2c14e));
    nest.rotation.x = Math.PI / 2; nest.position.y = 0.1; nest.castShadow = true; g.add(nest);
  } else {
    const mound = sph(0.18, 0xf5f0dc, 0, 0.1, 0); mound.scale.y = 0.5; g.add(mound);
  }
  const mains = dish.recipe.filter((id) => id !== 'rice' && id !== 'noodle');
  mains.forEach((id, i) => {
    const a = (i / Math.max(mains.length, 1)) * Math.PI * 2 + 0.5;
    const px = Math.cos(a) * 0.17, pz = Math.sin(a) * 0.17;
    if (id === 'egg') {
      // fried egg: white disc + golden yolk (no carton on a plate)
      const white = cyl(0.11, 0.11, 0.02, 0xfffdf2, px, 0.1, pz, 18); g.add(white);
      const yolk = sph(0.055, 0xffb703, px, 0.13, pz);
      yolk.material = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.25, emissive: 0x442200 });
      g.add(yolk);
    } else if (id === 'milk') {
      g.add(cyl(0.06, 0.05, 0.14, 0xffffff, px, 0.14, pz, 14));
      g.add(cyl(0.055, 0.055, 0.02, 0x3fa7d6, px, 0.2, pz, 14));
    } else {
      const p = buildIngredientProp(id, 0.85);
      p.position.set(px, 0.08, pz); g.add(p);
    }
  });
  // garnish: red chili slices + green herb leaves on top (bigger, so the
  // plate reads delicious at a glance, even in a still screenshot)
  for (let i = 0; i < 2; i++) {
    const chili = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.17, 8), mat(0xd7263d, 0.5));
    chili.rotation.z = Math.PI / 2; chili.position.set(-0.1 + i * 0.2, 0.21, -0.12); chili.castShadow = true; g.add(chili);
  }
  for (let i = 0; i < 3; i++) {
    const leaf = sph(0.055, 0x2c7a3a, -0.14 + i * 0.14, 0.2, 0.14);
    leaf.scale.set(1.4, 0.35, 0.9); g.add(leaf);
  }
  // golden star halo: 5 tiny stars orbiting the plate — the dish reads
  // "fresh and magical" even in a still screenshot
  for (let i = 0; i < 5; i++) {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.05),
      new THREE.MeshBasicMaterial({ color: 0xffc94d }));
    const a = (i / 5) * Math.PI * 2;
    star.position.set(Math.cos(a) * 0.34, 0.3, Math.sin(a) * 0.34);
    star.userData.star = true; star.userData.baseY = 0.3; star.userData.angle = a;
    g.add(star);
  }
  // one dish-specific accent so no two plates garnish alike
  if (has('fish')) {
    // lemon wedge: flat yellow half-disc beside the fish
    const lemon = cyl(0.09, 0.09, 0.02, 0xffe066, 0.13, 0.2, 0.1, 16); g.add(lemon);
    const lemonSkin = cyl(0.095, 0.095, 0.015, 0xf2a007, 0.13, 0.19, 0.1, 16); g.add(lemonSkin);
  } else if (has('tomato')) {
    // tomato slice: red disc with a green leaf
    const slice = cyl(0.09, 0.09, 0.025, 0xe63946, -0.13, 0.2, 0.1, 16); g.add(slice);
    const seed = sph(0.03, 0xff8fa3, -0.13, 0.22, 0.1); g.add(seed);
  } else if (has('fruit')) {
    // orange slice: orange disc + a mint leaf
    const orange = cyl(0.09, 0.09, 0.025, 0xff8c42, 0.12, 0.2, -0.1, 16); g.add(orange);
    const mint = sph(0.05, 0x2c7a3a, 0.12, 0.23, -0.1); mint.scale.set(1.3, 0.3, 1); g.add(mint);
  } else if (has('noodle')) {
    // sesame seeds + spring-onion rings on noodle dishes
    for (let i = 0; i < 4; i++) {
      const seed = sph(0.018, 0xfff8dc, -0.12 + (i % 2) * 0.24, 0.21, -0.06 + Math.floor(i / 2) * 0.14, 6, 5);
      g.add(seed);
    }
    for (let i = 0; i < 2; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 12), mat(0x3fa34d, 0.6));
      ring.rotation.x = Math.PI / 2; ring.position.set(0.02 + i * 0.12, 0.2, 0.14); g.add(ring);
    }
  }
  // sauce drizzle: thin red/gold/orange arc on the plate rim
  const drizzleColor = (has('chili') || has('tomato')) ? 0xd7263d : has('fruit') ? 0xff8c42 : 0xf2a007;
  const drizzle = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.015, 8, 24, Math.PI * 1.2),
    new THREE.MeshStandardMaterial({ color: drizzleColor, roughness: 0.3 }));
  drizzle.rotation.x = Math.PI / 2; drizzle.rotation.z = 0.4; drizzle.position.y = 0.065; g.add(drizzle);
  // steam wisps (registered with the kitchen so they animate)
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 1 }));
    s.position.set(-0.1 + i * 0.1, 0.35, 0);
    s.userData.steam = true; s.userData.baseY = 0.35; s.userData.rise = i * 0.33;
    g.add(s);
  }
  return g;
}

export function buildKitchen(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const animated = { steam: [], mist: [], flames: [], plateSteam: [], plateStars: [] };

  // ---- Room: bright sky-blue walls, warm cream floor (clearly different) ----
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat(CREAM, 0.95));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -0.5); floor.receiveShadow = true;
  root.add(floor);
  // cream floor tiles
  for (let x = -6; x <= 6; x += 2) for (let z = -5; z <= 4; z += 2) {
    const t = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), mat(x % 4 === 0 ? CREAM : CREAM_DARK, 0.95));
    t.rotation.x = -Math.PI / 2; t.position.set(x + 0.5, 0.005, z + 0.5); t.receiveShadow = true;
    root.add(t);
  }
  const backWall = box(14, 5.2, 0.3, SKY_BLUE, 0, 2.6, -5.2);
  const leftWall = box(0.3, 5.2, 10, SKY_BLUE, -7, 2.6, -0.5);
  const rightWall = box(0.3, 5.2, 10, SKY_BLUE, 7, 2.6, -0.5);
  root.add(backWall, leftWall, rightWall);
  const baseboard = box(14, 0.25, 0.34, WHITE, 0, 0.12, -5.2);
  root.add(baseboard);

  // ---- Wall decor: MBG poster, clock, window ----
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5),
    new THREE.MeshStandardMaterial({ map: textTexture(['MBG', 'FREE NUTRITIOUS MEALS'], 512, 340, '#fff7d6', '#d7263d', 'FREE MEALS FOR SCHOOL KIDS'), roughness: 0.9 }));
  poster.position.set(0, 3.5, -5.02); root.add(poster);
  const clock = new THREE.Group();
  const clockFace = cyl(0.42, 0.42, 0.06, WHITE, 0, 0, 0); clock.add(clockFace); clock.rotation.x = Math.PI / 2;
  const hand = box(0.04, 0.3, 0.02, 0x222222, 0.08, 0.08, 0.05); clock.add(hand);
  clock.position.set(3.4, 3.9, -5.0); root.add(clock);
  const win = new THREE.Group();
  const winParts = [box(1.9, 1.5, 0.08, WHITE, 0, 0, 0), box(1.6, 1.2, 0.1, 0xbfe6ff, 0, 0, 0),
    box(0.06, 1.2, 0.11, WHITE, 0, 0, 0), box(1.6, 0.06, 0.11, WHITE, 0, 0, 0)];
  winParts.forEach((p) => win.add(p));
  win.position.set(-3.4, 3.7, -5.0); root.add(win);

  // two pendant lamps, clear of the MBG poster in the middle
  for (const lx of [-2.8, 2.8]) {
    const lamp = new THREE.Group();
    lamp.add(cyl(0.02, 0.02, 1.1, 0x333333, 0, 0.55, 0));
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.3, 20, 1, true), mat(0xffc94d, 0.6));
    shade.position.y = 0; shade.castShadow = true; lamp.add(shade);
    const bulb = sph(0.09, 0xfff2b0, 0, -0.12, 0); bulb.material = new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffdf6b, emissiveIntensity: 1.4 }); lamp.add(bulb);
    lamp.position.set(lx, 4.9, -0.6); root.add(lamp);
  }

  // ---- Back counter row ----
  const counterTop = box(12.6, 0.12, 1.1, WOOD, 0, 0.95, -4.35);
  const counterBody = box(12.6, 0.9, 1.0, 0xe8e2d4, 0, 0.45, -4.35);
  root.add(counterTop, counterBody);
  // cabinet doors
  for (let x = -5.9; x <= 5.9; x += 1.05) root.add(box(0.95, 0.7, 0.04, 0xf2ede0, x, 0.45, -3.83));

  // ---- FRIDGE: tall white double-door kulkas, top freezer, FREEZER badge ----
  const fridge = new THREE.Group();
  const body = box(1.7, 2.9, 1.05, WHITE, 0, 1.45, 0, 0.5); fridge.add(body);
  const freezerDoor = box(1.62, 0.85, 0.08, 0xffffff, 0, 2.42, 0.55, 0.4); fridge.add(freezerDoor);
  // hinge on the RIGHT side: the door swings open toward the chopping
  // board (open floor), never toward the pantry rack on the left — so the
  // open door, its "7 FRIDGE" label and the cold interior read clearly
  // from the default / cover camera angle.
  const fridgeDoor = new THREE.Group(); // swings open
  fridgeDoor.position.set(0.81, 1.5, 0.55);
  const doorPanel = box(1.62, 1.9, 0.08, 0xffffff, -0.81, 0, 0, 0.4); fridgeDoor.add(doorPanel);
  const handle = box(0.07, 1.5, 0.06, STEEL, -1.5, 0.1, 0.08, 0.35); fridgeDoor.add(handle);
  fridge.add(fridgeDoor); // the door group must be in the scene to be seen
  const handleTop = box(0.07, 0.6, 0.06, STEEL, 0.72, 2.35, 0.6, 0.35); fridge.add(handleTop);
  // magnets: little coloured squares on the doors
  [[-0.5, 2.6, 0xff5a5a], [-0.2, 2.45, 0x3fa7d6], [0.3, 2.7, 0xffc94d], [-0.45, 1.9, 0x7bc043], [0.45, 2.1, 0xff8c42], [0.1, 1.6, 0x9b5de5]].forEach(([x, y, col]) => {
    fridge.add(box(0.12, 0.12, 0.02, col, x, y, 0.6));
  });
  // FREEZER badge + "7 FRIDGE" label (canvas textures)
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.34),
    new THREE.MeshStandardMaterial({ map: textTexture(['FREEZER', '❄ -18°C'], 512, 160, '#1b6fb5', '#ffffff'), roughness: 0.6 }));
  badge.position.set(0, 2.42, 0.6); fridge.add(badge);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.55),
    new THREE.MeshStandardMaterial({ map: textTexture(['7 FRIDGE', 'COLD • FRESH • MBG'], 512, 256, '#fff7d6', '#d7263d'), roughness: 0.6 }));
  label.position.set(-0.81, -0.35, 0.06); fridgeDoor.add(label);
  // cold-air mist at the door base
  for (let i = 0; i < 4; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 1 }));
    puff.position.set(-0.6 + i * 0.4, 0.25, 0.75); puff.scale.y = 0.5;
    fridge.add(puff); animated.mist.push(puff);
  }
  // milk cartons on top of the fridge
  const milk1 = buildIngredientProp('milk', 1.1); milk1.position.set(-0.4, 2.9, 0); fridge.add(milk1);
  const milk2 = buildIngredientProp('milk', 1.1); milk2.position.set(0.35, 2.9, 0); fridge.add(milk2);
  fridge.position.set(-3.3, 0, -4.35);
  root.add(fridge);

  // ---- PANTRY: open shelves with dry goods ----
  const pantry = new THREE.Group();
  for (let s = 0; s < 3; s++) pantry.add(box(1.9, 0.07, 0.55, WOOD_DARK, 0, 1.1 + s * 0.75, 0));
  pantry.add(box(0.07, 2.6, 0.55, WOOD_DARK, -0.95, 1.4, 0)); pantry.add(box(0.07, 2.6, 0.55, WOOD_DARK, 0.95, 1.4, 0));
  const pantryGoods = [['rice', -0.6, 1.25], ['noodle', 0.1, 1.25], ['egg', 0.65, 1.25], ['chili', -0.55, 2.0], ['veggies', 0.15, 2.0], ['potato', 0.65, 2.0], ['onion', -0.5, 2.75], ['tomato', 0.2, 2.75], ['carrot', 0.65, 2.75]];
  pantryGoods.forEach(([id, x, y]) => { const p = buildIngredientProp(id, 0.9); p.position.set(x, y, 0.05); pantry.add(p); });
  pantry.position.set(-5.4, 0, -4.5);
  root.add(pantry);

  // ---- CHOP BOARD ----
  const chop = new THREE.Group();
  chop.add(box(0.9, 0.06, 0.6, 0xd8b98a, 0, 1.04, 0));
  const knife = box(0.34, 0.02, 0.07, STEEL, 0.3, 1.09, -0.12, 0.3); chop.add(knife);
  const chopped = buildIngredientProp('veggies', 0.8); chopped.position.set(-0.2, 1.08, 0.05); chop.add(chopped);
  const chopped2 = buildIngredientProp('carrot', 0.8); chopped2.position.set(0.15, 1.08, 0.1); chop.add(chopped2);
  chop.position.set(-1.1, 0, -4.35);
  root.add(chop);

  // ---- STOVE with two pots, flames, steam ----
  const stove = new THREE.Group();
  stove.add(box(1.7, 0.06, 0.8, 0x2b2b2b, 0, 1.04, 0));
  for (const px of [-0.4, 0.42]) {
    stove.add(cyl(0.26, 0.22, 0.22, 0x3a3f44, px, 1.18, 0, 18));
    const soup = cyl(0.23, 0.23, 0.02, 0xe8722a, px, 1.29, 0, 18); stove.add(soup);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 10),
      new THREE.MeshStandardMaterial({ color: 0xff9f1c, emissive: 0xff7b00, emissiveIntensity: 2 }));
    flame.position.set(px, 1.0, 0.28); stove.add(flame); animated.flames.push(flame);
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, roughness: 1 }));
      s.position.set(px + (Math.random() - 0.5) * 0.15, 1.45 + i * 0.18, 0);
      s.userData.rise = i * 0.33; stove.add(s); animated.steam.push(s);
    }
  }
  stove.add(box(1.7, 0.5, 0.1, STEEL, 0, 1.6, -0.45, 0.35)); // backsplash
  stove.position.set(1.3, 0, -4.35);
  root.add(stove);

  // ---- SINK (also the trash) ----
  const sink = new THREE.Group();
  sink.add(box(0.8, 0.1, 0.6, STEEL, 0, 1.0, 0, 0.3));
  sink.add(cyl(0.03, 0.03, 0.5, STEEL, -0.25, 1.25, -0.15, 10));
  const tap = cyl(0.03, 0.03, 0.35, STEEL, 0, 1.4, -0.15, 10); tap.rotation.z = Math.PI / 2; sink.add(tap);
  const water = cyl(0.3, 0.3, 0.02, 0x7ec8f2, 0, 1.02, 0, 18); water.material = new THREE.MeshStandardMaterial({ color: 0x7ec8f2, transparent: true, opacity: 0.8 }); sink.add(water);
  sink.position.set(3.3, 0, -4.35);
  root.add(sink);

  // ---- SERVE WINDOW (right end of the back counter) ----
  const serve = new THREE.Group();
  serve.add(box(1.9, 0.12, 1.2, WOOD, 0, 1.0, 0.35));
  const bell = new THREE.Group();
  bell.add(cyl(0.14, 0.18, 0.08, 0xffc94d, 0, 0.06, 0, 18));
  bell.add(sph(0.03, 0x333333, 0, 0.13, 0)); bell.position.set(0.55, 1.06, 0.3); serve.add(bell);
  const plate1 = cyl(0.22, 0.18, 0.04, WHITE, -0.45, 1.08, 0.3, 20); serve.add(plate1);
  const plateFood = buildIngredientProp('rice', 0.9); plateFood.position.set(-0.45, 1.12, 0.3); serve.add(plateFood);
  // lunchboxes ready for school kids — the MBG story, in 3D: a stack of
  // red, gold and blue boxes waiting at the serve window
  [0xd7263d, 0xffc94d, 0x3fa7d6].forEach((col, i) => {
    const lb = box(0.34, 0.2, 0.26, col, -0.68 + i * 0.05, 1.16 + i * 0.21, -0.3);
    lb.rotation.y = 0.12 * i; serve.add(lb);
    serve.add(box(0.36, 0.05, 0.28, 0xffffff, -0.68 + i * 0.05, 1.28 + i * 0.21, -0.3));
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.5),
    new THREE.MeshStandardMaterial({ map: textTexture(['SERVE ★', 'PICK UP HERE'], 512, 170, '#d7263d', '#ffffff'), roughness: 0.7 }));
  sign.position.set(0, 2.1, -0.5); serve.add(sign);
  serve.position.set(5.3, 0, -4.35);
  root.add(serve);

  // ---- CENTRAL ISLAND (assembly counter) ----
  const island = new THREE.Group();
  island.add(box(3.6, 0.9, 1.3, 0xe8e2d4, 0, 0.45, 0));
  island.add(box(3.8, 0.1, 1.5, WOOD, 0, 0.95, 0));
  island.add(box(3.8, 0.08, 0.08, WOOD_DARK, 0, 0.5, 0.72));
  // ingredients waiting on the island (a full, busy counter)
  const islandGoods = [['rice', -1.4], ['egg', -0.95], ['veggies', -0.45], ['tomato', 0.45], ['noodle', 0.95], ['chili', 1.35], ['fruit', 1.55]];
  islandGoods.forEach(([id, x]) => { const p = buildIngredientProp(id, 0.95); p.position.set(x, 1.0, -0.25); island.add(p); });
  island.position.set(0, 0, -0.7);
  root.add(island);

  // round rug in the foreground (fills the empty floor in front of the island)
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.7, 28), mat(0xd7263d, 0.95));
  rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.012, 2.0); rug.receiveShadow = true; root.add(rug);
  const rugIn = new THREE.Mesh(new THREE.CircleGeometry(1.25, 28), mat(0xfff7d6, 0.95));
  rugIn.rotation.x = -Math.PI / 2; rugIn.position.set(0, 0.015, 2.0); rugIn.receiveShadow = true; root.add(rugIn);
  const rugSun = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), mat(0xffc94d, 0.9));
  rugSun.rotation.x = -Math.PI / 2; rugSun.position.set(0, 0.018, 2.0); rugSun.receiveShadow = true; root.add(rugSun);

  // ---- Crates + fruit basket on the floor (busy look) ----
  const crate1 = box(0.8, 0.5, 0.8, WOOD, -6.2, 0.25, -1.5); root.add(crate1);
  const crateVeg = buildIngredientProp('veggies', 1.2); crateVeg.position.set(-6.2, 0.55, -1.5); root.add(crateVeg);
  const crate2 = box(0.8, 0.5, 0.8, WOOD_DARK, 6.2, 0.25, -1.8); root.add(crate2);
  const crateFruit = buildIngredientProp('fruit', 1.2); crateFruit.position.set(6.2, 0.55, -1.8); root.add(crateFruit);

  const stations = {
    fridge: { pos: new THREE.Vector3(-3.3, 0, -2.9), face: new THREE.Vector3(-3.3, 0, -4.35) },
    pantry: { pos: new THREE.Vector3(-5.4, 0, -2.9), face: new THREE.Vector3(-5.4, 0, -4.5) },
    chop: { pos: new THREE.Vector3(-1.1, 0, -2.9), face: new THREE.Vector3(-1.1, 0, -4.35) },
    stove: { pos: new THREE.Vector3(1.3, 0, -2.9), face: new THREE.Vector3(1.3, 0, -4.35) },
    serve: { pos: new THREE.Vector3(5.3, 0, -2.9), face: new THREE.Vector3(5.3, 0, -4.35) },
    trash: { pos: new THREE.Vector3(3.3, 0, -2.9), face: new THREE.Vector3(3.3, 0, -4.35) },
    island: { pos: new THREE.Vector3(0, 0, 0.9), face: new THREE.Vector3(0, 0, -0.7) },
  };

  function update(dt, t) {
    for (const s of animated.steam) {
      s.position.y = 1.45 + ((t * 0.35 + s.userData.rise) % 1) * 0.7;
      s.material.opacity = 0.65 * (1 - ((t * 0.35 + s.userData.rise) % 1));
      s.scale.setScalar(0.7 + ((t * 0.35 + s.userData.rise) % 1) * 0.9);
    }
    animated.mist.forEach((m, i) => {
      m.material.opacity = 0.22 + 0.16 * Math.sin(t * 1.6 + i * 1.7);
      m.position.x = -0.6 + i * 0.4 + Math.sin(t * 0.9 + i) * 0.05;
    });
    animated.flames.forEach((f, i) => { f.scale.y = 0.85 + 0.3 * Math.sin(t * 11 + i * 2.4); });
    for (const s of animated.plateSteam) {
      const ph = (t * 0.4 + s.userData.rise) % 1;
      s.position.y = s.userData.baseY + ph * 0.5;
      s.material.opacity = 0.6 * (1 - ph);
      s.scale.setScalar(0.8 + ph * 0.9);
    }
    for (const s of animated.plateStars) {
      const a = s.userData.angle + t * 1.2;
      s.position.x = Math.cos(a) * 0.34; s.position.z = Math.sin(a) * 0.34;
      s.position.y = s.userData.baseY + Math.sin(t * 2 + s.userData.angle * 3) * 0.06;
      s.rotation.y = t * 2;
    }
  }

  return {
    root, stations, island, fridgeDoor, update,
    // 1.05 rad (~60°): the door stands diagonally out into the open floor,
    // its "7 FRIDGE" face visible from the camera. (A full 1.9 rad swing
    // turns the face edge-on to the default camera and the door vanishes.)
    setFridgeOpen(open) { fridgeDoor.rotation.y = open ? 1.05 : 0; },
    registerPlateSteam(group) {
      animated.plateSteam.length = 0;
      animated.plateStars.length = 0;
      group.traverse((o) => {
        if (o.userData && o.userData.steam) animated.plateSteam.push(o);
        if (o.userData && o.userData.star) animated.plateStars.push(o);
      });
    },
    clearPlateSteam() { animated.plateSteam.length = 0; animated.plateStars.length = 0; },
  };
}
