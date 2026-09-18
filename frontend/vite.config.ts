/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * CONFIGURATION: vite.config.ts (Vite Bundler & Rollup Code Splitting)
 * ============================================================================
 * 
 * BUNDLE OPTIMIZATION & CODE SPLITTING:
 * - Splits heavy third-party vendor dependencies into discrete cacheable chunks:
 *   1. `vendor-react`: React, React-DOM core runtimes
 *   2. `vendor-charts`: Recharts data visualization library & D3 sub-modules
 *   3. `vendor-icons`: Lucide-React SVG icon library
 * - Benefits:
 *   * Eliminates the >500kB monolithic bundle warning
 *   * Allows browsers to parallelize bundle downloads and cache vendor libraries
 *   * Accelerates first contentful paint (FCP) and improves CWV metrics
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-vendor')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('src/data/mpladsData') || id.includes('src/data/contractorData') || id.includes('src/data/citizenData')) {
            return 'gov-datasets';
          }
        }
      }
    }
  }
});

