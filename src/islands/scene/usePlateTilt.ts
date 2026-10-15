import type { PointerEvent } from 'react';

const TILT_DEG = 7;

/**
 * Hover tilt with a glare that follows the cursor. Writes CSS variables on the plate; the
 * stylesheet turns them into transforms, so only transform and opacity ever animate.
 */
export function usePlateTilt() {
  const onPointerMove = (event: PointerEvent<HTMLElement>): void => {
    if (event.pointerType !== 'mouse') return;
    const plate = event.currentTarget;
    const box = plate.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    plate.style.setProperty('--scene-tilt-x', `${((0.5 - y) * TILT_DEG).toFixed(2)}deg`);
    plate.style.setProperty('--scene-tilt-y', `${((x - 0.5) * TILT_DEG).toFixed(2)}deg`);
    plate.style.setProperty('--scene-glare-x', `${(x * box.width).toFixed(1)}px`);
    plate.style.setProperty('--scene-glare-y', `${(y * box.height).toFixed(1)}px`);
  };
  const onPointerLeave = (event: PointerEvent<HTMLElement>): void => {
    event.currentTarget.style.setProperty('--scene-tilt-x', '0deg');
    event.currentTarget.style.setProperty('--scene-tilt-y', '0deg');
  };
  return { onPointerMove, onPointerLeave };
}
