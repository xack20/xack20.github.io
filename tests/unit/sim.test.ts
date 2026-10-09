import { describe, expect, it } from 'vitest';
import {
  ATTRACT_RADIUS, MAX_LINK_ALPHA, MAX_SPEED, MAX_STARS, MIN_STARS, TOUCH_STARS,
  createStars, linkAlpha, starCount, stepStar, stepStars, type Star,
} from '../../src/lib/constellation/sim';

function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const OPTS = { width: 1000, height: 600, pointer: null, dpr: 1 };

describe('starCount', () => {
  it('uses a light field on touch screens', () => expect(starCount(390, 844, true)).toBe(TOUCH_STARS));
  it('matches the mockup density on a 1440×900 desktop', () => expect(starCount(1440, 900, false)).toBe(110));
  it('never drops below the minimum or above the maximum', () => {
    expect(starCount(300, 300, false)).toBe(MIN_STARS);
    expect(starCount(3840, 2160, false)).toBe(MAX_STARS);
  });
});

describe('createStars', () => {
  it('places every star inside the canvas with a bounded speed', () => {
    const stars = createStars(50, 1000, 600, seeded(1));
    expect(stars).toHaveLength(50);
    stars.forEach((s) => {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(1000);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThanOrEqual(600);
      expect(Math.abs(s.vx)).toBeLessThanOrEqual(MAX_SPEED / 2);
      expect(Math.abs(s.vy)).toBeLessThanOrEqual(MAX_SPEED / 2);
    });
  });

  it('scales speed and size by the device pixel ratio', () => {
    const one = createStars(1, 100, 100, seeded(2), 1)[0];
    const two = createStars(1, 100, 100, seeded(2), 2)[0];
    expect(two.vx).toBeCloseTo(one.vx * 2);
  });

  it('is deterministic for a given random source', () => {
    expect(createStars(5, 100, 100, seeded(3))).toEqual(createStars(5, 100, 100, seeded(3)));
  });
});

describe('stepStar', () => {
  const star: Star = Object.freeze({ x: 500, y: 300, vx: 0.1, vy: -0.1, r: 1 });

  it('moves by its velocity and does not mutate the input', () => {
    const next = stepStar(star, OPTS);
    expect(next.x).toBeCloseTo(500.1);
    expect(next.y).toBeCloseTo(299.9);
    expect(star.x).toBe(500);
  });

  it('bounces off an edge it is moving past', () => {
    const atEdge: Star = { x: 1000.05, y: 300, vx: 0.1, vy: 0, r: 1 };
    expect(stepStar(atEdge, OPTS).vx).toBe(-0.1);
  });

  it('is pulled toward a nearby pointer', () => {
    const next = stepStar({ ...star, vx: 0, vy: 0 }, { ...OPTS, pointer: { x: 600, y: 300 } });
    expect(next.x).toBeGreaterThan(500);
  });

  it('ignores a pointer outside the attraction radius', () => {
    const far = { x: 500 + ATTRACT_RADIUS + 10, y: 300 };
    expect(stepStar({ ...star, vx: 0, vy: 0 }, { ...OPTS, pointer: far }).x).toBe(500);
  });

  it('steps every star into a new array', () => {
    const stars = [star, star];
    const next = stepStars(stars, OPTS);
    expect(next).not.toBe(stars);
    expect(next).toHaveLength(2);
  });
});

describe('linkAlpha', () => {
  it('fades links out with distance', () => {
    expect(linkAlpha(0, 150)).toBeCloseTo(MAX_LINK_ALPHA);
    expect(linkAlpha(75, 150)).toBeCloseTo(MAX_LINK_ALPHA / 2);
    expect(linkAlpha(150, 150)).toBe(0);
    expect(linkAlpha(400, 150)).toBe(0);
  });
});
