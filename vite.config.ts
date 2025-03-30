
/// <reference types="vite/client" />
/// <reference types="node" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use environment variable for port or default to 3000
  const port = process.env.ELECTRON_PORT ? parseInt(process.env.ELECTRON_PORT, 10) : 3000;
  
  console.log(`Configuring Vite with port: ${port}`);
  
  return {
    server: {
      host: "localhost",
      port: port,
      strictPort: false, // Allow Vite to find another port if the specified one is in use
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
    logLevel: 'info' as const // Type assertion to fix the type error
  };
});
