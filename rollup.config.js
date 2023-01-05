import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import sveltePreprocess, { scss } from "svelte-preprocess";
import postcss from "rollup-plugin-postcss";
import path from "path";
import css from "rollup-plugin-css-only";
import copy from "rollup-plugin-copy";

const production = !process.env.ROLLUP_WATCH;

export default [
  {
    input: [path.resolve(__dirname, "./src/popup.js")],
    output: {
      dir: "dist/",
      entryFileNames: "[name].js",
      assetFileNames: `assets/[name].[ext]`,
    },
    plugins: [
      svelte({
        preprocess: sveltePreprocess(
          { sourceMap: !production, postcss: true },
          scss()
        ),

        compilerOptions: {
          // enable run-time checks when not in production
          dev: !production,
        },
      }),
      resolve({ browser: true }),
      postcss({
        config: {
          path: "./postcss.config.js",
        },
        minimize: production,
        extract: true,
      }),
      // css({ output: "popup.css" }),
    ],
  },
  {
    input: [
      path.resolve(__dirname, "./src/actions.js"),
      path.resolve(__dirname, "./src/menus.js"),
      path.resolve(__dirname, "./src/content-script.js"),
      path.resolve(__dirname, "./src/background.js"),
    ],
    output: {
      dir: "dist/",
      entryFileNames: "[name].js",
      assetFileNames: `assets/[name].[ext]`,
    },
    plugins: [
      svelte({
        preprocess: sveltePreprocess(),
        compilerOptions: {
          dev: !production,
        },
      }),
      resolve({ browser: true }),
      css({ output: "content.css" }),
      copy({
        targets: [{ src: "public/*", dest: "dist" }],
      }),
    ],
  },
];
