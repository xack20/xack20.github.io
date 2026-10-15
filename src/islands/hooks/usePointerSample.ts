import { useEffect, useRef, type RefObject } from 'react';

export interface PointerSample {
  /** Client coordinates of the last mouse or pen position. */
  readonly x: number;
  readonly y: number;
  /** False until the pointer has moved, and again once it leaves the window. */
  readonly inside: boolean;
}

const AWAY: PointerSample = { x: 0, y: 0, inside: false };

/** Latest mouse position in a ref, so canvases can read it every frame without re-rendering React. */
export const usePointerSample = (): RefObject<PointerSample> => {
  const sample = useRef<PointerSample>(AWAY);

  useEffect(() => {
    const onMove = (event: PointerEvent): void => {
      if (event.pointerType === 'touch') return;
      sample.current = { x: event.clientX, y: event.clientY, inside: true };
    };
    const onLeave = (): void => {
      sample.current = { ...sample.current, inside: false };
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return sample;
};
