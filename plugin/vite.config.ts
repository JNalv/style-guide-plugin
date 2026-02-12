import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [preact(), viteSingleFile()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        code: 'src/code.ts',
        ui: 'src/ui.html'
      },
      output: {
        entryFileNames: '[name].js'
      }
    }
  }
});
