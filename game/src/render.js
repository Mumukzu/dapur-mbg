// Dapur MBG — every pixel of the kitchen, drawn in code on a 2D canvas.
// No image files: counters, flames, tickets and food are all canvas shapes.

import {
  FIELD, FONT, INGREDIENTS, LAYOUT, PALETTE, RECIPES, STATIONS,
} from './config.js';
import { orderRatio } from './orders.js';
import { preparedName } from './kitchen.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'playing';
export const SCREEN_OVER = 'over';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align, bold) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? '700' : '400'} ${size}px ${FONT}`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// --- Food icons -----------------------------------------------------------

export function drawIngredient(ctx, ingId, x, y, size, state) {
  const info = INGREDIENTS[ingId];
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  if (state === 'burnt') {
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#555';
    ctx.font = `700 ${Math.round(s * 0.5)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('X', 0, 1);
    ctx.restore();
    return;
  }
  if (state === 'chopped') {
    // Three little pieces of the ingredient.
    ctx.fillStyle = info.color;
    ctx.strokeStyle = info.dark;
    ctx.lineWidth = 2;
    for (const [dx, dy, r] of [[-s * 0.28, s * 0.1, s * 0.2], [s * 0.22, -s * 0.12, s * 0.18], [s * 0.05, s * 0.28, s * 0.16]]) {
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  ctx.fillStyle = info.color;
  ctx.strokeStyle = info.dark;
  ctx.lineWidth = 2.5;
  if (info.shape === 'bowl') {
    ctx.beginPath();
    ctx.arc(0, -s * 0.08, s * 0.42, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.08, s * 0.4, s * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (info.shape === 'nest') {
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, s * (0.42 - i * 0.1), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = info.dark;
    ctx.fill();
  } else if (info.shape === 'drum') {
    ctx.beginPath();
    ctx.ellipse(0, s * 0.05, s * 0.3, s * 0.38, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.2, -s * 0.28);
    ctx.lineTo(s * 0.42, -s * 0.42);
    ctx.stroke();
    ctx.fillStyle = '#fffaf0';
    ctx.beginPath();
    ctx.arc(s * 0.44, -s * 0.44, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
  } else if (info.shape === 'egg') {
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.34, s * 0.44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(s * 0.05, -s * 0.05, s * 0.16, s * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (info.shape === 'chili') {
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, -s * 0.25);
    ctx.quadraticCurveTo(0, s * 0.5, s * 0.42, -s * 0.3);
    ctx.quadraticCurveTo(0, s * 0.18, -s * 0.4, -s * 0.25);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#2e7d32';
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, -s * 0.25);
    ctx.quadraticCurveTo(-s * 0.5, -s * 0.45, -s * 0.3, -s * 0.48);
    ctx.stroke();
  } else {
    // Leafy veggies.
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.42, s * 0.3, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(s * 0.1, -s * 0.1, s * 0.34, s * 0.24, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  if (state === 'cooked') {
    // Golden-brown cooked tint + a wisp of steam.
    ctx.fillStyle = 'rgba(180, 110, 20, 0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.15, -s * 0.5);
    ctx.quadraticCurveTo(-s * 0.3, -s * 0.7, -s * 0.12, -s * 0.9);
    ctx.stroke();
  }
  ctx.restore();
}

function chip(ctx, x, y, label, color) {
  ctx.font = `700 13px ${FONT}`;
  const w = ctx.measureText(label).width + 18;
  ctx.fillStyle = color;
  rr(ctx, x, y, w, 22, 11);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + 12);
  return w;
}

// --- Header and order board -----------------------------------------------

function drawHeader(ctx, game, muted) {
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(0, 0, FIELD.width, 64);
  ctx.fillStyle = PALETTE.flameA;
  ctx.fillRect(0, 64, FIELD.width, 4);
  text(ctx, 'DAPUR MBG', 24, 24, 26, '#ffd23c', 'left', true);
  text(ctx, 'Free Nutritious Meals Kitchen', 24, 48, 13, '#e8cfa8', 'left');
  text(ctx, `SCORE  ${game.score}`, 330, 26, 20, '#fff6e8', 'left', true);
  text(ctx, `COINS  ${game.coins}`, 330, 48, 14, PALETTE.gold, 'left', true);
  const comboLabel = game.combo > 1 ? `COMBO x${game.combo.toFixed(2)}` : 'COMBO x1.00';
  text(ctx, comboLabel, 540, 26, 18, game.combo > 1 ? '#ff9a3c' : '#c9b18a', 'left', true);
  text(ctx, `Day ${game.day}  •  Level ${game.level}  •  Served ${game.served}`, 540, 48, 14, '#e8cfa8', 'left');
  // Shift timer bar.
  const barX = 830;
  const barW = 220;
  text(ctx, `SHIFT ${fmtTime(game.shiftLeft)}`, barX, 20, 13, '#e8cfa8', 'left', true);
  ctx.fillStyle = '#5d3a1e';
  rr(ctx, barX, 30, barW, 14, 7);
  ctx.fill();
  const frac = Math.max(0, game.shiftLeft / 150);
  ctx.fillStyle = frac < 0.25 ? PALETTE.red : frac < 0.5 ? PALETTE.amber : PALETTE.green;
  if (frac > 0) { rr(ctx, barX, 30, barW * frac, 14, 7); ctx.fill(); }
  // Lost-order hearts.
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < 3 - game.lost ? '#ff5a6e' : '#5d3a1e';
    ctx.beginPath();
    const hx = 1075 + i * 30;
    ctx.arc(hx, 26, 9, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '♥', hx, 27, 13, '#fff', 'center', true);
  }
  text(ctx, 'lost orders', 1062, 48, 12, '#e8cfa8', 'left');
  // Mute / pause buttons.
  ctx.fillStyle = '#5d3a1e';
  rr(ctx, 1172, 14, 44, 36, 8);
  ctx.fill();
  text(ctx, muted ? 'MUTE' : 'SOUND', 1194, 32, 11, '#fff6e8', 'center', true);
  ctx.fillStyle = '#5d3a1e';
  rr(ctx, 1222, 14, 44, 36, 8);
  ctx.fill();
  text(ctx, 'II', 1244, 32, 13, '#fff6e8', 'center', true);
}

function drawOrderBoard(ctx, game, now) {
  const y = LAYOUT.boardY;
  ctx.fillStyle = '#6b4423';
  rr(ctx, 24, y, FIELD.width - 48, LAYOUT.boardH, 12);
  ctx.fill();
  text(ctx, 'ORDER BOARD', 40, y + 20, 15, '#ffd23c', 'left', true);
  text(ctx, 'Serve before the timer runs out!', 170, y + 20, 13, '#e8cfa8', 'left');
  const board = game.board;
  if (!board || board.orders.length === 0) {
    text(ctx, 'No orders yet — the lunch rush is coming…', 40, y + 68, 17, '#e8cfa8', 'left');
    return;
  }
  board.orders.forEach((order, i) => {
    const slide = order.slide < 1 ? (1 - order.slide) * -40 : 0;
    const tx = 40 + i * 300 + slide;
    const ty = y + 34;
    const tw = 284;
    const th = 74;
    const pulse = order.urgent ? 1 + Math.sin(now / 130) * 0.03 : 1;
    ctx.save();
    ctx.translate(tx + tw / 2, ty + th / 2);
    ctx.scale(pulse, pulse);
    ctx.translate(-tw / 2, -th / 2);
    ctx.fillStyle = PALETTE.ticket;
    rr(ctx, 0, 0, tw, th, 10);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ticketEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 16px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`#${order.id}  ${order.recipe.short}`, 12, 16);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `700 14px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${order.recipe.price} coins`, tw - 10, 16);
    ctx.textAlign = 'left';
    let cx = 12;
    for (const need of order.recipe.needs) {
      const info = INGREDIENTS[need.ing];
      const label = `${info.short}${need.state === 'chopped' ? ' ✂' : need.state === 'cooked' ? ' ~' : ''}`;
      cx += chip(ctx, cx, 34, label, need.state === 'cooked' ? '#b4552d' : need.state === 'chopped' ? '#3f9d4e' : '#8a6a4d') + 6;
    }
    const ratio = orderRatio(order);
    ctx.fillStyle = '#e5d9bd';
    rr(ctx, 12, 60, tw - 24, 8, 4);
    ctx.fill();
    ctx.fillStyle = ratio < 0.3 ? PALETTE.red : ratio < 0.55 ? PALETTE.amber : PALETTE.green;
    if (ratio > 0) { rr(ctx, 12, 60, (tw - 24) * ratio, 8, 4); ctx.fill(); }
    ctx.restore();
  });
}

// --- Kitchen background and stations --------------------------------------

function drawBackground(ctx) {
  // Terracotta wall, cream tile floor.
  const wall = ctx.createLinearGradient(0, 0, 0, 210);
  wall.addColorStop(0, PALETTE.wallTop);
  wall.addColorStop(1, PALETTE.wallBottom);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, FIELD.width, 210);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let x = 0; x < FIELD.width; x += 90) ctx.fillRect(x, 0, 46, 210);
  ctx.fillStyle = PALETTE.floorA;
  ctx.fillRect(0, 210, FIELD.width, FIELD.height - 210);
  ctx.fillStyle = PALETTE.floorB;
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 16; col += 1) {
      if ((row + col) % 2 === 0) ctx.fillRect(col * 80 + (row % 2) * 40, 210 + row * 86, 80, 86);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(0, 206, FIELD.width, 6);
}

function stationShell(ctx, rect, label, hint, selected, hot) {
  ctx.fillStyle = hot ? '#ffe9b0' : PALETTE.counterTop;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterFront;
  rr(ctx, rect.x, rect.y + rect.h - 46, rect.w, 46, 10);
  ctx.fill();
  ctx.fillStyle = '#fff6e8';
  ctx.font = `700 17px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h - 30);
  ctx.fillStyle = '#e8cfa8';
  ctx.font = '12px ' + FONT;
  ctx.fillText(hint, rect.x + rect.w / 2, rect.y + rect.h - 12);
  if (selected) {
    ctx.strokeStyle = '#ffd23c';
    ctx.lineWidth = 4;
    rr(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 14);
    ctx.stroke();
  }
}

function drawProgressBar(ctx, x, y, w, ratio, color, label) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  rr(ctx, x, y, w, 16, 8);
  ctx.fill();
  ctx.fillStyle = color;
  if (ratio > 0) { rr(ctx, x, y, w * Math.min(1, ratio), 16, 8); ctx.fill(); }
  if (label) {
    ctx.fillStyle = '#fff';
    ctx.font = `700 11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + 9);
  }
}

function drawFlame(ctx, x, y, now, scale) {
  const flick = Math.sin(now / 90 + x) * 0.12 + Math.sin(now / 47) * 0.08;
  const s = scale * (1 + flick);
  ctx.fillStyle = PALETTE.flameC;
  ctx.beginPath();
  ctx.moveTo(x - 26 * s, y);
  ctx.quadraticCurveTo(x - 20 * s, y - 34 * s, x, y - 52 * s);
  ctx.quadraticCurveTo(x + 20 * s, y - 34 * s, x + 26 * s, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.flameA;
  ctx.beginPath();
  ctx.moveTo(x - 17 * s, y);
  ctx.quadraticCurveTo(x - 12 * s, y - 24 * s, x, y - 38 * s);
  ctx.quadraticCurveTo(x + 12 * s, y - 24 * s, x + 17 * s, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.flameB;
  ctx.beginPath();
  ctx.moveTo(x - 9 * s, y);
  ctx.quadraticCurveTo(x - 6 * s, y - 14 * s, x, y - 22 * s);
  ctx.quadraticCurveTo(x + 6 * s, y - 14 * s, x + 9 * s, y);
  ctx.closePath();
  ctx.fill();
}

function drawStations(ctx, game, input, now) {
  const k = game.kitchen;
  const sel = input ? input.selected : null;
  const cx = (r) => r.x + r.w / 2;

  // Pantry: six ingredient bins in two rows of three.
  const p = LAYOUT.pantry;
  stationShell(ctx, p, 'PANTRY  [1]', 'Click an ingredient', sel === 'pantry', false);
  const ids = Object.keys(INGREDIENTS);
  ids.forEach((id, i) => {
    const bx = p.x + 14 + (i % 3) * 94;
    const by = p.y + 16 + Math.floor(i / 3) * 96;
    ctx.fillStyle = '#f7ead0';
    rr(ctx, bx, by, 82, 84, 10);
    ctx.fill();
    ctx.strokeStyle = '#d9c27a';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredient(ctx, id, bx + 41, by + 32, 52, 'raw');
    ctx.fillStyle = PALETTE.text;
    ctx.font = '700 13px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(INGREDIENTS[id].name, bx + 41, by + 68);
  });

  // Chopping board.
  const b = LAYOUT.board;
  stationShell(ctx, b, 'CHOP BOARD  [2]', 'Click to chop / mash', sel === 'board', !!k.chop);
  ctx.fillStyle = PALETTE.board;
  rr(ctx, b.x + 16, b.y + 18, b.w - 32, 120, 10);
  ctx.fill();
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (k.chop) {
    drawIngredient(ctx, k.chop.ing, cx(b), b.y + 78, 64, k.chop.done ? 'chopped' : 'raw');
    drawProgressBar(ctx, b.x + 30, b.y + 152, b.w - 60, k.chop.progress, k.chop.done ? PALETTE.green : PALETTE.amber, k.chop.done ? 'READY — click to take' : 'CHOPPING…');
    if (!k.chop.done) {
      // Knife chopping diagonally, blade flashing down onto the board.
      const ky = b.y + 56 + Math.sin(now / 80) * 12;
      ctx.save();
      ctx.translate(cx(b) + 42, ky);
      ctx.rotate(0.6);
      ctx.fillStyle = '#dfe3e8';
      ctx.fillRect(-4, -8, 8, 34);
      ctx.fillStyle = '#3a2415';
      ctx.fillRect(-4, -20, 8, 13);
      ctx.restore();
    }
  } else {
    ctx.fillStyle = '#8a6a4d';
    ctx.font = '700 15px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('Empty board', cx(b), b.y + 78);
    ctx.font = '13px ' + FONT;
    ctx.fillText('Grab Chili or Veggies first', cx(b), b.y + 102);
  }

  // Wok and fryer: burners with flames, progress rings when cooking.
  for (const burner of ['wok', 'fryer']) {
    const r = LAYOUT[burner];
    const job = k[burner];
    const key = burner === 'wok' ? '3' : '4';
    stationShell(ctx, r, `${burner.toUpperCase()}  [${key}]`, burner === 'wok' ? 'Noodles & Egg' : 'Chicken', sel === burner, !!job);
    const stoveY = r.y + 150;
    ctx.fillStyle = PALETTE.wok;
    ctx.beginPath();
    ctx.ellipse(cx(r), r.y + 92, 62, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a2a32';
    ctx.beginPath();
    ctx.ellipse(cx(r), r.y + 88, 52, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    if (job) {
      drawFlame(ctx, cx(r) - 34, stoveY, now, 0.9);
      drawFlame(ctx, cx(r) + 34, stoveY, now + 200, 0.9);
      drawIngredient(ctx, job.ing, cx(r), r.y + 88, 56, job.done ? 'cooked' : 'raw');
      const color = job.burnt ? '#222' : job.done ? PALETTE.green : PALETTE.flameA;
      const label = job.burnt ? 'BURNT!' : job.done ? 'READY — click to take' : 'COOKING…';
      drawProgressBar(ctx, r.x + 20, r.y + 168, r.w - 40, job.progress, color, label);
    } else {
      drawFlame(ctx, cx(r), stoveY, now, 0.7);
      ctx.fillStyle = '#8a6a4d';
      ctx.font = '700 14px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('Empty burner', cx(r), r.y + 88);
    }
    // Steam wisps over a hot burner.
    if (job) {
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i += 1) {
        const sx = cx(r) - 30 + i * 30;
        const sy = r.y + 50 - ((now / 40 + i * 22) % 40);
        ctx.beginPath();
        ctx.moveTo(sx, sy + 12);
        ctx.quadraticCurveTo(sx + 8, sy, sx, sy - 10);
        ctx.stroke();
      }
    }
  }

  // Plating counter: the plate with its items.
  const pl = LAYOUT.plate;
  stationShell(ctx, pl, 'PLATE  [5]', 'Click with food in hand', sel === 'plate', k.plate.length > 0);
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.ellipse(cx(pl), pl.y + 88, 120, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9c2ae';
  ctx.lineWidth = 3;
  ctx.stroke();
  if (k.plate.length === 0) {
    ctx.fillStyle = '#8a6a4d';
    ctx.font = '700 15px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('Empty plate', cx(pl), pl.y + 88);
  } else {
    k.plate.forEach((item, i) => {
      drawIngredient(ctx, item.ing, cx(pl) - 70 + i * 46 + (k.plate.length === 1 ? 70 : 0), pl.y + 88, 52, item.state);
    });
    ctx.fillStyle = PALETTE.text;
    ctx.font = '700 13px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText(k.plate.map(preparedName).join(' + '), cx(pl), pl.y + 26);
  }

  // Serve window: a warm hatch with a bell.
  const sv = LAYOUT.serve;
  stationShell(ctx, sv, 'SERVE  [6]', 'Serve a finished dish', sel === 'serve', false);
  ctx.fillStyle = '#2b1a0e';
  rr(ctx, sv.x + 16, sv.y + 16, sv.w - 32, 96, 10);
  ctx.fill();
  ctx.fillStyle = '#ffd23c';
  ctx.beginPath();
  ctx.arc(cx(sv), sv.y + 52, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b4552d';
  ctx.fillRect(cx(sv) - 24, sv.y + 66, 48, 8);
  ctx.fillStyle = '#fff6e8';
  ctx.font = '700 15px ' + FONT;
  ctx.textAlign = 'center';
  ctx.fillText('SERVICE WINDOW', cx(sv), sv.y + 96);
  const ready = game.board && k.plate.length > 0;
  const readyLabel = ready ? 'Plate ready — ring the bell!' : 'Waiting for a finished plate…';
  ctx.font = '700 12px ' + FONT;
  const rw = ctx.measureText(readyLabel).width + 22;
  ctx.fillStyle = ready ? 'rgba(20,60,25,0.92)' : 'rgba(0,0,0,0.45)';
  rr(ctx, cx(sv) - rw / 2, sv.y + 106, rw, 22, 11);
  ctx.fill();
  if (ready) {
    ctx.strokeStyle = PALETTE.green;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.fillStyle = ready ? '#7be382' : '#e8cfa8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(readyLabel, cx(sv), sv.y + 118);

  // Trash bin.
  const t = LAYOUT.trash;
  stationShell(ctx, t, 'TRASH', 'Click to toss', false, false);
  ctx.fillStyle = '#5d6b7a';
  rr(ctx, t.x + 46, t.y + 24, t.w - 92, 96, 10);
  ctx.fill();
  ctx.fillStyle = '#46525f';
  rr(ctx, t.x + 38, t.y + 14, t.w - 76, 18, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '700 22px ' + FONT;
  ctx.textAlign = 'center';
  ctx.fillText('🗑', cx(t), t.y + 74);
}

// --- Hand, particles, message, overlays ------------------------------------

function drawHand(ctx, game, input) {
  const k = game.kitchen;
  if (!k.hand || !input) return;
  const x = input.mouseX;
  const y = input.mouseY - 34;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fill();
  drawIngredient(ctx, k.hand.ing, x, y, 44, k.hand.state);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 12px ' + FONT;
  ctx.textAlign = 'center';
  ctx.fillText(preparedName(k.hand), x, y + 44);
}

function drawEffects(ctx, game) {
  const k = game.kitchen;
  for (const p of k.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of k.floats) {
    ctx.globalAlpha = Math.min(1, f.life / f.max);
    ctx.fillStyle = f.color;
    ctx.font = `700 24px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 4;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  if (k.messageTimer > 0 && k.message) {
    ctx.fillStyle = 'rgba(43,26,14,0.9)';
    ctx.font = `700 18px ${FONT}`;
    const w = ctx.measureText(k.message).width + 36;
    rr(ctx, FIELD.width / 2 - w / 2, 700 - 34, w, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#ffd23c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(k.message, FIELD.width / 2, 700 - 18);
  }
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(30,16,8,0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = '#fff7e0';
  rr(ctx, 290, 110, 700, 500, 18);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ticketEdge;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, title, 640, 160, 40, accent || PALETTE.text, 'center', true);
  let y = 220;
  for (const line of lines) {
    text(ctx, line, 640, y, 18, PALETTE.text, 'center');
    y += 30;
  }
}

export function drawTitle(ctx, game) {
  drawBackground(ctx);
  // A dressed kitchen behind the title card: a sample ticket and a wok flame.
  drawOrderBoard(ctx, { board: { orders: [] } }, 0);
  const now = performance.now();
  drawFlame(ctx, 640, 560, now, 2.2);
  ctx.fillStyle = 'rgba(30,16,8,0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, 'DAPUR MBG', 640, 150, 84, '#ffd23c', 'center', true);
  text(ctx, 'Free Nutritious Meals Kitchen', 640, 205, 24, '#fff6e8', 'center');
  text(ctx, 'The lunch rush is on! Cook healthy meal boxes and serve them', 640, 260, 20, '#fff6e8', 'center');
  text(ctx, 'to hungry kids before their patience runs out.', 640, 288, 20, '#fff6e8', 'center');
  const steps = [
    '1  Click the PANTRY to grab Rice, Noodles, Chicken, Egg, Chili or Veggies.',
    '2  Chop Chili & Veggies on the CHOP BOARD — click to mash faster.',
    '3  Cook Noodles & Egg in the WOK, Chicken in the FRYER. Don’t let it burn!',
    '4  Build the dish on the PLATE, then serve it at the SERVE window.',
    '5  Serve on time to grow your COMBO. Lose 3 orders and the shift ends!',
  ];
  let y = 340;
  for (const s of steps) { text(ctx, s, 640, y, 17, '#fff6e8', 'center'); y += 28; }
  text(ctx, 'Mouse: click stations  •  Keys 1-6: pick station, Space: use  •  P: pause  •  M: mute', 640, 510, 16, '#ffd23c', 'center');
  const pulse = 1 + Math.sin(now / 250) * 0.04;
  ctx.save();
  ctx.translate(640, 570);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#d64533';
  rr(ctx, -170, -28, 340, 56, 28);
  ctx.fill();
  text(ctx, 'CLICK TO START COOKING', 0, 2, 20, '#fff', 'center', true);
  ctx.restore();
  if (game.best > 0) text(ctx, `Best score: ${game.best}`, 640, 640, 16, '#fff6e8', 'center');
}

export function drawEnd(ctx, game) {
  const over = game.screen === 'over';
  overlay(ctx, over ? 'SHIFT OVER!' : 'SHIFT COMPLETE!', [
    over ? 'Three orders were lost. The lunch line had to wait.' : `You survived the whole shift — Day ${game.day} done!`,
    '',
    `Score: ${game.score}    Coins: ${game.coins}    Served: ${game.served}`,
    `Best score: ${game.best}`,
    '',
    'Press R or click to play again',
  ], over ? PALETTE.red : PALETTE.green);
}

export function drawPaused(ctx) {
  overlay(ctx, 'PAUSED', ['', 'Take a breath, chef.', '', 'Press P or click to keep cooking'], PALETTE.text);
}

// --- Main entry ------------------------------------------------------------

export function drawGame(ctx, game, input, now) {
  ctx.save();
  if (game.kitchen && game.kitchen.shake > 0) {
    const s = game.kitchen.shake * 14;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  drawBackground(ctx);
  drawHeader(ctx, game, input ? input.muted : false);
  drawOrderBoard(ctx, game, now);
  drawStations(ctx, game, input, now);
  drawHand(ctx, game, input);
  drawEffects(ctx, game);
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255, 210, 60, ${game.flash * 0.25})`;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }
  ctx.restore();
  if (game.screen === 'title') drawTitle(ctx, game);
  else if (game.screen === 'paused') drawPaused(ctx);
  else if (game.screen === 'over' || game.screen === 'complete') drawEnd(ctx, game);
}
