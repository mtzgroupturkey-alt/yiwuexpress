---
name: git-review
description: Guide for conducting effective code reviews. Use when reviewing PRs, giving feedback, or establishing review standards.
---

# Git Code Review

This skill provides guidance for conducting thorough, constructive code reviews that improve code quality and team collaboration.

## When to Use This Skill

- Reviewing Pull Requests
- Giving constructive feedback
- Setting up review processes
- Training new reviewers

## Review Mindset

> [!IMPORTANT]
> **Review the code, not the person.** Focus on improving the codebase, not criticizing the author.

**Approach reviews with:**
- Curiosity, not judgment
- Suggestions, not demands
- Collaboration, not gatekeeping

## Review Checklist

### Functionality
- [ ] Code does what PR description says
- [ ] Edge cases handled
- [ ] Error handling appropriate
- [ ] No obvious bugs

### Code Quality
- [ ] Code is readable and clear
- [ ] Functions/methods have single responsibility
- [ ] No code duplication (DRY)
- [ ] Variable/function names are descriptive
- [ ] Complex logic has comments

### Testing
- [ ] Tests cover new functionality
- [ ] Tests cover edge cases
- [ ] Existing tests still pass
- [ ] Test names are descriptive

### Security
- [ ] No hardcoded secrets/credentials
- [ ] Input validation present
- [ ] No SQL injection vulnerabilities
- [ ] Authentication/authorization correct

### Performance
- [ ] No N+1 queries
- [ ] Appropriate data structures used
- [ ] No unnecessary loops/iterations
- [ ] Resources properly released

### Documentation
- [ ] Public APIs documented
- [ ] Complex logic explained
- [ ] README updated if needed
- [ ] CHANGELOG updated if needed

## Comment Types

Use prefixes to clarify intent:

| Prefix | Meaning | Blocking? |
|--------|---------|-----------|
| `nit:` | Minor nitpick, optional | ❌ No |
| `suggestion:` | Improvement idea | ❌ No |
| `question:` | Need clarification | ❌ No |
| `issue:` | Problem that needs fixing | ✅ Yes |
| `blocker:` | Must fix before merge | ✅ Yes |

**Examples:**
```
nit: Consider renaming this to `userCount` for clarity.

suggestion: This could be simplified using Array.filter().

question: Why do we need this null check here?

issue: This will throw an error if `data` is undefined.

blocker: This exposes user passwords in the response.
```

## Giving Feedback

### Do ✅

```diff
+ "Consider using a Map here for O(1) lookup instead of array.find()"
+ "This could potentially throw if user is null - maybe add a null check?"
+ "Nice solution! One thing to consider: what happens if the list is empty?"
```

### Don't ❌

```diff
- "This is wrong"
- "Why would you do it this way?"
- "This is bad code"
```

### Feedback Formula

```
[Observation] + [Impact/Reason] + [Suggestion]
```

**Example:**
> "This function is 80 lines long (observation), which makes it harder to test and maintain (impact). Consider extracting the validation logic into a separate function (suggestion)."

## Review Response Times

| PR Size | Target Response |
|---------|-----------------|
| XS (< 50 lines) | Same day |
| S (50-200) | Within 24 hours |
| M (200-400) | Within 48 hours |
| L (> 400) | Schedule review session |

> [!TIP]
> Quick reviews (even partial) are better than delayed perfect reviews.

## Approval Criteria

**Approve when:**
- All blocking issues resolved
- Code works as intended
- Tests pass and cover changes
- No security concerns

**Request changes when:**
- Blocking bugs or issues
- Security vulnerabilities
- Missing required tests
- Breaking changes unaddressed

**Comment (no approval) when:**
- Have questions but no blockers
- Need more context
- Partial review completed

## Decision Tree

```
Reviewing a PR
├── Read PR description first
│   └── Understand the "what" and "why"
├── Check diff size
│   ├── > 400 lines → Ask to split or schedule session
│   └── Manageable → Continue review
├── Review code
│   ├── Start with tests (understand intent)
│   ├── Review main implementation
│   └── Check edge cases
├── Leave comments
│   ├── Blocking issues → Use "issue:" or "blocker:"
│   ├── Suggestions → Use "suggestion:" or "nit:"
│   └── Questions → Use "question:"
└── Submit review
    ├── All good → Approve
    ├── Has blocking issues → Request changes
    └── Need more info → Comment only
```

## Review Best Practices

| Practice | Description |
|----------|-------------|
| **Be timely** | Review within 24 hours |
| **Be thorough** | Don't just skim |
| **Be specific** | Point to exact lines |
| **Be constructive** | Offer solutions |
| **Be humble** | You might be wrong |
| **Be kind** | Remember the human |

## GitHub Review Commands

```bash
# View PR diff
gh pr diff <number>

# Checkout PR locally
gh pr checkout <number>

# Add review
gh pr review <number> --approve
gh pr review <number> --request-changes --body "Please fix X"
gh pr review <number> --comment --body "Looks good overall"

# View PR checks
gh pr checks <number>
```

## Common Review Oversights

| Often Missed | How to Catch |
|--------------|--------------|
| Error handling | Search for `try`, `catch`, `throw` |
| Null checks | Look for `?.`, `??`, null guards |
| Resource cleanup | Check for open connections, streams |
| Logging | Ensure no sensitive data logged |
| Edge cases | Test with empty, null, max values |

## Resources

- [Review Checklist](./resources/review-checklist.md) - Quick reference checklist for code reviews

## Related Skills

- [Git Commit](../git-commit/SKILL.md) - Writing commit messages
- [Git PR](../git-pr/SKILL.md) - Creating Pull Requests
