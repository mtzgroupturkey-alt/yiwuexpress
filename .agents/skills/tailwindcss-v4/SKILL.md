---
name: tailwindcss-v4
description: Guide for using Tailwind CSS v4 with CSS-first configuration. Use when setting up Tailwind v4, customizing themes, or migrating from v3. Does NOT use tailwind.config.js.
---

# Tailwind CSS v4

This skill provides guidance for using Tailwind CSS v4, which introduces a completely new CSS-first configuration approach.

## When to Use This Skill

- Setting up a new project with Tailwind CSS v4
- Customizing theme (colors, spacing, fonts)
- Migrating from Tailwind CSS v3
- Understanding v4-specific syntax and utilities

> [!CAUTION]
> **Do NOT use this skill for Tailwind CSS v3 projects.** v4 uses completely different configuration syntax.

## Key Differences from v3

### 1. Import Syntax

```css
/* ❌ v3 (OLD) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ✅ v4 (NEW) */
@import "tailwindcss";
```

### 2. Configuration Approach

| v3 | v4 |
|----|-----|
| `tailwind.config.js` | CSS `@theme` block |
| JavaScript-based | CSS-first |
| Separate config file | Inline in CSS |

### 3. Browser Requirements

v4 requires modern browsers:
- Safari 16.4+
- Chrome 111+
- Firefox 128+

> [!WARNING]
> If you need to support older browsers, use Tailwind CSS v3.4 instead.

### 4. Removed/Renamed Utilities

| v3 (Removed) | v4 Alternative |
|--------------|----------------|
| `bg-opacity-*` | `bg-black/50` |
| `text-opacity-*` | `text-black/50` |
| `flex-grow-*` | `grow-*` |
| `flex-shrink-*` | `shrink-*` |

| v3 Name | v4 Name |
|---------|---------|
| `shadow-sm` | `shadow-xs` |
| `shadow` | `shadow-sm` |
| `blur-sm` | `blur-xs` |
| `blur` | `blur-sm` |
| `rounded-sm` | `rounded-xs` |
| `rounded` | `rounded-sm` |
| `outline-none` | `outline-hidden` |
| `ring` | `ring-3` |

### 5. Default Changes

- `border-*` now uses `currentColor` (was `gray-200`)
- `ring` width is now `1px` (was `3px`)
- Variant stacking: left-to-right (was right-to-left)

## Installation

### Option 1: Vite (Recommended)

```bash
npm install tailwindcss @tailwindcss/vite
```

```js
// vite.config.js
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

```css
/* src/styles.css */
@import "tailwindcss";
```

### Option 2: Next.js

```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

```js
// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

```css
/* app/globals.css */
@import "tailwindcss";
```

### Option 3: PostCSS

```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

```js
// postcss.config.js
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### Option 4: CLI

```bash
npm install tailwindcss @tailwindcss/cli
npx @tailwindcss/cli -i src/input.css -o dist/output.css --watch
```

## CSS-first Configuration with @theme

Customize your design system directly in CSS:

```css
@import "tailwindcss";

@theme {
  /* Custom colors using oklch for P3 display support */
  --color-primary: oklch(0.7 0.15 200);
  --color-secondary: oklch(0.6 0.12 280);
  --color-accent: oklch(0.8 0.2 150);

  /* Custom fonts */
  --font-display: "Inter", sans-serif;
  --font-body: "Open Sans", sans-serif;

  /* Custom spacing */
  --spacing-128: 32rem;
  --spacing-144: 36rem;

  /* Custom breakpoints */
  --breakpoint-3xl: 1920px;

  /* Custom animations */
  --animate-fade-in: fade-in 0.3s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

Usage in HTML:
```html
<div class="bg-primary text-secondary font-display">
  <h1 class="animate-fade-in">Hello World</h1>
</div>
```

## Migration from v3

### Automated Upgrade (Recommended)

```bash
npx @tailwindcss/upgrade
```

> [!NOTE]
> Requires Node.js 20+. Run in a new branch and review changes carefully.

### Manual Migration Checklist

1. **Update dependencies:**
   ```bash
   npm uninstall tailwindcss postcss-import autoprefixer
   npm install tailwindcss @tailwindcss/postcss
   ```

2. **Update PostCSS config:**
   - Remove `postcss-import` and `autoprefixer` (handled automatically)
   - Replace `tailwindcss` with `@tailwindcss/postcss`

3. **Update CSS imports:**
   ```css
   /* Replace @tailwind directives */
   @import "tailwindcss";
   ```

4. **Migrate tailwind.config.js to @theme:**
   ```css
   @import "tailwindcss";
   
   @theme {
     /* Move your theme.extend values here */
     --color-brand: #3b82f6;
   }
   ```

5. **Search and replace renamed utilities:**
   - `shadow-sm` → `shadow-xs`
   - `shadow` → `shadow-sm`
   - `ring` → `ring-3`
   - `outline-none` → `outline-hidden`
   - `rounded-sm` → `rounded-xs`
   - `rounded` → `rounded-sm`

6. **Update opacity utilities:**
   - `bg-blue-500 bg-opacity-50` → `bg-blue-500/50`

## Decision Tree

```
What do you need?
├── New project
│   ├── Using Vite → See "Option 1: Vite"
│   ├── Using Next.js → See "Option 2: Next.js"
│   └── Other → See "Option 3: PostCSS" or "Option 4: CLI"
├── Migrate from v3
│   ├── Automated → Run `npx @tailwindcss/upgrade`
│   └── Manual → Follow "Manual Migration Checklist"
└── Customize theme
    └── Use @theme block in CSS
```

## Common Pitfalls

| Issue | Solution |
|-------|----------|
| `@tailwind` directives not working | Use `@import "tailwindcss"` instead |
| Config file not being read | v4 uses CSS-first config with `@theme` |
| Styles look different after upgrade | Check renamed utilities (shadow, blur, rounded) |
| Older browsers not working | v4 requires Safari 16.4+, Chrome 111+, Firefox 128+ |
| ring utility looks thinner | `ring` is now 1px, use `ring-3` for old behavior |

## Examples

See complete setup examples:
- [Vite Setup](./examples/vite-setup.md) - React/Vue with Vite
- [Next.js Setup](./examples/nextjs-setup.md) - Next.js App Router
- [Custom Theme](./examples/custom-theme.css) - Full theme customization

## Related Resources

- [Official Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [What's New in v4](https://tailwindcss.com/blog/tailwindcss-v4)
