import { describe, expect, it } from 'vitest';
import { GEOMETRY, layoutFlow, type FlowLayout, type FlowStage, type PlacedNode } from '../../src/lib/diagram/layout';

const STAGES: FlowStage[] = [
  { title: 'In', nodes: [{ label: 'A' }] },
  { title: 'Middle', nodes: [{ label: 'B', note: 'a note', mine: true }, { label: 'C' }] },
  { title: 'Out', nodes: [{ label: 'D' }] },
];

const overlaps = (a: PlacedNode, b: PlacedNode) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (l: FlowLayout) => l.nodes.every((n) => n.x >= 0 && n.y >= 0 && n.x + n.w <= l.width && n.y + n.h <= l.height);

describe.each(['horizontal', 'vertical'] as const)('layoutFlow %s', (orientation) => {
  const layout = layoutFlow(STAGES, orientation);

  it('places every node inside the canvas without overlaps', () => {
    expect(layout.nodes).toHaveLength(4);
    expect(inside(layout)).toBe(true);
    layout.nodes.forEach((a, i) => layout.nodes.slice(i + 1).forEach((b) => expect(overlaps(a, b)).toBe(false)));
  });

  it('draws one forward arrow between consecutive stages', () => {
    expect(layout.arrows).toHaveLength(2);
    layout.arrows.forEach((a) => expect(orientation === 'horizontal' ? a.x2 > a.x1 : a.y2 > a.y1).toBe(true));
  });

  it('keeps labels, notes and the mine flag, and makes noted nodes taller', () => {
    const b = layout.nodes.find((n) => n.label === 'B');
    const c = layout.nodes.find((n) => n.label === 'C');
    expect(b).toMatchObject({ note: 'a note', mine: true });
    expect(b!.h).toBe(GEOMETRY.nodeH + GEOMETRY.noteH);
    expect(c!.h).toBe(GEOMETRY.nodeH);
  });
});

describe('layoutFlow sizes', () => {
  it('lays stages out in columns', () => {
    expect(layoutFlow(STAGES, 'horizontal').width).toBe(2 * GEOMETRY.pad + 3 * GEOMETRY.nodeW + 2 * GEOMETRY.gapX);
  });

  it('stacks stages in one column on phones', () => {
    const layout = layoutFlow(STAGES, 'vertical');
    expect(layout.width).toBe(2 * GEOMETRY.pad + GEOMETRY.nodeWVertical);
    const tops = layout.stages.map((s) => s.y);
    expect([...tops].sort((x, y) => x - y)).toEqual(tops);
  });

  it('rejects empty input', () => {
    expect(() => layoutFlow([], 'horizontal')).toThrow(/at least one stage/);
    expect(() => layoutFlow([{ title: 'x', nodes: [] }], 'vertical')).toThrow(/at least one node/);
  });
});
