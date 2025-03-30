
/// <reference types="vite/client" />
/// <reference types="node" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  console.log(`Configuring Vite with port: 8080`);
  
  return {
    server: {
      host: "localhost",
      port: 8080,
      strictPort: true, // Make Vite fail if port 8080 is not available
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
