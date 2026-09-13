# Next.js Setup with Tailwind CSS v4

Complete setup guide for Next.js 15+ with App Router.

## Quick Start

### 1. Create Project

```bash
npx create-next-app@latest my-app
cd my-app
```

### 2. Install Tailwind CSS

```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

### 3. Configure PostCSS

```js
// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### 4. Update Global CSS

```css
/* app/globals.css */
@import "tailwindcss";
```

### 5. Verify Import in Layout

```tsx
// app/layout.tsx
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## With Custom Theme

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Brand colors */
  --color-brand-50: oklch(0.97 0.02 250);
  --color-brand-500: oklch(0.6 0.2 250);
  --color-brand-900: oklch(0.3 0.15 250);

  /* Custom fonts (remember to load in layout) */
  --font-heading: "Cal Sans", sans-serif;
  --font-body: "Inter", system-ui, sans-serif;

  /* Container sizes */
  --container-3xl: 1600px;
}
```

## Loading Custom Fonts

```tsx
// app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-body">{children}</body>
    </html>
  );
}
```

## Usage Example

```tsx
// app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-brand-50">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-5xl font-heading font-bold text-brand-900">
          Welcome to Next.js + Tailwind v4
        </h1>
        <p className="mt-4 text-lg text-brand-500">
          CSS-first configuration, no config file needed!
        </p>
      </div>
    </main>
  );
}
```

## Run Development Server

```bash
npm run dev
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Styles not applying | Ensure `@import "tailwindcss"` is first line |
| PostCSS errors | Make sure using `postcss.config.mjs` (ES modules) |
| Fonts not working | Check font variable in `@theme` matches CSS variable |
