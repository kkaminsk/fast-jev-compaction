// Rebuilds the plugin and fails if the committed dist/ differs from a fresh
// build, so the shipped build cannot silently drift from src/.
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

execFileSync(npm, ['run', 'build'], { cwd: root, stdio: 'inherit' });

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
