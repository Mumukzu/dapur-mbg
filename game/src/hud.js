// Dapur MBG — the DOM heads-up display over the 3D kitchen.
// Order tickets, the shift timer, score and coins, the cook's hand,
// floating +coins popups and the title / pause / game-over screens are
// all plain DOM, so they stay crisp and readable in every screenshot.

import { INGREDIENTS, SHIFT_SECONDS } from './config.js';
import { orderRatio } from './orders.js';
import { isMuted } from './audio.js';

const $ = (id) => document.getElementById(id);

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function stateWord(state) {
  if (state === 'chopped') return 'chopped';
  if (state === 'cooked') return 'cooked';
  if (state === 'burnt') return 'burnt';
  return 'fresh';
}

export function createHud() {
  const ticketEls = new Map();
  const ordersRoot = $('orders');
  const floatsRoot = $('floats');

  function renderTickets(game) {
    const seen = new Set();
    for (const order of game.board.orders) {
      seen.add(order.id);
      let el = ticketEls.get(order.id);
      if (!el) {
        el = document.createElement('div');
        el.className = 'ticket';
        ordersRoot.appendChild(el);
        ticketEls.set(order.id, el);
      }
      const ratio = orderRatio(order);
      const cls = ratio < 0.3 ? 'red' : ratio < 0.55 ? 'amber' : '';
      const needs = order.recipe.needs.map((n) => {
        const info = INGREDIENTS[n.ing];
        return `<span class="chip"><span class="dot" style="background:${info.color};border:1px solid ${info.dark}"></span>${info.short} · ${stateWord(n.state)}</span>`;
      }).join('');
      el.className = `ticket${order.urgent ? ' urgent' : ''}`;
      el.innerHTML = `<h3>${order.recipe.name} · ${order.recipe.price} coins</h3>`
        + `<div class="needs">${needs}</div>`
        + `<div class="patience"><div class="${cls}" style="width:${Math.round(ratio * 100)}%"></div></div>`
        + `<div class="time">${Math.ceil(order.timeLeft)}s left</div>`;
    }
    for (const [id, el] of ticketEls) {
      if (!seen.has(id)) {
        el.remove();
        ticketEls.delete(id);
      }
    }
  }

  function renderFloats(game) {
    // Kitchen floats are stored in the old 1280x720 logical space;
    // map them to percentages so they land over the right station.
    if (!game.kitchen.floats.length) {
      if (floatsRoot.children.length) floatsRoot.innerHTML = '';
      return;
    }
    floatsRoot.innerHTML = game.kitchen.floats.map((f) => (
      `<div class="float-pop" style="left:${(f.x / 1280) * 100}%;top:${(f.y / 720) * 100}%;`
      + `opacity:${Math.max(0, f.life / f.max)};color:${f.color}">${f.text}</div>`
    )).join('');
  }

  function showScreen(name) {
    for (const id of ['screen-title', 'screen-pause', 'screen-over', 'screen-complete']) {
      $(id).classList.toggle('hidden', id !== `screen-${name}`);
    }
  }

  let lastScreen = '';
  function update(game) {
    $('score').textContent = game.score;
    $('coins').textContent = game.coins;
    $('combo').textContent = `x${game.combo.toFixed(2).replace(/0$/, '')}`;
    $('lost').textContent = `${game.lost}/3`;
    $('day-text').textContent = `Day ${game.day} · Level ${game.level} · Served ${game.served}`;
    $('shift-text').textContent = fmtTime(game.shiftLeft);
    const fill = $('shift-fill');
    const shiftRatio = Math.max(0, game.shiftLeft / SHIFT_SECONDS);
    fill.style.width = `${shiftRatio * 100}%`;
    fill.className = shiftRatio < 0.2 ? 'low' : shiftRatio < 0.45 ? 'mid' : '';

    const k = game.kitchen;
    const msg = $('msg');
    if (game.screen === 'playing' && k.messageTimer > 0 && k.message) {
      msg.textContent = k.message;
      msg.classList.remove('hidden');
    } else {
      msg.classList.add('hidden');
    }

    const hand = $('hand-chip');
    if (k.hand) {
      const info = INGREDIENTS[k.hand.ing];
      hand.innerHTML = `<span class="dot" style="background:${info.color};border:1px solid ${info.dark}"></span>`
        + `Carrying: ${info.name} (${stateWord(k.hand.state)}) — click PLATE to add it`;
    } else {
      hand.textContent = 'Hands empty — grab an ingredient from the pantry';
    }

    renderTickets(game);
    renderFloats(game);

    $('mute-btn').textContent = isMuted() ? '🔇' : '🔊';
    $('best-title').textContent = game.best;

    if (game.screen !== lastScreen) {
      lastScreen = game.screen;
      if (game.screen === 'title') showScreen('title');
      else if (game.screen === 'paused') showScreen('pause');
      else if (game.screen === 'over') {
        $('final-score').textContent = game.score;
        $('final-served').textContent = game.served;
        $('final-best').textContent = game.best;
        showScreen('over');
      } else if (game.screen === 'complete') {
        $('complete-score').textContent = game.score;
        $('complete-served').textContent = game.served;
        $('complete-best').textContent = game.best;
        showScreen('complete');
      } else showScreen('');
    }
  }

  return { update };
}
