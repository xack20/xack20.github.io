import { useSyncExternalStore } from 'react';

import { ROOMY } from '../scene/constants';

/**
 * still: reduced motion, and the server render. One still frame, case studies as a plain list.
 * lite:  phones and small windows. The deck is decoration; the list follows below.
 * full:  the scrubbed beat, where the plates themselves settle into the wall.
 */
export type StageMode = 'still' | 'lite' | 'full';

const REDUCED = '(prefers-reduced-motion: reduce)';
const ROOMY_QUERY = `(min-width: ${ROOMY.minWidth}px) and (min-height: ${ROOMY.minHeight}px)`;

const read = (): StageMode => (window.matchMedia(REDUCED).matches ? 'still' : window.matchMedia(ROOMY_QUERY).matches ? 'full' : 'lite');

function subscribe(onChange: () => void): () => void {
  const queries = [REDUCED, ROOMY_QUERY].map((query) => window.matchMedia(query));
  queries.forEach((query) => query.addEventListener('change', onChange));
  return () => queries.forEach((query) => query.removeEventListener('change', onChange));
}

const serverMode = (): StageMode => 'still';

export const useStageMode = (): StageMode => useSyncExternalStore(subscribe, read, serverMode);
