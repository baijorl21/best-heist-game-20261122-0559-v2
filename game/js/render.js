// Painting the museum: floor, walls, cover, vision cones clipped by
// sight lines, the watchers, the thief, the glowing Ember Heart, and
// the HUD (alarm meter, clock, tools, objective). Danger is amber and
// red, safety is shadow and crate-brown, loot burns orange — readable
// at a glance, even shrunk.

import { COVER, EXIT, FLOOR, GEM, SOLIDS, WALLS } from './level.js';
import { CAMERA, GUARD } from './guards.js';
import { TOOLS } from './player.js';

export const SCREEN = {
  title: 'title',
  play: 'play',
  paused: 'paused',
  caught: 'caught',
  escaped: 'escaped',
};

const INK = {
  floor: '#1c2436',
  floorLine: '#232e47',
  wall: '#57452c',
  wallEdge: '#7a6238',
  crate: '#6e5732',
  crateEdge: '#96794a',
  exit: '#2e7d4f',
  exitGlow: '#57d992',
  gem: '#ff9a2e',
  gemCore: '#ffd28a',
  thief: '#2ec4b6',
  thiefDark: '#177e74',
  guard: '#d64545',
  guardDark: '#8c2b2b',
  camera: '#cfd8e3',
  coneGuard: 'rgba(255, 190, 60, 0.20)',
  coneGuardHot: 'rgba(255, 70, 50, 0.34)',
  coneCamera: 'rgba(90, 200, 255, 0.16)',
  coneCameraHot: 'rgba(255, 70, 50, 0.32)',
  text: '#f2ead8',
  dim: '#9fb0c9',
  panel: 'rgba(8, 11, 18, 0.86)',
};

function pointInSolid(x, y) {
  for (const s of SOLIDS) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return true;
  }
  return false;
}

/** Distance a ray from (x, y) along `angle` travels before hitting solid. */
function rayDistance(x, y, angle, maxDist) {
  const step = 4;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  for (let d = step; d <= maxDist; d += step) {
    if (pointInSolid(x + cos * d, y + sin * d)) return d - step;
  }
  return maxDist;
}

/** A vision cone as a fan of rays, clipped where walls block the view. */
function drawCone(ctx, x, y, angle, range, halfAngle, fill) {
  const rays = 26;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i <= rays; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    const d = rayDistance(x, y, a, range);
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawFloor(ctx) {
  ctx.fillStyle = INK.floor;
  ctx.fillRect(0, 0, FLOOR.width, FLOOR.height);
  ctx.strokeStyle = INK.floorLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= FLOOR.width; x += 48) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, FLOOR.height);
  }
  for (let y = 0; y <= FLOOR.height; y += 48) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(FLOOR.width, y + 0.5);
  }
  ctx.stroke();
  // room names, chalked faintly on the floor (kept inside their rooms)
  ctx.fillStyle = 'rgba(159, 176, 201, 0.35)';
  ctx.font = '600 12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(97, 320);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('S E R V I C E   C O R R I D O R', 0, 4);
  ctx.restore();
  ctx.fillText('C E N T R A L   G A L L E R Y', 325, 565);
  ctx.fillText('E A S T   F L O O R', 825, 605);
  ctx.fillText('T H E   V A U L T', 800, 175);
}

function drawWallsAndCover(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = INK.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = INK.wallEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
  }
  for (const c of COVER) {
    ctx.fillStyle = INK.crate;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = INK.crateEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
    ctx.beginPath();
    ctx.moveTo(c.x + 3, c.y + 3);
    ctx.lineTo(c.x + c.w - 3, c.y + c.h - 3);
    ctx.moveTo(c.x + c.w - 3, c.y + 3);
    ctx.lineTo(c.x + 3, c.y + c.h - 3);
    ctx.stroke();
  }
}

function drawExit(ctx, thief, pulse) {
  ctx.fillStyle = INK.exit;
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.strokeStyle = INK.exitGlow;
  ctx.lineWidth = thief.hasGem ? 3 + Math.sin(pulse * 6) : 2;
  ctx.strokeRect(EXIT.x + 2, EXIT.y + 2, EXIT.w - 4, EXIT.h - 4);
  ctx.fillStyle = INK.text;
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('SERVICE DOOR', 0, 4);
  ctx.restore();
}

function drawGem(ctx, pulse) {
  const glow = 30 + Math.sin(pulse * 3.2) * 6;
  const grad = ctx.createRadialGradient(GEM.x, GEM.y, 2, GEM.x, GEM.y, glow + 18);
  grad.addColorStop(0, 'rgba(255, 170, 60, 0.55)');
  grad.addColorStop(1, 'rgba(255, 140, 40, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(GEM.x, GEM.y, glow + 18, 0, Math.PI * 2);
  ctx.fill();
  // plinth
  ctx.fillStyle = '#3d4a66';
  ctx.fillRect(GEM.x - 20, GEM.y + 8, 40, 12);
  ctx.strokeStyle = '#7f93b5';
  ctx.strokeRect(GEM.x - 20, GEM.y + 8, 40, 12);
  // the Ember Heart itself: a cut diamond, burning orange
  ctx.beginPath();
  ctx.moveTo(GEM.x, GEM.y - GEM.r);
  ctx.lineTo(GEM.x + GEM.r * 0.8, GEM.y - 2);
  ctx.lineTo(GEM.x, GEM.y + GEM.r);
  ctx.lineTo(GEM.x - GEM.r * 0.8, GEM.y - 2);
  ctx.closePath();
  ctx.fillStyle = INK.gem;
  ctx.fill();
  ctx.fillStyle = INK.gemCore;
  ctx.beginPath();
  ctx.moveTo(GEM.x, GEM.y - GEM.r * 0.55);
  ctx.lineTo(GEM.x + GEM.r * 0.4, GEM.y - 1);
  ctx.lineTo(GEM.x, GEM.y + GEM.r * 0.55);
  ctx.lineTo(GEM.x - GEM.r * 0.4, GEM.y - 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = INK.text;
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('EMBER HEART', GEM.x, GEM.y + 38);
}

function drawPerson(ctx, x, y, angle, body, dark, radius) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(0, 0, radius + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  // nose / facing tick
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(radius * 0.55, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCamera(ctx, cam) {
  ctx.fillStyle = '#2b3448';
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK.camera;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.rotate(cam.angle);
  ctx.fillStyle = cam.seesThief ? '#ff5040' : INK.camera;
  ctx.fillRect(4, -3, 10, 6);
  ctx.restore();
}

function drawNoisePings(ctx, thief) {
  for (const ping of thief.noisePings) {
    const r = 8 + ping.age * 55;
    ctx.strokeStyle = `rgba(120, 230, 255, ${Math.max(0, 0.85 - ping.age * 0.5)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ping.x, ping.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#78e6ff';
    ctx.beginPath();
    ctx.arc(ping.x, ping.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function formatClock(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function drawHud(ctx, state) {
  const { thief, alarm, elapsed } = state;
  // top bar
  ctx.fillStyle = 'rgba(8, 11, 18, 0.82)';
  ctx.fillRect(0, 0, FLOOR.width, 52);
  ctx.strokeStyle = '#3a2f1d';
  ctx.beginPath();
  ctx.moveTo(0, 52.5);
  ctx.lineTo(FLOOR.width, 52.5);
  ctx.stroke();

  ctx.fillStyle = INK.text;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('THE EMBER RELIQUARY', 14, 22);
  ctx.font = '12px Georgia, serif';
  ctx.fillStyle = INK.dim;
  ctx.fillText(thief.hasGem ? 'You have the Ember Heart — get to the service door!' : 'Steal the Ember Heart from the vault, then escape.', 14, 40);

  // alarm meter: the heart of the HUD, wide and unmissable
  const meterX = 400;
  const meterW = 300;
  ctx.fillStyle = INK.text;
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', meterX, 18);
  ctx.fillStyle = '#2b3448';
  ctx.fillRect(meterX, 24, meterW, 16);
  const alarmFrac = Math.min(1, alarm / 100);
  const alarmColor = alarm < 40 ? '#57d992' : alarm < 75 ? '#ffb13c' : '#ff5040';
  ctx.fillStyle = alarmColor;
  ctx.fillRect(meterX, 24, meterW * alarmFrac, 16);
  ctx.strokeStyle = '#7f93b5';
  ctx.lineWidth = 1;
  ctx.strokeRect(meterX + 0.5, 24.5, meterW - 1, 15);
  if (alarm >= 75) {
    ctx.fillStyle = '#ff5040';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('BREAK LINE OF SIGHT!', meterX + meterW / 2, 49);
    ctx.textAlign = 'left';
  }

  // clock and tools on the right
  ctx.fillStyle = INK.text;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(formatClock(elapsed), FLOOR.width - 14, 22);
  ctx.font = '12px Georgia, serif';
  ctx.fillStyle = INK.dim;
  const cloakText = thief.cloaked
    ? 'CLOAK ON'
    : thief.cloakCooldown > 0
      ? `cloak ${Math.ceil(thief.cloakCooldown)}s`
      : 'cloak ready (E)';
  ctx.fillText(`noisemakers x${thief.noisemakers} (Q) · ${cloakText} · cost -${thief.toolCost}`, FLOOR.width - 14, 40);

  // bottom hint strip
  ctx.fillStyle = 'rgba(8, 11, 18, 0.7)';
  ctx.fillRect(0, FLOOR.height - 24, FLOOR.width, 24);
  ctx.fillStyle = INK.dim;
  ctx.font = '12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / arrows move · Shift creep · mouse aims, Q or right-click throws a noisemaker · E cloak · P pause · R restart', FLOOR.width / 2, FLOOR.height - 8);
}

function drawPanel(ctx, title, lines, accent) {
  ctx.fillStyle = INK.panel;
  ctx.fillRect(0, 0, FLOOR.width, FLOOR.height);
  const w = 560;
  const h = 120 + lines.length * 24;
  const x = (FLOOR.width - w) / 2;
  const y = (FLOOR.height - h) / 2;
  ctx.fillStyle = '#141a26';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = accent;
  ctx.font = 'bold 30px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, FLOOR.width / 2, y + 48);
  ctx.fillStyle = INK.text;
  ctx.font = '15px Georgia, serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, FLOOR.width / 2, y + 84 + i * 24);
  });
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let pulse = 0;

  function draw(state, screen) {
    pulse += 1 / 60;
    const { thief, guards, cameras } = state;
    drawFloor(ctx);
    drawExit(ctx, thief, pulse);
    if (!thief.hasGem) drawGem(ctx, pulse);
    // cones first, so people stand on top of their own light
    for (const cam of cameras) {
      drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA.viewRange, CAMERA.viewHalfAngle,
        cam.seesThief ? INK.coneCameraHot : INK.coneCamera);
    }
    for (const guard of guards) {
      drawCone(ctx, guard.x, guard.y, guard.angle, GUARD.viewRange, GUARD.viewHalfAngle,
        guard.seesThief ? INK.coneGuardHot : INK.coneGuard);
    }
    drawWallsAndCover(ctx);
    drawNoisePings(ctx, thief);
    for (const cam of cameras) drawCamera(ctx, cam);
    for (const guard of guards) {
      drawPerson(ctx, guard.x, guard.y, guard.angle, INK.guard, INK.guardDark, GUARD.radius);
      if (guard.mode === 'investigate') {
        ctx.fillStyle = '#ffd28a';
        ctx.font = 'bold 14px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', guard.x, guard.y - 18);
      } else if (guard.seesThief) {
        ctx.fillStyle = '#ff5040';
        ctx.font = 'bold 15px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', guard.x, guard.y - 18);
      }
    }
    // the thief, ghostly while cloaked
    ctx.globalAlpha = thief.cloaked ? 0.35 : 1;
    drawPerson(ctx, thief.x, thief.y, thief.angle, INK.thief, INK.thiefDark, 11);
    ctx.globalAlpha = 1;
    if (thief.hasGem) {
      ctx.fillStyle = INK.gem;
      ctx.beginPath();
      ctx.arc(thief.x + 10, thief.y - 10, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    drawHud(ctx, state);

    if (screen === SCREEN.title) {
      drawPanel(ctx, 'THE EMBER RELIQUARY', [
        'One gem. Three guards. Two cameras. One way out.',
        '',
        'Cross the museum, lift the Ember Heart from the vault,',
        'and slip back out through the service door.',
        'Vision cones feed the alarm — full alarm means caught.',
        '',
        'Press Space or click to begin the night.',
      ], '#ffb13c');
    } else if (screen === SCREEN.paused) {
      drawPanel(ctx, 'PAUSED', ['The museum holds its breath.', '', 'Press P or Space to keep sneaking.'], '#9fb0c9');
    } else if (screen === SCREEN.caught) {
      drawPanel(ctx, 'CAUGHT!', [
        state.caughtReason === 'alarm'
          ? 'The alarm screamed and the doors slammed shut.'
          : 'A guard laid a hand on your shoulder.',
        `You lasted ${formatClock(state.elapsed)} in the dark.`,
        '',
        'Press Space or R to try the night again.',
      ], '#ff5040');
    } else if (screen === SCREEN.escaped && state.score) {
      const s = state.score;
      drawPanel(ctx, 'CLEAN GETAWAY!', [
        `Ember Heart fenced: +${s.gem}`,
        `Time bonus: +${s.timeBonus}`,
        s.ghostBonus > 0 ? `Ghost bonus (never truly seen): +${s.ghostBonus}` : 'No ghost bonus — the alarm noticed you.',
        `Tools used: -${s.toolCost}`,
        '',
        `FINAL SCORE: ${s.total}   ·   time ${formatClock(state.elapsed)}`,
        '',
        'Press Space or R to run it again, cleaner.',
      ], '#57d992');
    }
  }

  return { draw };
}
