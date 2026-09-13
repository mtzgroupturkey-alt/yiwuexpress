---
name: advanced-skill
description: An advanced skill example with all optional sections and external files.
---

# Advanced Skill

This example demonstrates a complete skill with all optional sections and external file references.

## When to Use This Skill

- When you need a full-featured skill template
- When your skill requires scripts, examples, and resources
- When you need to organize a complex skill

## Prerequisites

- Node.js >= 18
- npm or yarn

## How to Use

### Step 1: Initialize

```bash
./scripts/init.sh
```

### Step 2: Configure

Edit `resources/config.json` with your settings.

### Step 3: Run

```bash
./scripts/run.sh --help
```

## Decision Tree

```
Is the skill complex?
├── YES
│   ├── Has multiple examples? → Use examples/ folder
│   ├── Has helper scripts? → Use scripts/ folder
│   └── Has templates? → Use resources/ folder
└── NO
    └── Keep everything in SKILL.md
```

## Examples

For complete examples, see:
- [Basic Usage](./examples/basic-usage.js)
- [With Options](./examples/with-options.js)
- [Error Handling](./examples/error-handling.js)

## Scripts

| Script | Description |
|--------|-------------|
| `scripts/init.sh` | Initialize the environment |
| `scripts/run.sh` | Run the main process |
| `scripts/validate.sh` | Validate configuration |

## Resources

- [Config Template](./resources/config.json)
- [Component Template](./resources/template.tsx)

## Best Practices

- Keep SKILL.md under 500 lines
- Use relative paths for links
- Include `--help` in all scripts
- Add README.md to examples/ folder

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Script not found | Run `chmod +x scripts/*.sh` |
| Config error | Check `resources/config.json` format |

## Related Skills

- `create-ai-skill` - For creating new skills
- `documentation` - For writing docs
