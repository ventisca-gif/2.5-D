// Construye el juego web en www/ (un solo game.js clásico, válido para file:// en la APK).
import { build } from 'esbuild';
import { mkdirSync, copyFileSync, readFileSync } from 'node:fs';

const manifest = readFileSync('android/AndroidManifest.xml', 'utf8');
const VERSION = manifest.match(/versionName="([^"]+)"/)[1];
const VCODE = Number(manifest.match(/versionCode="(\d+)"/)[1]);

mkdirSync('www', { recursive: true });
await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2019', 'chrome80'],
  outfile: 'www/game.js',
  legalComments: 'none',
  define: { __APP_VERSION__: JSON.stringify(VERSION), __VERSION_CODE__: String(VCODE) },
});
await build({ entryPoints: ['src/showcase.js'], bundle: true, minify: true, format: 'iife', target: ['es2019'], outfile: 'www/showcase.js' });
copyFileSync('web/showcase.html', 'www/showcase.html');
copyFileSync('web/index.html', 'www/index.html');
copyFileSync('web/style.css', 'www/style.css');
console.log('www/ listo');
