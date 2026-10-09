import {
  ATTRACT_RADIUS, LINK_DISTANCE, createStars, linkAlpha, starCount, stepStars, type Pointer, type Star,
} from '../lib/constellation/sim';

const GOLD_RGB = '232, 196, 120';
const STAR_FILL = 'rgba(232, 196, 120, 0.85)';
const STAR_NEAR_FILL = '#fff2cf';
const MAX_DPR = 2;
const NEAR_SCALE = 1.8;
const LINE_WIDTH = 0.7;

function draw(ctx: CanvasRenderingContext2D, stars: readonly Star[], pointer: Pointer | null, dpr: number): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const maxDistance = LINK_DISTANCE * dpr;
  ctx.lineWidth = LINE_WIDTH * dpr;
  for (let i = 0; i < stars.length; i += 1) {
    for (let j = i + 1; j < stars.length; j += 1) {
      const alpha = linkAlpha(Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y), maxDistance);
      if (alpha === 0) continue;
      ctx.strokeStyle = `rgba(${GOLD_RGB}, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(stars[i].x, stars[i].y);
      ctx.lineTo(stars[j].x, stars[j].y);
      ctx.stroke();
    }
  }
  const nearRadius = ATTRACT_RADIUS * dpr;
  stars.forEach((s) => {
    const near = pointer !== null && Math.hypot(pointer.x - s.x, pointer.y - s.y) < nearRadius;
    ctx.fillStyle = near ? STAR_NEAR_FILL : STAR_FILL;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * dpr * (near ? NEAR_SCALE : 1), 0, Math.PI * 2);
    ctx.fill();
  });
}

function mount(canvas: HTMLCanvasElement): void {
  const host = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  if (!host || !ctx) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  let stars: readonly Star[] = [];
  let pointer: Pointer | null = null;
  let onScreen = true;
  let frame = 0;
  let cssWidth = -1;

  const resize = (): void => {
    canvas.width = Math.round(host.clientWidth * dpr);
    canvas.height = Math.round(host.clientHeight * dpr);
    // Only reseed on width changes so mobile URL-bar height changes don't make stars jump.
    if (host.clientWidth !== cssWidth) {
      cssWidth = host.clientWidth;
      stars = createStars(starCount(host.clientWidth, host.clientHeight, coarse), canvas.width, canvas.height, Math.random, dpr);
    }
    draw(ctx, stars, pointer, dpr);
  };
  const tick = (): void => {
    stars = stepStars(stars, { width: canvas.width, height: canvas.height, pointer, dpr });
    draw(ctx, stars, pointer, dpr);
    frame = requestAnimationFrame(tick);
  };
  const shouldRun = (): boolean => onScreen && !document.hidden && !reducedMotion.matches;
  const sync = (): void => {
    if (shouldRun() && frame === 0) frame = requestAnimationFrame(tick);
    if (!shouldRun() && frame !== 0) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  new ResizeObserver(resize).observe(host);
  new IntersectionObserver((entries) => {
    onScreen = entries.some((e) => e.isIntersecting);
    sync();
  }).observe(host);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  if (!coarse) {
    host.addEventListener('pointermove', (e) => {
      const rect = host.getBoundingClientRect();
      pointer = { x: (e.clientX - rect.left) * dpr, y: (e.clientY - rect.top) * dpr };
    });
    host.addEventListener('pointerleave', () => {
      pointer = null;
    });
  }
}

document.querySelectorAll<HTMLCanvasElement>('canvas[data-constellation]').forEach(mount);
