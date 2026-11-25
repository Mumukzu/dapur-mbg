// particles.js — pooled 3D sparkle bursts. One fixed pool, no allocation
// during play: meshes are reused and hidden when idle, so the render loop
// stays cheap even on SwiftShader. Gold stars on serve, green bits on chop,
// white puffs on cook, golden rain on day-complete.
import * as THREE from 'three';

const COLORS = {
  gold: 0xffc94d, green: 0x7bc043, white: 0xffffff, red: 0xff5a5a, teal: 0x3fa7d6,
};

export function createParticles(scene, count = 90) {
  const geo = new THREE.OctahedronGeometry(0.07);
  const mats = {};
  for (const k of Object.keys(COLORS)) mats[k] = new THREE.MeshBasicMaterial({ color: COLORS[k] });
  const pool = [];
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(geo, mats.gold);
    mesh.visible = false;
    scene.add(mesh);
    pool.push({ mesh, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1, spin: 0, grav: -6, active: false });
  }
  let cursor = 0;

  function spawn(pos, color, n, speed, up, life, grav) {
    for (let i = 0; i < n; i++) {
      const p = pool[cursor]; cursor = (cursor + 1) % pool.length;
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * speed;
      p.mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.2,
        pos.y + (Math.random() - 0.5) * 0.1,
        pos.z + (Math.random() - 0.5) * 0.2);
      p.mesh.material = mats[color] || mats.gold;
      p.vx = Math.cos(a) * r;
      p.vz = Math.sin(a) * r;
      p.vy = up * (0.5 + Math.random() * 0.8);
      p.life = p.maxLife = life * (0.7 + Math.random() * 0.6);
      p.grav = grav;
      p.spin = (Math.random() - 0.5) * 10;
      p.mesh.visible = true;
      p.active = true;
      p.mesh.scale.setScalar(0.7 + Math.random() * 0.8);
    }
  }

  // A radial burst at pos. opts: color, n, speed, up, life, grav.
  function burst(pos, opts = {}) {
    spawn(pos, opts.color || 'gold', opts.n || 14, opts.speed || 2.0,
      opts.up || 2.4, opts.life || 0.9, opts.grav ?? -6);
  }

  // Golden rain falling over pos (the day-complete wow moment).
  function rain(pos, n = 36) {
    for (let i = 0; i < n; i++) {
      const p = pool[cursor]; cursor = (cursor + 1) % pool.length;
      p.mesh.position.set(
        pos.x + (Math.random() - 0.5) * 4,
        pos.y + 2 + Math.random() * 1.5,
        pos.z + (Math.random() - 0.5) * 2.5);
      p.mesh.material = mats.gold;
      p.vx = (Math.random() - 0.5) * 0.4;
      p.vz = (Math.random() - 0.5) * 0.4;
      p.vy = -0.8 - Math.random() * 0.7;
      p.life = p.maxLife = 1.6 + Math.random() * 0.8;
      p.grav = -0.4;
      p.spin = (Math.random() - 0.5) * 8;
      p.mesh.visible = true;
      p.active = true;
      p.mesh.scale.setScalar(0.8 + Math.random() * 0.7);
    }
  }

  function update(dt) {
    for (const p of pool) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) { p.active = false; p.mesh.visible = false; continue; }
      p.vy += p.grav * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.y += p.spin * dt;
      p.mesh.rotation.x += p.spin * 0.6 * dt;
      const f = p.life / p.maxLife;
      p.mesh.scale.setScalar(Math.max(0.05, f * 1.1));
    }
  }

  return { burst, rain, update };
}
