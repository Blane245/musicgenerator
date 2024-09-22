import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import packageJson from './package.json'
import svgr from 'vite-plugin-svgr'

// ----------------------------------------------------------------------

export default defineConfig({
  plugins: [
    svgr(), react(),
  ],
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version)
  }
});