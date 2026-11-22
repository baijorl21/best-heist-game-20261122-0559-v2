// The museum floor plan: walls, cover crates, patrol routes, camera
// posts, and the geometry helpers (collision, line of sight) that the
// rest of the game builds on. Everything is plain rectangles on a
// 960x640 floor, drawn top-down.

export const FLOOR = { width: 960, height: 640 };

// Solid walls. The outer shell plus interior partitions that split the
// floor into a west service corridor, the open central gallery and the
// vault room in the north-east corner.
export const WALLS = [
  // outer shell
  { x: 0, y: 0, w: 960, h: 16 },
  { x: 0, y: 624, w: 960, h: 16 },
  { x: 0, y: 0, w: 16, h: 640 },
  { x: 944, y: 0, w: 16, h: 640 },
  // west corridor divider, with a doorway gap at y 300..348
  { x: 180, y: 16, w: 14, h: 284 },
  { x: 180, y: 348, w: 14, h: 276 },
  // vault room: south wall with a doorway at x 742..790, west wall solid
  { x: 640, y: 196, w: 102, h: 14 },
  { x: 790, y: 196, w: 154, h: 14 },
  { x: 640, y: 16, w: 14, h: 194 },
  // gallery spine wall with two gaps (north gap y 120..168, south gap y 430..478)
  { x: 470, y: 16, w: 14, h: 104 },
  { x: 470, y: 168, w: 14, h: 262 },
  { x: 470, y: 478, w: 14, h: 146 },
  // a short spur in the south-east, making a third route along the bottom
  { x: 700, y: 470, w: 14, h: 154 },
  { x: 300, y: 470, w: 14, h: 154 },
];

// Low cover: display plinths and crate stacks. They block movement and
// sight, so crouching the route behind them breaks a cone's line.
export const COVER = [
  { x: 250, y: 120, w: 64, h: 40 },
  { x: 350, y: 250, w: 48, h: 64 },
  { x: 240, y: 400, w: 80, h: 36 },
  { x: 540, y: 90, w: 56, h: 56 },
  { x: 560, y: 320, w: 72, h: 40 },
  { x: 620, y: 500, w: 48, h: 48 },
  { x: 800, y: 330, w: 64, h: 64 },
  { x: 850, y: 520, w: 56, h: 36 },
  { x: 90, y: 180, w: 48, h: 48 },
  { x: 80, y: 420, w: 56, h: 40 },
  { x: 720, y: 90, w: 44, h: 44 },
];

// Where the thief slips in, and must slip back out with the gem.
export const SPAWN = { x: 70, y: 570 };
export const EXIT = { x: 16, y: 528, w: 52, h: 84 };

// The Ember Heart, on its plinth in the vault.
export const GEM = { x: 845, y: 100, r: 13, value: 1000 };

// Guard patrols: waypoint loops, walked in order, pausing at each point.
export const GUARD_ROUTES = [
  // gallery guard: a wide loop around the central plinths
  [
    { x: 260, y: 90 }, { x: 430, y: 90 }, { x: 430, y: 400 },
    { x: 260, y: 400 }, { x: 260, y: 210 },
  ],
  // vault guard: paces in front of the vault doorway and the east floor
  [
    { x: 700, y: 260 }, { x: 880, y: 260 }, { x: 880, y: 450 }, { x: 760, y: 450 },
  ],
  // corridor guard: up and down the west service corridor
  [
    { x: 95, y: 90 }, { x: 95, y: 480 }, { x: 140, y: 320 },
  ],
];

// Ceiling cameras: fixed posts whose cones sweep back and forth.
export const CAMERA_POSTS = [
  { x: 766, y: 196, base: Math.PI / 2, sweep: 0.75, period: 5.2 }, // watches the vault door
  { x: 928, y: 430, base: Math.PI, sweep: 0.6, period: 6.4 }, // watches the east floor
  { x: 484, y: 300, base: Math.PI, sweep: 0.55, period: 7.1 }, // watches the spine gap
];

export const SOLIDS = WALLS.concat(COVER);

/** True when a circle at (x, y) with radius r overlaps any solid rect. */
export function circleHitsSolid(x, y, r) {
  for (const s of SOLIDS) {
    const cx = Math.max(s.x, Math.min(x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(y, s.y + s.h));
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

/** Move a circle by (dx, dy), sliding along solids one axis at a time. */
export function moveCircle(pos, dx, dy, r) {
  if (!circleHitsSolid(pos.x + dx, pos.y, r)) pos.x += dx;
  if (!circleHitsSolid(pos.x, pos.y + dy, r)) pos.y += dy;
}

/** True when the segment (x1,y1)-(x2,y2) crosses rect s. */
function segmentCrossesRect(x1, y1, x2, y2, s) {
  // Slab test: clip the segment against the rect on both axes.
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const slabs = [
    [-dx, x1 - s.x], [dx, s.x + s.w - x1],
    [-dy, y1 - s.y], [dy, s.y + s.h - y1],
  ];
  for (const [p, q] of slabs) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
      else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
  }
  return true;
}

/** True when nothing solid blocks the straight line between two points. */
export function hasLineOfSight(x1, y1, x2, y2) {
  for (const s of SOLIDS) {
    if (segmentCrossesRect(x1, y1, x2, y2, s)) return false;
  }
  return true;
}

/** Smallest signed difference between two angles, in (-PI, PI]. */
export function angleGap(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
