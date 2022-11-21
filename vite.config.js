import { defineConfig } from "vite";
import path from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import sveltePreprocess from "svelte-preprocess";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte({ preprocess: sveltePreprocess() })],
  build: {
    minify: false,
    rollupOptions: {
      // https://rollupjs.org/guide/en/#big-list-of-options
      input: [
        path.resolve(__dirname, "./src/actions.js"),
        path.resolve(__dirname, "./src/menus.js"),
        path.resolve(__dirname, "./src/content-script.js"),
        path.resolve(__dirname, "./src/background.js"),
        path.resolve(__dirname, "./src/saved-list.js"),
        path.resolve(__dirname, "./saved-list.html"),
      ],
      output: {
        preserveModules: false,
        entryFileNames: "[name].js",
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
});
