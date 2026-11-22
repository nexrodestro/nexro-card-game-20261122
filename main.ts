// Ember Court — entrypoint: hand the game in.
// Copies game/ and screenshots/ from this repository into the output
// directory and writes the dossier buildDossier derives from them, so the
// dossier the scorer rebuilds is byte-for-byte the one handed in.
// Node 22, standard library only; no network, no clock, no randomness —
// the same repository always writes the same bytes.

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The output directory starts empty every run: stale files from an
// earlier run can never leak into the handed-in entry.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

console.log(`Ember Court: wrote ${outDir} (dossier ${dossier.length} bytes)`);
