// Keyboard and mouse, folded into the few questions the game asks:
// which way is the thief moving, where is the mouse aiming, and which
// one-shot actions (throw, cloak, pause, restart, confirm) just fired.

export const ACTION = {
  confirm: 1,
  pause: 2,
  restart: 4,
  throwNoise: 8,
  cloak: 16,
};

export function createInput(canvas) {
  const keys = new Set();
  const mouse = { x: 480, y: 320, down: false };
  let pending = 0;

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      event.preventDefault();
    }
    keys.add(key);
    if (key === ' ' || key === 'enter') pending |= ACTION.confirm;
    if (key === 'p' || key === 'escape') pending |= ACTION.pause;
    if (key === 'r') pending |= ACTION.restart;
    if (key === 'q') pending |= ACTION.throwNoise;
    if (key === 'e') pending |= ACTION.cloak;
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.key.toLowerCase());
  });
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', (event) => {
    const p = canvasPoint(event);
    mouse.x = p.x;
    mouse.y = p.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = canvasPoint(event);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.down = true;
    if (event.button === 2) pending |= ACTION.throwNoise;
    else pending |= ACTION.confirm;
  });
  canvas.addEventListener('mouseup', () => {
    mouse.down = false;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    mouse,
    /** Movement vector from held keys, normalised on diagonals. */
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      if (x !== 0 && y !== 0) {
        const inv = 1 / Math.SQRT2;
        x *= inv;
        y *= inv;
      }
      return { x, y };
    },
    creeping() {
      return keys.has('shift');
    },
    /** One-shot actions since the last call; reading clears them. */
    takeActions() {
      const taken = pending;
      pending = 0;
      return taken;
    },
  };
}
