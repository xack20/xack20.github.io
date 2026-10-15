// Numbers the canvas shares with the stylesheet. Change one, change the other.

/** Gate positions as a fraction of the stage width. */
export const GATE_X = { propose: 0.24, approve: 0.5, commit: 0.76 } as const;

/** Height of the signal as a fraction of the stage height: as the hero's horizon, then at the gates (--signal-line-y). */
export const LINE_Y = { hero: 0.36, beat: 0.47 } as const;
