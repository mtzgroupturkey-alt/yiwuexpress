```css
/**
 * Tailwind CSS v4 Theme
 */

@import "tailwindcss";

@theme {
  /* ===== Color Palette ===== */
  
  /* Primary - Deep oceanic blue */
  --color-primary: oklch(0.65 0.18 250);
  --color-primary-light: oklch(0.75 0.15 250);
  --color-primary-dark: oklch(0.50 0.20 250);
  
  /* Secondary - Royal purple */
  --color-secondary: oklch(0.55 0.15 280);
  --color-secondary-light: oklch(0.65 0.12 280);
  --color-secondary-dark: oklch(0.45 0.18 280);
  
  /* Accent - Vibrant teal */
  --color-accent: oklch(0.75 0.18 175);
  --color-accent-light: oklch(0.85 0.15 175);
  --color-accent-dark: oklch(0.60 0.20 175);
  
  /* Status colors */
  --color-success: oklch(0.70 0.18 150);
  --color-error: oklch(0.65 0.22 25);
  --color-warning: oklch(0.80 0.15 85);
  
  /* Background - Dark theme */
  --color-bg-base: oklch(0.12 0.02 260);
  --color-bg-surface: oklch(0.15 0.03 260);
  --color-bg-elevated: oklch(0.18 0.03 260);
  
  /* Glassmorphism */
  --color-glass-bg: oklch(0.15 0.02 260 / 0.6);
  --color-glass-bg-hover: oklch(0.20 0.02 260 / 0.7);
  --color-glass-border: oklch(1 0 0 / 0.1);
  --color-glass-border-hover: oklch(1 0 0 / 0.2);
  
  /* Text */
  --color-text-primary: oklch(0.98 0 0);
  --color-text-secondary: oklch(0.85 0 0);
  --color-text-muted: oklch(0.65 0 0);
  
  /* ===== Typography ===== */
  --font-display: "Inter", "SF Pro Display", system-ui, sans-serif;
  --font-body: "Inter", "SF Pro Text", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "SF Mono", monospace;
  
  /* ===== Animations ===== */
  --animate-slide-in-right: slide-in-right 0.5s ease-out;
  --animate-slide-in-left: slide-in-left 0.5s ease-out;
  --animate-fade-up: fade-up 0.6s ease-out;
  --animate-fade-in: fade-in 0.4s ease-out;
  --animate-scale-in: scale-in 0.3s ease-out;
  --animate-glow: glow 3s ease-in-out infinite;
  --animate-float: float 6s ease-in-out infinite;
  
  /* ===== Shadows ===== */
  --shadow-glass: 0 8px 32px oklch(0 0 0 / 0.3);
  --shadow-glow: 0 0 30px oklch(0.65 0.18 250 / 0.3);
  --shadow-glow-strong: 0 0 60px oklch(0.65 0.18 250 / 0.5);
}

/* ===== Keyframe Animations ===== */

@keyframes slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slide-in-left {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fade-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-in {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px oklch(0.65 0.18 250 / 0.3); }
  50% { box-shadow: 0 0 50px oklch(0.65 0.18 250 / 0.6); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

/* ===== Base Styles ===== */

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background-color: var(--color-bg-base);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  min-height: 100vh;
}

/* ===== Utility Classes ===== */

.glass-card {
  background: var(--color-glass-bg);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--color-glass-border);
  border-radius: 1.5rem;
  box-shadow: var(--shadow-glass);
}

.glass-card:hover {
  background: var(--color-glass-bg-hover);
  border-color: var(--color-glass-border-hover);
}

.gradient-text {
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.glow {
  box-shadow: var(--shadow-glow);
  transition: box-shadow 0.3s ease;
}

.glow:hover {
  box-shadow: var(--shadow-glow-strong);
}

/* ===== Accessibility ===== */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* ===== Scrollbar Styling ===== */

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-surface);
}

::-webkit-scrollbar-thumb {
  background: var(--color-glass-border);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-glass-border-hover);
}

/* ===== Code Block Styling ===== */

pre {
  font-family: var(--font-mono);
}

code {
  font-family: var(--font-mono);
}
```
