# How to Add Preloader to Your App 🚀

## Quick Start (2 Steps)

### Step 1: Add Preloader to Root Layout

Edit `web/app/layout.tsx` and add the Preloader component:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { SettingsProvider } from '@/components/SettingsProvider'
import { Preloader } from '@/components/ui/Preloader' // ← ADD THIS

const inter = Inter({ subsets: ['latin'] })

// ... metadata stays the same ...

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* ... existing head content ... */}
      </head>
      <body className={inter.className}>
        <Preloader /> {/* ← ADD THIS - Shows on initial page load */}
        
        <Providers>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </Providers>
      </body>
    </html>
  )
}
```

### Step 2: Done! 🎉

That's it! The preloader will now:
- ✅ Show on initial page load
- ✅ Fetch your company logo from database
- ✅ Show animated loading spinner
- ✅ Auto-hide when page is ready
- ✅ Display company initials as fallback if no logo

---

## What It Looks Like

```
┌─────────────────────────────────┐
│          (floating icons)        │
│                                  │
│        ┌─────────┐               │
│        │  LOGO   │               │
│        └─────────┘               │
│                                  │
│        ⭕⭕⭕                     │
│        (spinner)                 │
│                                  │
│         LOADING                  │
│       ━━━━━━━━━━                │
│      (progress bar)              │
│                                  │
└─────────────────────────────────┘
```

---

## Customization Options

### Change Duration

```tsx
<Preloader 
  minDuration={3000}  // Show for at least 3 seconds
  maxDuration={8000}  // Auto-hide after 8 seconds max
/>
```

### Add Callback

```tsx
<Preloader 
  onComplete={() => console.log('Loading complete!')}
/>
```

### Quick Preloader (Faster)

```tsx
<Preloader 
  minDuration={1500}  // 1.5 seconds
  maxDuration={4000}  // 4 seconds max
/>
```

---

## How Logo Loading Works

1. **Preloader starts** → Shows default placeholder
2. **Fetches from API** → `GET /api/settings`
3. **Receives logo URL** → `companyLogo` field
4. **Updates display** → Shows your logo
5. **Page loads** → Fades out smoothly

If no logo in database → Shows company name initials (e.g., "YE" for YIWU EXPRESS)

---

## Testing

### 1. Upload Logo in Admin
1. Go to Admin → Settings
2. Upload company logo
3. Save

### 2. Test Preloader
1. Reload your homepage
2. You should see:
   - Your logo animating in
   - Triple ring spinner
   - Progress bar filling
   - Auto-hide after ~3 seconds

### 3. Test Without Logo
1. Remove logo in admin settings
2. Reload page
3. Should show gradient box with company initials

---

## Troubleshooting

### Preloader doesn't show
**Check**: Is `<Preloader />` added to `app/layout.tsx`?

### Logo doesn't appear
**Check**: 
1. Is logo uploaded in admin settings?
2. Open browser DevTools → Network tab
3. Look for `/api/settings` request
4. Verify response contains `companyLogo` field

### Preloader stays forever
**Check**: 
- Default timeout is 6 seconds
- If it never hides, check browser console for errors

### Logo is wrong size
**Edit**: `web/components/ui/Preloader.tsx`
**Change**: `.preloader-logo-wrap` width/height values

---

## Before & After

### Before (No Preloader)
```
User loads page
    ↓
Blank white screen... 😐
    ↓
Content suddenly appears
```

### After (With Preloader)
```
User loads page
    ↓
Beautiful animated logo! 🎨
    ↓
Smooth transition to content ✨
```

---

## Full Integration Code

Here's the complete code to add to `web/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { SettingsProvider } from '@/components/SettingsProvider'
import { Preloader } from '@/components/ui/Preloader'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  // ... your existing metadata ...
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Your existing head content */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "YIWU EXPRESS",
              // ... rest of schema
            })
          }}
        />
        <script src="/unregister-sw.js" defer></script>
      </head>
      <body className={inter.className}>
        {/* 🎨 PRELOADER - Add this line */}
        <Preloader minDuration={2800} maxDuration={6000} />
        
        {/* Existing providers */}
        <Providers>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </Providers>
      </body>
    </html>
  )
}
```

---

## Done! 🎉

Your application now has:
- ✅ Professional branded preloader
- ✅ Dynamic logo loading from database
- ✅ Smooth animations
- ✅ Auto-hide functionality
- ✅ Fallback for missing logo

**That's it! Just one line of code!** 🚀

For more customization options, see `PRELOADER_IMPLEMENTATION.md`
