// Pure pose math for the plate deck: deck -> orbit ring -> wall, scrubbed by one progress value.
// No DOM and no imports, so it runs under plain node (tests/unit/choreography.test.ts).

export interface Pose {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly rx: number;
  readonly ry: number;
  readonly rz: number;
  readonly scale: number;
  readonly blur: number;
  readonly opacity: number;
}

export interface StageMetrics {
  readonly width: number;
  readonly height: number;
  readonly plateW: number;
  readonly plateH: number;
  readonly count: number;
  readonly headerH: number;
  /** Phone and small screens: no wall, the deck bursts past the camera instead. */
  readonly lite: boolean;
}

const TAU = Math.PI * 2;

export const TIMELINE = {
  copyOut: [0.015, 0.11],
  fanStart: 0.03,
  fanSpan: 0.3,
  fanStagger: 0.022,
  settleStart: 0.5,
  settleSpan: 0.22,
  settleStagger: 0.013,
  handover: [0.5, 0.68],
  label: [0.66, 0.8],
  /** Every plate is in its slot from here on. */
  settled: 0.86,
} as const;

/** At rest: two fanned stacks flanking the headline, each receding inward and upward. */
const REST = { radius: 0.38, minRadius: 380, maxRadius: 600, depth: 430, drop: 200, lift: 46, innerDeg: 52, outerDeg: 87, turn: 30 };
/** In orbit: a tilted ring around the headline. Front low and close, back high and far. */
const RING = { radius: 0.36, minRadius: 360, maxRadius: 540, depth: 340, drop: 178, roll: 40, jitter: 22, spinTravel: 4.4, idleSpin: 0.03, turn: 26, scale: 0.94 };
/** Phones: one small fanned stack low on the screen that bursts past the camera. */
const LITE = {
  scale: 0.8, cy: 0.3, stepX: 22, stepY: 19, stepZ: 46, z: -330, rx: 16, ry: -24, rz: -5, spread: 0.85, lift: 0.34, zNear: 260, zFar: 980,
  fanFrom: 0.02, fanFromStep: 0.02, fanTo: 0.55, fanToStep: 0.03,
};
const WALL = { cols: 4, gap: 16, margin: 28 };
const FLY_Z = 120;
const FAN_LEAD = 0.6;
const LAND_Z = 150;
const INTRO = { stagger: 0.07, span: 1.5, z: 760, y: 70 };
const FOCUS = { blurPerPx: 0.0075, maxBlur: 6, fogStart: 60, fogDepth: 760, minFog: 0.38, bokehStart: 260, bokehDepth: 720, roomyBokeh: 0.4 };
const BREATH = { y: 6, z: 12, turn: 1.4 };
/** The headline shrinks a little for the orbit, then to label size as it hands over to the wall. */
const HEADLINE = { orbitScale: 0.88, labelScale: 0.34, fadeFrom: 0.35, blur: 8 };

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * Whether the choreography plays the phone layout. Full and lite follow the mode, which a media query
 * picks; that query counts a classic scrollbar and the stage width does not, so measuring would
 * disagree at the threshold. Only reduced motion decides by size: a big still screen keeps its stacks.
 */
export const isLiteLayout = (
  mode: 'still' | 'lite' | 'full',
  width: number,
  height: number,
  roomy: { readonly minWidth: number; readonly minHeight: number },
): boolean => (mode === 'still' ? width < roomy.minWidth || height < roomy.minHeight : mode === 'lite');
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** 0..1 as v travels from `from` to `to`. */
export const span = (v: number, from: number, to: number): number => clamp01((v - from) / (to - from));
export const ease = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const rad = (degrees: number): number => (degrees * Math.PI) / 180;
const clampTo = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

const mix = (a: Pose, b: Pose, t: number): Pose => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t),
  rx: lerp(a.rx, b.rx, t),
  ry: lerp(a.ry, b.ry, t),
  rz: lerp(a.rz, b.rz, t),
  scale: lerp(a.scale, b.scale, t),
  blur: 0,
  opacity: 1,
});

/** How far the ring has turned. Shared with the particle field so both orbit together. */
export const ringSpin = (p: number): number => p * p * (3 - 2 * p) * RING.spinTravel;

/** Angle of plate `i` around the headline, measured from directly behind it (+ is the viewer's right). */
function plateAngle(i: number, p: number, time: number, fan: number, count: number): number {
  const leftCount = Math.ceil(count / 2);
  const onLeft = i < leftCount;
  const inStack = onLeft ? leftCount : count - leftCount;
  const fromInside = onLeft ? leftCount - 1 - i : i - leftCount;
  const rest = (onLeft ? -1 : 1) * rad(lerp(REST.innerDeg, REST.outerDeg, inStack > 1 ? fromInside / (inStack - 1) : 0));
  const ring = (i - (count - 1) / 2) * (TAU / count);
  return lerp(rest, ring, fan) + ringSpin(p) + time * RING.idleSpin * fan;
}

/**
 * The plate in flight: `fan` 0 is the resting stacks, 1 the full ring. The stacks are an arc of
 * the same ring, so fanning out is the arc opening up around the headline, not a cross-fade.
 */
function flightPose(i: number, m: StageMetrics, p: number, time: number, fan: number): Pose {
  const b = plateAngle(i, p, time, fan, m.count);
  const radius = lerp(clampTo(m.width * REST.radius, REST.minRadius, REST.maxRadius), clampTo(m.width * RING.radius, RING.minRadius, RING.maxRadius), fan);
  return {
    x: Math.sin(b) * radius,
    y: -Math.cos(b) * lerp(REST.drop, RING.drop, fan) + lerp(REST.lift, 0, fan) + (Math.sin(b) * RING.roll + Math.sin(i * 2.4) * RING.jitter) * fan + Math.sin(time * 0.55 + i * 0.7) * BREATH.y,
    z: -Math.cos(b) * lerp(REST.depth, RING.depth, fan) + Math.cos(time * 0.4 + i * 0.5) * BREATH.z,
    rx: 4 + Math.cos(b) * 4,
    ry: -Math.sin(b) * lerp(REST.turn, RING.turn, fan) + Math.sin(time * 0.25 + i * 0.4) * BREATH.turn,
    rz: -Math.sin(b) * 3 + Math.sin(i * 1.7) * 2.5 * fan,
    scale: lerp(1, RING.scale, fan),
    blur: 0,
    opacity: 1,
  };
}

/** Phones: a small fanned stack that scatters toward and past the camera as the hero scrolls away. */
function litePose(i: number, m: StageMetrics, time: number, fan: number): Pose {
  const t = (m.count - 1) / 2 - i; // the first case study sits in front
  const a = (i / m.count) * TAU + 0.5;
  const stack: Pose = {
    x: t * LITE.stepX * LITE.scale,
    y: m.height * LITE.cy + t * LITE.stepY * LITE.scale + Math.sin(time * 0.55 + i * 0.7) * BREATH.y,
    z: LITE.z + t * LITE.stepZ + Math.cos(time * 0.4 + i * 0.5) * BREATH.z,
    rx: LITE.rx,
    ry: LITE.ry + Math.sin(time * 0.25 + i * 0.4) * BREATH.turn,
    rz: LITE.rz,
    scale: LITE.scale,
    blur: 0,
    opacity: 1,
  };
  const burst: Pose = {
    x: Math.sin(a) * m.width * LITE.spread,
    y: Math.cos(a * 1.3 + i) * m.height * LITE.lift,
    z: lerp(LITE.zNear, LITE.zFar, i / (m.count - 1)),
    rx: -8,
    ry: -Math.sin(a) * 30,
    rz: Math.sin(a + i * 1.7) * 9,
    scale: LITE.scale,
    blur: 0,
    opacity: 1,
  };
  return mix(stack, burst, fan);
}

/** Rows of the wall: every plate plus one slot for the section label. */
const wallRows = (count: number): number => Math.ceil((count + 1) / WALL.cols);

/** How much the wall has to shrink to fit under the header. 1 on a roomy screen. */
export function wallFit(m: StageMetrics): number {
  const rows = wallRows(m.count);
  const wallW = WALL.cols * m.plateW + (WALL.cols - 1) * WALL.gap;
  const wallH = rows * m.plateH + (rows - 1) * WALL.gap;
  return Math.min(1, (m.width - WALL.margin * 2) / wallW, (m.height - m.headerH - WALL.margin) / wallH);
}

/** Centre of a wall slot, relative to the stage centre. Slot 0 is the section label. */
export function wallSlot(slot: number, m: StageMetrics): { readonly x: number; readonly y: number; readonly scale: number } {
  const rows = wallRows(m.count);
  const scale = wallFit(m);
  const col = slot % WALL.cols;
  const row = Math.floor(slot / WALL.cols);
  return {
    x: Math.round((col - (WALL.cols - 1) / 2) * (m.plateW + WALL.gap) * scale),
    y: Math.round((row - (rows - 1) / 2) * (m.plateH + WALL.gap) * scale + (m.headerH - WALL.margin) / 2),
    scale,
  };
}

export const wallPose = (i: number, m: StageMetrics): Pose => ({ ...wallSlot(i + 1, m), z: 0, rx: 0, ry: 0, rz: 0, blur: 0, opacity: 1 });

/** Outer plates of each stack peel away first. */
export function fanAmount(i: number, p: number, count: number): number {
  const fromEdge = Math.min(i, count - 1 - i);
  const from = TIMELINE.fanStart + fromEdge * TIMELINE.fanStagger;
  // Quick off the mark, so the stacks open up before the ring has turned far.
  return ease(Math.pow(span(p, from, from + TIMELINE.fanSpan), FAN_LEAD));
}

export function settleAmount(i: number, p: number): number {
  const from = TIMELINE.settleStart + i * TIMELINE.settleStagger;
  return ease(span(p, from, from + TIMELINE.settleSpan));
}

const liteFanAmount = (i: number, p: number): number => ease(span(p, LITE.fanFrom + i * LITE.fanFromStep, LITE.fanTo + i * LITE.fanToStep));

/**
 * Where plate `i` is at scroll progress `p`. `time` (seconds) only feeds the idle breathing,
 * `intro` (seconds since the scene started) the fly-in. Depth of field and fog come from z.
 */
export function platePose(i: number, p: number, time: number, intro: number, m: StageMetrics): Pose {
  const settle = m.lite ? 0 : settleAmount(i, p);
  const arrive = ease(span(intro, i * INTRO.stagger, i * INTRO.stagger + INTRO.span));
  // Snap once landed: whole-pixel positions keep the wall's type sharp.
  if (settle >= 1 && arrive >= 1) return wallPose(i, m);

  const fan = m.lite ? liteFanAmount(i, p) : fanAmount(i, p, m.count);
  const flying = m.lite ? litePose(i, m, time, fan) : flightPose(i, m, p, time, fan);
  const path = settle > 0 ? mix(flying, wallPose(i, m), settle) : flying;
  const z = path.z + Math.sin(Math.PI * fan) * FLY_Z * (1 - settle) + Math.sin(Math.PI * settle) * LAND_Z - (1 - arrive) * INTRO.z;
  const y = path.y + (1 - arrive) * INTRO.y;

  const fog = lerp(1, FOCUS.minFog, span(-z, FOCUS.fogStart, FOCUS.fogStart + FOCUS.fogDepth));
  const bokeh = 1 - span(z, FOCUS.bokehStart, FOCUS.bokehStart + FOCUS.bokehDepth) * (m.lite ? 1 : FOCUS.roomyBokeh);
  return { ...path, y, z, blur: Math.min(FOCUS.maxBlur, Math.abs(z) * FOCUS.blurPerPx), opacity: fog * bokeh * arrive };
}

/** The headline recentres for the orbit, then travels into the label slot as it fades. */
export function headlinePose(p: number, shiftY: number, m: StageMetrics): { readonly x: number; readonly y: number; readonly scale: number; readonly opacity: number; readonly blur: number } {
  const centre = ease(span(p, TIMELINE.copyOut[0], TIMELINE.fanStart + TIMELINE.fanSpan));
  const hand = ease(span(p, TIMELINE.handover[0], TIMELINE.handover[1]));
  const slot = wallSlot(0, m);
  return {
    x: slot.x * hand,
    y: lerp(shiftY * centre, slot.y, hand),
    scale: lerp(lerp(1, HEADLINE.orbitScale, centre), HEADLINE.labelScale, hand),
    opacity: 1 - span(p, lerp(TIMELINE.handover[0], TIMELINE.handover[1], HEADLINE.fadeFrom), TIMELINE.handover[1]),
    blur: hand * HEADLINE.blur,
  };
}

const px = (v: number): string => `${v.toFixed(2)}px`;
const deg = (v: number): string => `${v.toFixed(2)}deg`;

export const poseTransform = (pose: Pose): string =>
  `translate3d(${px(pose.x)},${px(pose.y)},${px(pose.z)}) rotateX(${deg(pose.rx)}) rotateY(${deg(pose.ry)}) rotateZ(${deg(pose.rz)}) scale(${pose.scale.toFixed(4)})`;
