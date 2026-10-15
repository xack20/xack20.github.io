import { createRef, type RefObject } from 'react';

import { clamp01, ease, headlinePose, isLiteLayout, platePose, poseTransform, settleAmount, span, TIMELINE, wallSlot, type StageMetrics } from '@/lib/scene/choreography';

import { HEADER_H, ROOMY, TILT_DEG } from './constants';
import type { StageMode } from '../hooks/useStageMode';

// Writes one frame of the scroll beat straight to the DOM (transform, opacity and filter only).
// One writer for the whole scene keeps the choreography in a single place and off React's path.

export interface BeatRefs {
  section: RefObject<HTMLElement | null>;
  stage: RefObject<HTMLDivElement | null>;
  copy: RefObject<HTMLDivElement | null>;
  pill: RefObject<HTMLDivElement | null>;
  headline: RefObject<HTMLDivElement | null>;
  lower: RefObject<HTMLDivElement | null>;
  group: RefObject<HTMLDivElement | null>;
  label: RefObject<HTMLDivElement | null>;
  foot: RefObject<HTMLDivElement | null>;
  plates: RefObject<(HTMLLIElement | null)[]>;
  sheens: RefObject<(HTMLSpanElement | null)[]>;
}

export const createBeatRefs = (): BeatRefs => ({
  section: createRef(),
  stage: createRef(),
  copy: createRef(),
  pill: createRef(),
  headline: createRef(),
  lower: createRef(),
  group: createRef(),
  label: createRef(),
  foot: createRef(),
  plates: { current: [] },
  sheens: { current: [] },
});

export interface BeatMetrics extends StageMetrics {
  /** Document offset where the beat starts, and how many pixels of scroll it lasts. */
  readonly top: number;
  readonly travel: number;
  /** Vertical distance from the headline's resting place to the stage centre. */
  readonly headlineShift: number;
}

export interface BeatFrame {
  readonly p: number;
  /** Seconds, for idle breathing. */
  readonly time: number;
  /** Seconds since the scene started, for the fly-in. */
  readonly intro: number;
  readonly pointerX: number;
  readonly pointerY: number;
}

/** The frame shown when motion is reduced: the deck at rest, fully arrived. */
export const STILL_FRAME: BeatFrame = { p: 0, time: 0, intro: Number.MAX_SAFE_INTEGER, pointerX: 0, pointerY: 0 };

const MIN_BLUR_PX = 0.2;
const SHEEN_PER_DEG = 1.15;
const SHEEN_LIMIT = 32;
const LITE_COPY_OUT = [0.05, 0.5] as const;
const COPY_LIFT_PX = 28;
const COPY_BLUR_PX = 6;
const LABEL_RISE_PX = 16;
const FOOT_OUT = [0, 0.06] as const;
const IDLE_TILT = { x: 0.7, y: 1.1, xRate: 0.21, yRate: 0.17, sheenFromTilt: 2.5 } as const;

export function measureBeat(refs: BeatRefs, mode: StageMode, count: number): BeatMetrics | null {
  const stage = refs.stage.current;
  const section = refs.section.current;
  const plate = refs.plates.current[0];
  const copy = refs.copy.current;
  const headline = refs.headline.current;
  if (!stage || !section || !plate || !copy || !headline) return null;
  const width = stage.offsetWidth;
  const height = stage.offsetHeight;
  const full = mode === 'full';
  return {
    width,
    height,
    plateW: plate.offsetWidth,
    plateH: plate.offsetHeight,
    count,
    headerH: HEADER_H,
    lite: isLiteLayout(mode, width, height, ROOMY),
    top: section.offsetTop,
    travel: full ? section.offsetHeight - height : section.offsetHeight,
    headlineShift: height / 2 - (copy.offsetTop + headline.offsetTop + headline.offsetHeight / 2),
  };
}

export const beatProgress = (scrollY: number, m: BeatMetrics): number => (m.travel > 0 ? clamp01((scrollY - m.top) / m.travel) : 0);

const blurFilter = (blurPx: number): string => (blurPx > MIN_BLUR_PX ? `blur(${blurPx.toFixed(1)}px)` : 'none');

/** Fades an element out and takes it out of the tab order once it is gone. */
function fade(element: HTMLElement | null, gone: number, liftPx = 0): void {
  if (!element) return;
  element.style.opacity = (1 - gone).toFixed(3);
  element.style.transform = `translate3d(0,${(-gone * liftPx).toFixed(1)}px,0)`;
  element.style.filter = blurFilter(gone * COPY_BLUR_PX);
  element.style.visibility = gone >= 1 ? 'hidden' : 'visible';
}

function paintPlates(refs: BeatRefs, m: BeatMetrics, f: BeatFrame, tiltY: number, calm: number): void {
  refs.plates.current.forEach((slot, i) => {
    if (!slot) return;
    const pose = platePose(i, f.p, f.time, f.intro, m);
    slot.style.transform = poseTransform(pose);
    slot.style.opacity = pose.opacity.toFixed(3);
    const focus = slot.firstElementChild;
    if (focus instanceof HTMLElement) focus.style.filter = blurFilter(pose.blur);
    // Frost only once a plate has landed. In flight, backdrop-filter on a rotated, defocused
    // plate drew hard-edged boxes around soft plates; plain translucent glass reads better there.
    slot.classList.toggle('is-glass', !m.lite && settleAmount(i, f.p) >= 1);
    const sheen = refs.sheens.current[i];
    if (!sheen) return;
    const sweep = Math.max(-SHEEN_LIMIT, Math.min(SHEEN_LIMIT, (pose.ry + tiltY * IDLE_TILT.sheenFromTilt) * SHEEN_PER_DEG));
    sheen.style.transform = `translate3d(${sweep.toFixed(2)}%,0,0)`;
    sheen.style.opacity = calm.toFixed(3);
  });
}

function paintLabel(refs: BeatRefs, m: BeatMetrics, p: number): void {
  const label = refs.label.current;
  if (!label) return;
  const shown = ease(span(p, TIMELINE.label[0], TIMELINE.label[1]));
  const slot = wallSlot(0, m);
  label.style.transform = `translate3d(${slot.x}px,${(slot.y + (1 - shown) * LABEL_RISE_PX).toFixed(1)}px,0) scale(${slot.scale.toFixed(4)})`;
  label.style.opacity = shown.toFixed(3);
  label.style.visibility = shown <= 0 ? 'hidden' : 'visible';
}

function paintCopy(refs: BeatRefs, m: BeatMetrics, p: number): void {
  if (m.lite) {
    const gone = ease(span(p, LITE_COPY_OUT[0], LITE_COPY_OUT[1]));
    fade(refs.pill.current, gone);
    fade(refs.headline.current, gone);
    fade(refs.lower.current, gone);
    return;
  }
  const gone = ease(span(p, TIMELINE.copyOut[0], TIMELINE.copyOut[1]));
  fade(refs.pill.current, gone, COPY_LIFT_PX);
  fade(refs.lower.current, gone, -COPY_LIFT_PX);
  const headline = refs.headline.current;
  if (headline) {
    const pose = headlinePose(p, m.headlineShift, m);
    headline.style.transform = `translate3d(${pose.x.toFixed(1)}px,${pose.y.toFixed(1)}px,0) scale(${pose.scale.toFixed(4)})`;
    headline.style.opacity = pose.opacity.toFixed(3);
    headline.style.filter = blurFilter(pose.blur);
  }
  paintLabel(refs, m, p);
}

export function paintBeat(refs: BeatRefs, m: BeatMetrics, f: BeatFrame): void {
  // The cursor tilts the whole scene; the tilt eases out as the wall forms so its type stays sharp.
  const calm = m.lite ? 1 : 1 - ease(span(f.p, TIMELINE.settleStart, TIMELINE.settled));
  const tiltX = (-f.pointerY * TILT_DEG.x + Math.sin(f.time * IDLE_TILT.xRate) * IDLE_TILT.x) * calm;
  const tiltY = (f.pointerX * TILT_DEG.y + Math.sin(f.time * IDLE_TILT.yRate) * IDLE_TILT.y) * calm;
  const group = refs.group.current;
  if (group) {
    group.style.transform = `rotateX(${tiltX.toFixed(3)}deg) rotateY(${tiltY.toFixed(3)}deg)`;
    group.toggleAttribute('data-settled', !m.lite && f.p >= TIMELINE.settled);
  }
  paintPlates(refs, m, f, tiltY, calm);
  paintCopy(refs, m, f.p);
  const foot = refs.foot.current;
  if (foot) foot.style.opacity = (1 - span(f.p, FOOT_OUT[0], FOOT_OUT[1])).toFixed(3);
}
