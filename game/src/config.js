// Dapur MBG — every tuning number, recipe and colour in one place.
// The kitchen is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

export const STEP = 1 / 60;

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

// Warm street-kitchen palette: terracotta walls, cream tiles, wood counters.
export const PALETTE = {
  wallTop: '#b4552d',
  wallBottom: '#8f3d1f',
  floorA: '#e8cfa8',
  floorB: '#dfc193',
  counterTop: '#a4713e',
  counterFront: '#7d5230',
  counterEdge: '#5d3a1e',
  steel: '#c9ced6',
  steelDark: '#9aa1ad',
  board: '#e9d8a6',
  ticket: '#fff7e0',
  ticketEdge: '#d9c27a',
  text: '#2b1a0e',
  textLight: '#fff6e8',
  muted: '#8a6a4d',
  green: '#3f9d4e',
  amber: '#e8a13a',
  red: '#d64533',
  gold: '#f2c94c',
  flameA: '#ff9a3c',
  flameB: '#ffd23c',
  flameC: '#ff5a2a',
  panel: '#3a2415',
  panelEdge: '#5d3a1e',
  wok: '#3c3c46',
  plate: '#fdfdf8',
  chili: '#d93a2b',
  egg: '#f6d860',
  rice: '#fffaf0',
  noodle: '#f0b429',
  chicken: '#e8a87c',
  veg: '#4caf50',
};

export const INGREDIENTS = {
  rice:    { id: 'rice',    name: 'Rice',     short: 'Rice',  color: '#fffaf0', dark: '#cbb98f', shape: 'bowl',  prep: 'raw' },
  noodle:  { id: 'noodle',  name: 'Noodles',  short: 'Noodle',   color: '#f0b429', dark: '#b97f14', shape: 'nest',  prep: 'cook', cookAt: 'wok' },
  chicken: { id: 'chicken', name: 'Chicken',  short: 'Chicken',  color: '#e8a87c', dark: '#a96a3c', shape: 'drum',  prep: 'cook', cookAt: 'fryer' },
  egg:     { id: 'egg',     name: 'Egg',      short: 'Egg', color: '#f6d860', dark: '#c9a227', shape: 'egg',   prep: 'cook', cookAt: 'wok' },
  chili:   { id: 'chili',   name: 'Chili',    short: 'Chili', color: '#d93a2b', dark: '#8f1f14', shape: 'chili', prep: 'chop' },
  veg:     { id: 'veg',     name: 'Veggies',  short: 'Veggie', color: '#4caf50', dark: '#2e7d32', shape: 'leaf',  prep: 'chop' },
  // Fridge (cold) goods — fetched from the fridge, not the pantry.
  fish:    { id: 'fish',    name: 'Fish',     short: 'Fish',  color: '#9fc4d8', dark: '#5b8296', shape: 'fish',  prep: 'cook', cookAt: 'fryer', cold: true },
  tofu:    { id: 'tofu',    name: 'Tofu',     short: 'Tofu',  color: '#fdf6e0', dark: '#d9cfa8', shape: 'cube',  prep: 'cook', cookAt: 'wok', cold: true },
  milk:    { id: 'milk',    name: 'Milk',     short: 'Milk',  color: '#ffffff', dark: '#bcd6e8', shape: 'carton', prep: 'raw', cold: true },
  fruit:   { id: 'fruit',   name: 'Fruit',    short: 'Fruit', color: '#f2c94c', dark: '#c98f1d', shape: 'banana', prep: 'raw', cold: true },
  // Pantry (dry) goods.
  tempeh:  { id: 'tempeh',  name: 'Tempeh',   short: 'Tempeh', color: '#d9b380', dark: '#a87c4e', shape: 'block', prep: 'cook', cookAt: 'fryer' },
  beef:    { id: 'beef',    name: 'Beef',     short: 'Beef',  color: '#b03a30', dark: '#7c241d', shape: 'steak', prep: 'cook', cookAt: 'wok' },
  potato:  { id: 'potato',  name: 'Potato',   short: 'Potato', color: '#d9a85f', dark: '#a87c3a', shape: 'tuber', prep: 'chop' },
  carrot:  { id: 'carrot',  name: 'Carrot',   short: 'Carrot', color: '#e86a1c', dark: '#b34a10', shape: 'cone',  prep: 'chop' },
  tomato:  { id: 'tomato',  name: 'Tomato',   short: 'Tomato', color: '#e8442e', dark: '#a82a1a', shape: 'round', prep: 'chop' },
  onion:   { id: 'onion',   name: 'Onion',    short: 'Onion', color: '#e8d8f0', dark: '#b08ac0', shape: 'bulb',  prep: 'chop' },
};

// One recipe line: ingredient id + the state it must be in when plated.
// States: raw (straight from the pantry), chopped, cooked.
export const RECIPES = [
  {
    id: 'sunshine-rice-box', name: 'Sunshine Rice Box', short: 'Rice Box',
    price: 18, patience: 48,
    needs: [
      { ing: 'rice', state: 'raw' },
      { ing: 'egg', state: 'cooked' },
      { ing: 'chili', state: 'chopped' },
    ],
  },
  {
    id: 'chicken-noodle-bowl', name: 'Chicken Noodle Bowl', short: 'Noodle Bowl',
    price: 22, patience: 52,
    needs: [
      { ing: 'noodle', state: 'cooked' },
      { ing: 'chicken', state: 'cooked' },
      { ing: 'veg', state: 'chopped' },
    ],
  },
  {
    id: 'spicy-chicken-plate', name: 'Spicy Chicken Plate', short: 'Chicken Plate',
    price: 24, patience: 55,
    needs: [
      { ing: 'chicken', state: 'cooked' },
      { ing: 'chili', state: 'chopped' },
      { ing: 'egg', state: 'cooked' },
    ],
  },
  {
    id: 'garden-omelette', name: 'Garden Omelette', short: 'Omelette',
    price: 14, patience: 40,
    needs: [
      { ing: 'egg', state: 'cooked' },
      { ing: 'veg', state: 'chopped' },
    ],
  },
  {
    id: 'veggie-rice-box', name: 'Veggie Rice Box', short: 'Veggie Box',
    price: 15, patience: 42,
    needs: [
      { ing: 'veg', state: 'chopped' },
      { ing: 'chili', state: 'chopped' },
      { ing: 'rice', state: 'raw' },
    ],
  },
  {
    id: 'fried-fish-rice', name: 'Fried Fish Rice', short: 'Fish Rice',
    price: 20, patience: 50,
    needs: [
      { ing: 'rice', state: 'raw' },
      { ing: 'fish', state: 'cooked' },
      { ing: 'tomato', state: 'chopped' },
    ],
  },
  {
    id: 'tofu-tempeh-plate', name: 'Tofu Tempeh Plate', short: 'Tofu Plate',
    price: 19, patience: 50,
    needs: [
      { ing: 'tofu', state: 'cooked' },
      { ing: 'tempeh', state: 'cooked' },
      { ing: 'veg', state: 'chopped' },
    ],
  },
  {
    id: 'beef-potato-bowl', name: 'Beef Potato Bowl', short: 'Beef Bowl',
    price: 26, patience: 55,
    needs: [
      { ing: 'beef', state: 'cooked' },
      { ing: 'potato', state: 'chopped' },
      { ing: 'carrot', state: 'chopped' },
    ],
  },
  {
    id: 'fruit-milk-box', name: 'Fruit Milk Box', short: 'Fruit Box',
    price: 16, patience: 42,
    needs: [
      { ing: 'fruit', state: 'raw' },
      { ing: 'milk', state: 'raw' },
      { ing: 'rice', state: 'raw' },
    ],
  },
  {
    id: 'beef-tomato-plate', name: 'Beef Tomato Plate', short: 'Beef Plate',
    price: 24, patience: 52,
    needs: [
      { ing: 'beef', state: 'cooked' },
      { ing: 'onion', state: 'chopped' },
      { ing: 'tomato', state: 'chopped' },
    ],
  },
];

// Stations, in keyboard order 1-7. Rects are in logical 1280x720 pixels.
export const STATIONS = [
  { id: 'pantry', key: '1', label: 'PANTRY', hint: 'Grab dry ingredients' },
  { id: 'fridge', key: '7', label: 'FRIDGE', hint: 'Grab cold ingredients' },
  { id: 'board', key: '2', label: 'CHOP BOARD', hint: 'Chop ingredients' },
  { id: 'wok', key: '3', label: 'WOK', hint: 'Cook in the wok' },
  { id: 'fryer', key: '4', label: 'FRYER', hint: 'Fry the chicken' },
  { id: 'plate', key: '5', label: 'PLATE', hint: 'Build the dish' },
  { id: 'serve', key: '6', label: 'SERVE', hint: 'Serve the order' },
];

export const LAYOUT = {
  headerH: 64,
  boardY: 76,
  boardH: 118,
  pantry: { x: 24, y: 216, w: 300, h: 250 },
  board: { x: 360, y: 216, w: 220, h: 250 },
  wok: { x: 616, y: 216, w: 220, h: 250 },
  fryer: { x: 872, y: 216, w: 180, h: 250 },
  plate: { x: 360, y: 500, w: 340, h: 170 },
  serve: { x: 736, y: 500, w: 316, h: 170 },
  fridge: { x: 1020, y: 216, w: 220, h: 250 },
  trash: { x: 1088, y: 500, w: 168, h: 170 },
};

export const CHOP_SECONDS = 2.4;
export const COOK_SECONDS = 4.0;
export const BURN_SECONDS = 3.5;
export const MAX_ORDERS = 4;
export const MAX_LOST = 3;
export const SHIFT_SECONDS = 150;

export const LEVEL = {
  // Seconds between new orders at level 1, shrinking per level.
  spawnEvery: 14,
  spawnScale: 0.88,
  minSpawn: 6,
  // Patience shrinks a little each level.
  patienceScale: 0.96,
};

export const COMBO = { step: 0.25, cap: 2.0 };

export const BEST_KEY = 'dapur-mbg.best';
