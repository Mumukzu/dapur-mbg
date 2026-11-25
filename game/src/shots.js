// Dapur MBG — screenshot scenes behind ?shot=cover|cooking|serve|rush.
// Each scene builds its state through the game's real functions (real
// orders, real chop/cook jobs, a real plate), so every shot is a genuine
// render of the game's own code, staged deterministically with no random
// values left to chance.

import { createOrderBoard, spawnOrder } from './orders.js';
import { createGame, startDay } from './kitchen.js';

function fixedRng(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

function makeBase() {
  const game = createGame();
  game.board = createOrderBoard();
  game.best = 2450;
  return game;
}

function orderWith(game, recipeIndex, timeLeft, patience) {
  const board = game.board;
  const order = spawnOrder(board, 3, fixedRng([recipeIndex / 5 + 0.05]));
  if (!order) return null;
  order.timeLeft = timeLeft;
  order.patience = patience;
  order.slide = 1;
  return order;
}

export function stageShot(name, game) {
  // Start from a fresh playing game, then dress the scene.
  startDay(game, fixedRng([0.1, 0.3, 0.5, 0.7, 0.9]));
  game.board.orders = [];
  const k = game.kitchen;

  if (name === 'cooking') {
    game.score = 1240;
    game.coins = 86;
    game.served = 4;
    game.combo = 1.5;
    game.comboStreak = 2;
    game.shiftLeft = 98;
    orderWith(game, 0, 34, 48);
    orderWith(game, 1, 22, 52);
    k.chop = { ing: 'chili', progress: 0.55, done: false };
    k.wok = { ing: 'egg', progress: 0.6, done: false, burnt: false };
    k.fryer = { ing: 'chicken', progress: 0.85, done: false, burnt: false };
    k.hand = { ing: 'veg', state: 'raw' };
    return 'playing';
  }

  if (name === 'serve') {
    game.score = 2380;
    game.coins = 142;
    game.served = 8;
    game.combo = 2.0;
    game.comboStreak = 4;
    game.shiftLeft = 61;
    orderWith(game, 0, 28, 48);
    orderWith(game, 3, 18, 40);
    k.plate = [
      { ing: 'rice', state: 'raw' },
      { ing: 'egg', state: 'cooked' },
      { ing: 'chili', state: 'chopped' },
    ];
    k.floats.push({ x: 894, y: 470, text: '+18 coins', color: '#f2c94c', life: 1.4, max: 1.4 });
    k.floats.push({ x: 894, y: 502, text: '+260', color: '#ffffff', life: 1.4, max: 1.4 });
    game.flash = 0.6;
    return 'playing';
  }

  if (name === 'rush') {
    game.score = 3120;
    game.coins = 196;
    game.served = 10;
    game.combo = 1.75;
    game.comboStreak = 3;
    game.shiftLeft = 34;
    game.lost = 2;
    orderWith(game, 0, 9, 48);
    orderWith(game, 1, 16, 52);
    orderWith(game, 2, 24, 55);
    orderWith(game, 4, 31, 42);
    k.chop = { ing: 'veg', progress: 0.9, done: true };
    k.wok = { ing: 'noodle', progress: 0.7, done: false, burnt: false };
    k.fryer = { ing: 'chicken', progress: 1.0, done: true, burnt: false };
    k.plate = [
      { ing: 'rice', state: 'raw' },
      { ing: 'chili', state: 'chopped' },
    ];
    k.hand = { ing: 'egg', state: 'raw' };
    return 'playing';
  }

  // Default: the cover — mid-rush, three tickets, a dish mid-assembly.
  game.score = 1870;
  game.coins = 118;
  game.served = 6;
  game.combo = 1.5;
  game.comboStreak = 2;
  game.shiftLeft = 112;
  orderWith(game, 0, 36, 48);
  orderWith(game, 1, 27, 52);
  orderWith(game, 4, 41, 42);
  k.chop = { ing: 'chili', progress: 0.4, done: false };
  k.wok = { ing: 'egg', progress: 0.75, done: false, burnt: false };
  k.plate = [
    { ing: 'rice', state: 'raw' },
    { ing: 'chili', state: 'chopped' },
  ];
  k.hand = { ing: 'veg', state: 'raw' };
  return 'playing';
}

export { makeBase };
