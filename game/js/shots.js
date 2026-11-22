// Screenshot scenes behind ?shot=cover|loot|alarm|getaway. Each scene
// builds a real game state — thief, guards, cameras, alarm — places
// everyone at a telling moment, then lets the genuine rules run for a
// short stretch so the frame is what play actually looks like. The
// cover scene is the whole heist in one frame: thief mid-gallery,
// cones sweeping, cameras watching, the Ember Heart glowing in the
// vault and the alarm meter up top.

import { SCREEN } from './render.js';

function place(guard, x, y, angle) {
  guard.x = x;
  guard.y = y;
  guard.angle = angle;
  guard.mode = 'patrol';
  guard.pause = 0.6;
}

function settle(game, seconds) {
  const steps = Math.round(seconds / game.stepSeconds);
  for (let i = 0; i < steps; i++) {
    game.step({ x: 0, y: 0 }, false, 0, true);
  }
}

export function stageShot(name, game) {
  game.reset();
  const s = game.state;
  const [gallery, vault, corridor] = s.guards;

  if (name === 'loot') {
    // Close enough to taste it: thief at the vault plinth, the vault
    // guard pacing below the doorway, alarm already warm.
    s.thief.x = 795;
    s.thief.y = 118;
    s.thief.angle = Math.atan2(100 - 118, 845 - 795);
    place(gallery, 330, 200, Math.PI / 2);
    place(vault, 765, 262, Math.PI);
    place(corridor, 95, 380, -Math.PI / 2);
    s.cameras[0].phase = 1.3;
    s.alarm = 31;
    s.peakAlarm = 31;
    s.elapsed = 74;
    settle(game, 0.4);
    return SCREEN.play;
  }

  if (name === 'alarm') {
    // Caught in the open: thief frozen in the east-floor camera cone
    // with a guard closing in and the meter deep in the red.
    s.thief.x = 855;
    s.thief.y = 425;
    s.thief.angle = Math.PI;
    place(gallery, 400, 330, Math.PI);
    place(vault, 800, 380, Math.atan2(425 - 380, 855 - 800));
    vault.mode = 'chase';
    vault.modeTimer = 1.6;
    place(corridor, 95, 120, Math.PI / 2);
    s.cameras[1].phase = 0.2;
    s.alarm = 79;
    s.peakAlarm = 79;
    s.elapsed = 112;
    settle(game, 0.25);
    return SCREEN.play;
  }

  if (name === 'getaway') {
    // Out the service door with the gem: the score panel over the
    // museum the thief just emptied.
    s.thief.x = 42;
    s.thief.y = 568;
    s.thief.hasGem = true;
    s.thief.noisemakers = 2;
    s.thief.toolCost = 60;
    place(gallery, 300, 150, Math.PI / 3);
    place(vault, 850, 320, Math.PI);
    place(corridor, 95, 300, Math.PI / 2);
    s.alarm = 12;
    s.peakAlarm = 22;
    s.elapsed = 96;
    game.finishEscape();
    settle(game, 0.2);
    return SCREEN.escaped;
  }

  // cover (and the default): the full scene in one frame.
  s.thief.x = 322;
  s.thief.y = 305;
  s.thief.angle = Math.atan2(100 - 305, 845 - 322);
  place(gallery, 408, 198, 2.25); // cone sweeping down toward the thief's cover
  place(vault, 845, 300, Math.PI * 1.15);
  place(corridor, 98, 290, Math.PI / 2);
  s.cameras[0].phase = 0.8;
  s.cameras[1].phase = 2.1;
  s.cameras[2].phase = 1.0;
  s.alarm = 18;
  s.peakAlarm = 18;
  s.elapsed = 38;
  settle(game, 0.4);
  return SCREEN.play;
}
