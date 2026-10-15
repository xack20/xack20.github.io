import { useEffect, useRef } from 'react';
import { useAnimationFrame, useMotionValue, useScroll, useSpring, type MotionValue } from 'motion/react';

import type { StageMode } from '../hooks/useStageMode';
import { beatProgress, measureBeat, paintBeat, STILL_FRAME, type BeatMetrics, type BeatRefs } from './beat';
import { SCROLL_SPRING } from './constants';
import { usePointer, type ScenePointer } from './usePointer';

/**
 * Drives the scene: scroll position becomes a spring-smoothed progress, the cursor a
 * spring-smoothed tilt, and one frame loop paints both. Idle when the stage is off screen;
 * under reduced motion it paints a single resting frame and never loops.
 */
export function useDepthBeat(mode: StageMode, refs: BeatRefs, count: number): { progress: MotionValue<number>; pointer: ScenePointer } {
  const { scrollY } = useScroll();
  const target = useMotionValue(0);
  const progress = useSpring(target, SCROLL_SPRING);
  const pointer = usePointer(mode !== 'still');
  const metrics = useRef<BeatMetrics | null>(null);
  const onScreen = useRef(true);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    const stage = refs.stage.current;
    const copy = refs.copy.current;
    if (!stage || !copy) return;
    const remeasure = (): void => {
      metrics.current = measureBeat(refs, mode, count);
      if (mode === 'still' && metrics.current) paintBeat(refs, metrics.current, STILL_FRAME);
    };
    const sizes = new ResizeObserver(remeasure);
    sizes.observe(stage);
    sizes.observe(copy);
    const seen = new IntersectionObserver(([entry]) => {
      onScreen.current = entry?.isIntersecting ?? true;
    });
    seen.observe(stage);
    return () => {
      sizes.disconnect();
      seen.disconnect();
    };
  }, [mode, refs, count]);

  useAnimationFrame((time) => {
    const m = metrics.current;
    if (mode === 'still' || !m || !onScreen.current) return;
    startedAt.current ??= time;
    target.set(beatProgress(scrollY.get(), m));
    paintBeat(refs, m, {
      p: progress.get(),
      time: time / 1000,
      intro: (time - startedAt.current) / 1000,
      pointerX: pointer.x.get(),
      pointerY: pointer.y.get(),
    });
  });

  return { progress, pointer };
}
