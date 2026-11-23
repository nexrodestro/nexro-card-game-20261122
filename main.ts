// main.ts — hand the game in: copy game/ + screenshots/ to /output and
// write /output/dossier.json with buildDossier from vendor/makefun-game.ts.
//
// Output handling (the v2 lesson, kept): clear the CONTENTS of the output
// directory only — never remove /output itself. In the grader the directory
// is owned by the platform; removing it fails with EPERM as user 65534.
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function clearContents(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

function main(): void {
  clearContents(outDir);
  cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
  // Caps are the gate's own: 160 KiB of dossier text, 4 screenshots at
  // most 256 KiB each, game/ within 993 entries and 48 MiB.
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 256 * 1024 },
    game_max_files: 993,
    game_max_bytes: 48 * 1024 * 1024,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
}

main();
