// The watchers: patrolling guards and sweeping ceiling cameras, their
// vision cones, and the alarm meter those cones feed. A watcher only
// raises the alarm when the thief is inside its cone AND in clear line
// of sight, so cover and timing both matter.

import { CAMERA_POSTS, GUARD_ROUTES, angleGap, hasLineOfSight, moveCircle } from './level.js';

export const GUARD = {
  radius: 12,
  speed: 72,
  chaseSpeed: 96,
  viewRange: 152,
  viewHalfAngle: 0.44,
  pauseSeconds: 1.1,
  catchDistance: 24,
};

export const CAMERA = {
  viewRange: 176,
  viewHalfAngle: 0.37,
};

export const ALARM = {
  guardRate: 58, // alarm points per second while a guard sees you
  cameraRate: 42, // alarm points per second while a camera sees you
  decayRate: 9, // points per second once nobody has seen you for a while
  decayDelay: 1.2, // seconds of calm before the meter starts to fall
  max: 100,
};

export function createGuards() {
  return GUARD_ROUTES.map((route, i) => ({
    x: route[0].x,
    y: route[0].y,
    angle: 0,
    route,
    waypoint: 1 % route.length,
    pause: 0,
    mode: 'patrol', // patrol | investigate | chase
    targetX: route[0].x,
    targetY: route[0].y,
    modeTimer: 0,
    seesThief: false,
    id: i,
  }));
}

export function createCameras() {
  return CAMERA_POSTS.map((post) => ({
    x: post.x,
    y: post.y,
    base: post.base,
    sweep: post.sweep,
    period: post.period,
    phase: 0,
    angle: post.base,
    seesThief: false,
  }));
}

/** True when point (px, py) sits inside a cone from (x, y) facing `angle`. */
export function insideCone(x, y, angle, range, halfAngle, px, py) {
  const dx = px - x;
  const dy = py - y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 1) return true;
  const toPoint = Math.atan2(dy, dx);
  return Math.abs(angleGap(toPoint, angle)) <= halfAngle;
}

/** True when a watcher at (x, y) can actually see the thief right now. */
export function watcherSees(x, y, angle, range, halfAngle, thief) {
  if (thief.cloaked) return false;
  if (!insideCone(x, y, angle, range, halfAngle, thief.x, thief.y)) return false;
  return hasLineOfSight(x, y, thief.x, thief.y);
}

/** Turn `guard.angle` toward `want` at a limited rate, so cones sweep. */
function turnToward(guard, want, dt, rate = 2.6) {
  const gap = angleGap(want, guard.angle);
  const step = Math.max(-rate * dt, Math.min(rate * dt, gap));
  guard.angle += step;
}

/** Walk a guard toward (tx, ty); returns true once it has arrived. */
function walkToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return true;
  turnToward(guard, Math.atan2(dy, dx), dt);
  const step = Math.min(dist, speed * dt);
  moveCircle(guard, (dx / dist) * step, (dy / dist) * step, GUARD.radius);
  return false;
}

export function updateGuards(guards, thief, dt) {
  for (const guard of guards) {
    guard.seesThief = watcherSees(
      guard.x, guard.y, guard.angle, GUARD.viewRange, GUARD.viewHalfAngle, thief,
    );
    if (guard.mode === 'chase') {
      guard.modeTimer -= dt;
      if (guard.seesThief) guard.modeTimer = 1.6;
      walkToward(guard, thief.x, thief.y, GUARD.chaseSpeed, dt);
      if (guard.modeTimer <= 0) guard.mode = 'patrol';
    } else if (guard.mode === 'investigate') {
      guard.modeTimer -= dt;
      const arrived = walkToward(guard, guard.targetX, guard.targetY, GUARD.speed, dt);
      if (arrived) {
        // Look around the noise: sweep the cone side to side.
        guard.angle += Math.sin(guard.modeTimer * 3.1) * dt * 1.4;
      }
      if (guard.modeTimer <= 0) guard.mode = 'patrol';
    } else if (guard.pause > 0) {
      guard.pause -= dt;
    } else {
      const wp = guard.route[guard.waypoint];
      if (walkToward(guard, wp.x, wp.y, GUARD.speed, dt)) {
        guard.waypoint = (guard.waypoint + 1) % guard.route.length;
        guard.pause = GUARD.pauseSeconds;
      }
    }
    // A guard who has you in sight long enough to matter gives chase
    // once the alarm is hot; the alarm itself is handled in updateAlarm.
    if (guard.seesThief && guard.mode === 'patrol') {
      guard.mode = 'chase';
      guard.modeTimer = 1.6;
    }
  }
}

export function updateCameras(cameras, thief, dt) {
  for (const cam of cameras) {
    cam.phase += dt;
    cam.angle = cam.base + Math.sin((cam.phase / cam.period) * Math.PI * 2) * cam.sweep;
    cam.seesThief = watcherSees(
      cam.x, cam.y, cam.angle, CAMERA.viewRange, CAMERA.viewHalfAngle, thief,
    );
  }
}

/**
 * Advance the alarm meter. Returns the new alarm value (0..100).
 * `state` carries { alarm, calmSeconds, peakAlarm } and is updated here.
 */
export function updateAlarm(state, guards, cameras, dt) {
  const seenByGuard = guards.some((g) => g.seesThief);
  const seenByCamera = cameras.some((c) => c.seesThief);
  if (seenByGuard || seenByCamera) {
    let rate = 0;
    if (seenByGuard) rate += ALARM.guardRate;
    if (seenByCamera) rate += ALARM.cameraRate;
    state.alarm = Math.min(ALARM.max, state.alarm + rate * dt);
    state.calmSeconds = 0;
  } else {
    state.calmSeconds += dt;
    if (state.calmSeconds > ALARM.decayDelay) {
      state.alarm = Math.max(0, state.alarm - ALARM.decayRate * dt);
    }
  }
  if (state.alarm > state.peakAlarm) state.peakAlarm = state.alarm;
  return state.alarm;
}

/** True when any guard is close enough to lay a hand on the thief. */
export function guardCaughtThief(guards, thief) {
  for (const guard of guards) {
    if (Math.hypot(guard.x - thief.x, guard.y - thief.y) < GUARD.catchDistance) return true;
  }
  return false;
}

/** Send the nearest guard within earshot to investigate a thrown noisemaker. */
export function distractNearestGuard(guards, x, y, earshot = 260) {
  let best = null;
  let bestDist = earshot;
  for (const guard of guards) {
    const d = Math.hypot(guard.x - x, guard.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = guard;
    }
  }
  if (best) {
    best.mode = 'investigate';
    best.targetX = x;
    best.targetY = y;
    best.modeTimer = 4.5;
    best.pause = 0;
  }
  return best;
}
