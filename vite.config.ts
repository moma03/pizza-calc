import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `BASE_PATH` lets the deploy pipeline build for a subdirectory (e.g.
// `/pizza-calc/`) without editing this file. Defaults to the domain root.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || '/',
});
