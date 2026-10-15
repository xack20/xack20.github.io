import { useMemo } from 'react';

interface Props {
  readonly id: string;
  /** Size of the glass in CSS pixels; the displacement map is drawn to match. */
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  /** Width of the rim that bends light. The middle of the glass is left flat. */
  readonly bevel: number;
  /** Displacement at the very edge, in pixels. */
  readonly strength: number;
  /** Extra displacement for red and less for blue, which leaves a thin fringe on the rim. */
  readonly fringe: number;
}

const CHANNELS = [
  { name: 'red', matrix: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', spread: 1 },
  { name: 'green', matrix: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', spread: 0 },
  { name: 'blue', matrix: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', spread: -1 },
] as const;

/**
 * A displacement map as an SVG image: red falls left to right and green top to bottom, so each edge
 * samples from further inside the glass, and a flat mid-grey centre leaves the middle untouched.
 */
const rimMap = (width: number, height: number, radius: number, bevel: number): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
<linearGradient id="x" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f00"/><stop offset="1" stop-color="#000"/></linearGradient>
<linearGradient id="y" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f0"/><stop offset="1" stop-color="#000"/></linearGradient>
</defs>
<rect width="${width}" height="${height}" fill="#808000"/>
<rect width="${width}" height="${height}" rx="${radius}" fill="url(#x)"/>
<rect width="${width}" height="${height}" rx="${radius}" fill="url(#y)" style="mix-blend-mode:screen"/>
<rect x="${bevel}" y="${bevel}" width="${width - bevel * 2}" height="${height - bevel * 2}" rx="${Math.max(0, radius - bevel)}" fill="#808000" style="filter:blur(${bevel * 0.55}px)"/>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

/**
 * Glass that bends what is behind it. Use as `backdrop-filter: url(#id)`. Chromium only;
 * elsewhere the declaration is dropped and the plain blur before it in the CSS applies.
 */
export function RefractFilter({ id, width, height, radius, bevel, strength, fringe }: Props) {
  const map = useMemo(() => rimMap(width, height, radius, bevel), [width, height, radius, bevel]);
  return (
    <svg className="signal-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feImage href={map} x="0" y="0" width={width} height={height} preserveAspectRatio="none" result="map" />
          {CHANNELS.map((channel) => (
            <feDisplacementMap
              key={`bend-${channel.name}`}
              in="SourceGraphic"
              in2="map"
              scale={strength + fringe * channel.spread}
              xChannelSelector="R"
              yChannelSelector="G"
              result={`bent-${channel.name}`}
            />
          ))}
          {CHANNELS.map((channel) => (
            <feColorMatrix key={`keep-${channel.name}`} in={`bent-${channel.name}`} type="matrix" values={channel.matrix} result={channel.name} />
          ))}
          <feBlend in="red" in2="green" mode="screen" result="red-green" />
          <feBlend in="red-green" in2="blue" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
}
