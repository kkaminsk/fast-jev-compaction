## Context

`hooks/hooks.json` registers a function hook: `{ "modules": ["./fast-jev.ts"] }`. Claude Code loads that `.ts` entry by stripping types, but it resolves the entry's **imports** with the normal Node ESM resolver. The entry imports its logic from compiled JavaScript:

```ts
import { compact, reductionRatio, resolveOptions } from '../src/compact.js';
import { buildJevRequest, DEFAULT_MODEL, parseJevResponse } from '../src/request.js';
```

But `src/` ships only `.ts` sources, `tsconfig.json` emits to `dist/` (`outDir: "dist"`, `rootDir: "src"`), and no build output is published. Loading the entry throws:

```
ERR_MODULE_NOT_FOUND: Cannot find module '…/src/compact.js' imported from '…/hooks/fast-jev.ts'
```

(reproduced with `node --experimental-strip-types hooks/fast-jev.ts`). So the plugin is `✘ failed to load` on every install. The internal `src/*.ts` modules already use consistent `./x.js` ESM specifiers, so once a build exists and the hook points at it, the whole graph resolves.

Observed constraint: a Claude Code plugin is installed by **cloning the repo**; the installed copy contained a populated `node_modules/`, which suggests Claude Code runs `npm install` at install time — but whether it runs lifecycle scripts (`prepare`) is not confirmed.

## Goals / Non-Goals

**Goals:**
- The hook entry and its whole import graph resolve to real built JavaScript present in the installed plugin.
- The fix holds for the real install path (git clone), not just a local dev checkout where someone ran `tsc`.
- A release-time check loads the hook the way Claude Code does, so this regression can't ship again.
- `package.json` and `.claude-plugin/plugin.json` agree on the version.

**Non-Goals:**
- No change to the Jev compaction algorithm or to what the hook transmits to `api.typesafe.ai`.
- Not enabling function hooks (`CLAUDE_CODE_ENABLE_FUNCTION_HOOKS`) or configuring the API key — those are runtime/user concerns, not packaging bugs.
- No change to the npm library's public API (`dist/index.js` export surface).

## Decisions

### Decision 1 — Hook imports point at the built output in `dist/`
Repoint the two value imports in `hooks/fast-jev.ts` from `../src/compact.js` / `../src/request.js` to `../dist/compact.js` / `../dist/request.js` (type-only imports can stay or also move; they are erased at load). Rationale: `tsconfig.json` already emits to `dist/`; aligning the hook with the existing build location keeps `src/` free of compiled output.
- *Alternative — emit `.js` next to sources in `src/` and keep the hook unchanged.* Rejected: mixes build output into source tree and complicates `.gitignore` and the npm `files` list.

### Decision 2 — Ship the build so it is present after a clone
Guarantee `dist/` exists in the installed plugin. Primary approach: **commit the built `dist/` to the repository** so it is present on clone regardless of whether Claude Code runs `npm install`/lifecycle scripts, and keep a `build` script plus a `prepare` script (`"prepare": "npm run build"`) so the output regenerates and stays current for npm consumers.
- *Alternative — rely on a `prepare` script alone.* Rejected as the sole mechanism until confirmed: if Claude Code installs with scripts disabled (`--ignore-scripts`) or doesn't run `npm install` for a given install path, `dist/` would be absent again. Committing `dist/` is the robust baseline; `prepare` is the convenience layer. If Open Question 1 confirms Claude Code always builds on install, the committed `dist/` can be dropped in a follow-up.
- Update `package.json` `files` to include `dist` (already present) and ensure `.gitignore` does not exclude the committed build.

### Decision 3 — Keep the `.ts` hook entry
Leave `hooks/hooks.json` pointing at `./fast-jev.ts`. Claude Code's function-hook loader handles the `.ts` entry (type-stripping); only its imports needed fixing. Rationale: smallest change that matches the function-hooks model.
- *Alternative — compile the hook too and register `../dist/hooks/fast-jev.js`.* Deferred: larger change, and the entry still depends on the same `dist/` modules either way.

### Decision 4 — Single source of truth for version, enforced
Set both `package.json` and `.claude-plugin/plugin.json` to the same version (bump to the next release, e.g. `0.3.1`) and add a check that fails when they disagree.

### Decision 5 — Load smoke check at release
Add a script (wired into `prepublishOnly` and/or CI) that imports the hook entry under Node the way Claude Code does and asserts it loads without `ERR_MODULE_NOT_FOUND`. This directly encodes the `plugin-hook-loading` spec's verification requirement.

## Risks / Trade-offs

- **Committed `dist/` can drift from `src/`.** → `prepare`/`build` regenerate it and the load smoke check + a "dist is up to date" CI step catch staleness before publish.
- **Uncertainty about Claude Code's install mechanics.** → Committing `dist/` makes correctness independent of whether install runs scripts; the open question only affects whether we can later simplify.
- **Function hooks still require `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` and an API key.** → Out of scope here; documented as a separate runtime prerequisite so users don't mistake it for this bug.
- **Node type-stripping vs. Claude Code's actual loader may differ.** → The smoke check should use the same Node invocation Claude Code uses if determinable; otherwise `node --experimental-strip-types` on the entry is a close proxy and already reproduces the failure.

## Migration Plan

1. Add `build` + `prepare` scripts; build `dist/`.
2. Repoint hook imports to `../dist/*.js`.
3. Commit the built `dist/`; confirm `.gitignore`/`files` include it.
4. Reconcile the version in both manifests; add the version-agreement check.
5. Add the hook-load smoke check; wire into `prepublishOnly`/CI.
6. Publish the new version. Users run `claude plugin update fast-jev-compaction` and restart Claude Code.

Rollback: revert to the prior tag; the plugin returns to its previous (non-loading) state, so there is no functional regression to roll back from.

## Open Questions

1. Does Claude Code run `npm install` with lifecycle scripts (`prepare`) enabled when installing a plugin from a marketplace clone? If yes, a committed `dist/` could later be dropped in favour of `prepare`-only.
2. What exact Node runtime/loader does Claude Code use for function-hook modules? Confirms that `.js` resolution and a `.ts` entry behave as assumed, and lets the smoke check mirror it precisely.
