import type { Scene } from './scene';

/** The two canvases a frame is painted into: the crisp one on screen and a small one that becomes the bloom. */
export interface Surface {
  readonly main: CanvasRenderingContext2D;
  readonly glow: CanvasRenderingContext2D;
  /** Backing pixels per CSS pixel on the main canvas. */
  readonly ratio: number;
}

/** The glow buffer is this fraction of CSS size; drawing it back up is what blurs it. */
export const GLOW_SCALE = 0.25;

/** What the cursor is doing to the bundle, in stage coordinates. */
export interface Disturbance {
  readonly x: number;
  readonly y: number;
  /** 0 pointer away, 1 pointer resting on the stage. */
  readonly presence: number;
  /** Rises with pointer speed and decays, so a flick leaves the lines ringing. */
  readonly energy: number;
}

export interface SignalFrame {
  readonly scene: Scene;
  readonly seconds: number;
  /** Page-load entrance, 0..1. */
  readonly reveal: number;
  readonly disturbance: Disturbance;
}

/** Stage space (CSS pixels) to canvas space. */
export const setWorld = (context: CanvasRenderingContext2D, scale: number): void => {
  context.setTransform(scale, 0, 0, scale, 0, 0);
};
