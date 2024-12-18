import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import packageJson from './package.json'
import svgr from 'vite-plugin-svgr'
// ----------------------------------------------------------------------

export default defineConfig({
  base: '',
  publicDir: false,
  plugins: [
    svgr(), react(),
  ],
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version)
  },
  build: {
    manifest: true,
    sourcemap: true,
  },
  server: {
    proxy: {
      '/soundfonts': {
        target: 'http://lanedb.hopto.org',
        changeOrigin: true,
      }
    }
  }
  
});