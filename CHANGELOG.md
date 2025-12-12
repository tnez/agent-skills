# Changelog

All notable changes to dot-agents will be documented in this file.

## [0.4.1] - 2025-12-12

### Added

- **Interactive/Headless Command Modes** - Personas can define separate commands for different execution contexts
  - `cmd` as array: legacy headless-only behavior
  - `cmd` as object: `{ headless: [...], interactive: [...] }` for mode-specific commands
  - TTY auto-detection: automatically uses interactive mode when TTY available and persona supports it
  - `--interactive` flag: force interactive mode
  - `--batch` flag: force headless mode
  - `dot-agents show persona` displays both command modes

## [0.4.0] - 2025-12-12

### Added

- **Channels** - File-system-backed messaging for agent communication
  - `dot-agents channels list` - List all channels
  - `dot-agents channels publish` - Publish messages to channels
  - `dot-agents channels read` - Read messages from channels
  - `dot-agents channels reply` - Reply to message threads
  - Support for public channels (`#name`) and direct messages (`@persona`)
  - Auto-detection of sender identity via `DOT_AGENTS_PERSONA` env var
  - Default sender format: `human:$USER` or `agent:<persona>`

- **Channel Skills** - Agent-friendly wrappers for channel operations
  - `skills/channels/publish` - Publish skill
  - `skills/channels/read` - Read skill
  - `skills/channels/reply` - Reply skill
  - `skills/channels/list` - List skill

- **Executor Enhancement** - Sets `DOT_AGENTS_PERSONA` env var when running workflows

### Changed

- CLI command renamed from `channel` to `channels` (plural)

## [0.3.1] - 2025-12-02

- Previous release (see git history for details)
