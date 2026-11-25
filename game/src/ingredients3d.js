// Dapur MBG — every ingredient as a real 3D object.
// Each of the six ingredients has its own shape and colour, and each
// preparation state (raw / chopped / cooked / burnt) reads differently:
// chopped food is cut into pieces, cooked food is browned, burnt food is
// charred black. All geometry is built from primitives — no textures,
// no external models.

import * as THREE from '../vendor/three.module.min.js';

const MATS = {};
function mat(color, rough) {
  const key = `${color}|${rough ?? 0.65}`;
  if (!MATS[key]) MATS[key] = new THREE.MeshStandardMaterial({ color, roughness: rough ?? 0.65, metalness: 0.05 });
  return MATS[key];
}
function mesh(geo, color, rough) {
  const m = new THREE.Mesh(geo, mat(color, rough));
  m.castShadow = true;
  return m;
}
function shadowed(group) {
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
  return group;
}

// A small pile of cut pieces — the chopped state for any ingredient.
function choppedPile(color, dark) {
  const g = new THREE.Group();
  const bits = [
    [0, 0.05, 0, 0.16, 0.07, 0.12, 0.3],
    [0.16, 0.04, 0.06, 0.13, 0.06, 0.11, 1.1],
    [-0.15, 0.04, 0.08, 0.14, 0.06, 0.1, 2.0],
    [0.02, 0.04, -0.14, 0.12, 0.06, 0.1, 0.7],
    [-0.05, 0.1, -0.02, 0.11, 0.06, 0.09, 1.6],
  ];
  for (const [x, y, z, sx, sy, sz, r] of bits) {
    const b = mesh(new THREE.BoxGeometry(sx, sy, sz), Math.random() > 0.5 ? color : dark, 0.8);
    b.position.set(x, y, z);
    b.rotation.y = r;
    g.add(b);
  }
  return shadowed(g);
}

function riceBowl() {
  const g = new THREE.Group();
  const bowl = mesh(new THREE.CylinderGeometry(0.34, 0.22, 0.2, 24), 0xe8e2d4, 0.35);
  bowl.position.y = 0.1;
  const mound = mesh(new THREE.SphereGeometry(0.27, 20, 12), 0xfffaf0, 0.9);
  mound.scale.set(1, 0.55, 1);
  mound.position.y = 0.22;
  g.add(bowl, mound);
  return shadowed(g);
}

function noodleNest(cooked) {
  const g = new THREE.Group();
  const col = cooked ? 0xd98f1d : 0xf0b429;
  const dark = cooked ? 0xa8660f : 0xc98d12;
  const ring = mesh(new THREE.TorusGeometry(0.26, 0.1, 10, 24), col, 0.8);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.1;
  const ring2 = mesh(new THREE.TorusGeometry(0.17, 0.07, 10, 20), dark, 0.8);
  ring2.rotation.x = Math.PI / 2;
  ring2.rotation.z = 0.6;
  ring2.position.y = 0.16;
  const ring3 = mesh(new THREE.TorusGeometry(0.09, 0.05, 8, 16), col, 0.8);
  ring3.rotation.x = Math.PI / 2;
  ring3.rotation.z = 1.9;
  ring3.position.y = 0.2;
  g.add(ring, ring2, ring3);
  return shadowed(g);
}

function chickenDrum(cooked) {
  const g = new THREE.Group();
  const meatCol = cooked ? 0xb96a2e : 0xe8a87c;
  const meat = mesh(new THREE.SphereGeometry(0.24, 20, 16), meatCol, 0.6);
  meat.scale.set(1, 0.9, 1);
  meat.position.set(-0.08, 0.2, 0);
  const bone = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.34, 10), 0xf5efe2, 0.4);
  bone.rotation.z = Math.PI / 2.6;
  bone.position.set(0.22, 0.16, 0);
  const knob = mesh(new THREE.SphereGeometry(0.075, 10, 8), 0xf5efe2, 0.4);
  knob.position.set(0.38, 0.08, 0);
  const skin = mesh(new THREE.SphereGeometry(0.25, 20, 16), cooked ? 0x8a4a1c : 0xd98d5f, 0.55);
  skin.scale.set(0.85, 0.75, 0.85);
  skin.position.set(-0.1, 0.22, 0);
  g.add(meat, bone, knob, skin);
  return shadowed(g);
}

function eggShape(cooked) {
  const g = new THREE.Group();
  if (cooked) {
    // Fried egg: white disc with a proud yolk.
    const white = mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.07, 24), 0xfdfdf8, 0.5);
    white.position.y = 0.05;
    white.scale.set(1, 1, 0.85);
    const yolk = mesh(new THREE.SphereGeometry(0.14, 18, 12), 0xf2a007, 0.35);
    yolk.scale.set(1, 0.6, 1);
    yolk.position.y = 0.12;
    g.add(white, yolk);
  } else {
    const shell = mesh(new THREE.SphereGeometry(0.2, 20, 16), 0xf6d860, 0.45);
    shell.scale.set(0.85, 1.2, 0.85);
    shell.position.y = 0.22;
    g.add(shell);
  }
  return shadowed(g);
}

function chiliShape() {
  const g = new THREE.Group();
  const body = mesh(new THREE.CapsuleGeometry(0.09, 0.34, 6, 12), 0xd93a2b, 0.35);
  body.rotation.z = Math.PI / 2.4;
  body.position.y = 0.16;
  const stem = mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.16, 8), 0x2e7d32, 0.7);
  stem.rotation.z = Math.PI / 2.4 + 0.5;
  stem.position.set(-0.22, 0.32, 0);
  g.add(body, stem);
  return shadowed(g);
}

function vegShape() {
  const g = new THREE.Group();
  const leafCols = [0x4caf50, 0x66bb6a, 0x2e7d32];
  for (let i = 0; i < 3; i += 1) {
    const leaf = mesh(new THREE.SphereGeometry(0.2, 14, 10), leafCols[i], 0.7);
    leaf.scale.set(1, 0.28, 0.6);
    leaf.position.set((i - 1) * 0.16, 0.08 + i * 0.03, (i % 2 ? 0.1 : -0.08));
    leaf.rotation.y = i * 0.9;
    g.add(leaf);
  }
  const stem = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 8), 0x81c784, 0.7);
  stem.rotation.z = Math.PI / 2;
  stem.position.y = 0.07;
  g.add(stem);
  return shadowed(g);
}

function burntLump() {
  const g = new THREE.Group();
  const lump = mesh(new THREE.SphereGeometry(0.22, 12, 10), 0x1c1512, 0.95);
  lump.scale.set(1, 0.6, 1);
  lump.position.y = 0.12;
  const lump2 = mesh(new THREE.SphereGeometry(0.13, 10, 8), 0x2e211a, 0.95);
  lump2.scale.set(1, 0.6, 1);
  lump2.position.set(0.18, 0.08, 0.08);
  g.add(lump, lump2);
  return shadowed(g);
}

function fishShape(cooked) {
  const g = new THREE.Group();
  const bodyCol = cooked ? 0xb98a4a : 0x9fc4d8;
  const bellyCol = cooked ? 0x8a6a30 : 0xd8ecf2;
  const body = mesh(new THREE.SphereGeometry(0.26, 20, 14), bodyCol, 0.55);
  body.scale.set(1.5, 0.55, 0.7);
  body.position.y = 0.16;
  const belly = mesh(new THREE.SphereGeometry(0.2, 16, 12), bellyCol, 0.6);
  belly.scale.set(1.3, 0.4, 0.6);
  belly.position.set(0, 0.1, 0);
  const tail = mesh(new THREE.ConeGeometry(0.16, 0.3, 4), cooked ? 0x8a6a30 : 0x5b8296, 0.6);
  tail.rotation.z = -Math.PI / 2;
  tail.scale.set(1, 1, 0.4);
  tail.position.set(-0.48, 0.16, 0);
  const fin = mesh(new THREE.ConeGeometry(0.09, 0.2, 4), cooked ? 0x8a6a30 : 0x5b8296, 0.6);
  fin.position.set(0.05, 0.32, 0);
  fin.scale.set(1, 1, 0.35);
  const eye = mesh(new THREE.SphereGeometry(0.035, 8, 6), 0x1c1512, 0.4);
  eye.position.set(0.3, 0.2, 0.14);
  g.add(body, belly, tail, fin, eye);
  return shadowed(g);
}

function tofuShape(cooked) {
  const g = new THREE.Group();
  const col = cooked ? 0xd9a85f : 0xfdf6e0;
  const cube = mesh(new THREE.BoxGeometry(0.42, 0.24, 0.34), col, 0.7);
  cube.position.y = 0.12;
  cube.rotation.y = 0.3;
  const cube2 = mesh(new THREE.BoxGeometry(0.34, 0.2, 0.28), cooked ? 0xc08d3e : 0xf2ead0, 0.7);
  cube2.position.set(0.1, 0.32, -0.06);
  cube2.rotation.y = -0.4;
  g.add(cube, cube2);
  return shadowed(g);
}

function tempehShape(cooked) {
  const g = new THREE.Group();
  const col = cooked ? 0x9a6a30 : 0xd9b380;
  const block = mesh(new THREE.BoxGeometry(0.5, 0.2, 0.32), col, 0.8);
  block.position.y = 0.1;
  block.rotation.y = 0.25;
  g.add(block);
  // Fermentation speckles: little dark dots on top.
  for (const [x, z] of [[-0.14, 0.05], [0.02, -0.08], [0.15, 0.06], [-0.02, 0.1]]) {
    const dot = mesh(new THREE.SphereGeometry(0.035, 8, 6), cooked ? 0x5d3a1e : 0x8a6a42, 0.9);
    dot.position.set(x, 0.21, z);
    g.add(dot);
  }
  return shadowed(g);
}

function beefShape(cooked) {
  const g = new THREE.Group();
  const col = cooked ? 0x7c4a20 : 0xb03a30;
  const steak = mesh(new THREE.SphereGeometry(0.28, 18, 12), col, 0.55);
  steak.scale.set(1.25, 0.4, 0.95);
  steak.position.y = 0.11;
  const fat = mesh(new THREE.BoxGeometry(0.5, 0.04, 0.1), 0xf2e2c8, 0.6);
  fat.position.set(0, 0.2, 0.12);
  fat.rotation.y = 0.4;
  g.add(steak, fat);
  return shadowed(g);
}

function potatoShape() {
  const g = new THREE.Group();
  const tuber = mesh(new THREE.SphereGeometry(0.24, 16, 12), 0xd9a85f, 0.9);
  tuber.scale.set(1.25, 0.8, 0.95);
  tuber.position.y = 0.18;
  const eye1 = mesh(new THREE.SphereGeometry(0.035, 8, 6), 0x8a6a30, 0.9);
  eye1.position.set(0.14, 0.3, 0.16);
  const eye2 = mesh(new THREE.SphereGeometry(0.03, 8, 6), 0x8a6a30, 0.9);
  eye2.position.set(-0.18, 0.22, 0.14);
  g.add(tuber, eye1, eye2);
  return shadowed(g);
}

function carrotShape() {
  const g = new THREE.Group();
  const root = mesh(new THREE.ConeGeometry(0.13, 0.52, 14), 0xe86a1c, 0.6);
  root.rotation.z = Math.PI / 2.3;
  root.position.set(0.05, 0.14, 0);
  for (let i = 0; i < 3; i += 1) {
    const leaf = mesh(new THREE.ConeGeometry(0.045, 0.26, 8), 0x2e7d32, 0.7);
    leaf.position.set(-0.2, 0.32 + i * 0.02, (i - 1) * 0.07);
    leaf.rotation.z = -0.4 - i * 0.25;
    g.add(leaf);
  }
  g.add(root);
  return shadowed(g);
}

function tomatoShape() {
  const g = new THREE.Group();
  const body = mesh(new THREE.SphereGeometry(0.24, 18, 14), 0xe8442e, 0.4);
  body.scale.set(1, 0.85, 1);
  body.position.y = 0.2;
  const star = mesh(new THREE.ConeGeometry(0.09, 0.08, 5), 0x2e7d32, 0.7);
  star.position.set(0, 0.4, 0);
  const stem = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8), 0x2e7d32, 0.7);
  stem.position.set(0, 0.44, 0);
  g.add(body, star, stem);
  return shadowed(g);
}

function onionShape() {
  const g = new THREE.Group();
  const bulb = mesh(new THREE.SphereGeometry(0.23, 18, 14), 0xe8d8f0, 0.5);
  bulb.scale.set(1, 1.05, 1);
  bulb.position.y = 0.22;
  const skin = mesh(new THREE.SphereGeometry(0.2, 16, 12), 0xc9a8d8, 0.55);
  skin.scale.set(1, 0.9, 1);
  skin.position.set(0.02, 0.24, 0);
  const sprout = mesh(new THREE.ConeGeometry(0.05, 0.2, 8), 0x66bb6a, 0.7);
  sprout.position.set(0, 0.5, 0);
  g.add(bulb, skin, sprout);
  return shadowed(g);
}

function milkShape() {
  const g = new THREE.Group();
  const carton = mesh(new THREE.BoxGeometry(0.32, 0.42, 0.32), 0xffffff, 0.4);
  carton.position.y = 0.21;
  const band = mesh(new THREE.BoxGeometry(0.34, 0.12, 0.34), 0x4a90d9, 0.4);
  band.position.y = 0.24;
  const top = mesh(new THREE.CylinderGeometry(0.16, 0.23, 0.16, 4), 0xd8ecf2, 0.4);
  top.position.y = 0.5;
  top.rotation.y = Math.PI / 4;
  const cap = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 10), 0x4a90d9, 0.4);
  cap.position.y = 0.6;
  g.add(carton, band, top, cap);
  return shadowed(g);
}

function fruitShape() {
  const g = new THREE.Group();
  // A banana: a curved yellow arc with a brown tip.
  const curve = mesh(new THREE.TorusGeometry(0.22, 0.075, 10, 20, 2.4), 0xf2c94c, 0.5);
  curve.rotation.z = Math.PI * 0.85;
  curve.position.y = 0.16;
  const tip = mesh(new THREE.SphereGeometry(0.06, 8, 6), 0x7c5a2e, 0.7);
  tip.position.set(0.28, 0.1, 0);
  const stem = mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.14, 8), 0x8a6a42, 0.7);
  stem.position.set(-0.22, 0.3, 0);
  stem.rotation.z = 0.5;
  g.add(curve, tip, stem);
  return shadowed(g);
}

// Build one ingredient in a given state: 'raw' | 'chopped' | 'cooked' | 'burnt'.
// `scale` shrinks the piece for plate/pantry display.
export function makeIngredient(ing, state, scale) {
  let group;
  if (state === 'burnt') group = burntLump();
  else if (state === 'chopped') {
    const cols = {
      chili: [0xd93a2b, 0x8f1f14], veg: [0x4caf50, 0x2e7d32],
      potato: [0xd9a85f, 0xa87c3a], carrot: [0xe86a1c, 0xb34a10],
      tomato: [0xe8442e, 0xa82a1a], onion: [0xe8d8f0, 0xb08ac0],
    };
    const c = cols[ing] || [0xe8cfa8, 0xcbb98f];
    group = choppedPile(c[0], c[1]);
  } else if (ing === 'rice') group = riceBowl();
  else if (ing === 'noodle') group = noodleNest(state === 'cooked');
  else if (ing === 'chicken') group = chickenDrum(state === 'cooked');
  else if (ing === 'egg') group = eggShape(state === 'cooked');
  else if (ing === 'chili') group = chiliShape();
  else if (ing === 'fish') group = fishShape(state === 'cooked');
  else if (ing === 'tofu') group = tofuShape(state === 'cooked');
  else if (ing === 'tempeh') group = tempehShape(state === 'cooked');
  else if (ing === 'beef') group = beefShape(state === 'cooked');
  else if (ing === 'potato') group = potatoShape();
  else if (ing === 'carrot') group = carrotShape();
  else if (ing === 'tomato') group = tomatoShape();
  else if (ing === 'onion') group = onionShape();
  else if (ing === 'milk') group = milkShape();
  else if (ing === 'fruit') group = fruitShape();
  else group = vegShape();
  if (scale && scale !== 1) group.scale.setScalar(scale);
  return group;
}

// A flat white serving plate.
export function makePlate() {
  const g = new THREE.Group();
  const plate = mesh(new THREE.CylinderGeometry(0.55, 0.42, 0.09, 28), 0xfdfdf8, 0.3);
  plate.position.y = 0.045;
  const rim = mesh(new THREE.TorusGeometry(0.5, 0.035, 8, 28), 0xe8e2d4, 0.3);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.09;
  g.add(plate, rim);
  return shadowed(g);
}
