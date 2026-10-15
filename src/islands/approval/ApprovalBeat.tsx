import type { MotionValue } from 'motion/react';
import type { RefObject } from 'react';

import { APPROVAL_GATES, HOME_LABELS } from '@/data/home';

import type { PointerSample } from '../hooks/usePointerSample';
import { SignalCanvas } from '../signal/SignalCanvas';
import { Gates } from './Gates';

const HEADING_ID = 'home-approval-title';

interface Props {
  readonly trackRef: RefObject<HTMLElement | null>;
  /** Position on the signal's timeline: scrubbed by scroll, or a fixed frame under reduced motion. */
  readonly progress: MotionValue<number>;
  readonly still: boolean;
  readonly pointer: RefObject<PointerSample>;
}

/** The approval sequence: the restless bundle calms into one line through Propose, Approve and Commit. */
export function ApprovalBeat({ trackRef, progress, still, pointer }: Props) {
  return (
    <section ref={trackRef} id="approval" className={still ? 'home-approval' : 'home-approval signal-track'} aria-labelledby={HEADING_ID}>
      <h2 id={HEADING_ID} className="sr-only">
        {HOME_LABELS.approvalHeading}
      </h2>
      <div className="signal-stage">
        <SignalCanvas progress={progress} still={still} pointer={pointer} />
        <Gates progress={progress} gates={APPROVAL_GATES} />
      </div>
    </section>
  );
}
