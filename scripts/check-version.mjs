// Fails when package.json and .claude-plugin/plugin.json disagree on version.
// Keeps the npm package and the Claude Code plugin manifest in lockstep.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const plugin = JSON.parse(readFileSync(join(root, '.claude-plugin', 'plugin.json'), 'utf8'));

if (pkg.version !== plugin.version) {
  console.error(
    `Version mismatch: package.json ${pkg.version} vs .claude-plugin/plugin.json ${plugin.version}`,
  );
  process.exit(1);
}
console.log(`Version OK: ${pkg.version}`);
