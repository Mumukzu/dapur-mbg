// Dapur MBG — mouse and keyboard interaction with the 3D kitchen.
// Clicks are raycast against the stations' invisible hit boxes; hovering
// a station lights its ring and label. Each station also carries a DOM
// label that tracks its 3D anchor on screen, with a live progress bar
// while chopping or cooking. Keyboard 1-7 + Space use the same entry
// point as the mouse, so both play the identical game.

import * as THREE from '../vendor/three.module.min.js';
import { INGREDIENTS, STATIONS } from './config.js';
import { FRIDGE_BINS, PANTRY_BINS, STATION_POS } from './scene3d.js';

const LABELS = {
  pantry: { key: '1', name: 'PANTRY', anchor: new THREE.Vector3(-7.9, 3.2, -4.7), lift: 0.4 },
  fridge: { key: '7', name: 'FRIDGE', anchor: STATION_POS.fridge, lift: 2.0 },
  board: { key: '2', name: 'CHOP BOARD', anchor: STATION_POS.board, lift: 1.5 },
  wok: { key: '3', name: 'WOK', anchor: STATION_POS.wok, lift: 1.9 },
  fryer: { key: '4', name: 'FRYER', anchor: STATION_POS.fryer, lift: 1.9 },
  plate: { key: '5', name: 'PLATE', anchor: STATION_POS.plate, lift: 1.5 },
  serve: { key: '6', name: 'SERVE', anchor: STATION_POS.serve, lift: 1.6 },
  trash: { key: '', name: 'TRASH', anchor: STATION_POS.trash, lift: 1.1 },
};

export function createPicker(world, labelRoot) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const labelEls = {};
  for (const [id, def] of Object.entries(LABELS)) {
    const el = document.createElement('div');
    el.className = 'station-label';
    el.innerHTML = `<span class="tag">${def.key ? `<span class="key">${def.key}</span>` : ''}${def.name}</span><span class="state"></span><span class="bar" style="display:none"><div></div></span>`;
    labelRoot.appendChild(el);
    labelEls[id] = el;
  }
  // Tiny name tags over each pantry and fridge bin.
  const binEls = {};
  for (const bin of [...PANTRY_BINS, ...FRIDGE_BINS]) {
    const el = document.createElement('div');
    el.className = 'station-label';
    el.innerHTML = `<span class="tag" style="font-size:11px">${INGREDIENTS[bin.ing].name}</span>`;
    labelRoot.appendChild(el);
    binEls[bin.ing] = el;
  }

  const picker = {
    hovered: null,
    selected: null,
    anchors: {}, // screen px of every station, for playtests + labels
    pick(clientX, clientY) {
      const rect = world.renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, world.camera);
      const hits = raycaster.intersectObjects(world.hitMeshes, false);
      if (!hits.length) return null;
      // A specific target (a pantry ingredient bin) beats the big generic
      // pantry box that sits behind it, even though the big box is nearer.
      const specific = hits.find((h) => h.object.userData.arg);
      return (specific || hits[0]).object.userData;
    },
    debugPick(clientX, clientY) {
      const rect = world.renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, world.camera);
      return raycaster.intersectObjects(world.hitMeshes, false).map((h) => ({
        station: h.object.userData.station, arg: h.object.userData.arg,
        dist: +h.distance.toFixed(2), point: h.point.toArray().map((v) => +v.toFixed(2)),
      }));
    },
    updateHover(clientX, clientY, game) {
      const hit = clientX == null ? null : picker.pick(clientX, clientY);
      picker.hovered = hit ? hit.station : null;
      const ring = world.hoverRing;
      if (picker.hovered && picker.hovered !== 'pantry' && game.screen === 'playing') {
        const pos = STATION_POS[picker.hovered];
        // The fridge ring sits on the floor in front of the unit, not
        // inside its body.
        if (picker.hovered === 'fridge') ring.position.set(pos.x, 0.03, -3.2);
        else if (picker.hovered === 'trash') ring.position.set(pos.x, 0.03, pos.z);
        else ring.position.set(pos.x, 1.14, pos.z);
        ring.visible = true;
      } else {
        ring.visible = false;
      }
      const sel = world.selectRing;
      if (picker.selected && game.screen === 'playing') {
        const pos = STATION_POS[picker.selected];
        if (picker.selected === 'fridge') sel.position.set(pos.x, 0.03, -3.2);
        else sel.position.set(pos.x, picker.selected === 'trash' ? 0.03 : 1.14, pos.z);
        sel.visible = true;
      } else {
        sel.visible = false;
      }
      world.renderer.domElement.style.cursor = picker.hovered ? 'pointer' : 'default';
    },
    updateLabels(game) {
      const k = game.kitchen;
      for (const [id, def] of Object.entries(LABELS)) {
        const el = labelEls[id];
        const anchor = def.anchor.clone();
        anchor.y += def.lift;
        const p = world.project(anchor);
        picker.anchors[id] = p;
        if (p.behind) { el.style.display = 'none'; continue; }
        el.style.display = '';
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
        const stateEl = el.querySelector('.state');
        const barEl = el.querySelector('.bar');
        const barFill = barEl.querySelector('div');
        let state = '';
        let progress = -1;
        if (id === 'board' && k.chop) {
          state = k.chop.done ? `${INGREDIENTS[k.chop.ing].name} chopped — grab it!` : `Chopping ${INGREDIENTS[k.chop.ing].name}…`;
          progress = k.chop.progress;
        } else if (id === 'wok' && k.wok) {
          state = k.wok.burnt ? 'BURNT! Grab & trash it!' : k.wok.done ? `${INGREDIENTS[k.wok.ing].name} ready — grab it!` : `Cooking ${INGREDIENTS[k.wok.ing].name}…`;
          progress = Math.min(1, k.wok.progress);
        } else if (id === 'fryer' && k.fryer) {
          state = k.fryer.burnt ? 'BURNT! Grab & trash it!' : k.fryer.done ? `${INGREDIENTS[k.fryer.ing].name} ready — grab it!` : `Frying ${INGREDIENTS[k.fryer.ing].name}…`;
          progress = Math.min(1, k.fryer.progress);
        } else if (id === 'plate' && k.plate.length) {
          state = `${k.plate.length} item${k.plate.length > 1 ? 's' : ''} on the plate`;
        } else if (id === 'serve' && k.plate.length) {
          state = 'Plate ready — serve it!';
        } else if (id === 'pantry' && k.hand) {
          state = `Carrying ${INGREDIENTS[k.hand.ing].name}`;
        } else if (id === 'fridge' && k.hand && INGREDIENTS[k.hand.ing].cold) {
          state = `Carrying ${INGREDIENTS[k.hand.ing].name} — keep it cold!`;
        }
        stateEl.textContent = state;
        if (progress >= 0) {
          barEl.style.display = 'block';
          barFill.style.width = `${Math.round(progress * 100)}%`;
        } else {
          barEl.style.display = 'none';
        }
        el.classList.toggle('hot', id === 'serve' && k.plate.length > 0);
        el.classList.toggle('selected', picker.selected === id);
      }
      for (const bin of [...PANTRY_BINS, ...FRIDGE_BINS]) {
        const el = binEls[bin.ing];
        // Name tags sit on the front of each crate, below the sample, so
        // they never collide with the order tickets at the top of the screen.
        const p = world.project(bin.pos.clone().add(new THREE.Vector3(0, -0.34, 0.35)));
        picker.anchors[`pantry:${bin.ing}`] = p;
        if (p.behind) { el.style.display = 'none'; continue; }
        el.style.display = '';
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
      }
    },
  };
  return picker;
}

export function stationKeyMap() {
  const map = {};
  for (const s of STATIONS) map[s.key] = s.id;
  return map;
}
