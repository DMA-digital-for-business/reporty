import { build } from 'vite';
import tailwind from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../apps/extension/', import.meta.url));
console.log('[landing-demo] Compilazione del pannello locale…');
await build({
  logLevel: 'error', configFile: false, root, tsconfig: root + 'widget/tsconfig.json', publicDir: false,
  plugins: [tailwind()], resolve: { alias: { '@': root } }, oxc: { jsx: { runtime: 'automatic' } },
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: { outDir: fileURLToPath(new URL('../apps/landing/public/demo/', import.meta.url)), emptyOutDir: true,
    lib: { entry: root + 'demo/main.tsx', name: 'ReportyLocalDemo', formats: ['iife'], fileName: () => 'panel.js' } },
});
console.log('[landing-demo] Pannello locale generato in public/demo/panel.js.');
