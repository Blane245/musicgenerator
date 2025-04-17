import { AliasOptions, defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import packageJson from "./package.json";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from 'vite-tsconfig-paths';
import path from "path";
// ----------------------------------------------------------------------

//@ts-ignore
const root = path.resolve(__dirname, "src");
export default defineConfig(({ mode }) => {
  return {
    base: "",
    publicDir: false,
    plugins: [svgr(), react(), tsconfigPaths()],
    define: {
      "import.meta.env.PACKAGE_VERSION": JSON.stringify(packageJson.version),
      "import.meta.env.AUTHOR": JSON.stringify(packageJson.author),
      "import.meta.env.REPOSITORY": JSON.stringify(packageJson.repository),
      "import.meta.env.VITE_BUILD_DATA": JSON.stringify(new Date().toISOString()),
    },
    // resolve: 
    // {
    //   extensions:['.tsx'],
    //   plugins: [tsconfigPaths()],
    //   alias:{"~":root,} as AliasOptions
    // },
    build: {
      manifest: true,
      sourcemap: true,
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
      },
    },
  };
});
