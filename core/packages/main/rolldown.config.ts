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
    external: ['mks2508/utils'],
  },
  {
    input: './src/index.ts',
    output: {
      file: './dist/index.cjs',
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
    },
    external: ['mks2508/utils'],
  },
]);
