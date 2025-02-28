import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

export default defineConfig({
  plugins: [react()],
  base: './', // Add this to enforce relative paths
  build: {
    outDir: 'dist' // Explicitly set output to dist/ (matches your workflow)
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true
        })
      ],
      define: {
        global: 'globalThis',
      }
    }
  },
  // Note -- might need to shim process.env at some point?
  define: {
    'process.env': {}
  }
});
