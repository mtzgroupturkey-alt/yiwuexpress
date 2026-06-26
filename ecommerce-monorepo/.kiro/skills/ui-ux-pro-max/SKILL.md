---
name: ui-ux-pro-max
description: "UI/UX design intelligence for web and mobile. Includes 50+ styles, 161 color palettes, 57 font pairings, 161 product types, 99 UX guidelines, and 25 chart types across 10 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui, and HTML/CSS). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, and check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, and mobile app. Elements: button, modal, navbar, sidebar, card, table, form, and chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, and flat design. Topics: color systems, accessibility, animation, layout, typography, font pairing, spacing, interaction states, shadow, and gradient. Integrations: shadcn/ui MCP for component search and examples."
---

# UI/UX Pro Max - Design Intelligence

Comprehensive design guide for web and mobile applications. Contains 50+ styles, 161 color palettes, 57 font pairings, 161 product types with reasoning rules, 99 UX guidelines, and 25 chart types across 10 technology stacks. Searchable database with priority-based recommendations.

## Quick Reference for YIWU EXPRESS E-Commerce Platform

### Priority Design Rules

| Priority | Category | Key Checks | Anti-Patterns to Avoid |
|----------|----------|------------|------------------------|
| 1 | Accessibility | Contrast 4.5:1, Alt text, Keyboard nav | Removing focus rings, Icon-only buttons |
| 2 | Touch & Interaction | Min 44×44px, 8px spacing, Loading feedback | Hover-only actions, Instant state changes |
| 3 | Performance | WebP, Lazy loading, CLS < 0.1 | Layout thrashing, Unoptimized images |
| 4 | E-Commerce UX | Clear CTAs, Product images, Trust badges | Hidden pricing, Poor mobile checkout |
| 5 | Responsive | Mobile-first, No horizontal scroll | Fixed widths, Tiny text on mobile |

### E-Commerce Specific Guidelines

#### Product Display
- **Product Cards**: 800x800px images, clear pricing, "Add to Cart" button
- **Grid Layout**: 2 columns mobile, 3-4 desktop, consistent spacing
- **Trust Elements**: Secure badges, shipping info, return policy
- **Loading States**: Skeleton screens for product grids

#### Checkout Flow
- **Progress Indicator**: Show steps (Cart → Shipping → Payment → Confirm)
- **Form Design**: Single column on mobile, grouped fields
- **Error Handling**: Inline validation, clear error messages
- **Security**: HTTPS indicators, payment logos

#### Navigation (E-Commerce)
- **Header**: Logo, Search, Cart (with count), Account
- **Category Menu**: Max 2 levels deep, mega menu on desktop
- **Mobile Menu**: Hamburger with drawer, bottom navigation optional
- **Breadcrumbs**: Essential for deep product hierarchies

#### International B2B Considerations
- **Multi-Currency**: Clear currency switcher
- **Shipping Calculator**: Weight-based, country-specific
- **Wholesale Pricing**: Tiered pricing tables, bulk inquiry forms
- **Language Support**: RTL-ready layouts if needed

### Color Palette for YIWU EXPRESS

Primary Colors:
- Primary: #1a3a5c (Deep Navy Blue) - Professional, trustworthy
- Secondary: #c9a84c (Gold) - Premium, quality
- Accent: #e74c3c (Red) - CTAs, urgency
- Background: #f8f9fa (Light gray) - Clean, spacious
- Text: #1a1a2e (Dark) - Readable

Semantic Colors:
- Success: #10b981 (Green) - Completed orders
- Warning: #f59e0b (Amber) - Stock warnings
- Error: #ef4444 (Red) - Form errors
- Info: #3b82f6 (Blue) - Information

### Typography Scale

```css
/* Base: 16px */
font-size-xs: 0.75rem;   /* 12px - Labels, captions */
font-size-sm: 0.875rem;  /* 14px - Secondary text */
font-size-base: 1rem;    /* 16px - Body text */
font-size-lg: 1.125rem;  /* 18px - Large body */
font-size-xl: 1.25rem;   /* 20px - Small headings */
font-size-2xl: 1.5rem;   /* 24px - H3 */
font-size-3xl: 1.875rem; /* 30px - H2 */
font-size-4xl: 2.25rem;  /* 36px - H1 */
```

### Spacing System (8px base)

```css
space-1: 0.25rem; /* 4px */
space-2: 0.5rem;  /* 8px */
space-3: 0.75rem; /* 12px */
space-4: 1rem;    /* 16px */
space-6: 1.5rem;  /* 24px */
space-8: 2rem;    /* 32px */
space-12: 3rem;   /* 48px */
space-16: 4rem;   /* 64px */
```

### Breakpoints

```css
mobile: 375px;   /* Small phone */
mobile-lg: 425px; /* Large phone */
tablet: 768px;   /* Tablet */
desktop: 1024px; /* Desktop */
desktop-lg: 1440px; /* Large desktop */
```

## Implementation Checklist for YIWU EXPRESS

### Homepage
- [ ] Hero banner with product categories
- [ ] Featured products grid (responsive)
- [ ] Trust badges (secure, shipping, support)
- [ ] Category showcase
- [ ] Newsletter signup
- [ ] Footer with links

### Product Pages
- [ ] Product image gallery (zoom, multiple angles)
- [ ] Clear pricing (base + wholesale tiers)
- [ ] Specifications table (HS Code, weight, dimensions)
- [ ] "Add to Cart" + "Wholesale Inquiry" CTAs
- [ ] Related products
- [ ] Stock indicator

### Cart & Checkout
- [ ] Cart summary with edit capabilities
- [ ] Shipping calculator by country
- [ ] Payment method selection
- [ ] Order review before confirm
- [ ] Success page with tracking

### Admin Dashboard
- [ ] Order management (status updates)
- [ ] Product inventory
- [ ] Shipping tracking
- [ ] Analytics charts
- [ ] Customer management

### Mobile Optimization
- [ ] Touch-friendly buttons (44×44px minimum)
- [ ] Swipeable product galleries
- [ ] Sticky "Add to Cart" on scroll
- [ ] Mobile-optimized forms
- [ ] Bottom navigation (optional)

## Design System Workflow

### Step 1: Define Product Type
**YIWU EXPRESS** is a **B2B E-Commerce** platform for **International Kitchenware Trade**

### Step 2: Choose Style
**Recommended**: Professional Minimalism with Trust Elements
- Clean layouts with ample whitespace
- Professional product photography
- Clear information hierarchy
- Trust badges and certifications

### Step 3: Apply Guidelines

#### Navigation
- Two-row header: Top (utility) + Main (categories)
- Sticky header on scroll
- Mega menu for category browsing
- Mobile: Hamburger menu + bottom nav

#### Product Grid
- Card-based layout
- Hover effects (scale 1.02, shadow increase)
- Quick view on hover (desktop)
- Lazy load images below fold

#### Forms
- Single column on mobile
- Grouped related fields
- Inline validation
- Clear error messages
- Progress indicators for multi-step

#### Performance
- Next.js Image component for all product images
- WebP format with fallbacks
- Lazy load below-the-fold content
- Bundle splitting by route

#### Accessibility
- Alt text for all product images
- ARIA labels for icon buttons
- Keyboard navigation support
- 4.5:1 contrast ratio minimum
- Focus indicators

### Step 4: Testing

Pre-launch checklist:
- [ ] Test on Chrome, Firefox, Safari
- [ ] Mobile: iPhone SE, iPhone 14, Pixel
- [ ] Tablet: iPad, Android tablet
- [ ] Desktop: 1024px, 1440px, 1920px
- [ ] Accessibility: Lighthouse, WAVE
- [ ] Performance: Core Web Vitals
- [ ] Loading states: Slow 3G simulation
- [ ] Error states: Network failures
- [ ] Dark mode (if supported)

## Resources

### Icons
- Heroicons (https://heroicons.com/) - Clean, professional
- Lucide (https://lucide.dev/) - Consistent, customizable

### Fonts
- Primary: Inter (Google Fonts) - Professional, readable
- Secondary: Poppins (Google Fonts) - Friendly headings

### Images
- Unsplash: https://unsplash.com/s/photos/kitchenware
- Pexels: https://www.pexels.com/search/kitchenware/

### Tools
- Figma: Design mockups
- TinyPNG: Image optimization
- Lighthouse: Performance audit
- WAVE: Accessibility check

## Next Steps

1. **Review current implementation** against this checklist
2. **Identify gaps** in accessibility, performance, or UX
3. **Prioritize fixes** based on impact (P1 → P10)
4. **Implement improvements** iteratively
5. **Test thoroughly** before deployment

---

**Note**: This skill is optimized for the YIWU EXPRESS e-commerce platform. Refer to the original SKILL.md for the full database of styles, colors, and guidelines for other project types.
