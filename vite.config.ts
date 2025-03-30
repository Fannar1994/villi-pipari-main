
/// <reference types="vite/client" />
/// <reference types="node" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Always use port 8080 as required
  const port = 8080;
  console.log(`Configuring Vite with port: ${port}`);
  
  return {
    server: {
      host: true, // Listen on all addresses including network IP
      port: port, // Fixed port
      strictPort: true, // Fail if port is in use
      hmr: {
        protocol: 'ws',
        host: 'localhost',
      }
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    base: './',
    logLevel: 'info' as const
  };
});
