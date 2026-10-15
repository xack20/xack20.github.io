// Tuning values shared across the plate scene. Choreography timing lives in src/lib/scene/choreography.ts.
export const PERSPECTIVE_PX = 1400;
/** Height of the site header the scene sits under (--scene-header-h). */
export const HEADER_H = 64;

/** Scroll length of the beat in viewport heights (the stage itself adds one more). */
export const BEAT_SCROLL_VH = 250;
/** Where on the beat the "#work" anchor sits: the wall is settled by then. */
export const WALL_ANCHOR = 0.92;

export const SCROLL_SPRING = { stiffness: 150, damping: 30, mass: 0.5 } as const;
export const POINTER_SPRING = { stiffness: 55, damping: 16, mass: 0.9 } as const;

/** How far the cursor tilts the whole scene, in degrees. */
export const TILT_DEG = { x: 4.5, y: 7 } as const;

export const CANVAS_MAX_DPR = 1.5;

/** Below this the wall does not fit: the deck becomes decoration and the case studies a list. */
export const ROOMY = { minWidth: 1024, minHeight: 640 } as const;
