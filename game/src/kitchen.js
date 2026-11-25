// Dapur MBG — the kitchen itself: the cook's hand, the chopping board,
// the wok and fryer, the plating counter, and the serve window.
// Every interaction goes through useStation(stationId, game) so mouse clicks
// and keyboard use share exactly one ruleset.

import {
  BURN_SECONDS, CHOP_SECONDS, COMBO, COOK_SECONDS, INGREDIENTS,
  LAYOUT, MAX_LOST, SHIFT_SECONDS,
} from './config.js';
import {
  findMatchingOrder, serveOrder, spawnOrder, updateOrders,
} from './orders.js';
import {
  playBurn, playChop, playCoin, playDing, playFail, playGrab,
  playServePop, playSizzle,
} from './audio.js';

export function createKitchen() {
  return {
    // What the cook is carrying: { ing, state } or null. One item at a time.
    hand: null,
    // Chopping job: { ing, progress, done } or null.
    chop: null,
    // Cooking jobs, one per burner: { ing, progress, done, burnt } or null.
    wok: null,
    fryer: null,
    // Items laid on the plate, in order: [{ ing, state }].
    plate: [],
    particles: [],
    floats: [],
    message: '',
    messageTimer: 0,
    shake: 0,
  };
}

export function createGame() {
  return {
    screen: 'title', // title | playing | paused | over | complete
    score: 0,
    coins: 0,
    combo: 1,
    comboStreak: 0,
    level: 1,
    day: 1,
    shiftLeft: SHIFT_SECONDS,
    lost: 0,
    served: 0,
    best: 0,
    elapsed: 0,
    kitchen: createKitchen(),
    board: null, // created by main.js (needs orders module state)
    flash: 0, // serve flash 0..1
    tickSecond: -1,
  };
}

export function showMessage(kitchen, text, seconds) {
  kitchen.message = text;
  kitchen.messageTimer = seconds || 2;
}

export function addParticles(kitchen, x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const vel = (speed || 60) * (0.4 + Math.random() * 0.8);
    kitchen.particles.push({
      x, y, vx: Math.cos(angle) * vel, vy: Math.sin(angle) * vel - 40,
      life: 0.6 + Math.random() * 0.5, max: 1, color, size: 2 + Math.random() * 4,
    });
  }
}

export function addFloat(kitchen, x, y, text, color) {
  kitchen.floats.push({ x, y, text, color: color || '#f2c94c', life: 1.4, max: 1.4 });
}

function preparedName(item) {
  const base = INGREDIENTS[item.ing].name;
  if (item.state === 'chopped') return `${base} chopped`;
  if (item.state === 'cooked') return `${base} cooked`;
  return base;
}

// --- Station actions -------------------------------------------------------

function grabIngredient(kitchen, ingId) {
  if (kitchen.hand) {
    showMessage(kitchen, 'Hands full! Put it down first.');
    return;
  }
  kitchen.hand = { ing: ingId, state: 'raw' };
  playGrab();
}

function startChop(kitchen) {
  const hand = kitchen.hand;
  if (!hand) { showMessage(kitchen, 'Grab an ingredient from the pantry first.'); return; }
  if (INGREDIENTS[hand.ing].prep !== 'chop' || hand.state !== 'raw') {
    showMessage(kitchen, `${INGREDIENTS[hand.ing].name} doesn't need chopping.`);
    return;
  }
  if (kitchen.chop) { showMessage(kitchen, 'The board is busy.'); return; }
  kitchen.chop = { ing: hand.ing, progress: 0, done: false };
  kitchen.hand = null;
  playChop();
}

function collectChop(kitchen) {
  if (!kitchen.chop) return;
  if (!kitchen.chop.done) {
    // Mashing the board speeds the chop up.
    kitchen.chop.progress += 0.35;
    playChop();
    return;
  }
  if (kitchen.hand) { showMessage(kitchen, 'Hands full!'); return; }
  kitchen.hand = { ing: kitchen.chop.ing, state: 'chopped' };
  kitchen.chop = null;
  playGrab();
}

function startCook(kitchen, burner) {
  const hand = kitchen.hand;
  const slot = burner === 'wok' ? 'wok' : 'fryer';
  if (!hand) { showMessage(kitchen, 'Grab an ingredient from the pantry first.'); return; }
  const info = INGREDIENTS[hand.ing];
  if (info.prep !== 'cook' || hand.state !== 'raw') {
    showMessage(kitchen, `${info.name} isn't cooked here.`);
    return;
  }
  if (info.cookAt !== burner) {
    showMessage(kitchen, `${info.name} cooks in the ${info.cookAt === 'wok' ? 'WOK' : 'FRYER'}.`);
    return;
  }
  if (kitchen[slot]) { showMessage(kitchen, `The ${burner === 'wok' ? 'wok' : 'fryer'} is busy.`); return; }
  kitchen[slot] = { ing: hand.ing, progress: 0, done: false, burnt: false };
  kitchen.hand = null;
  playSizzle();
  const rect = LAYOUT[burner];
  addParticles(kitchen, rect.x + rect.w / 2, rect.y + 70, '#ffffff', 10, 50);
}

function collectCook(kitchen, burner) {
  const slot = burner === 'wok' ? 'wok' : 'fryer';
  const job = kitchen[slot];
  if (!job) return;
  if (job.burnt) {
    kitchen[slot] = null;
    showMessage(kitchen, 'Burnt! Toss it in the trash.');
    kitchen.hand = { ing: job.ing, state: 'burnt' };
    playBurn();
    return;
  }
  if (!job.done) { showMessage(kitchen, 'Not ready yet — patience!'); return; }
  if (kitchen.hand) { showMessage(kitchen, 'Hands full!'); return; }
  kitchen.hand = { ing: job.ing, state: 'cooked' };
  kitchen[slot] = null;
  playGrab();
}

function plateItem(kitchen, game) {
  const hand = kitchen.hand;
  if (!hand) { showMessage(kitchen, 'Nothing in hand.'); return; }
  if (hand.state === 'burnt') { showMessage(kitchen, 'Burnt! Toss it in the trash.'); return; }
  if (kitchen.plate.length >= 4) { showMessage(kitchen, 'Plate is full!'); return; }
  kitchen.plate.push({ ing: hand.ing, state: hand.state });
  kitchen.hand = null;
  playGrab();
  const order = game.board ? findMatchingOrder(game.board, kitchen.plate) : null;
  if (order) {
    showMessage(kitchen, `${order.recipe.name} is READY! Take it to SERVE!`, 2.5);
    playDing();
  }
}

function servePlate(kitchen, game) {
  if (kitchen.plate.length === 0) { showMessage(kitchen, 'The plate is empty.'); return; }
  const order = game.board ? findMatchingOrder(game.board, kitchen.plate) : null;
  if (!order) {
    showMessage(kitchen, 'No matching order yet — check the tickets!');
    kitchen.shake = 0.35;
    return;
  }
  const result = serveOrder(game.board, order, game.combo);
  kitchen.plate = [];
  game.coins += result.coins;
  game.score += result.points;
  game.served += 1;
  game.comboStreak += 1;
  game.combo = Math.min(COMBO.cap, 1 + game.comboStreak * COMBO.step);
  game.flash = 1;
  const rect = LAYOUT.serve;
  addFloat(kitchen, rect.x + rect.w / 2, rect.y - 10, `+${result.coins} coins`, '#f2c94c');
  addFloat(kitchen, rect.x + rect.w / 2, rect.y + 22, `+${result.points}`, '#ffffff');
  addParticles(kitchen, rect.x + rect.w / 2, rect.y + 60, '#f2c94c', 18, 120);
  playServePop();
  playCoin();
  if (game.score > game.best) game.best = game.score;
}

function trashHand(kitchen) {
  if (kitchen.hand) {
    kitchen.hand = null;
    showMessage(kitchen, 'Tossed.');
    return;
  }
  if (kitchen.plate.length > 0) {
    kitchen.plate = [];
    showMessage(kitchen, 'Plate cleared.');
  }
}

// One entry point for every station interaction, mouse or keyboard.
export function useStation(game, stationId, arg) {
  const kitchen = game.kitchen;
  if (game.screen !== 'playing') return;
  if (stationId === 'pantry') {
    if (arg) grabIngredient(kitchen, arg);
    return;
  }
  if (stationId === 'board') { if (kitchen.chop) collectChop(kitchen); else startChop(kitchen); return; }
  if (stationId === 'wok') { if (kitchen.wok) collectCook(kitchen, 'wok'); else startCook(kitchen, 'wok'); return; }
  if (stationId === 'fryer') { if (kitchen.fryer) collectCook(kitchen, 'fryer'); else startCook(kitchen, 'fryer'); return; }
  if (stationId === 'plate') { plateItem(kitchen, game); return; }
  if (stationId === 'serve') { servePlate(kitchen, game); return; }
  if (stationId === 'trash') { trashHand(kitchen); }
}

// --- Per-frame update ------------------------------------------------------

export function updateKitchen(game, dt, rng) {
  const kitchen = game.kitchen;
  game.elapsed += dt;
  game.shiftLeft -= dt;

  // Chopping progresses on its own; mashing the board speeds it.
  if (kitchen.chop && !kitchen.chop.done) {
    kitchen.chop.progress += dt / CHOP_SECONDS;
    if (kitchen.chop.progress >= 1) {
      kitchen.chop.progress = 1;
      kitchen.chop.done = true;
      playDing();
    }
  }
  for (const slot of ['wok', 'fryer']) {
    const job = kitchen[slot];
    if (!job || job.burnt) continue;
    job.progress += dt / COOK_SECONDS;
    if (job.progress >= 1 && !job.done) {
      job.done = true;
      playDing();
      const rect = LAYOUT[slot];
      addParticles(kitchen, rect.x + rect.w / 2, rect.y + 60, '#ffffff', 8, 40);
    } else if (job.done && job.progress >= 1 + BURN_SECONDS / COOK_SECONDS) {
      job.burnt = true;
      playBurn();
      showMessage(kitchen, 'BURNT! Grab it and toss it!', 2.5);
    }
  }

  // Orders tick; expired ones cost a life and reset the combo.
  const expired = updateOrders(game.board, dt, game.level, rng);
  for (const order of expired) {
    game.lost += 1;
    game.combo = 1;
    game.comboStreak = 0;
    kitchen.shake = 0.5;
    playFail();
    showMessage(kitchen, `Order lost: ${order.recipe.name}! (${game.lost}/${MAX_LOST})`, 3);
    if (game.lost >= MAX_LOST) {
      game.screen = 'over';
      return;
    }
  }

  // Shift clock: survive it and the day is complete.
  if (game.shiftLeft <= 0) {
    game.screen = 'complete';
    game.score += 100 * game.day;
    return;
  }

  // Level grows with dishes served: faster orders, wider menu.
  const newLevel = 1 + Math.floor(game.served / 4);
  if (newLevel !== game.level) {
    game.level = newLevel;
    showMessage(kitchen, `Level ${game.level}! Orders are coming faster!`, 3);
    playDing();
  }

  // Particles, floats, messages, flash decay.
  for (let i = kitchen.particles.length - 1; i >= 0; i -= 1) {
    const p = kitchen.particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy -= 30 * dt;
    if (p.life <= 0) kitchen.particles.splice(i, 1);
  }
  for (let i = kitchen.floats.length - 1; i >= 0; i -= 1) {
    const f = kitchen.floats[i];
    f.life -= dt;
    f.y -= 34 * dt;
    if (f.life <= 0) kitchen.floats.splice(i, 1);
  }
  if (kitchen.messageTimer > 0) kitchen.messageTimer -= dt;
  if (kitchen.shake > 0) kitchen.shake -= dt;
  if (game.flash > 0) game.flash = Math.max(0, game.flash - dt * 2.5);
}

export function startDay(game, rng) {
  game.screen = 'playing';
  game.kitchen = createKitchen();
  game.shiftLeft = SHIFT_SECONDS;
  game.lost = 0;
  game.served = 0;
  game.combo = 1;
  game.comboStreak = 0;
  game.elapsed = 0;
  game.level = 1;
  if (game.board) {
    game.board.orders = [];
    game.board.spawnTimer = 3;
    spawnOrder(game.board, 1, rng);
    spawnOrder(game.board, 1, rng);
  }
}

export { preparedName };
