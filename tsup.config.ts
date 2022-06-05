import { defineConfig } from 'tsup';

export default defineConfig({
  minify: true,
  format: ['cjs', 'esm'],
  entry: ['./src/index.ts'],
  clean: true,
  dts: true,
});
