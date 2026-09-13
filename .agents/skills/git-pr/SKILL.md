---
name: git-pr
description: Guide for creating effective Pull Requests. Use when opening PRs, writing PR descriptions, requesting reviews, or managing PR workflow.
---

# Git Pull Requests

This skill provides guidance for creating clear, reviewable Pull Requests that facilitate efficient code review.

## When to Use This Skill

- Opening a new Pull Request
- Writing PR titles and descriptions
- Choosing merge strategy
- Managing PR workflow

## Branch Naming

| Prefix | Use Case | Example |
|--------|----------|---------|
| `feature/` | New features | `feature/user-auth` |
| `fix/` | Bug fixes | `fix/login-crash` |
| `hotfix/` | Urgent production fixes | `hotfix/security-patch` |
| `release/` | Release preparation | `release/v2.1.0` |
| `docs/` | Documentation | `docs/api-guide` |
| `refactor/` | Code refactoring | `refactor/auth-module` |

**Naming Rules:**
- Lowercase with hyphens
- Include ticket number if available: `feature/JIRA-123-user-auth`
- Keep short but descriptive

## PR Title

Follow the same format as commit messages:

```
<type>(<scope>): <description>
```

**Examples:**
```
feat(auth): add OAuth2 login support
fix(cart): resolve duplicate item bug
docs: update API documentation
```

## PR Description Template

```markdown
## Summary
Brief description of what this PR does.

## Changes
- Change 1
- Change 2
- Change 3

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Closes #123
```

## PR Size Guidelines

| Size | Lines Changed | Review Time | Recommendation |
|------|--------------|-------------|----------------|
| XS | < 50 | ~10 min | ✅ Ideal |
| S | 50-200 | ~30 min | ✅ Good |
| M | 200-400 | ~1 hour | ⚠️ Consider splitting |
| L | 400-800 | ~2 hours | ⚠️ Split if possible |
| XL | > 800 | Hours | ❌ Split required |

> [!TIP]
> Smaller PRs get reviewed faster and have fewer bugs. Aim for < 400 lines.

## Draft vs Ready

| State | When to Use |
|-------|-------------|
| **Draft** | Work in progress, not ready for review |
| **Ready** | Complete, tested, ready for review |

```bash
# Create as draft
gh pr create --draft

# Mark ready for review
gh pr ready
```

## Requesting Reviews

**Choose reviewers who:**
- Own the code area being changed
- Have context on the feature/issue
- Are available (check workload)

**Minimum reviewers:**
- Small changes: 1 reviewer
- Medium changes: 2 reviewers
- Large/critical changes: 2-3 reviewers

## Merge Strategies

| Strategy | Use When | Commit History |
|----------|----------|----------------|
| **Merge commit** | Preserving full history | All commits + merge commit |
| **Squash and merge** | Many small commits | Single commit |
| **Rebase and merge** | Clean, linear history | Individual commits, no merge |

**Recommendations:**
- Default: **Squash and merge** for feature branches
- Use **Rebase** for clean, well-organized commits
- Use **Merge commit** when history matters

## Resolving Conflicts

```bash
# Update your branch with target
git fetch origin
git rebase origin/main
# OR
git merge origin/main

# Resolve conflicts in files
# Then continue
git rebase --continue
# OR
git merge --continue

# Force push (if rebased)
git push --force-with-lease
```

## Decision Tree

```
PR Workflow
├── Create branch
│   └── Use naming convention: feature/, fix/, etc.
├── Make changes
│   └── Commit using Conventional Commits
├── Open PR
│   ├── Work in progress → Create as Draft
│   └── Ready for review → Create as Ready
├── Get reviews
│   ├── Changes requested → Address feedback, re-request
│   └── Approved → Proceed to merge
└── Merge
    ├── Many small commits → Squash and merge
    ├── Clean commit history → Rebase and merge
    └── Need full history → Merge commit
```

## Common Mistakes

| Mistake | Solution |
|---------|----------|
| Huge PR (>500 lines) | Split into smaller, focused PRs |
| Vague title "Fix stuff" | Use descriptive title with type |
| No description | Always explain what and why |
| Merging without review | Wait for required approvals |
| Not resolving conflicts | Update branch before merging |

## GitHub CLI Commands

```bash
# Create PR
gh pr create --title "feat: add feature" --body "Description"

# Create draft PR
gh pr create --draft

# View PR status
gh pr status

# Request review
gh pr edit --add-reviewer username

# Merge PR
gh pr merge --squash

# Close PR
gh pr close
```

## Resources

- [PR Template](./resources/pr-template.md) - Copy to `.github/PULL_REQUEST_TEMPLATE.md` in your repo

## Related Skills

- [Git Commit](../git-commit/SKILL.md) - Writing commit messages
- [Git Review](../git-review/SKILL.md) - Reviewing PRs
