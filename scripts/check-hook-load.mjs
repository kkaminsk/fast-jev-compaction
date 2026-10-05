// Loads the plugin's hook entry the way Claude Code's function-hook loader does
// (Node with TypeScript type-stripping) and fails if any import cannot be
// resolved. This catches the "ships unbuilt / wrong import path" regression
// that leaves the plugin `failed to load` at install.
//
// Importing the hook module has no side effects: it only defines functions and
// exports `register`; the network call to TypeSafe happens inside the
// session.compact handler, never at import time.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const entry = join(root, 'hooks', 'fast-jev.ts');

const res = spawnSync(process.execPath, ['--experimental-strip-types', entry], {
  encoding: 'utf8',
});

if (res.status !== 0) {
  process.stderr.write(res.stderr || res.stdout || '');
  console.error(`\nHook entry failed to load: ${entry}`);
  console.error('Did you run `npm run build`? The hook imports ../dist/*.js.');
  process.exit(1);
}
console.log('Hook entry loaded OK.');
