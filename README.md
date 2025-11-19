# .agents Directory

A curated collection of agent capabilities including skills, workflows, and tooling for building agentic projects.

## What is the .agents Directory?

The `.agents/` directory is a standardized location for agent-related resources in your project. It provides a consistent structure for:

- **Skills** - Focused, reusable capabilities (convert markdown to PDF, validate YAML, etc.)
- **Workflows** - Multi-step orchestrations that compose skills and tools
- **Meta-tooling** - Tools for creating, testing, and managing agent capabilities

Think of it as your project's "agent workspace" - everything your AI agent needs to work effectively on your codebase.

## Directory Structure

When consumed, this repository installs to your project's `.agents/` directory:

```text
.agents/
├── skills/           # Focused, reusable capabilities
│   ├── meta/         # Tools for skill management
│   ├── examples/     # Example implementations
│   └── documents/    # Document processing
└── workflows/        # Multi-step orchestrations
    └── examples/     # Example workflows
```

## Installation

### The Agentic Way (Recommended)

This repository is designed for **agentic installation** - your AI agent can install resources directly without scripts or package managers.

Simply tell your agent:

```text
"Install find-local-events skill from tnez/dot-agents"
"Install skills from tnez/dot-agents"
```

Your agent will:

1. Fetch the files from GitHub
2. Detect your `.agents/` directory (or ask where to install)
3. Map repository structure to installation location:
   - `skills/` → `.agents/skills/`
   - `workflows/` → `.agents/workflows/`
4. Verify installation

**No npm, pip, or bash scripts required** - your agent handles everything using its built-in capabilities.

### Discovery & Updates

Browse available resources:

```text
"Browse skills in tnez/dot-agents"
"What workflows are available?"
"Show me document-related skills"
```

Check for updates:

```text
"Check for updates to my installed skills"
"Update skill-installer"
```

See [CATALOG.md](CATALOG.md) for the complete list.

### How It Works

Your agent uses meta-skills from this repository:

- **skill-installer**: Fetches and installs skills from GitHub
- **skill-browser**: Discovers available skills and workflows

Both are pure agentic - they teach your agent HOW to install, rather than providing scripts to run.

### Installation Locations

Resources install to these locations (in priority order):

1. `.agents/` - Project-level, agent-agnostic (preferred)
2. `.claude/` - Project-level, Claude-specific
3. `~/.agents/` - Global, agent-agnostic
4. `~/.claude/` - Global, Claude-specific

Your agent will auto-detect or ask where to install.

## Repository Development Structure

```text
worktrees/main/
├── CATALOG.md             # Machine-readable catalog
├── skills/                # → .agents/skills/ when consumed
│   ├── meta/              # Skill management tools
│   │   ├── skill-installer/
│   │   ├── skill-browser/
│   │   ├── skill-creator/
│   │   ├── skill-tester/
│   │   └── skill-evaluator/
│   ├── examples/          # Example implementations
│   │   ├── find-local-events/
│   │   ├── get-weather/
│   │   └── simple-task/
│   └── documents/         # Document processing
│       ├── image-review-pdf/
│       └── markdown-to-pdf/
└── workflows/             # → .agents/workflows/ when consumed
    ├── README.md
    └── examples/
```

## Quick Start

### For Agents

Resources are loaded automatically when relevant to your task. Each provides:

- Clear instructions for when and how to use it
- Templates and examples
- Validation and testing tools

### For Humans

1. **Browse skills**: Explore `skills/` directory
2. **Browse workflows**: Explore `workflows/` directory
3. **Use meta-skills**: Leverage skill-creator, skill-tester, skill-evaluator
4. **Create custom resources**: Follow specifications in each directory's README
5. **See development workflows**: Check WORKFLOWS.md for development patterns

## Skills

Skills are focused, reusable capabilities that agents load dynamically. Each skill is a self-contained directory with:

- `SKILL.md` - Required markdown file with YAML frontmatter and instructions
- `CONTEXT.md` - Optional user/project-specific context and customizations
- Optional supporting files (scripts, templates, assets, references)

**Format**:

```markdown
---
name: skill-name
description: What the skill does and when to use it
license: MIT
---

# Skill Instructions

Imperative instructions for the agent...
```

**CONTEXT.md Pattern**: Co-locate a `CONTEXT.md` file with any `SKILL.md` to inject user or project-specific context. The skill remains general and reusable while `CONTEXT.md` provides customization. This file is preserved during skill updates.

See [Agent Skills Specification](https://github.com/anthropics/skills/blob/main/agent_skills_spec.md) for details.

## Workflows

Workflows are multi-step orchestrations that compose skills, tools, and agent behaviors. They handle complex tasks requiring:

- Multiple phases or steps
- Decision making and conditionals
- Coordination of multiple skills
- Standardized procedures

See `workflows/README.md` for details on creating workflows.

## Meta-Skills

### skill-installer ⭐

Pure agentic skill installation from GitHub repositories. Features:

- Zero dependencies (uses WebFetch, Bash, Write, Glob)
- Smart semantic merging for updates
- CONTEXT.md preservation for user customizations
- Auto-detects installation location

**New paradigm**: Your agent installs skills, not scripts.

### skill-browser ⭐

Discover and browse available skills. Features:

- Reads CATALOG.md to show available resources
- Compares with local installation
- Identifies updates and new additions
- Filters by category or relevance

**Usage**: "Browse skills in tnez/dot-agents" or "What's new?"

### skill-creator

Scaffold new skills with proper structure and validation. Generates:

- SKILL.md with valid YAML frontmatter
- Directory structure (scripts, templates, assets)
- Validation checks for spec compliance

### skill-tester

Validate skills against the specification. Tests:

- YAML frontmatter correctness
- File references and structure
- Common issues and anti-patterns

### skill-evaluator

Assess skill quality using rubric-based evaluation. Evaluates:

- Clarity and actionability
- Completeness and focus
- Examples and documentation quality

## Contributing

When creating new skills or workflows:

1. Use `skill-creator` for skills or follow `workflows/README.md` for workflows
2. Test with `skill-tester` to ensure spec compliance
3. Evaluate with `skill-evaluator` for quality assurance
4. Follow the test → evaluate → refine cycle

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Resources

- [Agent Skills Specification](https://github.com/anthropics/skills/blob/main/agent_skills_spec.md)
- [Anthropics Skills Repository](https://github.com/anthropics/skills)
- [Development Workflows](DEVELOPMENT.md)

## License

MIT
