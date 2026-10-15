import { describe, expect, it } from 'vitest';
import {
  APPROVAL_SLICE, BEAT, clamp01, easeIn, easeOut, GATE_LIT, lerp, smooth, staggered, STILL_BEAT_PROGRESS, TOKEN_SPENT, within, type Span,
} from '../../src/lib/signal/timeline';

const SPANS = Object.entries(BEAT) as readonly (readonly [string, Span])[];

describe('within', () => {
  it('says where a progress sits inside a span', () => {
    expect(within(0.3, [0.2, 0.4])).toBeCloseTo(0.5);
    expect(within(0.2, [0.2, 0.4])).toBe(0);
    expect(within(0.4, [0.2, 0.4])).toBe(1);
  });

  it('clamps before the span and after it', () => {
    expect(within(0, [0.2, 0.4])).toBe(0);
    expect(within(1, [0.2, 0.4])).toBe(1);
  });
});

describe('staggered', () => {
  const SPAN: Span = [0.1, 0.5];

  it('starts the first item with the span and ends the last one with it', () => {
    expect(staggered(SPAN, 0, 3)[0]).toBeCloseTo(SPAN[0]);
    expect(staggered(SPAN, 2, 3)[1]).toBeCloseTo(SPAN[1]);
  });

  it('gives every item a slice of the same length, each starting after the one before', () => {
    const slices = [0, 1, 2].map((index) => staggered(SPAN, index, 3));
    const lengths = slices.map(([start, end]) => end - start);

    lengths.forEach((length) => expect(length).toBeCloseTo(lengths[0] ?? 0));
    expect(slices[1]?.[0]).toBeGreaterThan(slices[0]?.[0] ?? 0);
    expect(slices[2]?.[0]).toBeGreaterThan(slices[1]?.[0] ?? 0);
  });

  it('runs the items back to back when they do not overlap', () => {
    expect(staggered(SPAN, 0, 2, 0)[1]).toBeCloseTo(staggered(SPAN, 1, 2, 0)[0]);
  });

  it('gives a single item the whole span', () => {
    const [start, end] = staggered(SPAN, 0, 1);

    expect(start).toBeCloseTo(SPAN[0]);
    expect(end).toBeCloseTo(SPAN[1]);
  });
});

describe('the approval timeline', () => {
  it.each(SPANS)('%s is a forward span inside 0..1', (_name, [start, end]) => {
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeLessThanOrEqual(1);
    expect(end).toBeGreaterThan(start);
  });

  it('runs in order: gather, propose to approve, approve, approve to commit, run on', () => {
    expect(BEAT.gather[1]).toBe(BEAT.toApprove[0]);
    expect(BEAT.toApprove[1]).toBeLessThan(BEAT.approve[0]);
    expect(BEAT.approve[1]).toBe(BEAT.toCommit[0]);
    expect(BEAT.toCommit[1]).toBe(BEAT.runOn[0]);
  });

  it('shows the gates before the signal reaches the first one, and forms the token before a person approves', () => {
    expect(BEAT.gatesIn[0]).toBeLessThan(BEAT.gather[1]);
    expect(BEAT.calm[1]).toBeLessThanOrEqual(BEAT.gather[1]);
    expect(BEAT.tokenIn[1]).toBeLessThan(BEAT.approve[0]);
  });

  it('lights the gates in order: propose, approve, commit', () => {
    expect(GATE_LIT.propose[1]).toBeLessThan(GATE_LIT.approve[0]);
    expect(GATE_LIT.approve[1]).toBeLessThan(GATE_LIT.commit[0]);
  });

  it('plays from the restless bundle to the still frame', () => {
    expect(APPROVAL_SLICE[0]).toBeLessThan(BEAT.calm[0]);
    expect(APPROVAL_SLICE[1]).toBe(STILL_BEAT_PROGRESS);
  });

  it('has all three gates passed and the token spent in the still frame', () => {
    (['propose', 'approve', 'commit'] as const).forEach((gate) => expect(within(STILL_BEAT_PROGRESS, GATE_LIT[gate])).toBe(1));
    expect(within(STILL_BEAT_PROGRESS, TOKEN_SPENT)).toBe(1);
  });
});

describe('easing', () => {
  it.each([['smooth', smooth], ['easeOut', easeOut], ['easeIn', easeIn]] as const)('%s runs from 0 to 1', (_name, curve) => {
    expect(curve(0)).toBe(0);
    expect(curve(1)).toBe(1);
    expect(curve(0.5)).toBeGreaterThan(0);
    expect(curve(0.5)).toBeLessThan(1);
  });

  it('starts fast with easeOut and slow with easeIn', () => {
    expect(easeOut(0.25)).toBeGreaterThan(0.25);
    expect(easeIn(0.25)).toBeLessThan(0.25);
    expect(smooth(0.5)).toBe(0.5);
  });

  it('clamps and interpolates', () => {
    expect([clamp01(-0.2), clamp01(0.3), clamp01(1.4)]).toEqual([0, 0.3, 1]);
    expect(lerp(2, 6, 0.5)).toBe(4);
  });
});
