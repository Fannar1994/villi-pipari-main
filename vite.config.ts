
/// <reference types="vite/client" />
/// <reference types="node" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use the environment variable or default to 8090
  const port = parseInt(process.env.VITE_PORT || '8090', 10);
  console.log(`Configuring Vite with port: ${port}`);
  
  return {
    server: {
      host: "localhost",
      port: port,
      strictPort: false, // Allow Vite to find another port if this one is in use
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
