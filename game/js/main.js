// Boot and the one loop for The Ember Reliquary. Input is read every
// frame, the world advances in fixed 1/60 s steps, and the renderer
// paints the result. Screens: title, play, paused, caught, escaped.
//
// ?shot=cover|loot|alarm|getaway stages a screenshot scene instead of
// running the loop, paints it twice and sets window.__shotReady.

import { ACTION, createInput } from './input.js';
import {
  createCameras,
  createGuards,
  distractNearestGuard,
  guardCaughtThief,
  updateAlarm,
  updateCameras,
  updateGuards,
} from './guards.js';
import {
  atExit,
  canGrabGem,
  createThief,
  finalScore,
  throwNoisemaker,
  updateThief,
  useCloak,
} from './player.js';
import { SCREEN, createRenderer } from './render.js';
import { stageShot } from './shots.js';

const STEP = 1 / 60;
const MAX_FRAME = 0.25; // longer stalls (hidden tab) are dropped, not replayed

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);

function freshState() {
  return {
    thief: createThief(),
    guards: createGuards(),
    cameras: createCameras(),
    alarm: 0,
    peakAlarm: 0,
    calmSeconds: 0,
    elapsed: 0,
    caughtReason: null,
    score: null,
  };
}

const game = {
  state: freshState(),
  stepSeconds: STEP,
  reset() {
    game.state = freshState();
  },
  finishEscape() {
    const s = game.state;
    s.score = finalScore(s.thief, s.elapsed, s.peakAlarm);
  },
  /**
   * One fixed step of the real rules. `actions` is an ACTION bitmask;
   * `mouse` aims tool throws. `quiet` suppresses win/lose transitions
   * (used while staging screenshots). Returns an event string or null.
   */
  step(move, creep, actions, quiet = false, mouse = { x: 0, y: 0 }) {
    const s = game.state;
    s.elapsed += STEP;
    updateThief(s.thief, move, creep, STEP);
    if (actions & ACTION.throwNoise) {
      const landing = throwNoisemaker(s.thief, mouse.x, mouse.y);
      if (landing) distractNearestGuard(s.guards, landing.x, landing.y);
    }
    if (actions & ACTION.cloak) useCloak(s.thief);
    updateGuards(s.guards, s.thief, STEP);
    updateCameras(s.cameras, s.thief, STEP);
    updateAlarm(s, s.guards, s.cameras, STEP);
    if (canGrabGem(s.thief)) {
      s.thief.hasGem = true;
      if (!quiet) return 'gem';
    }
    if (!quiet) {
      if (s.alarm >= 100) {
        s.caughtReason = 'alarm';
        return 'caught';
      }
      if (guardCaughtThief(s.guards, s.thief)) {
        s.caughtReason = 'guard';
        return 'caught';
      }
      if (s.thief.hasGem && atExit(s.thief)) {
        game.finishEscape();
        return 'escaped';
      }
    }
    return null;
  },
};

function announce(message) {
  if (status) status.textContent = message;
}

function runShot(name) {
  const screen = stageShot(name, game);
  let painted = 0;
  function paint() {
    renderer.draw(game.state, screen);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN.title;
  let accumulator = 0;
  let last = performance.now();

  function startNight() {
    game.reset();
    accumulator = 0;
    screen = SCREEN.play;
    announce('The night begins. Steal the Ember Heart and escape through the service door.');
  }

  function handleActions() {
    const actions = input.takeActions();
    if (screen === SCREEN.title && (actions & ACTION.confirm)) {
      startNight();
      return 0;
    }
    if ((screen === SCREEN.caught || screen === SCREEN.escaped)
      && (actions & (ACTION.confirm | ACTION.restart))) {
      startNight();
      return 0;
    }
    if (screen === SCREEN.play && (actions & ACTION.pause)) {
      screen = SCREEN.paused;
      announce('Paused.');
      return 0;
    }
    if (screen === SCREEN.paused && (actions & (ACTION.pause | ACTION.confirm))) {
      screen = SCREEN.play;
      announce('Sneaking again.');
      return 0;
    }
    if (screen === SCREEN.play && (actions & ACTION.restart)) {
      startNight();
      return 0;
    }
    return screen === SCREEN.play ? actions : 0;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = handleActions();
    if (screen === SCREEN.title) {
      // A living backdrop behind the title: patrols walk, nobody hunts.
      const s = game.state;
      updateGuards(s.guards, s.thief, STEP);
      updateCameras(s.cameras, s.thief, STEP);
      accumulator = 0;
    } else if (screen === SCREEN.play) {
      let first = true;
      while (accumulator >= STEP && screen === SCREEN.play) {
        const event = game.step(
          input.moveVector(),
          input.creeping(),
          first ? actions : 0,
          false,
          input.mouse,
        );
        first = false;
        accumulator -= STEP;
        if (event === 'gem') announce('You have the Ember Heart. Get to the service door!');
        else if (event === 'caught') {
          screen = SCREEN.caught;
          announce('Caught! Press Space to try again.');
        } else if (event === 'escaped') {
          screen = SCREEN.escaped;
          announce(`Clean getaway! Final score ${game.state.score.total}.`);
        }
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(game.state, screen);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN.play) {
      screen = SCREEN.paused;
      announce('Paused.');
    }
  });

  announce('The Ember Reliquary. Press Space or click to begin.');
  requestAnimationFrame(frame);
}

if (shotName) runShot(shotName);
else runGame();
