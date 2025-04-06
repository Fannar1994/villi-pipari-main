
/// <reference types="vite/client" />
/// <reference types="node" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Determine the mode (development or production)
  const isDevelopment = mode === "development";
  const isProduction = mode === "production";
  console.log(`Running in ${isDevelopment ? "development" : "production"} mode`);
  
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
      sourcemap: isDevelopment, // Only generate sourcemaps in development
      minify: isProduction,
      // Ensure we're using relative paths in the built files
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          manualChunks: undefined,
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        },
      },
    },
    base: './', // Critical for Electron to find assets correctly
    logLevel: 'info' as const,
    publicDir: 'public', // Ensure public directory is properly included
  };
});
