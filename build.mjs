// Construye el juego web en www/ (un solo game.js clásico, válido para file:// en la APK).
import { build } from 'esbuild';
import { mkdirSync, copyFileSync } from 'node:fs';

mkdirSync('www', { recursive: true });
await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2019', 'chrome80'],
  outfile: 'www/game.js',
  legalComments: 'none',
});
copyFileSync('web/index.html', 'www/index.html');
copyFileSync('web/style.css', 'www/style.css');
console.log('www/ listo');
