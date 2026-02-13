import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Figma plugins need two bundles built separately:
// BUILD_TARGET=code  → dist/code.js  (main thread, IIFE)
// BUILD_TARGET=ui    → dist/ui.html  (UI iframe, single-file)
export default defineConfig(() => {
  if (process.env.BUILD_TARGET === 'code') {
    return {
      build: {
        target: 'es2017',
        outDir: resolve(__dirname, 'dist'),
        emptyOutDir: false,
        rollupOptions: {
          input: resolve(__dirname, 'src/code.ts'),
          output: {
            entryFileNames: 'code.js',
            format: 'iife',
          },
        },
      },
    };
  }

  // UI build: root=src so ui.html outputs to dist/ui.html (not dist/src/ui.html)
  return {
    root: resolve(__dirname, 'src'),
    envDir: __dirname,
    plugins: [preact(), viteSingleFile()],
    build: {
      outDir: resolve(__dirname, 'dist'),
      emptyOutDir: false,
      rollupOptions: {
        input: resolve(__dirname, 'src/ui.html'),
      },
    },
  };
});
