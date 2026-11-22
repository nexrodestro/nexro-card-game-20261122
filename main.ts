// Ember Court — entrypoint: hand the game in.
// Copies game/ and screenshots/ from this repository to the output
// directory and writes /output/dossier.json with buildDossier from
// vendor/makefun-game.ts. Node 22, standard library only, deterministic:
// the same repository always writes the same bytes.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handIn(): void {
  mkdirSync(outDir, { recursive: true });
  for (const name of ['game', 'screenshots']) {
    const src = join(repoRoot, name);
    const dst = join(outDir, name);
    if (!existsSync(src)) throw new Error(`hand-in: missing ${name}/ in the repository`);
    rmSync(dst, { recursive: true, force: true });
    cpSync(src, dst, { recursive: true });
  }
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log(`Ember Court handed in: game/ + screenshots/ + dossier.json (${dossier.length} bytes) -> ${outDir}`);
}

handIn();
