/** Geometry for build-time SVG flow diagrams: stages left-to-right on desktop, top-to-bottom on phones. */
export interface FlowNode { readonly label: string; readonly note?: string; readonly mine?: boolean }
export interface FlowStage { readonly title: string; readonly nodes: readonly FlowNode[] }
export type Orientation = 'horizontal' | 'vertical';
export interface PlacedNode extends FlowNode { readonly x: number; readonly y: number; readonly w: number; readonly h: number }
export interface PlacedStage { readonly title: string; readonly x: number; readonly y: number }
export interface Arrow { readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number }
export interface FlowLayout {
  readonly width: number;
  readonly height: number;
  readonly stages: readonly PlacedStage[];
  readonly nodes: readonly PlacedNode[];
  readonly arrows: readonly Arrow[];
}

/** Text limits that keep labels inside their boxes. The content schema enforces them. */
export const DIAGRAM_LIMITS = Object.freeze({ stages: 5, nodesPerStage: 3, stageTitle: 20, label: 22, note: 24 });

export const GEOMETRY = Object.freeze({
  pad: 24, titleH: 30, nodeW: 184, nodeWVertical: 300, nodeH: 52, noteH: 18, gapX: 56, gapY: 14, stageGap: 44, arrowInset: 6,
});

const nodeHeight = (node: FlowNode): number => GEOMETRY.nodeH + (node.note ? GEOMETRY.noteH : 0);
const stackHeight = (nodes: readonly FlowNode[]): number =>
  nodes.reduce((sum, node) => sum + nodeHeight(node), 0) + GEOMETRY.gapY * (nodes.length - 1);

function stack(nodes: readonly FlowNode[], x: number, top: number, w: number): readonly PlacedNode[] {
  return nodes.reduce<{ y: number; placed: readonly PlacedNode[] }>(
    (acc, node) => {
      const h = nodeHeight(node);
      return { y: acc.y + h + GEOMETRY.gapY, placed: [...acc.placed, { ...node, x, y: acc.y, w, h }] };
    },
    { y: top, placed: [] },
  ).placed;
}

function horizontal(stages: readonly FlowStage[]): FlowLayout {
  const { pad, titleH, nodeW, gapX, arrowInset } = GEOMETRY;
  const top = pad + titleH;
  const tallest = Math.max(...stages.map((s) => stackHeight(s.nodes)));
  const columnX = (i: number): number => pad + i * (nodeW + gapX);
  const midY = top + tallest / 2;
  return {
    width: columnX(stages.length - 1) + nodeW + pad,
    height: top + tallest + pad,
    stages: stages.map((s, i) => ({ title: s.title, x: columnX(i), y: pad })),
    nodes: stages.flatMap((s, i) => stack(s.nodes, columnX(i), top + (tallest - stackHeight(s.nodes)) / 2, nodeW)),
    arrows: stages.slice(1).map((_, i) => ({ x1: columnX(i) + nodeW + arrowInset, y1: midY, x2: columnX(i + 1) - arrowInset, y2: midY })),
  };
}

function vertical(stages: readonly FlowStage[]): FlowLayout {
  const { pad, titleH, nodeWVertical, stageGap, arrowInset } = GEOMETRY;
  const heights = stages.map((s) => titleH + stackHeight(s.nodes));
  const tops = heights.map((_, i) => pad + heights.slice(0, i).reduce((sum, h) => sum + h + stageGap, 0));
  const centerX = pad + nodeWVertical / 2;
  const last = stages.length - 1;
  return {
    width: pad * 2 + nodeWVertical,
    height: tops[last] + heights[last] + pad,
    stages: stages.map((s, i) => ({ title: s.title, x: pad, y: tops[i] })),
    nodes: stages.flatMap((s, i) => stack(s.nodes, pad, tops[i] + titleH, nodeWVertical)),
    arrows: stages.slice(1).map((_, i) => ({ x1: centerX, y1: tops[i] + heights[i] + arrowInset, x2: centerX, y2: tops[i + 1] - arrowInset })),
  };
}

export function layoutFlow(stages: readonly FlowStage[], orientation: Orientation): FlowLayout {
  if (stages.length === 0) throw new Error('layoutFlow needs at least one stage');
  if (stages.some((s) => s.nodes.length === 0)) throw new Error('every stage needs at least one node');
  return orientation === 'horizontal' ? horizontal(stages) : vertical(stages);
}
