import { useEffect } from 'react';
import { useMotionValue, useSpring, type MotionValue } from 'motion/react';

import { POINTER_SPRING } from './constants';

export interface ScenePointer {
  readonly x: MotionValue<number>;
  readonly y: MotionValue<number>;
}

/** Mouse position as spring-smoothed -1..1 on each axis (0,0 at the centre, and on touch). */
export function usePointer(enabled: boolean): ScenePointer {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, POINTER_SPRING);
  const y = useSpring(rawY, POINTER_SPRING);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (event: PointerEvent): void => {
      if (event.pointerType !== 'mouse') return;
      rawX.set((event.clientX / window.innerWidth) * 2 - 1);
      rawY.set((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [enabled, rawX, rawY]);

  return { x, y };
}
