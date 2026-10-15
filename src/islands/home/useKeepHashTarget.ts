import { useEffect, useRef } from 'react';

import type { StageMode } from '../hooks/useStageMode';

/**
 * Arriving at /#contact (or any anchor) from another page, the browser scrolls on the server
 * render, which is the short still layout. When the moving layout replaces it the target has
 * moved, so scroll to it again, once, after that layout is in place.
 */
/** The hash without its '#', decoded; empty when it is missing or malformed (such as '#%'). */
const decodedHash = (hash: string): string => {
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return '';
  }
};

export function useKeepHashTarget(mode: StageMode): void {
  const done = useRef(false);
  useEffect(() => {
    if (mode === 'still' || done.current) return;
    done.current = true;
    const id = decodedHash(window.location.hash);
    if (!id) return;
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [mode]);
}
