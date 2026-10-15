// The bundle is three ribbons of thin lines. Lines in a ribbon share one wave and differ by a small
// phase shear, so together they read as a twisting sheet of light rather than as separate squiggles.

import { AGENT_BLUE, AGENT_DEEP, AGENT_ICE, AGENT_SKY, type Rgb } from './color';

export interface Ribbon {
  readonly lines: number;
  /** Share of the bundle's amplitude this ribbon swings through. */
  readonly swing: number;
  /** Half thickness of the ribbon in CSS pixels. */
  readonly thickness: number;
  /** Wavelengths in CSS pixels: swell, body, ripple. */
  readonly waves: readonly [number, number, number];
  /** Radians per second for the same three. */
  readonly speeds: readonly [number, number, number];
  /** Phase offset across the ribbon for the same three. */
  readonly shear: readonly [number, number, number];
  readonly twistWave: number;
  readonly twistSpeed: number;
  readonly seed: number;
  readonly from: Rgb;
  readonly to: Rgb;
  readonly alpha: number;
  /** Far ribbons are only painted into the low-resolution glow buffer, so they sit out of focus. */
  readonly far: boolean;
}

export const RIBBONS: readonly Ribbon[] = [
  {
    lines: 7,
    swing: 1.2,
    thickness: 74,
    waves: [1520, 640, 250],
    speeds: [0.17, 0.24, 0.6],
    shear: [0.5, 0.9, 1.3],
    twistWave: 1900,
    twistSpeed: 0.12,
    seed: 0.7,
    from: AGENT_DEEP,
    to: AGENT_SKY,
    alpha: 0.55,
    far: true,
  },
  {
    lines: 15,
    swing: 1,
    thickness: 46,
    waves: [1180, 430, 132],
    speeds: [0.36, 0.55, 2.1],
    shear: [0.42, 0.8, 1.7],
    twistWave: 980,
    twistSpeed: 0.29,
    seed: 2.1,
    from: AGENT_SKY,
    to: AGENT_BLUE,
    alpha: 0.7,
    far: false,
  },
  {
    lines: 12,
    swing: 0.84,
    thickness: 38,
    waves: [900, 352, 98],
    speeds: [0.43, 0.66, 2.6],
    shear: [0.5, 1.1, 2.1],
    twistWave: 760,
    twistSpeed: 0.35,
    seed: 5.3,
    from: AGENT_BLUE,
    to: AGENT_ICE,
    alpha: 0.62,
    far: false,
  },
];

const TAU = Math.PI * 2;
const SWELL_SHARE = 0.56;
const BODY_SHARE = 0.3;
const RIPPLE_REST = 0.06;
const RIPPLE_BURST = 0.3;
const BURST_WAVE = 1300;
const BURST_SPEED = 0.9;

/**
 * Vertical offset of one line at x, in CSS pixels, before the envelope is applied.
 * `across` is the line's place in the ribbon, -1..1. `restless` scales the fast ripple.
 */
export const ribbonOffset = (ribbon: Ribbon, across: number, x: number, seconds: number, amplitude: number, restless: number): number => {
  const { waves, speeds, shear, seed } = ribbon;
  const swell = Math.sin((x * TAU) / waves[0] + seconds * speeds[0] + seed + across * shear[0]);
  const body = Math.sin((x * TAU) / waves[1] - seconds * speeds[1] + seed * 2.3 + across * shear[1]);
  const ripple = Math.sin((x * TAU) / waves[2] + seconds * speeds[2] + seed * 4.1 + across * shear[2]);
  // Pockets of fast ripple travel along the bundle, the way loudness moves through a voice.
  const burst = Math.max(0, Math.sin((x * TAU) / BURST_WAVE - seconds * BURST_SPEED + seed * 3.0));
  const twist = Math.sin((x * TAU) / ribbon.twistWave + seconds * ribbon.twistSpeed + seed * 1.7);
  const wave = SWELL_SHARE * swell + BODY_SHARE * body + (RIPPLE_REST + RIPPLE_BURST * burst * burst) * ripple * restless;
  return wave * ribbon.swing * amplitude + across * twist * ribbon.thickness;
};

const LOUD_FLOOR = 0.42;
/** A slow loudness envelope along the bundle, 0.42..1. */
export const loudness = (x: number, seconds: number): number => {
  const a = Math.sin((x * TAU) / 2100 - seconds * 0.21 + 1.2);
  const b = Math.sin((x * TAU) / 870 + seconds * 0.13);
  return LOUD_FLOOR + (1 - LOUD_FLOOR) * (0.5 + 0.5 * a * b);
};
