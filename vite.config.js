import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readdirSync, statSync } from 'fs';
import { resolve, relative, join } from 'path';

function audioManifestPlugin() {
  const virtualId = 'virtual:audio-manifest';
  const resolvedId = '\0' + virtualId;

  function scan(dir, base) {
    const files = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        files.push(...scan(full, base));
      } else if (entry.endsWith('.mp3')) {
        files.push(relative(base, full).replace(/\\/g, '/'));
      }
    }
    return files;
  }

  return {
    name: 'audio-manifest',
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id === resolvedId) {
        const base = resolve('public/audio');
        const files = scan(base, base).sort();
        return `export default ${JSON.stringify(files)}`;
      }
    },
  };
}

export default defineConfig({
  base: '/sadhana/',
  plugins: [react(), audioManifestPlugin()],
});
