# Sorbet VSCode Extension — Stile Fork

## Why we forked

This fork of [sorbet/sorbet](https://github.com/sorbet/sorbet) adds one change
to the VSCode extension (`vscode_extension/`) specific to Stile's Docker-based
development workflow:

**TCP transport** — the extension can connect to an already-running Sorbet LSP
server over a TCP socket instead of spawning a local subprocess. This allows
the LSP to run inside Docker Compose and be used from a host VSCode window
without any local Ruby/Bundler setup.

See the [TCP Transport section of README.md](README.md#tcp-transport-docker--remote-lsp)
for the full protocol specification and server wrapper requirements.

> **Note:** Open your projects using `.code-workspace` files rather than bare
> folders. VSCode keys its per-window runtime state (including whether Sorbet
> is enabled and which config is selected) to the workspace identifier — a
> `.code-workspace` file path is unique per project, whereas opening the same
> folder directly in two windows causes them to share that state and potentially
> spawn conflicting Sorbet processes. Note that settings in your global
> `settings.json` (user scope) apply to all windows regardless; this only
> isolates the runtime overrides.

## Installing from the fork

### Option 1: Download the pre-built `.vsix`

Download the `.vsix` from S3 and install it:

```sh
aws-vault exec dev -- aws s3 cp s3://stile-developers/sorbet/vscode_extension/20260304_1_sorbet.vsix sorbet.vsix
code --install-extension sorbet.vsix
```

To upload a new build after rebuilding:

```sh
aws-vault exec dev -- aws s3 cp sorbet.vsix s3://stile-developers/sorbet/vscode_extension/$(date +%Y%m%d)_1_sorbet.vsix
```

### Option 2: Build from source

```sh
git clone git@github.com:StileEducation/sorbet-1.git
cd sorbet-1/vscode_extension
yarn install
yarn generate-package   # produces sorbet.vsix
code --install-extension sorbet.vsix
```

## Keeping up to date with upstream

To pull upstream changes into the fork:

```sh
git fetch origin          # origin = sorbet/sorbet
git checkout vscode-tcp
git rebase origin/master
# resolve any conflicts, then:
git push stile vscode-tcp --force-with-lease
```

The changes are confined to `vscode_extension/` so conflicts with upstream
commits elsewhere in the monorepo are unlikely.
