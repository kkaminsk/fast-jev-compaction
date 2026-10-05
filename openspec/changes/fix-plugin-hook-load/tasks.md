## 1. Build the plugin

- [ ] 1.1 Confirm `tsconfig.json` emits `dist/` from `src/` (`outDir: dist`, `rootDir: src`); ensure a `build` script (`tsc`) exists in `package.json`. Run it and verify `dist/compact.js`, `dist/request.js`, `dist/types.js`, and the rest of `src/` are emitted.
- [ ] 1.2 Add a `prepare` script (`"prepare": "npm run build"`) so `npm install` regenerates `dist/` for npm consumers.

## 2. Point the hook at the built output

- [ ] 2.1 In `hooks/fast-jev.ts`, change the value imports `../src/compact.js` → `../dist/compact.js` and `../src/request.js` → `../dist/request.js` (and the `../src/types.js` type import → `../dist/types.js`). Verify `node --experimental-strip-types hooks/fast-jev.ts` no longer throws `ERR_MODULE_NOT_FOUND`.

## 3. Ship the build with the installed plugin

- [ ] 3.1 Ensure `.gitignore` does not exclude `dist/` and `package.json` `files` includes `dist`; commit the built `dist/`.
- [ ] 3.2 Verify a fresh `git clone` of the repo contains `dist/` with every module the hook imports (simulating Claude Code's clone-based install, which does not build).

## 4. Reconcile version metadata

- [ ] 4.1 Set `package.json` `version` and `.claude-plugin/plugin.json` `version` to the same value (bump to the next release, e.g. `0.3.1`).
- [ ] 4.2 Add a check (script or test) that fails when the two declared versions differ.

## 5. Verify hook loading automatically

- [ ] 5.1 Add a load smoke check that imports the hook entry under Node (mirroring Claude Code's function-hook loader as closely as determinable) and asserts it loads with no resolution error; wire it into `prepublishOnly` and/or CI.
- [ ] 5.2 Add a "dist is up to date" check (rebuild and fail if `git status` shows changes under `dist/`) so the committed build cannot silently drift from `src/`.

## 6. End-to-end confirmation and docs

- [ ] 6.1 Install the fixed plugin from the fork, enable function hooks, restart Claude Code, and verify `claude plugin list` shows `fast-jev-compaction` as `enabled` (not `failed to load`) and `/doctor` reports no fast-jev error.
- [ ] 6.2 Update the README so the function-hooks prerequisite (`CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`) and the `TYPESAFE_API_KEY` requirement are clearly stated as separate from the load fix.
