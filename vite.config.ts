import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import packageJson from "./package.json";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from 'vite-tsconfig-paths';
// ----------------------------------------------------------------------
export default defineConfig(({ mode }) => {
  return {
    base: "",
    publicDir: false,
    plugins: [svgr(), react(), tsconfigPaths()],
    define: {
      "import.meta.env.VERSION": JSON.stringify(packageJson.version),
      "import.meta.env.AUTHOR": JSON.stringify(packageJson.author),
      "import.meta.env.REPOSITORY": JSON.stringify(packageJson.repository),
      "import.meta.env.BUILD_DATE": JSON.stringify(new Date().toISOString()),
    },
    build: {
      manifest: true,
      sourcemap: false,
    },
    esbuild: {
      pure: mode === 'production'? ['console.log']: [],
    },
    server: {
      proxy: {
        "/soundfonts": {
          target: "http://lanedb.hopto.org",
          changeOrigin: true,
        },
        "/local_soundfonts": {
          target:"http://localhost:6000",
          rewrite: path => path.replace("local_", ''),        
        }
      },
    },
  };
});
