// Hand-in program for "The Ember Reliquary", a top-down stealth heist game.
// Runs on Node 22 with the standard library only. It mirrors the playable
// game (game/) and its screenshots (screenshots/) into the output folder
// and asks the vendored make.fun library to summarise them as
// dossier.json, the document the judge reads.
//
// In the grader the output folder is /output; anywhere else, point
// MAKEFUN_OUTPUT_DIR at a folder of your own:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
const shotsHere = join(repoRoot, 'screenshots');
if (existsSync(shotsHere)) {
  cpSync(shotsHere, join(outDir, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
