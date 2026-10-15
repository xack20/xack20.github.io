import { clamp01, easeOut, smooth } from '@/lib/signal/timeline';

import { AGENT_ICE, AGENT_SKY, AGENT_WHITE, APPROVED_BLUE, APPROVED_ICE, APPROVED_WHITE, mixRgb, rgba, type Rgb } from './color';
import type { Scene } from './scene';
import { GLOW_SCALE, setWorld, type SignalFrame, type Surface } from './surface';

const STEP_PX = 3;
const BLEED_PX = 40;

// Before Approve: thin and jittery.
const JITTER_STEPS_PER_SECOND = 22;
const JITTER_CELL_PX = 6;
const JITTER_STEP_PX = 5.5;
const JITTER_WOBBLE_PX = 1.7;
/** Jitter eases to nothing this close to a gate, so the line threads each one cleanly. */
const JITTER_TAPER_PX = 34;
const RAIL_ALPHA = 0.24;
const AGENT_WIDTH = 1.1;
const AGENT_GLOW_WIDTH = 6;

// After Approve: steady and bright. Widths and alphas of the stacked strokes, widest first.
const APPROVED_HALO: readonly (readonly [number, number, Rgb])[] = [
  [18, 0.028, APPROVED_BLUE],
  [8, 0.07, mixRgb(APPROVED_ICE, APPROVED_BLUE, 0.4)],
  [3.4, 0.3, APPROVED_ICE],
];
const APPROVED_CORE_WIDTH = 1.7;
const APPROVED_GLOW_WIDTH = 11;

const PULSE_GAP_PX = 460;
const PULSE_SPEED_PX = 280;
const PULSE_LENGTH_PX = 90;
const PULSE_STRENGTH = 0.6;

const HEAD_RADIUS_PX = 20;
const HEAD_FLARE_PX = 64;
const RING_MIN_PX = 10;
const RING_GROW_PX = 86;

const noise = (n: number): number => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

const taper = (x: number, scene: Scene): number =>
  smooth(clamp01(Math.abs(x - scene.proposeX) / JITTER_TAPER_PX)) *
  smooth(clamp01(Math.abs(x - scene.approveX) / JITTER_TAPER_PX)) *
  smooth(clamp01(Math.abs(x - scene.commitX) / JITTER_TAPER_PX));

const jitter = (x: number, seconds: number): number => {
  const step = Math.floor(seconds * JITTER_STEPS_PER_SECOND);
  const stepped = (noise(Math.floor(x / JITTER_CELL_PX) * 31 + step * 131) - 0.5) * JITTER_STEP_PX;
  const wobble = Math.sin(x * 0.11 + seconds * 23) + Math.sin(x * 0.033 - seconds * 9);
  return stepped + wobble * JITTER_WOBBLE_PX;
};

const jitterPath = (fromX: number, toX: number, scene: Scene, seconds: number): Path2D => {
  const path = new Path2D();
  path.moveTo(fromX, scene.lineY);
  for (let x = fromX + STEP_PX; x < toX; x += STEP_PX) path.lineTo(x, scene.lineY + jitter(x, seconds) * taper(x, scene));
  path.lineTo(toX, scene.lineY);
  return path;
};

/** The agent's draft: a faint rail ahead of the head and a jittery trail from Propose to Approve. */
const drawDraft = ({ main, glow }: Surface, { scene, seconds }: SignalFrame): void => {
  const strength = scene.calm;
  if (strength <= 0.002) return;
  const railStart = Math.max(scene.proposeX, scene.headX);
  const railEnd = scene.width + BLEED_PX;
  main.lineWidth = AGENT_WIDTH;
  if (railStart < railEnd) {
    main.strokeStyle = rgba(AGENT_ICE, RAIL_ALPHA * strength);
    main.stroke(jitterPath(railStart, railEnd, scene, seconds));
  }
  const trailEnd = Math.min(scene.headX, scene.approveX);
  if (trailEnd <= scene.proposeX) return;
  const trail = jitterPath(scene.proposeX, trailEnd, scene, seconds);
  main.strokeStyle = rgba(AGENT_WHITE, 0.92 * strength);
  main.stroke(trail);
  glow.lineWidth = AGENT_GLOW_WIDTH;
  glow.strokeStyle = rgba(AGENT_SKY, 0.5 * strength);
  glow.stroke(trail);
};

const drawPulses = (main: CanvasRenderingContext2D, scene: Scene, seconds: number, endX: number): void => {
  const span = endX - scene.approveX;
  if (span < PULSE_LENGTH_PX) return;
  for (let offset = (seconds * PULSE_SPEED_PX) % PULSE_GAP_PX; offset < span; offset += PULSE_GAP_PX) {
    const x = scene.approveX + offset;
    const sweep = main.createLinearGradient(x - PULSE_LENGTH_PX, 0, x, 0);
    sweep.addColorStop(0, rgba(APPROVED_WHITE, 0));
    sweep.addColorStop(1, rgba(APPROVED_WHITE, PULSE_STRENGTH));
    main.strokeStyle = sweep;
    main.beginPath();
    main.moveTo(Math.max(scene.approveX, x - PULSE_LENGTH_PX), scene.lineY);
    main.lineTo(x, scene.lineY);
    main.stroke();
  }
};

/** After a person approves: a steady, bright line with light running along it. */
const drawApproved = ({ main, glow }: Surface, { scene, seconds }: SignalFrame): void => {
  if (scene.headX <= scene.approveX) return;
  const path = new Path2D();
  path.moveTo(scene.approveX, scene.lineY);
  path.lineTo(scene.headX, scene.lineY);
  for (const [width, alpha, tint] of APPROVED_HALO) {
    main.lineWidth = width;
    main.strokeStyle = rgba(tint, alpha);
    main.stroke(path);
  }
  main.lineWidth = APPROVED_CORE_WIDTH;
  main.strokeStyle = rgba(APPROVED_WHITE, 0.96);
  main.stroke(path);
  drawPulses(main, scene, seconds, scene.headX);
  glow.lineWidth = APPROVED_GLOW_WIDTH;
  glow.strokeStyle = rgba(mixRgb(APPROVED_ICE, APPROVED_BLUE, 0.35), 0.42);
  glow.stroke(path);
};

const drawRing = (main: CanvasRenderingContext2D, x: number, y: number, phase: number, tint: Rgb): void => {
  if (phase <= 0 || phase >= 1) return;
  const fade = (1 - phase) * (1 - phase);
  main.lineWidth = 1;
  main.strokeStyle = rgba(tint, 0.7 * fade);
  main.beginPath();
  main.arc(x, y, RING_MIN_PX + RING_GROW_PX * easeOut(phase), 0, Math.PI * 2);
  main.stroke();
};

/** The travelling point of light: a soft core with a four-point flare, like the stars behind it. */
const drawHead = (main: CanvasRenderingContext2D, scene: Scene): void => {
  const { headX: x, lineY: y } = scene;
  if (scene.headVisible <= 0 || x > scene.width + HEAD_FLARE_PX) return;
  const tint = mixRgb(AGENT_WHITE, APPROVED_WHITE, scene.approved);
  const strength = scene.headVisible;
  const core = main.createRadialGradient(x, y, 0, x, y, HEAD_RADIUS_PX);
  core.addColorStop(0, rgba(tint, 0.95 * strength));
  core.addColorStop(0.25, rgba(tint, 0.3 * strength));
  core.addColorStop(1, rgba(tint, 0));
  main.fillStyle = core;
  main.fillRect(x - HEAD_RADIUS_PX, y - HEAD_RADIUS_PX, HEAD_RADIUS_PX * 2, HEAD_RADIUS_PX * 2);
  const flare = main.createLinearGradient(x - HEAD_FLARE_PX, 0, x + HEAD_FLARE_PX, 0);
  flare.addColorStop(0, rgba(tint, 0));
  flare.addColorStop(0.5, rgba(tint, 0.9 * strength));
  flare.addColorStop(1, rgba(tint, 0));
  main.fillStyle = flare;
  main.fillRect(x - HEAD_FLARE_PX, y - 0.6, HEAD_FLARE_PX * 2, 1.2);
  const spike = main.createLinearGradient(0, y - HEAD_FLARE_PX / 2.6, 0, y + HEAD_FLARE_PX / 2.6);
  spike.addColorStop(0, rgba(tint, 0));
  spike.addColorStop(0.5, rgba(tint, 0.8 * strength));
  spike.addColorStop(1, rgba(tint, 0));
  main.fillStyle = spike;
  main.fillRect(x - 0.6, y - HEAD_FLARE_PX / 2.6, 1.2, HEAD_FLARE_PX / 1.3);
};

/** The single line: a faint rail ahead, a jittery trail to Approve, a steady bright one after it. */
export const drawLine = (surface: Surface, frame: SignalFrame): void => {
  const { main, glow, ratio } = surface;
  const { scene } = frame;
  if (scene.calm <= 0.002) return;
  setWorld(main, ratio);
  setWorld(glow, GLOW_SCALE);
  drawDraft(surface, frame);
  drawApproved(surface, frame);
  drawRing(main, scene.proposeX, scene.lineY, scene.ringPropose, AGENT_ICE);
  drawRing(main, scene.approveX, scene.lineY, scene.ringApprove, APPROVED_ICE);
  drawRing(main, scene.commitX, scene.lineY, scene.ringCommit, APPROVED_ICE);
  drawHead(main, scene);
};
