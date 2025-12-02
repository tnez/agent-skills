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

```
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
