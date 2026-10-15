import { MotionConfig, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react';
import { useRef } from 'react';

import { CATEGORY_LABELS } from '@/data/home';
import { legendOf, type PlateData } from '@/lib/scene/plates';
import { APPROVAL_SLICE, STILL_BEAT_PROGRESS } from '@/lib/signal/timeline';

import { ApprovalBeat } from '../approval/ApprovalBeat';
import { usePointerSample } from '../hooks/usePointerSample';
import { useRefraction } from '../hooks/useRefraction';
import { useStageMode } from '../hooks/useStageMode';
import { DepthStage } from './DepthStage';
import { useKeepHashTarget } from './useKeepHashTarget';
import { useSkyProgress } from './useSkyProgress';
import { WorkList } from './WorkList';

/** Scroll drives the approval sequence through a short spring, so the scrub glides instead of stepping with the wheel. */
const SCRUB_SPRING = { stiffness: 150, damping: 30, mass: 0.35 } as const;

function HomeStage({ plates }: { readonly plates: readonly PlateData[] }) {
  const mode = useStageMode();
  const still = mode === 'still';
  const pointer = usePointerSample();
  const refracts = useRefraction();
  const trackRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });
  const scrubbed = useTransform(useSpring(scrollYProgress, SCRUB_SPRING), [0, 1], [...APPROVAL_SLICE]);
  const settled = useMotionValue(STILL_BEAT_PROGRESS);
  useSkyProgress(scrubbed, !still);
  useKeepHashTarget(mode);
  const legend = legendOf(plates, CATEGORY_LABELS);

  return (
    <div className="home-root" data-live={still ? undefined : ''} data-refract={refracts || undefined}>
      <DepthStage mode={mode} plates={plates} legend={legend} signalPointer={pointer} />
      {mode !== 'full' && <WorkList plates={plates} legend={legend} />}
      <ApprovalBeat trackRef={trackRef} progress={still ? settled : scrubbed} still={still} pointer={pointer} />
    </div>
  );
}

/** The home page's island: the plate scene, then the approval sequence. */
export default function Home({ plates }: { readonly plates: readonly PlateData[] }) {
  return (
    <MotionConfig reducedMotion="user">
      <HomeStage plates={plates} />
    </MotionConfig>
  );
}
