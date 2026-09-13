# Agent Skills Guidelines

Standard guidelines for creating skills for AI Agents. All skills must follow these rules.

---

## 📁 Required Folder Structure

```
.agent/skills/<skill-name>/
├── SKILL.md          # Main instructions (REQUIRED)
├── scripts/          # Helper scripts (optional)
├── examples/         # Reference implementations (optional)
└── resources/        # Templates and other assets (optional)
```

### Naming Rules

| Element | Rule | Example |
|---------|------|---------|
| Folder name | lowercase, hyphens | `code-review`, `unit-testing` |
| SKILL.md | MUST be uppercase | `SKILL.md` (not `skill.md`) |
| Scripts | lowercase, hyphens | `run-tests.sh`, `validate.js` |

### When to Use External Files

> [!TIP]
> If your SKILL.md becomes too long (>500 lines), split content into the appropriate folders and link to them.

**Use `examples/` folder when:**
- You have multiple code examples
- Examples are complete, runnable files
- Examples need syntax highlighting that's hard to read inline

**Use `scripts/` folder when:**
- You have helper scripts the agent should run
- Scripts are reusable utilities

**Use `resources/` folder when:**
- You have templates, config files, or other assets
- You have images or diagrams

#### Linking to External Files

In your SKILL.md, link to external files using relative paths:

```markdown
## Examples

For complete examples, see:
- [Basic Usage](./examples/basic-usage.js) - Simple getting started example
- [Advanced Patterns](./examples/advanced-patterns.js) - Complex use cases
- [Error Handling](./examples/error-handling.js) - How to handle edge cases

## Scripts

Run the validation script:
\`\`\`bash
./scripts/validate.sh --help
\`\`\`

See [validate.sh](./scripts/validate.sh) for implementation details.

## Templates

Use the provided templates:
- [Component Template](./resources/component-template.tsx)
- [Test Template](./resources/test-template.spec.ts)
```

#### Example Folder Structure (Large Skill)

```
.agent/skills/react-components/
├── SKILL.md                          # Main instructions, links to examples
├── scripts/
│   ├── generate-component.sh         # Script to scaffold components
│   └── validate-props.js             # Prop validation utility
├── examples/
│   ├── basic-button.tsx              # Simple button example
│   ├── form-with-validation.tsx      # Form handling example
│   ├── data-fetching.tsx             # API integration example
│   └── README.md                     # Examples index/overview
└── resources/
    ├── component-template.tsx        # Starter template
    ├── test-template.spec.ts         # Test file template
    └── styles-template.module.css    # CSS module template
```

---

## 📄 SKILL.md Format

### YAML Frontmatter (Required)

Every SKILL.md MUST start with YAML frontmatter:

```yaml
---
name: skill-name
description: Clear description of what this skill does. Use when you need to do X or Y.
---
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | No | Unique identifier (lowercase, hyphens). Defaults to folder name |
| `description` | **YES** | What the skill does and when to use it. Agent sees this first |

> [!IMPORTANT]
> **Description is the most important field!** The agent uses the description to decide whether to use the skill. Be clear and specific.

### Standard Content Structure

```markdown
---
name: my-skill
description: Helps with a specific task. Use when you need to do X or Y.
---

# Skill Name

Brief overview of what this skill provides.

## When to Use This Skill

- Use this when...
- This is helpful for...
- Consider this skill if...

## Prerequisites

- Required tools/dependencies
- Environment setup needed

## How to Use

Step-by-step guidance, conventions, and patterns the agent should follow.

### Step 1: [Action Name]

Detailed instructions...

### Step 2: [Action Name]

Detailed instructions...

## Decision Tree

Use this section for complex skills with multiple paths:

```
Is X true?
├── YES → Do A
│   └── Then do B
└── NO → Do C
    └── Then do D
```

## Examples

### Example 1: [Scenario]

\`\`\`bash
# Example command or code
\`\`\`

## Best Practices

- Practice 1
- Practice 2

## Common Pitfalls

- Pitfall 1: How to avoid
- Pitfall 2: How to avoid
```

---

## ✅ Validation Checklist

Before publishing a skill, verify:

### Structure
- [ ] Folder name is lowercase with hyphens
- [ ] Has `SKILL.md` file (correctly capitalized)
- [ ] YAML frontmatter has `description`

### Content
- [ ] Description is clear and specific (not generic)
- [ ] Has "When to Use" section
- [ ] Has "How to Use" section with specific steps
- [ ] Examples are realistic and runnable

### Best Practices
- [ ] Skill focuses on one specific task
- [ ] No overlap with other skills
- [ ] Scripts have `--help` option
- [ ] Decision tree for complex logic

---

## 🎯 Best Practices

### 1. Keep Skills Focused

```diff
- ❌ skill: "do-everything-for-project"
+ ✅ skill: "code-review"
+ ✅ skill: "unit-testing"
+ ✅ skill: "documentation"
```

### 2. Write Clear Descriptions

```diff
- ❌ description: "Helps with code"
+ ✅ description: "Reviews code changes for bugs, style issues, and best practices. Use when reviewing PRs or checking code quality."
```

### 3. Use Scripts as Black Boxes

Encourage the agent to run `script --help` instead of reading source code:

```markdown
## Available Scripts

Run `./scripts/validate.sh --help` to see all options.
Do NOT read the script source directly.
```

### 4. Include Decision Trees

For complex skills:

```markdown
## Decision Tree

What type of test?
├── Unit Test → Use `jest` with mocking
├── Integration Test → Use `supertest` for API
└── E2E Test → Use `playwright` or `cypress`
```

### 5. Provide Real Examples

```markdown
## Examples

### Reviewing a Pull Request

1. Check out the PR branch
2. Run linting: `npm run lint`
3. Run tests: `npm test`
4. Review changes file by file
```

---

## 📝 Starter Template

Copy this template to start a new skill:

```markdown
---
name: my-new-skill
description: [Clear, specific description. Include keywords for discovery.]
---

# [Skill Name]

[1-2 sentence overview]

## When to Use This Skill

- Use when [specific situation 1]
- Use when [specific situation 2]
- NOT for [exclusion case]

## Prerequisites

- [Required tool/setup 1]
- [Required tool/setup 2]

## How to Use

### Step 1: [First Action]

[Detailed instructions]

### Step 2: [Second Action]

[Detailed instructions]

## Examples

### [Example Scenario]

\`\`\`bash
# Example commands
\`\`\`

## Best Practices

- [Practice 1]
- [Practice 2]

## Troubleshooting

| Issue | Solution |
|-------|----------|
| [Problem 1] | [Fix 1] |
| [Problem 2] | [Fix 2] |
```

---

## 🗂️ Skill Locations

| Location | Scope | Use Case |
|----------|-------|----------|
| `<workspace>/.agent/skills/` | Workspace-specific | Team workflows, project conventions |
| `~/.gemini/antigravity/skills/` | Global (all workspaces) | Personal utilities, general tools |

---

## 📚 Optional Sections

Add these sections when needed:

| Section | When to Include |
|---------|-----------------|
| `## Prerequisites` | When setup is required |
| `## Decision Tree` | When there are multiple paths/options |
| `## Scripts` | When skill has helper scripts |
| `## Configuration` | When there are config options |
| `## Troubleshooting` | When there are common issues |
| `## Related Skills` | When related to other skills |
