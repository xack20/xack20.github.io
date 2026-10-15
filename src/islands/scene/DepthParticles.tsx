import { useEffect, useRef } from 'react';
import type { MotionValue } from 'motion/react';

import { ringSpin } from '@/lib/scene/choreography';

import { CANVAS_MAX_DPR } from './constants';
import type { ScenePointer } from './usePointer';

// Adapted from Magic UI's Floating3DParticles: the same polar field with a perspective projection,
// paused off screen and in hidden tabs. Changed: pixel ratio capped at 1.5, the field spins with the
// scroll beat so it orbits with the plates, each particle shifts with the cursor by its own depth,
// and near particles go soft like bokeh.

interface DepthParticlesProps {
  readonly quantity?: number;
  readonly progress: MotionValue<number>;
  readonly pointer: ScenePointer;
  /** False under reduced motion: one still frame. */
  readonly animate: boolean;
  readonly className?: string;
}

interface Particle {
  angle: number;
  radius: number;
  y: number;
  readonly size: number;
  readonly speed: number;
  readonly alpha: number;
  readonly twinkle: number;
}

const FOCAL = 720;
const CAMERA = 520;
/** Particles closer than this fraction of FOCAL + CAMERA are culled. */
const NEAR_CULL = 0.86;
const POINTER_SHIFT_PX = 26;
const DRIFT_PX = 0.05;
const BOKEH_FROM = 1.35;
const MOBILE_BREAKPOINT = 768;
const MOBILE_SHARE = 0.45;
const SPIN_SHARE = 0.5;
/** Ice white, so the field reads as part of the blue sky rather than as specks of paper. */
const PARTICLE_COLOUR = '#e6f4ff';

const spawn = (reach: number, height: number): Particle => ({
  angle: Math.random() * Math.PI * 2,
  radius: 90 + Math.random() * reach,
  y: (Math.random() - 0.5) * height * 2.2,
  size: 0.55 + Math.random() * 0.75,
  speed: 0.0004 + Math.random() * 0.0006,
  alpha: 0.25 + Math.random() * 0.6,
  twinkle: Math.random() * Math.PI * 2,
});

export function DepthParticles({ quantity = 260, progress, pointer, animate, className }: DepthParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    // Simulation state private to this effect: updated in place every frame, never shared.
    let particles: Particle[] = [];

    const draw = (timeS: number): void => {
      ctx.clearRect(0, 0, width, height);
      const spin = ringSpin(progress.get()) * SPIN_SHARE;
      const shiftX = -pointer.x.get() * POINTER_SHIFT_PX;
      const shiftY = -pointer.y.get() * POINTER_SHIFT_PX;
      for (const p of particles) {
        if (animate) {
          p.angle += p.speed;
          p.y -= DRIFT_PX;
          if (p.y < -height * 1.1) p.y = height * 1.1;
        }
        const a = p.angle + spin;
        const z = Math.sin(a) * p.radius;
        if (z > (FOCAL + CAMERA) * NEAR_CULL) continue;
        const scale = FOCAL / (FOCAL + CAMERA - z);
        const soft = Math.max(0, scale - BOKEH_FROM);
        const r = p.size * scale * (1 + soft * 2.4);
        const flicker = 0.78 + 0.22 * Math.sin(timeS * 0.9 + p.twinkle);
        ctx.globalAlpha = (p.alpha * flicker * Math.min(1, scale * 1.5)) / (1 + soft * 14);
        ctx.beginPath();
        ctx.arc(width / 2 + Math.cos(a) * p.radius * scale + shiftX * scale, height / 2 + p.y * scale + shiftY * scale, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let frame = 0;
    let onScreen = true;
    const tick = (now: number): void => {
      frame = requestAnimationFrame(tick);
      draw(now / 1000);
    };
    const sync = (): void => {
      cancelAnimationFrame(frame);
      frame = animate && onScreen && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const resize = (): void => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, CANVAS_MAX_DPR);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = PARTICLE_COLOUR;
      const count = Math.round(quantity * (window.innerWidth < MOBILE_BREAKPOINT ? MOBILE_SHARE : 1));
      particles = Array.from({ length: count }, () => spawn(Math.max(width, height) * 0.85, height));
      draw(0);
    };

    const sizes = new ResizeObserver(resize);
    sizes.observe(canvas);
    const seen = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      sync();
    });
    seen.observe(canvas);
    document.addEventListener('visibilitychange', sync);
    sync();

    return () => {
      cancelAnimationFrame(frame);
      sizes.disconnect();
      seen.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [quantity, progress, pointer.x, pointer.y, animate]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
