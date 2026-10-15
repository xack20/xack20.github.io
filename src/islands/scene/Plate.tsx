import type { Ref } from 'react';

import type { PlateData } from '@/lib/scene/plates';

import { PlateMark } from './PlateMark';
import { usePlateTilt } from './usePlateTilt';

interface PlateProps {
  readonly item: PlateData;
  /** A real link with a heading. False for the decorative deck behind the phone hero. */
  readonly interactive: boolean;
  /** The moving sheen; the scene drives it while the plate is flying. */
  readonly sheenRef?: Ref<HTMLSpanElement>;
}

/** One case study as a glass plate: number, name, domain and status, lit in its category's blue. */
export function Plate({ item, interactive, sheenRef }: PlateProps) {
  const tilt = usePlateTilt();
  const body = (
    <>
      <span ref={sheenRef} className="scene-plate__sheen" aria-hidden="true" />
      <span className="scene-plate__glare" aria-hidden="true" />
      <span className="scene-plate__top">
        <span className="scene-plate__num">{item.number}</span>
        <span className="scene-plate__org">{item.org}</span>
        <PlateMark seed={item.slug} mark={item.mark} />
      </span>
      {interactive ? <h3 className="scene-plate__title">{item.name}</h3> : <span className="scene-plate__title">{item.name}</span>}
      <span className="scene-plate__meta">
        <span>{item.domain}</span>
        <span>{item.year}</span>
      </span>
      <span className="scene-plate__status">
        <i aria-hidden="true" />
        {item.status}
      </span>
    </>
  );
  return interactive ? (
    <a className="scene-plate" data-category={item.category} href={item.href} {...tilt}>
      {body}
    </a>
  ) : (
    <div className="scene-plate" data-category={item.category}>
      {body}
    </div>
  );
}
