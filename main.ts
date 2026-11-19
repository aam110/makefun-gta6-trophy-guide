// Leonida Legend — the hand-in program for the gta6-trophy-guide-01 bounty.
// Node 22, standard library only. It copies this repository's app/ and
// screenshots/ to the output directory (or $MAKEFUN_OUTPUT_DIR outside the
// grader) and writes /output/dossier.json with the kit's vendored library, so
// the judge reads the same dossier the scorer rebuilds. vendor/ stays
// untouched: the scorer requires the dossier to be byte for byte what its own
// copy of the library writes.
//
// Run it locally like this:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The bounty gate's caps: at most 4 screenshots of 256 KiB each, app/ at most
// 993 entries and 48 MiB, and the dossier text capped at 160 KiB.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
