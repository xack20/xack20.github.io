import type { LegendEntry, PlateData } from '@/lib/scene/plates';

import { Plate } from '../scene/Plate';
import { WorkLegend } from '../scene/WorkLegend';

const HEADING_ID = 'home-work-list-title';

interface Props {
  readonly plates: readonly PlateData[];
  readonly legend: readonly LegendEntry[];
}

/** The case studies in normal page flow: the server render, phones, small windows and reduced motion. */
export function WorkList({ plates, legend }: Props) {
  return (
    <section id="work" className="scene-list" aria-labelledby={HEADING_ID}>
      <div className="scene-list__head">
        <WorkLegend headingId={HEADING_ID} legend={legend} count={plates.length} />
      </div>
      <ol className="scene-list__grid">
        {plates.map((item) => (
          <li key={item.slug}>
            <Plate item={item} interactive />
          </li>
        ))}
      </ol>
    </section>
  );
}
