import type { Ref } from 'react';

import { HOME_LABELS } from '@/data/home';
import { SITE } from '@/data/site';
import type { LegendEntry } from '@/lib/scene/plates';

interface Props {
  readonly footRef: Ref<HTMLDivElement>;
  readonly legend: readonly LegendEntry[];
  readonly count: number;
}

/** Small print along the bottom of the first screen; it fades as soon as the beat starts. */
export function StageFoot({ footRef, legend, count }: Props) {
  return (
    <div ref={footRef} className="scene-foot">
      <p className="scene-foot__side">{SITE.location}</p>
      <p className="scene-foot__cue" aria-hidden="true">
        <span />
        {HOME_LABELS.scroll}
      </p>
      <p className="scene-foot__side scene-foot__side--end">
        {legend.map((entry) => (
          <i key={entry.category} data-category={entry.category} aria-hidden="true" />
        ))}
        {HOME_LABELS.caseStudies(count)}
      </p>
    </div>
  );
}
