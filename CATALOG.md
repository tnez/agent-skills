# Agent Skills Catalog

**Repository:** tnez/agent-skills
**Last Updated:** 2025-11-16

This catalog lists all available agent skills in this repository. Use with skill-browser to discover skills and skill-installer to install them.

## Examples

Example skills demonstrating common patterns and use cases.

### find-local-events

- **Path:** examples/find-local-events
- **Added:** 2025-11-16
- **Updated:** 2025-11-16
- **Description:** Search for local events, activities, and happenings in a specified location and timeframe with location disambiguation and datetime clarification
- **Files:** SKILL.md, CONTEXT.md (template)
- **Dependencies:** None

### get-weather

- **Path:** examples/get-weather
- **Added:** 2025-11-15
- **Updated:** 2025-11-16
- **Description:** Fetch and display current weather information for a specified location using wttr.in
- **Files:** SKILL.md
- **Dependencies:** curl (via Bash)

### simple-task

- **Path:** examples/simple-task
- **Added:** 2025-11-15
- **Updated:** 2025-11-16
- **Description:** Format and validate JSON data structures - pretty-print, validate syntax, convert between formats
- **Files:** SKILL.md
- **Dependencies:** None

## Documents

Skills for document processing, conversion, and analysis.

### image-review-pdf

- **Path:** documents/image-review-pdf
- **Added:** 2025-11-16
- **Updated:** 2025-11-16
- **Description:** Review and analyze images within PDF documents with composable library functions
- **Files:** SKILL.md, lib/, scripts/, examples/
- **Dependencies:** Python, PyMuPDF (fitz)

### markdown-to-pdf

- **Path:** documents/markdown-to-pdf
- **Added:** 2025-11-15
- **Updated:** 2025-11-16
- **Description:** Convert markdown files to professionally formatted PDF documents using Pandoc
- **Files:** SKILL.md, scripts/convert.sh
- **Dependencies:** pandoc, texlive (or similar TeX distribution)

## Meta

Skills for managing, creating, and evaluating other skills.

### install-skill

- **Path:** meta/install-skill
- **Added:** 2025-11-15
- **Updated:** 2025-11-16
- **Description:** Install agent skills from various sources using bash script - supports local paths, GitHub URLs, and repository shorthand
- **Files:** SKILL.md, scripts/install.sh
- **Dependencies:** bash, git, awk, find
- **Note:** This is the script-based installer. See skill-installer for pure agentic installation.

### skill-browser

- **Path:** meta/skill-browser
- **Added:** 2025-11-16
- **Updated:** 2025-11-16
- **Description:** Discover, browse, and compare agent skills from repositories - shows new skills, updates, and helps find relevant skills
- **Files:** SKILL.md
- **Dependencies:** None (pure agentic)

### skill-creator

- **Path:** meta/skill-creator
- **Added:** 2025-11-15
- **Updated:** 2025-11-16
- **Description:** Create new agent skills with templates, validation, and best practices guidance
- **Files:** SKILL.md, scripts/, templates/
- **Dependencies:** bash (for script-based creation)

### skill-evaluator

- **Path:** meta/skill-evaluator
- **Added:** 2025-11-15
- **Updated:** 2025-11-16
- **Description:** Evaluate agent skill quality using rubric-based assessment - assess effectiveness and identify improvement opportunities
- **Files:** SKILL.md, scripts/run_evaluation.py, templates/evaluation-rubric.md
- **Dependencies:** Python (for scripted evaluation)

### skill-installer

- **Path:** meta/skill-installer
- **Added:** 2025-11-16
- **Updated:** 2025-11-16
- **Description:** Install agent skills from GitHub repositories using pure agentic capabilities - no scripts or dependencies required
- **Files:** SKILL.md
- **Dependencies:** None (pure agentic - uses WebFetch, Bash, Write, Glob, Read)
- **Note:** Replaces install-skill with agent-native approach. Supports smart semantic merging for updates.

### skill-tester

- **Path:** meta/skill-tester
- **Added:** 2025-11-15
- **Updated:** 2025-11-16
- **Description:** Test and validate agent skills - verify structure, parse frontmatter, check completeness
- **Files:** SKILL.md, scripts/test.py
- **Dependencies:** Python

---

## Installation

### Quick Install

Tell your agent to install any skill:

```text
"Install find-local-events from tnez/agent-skills"
```

Your agent will use the skill-installer skill to fetch and install it.

### Browse & Discover

Explore available skills:

```text
"Browse skills in tnez/agent-skills"
"What's new in tnez/agent-skills?"
"Check for updates to my installed skills"
```

### Manual Installation

If your agent needs guidance, point it to the installer:

```text
"Use skill-installer from tnez/agent-skills to install find-local-events"
```

## Categories Explained

- **Examples**: Demonstration skills showing common patterns and use cases
- **Documents**: Skills for working with documents, PDFs, and file formats
- **Meta**: Skills for managing the skill ecosystem itself (creation, installation, testing)

## Skill Status

- ✅ **Stable**: Production-ready, well-tested
- 🔄 **Active Development**: Functional but evolving
- 🧪 **Experimental**: Early stage, may change significantly

All skills in this catalog are currently stable unless noted otherwise.

## Contributing

To add a skill to this catalog:

1. Create your skill following the [agent skills specification](https://github.com/anthropics/skills/blob/main/agent_skills_spec.md)
2. Add it to the appropriate category directory
3. Update this CATALOG.md with skill metadata
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Version History

- **2025-11-16**: Added skill-installer, skill-browser, find-local-events, image-review-pdf
- **2025-11-15**: Initial catalog with examples and meta skills

---

_This catalog is automatically used by skill-browser for skill discovery and comparison._
