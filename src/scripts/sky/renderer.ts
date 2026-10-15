import type { CanvasSize } from './loop';
import { COMPOSITE_SHADER, DENSITY_SHADER, VERTEX_SHADER } from './shaders';

/** Halftone pitch in CSS pixels. */
const CELL_PX = 6;
const GRAIN_AMOUNT = 0.05;
/** One triangle that covers the clip space. */
const FULLSCREEN_TRIANGLE = new Float32Array([-1, -1, 3, -1, -1, 3]);

export interface NebulaFrame {
  readonly seconds: number;
  /** Centre of the cloud in CSS pixels, y measured from the bottom. */
  readonly anchorX: number;
  readonly anchorY: number;
  readonly radius: number;
  readonly gain: number;
  readonly turn: number;
  readonly reveal: number;
  readonly driftX: number;
  readonly driftY: number;
}

export interface Nebula {
  resize(size: CanvasSize): void;
  draw(frame: NebulaFrame): void;
  dispose(): void;
}

type Uniforms = Record<string, WebGLUniformLocation | null>;

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('t3-signal nebula: could not create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`t3-signal nebula: ${gl.getShaderInfoLog(shader) ?? 'shader failed to compile'}`);
  }
  return shader;
};

const link = (gl: WebGLRenderingContext, fragmentSource: string, uniformNames: readonly string[]) => {
  const program = gl.createProgram();
  if (!program) throw new Error('t3-signal nebula: could not create program');
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`t3-signal nebula: ${gl.getProgramInfoLog(program) ?? 'program failed to link'}`);
  }
  const uniforms: Uniforms = Object.fromEntries(uniformNames.map((name) => [name, gl.getUniformLocation(program, name)]));
  return { program, uniforms };
};

const CLOUD_UNIFORMS = ['uCell', 'uTime', 'uAnchor', 'uRadius', 'uTurn'] as const;
const COMPOSITE_UNIFORMS = [...CLOUD_UNIFORMS, 'uField', 'uGrid', 'uResolution', 'uRatio', 'uGain', 'uReveal', 'uGrain', 'uDrift'] as const;

/**
 * Returns null when WebGL is not available, or would only run in software (no usable GPU): the
 * shader then costs whole frames of main-thread time, so the canvas keeps its CSS fallback glow.
 */
export const createNebula = (canvas: HTMLCanvasElement): Nebula | null => {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    failIfMajorPerformanceCaveat: true,
  });
  if (!gl) return null;

  const density = link(gl, DENSITY_SHADER, CLOUD_UNIFORMS);
  const composite = link(gl, COMPOSITE_SHADER, COMPOSITE_UNIFORMS);

  const triangle = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
  gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_TRIANGLE, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const field = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, field);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const target = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, target);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, field, 0);

  let size: CanvasSize = { width: 1, height: 1, ratio: 1 };
  let grid = { columns: 1, rows: 1 };

  const setCloud = (uniforms: Uniforms, frame: NebulaFrame) => {
    gl.uniform1f(uniforms.uCell, CELL_PX);
    gl.uniform1f(uniforms.uTime, frame.seconds);
    gl.uniform2f(uniforms.uAnchor, frame.anchorX, frame.anchorY);
    gl.uniform1f(uniforms.uRadius, frame.radius);
    gl.uniform1f(uniforms.uTurn, frame.turn);
  };

  return {
    resize(next) {
      size = next;
      grid = {
        columns: Math.ceil(next.width / CELL_PX),
        rows: Math.ceil(next.height / CELL_PX),
      };
      gl.bindTexture(gl.TEXTURE_2D, field);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, grid.columns, grid.rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    },
    draw(frame) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target);
      gl.viewport(0, 0, grid.columns, grid.rows);
      gl.useProgram(density.program);
      setCloud(density.uniforms, frame);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(composite.program);
      setCloud(composite.uniforms, frame);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, field);
      gl.uniform1i(composite.uniforms.uField, 0);
      gl.uniform2f(composite.uniforms.uGrid, grid.columns, grid.rows);
      gl.uniform2f(composite.uniforms.uResolution, canvas.width, canvas.height);
      gl.uniform1f(composite.uniforms.uRatio, size.ratio);
      gl.uniform1f(composite.uniforms.uGain, frame.gain);
      gl.uniform1f(composite.uniforms.uReveal, frame.reveal);
      gl.uniform1f(composite.uniforms.uGrain, GRAIN_AMOUNT);
      gl.uniform2f(composite.uniforms.uDrift, frame.driftX, frame.driftY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteTexture(field);
      gl.deleteFramebuffer(target);
      gl.deleteBuffer(triangle);
      gl.deleteProgram(density.program);
      gl.deleteProgram(composite.program);
    },
  };
};
