# Preloader Implementation Guide 🎨

## Overview
A beautiful, animated preloader that automatically fetches and displays the company logo from the database. Perfect for creating a professional loading experience while your application initializes.

---

## ✨ Features

- **Dynamic Logo Loading** - Automatically fetches company logo from database
- **Fallback Design** - Shows company initials if no logo is uploaded
- **Triple Ring Spinner** - Smooth, modern loading animation
- **Progress Bar** - Visual feedback with animated progress
- **Floating Icons** - Subtle animated background icons (home appliances theme)
- **Auto-Hide** - Disappears when page is fully loaded
- **Responsive** - Works on all screen sizes
- **Failsafe** - Auto-hides after max duration even if load event doesn't fire

---

## 🚀 How to Use

### Option 1: Add to Main Layout (Recommended)

Add the preloader to your root layout so it shows on initial page load:

**File**: `web/app/layout.tsx`

```tsx
import { Preloader } from '@/components/ui/Preloader'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Preloader />
        
        {/* Your app content */}
        {children}
      </body>
    </html>
  )
}
```

### Option 2: Add to Specific Pages

Add to individual pages that need loading screens:

```tsx
'use client'

import { Preloader } from '@/components/ui/Preloader'

export default function HomePage() {
  return (
    <>
      <Preloader />
      
      {/* Your page content */}
      <div>
        <h1>Welcome!</h1>
      </div>
    </>
  )
}
```

### Option 3: Controlled with Callback

Use with a callback to track when loading completes:

```tsx
'use client'

import { useState } from 'react'
import { Preloader } from '@/components/ui/Preloader'

export default function MyPage() {
  const [isLoading, setIsLoading] = useState(true)
  
  return (
    <>
      {isLoading && (
        <Preloader 
          onComplete={() => setIsLoading(false)}
          minDuration={2000}
          maxDuration={5000}
        />
      )}
      
      <div>Page content</div>
    </>
  )
}
```

---

## ⚙️ Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onComplete` | `() => void` | - | Callback function called when preloader completes |
| `minDuration` | `number` | `2800` | Minimum time (ms) to show preloader |
| `maxDuration` | `number` | `6000` | Maximum time (ms) before auto-hide (failsafe) |

### Examples

```tsx
// Quick preloader (2 seconds)
<Preloader minDuration={2000} maxDuration={4000} />

// Slower preloader (4 seconds)
<Preloader minDuration={4000} maxDuration={8000} />

// With callback
<Preloader 
  onComplete={() => console.log('Loading complete!')} 
/>
```

---

## 🎨 Customization

### Change Colors

Edit the component file `web/components/ui/Preloader.tsx`:

```tsx
// Ring colors
border-top-color: #3b82f6;    // Blue ring
border-bottom-color: #10b981; // Green ring  
border-top-color: #f59e0b;    // Orange ring

// Progress bar gradient
background: linear-gradient(90deg, #3b82f6, #10b981);

// Text color
color: #94a3b8;
```

### Change Icons

Replace the emoji icons in the component:

```tsx
<div className="preloader-icons">
  <span>🏠</span>  {/* Home */}
  <span>🍳</span>  {/* Cooking */}
  <span>☕</span>  {/* Coffee */}
  <span>🛒</span>  {/* Shopping */}
  <span>🔥</span>  {/* Fire */}
  <span>💡</span>  {/* Light */}
</div>
```

**Other icon suggestions:**
- 📦 Package
- 🍴 Cutlery
- 🔪 Knife
- 🥘 Pan
- 🥄 Spoon
- 🧊 Ice

### Change Logo Size

Adjust in the component:

```tsx
.preloader-logo-wrap {
  width: 180px;    // Change width
  height: 180px;   // Change height
}
```

### Change Animation Duration

Modify keyframe animations:

```css
/* Logo reveal speed */
animation: logoReveal 1.8s ease-out forwards;

/* Pulse speed */
animation: logoPulse 2.5s ease-in-out 1.8s infinite;

/* Progress bar speed */
animation: progressFill 2.8s ease-in-out forwards;
```

---

## 🔧 How It Works

### 1. Logo Fetching
```tsx
// Fetches from your API
fetch('/api/settings')
  .then(res => res.json())
  .then(data => {
    setLogoUrl(data.settings.companyLogo)
    setCompanyName(data.settings.companyName)
  })
```

### 2. Fallback Display
If no logo is found in the database, shows a gradient placeholder with company initials:

```
┌─────────────┐
│             │
│     YE      │  <- First 2 letters of company name
│             │
└─────────────┘
```

### 3. Auto-Hide Logic
- Waits for `window.load` event
- Adds `minDuration` delay for smooth experience
- Has `maxDuration` failsafe timeout
- Fades out with CSS transition

---

## 🎯 Animation Breakdown

### Logo Animation
1. **0s-1.8s**: Logo reveals (fade in + scale up)
2. **1.8s+**: Subtle pulse animation (loop)

### Spinner Rings
- **Ring 1** (Outer): Blue, rotates clockwise, 1s cycle
- **Ring 2** (Middle): Green, rotates counter-clockwise, 1.2s cycle
- **Ring 3** (Inner): Orange, rotates clockwise, 0.8s cycle

### Progress Bar
```
0%  ──────────────────────  0.0s
20% ████──────────────────  0.4s
50% ██████████────────────  1.1s
78% ███████████████───────  2.0s
90% █████████████████─────  2.5s
96% ██████████████████────  2.8s
```

### Floating Icons
- 6 icons float around the screen
- Each has different delay (0s, 0.4s, 0.8s, 1.2s, 1.6s, 2.0s)
- Very subtle (7% opacity)
- Float up 12px and rotate 5°

---

## 📱 Responsive Behavior

The preloader is fully responsive and works on all screen sizes:

- **Desktop**: Full size with all animations
- **Tablet**: Same experience
- **Mobile**: Same experience (optimized for touch)

All elements scale proportionally and remain centered.

---

## 🔍 Troubleshooting

### Issue: Preloader doesn't show logo
**Solution**: 
1. Check if logo is uploaded in admin settings
2. Verify `/api/settings` returns `companyLogo` field
3. Check browser console for fetch errors

### Issue: Preloader stays forever
**Solution**:
- Check `maxDuration` prop (default 6000ms = 6 seconds)
- Verify no JavaScript errors blocking execution
- Check if `window.load` event is firing

### Issue: Logo is too small/large
**Solution**: Adjust `.preloader-logo-wrap` width/height in component

### Issue: Colors don't match brand
**Solution**: Update ring colors and progress gradient in component CSS

---

## 🎨 Dark Mode Support (Optional)

To add dark mode support, wrap preloader with theme detection:

```tsx
'use client'

import { useTheme } from 'next-themes'
import { Preloader } from '@/components/ui/Preloader'

export function ThemedPreloader() {
  const { theme } = useTheme()
  
  return (
    <Preloader />
  )
}
```

Then in the Preloader component, add dark mode styles:

```css
@media (prefers-color-scheme: dark) {
  .preloader-overlay {
    background: #0f172a;
  }
  
  .preloader-text {
    color: #475569;
  }
  
  .preloader-logo {
    filter: drop-shadow(0 2px 16px rgba(59,130,246,0.2));
  }
}
```

---

## 📊 Performance

- **File Size**: ~5KB (including styles)
- **API Call**: 1 fetch request to `/api/settings`
- **No External Dependencies**: Pure React + CSS
- **Smooth 60fps Animations**: Uses CSS transforms (GPU accelerated)

---

## 🔄 Migration from HTML Version

If you're replacing the HTML preloader:

**Before** (preloader.html):
```html
<div class="preloader-overlay" id="preloader">
  <img src="logo.png" class="preloader-logo" />
  ...
</div>

<script>
  // Manual logo loading
  // Manual hide logic
</script>
```

**After** (React component):
```tsx
<Preloader />
```

That's it! The React component handles everything automatically.

---

## 📝 Complete Example

Here's a complete implementation in your main layout:

```tsx
// app/layout.tsx
import { Preloader } from '@/components/ui/Preloader'
import { CartProvider } from '@/components/CartContext'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Preloader - shows on initial load */}
        <Preloader minDuration={2500} maxDuration={6000} />
        
        {/* App providers */}
        <CartProvider>
          {children}
        </CartProvider>
        
        {/* Toast notifications */}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
```

---

## ✅ Checklist

After implementation, verify:

- [ ] Preloader shows on page load
- [ ] Company logo displays correctly
- [ ] Fallback initials show if no logo
- [ ] Animations are smooth
- [ ] Auto-hides after loading
- [ ] Works on mobile devices
- [ ] No console errors
- [ ] Progress bar animates
- [ ] Floating icons visible

---

## 🎉 Result

Your application now has a professional, branded preloader that:
- Shows your company logo dynamically
- Provides smooth loading feedback
- Automatically hides when ready
- Creates a premium user experience

**Before**: Blank white screen while loading  
**After**: Beautiful branded animation 🚀

---

## Support

If you need to customize further or have issues:
1. Check the component file: `web/components/ui/Preloader.tsx`
2. Review animation timings in the CSS
3. Verify API endpoint: `/api/settings`
4. Check browser console for errors

Enjoy your new preloader! 🎨✨
