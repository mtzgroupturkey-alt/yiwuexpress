# YIWU EXPRESS - Claude Code Configuration

## Project Overview

YIWU EXPRESS is a global trade and logistics platform connecting buyers with suppliers and manufacturers in Yiwu, China. This is a monorepo containing:

- **web/** - Next.js 14 web application (port 3001)
- **mobile/** - React Native (Expo) mobile app (port 8081)

## gstack

Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.

Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /open-gstack-browser, /qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy, /setup-gbrain, /sync-gbrain, /retro, /investigate, /document-release, /document-generate, /codex, /cso, /autoplan, /pair-agent, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade, /learn, /ios-qa, /ios-fix, /ios-design-review, /ios-clean, /ios-sync, /make-pdf, /diagram, /spec.

## Skill Routing

When starting work on a feature:
- Run `/office-hours` first to clarify requirements and validate the problem
- For product/feature planning: `/plan-ceo-review` 
- For technical architecture: `/plan-eng-review`
- For UI/UX work: `/plan-design-review`
- Use `/autoplan` to run CEO → design → eng review automatically

Before shipping:
- Run `/review` on any branch with changes
- Run `/qa` on staging URLs to test functionality
- Run `/ship` to sync main, run tests, and open PR

For security audits:
- Run `/cso` for OWASP Top 10 + STRIDE threat modeling

For documentation:
- Run `/document-release` after shipping to update all docs
- Run `/document-generate` to create missing documentation

## Project Structure

See `.kiro/steering/structure.md` for detailed directory layout.

Key directories:
- `ecommerce-monorepo/web/app/` - Next.js App Router pages
- `ecommerce-monorepo/web/components/` - React components
- `ecommerce-monorepo/web/prisma/` - Database schema and migrations
- `ecommerce-monorepo/mobile/app/` - Expo Router file-based routing
- `ecommerce-monorepo/mobile/src/` - React Native source code

## Technology Stack

See `.kiro/steering/tech.md` for complete tech stack details.

### Web (Next.js)
- Framework: Next.js 14.2.19 (App Router)
- Styling: Tailwind CSS 3.3.0
- Database: Prisma 6.0.0 + PostgreSQL
- State: Zustand
- Auth: JWT (jose library)
- Payments: Stripe + PayPal

### Mobile (React Native)
- Framework: Expo 52.0.0
- Runtime: React Native 0.76.9
- Navigation: Expo Router
- UI: React Native Paper
- State: Zustand

## Development Commands

### Web Development
```bash
cd ecommerce-monorepo/web
npm install
npm run dev          # Start dev server (port 3001)
npm run build        # Build for production
npm run db:push      # Sync Prisma schema to database
npm run db:studio    # Open Prisma Studio GUI
```

### Mobile Development
```bash
cd ecommerce-monorepo/mobile
npm install
npm run start        # Start Expo dev server (port 8081)
npm run android      # Build for Android
npm run ios          # Build for iOS
```

## Important Notes

- Always read relevant files before making claims about code
- Use the project's existing styling patterns (Tailwind CSS)
- Follow the monorepo structure - web and mobile are separate apps
- Test changes before committing
- Use Prisma for all database operations
- Keep mobile and web API endpoints in sync

## Build & Deploy

- Web production URL: dromkok.com
- Web dev server: localhost:3001
- Mobile dev server: localhost:8081
- See `DEPLOYMENT_GUIDE.md` and `DEPLOYMENT_README.md` for deployment instructions

## Additional Context

Product details: `.kiro/steering/product.md`
Tech stack: `.kiro/steering/tech.md`
Project structure: `.kiro/steering/structure.md`
