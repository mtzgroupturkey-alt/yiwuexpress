---
name: landing-page-slider
description: Creates landing pages with integrated slider/slideshow for knowledge sharing presentations. Use ONLY when user explicitly requests BOTH landing page AND slider/slideshow functionality together. NOT for regular landing pages or standalone sliders.
---

# Landing Page Slider

Build beautiful landing pages that transform into fullscreen presentations with keyboard navigation, glassmorphism effects, and professional animations.

## When to Use This Skill

> [!IMPORTANT]
> This skill is for projects that need **BOTH** landing page **AND** slider/slideshow functionality combined.

- User explicitly asks for "landing page with slider" or "presentation landing page"
- Building knowledge sharing pages with slideshow mode
- Creating marketing sites that can toggle into presentation mode
- NOT for: Regular landing pages, standalone carousel/sliders, simple slideshows

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Vite | 5+ | Build tool |
| React | 18+ | UI framework |
| Tailwind CSS | v4 | Styling (CSS-first) |
| Lucide React | Latest | Professional icons |
| Framer Motion | Latest | Animations |

## Quick Start

### Step 1: Create Project

```bash
npm create vite@latest my-landing -- --template react-ts
cd my-landing
npm install
```

### Step 2: Install Dependencies

```bash
npm install tailwindcss @tailwindcss/vite lucide-react framer-motion
```

### Step 3: Configure Vite

```js
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

### Step 4: Setup Tailwind CSS v4

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  /* Primary gradient colors using oklch for P3 display */
  --color-primary: oklch(0.65 0.18 250);
  --color-secondary: oklch(0.55 0.15 280);
  --color-accent: oklch(0.75 0.2 160);
  
  /* Glassmorphism colors */
  --color-glass-bg: oklch(0.15 0.02 260 / 0.6);
  --color-glass-border: oklch(1 0 0 / 0.1);
  
  /* Animations */
  --animate-slide-in: slide-in 0.5s ease-out;
  --animate-fade-up: fade-up 0.6s ease-out;
  --animate-glow: glow 2s ease-in-out infinite;
}

@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fade-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px oklch(0.65 0.18 250 / 0.3); }
  50% { box-shadow: 0 0 40px oklch(0.65 0.18 250 / 0.6); }
}
```

## Core Components

### 1. Slider Container

The main component that manages presentation mode and slide navigation.

Key features:
- Toggle between landing page and presentation mode
- Track current slide index
- Handle animations between slides
- Fullscreen support

### 2. Slide Component

Individual content sections that become fullscreen slides.

Key features:
- Content areas (title, description, visuals)
- Entry/exit animations
- Glassmorphism card styling

### 3. Keyboard Navigation Hook

Custom hook for keyboard shortcuts.

| Key | Action |
|-----|--------|
| `←` / `→` | Navigate slides |
| `Space` | Next slide |
| `Escape` | Exit presentation |
| `F` | Toggle fullscreen |
| `P` | Toggle presentation mode |

## Glassmorphism Patterns

### Card with Blur

```jsx
<div className="
  bg-glass-bg 
  backdrop-blur-xl 
  border border-glass-border
  rounded-2xl 
  shadow-2xl
">
  {/* content */}
</div>
```

### Gradient Orbs (Background)

```jsx
<div className="absolute inset-0 overflow-hidden -z-10">
  <div className="
    absolute -top-40 -right-40 w-80 h-80 
    bg-primary/30 rounded-full blur-3xl
  " />
  <div className="
    absolute -bottom-40 -left-40 w-80 h-80 
    bg-secondary/30 rounded-full blur-3xl
  " />
</div>
```

## Animation Patterns

### Staggered Children (Framer Motion)

```jsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
}

<motion.div variants={container} initial="hidden" animate="show">
  {items.map(i => <motion.div key={i} variants={item} />)}
</motion.div>
```

### Slide Transitions

```jsx
<AnimatePresence mode="wait">
  <motion.div
    key={currentSlide}
    initial={{ x: 100, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: -100, opacity: 0 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    {slides[currentSlide]}
  </motion.div>
</AnimatePresence>
```

## Best Practices

### Visual Excellence

1. **Color Harmony** - Use oklch colors for consistent, vibrant gradients
2. **Depth Layers** - Combine blur + transparency + subtle borders
3. **Motion Purpose** - Animate to guide attention, not distract
4. **Dark Mode First** - Glassmorphism shines on dark backgrounds

### Performance

1. **Lazy Load** - Load slide content on demand
2. **will-change** - Add for animated elements
3. **Reduce Motion** - Respect `prefers-reduced-motion`

### Accessibility

1. **Focus Visible** - Clear focus indicators in presentation mode
2. **Keyboard Nav** - Full keyboard support (already built-in)
3. **ARIA Labels** - Label navigation controls

## Decision Tree

```
What do you need?
├── New landing page project
│   └── Follow Quick Start (Steps 1-4)
├── Add slider to existing React app
│   └── Copy Slider component + hook
├── Customize visual style
│   └── Modify @theme block in CSS
└── Change keyboard shortcuts
    └── Edit useKeyboard hook
```

## Examples & Resources

### Examples
- [Project Structure](./examples/project-structure.md) - Complete folder layout
- [Slider Component](./examples/slider-component.md) - Main slider logic
- [Slide Component](./examples/slide-component.md) - Individual slide + content components
- [Keyboard Hook](./examples/use-keyboard.md) - Keyboard navigation
- [Theme CSS](./examples/theme.md) - Tailwind v4 theme setup
- [Landing Page](./examples/landing-page.md) - Full page example

## Common Mistakes

| Mistake | Solution |
|---------|----------|
| Blur not working | Ensure parent has `position: relative` or `overflow: hidden` |
| Animations janky | Add `will-change: transform` to animated elements |
| Colors look washed | Use oklch for wider gamut support |
| Keyboard not working | Check if focus is on the container element |
