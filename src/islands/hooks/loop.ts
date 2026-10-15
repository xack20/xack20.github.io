import { cancelFrame, frame } from 'motion/react';

import { CANVAS_MAX_DPR } from '../scene/constants';

export interface CanvasSize {
  /** CSS pixels. */
  readonly width: number;
  readonly height: number;
  readonly ratio: number;
}

/** Match the backing store to the element, capped at CANVAS_MAX_DPR. */
export const fitCanvas = (canvas: HTMLCanvasElement): CanvasSize => {
  const ratio = Math.min(window.devicePixelRatio || 1, CANVAS_MAX_DPR);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const pixelWidth = Math.max(1, Math.round(width * ratio));
  const pixelHeight = Math.max(1, Math.round(height * ratio));
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  return { width, height, ratio };
};

interface LoopOptions {
  /** Draw one frame. `seconds` counts from the first frame. */
  readonly draw: (seconds: number) => void;
  /** Called when the element changes size, before the next draw. */
  readonly resize: () => void;
  /** Reduced motion: draw once per resize and never loop. */
  readonly still: boolean;
}

/**
 * Runs `draw` in motion's render step (so scroll-driven motion values are fresh),
 * only while the canvas is on screen and the tab is visible. Returns a cleanup.
 */
export const runCanvasLoop = (canvas: HTMLCanvasElement, { draw, resize, still }: LoopOptions): (() => void) => {
  let onScreen = false;
  let running = false;
  let startedAt = 0;

  const step = ({ timestamp }: { timestamp: number }): void => {
    if (startedAt === 0) startedAt = timestamp;
    draw((timestamp - startedAt) / 1000);
  };
  const sync = (): void => {
    const shouldRun = !still && onScreen && !document.hidden;
    if (shouldRun && !running) frame.render(step, true);
    if (!shouldRun && running) cancelFrame(step);
    running = shouldRun;
  };

  const sizeWatcher = new ResizeObserver(() => {
    resize();
    if (still) draw(0);
  });
  const viewWatcher = new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? false;
    sync();
  });
  sizeWatcher.observe(canvas);
  viewWatcher.observe(canvas);
  document.addEventListener('visibilitychange', sync);

  return () => {
    sizeWatcher.disconnect();
    viewWatcher.disconnect();
    document.removeEventListener('visibilitychange', sync);
    if (running) cancelFrame(step);
  };
};
