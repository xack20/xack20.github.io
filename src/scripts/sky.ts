// The sky behind every page: a halftone nebula, stars and grain in one fixed WebGL canvas.
// The home page's island moves the cloud by sending `sky:progress` events; inner pages keep it still and low.
import { placeSky, type SkyPage } from '../lib/sky/placement';
import { fitCanvas, runCanvasLoop } from './sky/loop';
import { createNebula } from './sky/renderer';

const REVEAL_SECONDS = 2.2;
/** The moment of the cloud shown as the still frame under reduced motion. */
const STILL_SECONDS = 14;
/** How far the cloud leans away from the pointer, as a fraction of the pointer's offset from centre. */
const DRIFT_AMOUNT = 0.018;
const DRIFT_EASE = 0.05;
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const PROGRESS_EVENT = 'sky:progress';
/** Compiling the shaders stalls the page briefly, so it waits until the page is idle, but no longer than this. */
const START_WITHIN_MS = 1500;

/** The home page's approval progress, kept from page start so events sent before the sky starts are not lost. */
let latestProgress = 0;
window.addEventListener(PROGRESS_EVENT, (event) => {
  const detail = (event as CustomEvent<unknown>).detail;
  if (typeof detail === 'number' && Number.isFinite(detail)) latestProgress = detail;
});

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const easeOut = (value: number): number => 1 - Math.pow(1 - value, 3);
const lerp = (from: number, to: number, amount: number): number => from + (to - from) * amount;

const startSky = (canvas: HTMLCanvasElement): void => {
  const nebula = createNebula(canvas);
  if (!nebula) {
    canvas.dataset.fallback = 'true';
    return;
  }
  const page: SkyPage = canvas.dataset.page === 'home' ? 'home' : 'inner';
  // shortcut: read once at start; a visitor who switches reduced motion mid-visit gets it on the next page.
  const still = window.matchMedia(REDUCED_MOTION).matches;
  let size = fitCanvas(canvas);
  let pointer = { x: 0, y: 0, inside: false };
  let drift = { x: 0, y: 0 };

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'touch') pointer = { x: event.clientX, y: event.clientY, inside: true };
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => {
    pointer = { ...pointer, inside: false };
  });

  const resize = (): void => {
    size = fitCanvas(canvas);
    nebula.resize(size);
  };
  const draw = (seconds: number): void => {
    const lean = pointer.inside && !still ? DRIFT_AMOUNT : 0;
    drift = {
      x: lerp(drift.x, (size.width / 2 - pointer.x) * lean, DRIFT_EASE),
      y: lerp(drift.y, (pointer.y - size.height / 2) * lean, DRIFT_EASE),
    };
    const place = placeSky(still ? 0 : latestProgress, size, page);
    nebula.draw({
      ...place,
      anchorX: place.anchorX + drift.x,
      anchorY: place.anchorY + drift.y,
      seconds: still ? STILL_SECONDS : seconds,
      reveal: still ? 1 : easeOut(clamp01(seconds / REVEAL_SECONDS)),
      driftX: drift.x,
      driftY: drift.y,
    });
  };

  resize();
  runCanvasLoop(canvas, { draw, resize, still });
};

const startAll = (): void => {
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-sky]').forEach((canvas) => {
    try {
      startSky(canvas);
    } catch (error) {
      // A lost or refused WebGL context must not break the page; the CSS glow stays.
      canvas.dataset.fallback = 'true';
      console.warn('Sky canvas disabled:', error);
    }
  });
};

if ('requestIdleCallback' in window) requestIdleCallback(startAll, { timeout: START_WITHIN_MS });
else setTimeout(startAll, 0);
