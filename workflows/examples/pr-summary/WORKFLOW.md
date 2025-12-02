---
name: pr-summary
description: Generate a summary of a GitHub pull request

persona: claude/autonomous

on:
  manual:
    inputs:
      pr_url:
        description: GitHub PR URL
        required: true

inputs:
  - name: pr_url
    description: Full GitHub PR URL
    required: true
  - name: depth
    description: Analysis depth
    default: standard
    enum: [quick, standard, thorough]

outputs:
  - path: pr-summary.md
    description: Generated PR summary

timeout: 10m
---

# PR Summary

Analyze and summarize a GitHub pull request.

## Context

- PR URL: ${pr_url}
- Analysis depth: ${depth}
- Generated: ${DATETIME}

## Task

1. Fetch PR details:

   ```bash
   gh pr view "${pr_url}" --json title,body,additions,deletions,changedFiles,author,labels,state
   ```

2. Get the diff:

   ```bash
   gh pr diff "${pr_url}"
   ```

3. Analyze the changes:
   - What is being changed?
   - Why is it being changed? (based on PR description)
   - What files are affected?
   - Are there any breaking changes?

{{#if depth == "thorough"}}

4. Deep analysis:

- Review test coverage
- Check for potential security issues
- Evaluate performance implications
- Suggest improvements if any

{{/if}}

5. Write a summary covering:
   - **Overview**: 1-2 sentence summary
   - **Changes**: Key modifications
   - **Impact**: What this affects
     {{#if depth == "thorough"}}
   - **Recommendations**: Any suggestions
     {{/if}}

## Output

Write the summary to `pr-summary.md` in markdown format.
