import { BEAT, easeIn, lerp, smooth, within } from '@/lib/signal/timeline';

import { GATE_X, LINE_Y } from './layout';

/** How far past Commit the line has run by the end of "runs straight on", in stage diagonals. */
const RUN_ON_REACH = 1.9;
const GATHER_START_X = -60;
const HEAD_FADE_IN = 0.03;
const RING_LENGTH = 0.07;
/** A ring starts just before the head reaches its gate. */
const RING_LEAD = 0.01;

/** Everything a frame of the signal needs, derived from the progress and the stage size. */
export interface Scene {
  readonly width: number;
  readonly height: number;
  /** Height of the line. */
  readonly lineY: number;
  readonly proposeX: number;
  readonly approveX: number;
  readonly commitX: number;
  /** Where the travelling head is, along the line. */
  readonly headX: number;
  readonly headVisible: number;
  /** 0 restless bundle, 1 a single calm line. */
  readonly calm: number;
  /** 0 before a person approves, 1 after. */
  readonly approved: number;
  /** Expanding rings as the head passes each gate: 0..1, or 0 when idle. */
  readonly ringPropose: number;
  readonly ringApprove: number;
  readonly ringCommit: number;
}

/** 0 before the head arrives (nothing drawn), then 0..1 as the ring grows and fades. */
const ring = (progress: number, start: number): number => within(progress, [start, start + RING_LENGTH]);

export const sceneAt = (progress: number, width: number, height: number): Scene => {
  const proposeX = width * GATE_X.propose;
  const approveX = width * GATE_X.approve;
  const commitX = width * GATE_X.commit;
  const reach = Math.hypot(width, height) * RUN_ON_REACH;
  const headX =
    lerp(GATHER_START_X, proposeX, smooth(within(progress, BEAT.gather))) +
    (approveX - proposeX) * smooth(within(progress, BEAT.toApprove)) +
    (commitX - approveX) * smooth(within(progress, BEAT.toCommit)) +
    reach * easeIn(within(progress, BEAT.runOn));
  return {
    width,
    height,
    lineY: height * lerp(LINE_Y.hero, LINE_Y.beat, smooth(within(progress, BEAT.settle))),
    proposeX,
    approveX,
    commitX,
    headX,
    headVisible: within(progress, [BEAT.gather[0], BEAT.gather[0] + HEAD_FADE_IN]),
    calm: smooth(within(progress, BEAT.calm)),
    approved: smooth(within(progress, BEAT.approve)),
    ringPropose: ring(progress, BEAT.gather[1] - RING_LEAD),
    ringApprove: ring(progress, BEAT.approve[0]),
    ringCommit: ring(progress, BEAT.toCommit[1] - RING_LEAD),
  };
};
