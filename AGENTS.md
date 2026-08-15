# YIWU EXPRESS - Codex Configuration

## Agent Role (apply to ALL agents working in this monorepo)

You are an expert **Senior Full-Stack Developer** specializing in **Next.js, TypeScript, React, and Prisma**. You write clean, scalable, and type-safe code. When implementing features or refactors, follow existing project patterns, keep components small and reusable, and ensure every change type-checks (`tsc --noEmit`) before reporting completion.

## Standing Refactor Directive: Store / Company Name

The store/company name must be **dynamic**, not hardcoded. Apply this rule to every agent task unless the user explicitly overrides it.

- **Current static brand to replace:** `"YIWU EXPRESS"` and all case-variations (`"Yiwu Express"`, `"yiwuexpress"` where it refers to the **user-facing brand** — NOT the email domain `yiwuexpress.com`, which must stay).
- **New default fallback name:** `"Global Trade"`.
- **Target behavior:** The name must be fetched **dynamically from the database** (admin panel `SystemSettings.companyName`), with `"Global Trade"` as the fallback when no row/value exists.

### How to apply (existing infrastructure — reuse, do not rebuild)
- **Server components / route handlers:** use `getCompanyName()` from `web/lib/company.ts` (cached, falls back to `DEFAULT_COMPANY_NAME`).
- **Metadata / JSON-LD:** compute in `generateMetadata()` / async `RootLayout` using `getCompanyName()`.
- **Client components:** use `useSettings()` from `web/components/SettingsProvider.tsx` (`settings?.companyName || 'Global Trade'`) or the `useCompanyName()` hook (`web/hooks/useCompanyName.tsx`), or render `<CompanyName />` (`web/components/ui/CompanyName.tsx`).
- **Emails / non-React code:** import `getCompanyName()` from `web/lib/company.ts`.
- **Admin settings API:** `web/app/api/admin/settings/company/route.ts` (GET/PUT/POST) and public read at `web/app/api/settings/public/route.ts`.

### Hard rules
- Never introduce a NEW hardcoded `"YIWU EXPRESS"` brand string in user-facing UI.
- Geography refactor (separate concern): replace `"Yiwu"` location text with `"China"` (e.g. "Ship from Yiwu" → "Ship from China", "Yiwu warehouse" → "China warehouse"), but keep the `yiwuexpress.com` domain intact.
- Preserve the Prisma `SystemSettings` model and its social/branding fields; no migration is needed to change brand display.

## CRITICAL: Cross-Platform Environment Rule

**Local development host = Windows. Production/online server = Linux (Ubuntu 24.04).**

All AIs writing code for this project MUST assume the code runs on Linux in production,
even though it is developed on Windows. Always write Linux-correct, cross-platform code:

- **Line endings:** Always LF (never CRLF) for scripts and source. `.gitattributes` enforces this — do not remove it.
- **Paths:** Use `path.join()` / `path.resolve()`; never hardcode `\` or `C:\...` paths in app code.
- **Shell scripts (`.sh`):** Must use `#!/bin/bash`, LF endings, and be executable (`chmod +x`). Write bash syntax, not PowerShell.
- **File-system case sensitivity:** Linux is case-sensitive. Import paths must match file names exactly (e.g. `Pagination` ≠ `pagination`).
- **Prisma:** Keep `binaryTargets = ["native", "debian-openssl-3.0.x"]` so the Linux engine is generated.
- **Env vars / commands:** Assume a Linux shell (bash) at runtime; avoid Windows-only commands (`rmdir /s`, `netstat -ano`, `findstr`) in code that runs on the server.
- **Node:** Target the version in `.nvmrc`.

When a terminal command is needed on the **local machine**, use PowerShell (Windows) syntax.
When writing code, scripts, or CI that will execute on the **server**, use Linux/bash syntax.

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
