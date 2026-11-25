// Dapur MBG — Chef Sari, the head cook of the kitchen.
// An ORIGINAL character, built in this file from Three.js primitives only
// (boxes, cylinders, spheres, cones, torus): a tall white toque, a white
// apron over a teal shirt, a friendly face, dark trousers and shoes. No
// downloaded model, no copied character, no image files.
//
// The chef is presentational only: she walks to the station the player is
// using and acts the job out (chopping, stirring, carrying the plate), but
// she never changes the rules, timing, scoring, recipes or controls. All
// animation is procedural — position lerp, bobbing, and swinging limbs.

import * as THREE from '../vendor/three.module.min.js';

// Where the chef stands to work each station, and which way she faces.
// She stands BESIDE the back counters (so her face stays turned toward
// the camera in a 3/4 view) and reaches sideways with her work arm; at
// the front island she stands on the camera side, facing the camera.
// rotation.y = 0 faces the camera (+z); positive turns her toward +x.
const SPOTS = {
  pantry: { x: -5.1, z: -3.3, face: -0.85, mode: 'reach' },
  board: { x: -3.55, z: -2.15, face: 0.5, mode: 'chop' },
  wok: { x: -0.75, z: -2.15, face: 0.5, mode: 'stir' },
  fryer: { x: 1.95, z: -2.15, face: 0.5, mode: 'stir' },
  plate: { x: -1.3, z: 1.35, face: 0, mode: 'place' },
  serve: { x: 2.4, z: 1.35, face: 0, mode: 'carry' },
  fridge: { x: 6.7, z: -2.7, face: 0.6, mode: 'reach' },
  home: { x: 0.5, z: -0.9, face: 0.15, mode: 'idle' },
};

// The open floor lane between the back counter (front edge z -2.85) and
// the front island (back edge z -0.25). The chef walks through the lane
// instead of through a counter when she changes sides.
const LANE_Z = -1.5;

const TEAL = 0x1f8a7a;
const TEAL_DARK = 0x17665c;
const SKIN = 0xf2c09a;
const SKIN_DARK = 0xd89a6a;
const WHITE = 0xfdfdf8;
const APRON_WHITE = 0xf7f3e8;
const TROUSERS = 0x2e3440;
const SHOE = 0x1c1c22;
const RED = 0xd64533;
const GOLD = 0xf2c94c;

function std(color, rough, metal) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough ?? 0.75, metalness: metal ?? 0.05 });
}
function mesh(geo, material, x, y, z) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function box(w, h, d, material, x, y, z) {
  return mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z);
}
function cyl(rt, rb, h, material, x, y, z, seg = 18) {
  return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material, x, y, z);
}
function ball(r, material, x, y, z, w = 18, h = 14) {
  return mesh(new THREE.SphereGeometry(r, w, h), material, x, y, z);
}

function buildChefMeshes() {
  const root = new THREE.Group();
  const body = new THREE.Group(); // bobs while walking, breathes while idle
  root.add(body);

  // --- Legs: dark trousers, pivoted at the hips so they can swing.
  const legL = new THREE.Group();
  legL.position.set(-0.24, 0.9, 0);
  legL.add(cyl(0.14, 0.16, 0.82, std(TROUSERS, 0.9), 0, -0.41, 0, 12));
  legL.add(box(0.24, 0.12, 0.42, std(SHOE, 0.6), 0, -0.84, 0.08));
  body.add(legL);
  const legR = new THREE.Group();
  legR.position.set(0.24, 0.9, 0);
  legR.add(cyl(0.14, 0.16, 0.82, std(TROUSERS, 0.9), 0, -0.41, 0, 12));
  legR.add(box(0.24, 0.12, 0.42, std(SHOE, 0.6), 0, -0.84, 0.08));
  body.add(legR);

  // --- Torso: teal shirt, white apron, red neckerchief.
  const torso = new THREE.Group();
  torso.position.set(0, 1.32, 0);
  body.add(torso);
  torso.add(box(0.98, 0.88, 0.56, std(TEAL, 0.85), 0, 0, 0));
  torso.add(box(1.02, 0.14, 0.6, std(TEAL_DARK, 0.85), 0, -0.44, 0)); // shirt hem
  // Apron: bib + skirt panels on the front, plus shoulder straps.
  torso.add(box(0.68, 0.62, 0.07, std(APRON_WHITE, 0.9), 0, 0.08, 0.3));
  torso.add(box(0.72, 0.42, 0.07, std(APRON_WHITE, 0.9), 0, -0.42, 0.3));
  torso.add(box(0.1, 0.34, 0.05, std(APRON_WHITE, 0.9), -0.24, 0.4, 0.29));
  torso.add(box(0.1, 0.34, 0.05, std(APRON_WHITE, 0.9), 0.24, 0.4, 0.29));
  // A little gold badge on the apron bib — the MBG sun.
  const badge = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 16), std(GOLD, 0.4, 0.6), 0, 0.14, 0.35);
  badge.rotation.x = Math.PI / 2;
  torso.add(badge);
  // Neckerchief ring at the neck.
  const scarf = mesh(new THREE.TorusGeometry(0.24, 0.075, 10, 20), std(RED, 0.8), 0, 0.48, 0);
  scarf.rotation.x = Math.PI / 2;
  torso.add(scarf);

  // --- Arms: teal sleeves, skin hands, pivoted at the shoulders.
  // armWork is the +x arm (screen-right when she faces the camera) — it
  // holds the knife / spoon and does the chopping and stirring.
  function makeArm(sideX) {
    const arm = new THREE.Group();
    arm.position.set(sideX, 1.68, 0);
    arm.add(cyl(0.115, 0.1, 0.56, std(TEAL, 0.85), 0, -0.28, 0, 12));
    arm.add(ball(0.11, std(SKIN, 0.7), 0, -0.6, 0));
    body.add(arm);
    return arm;
  }
  const armWork = makeArm(0.56);
  const armFree = makeArm(-0.56);

  // The work tools, held in the work hand. Only one shows at a time.
  const knife = new THREE.Group();
  knife.position.set(0, -0.66, 0.06);
  knife.add(box(0.05, 0.16, 0.07, std(0x3a2415, 0.7), 0, 0.02, 0));
  const blade = box(0.045, 0.34, 0.13, std(0xc9ced6, 0.25, 0.85), 0, -0.22, 0.02);
  knife.add(blade);
  armWork.add(knife);
  const spoon = new THREE.Group();
  spoon.position.set(0, -0.66, 0.06);
  spoon.add(cyl(0.03, 0.03, 0.4, std(0x8a5a2e, 0.7), 0, -0.18, 0, 8));
  spoon.add(ball(0.09, std(0x8a5a2e, 0.7), 0, -0.42, 0));
  spoon.visible = false;
  armWork.add(spoon);

  // --- The plate she carries to the serve hatch (hidden otherwise).
  const plateProp = new THREE.Group();
  plateProp.position.set(0, 1.3, 0.62);
  const plateDisc = mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.07, 24), std(WHITE, 0.3), 0, 0, 0);
  plateProp.add(plateDisc);
  const riceMound = ball(0.2, std(0xfffaf0, 0.9), -0.12, 0.09, 0);
  riceMound.scale.set(1, 0.55, 1);
  plateProp.add(riceMound);
  plateProp.add(ball(0.09, std(0xf2a007, 0.35), 0.14, 0.1, 0.05));
  plateProp.add(box(0.12, 0.05, 0.08, std(0xd93a2b, 0.6), 0.1, 0.08, -0.14));
  plateProp.visible = false;
  body.add(plateProp);

  // --- Head: friendly face + tall white toque.
  const head = new THREE.Group();
  head.position.set(0, 2.0, 0);
  body.add(head);
  head.add(ball(0.4, std(SKIN, 0.7), 0, 0, 0, 24, 18));
  head.add(ball(0.06, std(SKIN_DARK, 0.7), 0, -0.03, 0.39)); // nose
  head.add(ball(0.055, std(0x2b1a0e, 0.4), -0.15, 0.07, 0.35)); // eyes
  head.add(ball(0.055, std(0x2b1a0e, 0.4), 0.15, 0.07, 0.35));
  head.add(box(0.13, 0.035, 0.03, std(0x5d3a1e, 0.8), -0.15, 0.18, 0.36)); // brows
  head.add(box(0.13, 0.035, 0.03, std(0x5d3a1e, 0.8), 0.15, 0.18, 0.36));
  const smile = mesh(new THREE.TorusGeometry(0.11, 0.022, 8, 16, Math.PI), std(0x7a3b22, 0.6), 0, -0.1, 0.36);
  smile.rotation.z = Math.PI; // arc faces down: a smile
  head.add(smile);
  head.add(ball(0.06, std(0xf2a0a0, 0.8), -0.25, -0.05, 0.32)); // cheeks
  head.add(ball(0.06, std(0xf2a0a0, 0.8), 0.25, -0.05, 0.32));
  head.add(ball(0.09, std(SKIN, 0.7), -0.39, 0, 0)); // ears
  head.add(ball(0.09, std(SKIN, 0.7), 0.39, 0, 0));
  // Toque: band + tall crown + three puffs on top, tilted a touch.
  const toque = new THREE.Group();
  toque.position.set(0, 0.36, 0);
  toque.rotation.z = 0.06;
  head.add(toque);
  toque.add(cyl(0.34, 0.35, 0.1, std(0xe8e2d4, 0.9), 0, 0, 0, 20));
  toque.add(cyl(0.3, 0.33, 0.34, std(WHITE, 0.95), 0, 0.2, 0, 20));
  toque.add(ball(0.2, std(WHITE, 0.95), 0, 0.42, 0, 16, 12));
  toque.add(ball(0.16, std(WHITE, 0.95), -0.17, 0.36, 0.05, 14, 10));
  toque.add(ball(0.16, std(WHITE, 0.95), 0.17, 0.36, -0.02, 14, 10));

  return { root, body, torso, legL, legR, armWork, armFree, head, knife, spoon, plateProp };
}

// Damp a value toward its target (frame-rate independent).
function damp(cur, target, lambda, dt) {
  return cur + (target - cur) * (1 - Math.exp(-lambda * dt));
}
function dampAngle(cur, target, lambda, dt) {
  let d = target - cur;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return cur + d * (1 - Math.exp(-lambda * dt));
}

export function createChef() {
  const p = buildChefMeshes();
  const { root } = p;
  root.position.set(SPOTS.home.x, 0, SPOTS.home.z);
  root.rotation.y = SPOTS.home.face;

  let prevT = null;
  let cur = { ...SPOTS.home };
  let waypoint = null;
  let walkPhase = 0;
  let serveFlourish = 0;

  // Decide where the chef should be from the real kitchen state.
  // Priority: a staged shot pose, then the active job, then the plate,
  // then the hand, then idle at the island.
  function deriveTarget(game) {
    if (game.chefPose) {
      const pose = game.chefPose;
      return {
        x: pose.x, z: pose.z, face: pose.face ?? 0,
        mode: pose.mode || 'idle',
      };
    }
    const k = game.kitchen;
    if (k.chop) return { ...SPOTS.board, mode: k.chop.done ? 'idle' : 'chop' };
    if (k.wok) return { ...SPOTS.wok, mode: 'stir' };
    if (k.fryer) return { ...SPOTS.fryer, mode: 'stir' };
    if (k.plate.length) return { ...SPOTS.serve, mode: 'carry' };
    // Just fetched a cold item from the fridge: she stays at the fridge,
    // reaching for the next cold thing, until the player moves on.
    if (k.hand && game.lastStation === 'fridge') return { ...SPOTS.fridge };
    if (k.hand) return { ...SPOTS.plate, mode: 'place' };
    return { ...SPOTS.home };
  }

  function update(_dt, t, game) {
    if (prevT === null) prevT = t;
    const dt = Math.min(0.2, Math.max(0, t - prevT));
    prevT = t;

    const target = deriveTarget(game);
    const modeChanged = target.mode !== cur.mode
      || Math.abs(target.x - cur.x) > 0.01 || Math.abs(target.z - cur.z) > 0.01;
    if (modeChanged) {
      // Changing sides means going through the lane, not through a counter.
      const curFront = cur.z > -0.6;
      const tgtFront = target.z > -0.6;
      if (curFront !== tgtFront) waypoint = { x: target.x, z: LANE_Z };
      cur = target;
    }
    const dest = waypoint || cur;
    const dx = dest.x - root.position.x;
    const dz = dest.z - root.position.z;
    const dist = Math.hypot(dx, dz);
    const speed = 3.0;
    let moving = dist > 0.06;
    if (moving) {
      const step = Math.min(dist, speed * dt);
      root.position.x += (dx / dist) * step;
      root.position.z += (dz / dist) * step;
      walkPhase += dt * 9;
      if (dist - step <= 0.06 && waypoint) {
        waypoint = null;
        moving = Math.hypot(cur.x - root.position.x, cur.z - root.position.z) > 0.06;
      }
    }
    const walking = moving || cur.mode === 'walk';

    // Face the station (or the walk direction while travelling).
    let faceTarget = cur.face;
    if (moving && dist > 0.3) faceTarget = Math.atan2(dx, dz);
    root.rotation.y = dampAngle(root.rotation.y, faceTarget, 5, dt);

    // --- Pose targets per mode (radians on the limb pivots).
    const s = Math.sin(t * 1.8);
    const pose = {
      legL: 0, legR: 0, armWorkX: -0.1, armWorkZ: 0.12, armFreeX: -0.1, armFreeZ: -0.12,
      bodyY: 0, leanX: 0, leanZ: 0, headY: 0.5 * Math.sin(t * 0.45), torsoY: 1 + 0.02 * s,
      knife: false, spoon: false, plate: false,
    };
    if (walking) {
      const w = Math.sin(walkPhase);
      pose.legL = 0.55 * w;
      pose.legR = -0.55 * w;
      pose.armWorkX = -0.4 * w;
      pose.armFreeX = 0.4 * w;
      pose.bodyY = 0.07 * Math.abs(Math.cos(walkPhase));
      pose.leanX = 0.07;
      pose.headY = 0;
    } else if (cur.mode === 'chop') {
      const c = Math.sin(t * 11);
      pose.armWorkX = -1.05 + 0.35 * c; // knife bobs up and down, fast
      pose.armWorkZ = 0.45;
      pose.armFreeX = -0.9;
      pose.armFreeZ = -0.35;
      pose.bodyY = 0.02 * Math.abs(c);
      pose.leanX = 0.08;
      pose.headY = 0.15;
      pose.knife = true;
    } else if (cur.mode === 'stir') {
      const a = t * 5.5;
      pose.armWorkX = -0.95 + 0.22 * Math.sin(a);
      pose.armWorkZ = 0.4 + 0.22 * Math.cos(a); // circular stirring
      pose.armFreeX = -0.5;
      pose.armFreeZ = -0.3;
      pose.leanZ = 0.05 * Math.sin(a);
      pose.headY = 0.1;
      pose.spoon = true;
    } else if (cur.mode === 'carry') {
      // Both arms forward, holding the plate up; a little lift flourish
      // as she arrives at the serve hatch.
      if (!moving && serveFlourish < 1) serveFlourish = Math.min(1, serveFlourish + dt * 1.2);
      if (moving) serveFlourish = 0;
      pose.armWorkX = -1.15;
      pose.armWorkZ = 0.28;
      pose.armFreeX = -1.15;
      pose.armFreeZ = -0.28;
      pose.plate = true;
      pose.bodyY = 0.05 * serveFlourish;
      pose.leanX = -0.04 * serveFlourish;
      pose.headY = 0;
    } else if (cur.mode === 'place') {
      pose.armWorkX = -0.9;
      pose.armWorkZ = 0.2;
      pose.armFreeX = -0.9;
      pose.armFreeZ = -0.2;
      pose.leanX = 0.06;
      pose.headY = 0;
    } else if (cur.mode === 'reach') {
      pose.armWorkX = -2.2; // arm up to the pantry shelf / fridge shelf
      pose.armWorkZ = 0.15;
      pose.armFreeX = -0.3;
      pose.leanX = -0.05;
      pose.headY = -0.2;
    }
    // Idle breathing + look-around is the default pose above.

    const L = 10;
    p.legL.rotation.x = damp(p.legL.rotation.x, pose.legL, L, dt);
    p.legR.rotation.x = damp(p.legR.rotation.x, pose.legR, L, dt);
    p.armWork.rotation.x = damp(p.armWork.rotation.x, pose.armWorkX, L, dt);
    p.armWork.rotation.z = damp(p.armWork.rotation.z, pose.armWorkZ, L, dt);
    p.armFree.rotation.x = damp(p.armFree.rotation.x, pose.armFreeX, L, dt);
    p.armFree.rotation.z = damp(p.armFree.rotation.z, pose.armFreeZ, L, dt);
    p.head.rotation.y = damp(p.head.rotation.y, pose.headY, 4, dt);
    p.torso.scale.y = damp(p.torso.scale.y, pose.torsoY, 6, dt);
    p.body.position.y = damp(p.body.position.y, pose.bodyY, L, dt);
    p.body.rotation.x = damp(p.body.rotation.x, pose.leanX, L, dt);
    p.body.rotation.z = damp(p.body.rotation.z, pose.leanZ, L, dt);
    p.knife.visible = pose.knife;
    p.spoon.visible = pose.spoon;
    p.plateProp.visible = pose.plate;
  }

  return { group: root, update };
}
