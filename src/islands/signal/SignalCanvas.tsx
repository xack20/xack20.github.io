import { useEffect, useRef, type RefObject } from 'react';
import type { MotionValue } from 'motion/react';

import { clamp01, easeOut, lerp } from '@/lib/signal/timeline';

import { fitCanvas, runCanvasLoop } from '../hooks/loop';
import type { PointerSample } from '../hooks/usePointerSample';
import { drawSignal } from './draw';
import { sceneAt } from './scene';
import { GLOW_SCALE, type Disturbance } from './surface';

const REVEAL_SECONDS = 1.9;
/** The moment of the wave shown as the still frame under reduced motion. */
const STILL_SECONDS = 7.4;
const POINTER_FOLLOW = 0.16;
const PRESENCE_EASE = 0.07;
const ENERGY_DECAY = 0.93;
const ENERGY_PER_PIXEL = 0.006;

const AT_REST: Disturbance = { x: 0, y: 0, presence: 0, energy: 0 };

interface Props {
  readonly progress: MotionValue<number>;
  readonly still: boolean;
  readonly pointer: RefObject<PointerSample>;
}

const follow = (previous: Disturbance, pointer: PointerSample, bounds: DOMRect): Disturbance => {
  const targetX = pointer.x - bounds.left;
  const targetY = pointer.y - bounds.top;
  const arriving = previous.presence < 0.01;
  const x = arriving ? targetX : lerp(previous.x, targetX, POINTER_FOLLOW);
  const y = arriving ? targetY : lerp(previous.y, targetY, POINTER_FOLLOW);
  const moved = arriving ? 0 : Math.hypot(x - previous.x, y - previous.y);
  return {
    x,
    y,
    presence: lerp(previous.presence, pointer.inside ? 1 : 0, PRESENCE_EASE),
    energy: Math.min(1, previous.energy * ENERGY_DECAY + moved * ENERGY_PER_PIXEL),
  };
};

/** The signal: the restless bundle, and the single line it calms into through the gates. */
export function SignalCanvas({ progress, still, pointer }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const main = canvas?.getContext('2d');
    const glow = document.createElement('canvas').getContext('2d');
    if (!canvas || !main || !glow) return;

    let size = fitCanvas(canvas);
    let disturbance = AT_REST;
    const resize = (): void => {
      size = fitCanvas(canvas);
      glow.canvas.width = Math.max(1, Math.round(size.width * GLOW_SCALE));
      glow.canvas.height = Math.max(1, Math.round(size.height * GLOW_SCALE));
    };
    const draw = (seconds: number): void => {
      if (!still) disturbance = follow(disturbance, pointer.current, canvas.getBoundingClientRect());
      drawSignal(
        { main, glow, ratio: size.ratio },
        {
          scene: sceneAt(progress.get(), size.width, size.height),
          seconds: still ? STILL_SECONDS : seconds,
          reveal: still ? 1 : easeOut(clamp01(seconds / REVEAL_SECONDS)),
          disturbance,
        },
      );
    };

    resize();
    return runCanvasLoop(canvas, { draw, resize, still });
  }, [progress, still, pointer]);

  return <canvas ref={canvasRef} className="signal-canvas" aria-hidden="true" />;
}
