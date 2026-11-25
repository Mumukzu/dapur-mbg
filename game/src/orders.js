// orders.js — order board logic: spawning, patience timers, combo, coins,
// day/level progression, lost orders and the shift timer.
import { DISHES, LEVELS, SHIFT_SECONDS, MAX_LOST } from './config.js';

export function createOrderManager(onEvent) {
  let orders = [];
  let nextId = 1;
  let spawnTimer = 0;
  let elapsed = 0;
  let coins = 0;
  let score = 0;
  let combo = 0;
  let comboTimer = 0;
  let bestCombo = 0;
  let served = 0;
  let lost = 0;
  let day = 1;
  let over = false;

  function addCoins(n) { coins += n; } // mission bonus lands here

  function level() { return LEVELS[Math.min(day - 1, LEVELS.length - 1)]; }
  function timeLeft() { return Math.max(0, SHIFT_SECONDS - elapsed); }

  function spawnOrder() {
    const lv = level();
    if (orders.length >= lv.ordersAtOnce) return;
    const dish = DISHES[Math.floor(Math.random() * DISHES.length)];
    orders.push({ id: nextId++, dish, patience: lv.patience, maxPatience: lv.patience, state: 'waiting' });
    onEvent('order', orders[orders.length - 1]);
  }

  function start() {
    orders = []; elapsed = 0; coins = 0; score = 0; combo = 0; bestCombo = 0;
    served = 0; lost = 0; day = 1; over = false; spawnTimer = 0;
    spawnOrder(); spawnOrder();
  }

  function comboMultiplier() { return 1 + Math.min(combo, 10) * 0.1; } // up to x2.0

  function serveDish(dish) {
    const idx = orders.findIndex((o) => o.dish.id === dish.id && o.state === 'waiting');
    if (idx < 0) {
      score += 2; // a plate nobody ordered: tiny pity points
      onEvent('serve-miss', dish);
      return { ok: false, earned: 2 };
    }
    const order = orders[idx];
    const speedBonus = Math.round((order.patience / order.maxPatience) * 5);
    const mult = comboMultiplier();
    const earned = Math.round((dish.price + speedBonus) * mult);
    orders.splice(idx, 1);
    coins += earned;
    score += earned * 10;
    served += 1;
    combo += 1;
    comboTimer = 12;
    bestCombo = Math.max(bestCombo, combo);
    if (served % 4 === 0 && day < LEVELS.length) { day += 1; onEvent('day', day); }
    onEvent('serve', { dish, earned, combo, mult });
    return { ok: true, earned };
  }

  function update(dt) {
    if (over) return;
    elapsed += dt;
    if (comboTimer > 0) { comboTimer -= dt; if (comboTimer <= 0) combo = 0; }
    spawnTimer -= dt;
    if (spawnTimer <= 0) { spawnOrder(); spawnTimer = level().spawnEvery; }
    for (const o of orders) o.patience -= dt;
    const expired = orders.filter((o) => o.patience <= 0);
    for (const o of expired) {
      orders.splice(orders.indexOf(o), 1);
      lost += 1; combo = 0;
      onEvent('lost', o);
    }
    if (lost >= MAX_LOST) { over = true; onEvent('over-lost'); }
    else if (timeLeft() <= 0) { over = true; onEvent('over-time'); }
  }

  function state() {
    return { orders, coins, score, combo, bestCombo, served, lost, day, over, timeLeft: timeLeft(), mult: comboMultiplier() };
  }

  // Staging hooks used only by the ?shot= screenshot presets.
  function setElapsed(s) { elapsed = s; }
  function setCoins(n) { coins = n; }
  function setCombo(n) { combo = n; comboTimer = 12; }

  return { start, update, serveDish, state, spawnOrder, setElapsed, setCoins, setCombo, addCoins };
}
