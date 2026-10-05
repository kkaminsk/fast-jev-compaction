// Rebuilds the plugin and fails if the committed dist/ differs from a fresh
// build, so the shipped build cannot silently drift from src/.
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Invoke the local tsc through Node directly, rather than `npm run build`:
// spawning npm.cmd without a shell throws EINVAL on Windows (Node 20+).
const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');

execFileSync(process.execPath, [tsc], { cwd: root, stdio: 'inherit' });

const status = execFileSync('git', ['status', '--porcelain', '--', 'dist'], {
  cwd: root,
  encoding: 'utf8',
}).trim();

if (status) {
  console.error('Committed dist/ is out of date with src/. Rebuild and commit:');
  console.error(status);
  process.exit(1);
}
console.log('dist/ is up to date with src/.');
