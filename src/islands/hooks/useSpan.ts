import { useTransform, type MotionValue } from 'motion/react';

import type { Span } from '@/lib/signal/timeline';

/** Maps one window of the progress onto a value, clamped at both ends. */
export const useSpan = (progress: MotionValue<number>, span: Span, from = 0, to = 1): MotionValue<number> =>
  useTransform(progress, [span[0], span[1]], [from, to]);
