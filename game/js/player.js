// The thief: movement, the two tools (a thrown noisemaker and the
// shroud cloak), grabbing the Ember Heart, and the score the night is
// worth. Tools are useful but never free: each use shaves points off
// the final haul, so a clean ghost run still pays best.

import { EXIT, GEM, SPAWN, moveCircle } from './level.js';

export const THIEF = {
  radius: 11,
  speed: 168,
  creepSpeed: 86,
  grabDistance: 27,
};

export const TOOLS = {
  noisemaker: { charges: 3, cost: 60, throwRange: 270 },
  cloak: { seconds: 3.2, cooldown: 14, cost: 90 },
};

export const SCORE = {
  gemValue: GEM.value,
  ghostBonus: 400, // alarm never rose past 25
  timeBonusStart: 600,
  timeBonusPerSecond: 4,
};

export function createThief() {
  return {
    x: SPAWN.x,
    y: SPAWN.y,
    angle: -Math.PI / 2,
    moving: false,
    creeping: false,
    cloaked: false,
    cloakLeft: 0,
    cloakCooldown: 0,
    noisemakers: TOOLS.noisemaker.charges,
    hasGem: false,
    toolCost: 0,
    noisePings: [], // {x, y, age} rings where a noisemaker landed
  };
}

/**
 * Advance the thief one step. `move` is {x, y} in -1..1 (already
 * normalised by the caller when diagonal), `creep` slows to a prowl.
 */
export function updateThief(thief, move, creep, dt) {
  const speed = creep ? THIEF.creepSpeed : THIEF.speed;
  thief.creeping = creep && (move.x !== 0 || move.y !== 0);
  thief.moving = move.x !== 0 || move.y !== 0;
  if (thief.moving) {
    thief.angle = Math.atan2(move.y, move.x);
    moveCircle(thief, move.x * speed * dt, move.y * speed * dt, THIEF.radius);
  }
  if (thief.cloakLeft > 0) {
    thief.cloakLeft -= dt;
    thief.cloaked = thief.cloakLeft > 0;
  }
  if (thief.cloakCooldown > 0) thief.cloakCooldown -= dt;
  for (const ping of thief.noisePings) ping.age += dt;
  thief.noisePings = thief.noisePings.filter((p) => p.age < 1.6);
}

/** Throw a noisemaker toward (tx, ty), clamped to throw range. */
export function throwNoisemaker(thief, tx, ty) {
  if (thief.noisemakers <= 0) return null;
  const dx = tx - thief.x;
  const dy = ty - thief.y;
  const dist = Math.hypot(dx, dy);
  const reach = Math.min(dist, TOOLS.noisemaker.throwRange);
  const landing = dist < 1
    ? { x: thief.x, y: thief.y }
    : { x: thief.x + (dx / dist) * reach, y: thief.y + (dy / dist) * reach };
  thief.noisemakers -= 1;
  thief.toolCost += TOOLS.noisemaker.cost;
  thief.noisePings.push({ x: landing.x, y: landing.y, age: 0 });
  return landing;
}

/** Pull the shroud cloak on, if it has recharged. */
export function useCloak(thief) {
  if (thief.cloakCooldown > 0 || thief.cloaked) return false;
  thief.cloaked = true;
  thief.cloakLeft = TOOLS.cloak.seconds;
  thief.cloakCooldown = TOOLS.cloak.cooldown;
  thief.toolCost += TOOLS.cloak.cost;
  return true;
}

/** True when the thief is close enough to lift the Ember Heart. */
export function canGrabGem(thief) {
  return !thief.hasGem
    && Math.hypot(thief.x - GEM.x, thief.y - GEM.y) < THIEF.grabDistance;
}

/** True when the thief stands in the service-door exit zone. */
export function atExit(thief) {
  return thief.x > EXIT.x && thief.x < EXIT.x + EXIT.w
    && thief.y > EXIT.y && thief.y < EXIT.y + EXIT.h;
}

/** The night's final score once the thief is out with the gem. */
export function finalScore(thief, elapsedSeconds, peakAlarm) {
  const timeBonus = Math.max(
    0,
    SCORE.timeBonusStart - Math.floor(elapsedSeconds) * SCORE.timeBonusPerSecond,
  );
  const ghost = peakAlarm <= 25 ? SCORE.ghostBonus : 0;
  return {
    gem: SCORE.gemValue,
    timeBonus,
    ghostBonus: ghost,
    toolCost: thief.toolCost,
    total: SCORE.gemValue + timeBonus + ghost - thief.toolCost,
  };
}
