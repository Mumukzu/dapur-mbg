// Dapur MBG — the frame driver: one place where the game state becomes
// pixels. Each animation frame it advances the 3D kitchen (flames, steam,
// the knife, the bobbing hand item), syncs the props to the kitchen state,
// refreshes the raycast hover and the floating station labels, updates the
// DOM HUD, and renders the scene.

export function createFrameDriver(world, picker, hud) {
  return function drawFrame(game, input, timeSeconds) {
    world.update(0, timeSeconds, game);
    picker.updateHover(input.mouseX, input.mouseY, game);
    picker.updateLabels(game);
    hud.update(game);
    world.renderer.render(world.scene, world.camera);
  };
}
