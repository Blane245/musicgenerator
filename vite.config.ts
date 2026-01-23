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
      "import.meta.env.HOMEPAGE": JSON.stringify(packageJson.homepage),
      "import.meta.env.BUILD_DATE": JSON.stringify(new Date().toISOString()),
      "import.meta.env.FSPORT": JSON.stringify(6001),
      "import.meta.env.DBPORT": JSON.stringify(8081),
      "import.meta.env.DBSERVER": JSON.stringify("http://blane-latitude-7290"),
      "import.meta.env.PORT": JSON.stringify(3006),
      "import.meta.env.SEQUENCEEDITORURL": JSON.stringify('http://localhost:3000')
    },
    build: {
      manifest: true,
      sourcemap: false,
    },
    // esbuild: {
    //   pure: mode === 'production'? ['console.log']: [],
    // },
    server: {
      port: 3006,
    },
  };
});
