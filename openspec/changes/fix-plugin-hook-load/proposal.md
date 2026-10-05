## Why

Installing `fast-jev-compaction` as a Claude Code plugin leaves it `✘ failed to load`: the hook entry `hooks/fast-jev.ts` imports compiled modules (`../src/compact.js`, `../src/request.js`) that do not exist. The repository ships only TypeScript sources in `src/`, the build emits to `dist/`, and no build output is published, so Node's ESM resolver throws `ERR_MODULE_NOT_FOUND` and the plugin never runs. The package is unusable as shipped.

## What Changes

- Align the hook's import paths with the plugin's actual built output so Node can resolve the hook's module graph at load time.
- Guarantee the compiled JavaScript the hook depends on is present wherever the plugin is installed (built or shipped as part of install, since Claude Code installs a plugin by cloning the repo, not by building it).
- Add a release check that loads the hook module the way Claude Code does, so a missing-build or wrong-path regression fails before publish instead of at install.
- Fix the package version mismatch (`package.json` says `0.2.0`, `.claude-plugin/plugin.json` says `0.3.0`) so the published version is unambiguous.

## Capabilities

### New Capabilities
- `plugin-hook-loading`: The plugin's Claude Code hook loads successfully — its entry module and every module it imports resolve to real, built JavaScript that ships with the installed plugin.

### Modified Capabilities
<!-- None. The fork has no existing specs; this is the first capability. -->

## Impact

- **Code:** `hooks/fast-jev.ts` (import specifiers); `src/` module internals are unaffected (they already use consistent `.js` specifiers).
- **Build/packaging:** `tsconfig.json` (emit location), `package.json` (`files`, build/`prepare` scripts, `version`), `.gitignore`, and the shipped build artifacts. Possibly `.claude-plugin/` manifest if the hook path changes.
- **Behavior:** None to the Jev compaction logic or its data flow — this is a packaging/load fix only. No change to what the hook sends to `api.typesafe.ai`.
- **Verification:** a new load smoke check (and/or CI step) that imports the hook entry under Node, plus `claude plugin list` reporting the plugin `enabled`.
