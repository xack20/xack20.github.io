// The signal's palette: one hue family. The agent's light is cool blue; once a person approves,
// the line turns near-white and ice, which reads as steadier and brighter rather than as a new colour.

export type Rgb = readonly [number, number, number];

export const AGENT_SKY: Rgb = [56, 189, 248];
export const AGENT_ICE: Rgb = [150, 222, 255];
export const AGENT_BLUE: Rgb = [70, 120, 255];
export const AGENT_DEEP: Rgb = [47, 107, 255];
export const AGENT_WHITE: Rgb = [214, 238, 255];

export const APPROVED_WHITE: Rgb = [236, 246, 255];
export const APPROVED_ICE: Rgb = [160, 214, 255];
export const APPROVED_BLUE: Rgb = [90, 160, 255];

export const rgba = ([r, g, b]: Rgb, alpha: number): string => `rgba(${r},${g},${b},${alpha})`;

export const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];
