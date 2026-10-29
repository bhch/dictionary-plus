import { watch } from 'node:fs';
import { buildExtension } from './build.mjs';

// Watchable files
const watchedPaths = [
  'background_scripts',
  'content_scripts',
  'icons',
  '_locales',
  'options',
  'pages',
  'manifest.json',
];

let rebuilding = false;
let rebuildQueued = false;
let timer;

async function rebuild() {
  if (rebuilding) {
    rebuildQueued = true;
    return;
  }

  rebuilding = true;
  try {
    await buildExtension();
    console.log('Extension rebuilt. Reload it in about:debugging.');
  } catch (error) {
    console.error(error);
  } finally {
    rebuilding = false;
    if (rebuildQueued) {
      rebuildQueued = false;
      await rebuild();
    }
  }
}

function scheduleRebuild() {
  clearTimeout(timer);
  timer = setTimeout(rebuild, 100);
}


for (const path of watchedPaths) {
  watch(path, { recursive: true }, (eventType, filename) => {
    const changedPath = filename ? `${path}/${filename}` : path;
    console.log(`[watch] ${eventType}: ${changedPath}`);
    scheduleRebuild();
  });
}
