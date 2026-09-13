---
name: create-agent-skill
description: Creates new AI agent skills following the standard guidelines. Use when you need to create a new skill, scaffold skill structure, or ensure skills follow best practices.
---

# Create AI Skill

This skill helps you create new AI agent skills that follow the standard folder structure and formatting guidelines.

## When to Use This Skill

- Creating a new skill from scratch
- Scaffolding the correct folder structure for a skill
- Ensuring a skill follows best practices
- Converting existing documentation into a skill format

## Skill Structure

Every skill MUST follow this folder structure:

```
.agent/skills/<skill-name>/
├── SKILL.md          # Main instructions (REQUIRED)
├── scripts/          # Helper scripts (optional)
├── examples/         # Reference implementations (optional)
└── resources/        # Templates and other assets (optional)
```

## How to Create a Skill

### Step 1: Create the Skill Folder

```bash
mkdir -p .agent/skills/<skill-name>
```

Use lowercase with hyphens for the folder name:
- ✅ `code-review`, `unit-testing`, `api-design`
- ❌ `CodeReview`, `unit_testing`, `apiDesign`

### Step 2: Create SKILL.md with Frontmatter

Every SKILL.md MUST start with YAML frontmatter:

```markdown
---
name: skill-name
description: Clear description of what this skill does. Use when you need to do X or Y.
---
```

> [!IMPORTANT]
> The `description` field is REQUIRED. The agent uses this to decide whether to use the skill.

> [!CAUTION]
> **All skills MUST be written in English.** This ensures consistency and accessibility across all users and AI agents.

### Step 3: Add Required Sections

Include these sections in order:

1. **Title** - `# Skill Name`
2. **Overview** - 1-2 sentence description
3. **When to Use This Skill** - Bullet points of use cases
4. **How to Use** - Step-by-step instructions
5. **Examples** - Real, runnable examples

### Step 4: Add Optional Folders (If Needed)

Create optional folders when your skill needs them:

```bash
# For helper scripts
mkdir -p .agent/skills/<skill-name>/scripts

# For code examples
mkdir -p .agent/skills/<skill-name>/examples

# For templates and assets
mkdir -p .agent/skills/<skill-name>/resources
```

## Managing Long Skills

> [!WARNING]
> **SKILL.md MUST NOT exceed 500 lines.** If your skill is getting too long, you MUST split content into external files.

### File Length Rules

| SKILL.md Length | Action Required |
|-----------------|-----------------|
| < 300 lines | ✅ OK - Keep everything in SKILL.md |
| 300-500 lines | ⚠️ Consider splitting large examples |
| > 500 lines | ❌ MUST split into external files |

### How to Split Long Skills

1. **Move examples to `examples/` folder**
   ```bash
   mkdir -p .agent/skills/<skill-name>/examples
   ```
   
2. **Move reference docs to `resources/` folder**
   ```bash
   mkdir -p .agent/skills/<skill-name>/resources
   ```

3. **Keep SKILL.md focused on:**
   - Overview and when to use
   - Quick start / essential commands
   - Links to detailed examples
   - Best practices summary

4. **Link external files in SKILL.md:**
   ```markdown
   ## Examples & Resources
   
   ### Examples
   - [Basic Usage](examples/basic-usage.md) - Getting started example
   - [Advanced Patterns](examples/advanced-patterns.md) - Complex use cases
   
   ### Resources
   - [Commands Reference](resources/commands-reference.md) - Full command list
   - [Configuration Guide](resources/configuration.md) - All config options
   ```

### What Goes Where

| Content Type | Location | Max Size |
|--------------|----------|----------|
| Overview, when to use | `SKILL.md` | - |
| Quick examples (< 50 lines) | `SKILL.md` | 50 lines each |
| Long examples (> 50 lines) | `examples/*.md` | No limit |
| Full API/command reference | `resources/*.md` | No limit |
| Helper scripts | `scripts/*.js` | No limit |
| Templates, configs | `resources/*` | No limit |

### Links Requirement

> [!IMPORTANT]
> Every file in `examples/`, `scripts/`, and `resources/` folders **MUST be linked** in SKILL.md. Unlinked files will not be discovered by the agent.

## SKILL.md Template

Use this template for new skills:

```markdown
---
name: my-skill-name
description: [Clear, specific description. Include keywords for discovery.]
---

# [Skill Name]

[1-2 sentence overview of what this skill does]

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
# Example commands or code
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

## Validation Checklist

Before finalizing a skill, verify:

### Structure
- [ ] Folder name is lowercase with hyphens
- [ ] Has `SKILL.md` file (uppercase)
- [ ] YAML frontmatter has `description`
- [ ] **All content written in English**

### Content
- [ ] Description is clear and specific
- [ ] Has "When to Use This Skill" section
- [ ] Has "How to Use" section with steps
- [ ] Examples are realistic and runnable

### Links Validation
- [ ] All `examples/` files are linked in SKILL.md
- [ ] All `scripts/` files are linked in SKILL.md
- [ ] All `resources/` files are linked in SKILL.md
- [ ] Links use relative paths (e.g., `./examples/file.js`)
- [ ] All linked files exist

### Best Practices
- [ ] Skill focuses on ONE specific task
- [ ] No overlap with existing skills
- [ ] Scripts have `--help` option
- [ ] Decision tree for complex logic

## Decision Tree

```
What are you creating?
├── New skill from scratch
│   └── Use full template above
├── Converting existing docs to skill
│   └── Extract key instructions, add frontmatter
└── Adding examples to existing skill
    └── Create examples/ folder, link from SKILL.md
```

## Common Mistakes to Avoid

| Mistake | Correct Approach |
|---------|------------------|
| Generic description | Be specific about what and when |
| Missing frontmatter | Always start with `---` block |
| Skill does too much | Split into focused sub-skills |
| Inline long examples | Move to `examples/` folder |
| Hardcoded paths | Use relative paths |
| Non-English content | Always write in English |
| Missing resource links | Link all files in examples/, scripts/, resources/ |

## Related Skills

- See [SKILL_GUIDELINES.md](./resources/SKILL_GUIDELINES.md) for the full specification
