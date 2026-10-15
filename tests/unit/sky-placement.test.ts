import { describe, expect, it } from 'vitest';
import { placeSky } from '../../src/lib/sky/placement';

const WIDE = { width: 1440, height: 900 } as const;
const PHONE = { width: 390, height: 844 } as const;

describe('placeSky', () => {
  it('keeps the cloud low, small and dim on inner pages, whatever the progress', () => {
    const start = placeSky(0, WIDE, 'inner');
    const later = placeSky(0.9, WIDE, 'inner');

    expect(later).toEqual(start);
    expect(start.anchorY).toBeLessThan(WIDE.height * 0.2);
    expect(start.gain).toBeLessThan(placeSky(0, WIDE, 'home').gain);
  });

  it('rests low on the right of the home page before the approval sequence starts', () => {
    const rest = placeSky(0, WIDE, 'home');

    expect(rest.anchorX).toBeGreaterThan(WIDE.width * 0.7);
    expect(rest.anchorY).toBeCloseTo(WIDE.height * 0.27);
    expect(rest.radius).toBeCloseTo(WIDE.height * 0.4);
  });

  it('sinks and dims behind the gates as the home progress crosses the sink span', () => {
    const rest = placeSky(0.03, WIDE, 'home');
    const half = placeSky(0.135, WIDE, 'home');
    const sunk = placeSky(0.24, WIDE, 'home');

    expect(half.anchorY).toBeLessThan(rest.anchorY);
    expect(half.anchorY).toBeGreaterThan(sunk.anchorY);
    expect(sunk.gain).toBeLessThan(rest.gain);
    expect(placeSky(1, WIDE, 'home')).toEqual(sunk);
  });

  it('clamps progress outside 0..1 to the nearest end', () => {
    expect(placeSky(-2, WIDE, 'home')).toEqual(placeSky(0, WIDE, 'home'));
    expect(placeSky(7, WIDE, 'home')).toEqual(placeSky(1, WIDE, 'home'));
  });

  it('uses a smaller cloud on a phone', () => {
    const phone = placeSky(0, PHONE, 'home');
    const wide = placeSky(0, WIDE, 'home');

    expect(phone.radius / PHONE.height).toBeLessThan(wide.radius / WIDE.height);
  });
});
