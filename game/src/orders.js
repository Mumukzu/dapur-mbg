// Dapur MBG — the order board: spawning tickets, patience timers,
// matching a finished plate against an open ticket, and scoring a serve.

import { LEVEL, MAX_ORDERS, RECIPES } from './config.js';

let nextOrderId = 1;

export function createOrderBoard() {
  return { orders: [], spawnTimer: 6, served: 0, lost: 0 };
}

function pickRecipe(level, rng) {
  // Early levels only serve the two-ingredient dishes; the full menu opens
  // as the day goes on, so the first minutes teach the loop.
  const pool = level >= 3 ? RECIPES : level >= 2 ? RECIPES.slice(0, 4) : RECIPES.slice(3);
  return pool[Math.floor(rng() * pool.length)];
}

export function spawnOrder(board, level, rng) {
  if (board.orders.length >= MAX_ORDERS) return null;
  const recipe = pickRecipe(level, rng);
  const patience = recipe.patience * Math.pow(LEVEL.patienceScale, level - 1);
  const order = {
    id: nextOrderId,
    recipe,
    patience,
    timeLeft: patience,
    bornAt: 0,
    slide: 0, // 0..1 slide-in animation progress
    urgent: false,
  };
  nextOrderId += 1;
  board.orders.push(order);
  return order;
}

// Advance timers. Returns the orders that just expired.
export function updateOrders(board, dt, level, rng) {
  const expired = [];
  board.spawnTimer -= dt;
  if (board.spawnTimer <= 0) {
    const made = spawnOrder(board, level, rng);
    if (made) board.spawnTimer = LEVEL.spawnEvery * Math.pow(LEVEL.spawnScale, level - 1);
    else board.spawnTimer = 2;
    if (board.spawnTimer < LEVEL.minSpawn) board.spawnTimer = LEVEL.minSpawn;
  }
  for (let i = board.orders.length - 1; i >= 0; i -= 1) {
    const order = board.orders[i];
    order.timeLeft -= dt;
    if (order.slide < 1) order.slide = Math.min(1, order.slide + dt * 3);
    const ratio = order.timeLeft / order.patience;
    order.urgent = ratio < 0.3;
    if (order.timeLeft <= 0) {
      expired.push(order);
      board.orders.splice(i, 1);
      board.lost += 1;
    }
  }
  return expired;
}

export function orderRatio(order) {
  return Math.max(0, order.timeLeft / order.patience);
}

// Does the plate (array of {ing, state}) match this order exactly?
export function plateMatchesOrder(plate, order) {
  const needs = order.recipe.needs;
  if (plate.length !== needs.length) return false;
  const used = new Array(needs.length).fill(false);
  for (const item of plate) {
    let found = false;
    for (let i = 0; i < needs.length; i += 1) {
      if (!used[i] && needs[i].ing === item.ing && needs[i].state === item.state) {
        used[i] = true;
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}

// Find the first open order the plate satisfies, or null.
export function findMatchingOrder(board, plate) {
  for (const order of board.orders) {
    if (plateMatchesOrder(plate, order)) return order;
  }
  return null;
}

// Score for serving an order: dish price, a speed bonus for serving early,
// and the combo multiplier the kitchen hands in.
export function serveOrder(board, order, combo) {
  const index = board.orders.indexOf(order);
  if (index === -1) return null;
  board.orders.splice(index, 1);
  board.served += 1;
  const early = order.timeLeft / order.patience;
  const speedBonus = Math.round(early * 10);
  const coins = order.recipe.price;
  const points = Math.round((coins * 10 + speedBonus) * combo);
  return { coins, points, speedBonus, recipe: order.recipe };
}
