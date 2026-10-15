import { motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react';
import { useState, type CSSProperties, type RefObject } from 'react';

import { HOME_LABELS } from '@/data/home';
import type { LegendEntry, PlateData } from '@/lib/scene/plates';

import type { PointerSample } from '../hooks/usePointerSample';
import type { StageMode } from '../hooks/useStageMode';
import { createBeatRefs } from '../scene/beat';
import { BEAT_SCROLL_VH, PERSPECTIVE_PX, WALL_ANCHOR } from '../scene/constants';
import { DepthParticles } from '../scene/DepthParticles';
import { Plate } from '../scene/Plate';
import { StageFoot } from '../scene/StageFoot';
import { useDepthBeat } from '../scene/useDepthBeat';
import { WorkLegend } from '../scene/WorkLegend';
import { SignalCanvas } from '../signal/SignalCanvas';
import { HeroCopy } from './HeroCopy';

const WALL_HEADING_ID = 'home-wall-title';
/** The ribbon leaves as the plates start to orbit, and stops drawing once it has gone. */
const RIBBON_OUT = [0.02, 0.26] as const;

/** The stylesheet reads the beat's length, anchor and perspective from the same constants the scene uses. */
const STAGE_VARS = {
  '--scene-beat-scroll': `${BEAT_SCROLL_VH}vh`,
  '--scene-wall-anchor': WALL_ANCHOR,
  '--scene-perspective': `${PERSPECTIVE_PX}px`,
} as CSSProperties;

interface Props {
  readonly mode: StageMode;
  readonly plates: readonly PlateData[];
  readonly legend: readonly LegendEntry[];
  readonly signalPointer: RefObject<PointerSample>;
}

/**
 * The first screen and its scroll beat: two decks of plates either side of the headline, the
 * signal's ribbon as a horizon, then the plates orbit the headline and settle into the wall.
 * The headline and the plates share one 3D rendering context, so plates pass in front of and behind it.
 */
export function DepthStage({ mode, plates, legend, signalPointer }: Props) {
  const [refs] = useState(createBeatRefs);
  const { progress, pointer } = useDepthBeat(mode, refs, plates.length);
  const full = mode === 'full';
  const still = mode === 'still';
  const restless = useMotionValue(0);
  const ribbonOpacity = useTransform(progress, [...RIBBON_OUT], [1, 0]);
  const [ribbonOn, setRibbonOn] = useState(true);
  useMotionValueEvent(progress, 'change', (value) => setRibbonOn(value < RIBBON_OUT[1]));
  /** Tabbing onto a plate before the wall has formed jumps the scroll to where it has. */
  const scrollToWall = (): void => {
    if (!refs.group.current?.hasAttribute('data-settled')) document.getElementById('work')?.scrollIntoView({ block: 'start' });
  };

  return (
    <section ref={refs.section} className="scene-beat" data-mode={mode} style={STAGE_VARS} aria-label="Introduction">
      {/* First in the section, so after following #work the next Tab lands on the plates. */}
      {full && <span id="work" className="scene-anchor" />}
      <div className="home-particles" aria-hidden="true">
        <DepthParticles progress={progress} pointer={pointer} animate={!still} />
      </div>
      <div ref={refs.stage} className="scene-stage">
        {ribbonOn && (
          <motion.div className="home-ribbon" style={{ opacity: ribbonOpacity }}>
            <SignalCanvas progress={restless} still={still} pointer={signalPointer} />
          </motion.div>
        )}
        <div className="scene-world">
          <HeroCopy refs={refs} live={!still} />
          <div ref={refs.group} className="scene-group">
            {full && (
              <>
                {/* The visible label stays hidden until the wall forms, so the heading for assistive
                    technology lives here, always present, ahead of the plates' own headings. */}
                <h2 id={WALL_HEADING_ID} className="sr-only">
                  {HOME_LABELS.work}
                </h2>
                <div ref={refs.label} className="scene-wall-label" style={{ opacity: 0, visibility: 'hidden' }}>
                  <WorkLegend legend={legend} count={plates.length} />
                </div>
              </>
            )}
            <ol className="scene-deck" aria-hidden={full ? undefined : true} aria-labelledby={full ? WALL_HEADING_ID : undefined} onFocusCapture={full ? scrollToWall : undefined}>
              {plates.map((item, index) => (
                <li
                  key={item.slug}
                  ref={(element) => {
                    refs.plates.current[index] = element;
                  }}
                  className="scene-deck__slot"
                  style={{ opacity: 0 }}
                >
                  {/* Depth-of-field blur lives on this wrapper, not on the slot: a slot that carried
                      both a filter and the backdrop frost drew the frost as a stray hard-edged box. */}
                  <div className="scene-deck__focus">
                    <Plate
                      item={item}
                      interactive={full}
                      sheenRef={(element) => {
                        refs.sheens.current[index] = element;
                      }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <StageFoot footRef={refs.foot} legend={legend} count={plates.length} />
      </div>
    </section>
  );
}
