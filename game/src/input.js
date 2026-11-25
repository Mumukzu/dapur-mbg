// Dapur MBG — mouse and keyboard input, translated into game intents.
// The game is fully playable with the mouse alone; keys 1-6 pick a station,
// Space uses the picked station, P pauses, M mutes.

export function createInput(canvas) {
  const input = {
    mouseX: 0,
    mouseY: 0,
    // A click waiting to be consumed by the update step: { x, y } or null.
    click: null,
    // The station id picked by keys 1-6, or null.
    selected: null,
    // One-shot action flags, set by keydown and cleared by the game.
    useSelected: false,
    pausePressed: false,
    mutePressed: false,
    restartPressed: false,
    startPressed: false,
  };

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
  }

  canvas.addEventListener('pointermove', (event) => {
    const p = toLogical(event);
    input.mouseX = p.x;
    input.mouseY = p.y;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const p = toLogical(event);
    input.mouseX = p.x;
    input.mouseY = p.y;
    input.click = { x: p.x, y: p.y };
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
    } else if (key === 'enter' && event.shiftKey) {
      input.startPressed = true;
    }
  });

  return input;
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
