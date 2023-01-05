import { defineConfig } from "vite";
import path from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import sveltePreprocess from "svelte-preprocess";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
    }),
  ],
  build: {
    minify: false,
    rollupOptions: {
      input: [
        path.resolve(__dirname, "./src/actions.js"),
        path.resolve(__dirname, "./src/menus.js"),
        path.resolve(__dirname, "./src/content-script.js"),
        path.resolve(__dirname, "./src/background.js"),
        path.resolve(__dirname, "./src/saved-list.js"),
      ],
      output: {
        preserveModules: false,
        entryFileNames: "[name].js",
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
});
