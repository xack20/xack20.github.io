// Where the nebula sits behind a page. Pure, so it is tested without a canvas.

export type SkyPage = 'home' | 'inner';

export interface SkySize {
  /** CSS pixels. */
  readonly width: number;
  readonly height: number;
}

/** Pixels, with `anchorY` measured up from the bottom edge, as the shader expects. */
export interface SkyPlacement {
  readonly anchorX: number;
  readonly anchorY: number;
  readonly radius: number;
  readonly gain: number;
  readonly turn: number;
}

/** A placement as fractions: x of the width; y (from the bottom) and radius of the height. */
interface Key {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly gain: number;
  readonly turn: number;
}

interface HomeKeys {
  readonly rest: Key;
  readonly sunk: Key;
}

const PHONE_MAX_WIDTH = 899;
/** The stretch of the home page's approval timeline over which the cloud sinks behind the gates. */
const SINK_SPAN = [0.03, 0.24] as const;

// Low on the right while the first screen and the wall are showing, then sunk and dimmed behind the gates.
const HOME_WIDE: HomeKeys = {
  rest: { x: 0.85, y: 0.27, radius: 0.4, gain: 0.82, turn: 0 },
  sunk: { x: 0.9, y: 0.1, radius: 0.4, gain: 0.56, turn: 0.3 },
};
// On a phone the introduction fills the top half, so the cloud stays under it.
const HOME_PHONE: HomeKeys = {
  rest: { x: 0.9, y: 0.3, radius: 0.26, gain: 0.8, turn: 0 },
  sunk: { x: 0.95, y: 0.14, radius: 0.24, gain: 0.55, turn: 0.3 },
};
// Reading pages get a quiet corner of light, never anything behind the text column.
const INNER_WIDE: Key = { x: 0.9, y: 0.1, radius: 0.36, gain: 0.5, turn: 0.3 };
const INNER_PHONE: Key = { x: 0.98, y: 0.08, radius: 0.22, gain: 0.42, turn: 0.3 };

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const smooth = (value: number): number => value * value * (3 - 2 * value);
const lerp = (from: number, to: number, amount: number): number => from + (to - from) * amount;

const mix = (from: Key, to: Key, amount: number): Key => ({
  x: lerp(from.x, to.x, amount),
  y: lerp(from.y, to.y, amount),
  radius: lerp(from.radius, to.radius, amount),
  gain: lerp(from.gain, to.gain, amount),
  turn: lerp(from.turn, to.turn, amount),
});

const toPixels = (key: Key, size: SkySize): SkyPlacement => ({
  anchorX: key.x * size.width,
  anchorY: key.y * size.height,
  radius: key.radius * size.height,
  gain: key.gain,
  turn: key.turn,
});

/** `progress` is the home page's approval timeline, 0..1; inner pages ignore it. */
export const placeSky = (progress: number, size: SkySize, page: SkyPage): SkyPlacement => {
  const phone = size.width <= PHONE_MAX_WIDTH;
  if (page === 'inner') return toPixels(phone ? INNER_PHONE : INNER_WIDE, size);
  const keys = phone ? HOME_PHONE : HOME_WIDE;
  const sunk = smooth(clamp01((clamp01(progress) - SINK_SPAN[0]) / (SINK_SPAN[1] - SINK_SPAN[0])));
  return toPixels(mix(keys.rest, keys.sunk, sunk), size);
};
