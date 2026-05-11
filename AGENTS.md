# AGENTS.md

## Commands

| Command | What it does |
|---------|-------------|
| `npm run compile` | `tsc -p ./` — compiles `src/` → `out/` |
| `npm run watch` | `tsc -watch -p ./` |
| `npm run lint` | `eslint src --ext ts` |
| `npx vsce package` | builds `.vsix` (runs `compile` first via `vscode:prepublish`) |

No tests exist in this project.

## Architecture

```
src/
  extension.ts  — activate/deactivate, command registration, keybinding ctrl+alt+v
  clipboard.ts  — PowerShell (Windows) / osascript (macOS) clipboard image read
  cleanup.ts    — auto/manual orphan image cleanup, 2s debounce
  localize.ts   — i18n: t(key, ...args) picks zh or en based on vscode.env.language
```

Entrypoint: `extension.ts:70` (activate). Only activated for `onLanguage:markdown`.

## Key details

- **Platform**: Windows + macOS only. Linux returns error.
- **Image folder**: `./.md_filename/` (hidden dir next to the .md file). Image name: `{prefix}{timestamp}_{random}.{format}`.
- **Localization**: User-facing strings go in `localize.ts`. `package.json` command/config strings go in `package.nls.json` + `package.nls.zh-cn.json` with `%key%` references.
- **Console logs**: prefixed `[md-paste]`, view via Help → Toggle Developer Tools → Console.
- **.vscodeignore**: excludes `src/`, `tsconfig.json`, `*.ts` from the VSIX.
- **Publishing**: needs Azure DevOps PAT with `Marketplace (Manage)` scope for `vsce publish`.
