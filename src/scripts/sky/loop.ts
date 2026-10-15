// Sizing and frame loop for the sky canvas. Plain requestAnimationFrame: this runs on every page,
// so it must not pull in the animation library the home page's island uses.

export interface CanvasSize {
  /** CSS pixels. */
  readonly width: number;
  readonly height: number;
  readonly ratio: number;
}

const MAX_PIXEL_RATIO = 1.5;
/** The nebula drifts slowly; 30 frames a second looks the same as 60 and costs half. */
const FRAME_INTERVAL_MS = 1000 / 30;

/** Match the backing store to the element, capped at MAX_PIXEL_RATIO. */
export const fitCanvas = (canvas: HTMLCanvasElement): CanvasSize => {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
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

/** Runs `draw` every frame, only while the canvas is on screen and the tab is visible. Returns a cleanup. */
export const runCanvasLoop = (canvas: HTMLCanvasElement, { draw, resize, still }: LoopOptions): (() => void) => {
  let onScreen = false;
  let request = 0;
  let startedAt = 0;
  let drawnAt = -Infinity;

  const step = (timestamp: number): void => {
    request = requestAnimationFrame(step);
    // Skip frames that arrive sooner than the interval; the small tolerance keeps a 60 Hz screen at 30.
    if (timestamp - drawnAt < FRAME_INTERVAL_MS - 2) return;
    drawnAt = timestamp;
    if (startedAt === 0) startedAt = timestamp;
    draw((timestamp - startedAt) / 1000);
  };
  const sync = (): void => {
    const shouldRun = !still && onScreen && !document.hidden;
    if (shouldRun && request === 0) request = requestAnimationFrame(step);
    if (!shouldRun && request !== 0) {
      cancelAnimationFrame(request);
      request = 0;
    }
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
    if (request !== 0) cancelAnimationFrame(request);
  };
};
