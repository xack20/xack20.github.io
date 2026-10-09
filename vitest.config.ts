import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'scripts/guards/rules.mjs', 'scripts/cv/strip-phone.mjs'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
