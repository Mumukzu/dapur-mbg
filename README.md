# Dapur MBG — Free Nutritious Meal Kitchen

A real-time 3D cooking game for the make.fun "Make the best cooking game" bounty.
Chef Sari runs a bright MBG (free nutritious meal) kitchen: take orders, grab
ingredients from the fridge and pantry, chop and cook them, and serve before
patience runs out.

## Play

Serve it locally and open it in desktop Chrome:

```sh
node serve.ts
# → http://localhost:8080
```

Or open `game/index.html` from any static server. The game needs no network:
Three.js r187 is vendored under `game/vendor/`, all sounds are synthesized
with WebAudio, and all art is procedural low-poly geometry.

## How to play

- **Click a station** (or press **1–6**) to send Chef Sari there.
- **Fridge (1)** — cold goods: milk, fish, tofu, fruit. **Pantry (2)** — dry goods.
- **Chop (3)** then **Cook (4)** what is on your tray (**Space** works at a station).
- **Serve (5)** the plated dish at the serve window. **Trash (6)** clears the tray.
- Serve fast in a row to build your combo up to **x2.0**.
- **P** pause, **M** mute, **Enter** start / restart.
- A shift lasts 150 seconds. Lose 3 orders and the shift is over. Every 4
  serves starts a new day with more orders and less patience.

## Menu

10 dishes from 16 ingredients: Sunshine Rice Box, Chicken Noodle Bowl,
Veggie Rice Box, Fried Fish Rice, Tofu Tempeh Plate, Beef Potato Bowl,
Fruit Milk Box, Beef Tomato Plate, Golden Omelette Rice, Sunny Veggie Noodle.

## Layout

- `main.ts` — the make.fun entry program (copies `game/` + `screenshots/`,
  writes `dossier.json`)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `game/index.html` — page + HUD
- `game/src/config.js` — menu data (dishes, ingredients, stations, levels)
- `game/src/kitchen.js` — the 3D kitchen (fridge, pantry, stove, island…)
- `game/src/chef.js` — Chef Sari and her animations
- `game/src/orders.js` — orders, patience, combo, days, shift timer
- `game/src/audio.js` — synthesized WebAudio sound effects
- `game/src/game.js` — main loop, input, tray flow, screenshot presets
- `game/vendor/three.module.min.js` — Three.js r187 (vendored, minified)

## Screenshots

`?shot=start|play|serve|rush` stages a scene for screenshots:
title + kitchen, dish mid-assembly, plate ready to serve, service rush.

## License

MIT — see `LICENSE`.
