# gstack Quick Start Guide

## Installation Complete ✅

gstack has been downloaded and configured for your project!

## Next Steps

### 1. Complete the Setup (One-time)

**Close and reopen your terminal**, then run:

```bash
cd C:\Users\ASUS\.claude\skills\gstack
bash ./setup
```

This will:
- Install dependencies using Bun
- Build the gstack tools
- Link all skills to Claude Code

### 2. Enable Team Mode (Recommended)

After setup completes, run this to enable auto-updates for your team:

```bash
setup-gstack-team.bat
```

This makes gstack available to all teammates automatically.

## How to Use gstack

### Essential Skills for Your Workflow

#### 🎯 Before Building (Planning)
```
/office-hours              - Start here: Six forcing questions that reframe your product
/plan-ceo-review          - Rethink the problem, find the 10-star product
/plan-eng-review          - Lock in architecture, data flow, edge cases
/plan-design-review       - Design audit with AI Slop detection
/autoplan                 - Run CEO → design → eng review automatically
```

#### 🔨 During Development
```
/investigate              - Systematic root-cause debugging
/design-shotgun          - Generate 4-6 design variants, pick the best
/design-html             - Turn mockup into production HTML/CSS
```

#### ✅ Before Shipping (Review & Test)
```
/review                   - Find bugs that pass CI but blow up in production
/design-review           - Design audit + fixes
/qa https://staging-url   - Test your app, find bugs, fix them
/cso                     - Security audit (OWASP + STRIDE)
```

#### 🚀 Shipping
```
/ship                     - Sync main, run tests, push, open PR
/land-and-deploy         - Merge PR, wait for CI, verify production
/document-release        - Update all docs to match what you shipped
```

#### 🔍 Power Tools
```
/browse                   - Give the agent eyes (real browser)
/open-gstack-browser     - Launch GStack Browser with sidebar
/pair-agent              - Share browser with multiple AI agents
/careful                 - Safety guardrails for destructive commands
/freeze                  - Lock edits to one directory
/guard                   - Full safety mode (/careful + /freeze)
```

## Example Workflow

```
You:    I want to add a wishlist export feature
You:    /office-hours
Claude: [asks about the pain, challenges premises, generates approaches]

You:    /plan-ceo-review
Claude: [reads design doc, challenges scope, runs review]

You:    /plan-eng-review
Claude: [diagrams data flow, state machines, test matrix]

You:    Approve plan. Exit plan mode.
Claude: [implements the feature across multiple files]

You:    /review
Claude: [finds 2 issues, auto-fixes them, asks about race condition]

You:    /qa https://localhost:3001
Claude: [opens real browser, tests the feature, finds and fixes a bug]

You:    /ship
Claude: Tests: 42 → 51 (+9 new). PR: github.com/you/yiwuexpress/pull/42
```

## Your Project Context

gstack is now aware of:
- Your monorepo structure (web + mobile)
- Tech stack (Next.js + React Native)
- Database schema (Prisma)
- Development workflow
- Deployment process

All configured in `CLAUDE.md` and `.kiro/steering/` files.

## Common Commands

### Check gstack status
```bash
gstack-analytics          # View your usage dashboard
```

### Update gstack
```
/gstack-upgrade           # Upgrade to latest version
```

### Configuration
```bash
gstack-config set telemetry off     # Disable telemetry
gstack-config set auto_upgrade true # Enable auto-updates
```

## Troubleshooting

**Skills not showing?**
```bash
cd ~/.claude/skills/gstack && ./setup
```

**/browse fails?**
```bash
cd ~/.claude/skills/gstack && bun install && bun run build
```

**Want shorter commands?**
```bash
cd ~/.claude/skills/gstack && ./setup --no-prefix
# Changes /gstack-qa to /qa
```

## Learn More

- Skills deep dive: `~/.claude/skills/gstack/docs/skills.md`
- Architecture: `~/.claude/skills/gstack/ARCHITECTURE.md`
- Browser reference: `~/.claude/skills/gstack/BROWSER.md`
- Full README: `~/.claude/skills/gstack/README.md`

## Tips

1. Always start with `/office-hours` for new features
2. Use `/autoplan` to run all reviews automatically
3. Run `/qa` on staging URLs before production
4. Use `/careful` when working with production data
5. Let `/document-release` keep your docs up to date

---

**Remember:** Close and reopen your terminal first, then run the setup!

Happy shipping! 🚀
