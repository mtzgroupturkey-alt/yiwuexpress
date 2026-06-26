# 🚀 Quick Start - SharedLayout

## 30-Second Setup

### For ANY New Page

```tsx
import { SharedLayout } from '@/components/layout/SharedLayout'
import { Container } from '@/components/ui/Container'

export default function YourPage() {
  return (
    <SharedLayout 
      pageTitle="Your Page Title"
      pageDescription="Brief description of your page"
      breadcrumbs={[
        { name: 'Parent', href: '/parent' },
        { name: 'Current', href: '/current' }
      ]}
    >
      <div className="py-12">
        <Container maxWidth="2xl">
          {/* Your content here */}
        </Container>
      </div>
    </SharedLayout>
  )
}
```

**That's it!** You now have:
- ✅ TopBar, MainHeader, CategoryMenu
- ✅ Professional PageHero with breadcrumbs
- ✅ Footer
- ✅ Responsive design
- ✅ Centered content (1400px max)

---

## Props Cheat Sheet

```tsx
<SharedLayout 
  showHero={true}                    // Show HeroSection (homepage only)
  pageTitle="Page Title"             // Hero title (required for other pages)
  pageDescription="Description"      // Optional subtitle
  breadcrumbs={[...]}                // Optional navigation trail
  backgroundImage="/images/bg.jpg"   // Optional custom background
>
  {children}
</SharedLayout>
```

---

## Common Patterns

### Homepage
```tsx
<SharedLayout showHero={true}>
  <YourSections />
</SharedLayout>
```

### Simple Page
```tsx
<SharedLayout pageTitle="About Us">
  <Content />
</SharedLayout>
```

### Page with Breadcrumbs
```tsx
<SharedLayout 
  pageTitle="Services"
  breadcrumbs={[{ name: 'Services', href: '/services' }]}
>
  <Content />
</SharedLayout>
```

### Dynamic Page
```tsx
const breadcrumbs = [
  { name: 'Products', href: '/products' },
  { name: product.name, href: `/products/${slug}` }
]

<SharedLayout 
  pageTitle={product.name}
  pageDescription={product.description}
  breadcrumbs={breadcrumbs}
>
  <Content />
</SharedLayout>
```

---

## Files to Reference

📘 **Full Documentation**: `SHARED_LAYOUT_IMPLEMENTATION.md`
🎨 **Visual Guide**: `LAYOUT_VISUAL_GUIDE.md`
📋 **8 Templates**: `web/SHARED_LAYOUT_TEMPLATE.tsx`
📊 **Summary**: `LAYOUT_COMPLETE_SUMMARY.md`

---

## Test Your Implementation

1. Start dev server: `npm run dev` (in `ecommerce-monorepo/web`)
2. Visit: http://localhost:3001/your-page
3. Check:
   - ✅ Header/menu visible at top
   - ✅ PageHero with breadcrumbs
   - ✅ Footer at bottom
   - ✅ Content centered (max 1400px)

---

## Need Help?

See the templates in `web/SHARED_LAYOUT_TEMPLATE.tsx` - they cover:
- Simple pages
- Pages with breadcrumbs
- Dynamic pages
- Loading states
- List pages
- Detail pages
- And more!

Just copy, customize, done! 🎉
