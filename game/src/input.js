// Dapur MBG — mouse and keyboard input, translated into game intents.
// The game is fully playable with the mouse alone; keys 1-6 pick a station,
// Space uses the picked station, P pauses, M mutes. Clicks arrive as
// client coordinates and are raycast by kitchen3d, so the input module
// never needs to know where the 3D stations sit on screen.

export function createInput() {
  const input = {
    mouseX: null,
    mouseY: null,
    // Clicks waiting to be consumed, in order: [{ x, y }, ...].
    // A queue (not a single slot) so fast clicks never overwrite each other.
    clicks: [],
    // The station id picked by keys 1-6, or null.
    selected: null,
    // One-shot action flags, set by keydown and cleared by the game.
    useSelected: false,
    pausePressed: false,
    mutePressed: false,
    restartPressed: false,
    startPressed: false,
  };

  window.addEventListener('pointermove', (event) => {
    input.mouseX = event.clientX;
    input.mouseY = event.clientY;
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key >= '1' && key <= '6') {
      input.selected = ['pantry', 'board', 'wok', 'fryer', 'plate', 'serve'][Number(key) - 1];
    } else if (key === ' ' || key === 'enter') {
      input.useSelected = true;
      event.preventDefault();
    } else if (key === 'p' || key === 'escape') {
      input.pausePressed = true;
    } else if (key === 'm') {
      input.mutePressed = true;
    } else if (key === 'r') {
      input.restartPressed = true;
    }
  });

  return input;
}
