import { useEffect } from 'react';
import type { MotionValue } from 'motion/react';

const EVENT = 'sky:progress';

/**
 * Tells the page's sky canvas where the approval sequence is, so the cloud sinks behind the gates.
 * At most one event per frame, and only while motion is on.
 */
export function useSkyProgress(progress: MotionValue<number>, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    let queued = 0;
    const send = (): void => {
      queued = 0;
      window.dispatchEvent(new CustomEvent(EVENT, { detail: progress.get() }));
    };
    const stop = progress.on('change', () => {
      if (queued === 0) queued = requestAnimationFrame(send);
    });
    send();
    return () => {
      stop();
      if (queued !== 0) cancelAnimationFrame(queued);
    };
  }, [progress, enabled]);
}
