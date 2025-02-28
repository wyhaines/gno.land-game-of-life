// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import nodePolyfills from 'rollup-plugin-polyfill-node' // or 'rollup-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
  ],
  base: './', 
  build: {
    outDir: 'dist',
    rollupOptions: {
      // This is the important part for production:
      plugins: [
        nodePolyfills()
      ],
      output: {
        intro: 'if (typeof global === "undefined") { window.global = window; }'
      }
    }
  },
  optimizeDeps: {
    // This applies only to dev (esbuild). Keep it to fix dev-time polyfills
    esbuildOptions: {
      // Provide global: 'globalThis' or process: 'some polyfill' if needed
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true
        })
      ]
    }
  },
  // If you have code referencing `process.env`, you can define that here:
  define: {
    'process.env': {},
    global: 'globalThis',
  }
})

