import { defineConfig } from 'vite';

export function extensionBundleConfig({ entry, fileName, format, globalName }) {
  return defineConfig({
    configFile: false,
    build: {
      emptyOutDir: false,
      outDir: 'dist',
      lib: {
        entry,
        ...(globalName && { name: globalName }),
        formats: [format],
        fileName: () => fileName,
      },
      rollupOptions: {
        output: {
          entryFileNames: fileName,
        },
      },
    },
  });
}
