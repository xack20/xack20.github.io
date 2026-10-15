import { describe, expect, it } from 'vitest';
import { isSoftwareRenderer } from '../../src/lib/sky/software';

describe('isSoftwareRenderer', () => {
  it('spots the software renderers browsers fall back to without a usable GPU', () => {
    for (const name of [
      'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0) (0x0000C0DE)), SwiftShader driver)',
      'Google SwiftShader',
      'llvmpipe (LLVM 15.0.7, 256 bits)',
      'ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'Mesa softpipe',
    ]) {
      expect(isSoftwareRenderer(name), name).toBe(true);
    }
  });

  it('leaves real GPUs alone', () => {
    for (const name of ['ANGLE (Apple, ANGLE Metal Renderer: Apple M3, Unspecified Version)', 'Adreno (TM) 740', 'Mali-G710', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)']) {
      expect(isSoftwareRenderer(name), name).toBe(false);
    }
  });

  it('treats an unknown or hidden renderer as a GPU, so the sky still runs', () => {
    expect(isSoftwareRenderer('')).toBe(false);
    expect(isSoftwareRenderer('WebKit WebGL')).toBe(false);
  });
});
