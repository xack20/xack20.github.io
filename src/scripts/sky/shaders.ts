// Two passes. The first writes the nebula's density into a tiny texture, one texel per halftone cell.
// The second runs at full resolution and only looks things up: a dot per cell, a soft glow, stars, grain.

export const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const NOISE = /* glsl */ `
float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}
float fbm(vec2 p) {
  float sum = 0.0;
  float gain = 0.5;
  for (int i = 0; i < 6; i++) {
    sum += gain * valueNoise(p);
    p = p * 2.02 + vec2(13.7, 7.1);
    gain *= 0.5;
  }
  return sum;
}
`;

// Bright knots inside the cloud and a few lone stars around it: xy in nebula units, z size, w strength.
// Strength 0 means a lone star: it gets a glint but adds no cloud.
const CORES = /* glsl */ `
const int CORE_COUNT = 8;
vec4 core(int i) {
  if (i == 0) return vec4(-0.06, 0.08, 0.2, 1.0);
  if (i == 1) return vec4(0.44, -0.2, 0.13, 0.8);
  if (i == 2) return vec4(-0.5, -0.26, 0.1, 0.62);
  if (i == 3) return vec4(0.16, 0.5, 0.085, 0.55);
  if (i == 4) return vec4(-0.34, 0.44, 0.06, 0.42);
  if (i == 5) return vec4(-1.02, 0.56, 0.05, 0.0);
  if (i == 6) return vec4(0.62, 0.84, 0.045, 0.0);
  return vec4(-0.86, -0.1, 0.04, 0.0);
}
`;

export const DENSITY_SHADER = /* glsl */ `
precision highp float;
uniform float uCell;
uniform float uTime;
uniform vec2 uAnchor;
uniform float uRadius;
uniform float uTurn;
${NOISE}
${CORES}
void main() {
  vec2 css = gl_FragCoord.xy * uCell;
  vec2 q = (css - uAnchor) / uRadius;
  float c = cos(uTurn);
  float s = sin(uTurn);
  q = vec2(c * q.x - s * q.y, s * q.x + c * q.y);

  vec2 w = q * 1.25 + vec2(uTime * 0.011, -uTime * 0.007);
  vec2 warp = vec2(fbm(w * 1.4 + 4.2), fbm(w * 1.4 + 9.7)) - 0.5;
  float n = fbm(w + warp * 1.9);
  vec2 e = q * vec2(0.92, 1.12);
  float fall = exp(-dot(e, e) * 1.25);
  float ridge = 1.0 - abs(2.0 * fbm(w * 2.3 - warp) - 1.0);
  float cloud = (smoothstep(0.3, 0.84, n) * 1.3 + fall * 0.1) * fall * (0.62 + 0.6 * ridge);

  float knots = 0.0;
  for (int i = 0; i < CORE_COUNT; i++) {
    vec4 k = core(i);
    vec2 d = q - k.xy;
    knots += k.w * exp(-dot(d, d) / (k.z * k.z));
  }
  gl_FragColor = vec4(clamp(cloud * 0.5, 0.0, 1.0), clamp(knots * 0.5, 0.0, 1.0), 0.0, 1.0);
}
`;

export const COMPOSITE_SHADER = /* glsl */ `
precision highp float;
uniform sampler2D uField;
uniform vec2 uGrid;
uniform vec2 uResolution;
uniform float uRatio;
uniform float uCell;
uniform float uTime;
uniform float uGain;
uniform float uReveal;
uniform float uGrain;
uniform vec2 uAnchor;
uniform float uRadius;
uniform float uTurn;
uniform vec2 uDrift;
${NOISE}
${CORES}

const vec3 VOID_COLOR = vec3(0.018, 0.018, 0.022);
const vec3 DEEP = vec3(0.02, 0.07, 0.26);
const vec3 MID = vec3(0.10, 0.34, 0.95);
const vec3 LIGHT = vec3(0.36, 0.68, 1.0);
const vec3 HOT = vec3(0.88, 0.96, 1.0);

float starLayer(vec2 css, float cellSize, float chance, float seed) {
  vec2 g = css / cellSize;
  vec2 id = floor(g);
  vec2 f = fract(g);
  float h = hash21(id + seed);
  if (h > chance) return 0.0;
  vec2 pos = vec2(hash21(id + seed + 3.1), hash21(id + seed + 8.7)) * 0.8 + 0.1;
  float dist = length((f - pos) * cellSize);
  float mag = hash21(id + seed + 5.5);
  float twinkle = 0.7 + 0.3 * sin(uTime * (0.6 + mag * 2.0) + h * 60.0);
  return smoothstep(0.75 + mag * 0.7, 0.0, dist) * (0.2 + 0.8 * mag * mag) * twinkle;
}

vec3 glint(vec2 css, vec4 k, float seed) {
  float c = cos(-uTurn);
  float s = sin(-uTurn);
  vec2 local = k.xy * uRadius;
  vec2 pos = uAnchor + vec2(c * local.x - s * local.y, s * local.x + c * local.y);
  vec2 d = css - pos;
  float size = k.z * uRadius * 0.55;
  float twinkle = 0.78 + 0.22 * sin(uTime * (0.8 + seed * 0.37) + seed * 17.0);
  float heart = exp(-dot(d, d) / (size * size * 0.012));
  float spikes =
    exp(-abs(d.y) * 1.3) * exp(-abs(d.x) / (size * 1.25)) +
    exp(-abs(d.x) * 1.3) * exp(-abs(d.y) / (size * 1.25));
  float halo = size * size / (dot(d, d) + size * size) * 0.16;
  return (HOT * heart * 1.2 + mix(HOT, LIGHT, 0.35) * spikes * 0.8 + LIGHT * halo) * twinkle;
}

void main() {
  vec2 css = gl_FragCoord.xy / uRatio;
  vec2 g = css / uCell;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  vec2 cell = texture2D(uField, (id + 0.5) / uGrid).rg * 2.0;
  vec2 soft = texture2D(uField, g / uGrid).rg * 2.0;
  float gain = uGain * uReveal;

  // Halftone: one dot per cell, sized by the density at the cell's centre.
  float density = (cell.r + cell.g * 1.3) * gain;
  float radius = 0.5 * smoothstep(0.0, 1.0, pow(density, 0.62));
  float edge = 1.0 / (uCell * uRatio);
  float dot_ = (1.0 - smoothstep(radius - edge, radius + edge, length(f))) * step(0.06, radius);
  vec3 ink = mix(DEEP, MID, smoothstep(0.03, 0.5, density));
  ink = mix(ink, LIGHT, smoothstep(0.55, 1.25, density));
  ink = mix(ink, HOT, smoothstep(1.3, 2.2, density));

  vec3 color = VOID_COLOR;
  color += (DEEP * 1.0 * soft.r + MID * 0.75 * soft.g) * gain * 0.6;
  color += ink * dot_ * (0.45 + 0.55 * smoothstep(0.0, 0.7, density));

  vec2 sky = css + uDrift * 0.4;
  float nearCloud = 0.5 + 1.4 * soft.r;
  float stars = starLayer(sky, 52.0, 0.24, 1.0) * nearCloud + starLayer(sky, 131.0, 0.4, 9.0) * 1.3;
  color += mix(vec3(1.0), LIGHT + 0.35, hash21(id * 0.37)) * stars * uReveal;
  for (int i = 0; i < CORE_COUNT; i++) {
    color += glint(css, core(i), float(i) + 1.0) * gain;
  }

  vec2 uv = gl_FragCoord.xy / uResolution;
  color *= 1.0 - 0.4 * pow(length(uv - 0.5) * 1.2, 2.2);

  // Film grain, stepped at 24 frames a second. It also dithers the soft glow so it never bands.
  float luma = dot(color, vec3(0.3, 0.55, 0.15));
  float grain = hash21(gl_FragCoord.xy + floor(uTime * 24.0) * vec2(37.0, 17.0)) - 0.5;
  color += grain * uGrain * (0.55 + 2.2 * luma);
  gl_FragColor = vec4(max(color, 0.0), 1.0);
}
`;
