import { ArrowDownIcon, EnvelopeClosedIcon, GitHubLogoIcon, LinkedInLogoIcon } from '@radix-ui/react-icons';

import { BorderBeam } from '@/components/ui/border-beam';
import { HOME_LABELS } from '@/data/home';
import { LINKS, SITE } from '@/data/site';

import type { BeatRefs } from '../scene/beat';

const ICON_LINKS = [
  { label: 'GitHub', href: LINKS.github, Icon: GitHubLogoIcon },
  { label: 'LinkedIn', href: LINKS.linkedin, Icon: LinkedInLogoIcon },
  { label: 'Email', href: LINKS.email, Icon: EnvelopeClosedIcon },
] as const;
const BEAM = { size: 46, duration: 9 } as const;

interface HeroCopyProps {
  readonly refs: Pick<BeatRefs, 'copy' | 'pill' | 'headline' | 'lower'>;
  /** False under reduced motion: no travelling light on the pill. */
  readonly live: boolean;
}

/** The first screen's copy: where, the name and role, the introduction, two buttons and three links. */
export function HeroCopy({ refs, live }: HeroCopyProps) {
  return (
    <div ref={refs.copy} className="scene-copy">
      <div ref={refs.pill} className="scene-copy__part">
        <div className="scene-pill scene-enter scene-enter--pill">
          <i aria-hidden="true" />
          <p>{SITE.where}</p>
          {live && <BorderBeam size={BEAM.size} duration={BEAM.duration} />}
        </div>
      </div>

      <div ref={refs.headline} className="scene-copy__part">
        <h1 className="scene-headline">
          <span className="scene-headline__name scene-enter scene-enter--line scene-enter--name">{SITE.name}</span>
          <span className="scene-headline__role scene-enter scene-enter--line scene-enter--role">{SITE.role}</span>
        </h1>
      </div>

      <div ref={refs.lower} className="scene-copy__part scene-copy__lower">
        <p className="scene-lede scene-enter scene-enter--lede">{SITE.intro}</p>
        <div className="scene-actions scene-enter scene-enter--actions">
          <a className="scene-btn scene-btn--solid" href="#work">
            {HOME_LABELS.viewWork}
            <ArrowDownIcon aria-hidden="true" />
          </a>
          <a className="scene-btn scene-btn--glass" href={LINKS.email}>
            {HOME_LABELS.getInTouch}
          </a>
        </div>
        <div className="scene-icons scene-enter scene-enter--icons">
          {ICON_LINKS.map(({ label, href, Icon }) => (
            <a key={label} href={href} aria-label={label} className="scene-icon-link">
              <Icon aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
