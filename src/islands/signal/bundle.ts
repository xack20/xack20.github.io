import { clamp01, lerp, smooth } from '@/lib/signal/timeline';

import { mixRgb, rgba } from './color';
import { loudness, ribbonOffset, RIBBONS, type Ribbon } from './ribbons';
import type { Scene } from './scene';
import { GLOW_SCALE, setWorld, type SignalFrame, type Surface } from './surface';

/** Bundle amplitude as a fraction of the stage height. */
const AMPLITUDE = 0.135;
const STEP_PX = 5;
/** How far past the stage edges the lines are drawn. */
const BLEED_PX = 40;
/** Wavelengths were tuned at this width; narrower stages compress them, down to the floor. */
const TUNED_WIDTH = 1200;
const MIN_STRETCH = 0.5;

// Once calm, the bundle survives only as a funnel that feeds the Propose gate.
const FUNNEL_LENGTH = 1.05;
const FUNNEL_OPEN = 1.1;
const FUNNEL_CURVE = 0.85;
const FUNNEL_CUT_SOFT_PX = 30;
// The far ribbon never fully converges: it stays behind the single line as out-of-focus haze.
const HAZE_SPREAD = 0.5;
const HAZE_FADE = 0.5;
/** Narrow stages pack the same lines into less room, so each one is drawn fainter. */
const NARROW_ALPHA = 0.6;

// Cursor: lines part around it and splay.
const REACH_X_PX = 150;
const REACH_Y_PX = 150;
const PART_PX = 52;
const PART_SOFT_PX = 26;
const SCATTER_PX = 22;
const SCATTER_REST = 0.3;
/** The calm line barely notices the cursor. */
const CALM_DAMPING = 0.85;

const LINE_WIDTH = 1;
const GLOW_WIDTH = 7;
const GLOW_WIDTH_FAR = 18;
const GLOW_ALPHA = 0.32;
const EDGE_FADE = 0.07;
const RESTLESS_LEFT_WHEN_CALM = 0.45;

/** Values shared by every line at one x. */
interface Columns {
  readonly x: Float32Array;
  /** Loudness of the bundle at x. */
  readonly loud: Float32Array;
  /** How open the funnel is at x: 0 at the Propose gate and beyond. */
  readonly funnel: Float32Array;
  readonly reach: Float32Array;
}

const funnel = (x: number, scene: Scene): number => {
  if (x >= scene.proposeX) return 0;
  const along = clamp01((scene.proposeX - x) / (scene.proposeX * FUNNEL_LENGTH));
  return FUNNEL_OPEN * Math.pow(smooth(along), FUNNEL_CURVE);
};

const sampleColumns = (frame: SignalFrame, stretch: number): Columns => {
  const { scene, seconds, reveal, disturbance } = frame;
  const count = Math.ceil((scene.width + BLEED_PX * 2) / STEP_PX) + 1;
  const x = new Float32Array(count);
  const loud = new Float32Array(count);
  const open = new Float32Array(count);
  const reach = new Float32Array(count);
  const grow = 0.35 + 0.65 * reveal;
  const pull = disturbance.presence * (1 - scene.calm * CALM_DAMPING);
  for (let i = 0; i < count; i++) {
    const at = -BLEED_PX + i * STEP_PX;
    const dx = at - disturbance.x;
    x[i] = at;
    loud[i] = loudness(at / stretch, seconds) * grow;
    open[i] = funnel(at, scene);
    reach[i] = pull * Math.exp(-(dx * dx) / (2 * REACH_X_PX * REACH_X_PX));
  }
  return { x, loud, funnel: open, reach };
};

/** One blue into another along the stage, fading at the edges and, once calm, cut off at the Propose gate. */
const ribbonStroke = (context: CanvasRenderingContext2D, ribbon: Ribbon, scene: Scene): CanvasGradient => {
  const start = -BLEED_PX;
  const span = scene.width + BLEED_PX * 2;
  const cut = (scene.proposeX - start) / span;
  const cutSoft = FUNNEL_CUT_SOFT_PX / span;
  const stops = [0, EDGE_FADE, 0.3, 0.55, 0.8, 1 - EDGE_FADE, 1, cut - cutSoft, cut].filter((u) => u >= 0 && u <= 1);
  const gradient = context.createLinearGradient(start, 0, start + span, 0);
  for (const u of [...stops].sort((a, b) => a - b)) {
    const edge = smooth(clamp01(u / EDGE_FADE)) * smooth(clamp01((1 - u) / EDGE_FADE));
    const kept = ribbon.far ? 1 - scene.calm * HAZE_FADE : 1 - scene.calm * smooth(clamp01((u - (cut - cutSoft)) / cutSoft));
    const tint = mixRgb(ribbon.from, ribbon.to, 0.5 - 0.5 * Math.cos(u * Math.PI * 2));
    gradient.addColorStop(u, rgba(tint, edge * kept));
  }
  return gradient;
};

const linePath = (ribbon: Ribbon, index: number, columns: Columns, frame: SignalFrame, stretch: number): Path2D => {
  const { scene, seconds, disturbance } = frame;
  const across = ribbon.lines === 1 ? 0 : (index / (ribbon.lines - 1)) * 2 - 1;
  const restless = 1 - scene.calm * (1 - RESTLESS_LEFT_WHEN_CALM);
  const amplitude = scene.height * AMPLITUDE;
  const lineSeed = ribbon.seed * 10 + index * 1.7;
  const splay = (SCATTER_REST + disturbance.energy) * SCATTER_PX * (index % 2 === 0 ? 1 : -1);
  // Once calm, the near ribbons end at the Propose gate; only the haze carries on.
  const endX = !ribbon.far && scene.calm > 0.995 ? scene.proposeX : Infinity;
  const path = new Path2D();
  for (let i = 0; i < columns.x.length && (columns.x[i] ?? Infinity) <= endX; i++) {
    const x = columns.x[i] ?? 0;
    const open = ribbon.far ? Math.max(columns.funnel[i] ?? 0, HAZE_SPREAD) : (columns.funnel[i] ?? 0);
    const envelope = (columns.loud[i] ?? 0) * lerp(1, open, scene.calm);
    const base = scene.lineY + envelope * ribbonOffset(ribbon, across, x / stretch, seconds, amplitude, restless);
    const reach = columns.reach[i] ?? 0;
    const dy = base - disturbance.y;
    const near = reach > 0.003 ? reach * Math.exp(-(dy * dy) / (2 * REACH_Y_PX * REACH_Y_PX)) : 0;
    const y = near > 0 ? base + (dy / Math.sqrt(dy * dy + PART_SOFT_PX * PART_SOFT_PX)) * PART_PX * near + Math.sin(x * 0.085 + seconds * 9 + lineSeed) * splay * near : base;
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  return path;
};

/** The restless bundle: crisp lines on the main canvas, and soft copies in the glow buffer. */
export const drawBundle = ({ main, glow, ratio }: Surface, frame: SignalFrame): void => {
  const { scene, reveal } = frame;
  if (reveal <= 0.002) return;
  const stretch = Math.max(MIN_STRETCH, Math.min(1, scene.width / TUNED_WIDTH));
  const density = lerp(NARROW_ALPHA, 1, (stretch - MIN_STRETCH) / (1 - MIN_STRETCH));
  const columns = sampleColumns(frame, stretch);

  setWorld(main, ratio);
  setWorld(glow, GLOW_SCALE);
  main.lineWidth = LINE_WIDTH;
  for (const ribbon of RIBBONS) {
    main.strokeStyle = ribbonStroke(main, ribbon, scene);
    glow.strokeStyle = ribbonStroke(glow, ribbon, scene);
    glow.lineWidth = ribbon.far ? GLOW_WIDTH_FAR : GLOW_WIDTH;
    for (let index = 0; index < ribbon.lines; index++) {
      const across = ribbon.lines === 1 ? 0 : (index / (ribbon.lines - 1)) * 2 - 1;
      const alpha = ribbon.alpha * reveal * density * (0.4 + 0.6 * (1 - across * across));
      const path = linePath(ribbon, index, columns, frame, stretch);
      glow.globalAlpha = alpha * GLOW_ALPHA;
      glow.stroke(path);
      if (ribbon.far) continue;
      main.globalAlpha = alpha;
      main.stroke(path);
    }
  }
  main.globalAlpha = 1;
  glow.globalAlpha = 1;
};
