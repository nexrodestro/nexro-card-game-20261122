// Ember Court — entrypoint: hands the game in to /output.
// Copies game/ and screenshots/ from this repository, then writes
// /output/dossier.json with buildDossier from vendor/makefun-game.ts.
//
// THE OUTPUT DIRECTORY IS NEVER REMOVED. The grader runs this program as a
// user that owns /output's contents but not /output itself, so removing the
// directory fails with EPERM and the grade run exits 1. Only the contents
// are cleared, then the game, screenshots and dossier are written fresh.
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Create the output directory if it is missing, and clear only what is
// inside it — never the directory itself.
mkdirSync(out, { recursive: true });
for (const entry of readdirSync(out)) {
  rmSync(join(out, entry), { recursive: true, force: true });
}

cpSync(join(root, 'game'), join(out, 'game'), { recursive: true });
cpSync(join(root, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// buildDossier reads game/ and screenshots/ out of the output directory and
// refuses anything it cannot read, so a failure here names the real cause.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
  }),
);
