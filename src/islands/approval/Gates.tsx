import { FingerprintPattern } from 'lucide-react';
import { motion, useTransform, type MotionValue } from 'motion/react';
import type { CSSProperties } from 'react';

import type { ApprovalGate } from '@/data/home';
import { BEAT, GATE_LIT, staggered, TOKEN_SPENT } from '@/lib/signal/timeline';

import { useSpan } from '../hooks/useSpan';
import { GATE_X } from '../signal/layout';
import { RefractFilter } from './RefractFilter';

/** Opacity of a label or clause before its gate is passed. White at this opacity still clears 4.5:1. */
const UNLIT = 0.6;
const RISE_PX = 10;
/** The approval works once: after Commit its glow is mostly spent. */
const SPENT_GLOW = 0.22;
const TOKEN_SCALE_FROM = 0.5;
/** Matches --signal-token on wide screens; the phone's smaller token reuses the map, slightly scaled. */
const TOKEN_PX = 62;
const TOKEN_FILTER_ID = 'signal-token-refract';
const TOKEN_FILTER = { bevel: 12, strength: 28, fringe: 5 } as const;

interface Props {
  readonly progress: MotionValue<number>;
}

const at = (id: ApprovalGate['id']): CSSProperties => ({ '--x': GATE_X[id] }) as CSSProperties;

function Gate({ gate, index, count, progress }: Props & { readonly gate: ApprovalGate; readonly index: number; readonly count: number }) {
  const appear = useSpan(progress, staggered(BEAT.gatesIn, index, count));
  const lit = useSpan(progress, GATE_LIT[gate.id]);
  const labelOpacity = useTransform(lit, [0, 1], [UNLIT, 1]);
  const rise = useTransform(appear, [0, 1], [RISE_PX, 0]);
  return (
    <motion.li className="signal-gate" style={{ ...at(gate.id), opacity: appear }}>
      <span className="signal-gate-label">
        <motion.span style={{ opacity: labelOpacity, y: rise }}>{gate.label}</motion.span>
      </span>
      <span className="signal-gate-frame" aria-hidden="true" />
      <motion.span
        className="signal-gate-frame signal-gate-frame--lit"
        data-light={gate.id === 'propose' ? 'agent' : 'approved'}
        style={{ opacity: lit }}
        aria-hidden="true"
      />
    </motion.li>
  );
}

function Clause({ gate, index, count, progress }: Props & { readonly gate: ApprovalGate; readonly index: number; readonly count: number }) {
  const appear = useSpan(progress, staggered(BEAT.gatesIn, index, count));
  const lit = useSpan(progress, GATE_LIT[gate.id]);
  const opacity = useTransform([appear, lit], ([shown = 0, on = 0]: number[]) => shown * (UNLIT + (1 - UNLIT) * on));
  return (
    <span className="signal-clause" style={at(gate.id)}>
      <motion.span style={{ opacity }}>{gate.clause}</motion.span>{' '}
    </span>
  );
}

/** The small glass token at Approve. It bends the line behind it, lights when approved, and is spent after Commit. */
function Token({ progress }: Props) {
  const opacity = useSpan(progress, BEAT.tokenIn);
  const scale = useTransform(opacity, [0, 1], [TOKEN_SCALE_FROM, 1]);
  const approved = useSpan(progress, BEAT.approve);
  const charge = useSpan(progress, TOKEN_SPENT, 1, SPENT_GLOW);
  const glow = useTransform([approved, charge], ([on = 0, left = 0]: number[]) => on * left);
  return (
    <motion.div className="signal-token" style={{ ...at('approve'), scale }} aria-hidden="true">
      <motion.span className="signal-token-glow" style={{ opacity: glow }} />
      <motion.span className="signal-token-glass" style={{ opacity }} />
      <motion.span className="signal-token-mark" style={{ opacity }}>
        <FingerprintPattern />
      </motion.span>
      <motion.span className="signal-token-mark signal-token-mark--approved" style={{ opacity: glow }}>
        <FingerprintPattern />
      </motion.span>
    </motion.div>
  );
}

/** Three gates on the line, the caption split under them, and the token, all played by the progress. */
export function Gates({ progress, gates }: Props & { readonly gates: readonly ApprovalGate[] }) {
  // No visibility toggle: each part starts at opacity 0, and hiding the whole block would keep the
  // gates from screen readers until the visitor had scrolled to them.
  return (
    <div className="signal-beat">
      <ol className="signal-gates">
        {gates.map((gate, index) => (
          <Gate key={gate.id} gate={gate} index={index} count={gates.length} progress={progress} />
        ))}
      </ol>
      <p className="signal-caption">
        {gates.map((gate, index) => (
          <Clause key={gate.id} gate={gate} index={index} count={gates.length} progress={progress} />
        ))}
      </p>
      <Token progress={progress} />
      <RefractFilter id={TOKEN_FILTER_ID} width={TOKEN_PX} height={TOKEN_PX} radius={TOKEN_PX / 2} {...TOKEN_FILTER} />
    </div>
  );
}
