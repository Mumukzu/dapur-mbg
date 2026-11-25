// game.js — Dapur MBG main loop: renderer, chef movement, tray / chop / cook /
// serve flow, HUD, title / pause / game-over states, and ?shot= staging.
import * as THREE from 'three';
import { INGREDIENTS, DISHES, STATIONS, MAX_TRAY, findDish, FRIDGE_ITEMS, PANTRY_ITEMS } from './config.js';
import { buildKitchen, buildIngredientProp, buildPlatedDish } from './kitchen.js';
import { buildChef } from './chef.js';
import { createOrderManager } from './orders.js';
import * as SFX from './audio.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot') || '';

let renderer, scene, camera, clock;
let kitchen, chef, chefTarget = null, chefStation = null;
let tray = []; // { id, chopped, cooked }
let plated = null; // dish object on the island
let plateMesh = null;
let trayProps = [];
let state = 'title'; // title | playing | paused | over
let busyUntil = 0; // action lock timestamp (performance.now ms)
let busyKind = '';
let orderMgr;
let lastTickSecond = -1;

function now() { return performance.now(); }

function init() {
  const canvas = $('game-canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fd8f7);
  scene.fog = new THREE.Fog(0x9fd8f7, 18, 30);

  camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 6.6, 6.6);
  camera.lookAt(0, 0.9, -3.0);

  scene.add(new THREE.AmbientLight(0xfff4e0, 0.85));
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.6);
  sun.position.set(5, 10, 6); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -9; sun.shadow.camera.right = 9;
  sun.shadow.camera.top = 9; sun.shadow.camera.bottom = -9;
  scene.add(sun);
  const warm = new THREE.PointLight(0xffd27a, 25, 12, 1.8);
  warm.position.set(0, 4.2, -0.6); scene.add(warm);

  kitchen = buildKitchen(scene);
  chef = buildChef();
  chef.group.position.set(0, 0, 1.6);
  scene.add(chef.group);

  // invisible click targets on the stations
  const rayTargets = [];
  for (const st of STATIONS) {
    const s = kitchen.stations[st.id];
    const hit = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.4, 1.6), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(s.face.x, 1.2, s.face.z + 0.4);
    hit.userData.station = st.id;
    scene.add(hit); rayTargets.push(hit);
  }
  const ray = new THREE.Raycaster();
  canvas.addEventListener('pointerdown', (e) => {
    if (state !== 'playing') return;
    SFX.ensureAudio();
    const m = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(m, camera);
    const hit = ray.intersectObjects(rayTargets)[0];
    if (hit) goToStation(hit.object.userData.station, true);
  });

  orderMgr = createOrderManager(onOrderEvent);
  bindUI();
  clock = new THREE.Clock();
  addEventListener('resize', onResize);
  renderer.setAnimationLoop(tick);
  if (SHOT) applyShot(SHOT);
  renderOrders();
  updateHUD();
}

function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

// ---------- movement ----------
function goToStation(id, autoAct) {
  const s = kitchen.stations[id];
  if (!s) return;
  chefTarget = s.pos.clone();
  chefStation = id;
  chefTarget.autoAct = autoAct;
  hidePicker();
  SFX.playClick();
}

function arriveAtStation() {
  const id = chefStation;
  chefTarget = null;
  const s = kitchen.stations[id];
  chef.group.lookAt(s.face.x, 0, s.face.z);
  if (id === 'fridge') { kitchen.setFridgeOpen(true); SFX.playFridge(); }
  else kitchen.setFridgeOpen(false);
  if (chefTargetAutoAct()) {
    if (id === 'fridge') openPicker('fridge');
    else if (id === 'pantry') openPicker('pantry');
    else interact(id);
  }
}
let autoActFlag = false;
function chefTargetAutoAct() { return autoActFlag; }

// ---------- tray ----------
function trayPropGroup() {
  const g = new THREE.Group();
  g.position.set(0, 0.62, 0.42);
  return g;
}
let trayBoard = null;
function refreshTrayProps() {
  if (!trayBoard) {
    trayBoard = new THREE.Group();
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.4), new THREE.MeshStandardMaterial({ color: 0xc98d4e, roughness: 0.8 }));
    board.castShadow = true;
    trayBoard.add(board);
    trayBoard.position.set(0, 0.62, 0.42);
    chef.group.add(trayBoard);
  }
  for (const p of trayProps) trayBoard.remove(p);
  trayProps = [];
  trayBoard.visible = tray.length > 0 && !plated;
  tray.forEach((item, i) => {
    const p = buildIngredientProp(item.id, 0.85);
    p.position.set(-0.18 + i * 0.18, 0.05, 0);
    if (item.chopped) p.rotation.y = 0.6;
    if (item.cooked) p.scale.setScalar(0.95);
    trayBoard.add(p); trayProps.push(p);
  });
}

function addToTray(id) {
  if (tray.length >= MAX_TRAY) { setHint('Tray is full — serve it or trash it!'); return false; }
  tray.push({ id, chopped: false, cooked: false });
  SFX.playPick();
  refreshTrayProps();
  checkPlate();
  updateHUD();
  return true;
}

function needsStep(item, dish) {
  return { chop: dish.chop.includes(item.id) && !item.chopped, cook: dish.cook.includes(item.id) && !item.cooked };
}

function checkPlate() {
  if (plated) return;
  const dish = findDish(tray.map((t) => t.id));
  if (!dish) return;
  const ready = tray.every((item) => {
    const n = needsStep(item, dish);
    return !n.chop && !n.cook;
  });
  if (ready) plateDish(dish);
}

function plateDish(dish) {
  plated = dish;
  tray = []; // the ingredients are now on the plate
  SFX.playDing();
  setHint(`Plated: ${dish.name} — take it to SERVE!`);
  // plate on the island: garnished, steaming, arranged — not flat blobs
  if (plateMesh) { scene.remove(plateMesh); kitchen.clearPlateSteam(); }
  plateMesh = buildPlatedDish(dish);
  plateMesh.position.set(0.9, 1.02, -0.7);
  scene.add(plateMesh);
  kitchen.registerPlateSteam(plateMesh);
  chef.setAction('carry');
  refreshTrayProps();
  updateHUD();
}

// ---------- station actions ----------
function interact(id) {
  if (state !== 'playing' || now() < busyUntil) return;
  if (id === 'fridge' || id === 'pantry') { openPicker(id); return; }
  if (id === 'trash') {
    if (!tray.length && !plated) { setHint('Tray is already empty.'); return; }
    tray = []; clearPlate();
    SFX.playFail(); setHint('Tray thrown away.'); refreshTrayProps(); updateHUD(); return;
  }
  if (id === 'chop') {
    const dish = findDish(tray.map((t) => t.id));
    const todo = tray.filter((item) => item.chopped === false && INGREDIENTS[item.id].chop && (!dish || dish.chop.includes(item.id)));
    if (!todo.length) { setHint('Nothing to chop here.'); return; }
    busyKind = 'chop'; busyUntil = now() + 1400;
    chef.setAction('chop'); SFX.playChop();
    setTimeout(() => { todo.forEach((t) => { t.chopped = true; }); SFX.playChop(); refreshTrayProps(); checkPlate(); updateHUD(); }, 1300);
    return;
  }
  if (id === 'stove') {
    const dish = findDish(tray.map((t) => t.id));
    const todo = tray.filter((item) => item.cooked === false && INGREDIENTS[item.id].cook && (!dish || dish.cook.includes(item.id)));
    if (!todo.length) { setHint('Nothing to cook here.'); return; }
    busyKind = 'stir'; busyUntil = now() + 2000;
    chef.setAction('stir'); SFX.playSizzle();
    setTimeout(() => { todo.forEach((t) => { t.cooked = true; }); SFX.playDing(); refreshTrayProps(); checkPlate(); updateHUD(); }, 1900);
    return;
  }
  if (id === 'serve') {
    if (!plated) { setHint('No plated dish yet — finish a recipe first!'); return; }
    const res = orderMgr.serveDish(plated);
    if (res.ok) { SFX.playServe(); SFX.playCoin(); setHint(`Served ${plated.name}! +${res.earned} coins (combo x${orderMgr.state().mult.toFixed(1)})`); }
    else { SFX.playServe(); setHint(`Served ${plated.name} — no order for it (+2 pts).`); }
    clearPlate();
    updateHUD(); renderOrders();
  }
}

function clearPlate() {
  plated = null;
  if (plateMesh) { scene.remove(plateMesh); plateMesh = null; kitchen.clearPlateSteam(); }
  chef.setAction('idle');
}

// ---------- picker ----------
function openPicker(which) {
  const panel = $('picker');
  const title = $('picker-title');
  const list = $('picker-list');
  const items = which === 'fridge' ? FRIDGE_ITEMS : PANTRY_ITEMS;
  title.textContent = which === 'fridge' ? '🧊 FRIDGE — cold goods' : '🥫 PANTRY — dry goods';
  list.innerHTML = '';
  for (const id of items) {
    const ing = INGREDIENTS[id];
    const b = document.createElement('button');
    b.className = 'pick';
    b.innerHTML = `<span class="pick-emoji">${ing.emoji}</span><span>${ing.name}</span><span class="pick-tag">${ing.cold ? 'COLD' : 'DRY'}</span>`;
    b.onclick = () => { SFX.ensureAudio(); if (addToTray(id) && tray.length >= MAX_TRAY) hidePicker(); };
    list.appendChild(b);
  }
  panel.classList.remove('hidden');
  setHint(which === 'fridge' ? 'Grab something cold from the fridge!' : 'Grab dry goods from the pantry!');
}
function hidePicker() { $('picker').classList.add('hidden'); }

// ---------- orders / HUD ----------
function onOrderEvent(type, data) {
  if (type === 'order') SFX.playDing();
  if (type === 'lost') { SFX.playFail(); setHint(`Order lost: ${data.dish.name} — ${orderMgr.state().lost}/3 lost!`); }
  if (type === 'day') { SFX.playWin(); setHint(`Day ${data} — more orders, faster!`); }
  if (type === 'over-lost') endGame(false, 'Too many lost orders!');
  if (type === 'over-time') endGame(true, 'Shift complete!');
  renderOrders(); updateHUD();
}

function renderOrders() {
  const board = $('orders');
  const st = orderMgr.state();
  board.innerHTML = '';
  for (const o of st.orders) {
    const frac = clamp(o.patience / o.maxPatience, 0, 1);
    const cls = frac > 0.5 ? 'good' : frac > 0.25 ? 'warn' : 'bad';
    const card = document.createElement('div');
    card.className = 'order';
    card.innerHTML = `<div class="order-head"><span class="order-icon">${o.dish.icon}</span><span class="order-name">${o.dish.name}</span><span class="order-price">${o.dish.price}c</span></div>
      <div class="order-recipe">${o.dish.recipe.map((id) => `<span class="ing">${INGREDIENTS[id].emoji} ${INGREDIENTS[id].name}</span>`).join('')}</div>
      <div class="patience"><div class="patience-fill ${cls}" style="width:${Math.round(frac * 100)}%"></div></div>
      <div class="patience-num">${Math.ceil(o.patience)}s</div>`;
    board.appendChild(card);
  }
  if (!st.orders.length) board.innerHTML = '<div class="order-empty">No orders yet…</div>';
}

function updateHUD() {
  const st = orderMgr.state();
  $('timer').textContent = fmtTime(st.timeLeft);
  $('timer').classList.toggle('urgent', st.timeLeft <= 30);
  $('coins').textContent = `${st.coins} 🪙`;
  $('score').textContent = `Score ${st.score}`;
  $('combo').textContent = st.combo > 1 ? `COMBO x${st.mult.toFixed(1)}` : 'COMBO x1.0';
  $('combo').classList.toggle('hot', st.combo > 1);
  $('day').textContent = `Day ${st.day}`;
  $('lost').textContent = `Lost ${st.lost}/3`;
  const trayEl = $('tray');
  trayEl.innerHTML = '';
  for (let i = 0; i < MAX_TRAY; i++) {
    const slot = document.createElement('div');
    slot.className = 'tray-slot' + (tray[i] ? ' filled' : '');
    if (tray[i]) {
      const ing = INGREDIENTS[tray[i].id];
      slot.innerHTML = `<span>${ing.emoji}</span><small>${ing.name}${tray[i].chopped ? ' ✂️' : ''}${tray[i].cooked ? ' 🔥' : ''}</small>`;
    } else slot.innerHTML = '<span>·</span>';
    trayEl.appendChild(slot);
  }
  $('plated').textContent = plated ? `🍽️ PLATED: ${plated.name} — serve it!` : '';
  $('plated').classList.toggle('show', !!plated);
  // station button active state
  document.querySelectorAll('.station-btn').forEach((b) => b.classList.toggle('here', b.dataset.station === chefStation && !chefTarget));
}

function fmtTime(s) {
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, '0')}`;
}

function setHint(t) { $('hint').textContent = t; }

// ---------- game flow ----------
function startGame() {
  SFX.ensureAudio(); SFX.playStart();
  orderMgr.start();
  tray = []; clearPlate(); refreshTrayProps();
  chef.group.position.set(0, 0, 1.6);
  chefStation = null; chefTarget = null;
  state = 'playing';
  $('title-screen').classList.add('hidden');
  $('gameover-screen').classList.add('hidden');
  setHint('New shift! Check the order board, then grab ingredients.');
  renderOrders(); updateHUD();
}

function endGame(finished, reason) {
  state = 'over';
  SFX.playWin();
  const st = orderMgr.state();
  $('final-reason').textContent = reason;
  $('final-stats').innerHTML = `Coins <b>${st.coins}</b> &nbsp;•&nbsp; Score <b>${st.score}</b> &nbsp;•&nbsp; Served <b>${st.served}</b> &nbsp;•&nbsp; Best combo <b>x${(1 + Math.min(st.bestCombo, 10) * 0.1).toFixed(1)}</b> &nbsp;•&nbsp; Day <b>${st.day}</b>`;
  $('gameover-screen').classList.remove('hidden');
  updateHUD();
}

function togglePause() {
  if (state === 'playing') { state = 'paused'; $('pause-screen').classList.remove('hidden'); }
  else if (state === 'paused') { state = 'playing'; $('pause-screen').classList.add('hidden'); }
}

// ---------- UI ----------
function bindUI() {
  $('start-btn').onclick = startGame;
  $('restart-btn').onclick = startGame;
  $('pause-btn').onclick = togglePause;
  $('resume-btn').onclick = togglePause;
  $('mute-btn').onclick = () => { SFX.ensureAudio(); const m = SFX.toggleMute(); $('mute-btn').textContent = m ? '🔇 Muted' : '🔊 Sound'; };
  $('picker-close').onclick = hidePicker;
  document.querySelectorAll('.station-btn').forEach((b) => {
    b.onclick = () => { if (state !== 'playing') return; SFX.ensureAudio(); goToStation(b.dataset.station, true); };
  });
  addEventListener('keydown', (e) => {
    if (e.key === ' ' ) { e.preventDefault(); if (state === 'playing' && chefStation) interact(chefStation); }
    if (e.key === 'p' || e.key === 'P') togglePause();
    if (e.key === 'm' || e.key === 'M') $('mute-btn').click();
    if (e.key === 'Escape') hidePicker();
    if (state === 'playing') {
      const st = STATIONS.find((s) => s.key === e.key);
      if (st) goToStation(st.id, true);
    }
    if (e.key === 'Enter' && (state === 'title' || state === 'over')) startGame();
  });
}

// ---------- shot staging (deterministic scenes for screenshots) ----------
function forceTray(entries) {
  tray = entries.map(([id, chopped, cooked]) => ({ id, chopped: !!chopped, cooked: !!cooked }));
  refreshTrayProps();
}
function forceOrders(list) {
  // list: [dishId, patienceSeconds]
  const mgr = orderMgr;
  const st = mgr.state();
  st.orders.length = 0;
  list.forEach(([dishId, pat], i) => {
    const dish = DISHES.find((d) => d.id === dishId);
    st.orders.push({ id: 900 + i, dish, patience: pat, maxPatience: 55, state: 'waiting' });
  });
}
function applyShot(shot) {
  startGame();
  const st = orderMgr.state();
  if (shot === 'start') {
    // busy cover: title card pushed right; behind it a kitchen mid-shift —
    // Chef Sari chopping at the board, 4 orders (one amber), a steaming
    // plated dish on the island, tray full, fridge open, coins + combo up
    state = 'title';
    const ts = $('title-screen');
    ts.classList.remove('hidden');
    ts.style.justifyContent = 'flex-end';
    ts.style.paddingRight = '30px';
    // narrower card + camera panned right so Chef Sari and the plated dish
    // sit in the open left half instead of hiding behind the title card
    ts.querySelector('.card').style.maxWidth = '500px';
    ts.querySelector('.card').style.padding = '20px 22px';
    camera.position.set(1.1, 6.6, 6.6);
    camera.lookAt(-0.5, 0.9, -3.0);
    forceOrders([['sunshine-rice', 48], ['chicken-noodle', 40], ['beef-potato', 22], ['fruit-milk', 33]]);
    plateDish(DISHES[0]); // Sunshine Rice Box, garnished + steaming, on the island
    plateMesh.position.set(-1.2, 1.02, -0.7); // left end of the island, in the open
    forceTray([['rice', false, false], ['egg', false, false], ['chili', true, false]]);
    chef.group.position.set(-1.1, 0, -2.4);
    chef.group.lookAt(-1.1, 0, -4.35);
    chef.group.rotateY(0.7); // three-quarter view: toque + teal shirt read
    chef.setAction('chop');
    chefStation = 'chop';
    kitchen.setFridgeOpen(true);
    orderMgr.setCoins(24);
    orderMgr.setCombo(2); // combo x1.2
    setHint('Chopping chili for the Sunshine Rice Box…');
  } else if (shot === 'play') {
    // dish mid-assembly: rice + egg on tray, chili chopped, chef chopping
    forceOrders([['sunshine-rice', 38], ['veggie-rice', 30], ['beef-potato', 44]]);
    forceTray([['rice', false, false], ['egg', false, false], ['chili', true, false]]);
    chef.group.position.set(-1.1, 0, -2.4);
    chef.group.lookAt(-1.1, 0, -4.35);
    chef.group.rotateY(0.7); // three-quarter view: toque + teal shirt read
    chef.setAction('chop');
    chefStation = 'chop';
    setHint('Chopping chili for the Sunshine Rice Box…');
  } else if (shot === 'serve') {
    // a plate ready to serve + chef carrying it toward the window
    forceOrders([['sunshine-rice', 42], ['fruit-milk', 26]]);
    forceTray([]);
    plateDish(DISHES[0]);
    chef.group.position.set(3.6, 0, -1.6);
    chef.group.lookAt(5.3, 0, -4.35);
    chef.setAction('carry');
    chefStation = 'serve';
    setHint('Plated: Sunshine Rice Box — take it to SERVE!');
  } else if (shot === 'rush') {
    // service rush: 4 orders, one about to expire, low timer, high combo
    forceOrders([['beef-potato', 8], ['chicken-noodle', 22], ['fried-fish', 31], ['tofu-tempeh', 40]]);
    forceTray([['beef', true, false], ['potato', true, false]]);
    chef.group.position.set(1.3, 0, -2.4);
    chef.group.lookAt(1.3, 0, -4.35);
    chef.setAction('stir');
    chefStation = 'stove';
    setHint('RUSH! The Beef Potato Bowl is almost out of time!');
  }
  // shared staging tweaks per shot
  if (shot === 'play') { /* timer default 150 */ }
  if (shot === 'serve') { /* keep default */ }
  if (shot === 'rush') {
    orderMgr.setElapsed(127); // 23s left on the shift timer
    orderMgr.setCoins(84);
    orderMgr.setCombo(8); // combo x1.8
  }
  renderOrders(); updateHUD();
}

// ---------- main loop ----------
function tick() {
  const dt = Math.min(clock.getDelta(), 0.25); // generous cap: slow machines still play in real time
  const t = clock.elapsedTime;
  kitchen.update(dt, t);

  if (state === 'playing') {
    orderMgr.update(dt);
    const st = orderMgr.state();
    const sec = Math.ceil(st.timeLeft);
    if (sec !== lastTickSecond) { lastTickSecond = sec; if (sec <= 10 && sec > 0) SFX.playTick(); }
    if (Math.floor(t * 2) !== Math.floor((t - dt) * 2)) { renderOrders(); updateHUD(); }

    // chef movement
    let moving = false;
    if (chefTarget) {
      const target = chefTarget;
      const dx = target.x - chef.group.position.x;
      const dz = target.z - chef.group.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.12) {
        moving = true;
        const sp = Math.min(3.4 * dt, dist); // never overshoot the station, even at 1 fps
        chef.group.position.x += (dx / dist) * sp;
        chef.group.position.z += (dz / dist) * sp;
        chef.group.rotation.y = Math.atan2(dx, dz);
      } else {
        autoActFlag = !!target.autoAct;
        arriveAtStation();
        autoActFlag = false;
      }
    }
    if (now() >= busyUntil && busyKind) { busyKind = ''; if (!plated) chef.setAction('idle'); }
    chef.animate(dt, moving);
  } else if (state === 'title' || state === 'over') {
    // gentle idle sway on the title screen
    chef.animate(dt, false);
  }

  renderer.render(scene, camera);
}

// tiny debug handle (read-only state for playtesting)
window.__mbg = {
  state: () => state,
  chef: () => chef.group.position.toArray().map((v) => +v.toFixed(2)),
  target: () => (chefTarget ? chefTarget.toArray().map((v) => +v.toFixed(2)) : null),
  station: () => chefStation,
  tray: () => tray.map((t) => t.id),
  plated: () => (plated ? plated.id : null),
};

init();
