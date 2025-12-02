# dot-agents

A framework for building and running agentic workflows with personas and scheduled execution.

## What is dot-agents?

dot-agents lets you define **personas** (agent configurations) and **workflows** (tasks for agents to execute), then run them on-demand or on a schedule. It's designed to work with any agent CLI (Claude Code, local LLMs, etc.).

**Key features:**

- **Personas** with cascading inheritance - define base configurations and extend them
- **Workflows** with triggers - run on-demand, on cron schedules, or via webhooks
- **Daemon** for background execution - scheduled workflows run automatically
- **Agent-agnostic** - works with any CLI that accepts prompts via stdin

## Installation

```bash
npm install -g dot-agents
```

Requires Node.js 20+.

## Project Setup

The easiest way to set up dot-agents is with the `init` command:

```bash
# Fresh install - creates .agents/ with default persona and sample workflow
dot-agents init

# Or in a specific directory
dot-agents init --dir /path/to/project
```

If you already have a `.agents/` directory, `init` will analyze it and guide you through migration.

### Fresh Install

Running `dot-agents init` in a directory without `.agents/` will:

1. Create the directory structure (`.agents/personas/`, `.agents/workflows/`, etc.)
2. Create a default `claude` persona
3. Create a sample `hello-world` workflow

You can also set up manually:

```bash
mkdir -p .agents/personas/claude .agents/workflows/hello
```

**Required persona fields:**

```yaml
---
name: my-persona # Required: unique identifier
cmd: "claude --print" # Required for root personas (can be inherited)
description: "..." # Optional but recommended
---
```

**Required workflow fields:**

```yaml
---
name: my-workflow # Required: unique identifier
description: "..." # Required: human-readable description
persona: my-persona # Required: must match a persona name/path
---
```

See [Quick Start](#quick-start) for a complete example.

### Migrating Existing `.agents/` Directory

If you have an existing `.agents/` directory with skills or workflows:

```bash
dot-agents init
```

The init command will:

1. Analyze your existing structure
2. Create a `personas/` directory with a default persona if missing
3. Report which workflows need frontmatter updates

**Workflow migration changes:**

| Old Field      | New Field         | Notes                                  |
| -------------- | ----------------- | -------------------------------------- |
| `goal:`        | `description:`    | Rename the field                       |
| (missing)      | `persona: claude` | Add reference to your persona          |
| `skills_used:` | (move to persona) | Skills belong in persona, not workflow |

Before:

```yaml
---
name: my-workflow
goal: Do something useful
skills_used:
  - osx/calendar
  - productivity/query-todos
---
```

After:

```yaml
---
name: my-workflow
description: Do something useful
persona: claude
on:
  manual: true
---
```

**Verify after migration:**

```bash
dot-agents list personas
dot-agents list workflows
dot-agents run my-workflow --dry-run
```

### Directory Discovery

dot-agents searches for `.agents/` in these locations (in order):

1. Current directory and ancestors (walks up the tree)
2. Home directory (`~/.agents/`)

This means you can run `dot-agents` from any subdirectory of a project.

## Quick Start

### 1. Create a `.agents` directory

```bash
mkdir -p .agents/personas/claude .agents/workflows/hello
```

### 2. Define a persona

Create `.agents/personas/claude/PERSONA.md`:

```markdown
---
name: claude
description: Base Claude persona
cmd:
  - "claude --print"
  - "claude -p"
env:
  CLAUDE_MODEL: sonnet
---

You are a helpful assistant. Execute tasks thoroughly and report results clearly.
```

### 3. Create a workflow

Create `.agents/workflows/hello/WORKFLOW.md`:

```markdown
---
name: hello-world
description: A simple hello world workflow
persona: claude
on:
  manual: true
---

Say hello and tell me today's date.
```

### 4. Run it

```bash
dot-agents run hello-world
```

## Core Concepts

### Personas

Personas define **how** an agent behaves. They specify the command to run, environment variables, available skills, and a system prompt.

```yaml
---
name: productivity-assistant
description: Focused assistant for productivity tasks
cmd: "claude --print"
env:
  CLAUDE_MODEL: sonnet
skills:
  - "productivity/**"
  - "!productivity/experimental/*"
---
System prompt goes here in the markdown body...
```

**Persona inheritance:** Personas cascade through directories. A persona at `personas/claude/autonomous/productivity/` inherits from `personas/claude/autonomous/` which inherits from `personas/claude/`.

- Scalar fields (name, description, cmd) - child overrides parent
- Objects (env) - deep merged
- Arrays (skills) - merged with `!` prefix for removal

### Workflows

Workflows define **what** an agent should do. They reference a persona and contain the task in the markdown body.

```yaml
---
name: daily-standup
description: Generate standup notes from git activity
persona: claude/autonomous
on:
  schedule:
    - cron: "0 9 * * 1-5"
  manual: true
inputs:
  - name: days
    type: number
    default: 1
    description: Days of history to analyze
---

Analyze git commits from the last ${days} day(s) and generate standup notes.
Focus on: what was accomplished, what's in progress, any blockers.
```

**Triggers:**

- `manual: true` - Can be run on-demand
- `schedule` - Cron-based scheduling (requires daemon)
- Future: `file_change`, `webhook`, `git`

### Variable Expansion

Workflows support variable expansion in the task body:

- `${VAR}` - Environment variables and inputs
- `${DATE}`, `${TIME}`, `${DATETIME}` - Current date/time
- `${RUN_ID}` - Unique execution identifier
- `{{#if var}}...{{/if}}` - Conditional blocks

## CLI Reference

```bash
dot-agents [command]

Commands:
  init                     Initialize or migrate a .agents directory
  run <workflow>           Run a workflow
  list [workflows|personas] List resources
  show workflow <name>     Show workflow details
  show persona <name>      Show resolved persona (with inheritance)
  schedule list            List scheduled workflows
  daemon run               Run the scheduler daemon
  daemon status            Check daemon status
  daemon jobs              List scheduled jobs
  daemon trigger <name>    Manually trigger a workflow

Aliases:
  workflows                List all workflows
  personas                 List all personas
```

### Running Workflows

```bash
# Run a workflow
dot-agents run daily-standup

# With input overrides
dot-agents run daily-standup -i days=3

# Dry run (show prompt without executing)
dot-agents run daily-standup --dry-run

# Override persona
dot-agents run daily-standup -p claude/autonomous
```

### Viewing Details

```bash
# Show resolved persona with full inheritance chain
dot-agents show persona claude/autonomous/productivity

# Show workflow with resolved prompt
dot-agents show workflow daily-standup --prompt
```

## Daemon

The daemon runs scheduled workflows in the background.

```bash
# Start the daemon
dot-agents daemon run

# Check status
dot-agents daemon status

# View scheduled jobs
dot-agents daemon jobs

# Manually trigger a workflow
dot-agents daemon trigger daily-standup

# Reload workflows after changes
dot-agents daemon reload
```

The daemon provides an HTTP API on port 3141 (configurable with `-p`):

- `GET /health` - Health check
- `GET /status` - Daemon status and uptime
- `GET /jobs` - List scheduled jobs
- `POST /trigger/:workflow` - Trigger a workflow
- `POST /reload` - Reload workflows from disk

## Directory Structure

```text
.agents/
├── personas/           # Agent configurations
│   └── claude/
│       ├── PERSONA.md  # Base Claude persona
│       └── autonomous/
│           ├── PERSONA.md  # Inherits from claude
│           └── productivity/
│               └── PERSONA.md  # Inherits from autonomous
├── workflows/          # Task definitions
│   └── daily-standup/
│       └── WORKFLOW.md
├── skills/             # Reusable capabilities (optional)
└── sessions/           # Execution logs
```

## Skills

dot-agents also supports skills - focused, reusable capabilities that agents can load. Skills follow the [Anthropic Skills Specification](https://github.com/anthropics/skills/blob/main/agent_skills_spec.md).

Skills are referenced in personas via glob patterns:

```yaml
skills:
  - "documents/**"
  - "productivity/*"
  - "!experimental/**"
```

See the `skills/` directory for examples.

## Development

```bash
# Clone and install
git clone https://github.com/tnez/dot-agents.git
cd dot-agents
npm install

# Build
npm run build

# Run CLI locally
just cli list workflows

# Run linters
just lint
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
