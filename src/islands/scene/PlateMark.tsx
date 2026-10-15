import type { ReactNode } from 'react';

import type { Mark } from '@/lib/scene/plates';

// A small figure per case study, seeded by its slug so it never changes between renders (the
// server and the client draw the same mark). One family per category, so shape tells them apart.

const SIZE = 56;
const MID = SIZE / 2;

/** Deterministic 0..1 stream from a string (FNV-1a seed, then a mixing step per draw). */
function seeded(seed: string): () => number {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return () => {
    state = Math.imul(state ^ (state >>> 15), 2246822507);
    state = Math.imul(state ^ (state >>> 13), 3266489909);
    return ((state ^= state >>> 16) >>> 0) / 4294967296;
  };
}

const fixed = (v: number): number => Number(v.toFixed(2));

/** Agents: a model at the centre, tools on tilted orbits around it. */
function orbit(next: () => number): ReactNode {
  const rings = [0, 1, 2].map((ring) => {
    const rx = 13 + ring * 6.5;
    const ry = rx * (0.3 + next() * 0.3);
    const turn = next() * 180;
    const at = next() * Math.PI * 2;
    return { rx, ry, turn, x: fixed(MID + Math.cos(at) * rx), y: fixed(MID + Math.sin(at) * ry), lit: ring === 1 };
  });
  return (
    <>
      {rings.map((ring) => (
        <g key={ring.rx} transform={`rotate(${fixed(ring.turn)} ${MID} ${MID})`}>
          <ellipse cx={MID} cy={MID} rx={ring.rx} ry={fixed(ring.ry)} />
          <circle cx={ring.x} cy={ring.y} r={ring.lit ? 2.6 : 1.7} className={ring.lit ? 'is-lit' : 'is-node'} />
        </g>
      ))}
      <circle cx={MID} cy={MID} r="2.4" className="is-node" />
    </>
  );
}

/** Ledgers: entries of different lengths hanging off one spine, one of them traced. */
function bars(next: () => number): ReactNode {
  const rows = [0, 1, 2, 3, 4].map((row) => ({ y: 10 + row * 9, length: fixed(12 + next() * 26) }));
  const traced = Math.floor(next() * rows.length);
  return (
    <>
      <path d={`M9 ${rows[0]?.y}V${rows.at(-1)?.y}`} />
      {rows.map((row, index) => (
        <g key={row.y} className={index === traced ? 'is-traced' : undefined}>
          <path d={`M9 ${row.y}H${9 + row.length}`} />
          <rect x="6.5" y={row.y - 2.5} width="5" height="5" rx="1" className={index === traced ? 'is-lit' : 'is-node'} />
        </g>
      ))}
    </>
  );
}

/** Personal and open source: a small lattice with a path picked through it. */
function graph(next: () => number): ReactNode {
  const STEP = 11;
  const cells = Array.from({ length: 16 }, (_, index) => ({ x: 11.5 + (index % 4) * STEP, y: 11.5 + Math.floor(index / 4) * STEP }));
  const path = [0, 1, 2, 3].map((row) => cells[row * 4 + Math.floor(next() * 4)]).filter((cell) => cell !== undefined);
  return (
    <>
      {cells.map((cell) => (
        <circle key={`${cell.x}-${cell.y}`} cx={cell.x} cy={cell.y} r="1" className="is-node" />
      ))}
      <path d={`M${path.map((cell) => `${cell.x} ${cell.y}`).join('L')}`} className="is-traced" />
      {path.map((cell) => (
        <circle key={`lit-${cell.x}-${cell.y}`} cx={cell.x} cy={cell.y} r="2.3" className="is-lit" />
      ))}
    </>
  );
}

const FAMILIES: Readonly<Record<Mark, (next: () => number) => ReactNode>> = { orbit, bars, graph };

export function PlateMark({ seed, mark }: { readonly seed: string; readonly mark: Mark }) {
  return (
    <svg className="scene-mark" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" focusable="false">
      {FAMILIES[mark](seeded(seed))}
    </svg>
  );
}
