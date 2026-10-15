// Spots WebGL that runs on the CPU. There the sky's shader costs whole frames of main-thread time,
// so the page keeps the CSS glow instead. Browsers do not always flag this as a performance caveat.

const SOFTWARE_RENDERERS = /swiftshader|llvmpipe|softpipe|software rasterizer|microsoft basic render/i;

/** True for a known software renderer. An empty or generic name counts as a GPU, so the sky still runs. */
export const isSoftwareRenderer = (name: string): boolean => SOFTWARE_RENDERERS.test(name);
