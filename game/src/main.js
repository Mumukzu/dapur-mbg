// Dapur MBG — the game loop and the state machine:
// title -> playing -> paused -> playing, and playing -> over / complete.
// Clicks are routed to stations by their rectangles; keyboard use goes
// through the same useStation entry point as the mouse.

import { BEST_KEY, FIELD, INGREDIENTS, LAYOUT, STEP } from './config.js';
import { createInput, pointInRect } from './input.js';
import { createOrderBoard } from './orders.js';
import { createGame, startDay, updateKitchen, useStation } from './kitchen.js';
import { drawGame } from './render.js';
import { isMuted, playClick, playTick, setMuted, unlockAudio } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = FIELD.width;
canvas.height = FIELD.height;

const input = createInput(canvas);
input.muted = isMuted();

const game = createGame();
game.board = createOrderBoard();
// Exposed for automated playtests and debugging only.
window.__dapurGame = game;
try {
  game.best = Number(localStorage.getItem(BEST_KEY) || 0) || 0;
} catch {
  game.best = 0;
}

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
let shotMode = false;
if (shotName) {
  shotMode = true;
  game.screen = stageShot(shotName, game);
  game.screen = 'playing';
  drawGame(ctx, game, input, 1200);
} else {
  game.screen = 'title';
}

function saveBest() {
  try {
    localStorage.setItem(BEST_KEY, String(game.best));
  } catch {
    // Best score is a nicety; a blocked store must never break the game.
  }
}

// Where does a click land? Returns { station, arg } or null.
function hitTest(x, y) {
  // Header buttons first.
  if (x >= 1172 && x <= 1216 && y >= 14 && y <= 50) return { station: 'mute' };
  if (x >= 1222 && x <= 1266 && y >= 14 && y <= 50) return { station: 'pause' };
  if (pointInRect(x, y, LAYOUT.pantry)) {
    const ids = Object.keys(INGREDIENTS);
    for (let i = 0; i < ids.length; i += 1) {
      const bx = LAYOUT.pantry.x + 14 + (i % 3) * 94;
      const by = LAYOUT.pantry.y + 16 + Math.floor(i / 3) * 96;
      if (x >= bx && x <= bx + 82 && y >= by && y <= by + 84) {
        return { station: 'pantry', arg: ids[i] };
      }
    }
    return { station: 'pantry' };
  }
  if (pointInRect(x, y, LAYOUT.board)) return { station: 'board' };
  if (pointInRect(x, y, LAYOUT.wok)) return { station: 'wok' };
  if (pointInRect(x, y, LAYOUT.fryer)) return { station: 'fryer' };
  if (pointInRect(x, y, LAYOUT.plate)) return { station: 'plate' };
  if (pointInRect(x, y, LAYOUT.serve)) return { station: 'serve' };
  if (pointInRect(x, y, LAYOUT.trash)) return { station: 'trash' };
  return null;
}

function handleClick(click) {
  unlockAudio();
  if (game.screen === 'title') {
    startDay(game, Math.random);
    playClick();
    return;
  }
  if (game.screen === 'over' || game.screen === 'complete') {
    saveBest();
    startDay(game, Math.random);
    playClick();
    return;
  }
  if (game.screen === 'paused') {
    game.screen = 'playing';
    playClick();
    return;
  }
  const hit = hitTest(click.x, click.y);
  if (!hit) return;
  if (hit.station === 'mute') {
    setMuted(!isMuted());
    input.muted = isMuted();
    return;
  }
  if (hit.station === 'pause') {
    game.screen = 'paused';
    playClick();
    return;
  }
  playClick();
  useStation(game, hit.station, hit.arg);
}

function handleKeys() {
  if (input.mutePressed) {
    input.mutePressed = false;
    setMuted(!isMuted());
    input.muted = isMuted();
  }
  if (input.pausePressed) {
    input.pausePressed = false;
    if (game.screen === 'playing') game.screen = 'paused';
    else if (game.screen === 'paused') game.screen = 'playing';
  }
  if (input.restartPressed) {
    input.restartPressed = false;
    if (game.screen === 'over' || game.screen === 'complete') {
      saveBest();
      startDay(game, Math.random);
    }
  }
  if (input.startPressed) {
    input.startPressed = false;
    if (game.screen === 'title') startDay(game, Math.random);
  }
  if (input.useSelected && input.selected) {
    input.useSelected = false;
    if (game.screen === 'playing') {
      unlockAudio();
      if (input.selected === 'pantry') {
        // Keyboard pantry use grabs the first ingredient; the mouse
        // picks a specific bin. Space on the board/wok/fryer/plate/serve
        // runs the station itself.
      } else {
        useStation(game, input.selected);
      }
    }
  } else {
    input.useSelected = false;
  }
}

let last = performance.now();
let accumulator = 0;

function frame(now) {
  const elapsed = Math.min(0.1, (now - last) / 1000);
  last = now;
  handleKeys();
  if (input.click) {
    const click = input.click;
    input.click = null;
    handleClick(click);
  }
  if (game.screen === 'playing') {
    accumulator += elapsed;
    while (accumulator >= STEP) {
      updateKitchen(game, STEP, Math.random);
      accumulator -= STEP;
      if (game.screen !== 'playing') {
        saveBest();
        break;
      }
    }
    // One tick a second while the shift clock runs low.
    const whole = Math.ceil(game.shiftLeft);
    if (whole !== game.tickSecond) {
      game.tickSecond = whole;
      if (whole <= 10 && whole > 0) playTick();
    }
  }
  drawGame(ctx, game, input, now);
  requestAnimationFrame(frame);
}

if (!shotMode) requestAnimationFrame(frame);
