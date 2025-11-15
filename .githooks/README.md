# Git Hooks

Custom git hooks for the agent-skills repository.

## Configured Hooks

### commit-msg

Strips AI and agent attribution from commit messages to maintain clean git history.

**Removes**:
- Claude Code signatures (`🤖 Generated with [Claude Code]`)
- Co-Authored-By: Claude lines
- AI-related emojis
- Other agentic attribution

**How it works**:
1. Attempts to use Claude Code in non-interactive mode to intelligently clean the message
2. Falls back to regex-based cleaning if Claude Code is unavailable
3. Preserves the actual commit message content

**Usage**: Automatic - runs on every commit

### pre-commit

Runs linting and formatting checks on staged files before commit.

**Current checks** (placeholders):
- Markdown linting (TODO: add markdownlint)
- Prettier formatting (TODO: add prettier)
- Python linting (TODO: add ruff/black)
- YAML validation (TODO: add yamllint)

**Usage**: Automatic - runs before every commit

## Setup

Hooks are automatically configured via:
```bash
git config core.hooksPath _hooks
```

This is set in `.git/config`:
```ini
[core]
    hooksPath = _hooks
```

## Adding New Linters

### Markdown Linting

```bash
npm install -g markdownlint-cli
```

Update `_hooks/pre-commit`:
```bash
markdownlint '**/*.md' --ignore node_modules
```

### Prettier

```bash
npm install -g prettier
```

Update `_hooks/pre-commit`:
```bash
prettier --check '**/*.{md,json,yml,yaml}'
```

### Python Linting (Ruff)

```bash
pip install ruff
```

Update `_hooks/pre-commit`:
```bash
ruff check meta/*/scripts/*.py
```

### YAML Linting

```bash
pip install yamllint
```

Update `_hooks/pre-commit`:
```bash
# Create .yamllint config first
yamllint **/*.md  # Check YAML frontmatter
```

## Testing Hooks

### Test commit-msg hook

```bash
# Create a test commit with AI attribution
echo "test file" > test.txt
git add test.txt
git commit -m "Test commit

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Check the actual commit message was cleaned
git log -1 --pretty=%B
```

### Test pre-commit hook

```bash
# Hook runs automatically on commit
git add <file>
git commit -m "message"
```

## Bypassing Hooks

If you need to bypass hooks (use sparingly):

```bash
# Skip all hooks
git commit --no-verify -m "message"

# Skip specific hook by temporarily removing execute permission
chmod -x _hooks/pre-commit
git commit -m "message"
chmod +x _hooks/pre-commit
```

## Maintenance

- Hooks are version-controlled in `_hooks/`
- All team members automatically get the hooks via `git config core.hooksPath _hooks`
- Update hooks by editing files in `_hooks/` and committing

## Troubleshooting

**Hook not running**:
```bash
# Verify hooksPath is set
git config --get core.hooksPath

# Verify hook is executable
ls -la _hooks/
```

**Claude Code not available**:
- commit-msg hook falls back to regex-based cleaning
- No action needed, hook will still work

**Pre-commit failing**:
- Check which linter is failing
- Fix the issue or update the hook configuration
- Use `--no-verify` only as last resort
