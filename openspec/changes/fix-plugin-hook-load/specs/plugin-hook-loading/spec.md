## ADDED Requirements

### Requirement: Plugin hook loads in Claude Code
The plugin's hook entry module and every module it imports SHALL resolve to existing JavaScript when loaded, so Claude Code loads the hook without module-resolution errors.

#### Scenario: Fresh install is enabled
- **WHEN** the plugin is installed as a Claude Code plugin with function hooks enabled and Claude Code is restarted
- **THEN** `claude plugin list` reports `fast-jev-compaction` as enabled and not `failed to load`

#### Scenario: Hook entry imports resolve
- **WHEN** the hook entry module is loaded by the Node runtime Claude Code uses for function hooks
- **THEN** every static import in the hook's module graph resolves to an existing file and no `ERR_MODULE_NOT_FOUND` is raised

### Requirement: Built output ships with the installed plugin
Because Claude Code installs a plugin by cloning its repository rather than building it, the compiled JavaScript the hook depends on SHALL be present in the installed plugin without the user running a separate build.

#### Scenario: Installed from a clone without a manual build
- **WHEN** the repository is installed as a Claude Code plugin and no build command is run by the user
- **THEN** the compiled modules the hook imports exist on disk at the paths the hook imports them from

#### Scenario: Import paths match the shipped output location
- **WHEN** the hook imports a dependency module
- **THEN** the import specifier points at the location where the shipped build places that module (not a location that only exists in sources or is excluded from the install)

### Requirement: Release verification of hook loading
The project SHALL provide an automated check that loads the hook entry module the way Claude Code does and fails when any import cannot be resolved.

#### Scenario: Broken or missing build is caught before publish
- **WHEN** the hook's imports reference modules that are missing or unbuilt
- **THEN** the verification check fails, preventing a release that would `fail to load` at install

#### Scenario: Correctly built plugin passes
- **WHEN** the plugin is built and packaged correctly
- **THEN** the verification check loads the hook entry without error and passes

### Requirement: Consistent published version
The plugin's version SHALL be declared identically in `package.json` and `.claude-plugin/plugin.json`.

#### Scenario: Versions agree
- **WHEN** the version is read from `package.json` and from `.claude-plugin/plugin.json`
- **THEN** the two values are equal
