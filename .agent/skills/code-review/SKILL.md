---
name: code-review
description: Reviews code changes for bugs, style issues, security vulnerabilities, and best practices. Use when reviewing PRs, checking code quality, or validating implementations.
---

# Code Review Skill

Systematic approach to reviewing code changes for quality, correctness, and maintainability.

## When to Use This Skill

- Reviewing pull requests or merge requests
- Checking code quality before committing
- Validating implementation against requirements
- Finding potential bugs or security issues
- Ensuring code follows project conventions

## Review Checklist

### 1. Correctness
- [ ] Does the code do what it's supposed to do?
- [ ] Are edge cases handled properly?
- [ ] Are error conditions handled gracefully?
- [ ] Is the logic correct and complete?

### 2. Security
- [ ] No hardcoded credentials or secrets
- [ ] Input validation is present
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (proper escaping)
- [ ] Authentication/authorization checks

### 3. Code Quality
- [ ] Follows project coding standards
- [ ] Meaningful variable and function names
- [ ] No code duplication (DRY principle)
- [ ] Functions are focused and single-purpose
- [ ] Proper use of comments (why, not what)

### 4. Performance
- [ ] No obvious inefficiencies (N+1 queries, etc.)
- [ ] Appropriate data structures used
- [ ] Caching considered where appropriate
- [ ] No memory leaks or resource leaks

### 5. Maintainability
- [ ] Code is readable and self-documenting
- [ ] Complex logic is well-commented
- [ ] Tests are included for new functionality
- [ ] Documentation updated if needed

## How to Provide Feedback

### Be Specific
```diff
- ❌ "This code is wrong"
+ ✅ "The null check on line 42 should happen before accessing user.name"
```

### Explain Why
```diff
- ❌ "Use const instead of let"
+ ✅ "Use const instead of let since this value is never reassigned"
```

### Suggest Alternatives
```diff
- ❌ "This is inefficient"
+ ✅ "Consider using a Map instead of array.find() for O(1) lookup"
```

### Use Appropriate Severity

| Prefix | Meaning |
|--------|---------|
| `🔴 BLOCKER:` | Must fix before merge |
| `🟠 SHOULD:` | Should fix, but not blocking |
| `🟡 COULD:` | Nice to have improvement |
| `💡 NIT:` | Minor style preference |
| `❓ QUESTION:` | Need clarification |

## Decision Tree

```
Is this a critical/security issue?
├── YES → 🔴 BLOCKER - Must fix
└── NO
    ├── Does it affect functionality?
    │   ├── YES → 🟠 SHOULD - Fix recommended
    │   └── NO
    │       ├── Improves code quality?
    │       │   ├── YES → 🟡 COULD - Nice improvement
    │       │   └── NO → 💡 NIT - Optional
```

## Example Review Comments

### Good Example
```
🔴 BLOCKER: SQL Injection vulnerability

The user input is directly interpolated into the SQL query on line 87:
`db.query(`SELECT * FROM users WHERE id = ${userId}`)`

Please use parameterized queries instead:
`db.query('SELECT * FROM users WHERE id = ?', [userId])`
```

### Another Example
```
🟡 COULD: Consider extracting to helper function

Lines 45-60 duplicate the validation logic from AuthService.
Consider extracting to a shared helper:

`const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);`
```

## Best Practices

1. **Review in context** - Understand the PR's purpose before diving into code
2. **Be constructive** - Focus on the code, not the person
3. **Acknowledge good work** - Praise well-written code
4. **Ask questions** - If unsure, ask rather than assume
5. **Keep it focused** - Don't bring up unrelated issues
6. **Be timely** - Review promptly to unblock teammates
