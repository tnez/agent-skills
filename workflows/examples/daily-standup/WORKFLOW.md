---
name: daily-standup-summary
description: Analyze git activity and generate standup notes

persona: claude/autonomous

on:
  schedule:
    - cron: "0 9 * * 1-5"
      inputs:
        days: 1
    - cron: "0 9 * * 1"
      inputs:
        days: 3
  manual:
    inputs:
      days:
        description: Days of history to analyze
        default: 1

inputs:
  - name: repo_path
    description: Repository path to analyze
    default: ${PWD}
  - name: days
    description: Number of days to look back
    default: 1
  - name: format
    description: Output format
    default: markdown
    enum: [markdown, slack, plain]

outputs:
  - path: standup-${DATE}.md
    description: Generated standup summary

timeout: 5m
---

# Daily Standup Summary

Generate a concise standup summary based on recent git activity.

## Context

- Repository: ${repo_path}
- Period: Last ${days} day(s)
- Date: ${DATE}
- Format: ${format}

## Task

1. Get recent git activity:

   ```bash
   git -C "${repo_path}" log --since="${days} days ago" --pretty=format:"%h %an %s" --no-merges
   ```

2. Analyze the commits and group by:
   - Author
   - Type of change (feature, fix, refactor, docs, etc.)
   - Affected areas of the codebase

3. Check for open work:

   ```bash
   git -C "${repo_path}" branch --show-current
   git -C "${repo_path}" status --short
   ```

4. Generate a summary with:
   - What was completed
   - What's in progress
   - Any blockers or notes

{{#if format == "slack"}}

## Slack Format

Format the output for Slack:

- Use emoji for status indicators
- Keep it scannable with bullet points
- Include any @mentions for blockers
  {{/if}}

{{#if format == "markdown"}}

## Output Format

Write to `standup-${DATE}.md`:

```markdown
# Standup Summary - ${DATE}

## Completed

- Brief description of completed work

## In Progress

- Current work items

## Notes

- Any blockers or important items
```

{{/if}}

## Constraints

- Keep the summary under 300 words
- Focus on what matters to the team
- Omit routine commits (formatting, typos) unless significant
