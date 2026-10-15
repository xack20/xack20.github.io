import { HOME_LABELS } from '@/data/home';
import type { LegendEntry } from '@/lib/scene/plates';

interface Props {
  /** The id for the section heading. Without one the title is drawn but is not a heading (the caller supplies it). */
  readonly headingId?: string;
  readonly legend: readonly LegendEntry[];
  readonly count: number;
}

/** The small section label the headline hands over to: name, count, and what each glow means. */
export function WorkLegend({ headingId, legend, count }: Props) {
  return (
    <>
      {headingId ? (
        <h2 id={headingId} className="scene-legend__title">
          {HOME_LABELS.work}
        </h2>
      ) : (
        <p className="scene-legend__title" aria-hidden="true">
          {HOME_LABELS.work}
        </p>
      )}
      <p className="scene-legend__count">{HOME_LABELS.caseStudies(count)}</p>
      <ul className="scene-legend__list">
        {legend.map((entry) => (
          <li key={entry.category} data-category={entry.category}>
            <i aria-hidden="true" />
            <span>{entry.label}</span>
            <span className="scene-legend__n">{entry.count}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
