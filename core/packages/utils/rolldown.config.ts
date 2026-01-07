import { defineConfig } from 'rolldown';

export default defineConfig([
  {
    input: './src/index.ts',
    output: {
      dir: './dist',
      format: 'esm',
      exports: 'named',
      sourcemap: true,
    },
    external: ['@mks2508/better-logger', '@mks2508/no-throw'],
  },
  {
    input: './src/logger.ts',
    output: {
      file: './dist/logger.js',
      format: 'esm',
      exports: 'named',
      sourcemap: true,
    },
    external: ['@mks2508/better-logger'],
  },
  {
    input: './src/result.ts',
    output: {
      file: './dist/result.js',
      format: 'esm',
      exports: 'named',
      sourcemap: true,
    },
    external: ['@mks2508/no-throw'],
  },
]);
