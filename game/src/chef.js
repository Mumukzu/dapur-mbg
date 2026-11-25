// chef.js — Chef Sari, an original low-poly cook: tall white toque, teal shirt,
// white apron with a gold sun badge, red neckerchief. Walks, chops, stirs,
// and carries plates. All procedural geometry.
import * as THREE from 'three';

const TEAL = 0x0f8a8a;
const TEAL_DARK = 0x0b6b6b;
const SKIN = 0xf2c09a;
const SKIN_DARK = 0xd9a075;
const WHITE = 0xffffff;
const RED = 0xd7263d;
const GOLD = 0xffc94d;
const PANTS = 0x3a4a5a;

function mat(color, rough = 0.8) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough });
}
function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z); m.castShadow = true; return m;
}
function cyl(rt, rb, h, color, x = 0, y = 0, z = 0, seg = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color));
  m.position.set(x, y, z); m.castShadow = true; return m;
}
function sph(r, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mat(color));
  m.position.set(x, y, z); m.castShadow = true; return m;
}

export function buildChef() {
  const chef = new THREE.Group();
  const parts = {};

  // legs
  parts.legL = cyl(0.09, 0.11, 0.5, PANTS, -0.13, 0.25, 0);
  parts.legR = cyl(0.09, 0.11, 0.5, PANTS, 0.13, 0.25, 0);
  chef.add(parts.legL, parts.legR);
  chef.add(box(0.16, 0.08, 0.3, 0x222222, -0.13, 0.04, 0.05)); // shoes
  chef.add(box(0.16, 0.08, 0.3, 0x222222, 0.13, 0.04, 0.05));

  // torso: teal shirt
  parts.torso = cyl(0.26, 0.3, 0.62, TEAL, 0, 0.82, 0, 20);
  chef.add(parts.torso);
  // white apron (front panel + straps)
  const apron = box(0.42, 0.55, 0.04, WHITE, 0, 0.78, 0.27);
  chef.add(apron);
  chef.add(box(0.06, 0.3, 0.02, WHITE, -0.16, 1.1, 0.24));
  chef.add(box(0.06, 0.3, 0.02, WHITE, 0.16, 1.1, 0.24));
  // gold sun badge on the apron
  const badge = cyl(0.07, 0.07, 0.02, GOLD, 0, 0.95, 0.3, 16);
  badge.rotation.x = Math.PI / 2; badge.material = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.6, roughness: 0.3, emissive: 0x664400 });
  chef.add(badge);
  // red neckerchief
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 10, 20), mat(RED));
  scarf.rotation.x = Math.PI / 2; scarf.position.set(0, 1.16, 0.05); chef.add(scarf);
  const knot = sph(0.06, RED, 0, 1.12, 0.24); chef.add(knot);

  // arms (pivot at shoulder for animation)
  parts.armL = new THREE.Group(); parts.armL.position.set(-0.32, 1.08, 0);
  parts.armL.add(cyl(0.07, 0.06, 0.5, TEAL, 0, -0.25, 0));
  parts.armL.add(sph(0.07, SKIN, 0, -0.52, 0));
  chef.add(parts.armL);
  parts.armR = new THREE.Group(); parts.armR.position.set(0.32, 1.08, 0);
  parts.armR.add(cyl(0.07, 0.06, 0.5, TEAL, 0, -0.25, 0));
  parts.armR.add(sph(0.07, SKIN, 0, -0.52, 0));
  chef.add(parts.armR);

  // head + tall white toque
  parts.head = new THREE.Group(); parts.head.position.set(0, 1.32, 0);
  parts.head.add(sph(0.2, SKIN, 0, 0, 0));
  parts.head.add(sph(0.045, 0x222222, -0.07, 0.03, 0.17)); // eyes
  parts.head.add(sph(0.045, 0x222222, 0.07, 0.03, 0.17));
  parts.head.add(sph(0.03, 0xd7263d, 0, -0.06, 0.18)); // smile dot
  const hair = sph(0.2, 0x3a2a1a, 0, 0.04, -0.05); hair.scale.set(1.02, 0.9, 1.02); parts.head.add(hair);
  const toqueBase = cyl(0.21, 0.22, 0.14, WHITE, 0, 0.2, 0, 20); parts.head.add(toqueBase);
  const toqueTop = sph(0.24, WHITE, 0, 0.38, 0); toqueTop.scale.y = 0.85; parts.head.add(toqueTop);
  chef.add(parts.head);

  // plate she carries (hidden until serving)
  parts.plate = new THREE.Group();
  parts.plate.add(cyl(0.24, 0.19, 0.04, WHITE, 0, 0, 0, 20));
  parts.plate.position.set(0, -0.55, 0.12);
  parts.plate.visible = false;
  parts.armL.add(parts.plate);

  // knife (hidden until chopping)
  parts.knife = new THREE.Group();
  parts.knife.add(box(0.05, 0.3, 0.02, 0xb9c2c9, 0, -0.12, 0.02));
  parts.knife.add(box(0.05, 0.12, 0.03, 0x3a2a1a, 0, 0.08, 0.02));
  parts.knife.position.set(0, -0.55, 0.05);
  parts.knife.visible = false;
  parts.armR.add(parts.knife);

  chef.traverse((o) => { if (o.isMesh) o.castShadow = true; });

  let walkPhase = 0;
  let action = 'idle'; // idle | walk | chop | stir | carry
  let actionT = 0;

  function setAction(next) {
    if (next === action) return;
    action = next; actionT = 0;
    parts.plate.visible = next === 'carry';
    parts.knife.visible = next === 'chop';
  }

  function animate(dt, moving) {
    actionT += dt;
    if (moving) setAction('walk'); else if (action === 'walk') setAction('idle');
    if (action === 'walk') {
      walkPhase += dt * 11;
      parts.legL.rotation.x = Math.sin(walkPhase) * 0.55;
      parts.legR.rotation.x = -Math.sin(walkPhase) * 0.55;
      parts.armL.rotation.x = -Math.sin(walkPhase) * 0.5;
      parts.armR.rotation.x = Math.sin(walkPhase) * 0.5;
      chef.position.y = Math.abs(Math.sin(walkPhase)) * 0.05;
      parts.head.rotation.z = Math.sin(walkPhase) * 0.04;
    } else if (action === 'chop') {
      const s = Math.sin(actionT * 16);
      parts.armR.rotation.x = -1.2 + s * 0.7;
      parts.armL.rotation.x = -0.4;
      parts.legL.rotation.x = 0; parts.legR.rotation.x = 0;
      chef.position.y = 0;
    } else if (action === 'stir') {
      parts.armR.rotation.x = -1.0 + Math.sin(actionT * 7) * 0.25;
      parts.armR.rotation.z = Math.cos(actionT * 7) * 0.3;
      parts.armL.rotation.x = -0.3;
      chef.position.y = 0;
    } else if (action === 'carry') {
      parts.armL.rotation.x = -1.15; parts.armR.rotation.x = 0.15;
      parts.armL.rotation.z = 0.25;
      walkPhase += dt * 8;
      parts.legL.rotation.x = Math.sin(walkPhase) * 0.4;
      parts.legR.rotation.x = -Math.sin(walkPhase) * 0.4;
      chef.position.y = Math.abs(Math.sin(walkPhase)) * 0.04;
    } else {
      // idle: gentle breathing + looking around
      parts.armL.rotation.x = Math.sin(actionT * 1.4) * 0.06;
      parts.armR.rotation.x = -Math.sin(actionT * 1.4) * 0.06;
      parts.armL.rotation.z = 0; parts.armR.rotation.z = 0;
      parts.legL.rotation.x = 0; parts.legR.rotation.x = 0;
      parts.torso.scale.y = 1 + Math.sin(actionT * 1.4) * 0.012;
      parts.head.rotation.y = Math.sin(actionT * 0.5) * 0.25;
      chef.position.y = 0;
    }
  }

  return { group: chef, parts, setAction, animate };
}
