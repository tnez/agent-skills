# Agent Workflows

Workflows are multi-step compositions that orchestrate skills, tools, and agent behaviors to accomplish complex tasks.

## What are Workflows?

While **skills** are focused, reusable capabilities (like "convert markdown to PDF" or "validate YAML"), **workflows** are larger orchestrations that compose multiple steps, decisions, and skills together.

Think of workflows as procedural guides that describe:

- **What** to accomplish (the goal)
- **When** to use this workflow (triggering conditions)
- **How** to proceed (step-by-step instructions)
- **Which** skills or tools to use at each step

## Workflow vs Skill

| Aspect          | Skill                     | Workflow                           |
| --------------- | ------------------------- | ---------------------------------- |
| Scope           | Single focused capability | Multi-step composition             |
| Example         | "Convert markdown to PDF" | "Create and publish documentation" |
| Typical length  | 50-200 lines              | 200-500+ lines                     |
| Dependencies    | Minimal, self-contained   | May compose multiple skills        |
| Decision making | Limited branching         | Complex conditionals and loops     |

## Structure

Workflows follow a similar markdown + YAML frontmatter structure as skills:

```markdown
---
name: workflow-name
description: Clear explanation of what this workflow accomplishes and when to use it
triggers:
  - condition 1
  - condition 2
skills:
  - skill-name-1
  - skill-name-2
---

# Workflow Instructions

Step-by-step instructions for the agent...
```

**CONTEXT.md Pattern**: Like skills, workflows can have a co-located `CONTEXT.md` file for user/project-specific context. Keep the workflow general and inject customization through `CONTEXT.md`.

### Workflow Fields

- `name` - Hyphen-case identifier
- `description` - What and when (similar to skills)
- `triggers` - Optional list of conditions that suggest using this workflow
- `skills` - Optional list of skills this workflow uses

## Examples

See `workflows/examples/` for reference implementations.

## When to Create a Workflow

Create a workflow when:

- The task requires multiple distinct phases
- You're composing several skills together
- There are complex decision points or conditionals
- The process needs to handle different scenarios
- You want to standardize a multi-step procedure

## When to Create a Skill Instead

Create a skill when:

- The capability is focused and reusable
- It's a single logical operation
- It can be composed into larger workflows
- You want maximum reusability

## Installation

When consumed, workflows install to `.agents/workflows/` in the user's project.
