import { drawBundle } from './bundle';
import { drawLine } from './line';
import type { SignalFrame, Surface } from './surface';

/** How strongly the low-resolution glow buffer is added back over the crisp lines. */
const BLOOM_STRENGTH = 0.95;

const clear = (context: CanvasRenderingContext2D): void => {
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalCompositeOperation = 'source-over';
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  // Light adds up: where lines cross they get brighter, never muddier.
  context.globalCompositeOperation = 'lighter';
};

/** Paints one frame of the signal: the bundle, the single line, then the bloom over both. */
export const drawSignal = (surface: Surface, frame: SignalFrame): void => {
  const { main, glow } = surface;
  clear(main);
  clear(glow);
  drawBundle(surface, frame);
  drawLine(surface, frame);
  main.setTransform(1, 0, 0, 1, 0, 0);
  main.globalAlpha = BLOOM_STRENGTH;
  main.imageSmoothingQuality = 'high';
  main.drawImage(glow.canvas, 0, 0, main.canvas.width, main.canvas.height);
  main.globalAlpha = 1;
};
