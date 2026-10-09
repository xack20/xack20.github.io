/** Pure star-field simulation for the hero canvas. Positions are in device pixels. */
export interface Star { readonly x: number; readonly y: number; readonly vx: number; readonly vy: number; readonly r: number }
export interface Pointer { readonly x: number; readonly y: number }
export interface StepOptions { readonly width: number; readonly height: number; readonly pointer: Pointer | null; readonly dpr: number }

export const LINK_DISTANCE = 150; // CSS px between stars before a link fades out
export const ATTRACT_RADIUS = 180; // CSS px around the pointer
export const ATTRACT_PULL = 0.006; // share of the distance closed per frame
export const MAX_SPEED = 0.35; // velocity spread per frame, CSS px
export const MAX_LINK_ALPHA = 0.33;
export const MIN_RADIUS = 0.6;
export const RADIUS_SPREAD = 1.6;
export const MIN_STARS = 40;
export const MAX_STARS = 140;
export const TOUCH_STARS = 45;
const REFERENCE_AREA = 1440 * 900;
const REFERENCE_STARS = 110;

export function starCount(cssWidth: number, cssHeight: number, coarsePointer: boolean): number {
  if (coarsePointer) return TOUCH_STARS;
  const scaled = Math.round((cssWidth * cssHeight * REFERENCE_STARS) / REFERENCE_AREA);
  return Math.min(MAX_STARS, Math.max(MIN_STARS, scaled));
}

export function createStars(count: number, width: number, height: number, rand: () => number, scale = 1): Star[] {
  return Array.from({ length: count }, () => ({
    x: rand() * width,
    y: rand() * height,
    vx: (rand() - 0.5) * MAX_SPEED * scale,
    vy: (rand() - 0.5) * MAX_SPEED * scale,
    r: rand() * RADIUS_SPREAD + MIN_RADIUS,
  }));
}

const bounce = (position: number, velocity: number, limit: number): number =>
  (position < 0 && velocity < 0) || (position > limit && velocity > 0) ? -velocity : velocity;

export function stepStar(star: Star, opts: StepOptions): Star {
  const vx = bounce(star.x, star.vx, opts.width);
  const vy = bounce(star.y, star.vy, opts.height);
  const x = star.x + vx;
  const y = star.y + vy;
  if (!opts.pointer) return { ...star, x, y, vx, vy };
  const dx = opts.pointer.x - x;
  const dy = opts.pointer.y - y;
  const pulled = Math.hypot(dx, dy) < ATTRACT_RADIUS * opts.dpr;
  return { ...star, vx, vy, x: pulled ? x + dx * ATTRACT_PULL : x, y: pulled ? y + dy * ATTRACT_PULL : y };
}

export function stepStars(stars: readonly Star[], opts: StepOptions): readonly Star[] {
  return stars.map((star) => stepStar(star, opts));
}

export function linkAlpha(distance: number, maxDistance: number): number {
  return distance >= maxDistance ? 0 : (1 - distance / maxDistance) * MAX_LINK_ALPHA;
}
