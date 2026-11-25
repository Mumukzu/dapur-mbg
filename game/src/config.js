// config.js — Dapur MBG menu data: 16 ingredients, 10 dishes, stations.
// Every dish is an original MBG (free nutritious meal) menu item.
export const SHIFT_SECONDS = 150;
export const MAX_LOST = 3;
export const MAX_TRAY = 3;

export const INGREDIENTS = {
  rice:    { name: 'Rice',    color: 0xf5f0dc, cold: false, chop: false, cook: true,  emoji: '🍚' },
  egg:     { name: 'Egg',     color: 0xfff3c4, cold: false, chop: false, cook: true,  emoji: '🥚' },
  chili:   { name: 'Chili',   color: 0xd7263d, cold: false, chop: true,  cook: false, emoji: '🌶️' },
  veggies: { name: 'Veggies', color: 0x3fa34d, cold: false, chop: true,  cook: false, emoji: '🥬' },
  noodle:  { name: 'Noodle',  color: 0xf2c14e, cold: false, chop: false, cook: true,  emoji: '🍜' },
  chicken: { name: 'Chicken', color: 0xf2b8a0, cold: false, chop: true,  cook: true,  emoji: '🍗' },
  fish:    { name: 'Fish',    color: 0x7fb3d5, cold: true,  chop: true,  cook: true,  emoji: '🐟' },
  tofu:    { name: 'Tofu',    color: 0xfbf7ef, cold: true,  chop: true,  cook: false, emoji: '⬜' },
  tempeh:  { name: 'Tempeh',  color: 0xc68a4b, cold: false, chop: true,  cook: true,  emoji: '🟫' },
  beef:    { name: 'Beef',    color: 0x8e3b2f, cold: false, chop: true,  cook: true,  emoji: '🥩' },
  potato:  { name: 'Potato',  color: 0xd9a441, cold: false, chop: true,  cook: true,  emoji: '🥔' },
  carrot:  { name: 'Carrot',  color: 0xe8722a, cold: false, chop: true,  cook: false, emoji: '🥕' },
  tomato:  { name: 'Tomato',  color: 0xe63946, cold: false, chop: true,  cook: false, emoji: '🍅' },
  onion:   { name: 'Onion',   color: 0xe8d8f0, cold: false, chop: true,  cook: false, emoji: '🧅' },
  milk:    { name: 'Milk',    color: 0xffffff, cold: true,  chop: false, cook: false, emoji: '🥛' },
  fruit:   { name: 'Fruit',   color: 0xff8c42, cold: true,  chop: true,  cook: false, emoji: '🍊' },
};

// Fridge holds the cold goods; the pantry holds everything dry.
export const FRIDGE_ITEMS = ['milk', 'fish', 'tofu', 'fruit'];
export const PANTRY_ITEMS = ['rice', 'egg', 'chili', 'veggies', 'noodle', 'chicken', 'tempeh', 'beef', 'potato', 'carrot', 'tomato', 'onion'];

// A dish is done when the tray holds exactly its recipe (any order).
// chopNeeded / cookNeeded say which station step the dish requires.
export const DISHES = [
  { id: 'sunshine-rice', name: 'Sunshine Rice Box', price: 12, recipe: ['rice', 'egg', 'chili'],   chop: ['chili'],        cook: ['rice', 'egg'],    icon: '☀️' },
  { id: 'chicken-noodle', name: 'Chicken Noodle Bowl', price: 15, recipe: ['noodle', 'chicken', 'veggies'], chop: ['chicken', 'veggies'], cook: ['noodle', 'chicken'], icon: '🍜' },
  { id: 'veggie-rice',  name: 'Veggie Rice Box',   price: 10, recipe: ['rice', 'veggies', 'carrot'], chop: ['veggies', 'carrot'], cook: ['rice'],      icon: '🥗' },
  { id: 'fried-fish',   name: 'Fried Fish Rice',   price: 14, recipe: ['rice', 'fish', 'onion'],   chop: ['fish', 'onion'],  cook: ['rice', 'fish'], icon: '🐟' },
  { id: 'tofu-tempeh',  name: 'Tofu Tempeh Plate', price: 11, recipe: ['tofu', 'tempeh', 'tomato'], chop: ['tofu', 'tempeh', 'tomato'], cook: ['tempeh'], icon: '🍛' },
  { id: 'beef-potato',  name: 'Beef Potato Bowl',  price: 16, recipe: ['beef', 'potato', 'onion'], chop: ['beef', 'potato', 'onion'], cook: ['beef', 'potato'], icon: '🥘' },
  { id: 'fruit-milk',   name: 'Fruit Milk Box',    price: 9,  recipe: ['fruit', 'milk', 'egg'],    chop: ['fruit'],          cook: ['egg'],       icon: '🥛' },
  { id: 'beef-tomato',  name: 'Beef Tomato Plate', price: 15, recipe: ['beef', 'tomato', 'rice'],  chop: ['beef', 'tomato'], cook: ['beef', 'rice'],  icon: '🍅' },
  { id: 'golden-omelette', name: 'Golden Omelette Rice', price: 13, recipe: ['rice', 'egg', 'onion'], chop: ['onion'], cook: ['rice', 'egg'], icon: '🍳' },
  { id: 'sunny-noodle', name: 'Sunny Veggie Noodle', price: 12, recipe: ['noodle', 'carrot', 'tofu'], chop: ['carrot', 'tofu'], cook: ['noodle'], icon: '🌞' },
];

export function findDish(tray) {
  const sorted = [...tray].sort();
  return DISHES.find((d) => {
    const r = [...d.recipe].sort();
    return r.length === sorted.length && r.every((v, i) => v === sorted[i]);
  }) || null;
}

export const STATIONS = [
  { id: 'fridge',  key: '1', label: 'FRIDGE',  hint: 'Cold goods: milk, fish, tofu, fruit' },
  { id: 'pantry',  key: '2', label: 'PANTRY',  hint: 'Dry goods: rice, noodle, spices & more' },
  { id: 'chop',    key: '3', label: 'CHOP',    hint: 'Chop what is on your tray' },
  { id: 'stove',   key: '4', label: 'STOVE',   hint: 'Cook what is on your tray' },
  { id: 'serve',   key: '5', label: 'SERVE',   hint: 'Serve the plated dish' },
  { id: 'trash',   key: '6', label: 'TRASH',   hint: 'Throw the tray away' },
];

export const LEVELS = [
  { day: 1, ordersAtOnce: 2, spawnEvery: 14, patience: 55 },
  { day: 2, ordersAtOnce: 3, spawnEvery: 12, patience: 50 },
  { day: 3, ordersAtOnce: 3, spawnEvery: 10, patience: 45 },
  { day: 4, ordersAtOnce: 4, spawnEvery: 9,  patience: 42 },
  { day: 5, ordersAtOnce: 4, spawnEvery: 8,  patience: 38 },
];
