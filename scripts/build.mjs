import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { extensionBundleConfig } from '../vite.config.mjs';

const staticFiles = ['_locales', 'icons', 'options', 'pages'];
const DIST_DIR = 'dist';


function validateManifest(m) {
  if (m.manifest_version !== 3 || !m.background?.service_worker || !m.background?.scripts) {
    throw new Error('This build script requires a manifest 3 service worker and background script');
  }
}

// Write an updated Manifest file
async function writeDistributionManifest() {
  const manifestText = await readFile('manifest.json', 'utf8');
  const manifest = JSON.parse(manifestText);

  validateManifest(manifest);

  await writeFile(`${DIST_DIR}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function copyStaticFiles() {
  await Promise.all(
    staticFiles.map((file) => cp(file, `${DIST_DIR}/${file}`, { recursive: true }))
  );
}

async function buildJavaScriptBundles() {
  await build(
      extensionBundleConfig({
        entry: 'content_scripts/dictionary-plus.js',
        fileName: 'content.js',
        format: 'iife',
        globalName: 'DictionaryPlusContent',
      })
  );

  await build(
      extensionBundleConfig({
        entry: 'background_scripts/background.js',
        fileName: 'background.js',
        format: 'iife',
        globalName: 'DictionaryPlusBackground',
      })
  );
}

export async function buildExtension() {
  await rm(DIST_DIR, { force: true, recursive: true });
  await mkdir(DIST_DIR, { recursive: true });

  await copyStaticFiles();
  await writeDistributionManifest();
  await buildJavaScriptBundles();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await buildExtension();
}
