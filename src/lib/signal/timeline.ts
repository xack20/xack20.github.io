// The approval sequence as data. Every window is a [start, end] slice of one 0..1 progress,
// so the canvas, the gates and the sky behind them read the same clock.

export type Span = readonly [number, number];

export const BEAT = {
  /** The line settles from the horizon height to the gate height. */
  settle: [0.0, 0.14],
  /** Restless bundle calms and converges. */
  calm: [0.03, 0.24],
  /** Gates fade in, one after the other. */
  gatesIn: [0.13, 0.25],
  /** The signal gathers through the funnel and reaches Propose. */
  gather: [0.15, 0.26],
  /** Propose to Approve: thin and jittery. */
  toApprove: [0.26, 0.43],
  /** The glass token forms while the signal waits. */
  tokenIn: [0.36, 0.46],
  /** A person approves. */
  approve: [0.515, 0.56],
  /** Approve to Commit: steady and bright. */
  toCommit: [0.56, 0.69],
  /** After Commit it runs straight on. */
  runOn: [0.69, 0.8],
} as const satisfies Record<string, Span>;

export type GateId = 'propose' | 'approve' | 'commit';

/** How long the head of the signal takes to light a gate it passes through: just before it, to just after. */
const PASS = { before: 0.01, after: 0.02 } as const;

/** When each gate lights: as the head of the signal passes through it. */
export const GATE_LIT: Readonly<Record<GateId, Span>> = {
  propose: [BEAT.gather[1] - PASS.before, BEAT.gather[1] + PASS.after],
  approve: BEAT.approve,
  commit: [BEAT.toCommit[1] - PASS.before, BEAT.toCommit[1] + PASS.after],
};

/** The approval works once: after Commit the token's glow is spent. */
export const TOKEN_SPENT: Span = [BEAT.toCommit[1], BEAT.toCommit[1] + 0.05];

/** The still frame for reduced motion and the server render: all three gates passed. */
export const STILL_BEAT_PROGRESS = 0.74;

/** What scrolling through the sequence plays: restless bundle in, all three gates passed out. */
export const APPROVAL_SLICE: Span = [0.02, STILL_BEAT_PROGRESS];

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** Where p sits inside a span, clamped to 0..1. */
export const within = (p: number, [start, end]: Span): number => clamp01((p - start) / (end - start));
export const smooth = (v: number): number => v * v * (3 - 2 * v);
export const easeOut = (v: number): number => 1 - Math.pow(1 - v, 3);
export const easeIn = (v: number): number => v * v * v;

/** Each of `count` items gets its own slice of a span, overlapping by `overlap` (0..1). */
export const staggered = (span: Span, index: number, count: number, overlap = 0.6): Span => {
  const length = span[1] - span[0];
  const each = length / (1 + (count - 1) * (1 - overlap));
  const start = span[0] + index * each * (1 - overlap);
  return [start, start + each];
};
