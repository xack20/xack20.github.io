import { describe, expect, it } from 'vitest';
import {
  clamp01, ease, fanAmount, headlinePose, isLiteLayout, lerp, platePose, poseTransform, ringSpin, settleAmount, span, TIMELINE, wallFit, wallPose, wallSlot,
  type Pose, type StageMetrics,
} from '../../src/lib/scene/choreography';

const DESKTOP: StageMetrics = Object.freeze({ width: 1440, height: 900, plateW: 296, plateH: 204, count: 11, headerH: 64, lite: false });
const CRAMPED: StageMetrics = Object.freeze({ ...DESKTOP, width: 1024, height: 640, plateW: 236 });
const PHONE: StageMetrics = Object.freeze({ ...DESKTOP, width: 390, height: 844, plateW: 236, lite: true });
/** Long after the fly-in has finished. */
const ARRIVED = 99;
const PLATES = Array.from({ length: DESKTOP.count }, (_, i) => i);
const numbers = (pose: Pose): number[] => Object.values(pose);

describe('helpers', () => {
  it('clamps, interpolates and maps a value onto a window', () => {
    expect([clamp01(-1), clamp01(0.4), clamp01(2)]).toEqual([0, 0.4, 1]);
    expect(lerp(10, 20, 0.25)).toBe(12.5);
    expect([span(0, 2, 4), span(3, 2, 4), span(9, 2, 4)]).toEqual([0, 0.5, 1]);
  });

  it('eases from 0 to 1 through the middle', () => {
    expect([ease(0), ease(0.5), ease(1)]).toEqual([0, 0.5, 1]);
    expect(ease(0.25)).toBeLessThan(0.25);
    expect(ease(0.75)).toBeGreaterThan(0.75);
  });

  it('turns the ring further as the scroll goes on', () => {
    expect(ringSpin(0)).toBe(0);
    expect(ringSpin(0.5)).toBeGreaterThan(ringSpin(0.25));
    expect(ringSpin(1)).toBeGreaterThan(ringSpin(0.5));
  });
});

describe('platePose on a roomy screen', () => {
  it.each(PLATES)('plate %i rests behind the headline, out of focus', (i) => {
    const rest = platePose(i, 0, 0, ARRIVED, DESKTOP);

    expect(rest.z).toBeLessThan(0);
    expect(rest.blur).toBeGreaterThan(0);
    expect(rest.opacity).toBeGreaterThan(0);
  });

  it.each(PLATES)('plate %i lands flat and sharp in its wall slot', (i) => {
    const slot = wallSlot(i + 1, DESKTOP);

    for (const progress of [TIMELINE.settled, 1]) {
      expect(platePose(i, progress, 5, ARRIVED, DESKTOP)).toEqual({ ...slot, z: 0, rx: 0, ry: 0, rz: 0, blur: 0, opacity: 1 });
    }
  });

  it('puts plates both in front of and behind the headline in mid orbit', () => {
    const depths = PLATES.map((i) => platePose(i, 0.45, 0, ARRIVED, DESKTOP).z);

    expect(depths.some((z) => z > 100)).toBe(true);
    expect(depths.some((z) => z < -100)).toBe(true);
  });

  it('starts every plate unseen and far away, then flies it in', () => {
    const first = platePose(0, 0, 0, 0, DESKTOP);
    const last = platePose(DESKTOP.count - 1, 0, 0, 0.3, DESKTOP);

    expect(first.opacity).toBe(0);
    expect(last.opacity).toBe(0);
    expect(first.z).toBeLessThan(platePose(0, 0, 0, ARRIVED, DESKTOP).z);
  });

  it('keeps a plate in flight until its own fly-in is done, even where the wall has formed', () => {
    const arriving = platePose(0, 1, 0, 0.5, DESKTOP);

    expect(arriving.opacity).toBeGreaterThan(0);
    expect(arriving.opacity).toBeLessThan(1);
    expect(arriving).not.toEqual(wallPose(0, DESKTOP));
  });

  it.each([DESKTOP, CRAMPED])('gives finite poses at the start, the middle and the end ($width x $height)', (metrics) => {
    for (const progress of [0, 0.5, 1]) {
      for (const i of PLATES) {
        const pose = platePose(i, progress, 1.3, ARRIVED, metrics);

        expect(numbers(pose).every(Number.isFinite)).toBe(true);
        expect(pose.opacity).toBeGreaterThanOrEqual(0);
        expect(pose.opacity).toBeLessThanOrEqual(1);
      }
    }
  });

  it('does not change the metrics it is given', () => {
    expect(() => PLATES.forEach((i) => platePose(i, 0.6, 2, 1, DESKTOP))).not.toThrow();
    expect(DESKTOP).toEqual({ width: 1440, height: 900, plateW: 296, plateH: 204, count: 11, headerH: 64, lite: false });
  });
});

describe('the wall', () => {
  it('gives the label and every plate a slot of its own', () => {
    const slots = Array.from({ length: DESKTOP.count + 1 }, (_, slot) => wallSlot(slot, DESKTOP));

    expect(new Set(slots.map((slot) => `${slot.x},${slot.y}`)).size).toBe(slots.length);
  });

  it('keeps neighbouring slots at least a plate apart, so plates never overlap', () => {
    const slots = Array.from({ length: DESKTOP.count + 1 }, (_, slot) => wallSlot(slot, DESKTOP));

    slots.forEach((a, index) => {
      slots.slice(index + 1).forEach((b) => {
        const apartX = Math.abs(a.x - b.x) >= DESKTOP.plateW * a.scale;
        const apartY = Math.abs(a.y - b.y) >= DESKTOP.plateH * a.scale;
        expect(apartX || apartY).toBe(true);
      });
    });
  });

  it('is full size on a roomy screen and sits on whole pixels', () => {
    const slot = wallSlot(5, DESKTOP);

    expect(wallFit(DESKTOP)).toBe(1);
    expect(Number.isInteger(slot.x) && Number.isInteger(slot.y)).toBe(true);
  });

  it('shrinks to stay on a short screen, below the header', () => {
    const fit = wallFit(CRAMPED);
    const first = wallSlot(0, CRAMPED);
    const last = wallSlot(CRAMPED.count, CRAMPED);

    expect(fit).toBeLessThan(1);
    expect(last.y + (CRAMPED.plateH * fit) / 2).toBeLessThanOrEqual(CRAMPED.height / 2);
    expect(first.y - (CRAMPED.plateH * fit) / 2).toBeGreaterThanOrEqual(CRAMPED.headerH - CRAMPED.height / 2);
  });
});

describe('platePose on a phone', () => {
  it('never settles into a wall: the stack scatters past the camera instead', () => {
    const end = PLATES.map((i) => platePose(i, 1, 0, ARRIVED, PHONE));

    end.forEach((pose, i) => expect(pose).not.toEqual(wallPose(i, PHONE)));
    expect(end.some((pose) => pose.z > 0)).toBe(true);
  });

  it('rests as one stack low on the screen with the first case study in front', () => {
    const front = platePose(0, 0, 0, ARRIVED, PHONE);
    const back = platePose(PHONE.count - 1, 0, 0, ARRIVED, PHONE);

    expect(front.y).toBeGreaterThan(0);
    expect(front.z).toBeGreaterThan(back.z);
  });

  it('gives finite poses along the whole scroll', () => {
    for (const progress of [0, 0.3, 0.7, 1]) {
      PLATES.forEach((i) => expect(numbers(platePose(i, progress, 2.1, ARRIVED, PHONE)).every(Number.isFinite)).toBe(true));
    }
  });
});

describe('timing', () => {
  it('peels the outer plates of each stack away first', () => {
    const early = TIMELINE.fanStart + 0.08;

    expect(fanAmount(0, early, DESKTOP.count)).toBeGreaterThan(fanAmount(5, early, DESKTOP.count));
    expect(fanAmount(0, 0, DESKTOP.count)).toBe(0);
    expect(fanAmount(5, 1, DESKTOP.count)).toBe(1);
  });

  it('settles the plates one after another and has all of them down by the settled mark', () => {
    const mid = TIMELINE.settleStart + 0.1;

    expect(settleAmount(0, mid)).toBeGreaterThan(settleAmount(10, mid));
    expect(settleAmount(0, TIMELINE.settleStart)).toBe(0);
    PLATES.forEach((i) => expect(settleAmount(i, TIMELINE.settled)).toBe(1));
  });
});

describe('headlinePose', () => {
  const SHIFT = -40;

  it('leaves the headline where it is before the scroll starts', () => {
    const start = headlinePose(0, SHIFT, DESKTOP);

    expect(start.x).toBeCloseTo(0);
    expect(start.y).toBeCloseTo(0);
    expect(start).toMatchObject({ scale: 1, opacity: 1, blur: 0 });
  });

  it('recentres it for the orbit', () => {
    const centred = headlinePose(TIMELINE.fanStart + TIMELINE.fanSpan, SHIFT, DESKTOP);

    expect(centred.y).toBeCloseTo(SHIFT);
    expect(centred.scale).toBeCloseTo(0.88);
    expect(centred.opacity).toBe(1);
  });

  it('hands over to the label slot, small and gone', () => {
    const label = wallSlot(0, DESKTOP);
    const handed = headlinePose(TIMELINE.handover[1], SHIFT, DESKTOP);

    expect(handed).toMatchObject({ x: label.x, y: label.y, opacity: 0, blur: 8 });
    expect(handed.scale).toBeCloseTo(0.34);
  });
});

describe('poseTransform', () => {
  it('writes a pose as one CSS transform', () => {
    const pose: Pose = { x: 1.234, y: -2, z: 30, rx: 4, ry: -5.5, rz: 0, scale: 0.94, blur: 0, opacity: 1 };

    expect(poseTransform(pose)).toBe('translate3d(1.23px,-2.00px,30.00px) rotateX(4.00deg) rotateY(-5.50deg) rotateZ(0.00deg) scale(0.9400)');
  });
});

describe('isLiteLayout', () => {
  const ROOMY = { minWidth: 1024, minHeight: 640 } as const;

  it('never plays the lite layout in full mode, even when the stage measures under the threshold', () => {
    // The full mode's media query counts a classic scrollbar; the stage width does not.
    expect(isLiteLayout('full', 1009, 900, ROOMY)).toBe(false);
  });

  it('always plays the lite layout in lite mode', () => {
    expect(isLiteLayout('lite', 1440, 900, ROOMY)).toBe(true);
  });

  it('decides by size under reduced motion, so a big still screen keeps the flanking stacks', () => {
    expect(isLiteLayout('still', 1440, 900, ROOMY)).toBe(false);
    expect(isLiteLayout('still', 390, 844, ROOMY)).toBe(true);
    expect(isLiteLayout('still', 1440, 600, ROOMY)).toBe(true);
  });
});
