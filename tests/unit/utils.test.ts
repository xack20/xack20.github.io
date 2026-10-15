import { describe, expect, it } from 'vitest';
import { cn } from '../../src/lib/utils';

describe('cn', () => {
  it('joins class names and drops falsy ones', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b');
  });

  it('lets a later Tailwind class override an earlier one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
