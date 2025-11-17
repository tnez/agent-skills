# Agent Skills

A curated collection of agent skills for Claude, focusing on meta-skills for skill development and quality assurance.

## What are Agent Skills?

Skills are folders of instructions, scripts, and resources that Claude loads dynamically to improve performance on specialized tasks. They function as "onboarding guides" that transform Claude into specialized agents by bundling procedural knowledge, workflows, and tool integrations.

Each skill is a self-contained directory with:

- `SKILL.md` - Required markdown file with YAML frontmatter and instructions
- Optional supporting files (scripts, templates, assets, references)

## Installing Skills

### The Agentic Way (Recommended)

This repository is designed for **agentic installation** - your AI agent can install skills directly without any scripts or package managers.

Simply tell your agent:

```text
"Install find-local-events from tnez/agent-skills"
```

Your agent will:

1. Fetch the skill files from GitHub
2. Detect your skills directory (or ask where to install)
3. Save files to the appropriate location
4. Verify installation

**No npm, pip, or bash scripts required** - your agent handles everything using its built-in capabilities.

### Discovery & Updates

Browse available skills:

```text
"Browse skills in tnez/agent-skills"
"What's new in tnez/agent-skills?"
"Show me document-related skills"
```

Check for updates:

```text
"Check for updates to my installed skills"
"Update find-local-events"
```

See [CATALOG.md](CATALOG.md) for the complete list of available skills.

### How It Works

Your agent uses two meta-skills:

- **skill-installer**: Fetches and installs skills from GitHub using WebFetch, Bash, Write, and Glob
- **skill-browser**: Discovers skills by reading CATALOG.md and comparing with local installation

Both are pure agentic skills - they teach your agent HOW to install, rather than providing scripts to run.

### Installation Locations

Skills install to these locations (in priority order):

1. `.agents/skills/` - Project-level, agent-agnostic (preferred)
2. `.claude/skills/` - Project-level, Claude-specific
3. `~/.agents/skills/` - Global, agent-agnostic
4. `~/.claude/skills/` - Global, Claude-specific

Your agent will auto-detect existing skills or ask where to install.

## Repository Structure

```text
agent-skills/
├── CATALOG.md             # Machine-readable catalog of all skills
├── examples/              # Example skills demonstrating patterns
│   ├── find-local-events/ # Search local events with location/datetime handling
│   ├── get-weather/       # Fetch weather information
│   └── simple-task/       # Minimal reference implementation
├── documents/             # Document processing skills
│   ├── image-review-pdf/  # Analyze images in PDFs
│   └── markdown-to-pdf/   # Convert markdown to PDF
└── meta/                  # Meta-skills for skill management
    ├── skill-installer/   # Install skills (pure agentic)
    ├── skill-browser/     # Discover and browse skills
    ├── skill-creator/     # Create new skills
    ├── skill-tester/      # Validate skills
    └── skill-evaluator/   # Evaluate skill quality
```

## Quick Start

### For Agents

Skills are loaded automatically when relevant to your task. Each skill provides:

- Clear instructions for when and how to use it
- Templates and examples
- Validation and testing tools

### For Humans

1. **Browse skills**: Explore `meta/` and `examples/` directories
2. **Use meta-skills**: Leverage skill-creator, skill-tester, and skill-evaluator
3. **Create custom skills**: Follow the [Agent Skills Specification](https://github.com/anthropics/skills/blob/main/agent_skills_spec.md)
4. **See workflows**: Check [WORKFLOWS.md](/Users/tnez/Code/tnez/agent-skills/main/WORKFLOWS.md) for examples

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

- Reads CATALOG.md to show available skills
- Compares with local installation
- Identifies updates and new additions
- Filters by category or relevance

**Usage**: "Browse skills in tnez/agent-skills" or "What's new?"

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

## Skill Format

Every skill requires `SKILL.md` with this structure:

```markdown
---
name: skill-name
description: Clear explanation of what the skill does and when Claude should use it
license: MIT
---

# Skill Instructions

Imperative instructions for Claude to follow...
```

**Requirements**:

- Skill directory name must match `name` field exactly
- Use hyphen-case for skill names
- Keep description clear (~200 characters)
- Explain both WHAT the skill does AND WHEN to use it

## Contributing

When creating new skills:

1. Use `skill-creator` to scaffold the structure
2. Test with `skill-tester` to ensure spec compliance
3. Evaluate with `skill-evaluator` for quality assurance
4. Follow the test → evaluate → refine cycle

## Resources

- [Agent Skills Specification](https://github.com/anthropics/skills/blob/main/agent_skills_spec.md)
- [Anthropics Skills Repository](https://github.com/anthropics/skills)
- [Workflows Documentation](/Users/tnez/Code/tnez/agent-skills/main/WORKFLOWS.md)

## License

MIT
