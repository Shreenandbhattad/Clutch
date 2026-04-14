import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    // Ensure SPA routing works — all routes fall through to index.html
    // For GitHub Pages, add `base: "/repo-name/"` here
    server: {
        port: 5173,
        // SPA fallback in dev is automatic with Vite
    },
    preview: {
        port: 4173,
    },
    build: {
        // Generate sourcemaps for debugging
        sourcemap: false,
    },
});
