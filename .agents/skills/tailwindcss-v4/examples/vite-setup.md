# Vite Setup with Tailwind CSS v4

Complete setup guide for React or Vue projects using Vite.

## Quick Start

### 1. Create Project

```bash
# React
npm create vite@latest my-app -- --template react

# Vue
npm create vite@latest my-app -- --template vue

cd my-app
```

### 2. Install Tailwind CSS

```bash
npm install tailwindcss @tailwindcss/vite
```

### 3. Configure Vite

```js
// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // or vue()
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(), // or vue()
    tailwindcss(),
  ],
});
```

### 4. Create CSS File

```css
/* src/index.css */
@import "tailwindcss";
```

### 5. Import CSS in Entry Point

```jsx
// src/main.jsx (React)
import "./index.css";
```

```js
// src/main.js (Vue)
import "./index.css";
```

## With Custom Theme

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.6 0.2 250);
  --color-secondary: oklch(0.7 0.15 180);
  
  --font-sans: "Inter", system-ui, sans-serif;
  
  --breakpoint-xs: 475px;
}
```

## Usage Example

```jsx
// src/App.jsx
export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary">
      <h1 className="text-4xl font-bold text-white p-8">
        Hello Tailwind v4!
      </h1>
    </div>
  );
}
```

## Run Development Server

```bash
npm run dev
```
