// missions.js — daily missions: 3 goals per day, deterministic per day number
// (every player on day N sees the same 3), +20 bonus coins each.
// A mission never blocks play: progress updates silently on serve / lost /
// combo events, and the bonus lands with a toast in the hint bar.
export const MISSION_BONUS = 20;

const FAMILIES = [
  { id: 'fish',    label: 'Fish',    icon: '🐟', dishes: ['fried-fish'] },
  { id: 'chicken', label: 'Chicken', icon: '🍗', dishes: ['chicken-noodle'] },
  { id: 'beef',    label: 'Beef',    icon: '🥩', dishes: ['beef-potato', 'beef-tomato'] },
  { id: 'veggie',  label: 'Veggie',  icon: '🥗', dishes: ['veggie-rice', 'sunny-noodle'] },
  { id: 'egg',     label: 'Egg',     icon: '🍳', dishes: ['sunshine-rice', 'golden-omelette', 'fruit-milk'] },
];

function familyOf(dishId) {
  const f = FAMILIES.find((fam) => fam.dishes.includes(dishId));
  return f ? f.id : null;
}

// Pool of mission types. Each make() returns { icon, title, target } (+ family
// for the family type). Targets are tuned to one day of play: a day lasts
// exactly 4 serves, a dish pays ~10–16 coins, so every target must be
// reachable within 4 serves — the combo target is 3, never 5.
const POOL = [
  { type: 'serve-count', make: () => ({ icon: '🍽️', title: 'Serve 3 dishes', target: 3 }) },
  { type: 'serve-family', make: (day) => {
      const f = FAMILIES[(day * 7 + 3) % FAMILIES.length];
      return { icon: f.icon, title: `Serve 2 ${f.label} dishes`, target: 2, family: f.id };
    } },
  { type: 'combo', make: () => ({ icon: '🔥', title: 'Reach combo x1.3', target: 3 }) },
  { type: 'no-lost', make: () => ({ icon: '🛡️', title: 'Serve 3 in a row, no lost order', target: 3 }) },
  { type: 'earn-coins', make: () => ({ icon: '🪙', title: 'Earn 40 coins today', target: 40 }) },
];

// Seeded shuffle: the same day always picks the same 3 missions.
function pickForDay(day) {
  const pool = POOL.slice();
  let s = (day * 2654435761) >>> 0;
  for (let i = pool.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3).map((def) => ({ type: def.type, ...def.make(day), progress: 0, done: false }));
}

export function createMissionManager(onEvent) {
  let day = 1;
  let missions = [];
  let servedToday = 0;
  let coinsToday = 0;
  let streak = 0; // serves in a row since the last lost order
  let bestComboToday = 0;
  let familyServed = {};

  function start(dayNum) {
    day = dayNum;
    servedToday = 0; coinsToday = 0; streak = 0; bestComboToday = 0; familyServed = {};
    missions = pickForDay(dayNum);
    onEvent('missions', missions);
  }

  function progressOf(m) {
    switch (m.type) {
      case 'serve-count': return servedToday;
      case 'serve-family': return familyServed[m.family] || 0;
      case 'combo': return bestComboToday;
      case 'no-lost': return streak;
      case 'earn-coins': return coinsToday;
      default: return 0;
    }
  }

  function refresh() {
    for (const m of missions) {
      if (m.done) continue;
      m.progress = Math.min(progressOf(m), m.target);
      if (m.progress >= m.target) { m.done = true; onEvent('mission-complete', m); }
    }
    onEvent('missions', missions);
  }

  // Only serves that match an order count (a plate nobody ordered is +2 pity
  // points and must not advance missions).
  function onServe(dish, earned, combo) {
    servedToday += 1;
    coinsToday += earned;
    streak += 1;
    bestComboToday = Math.max(bestComboToday, combo);
    const fam = familyOf(dish.id);
    if (fam) familyServed[fam] = (familyServed[fam] || 0) + 1;
    refresh();
  }

  function onOrderLost() { streak = 0; refresh(); }

  // Staging hook for the ?shot=start cover: show the panel mid-progress
  // (one mission already done) without awarding any bonus.
  function stageShot() {
    if (missions[0]) { missions[0].progress = missions[0].target; missions[0].done = true; }
    if (missions[1]) missions[1].progress = Math.max(1, missions[1].target - 1);
    if (missions[2]) missions[2].progress = 1;
    onEvent('missions', missions);
  }

  function state() {
    return { day, missions, servedToday, coinsToday, streak, bestComboToday,
      doneCount: missions.filter((m) => m.done).length };
  }

  return { start, onServe, onOrderLost, stageShot, state };
}
