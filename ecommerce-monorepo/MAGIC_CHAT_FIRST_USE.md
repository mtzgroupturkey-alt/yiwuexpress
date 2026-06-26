# Magic Chat - First Use Guide & Product Card Variants

## 🎯 Your First Request: Product Card Variants

Based on your request, here's exactly how to use Magic Chat to generate 3 different design variants for a product card component.

---

## 📝 Option 1: Magic Chat (Web) - Recommended for First Use

### Step-by-Step Instructions

#### 1. Access Magic Chat

Open your browser and navigate to:
```
https://21st.dev/magic-chat
```

Sign in with your account (create one if you don't have it).

#### 2. Paste This Exact Prompt

Copy and paste this into the Magic Chat interface:

```
Generate 3 different design variants for a product card component for YIWU EXPRESS, 
a B2B kitchenware e-commerce store.

DESIGN SYSTEM CONTEXT:
- Brand Colors: Primary #1a3a5c (Navy Blue), Secondary #c9a84c (Gold), Accent #e74c3c (Red)
- Typography: Inter (body), Poppins (headings), base 16px
- Spacing: 8px increments (4, 8, 12, 16, 24, 32, 48px)
- Shadows: sm/md/lg from Tailwind
- Border Radius: 8px (cards), 6px (buttons)
- Icons: Lucide React icons

TECHNICAL REQUIREMENTS:
- Next.js 14 + TypeScript
- Tailwind CSS (with custom colors configured)
- Responsive: mobile-first (375px base)
- Accessibility: ARIA labels, 4.5:1 contrast, keyboard nav
- Touch targets: minimum 44×44px
- Performance: lazy loading, WebP images

---

VARIANT A - IMAGE-HEAVY FOCUS:

Visual Hierarchy:
- Large product image dominates (400×400px, aspect-ratio 1:1)
- Minimal text overlay at bottom
- Product name only (1 line, truncate)
- Price badge in top-right corner
- Background: subtle gradient overlay on image

Interaction Pattern:
- Single "Quick Add" button (appears on hover desktop, always visible mobile)
- Click card anywhere to view details
- Heart icon for wishlist (top-left, floating)
- No secondary actions visible

Layout:
- Image fills entire card
- Info overlay at bottom with backdrop blur
- Compact: 280×380px on desktop
- Mobile: full width, maintains aspect ratio

---

VARIANT B - TEXT-HEAVY WITH DETAILS:

Visual Hierarchy:
- Smaller product image (200×200px, left side desktop, top mobile)
- Detailed product information (right side desktop, below image mobile)
- Product name (2 lines max, 18px bold)
- Short description (3 lines, 14px gray)
- Full pricing (compare-at price, sale price, savings badge)
- Specifications preview (Material, Weight, HS Code)

Interaction Pattern:
- Two distinct CTAs: "Add to Cart" (primary) + "Wholesale Inquiry" (secondary)
- Hover shows additional specs
- Stock indicator badge (green if >10, orange if ≤10, red if 0)
- Quick view icon button (opens modal)

Layout:
- Horizontal card: 600×250px desktop
- Vertical stack: mobile portrait
- White background with border
- Generous padding: 16-24px

---

VARIANT C - COMPACT MOBILE-FIRST:

Visual Hierarchy:
- Square product image (280×280px)
- Ultra-compact info section below
- Product name (1 line, 14px)
- Price only (no compare price)
- Minimal whitespace

Interaction Pattern:
- Icon-based quick actions (4 icons in row: cart, inquiry, share, wishlist)
- Tap card for full details
- Swipeable in carousel/grid
- Touch-optimized (48×48px icons)

Layout:
- Fixed square: 280×350px
- Designed for 2-column mobile grid (375px = 2 cards side-by-side)
- Minimal padding: 8-12px
- Optimized for scrolling performance

---

COMPONENT INTERFACE (TypeScript):

```typescript
interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  image: string;
  images?: string[];
  description?: string;
  stock: number;
  hsCode?: string;
  material?: string;
  weightKg?: number;
  category: string;
  isFeatured?: boolean;
}

interface ProductCardProps {
  product: Product;
  variant: 'image-heavy' | 'text-heavy' | 'compact';
  onAddToCart?: (productId: string) => void;
  onWholesaleInquiry?: (productId: string) => void;
  onWishlistToggle?: (productId: string) => void;
  className?: string;
}
```

ACCESSIBILITY REQUIREMENTS:
- All interactive elements have aria-label
- Images have descriptive alt text
- Keyboard navigation: Tab through all actions, Enter to activate
- Focus indicators: 2px ring with primary color
- Screen reader: Announce price, stock status, and actions

PERFORMANCE:
- Use Next.js Image component with priority={false}
- loading="lazy" for below-fold cards
- Optimize image sizes: 400w, 800w srcSet
- Avoid layout shift: specify width/height or aspect-ratio

Please generate all 3 variants as separate, complete, production-ready components.
```

#### 3. Review Generated Variants

Magic Chat will generate 3 complete components. You'll see:

- **Live Preview**: Right side shows rendered components
- **Code View**: Left side shows the TypeScript/React code
- **Toggle Between Variants**: Use `Tab` and `Shift+Tab` keys

#### 4. Test Each Variant

For each variant, check:

- [ ] Renders correctly in preview
- [ ] Responsive behavior (use viewport controls)
- [ ] Colors match brand (Navy, Gold, Red)
- [ ] Touch targets ≥44px
- [ ] Image lazy loading present
- [ ] TypeScript types correct

#### 5. Copy Your Favorite

When you've chosen the best variant:

1. Click the **"Copy Code"** button in the preview header
2. Or press `⌘X` (Mac) / `Ctrl+X` (Windows)
3. Paste into your project

---

## 💻 Option 2: Magic MCP in Kiro IDE

### Prerequisites

1. **Get API Key** from https://21st.dev/magic/console
2. **Update `.kiro/settings/mcp.json`** with your API key:

```json
{
  "mcpServers": {
    "@21st-dev/magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest"],
      "env": {
        "API_KEY": "your-actual-api-key-here"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

3. **Restart Kiro IDE**

### Using Magic in Kiro

Once configured, use this prompt in Kiro chat:

```
I need to generate 3 product card variants for YIWU EXPRESS using the @21st-dev/magic MCP server.

Design System:
- Colors: primary=#1a3a5c, secondary=#c9a84c, accent=#e74c3c
- Typography: Inter/Poppins, 16px base
- Spacing: 8px increments
- Reference: .kiro/skills/ui-ux-pro-max/SKILL.md for accessibility standards

Variants Needed:

1. ProductCardImageHeavy.tsx
   - Large image-focused (400×400px)
   - Minimal text overlay
   - Quick add button on hover
   - Location: web/components/products/variants/ProductCardImageHeavy.tsx

2. ProductCardTextHeavy.tsx
   - Detailed specs and description
   - Two CTAs (Add to Cart + Wholesale Inquiry)
   - Stock indicator badge
   - Location: web/components/products/variants/ProductCardTextHeavy.tsx

3. ProductCardCompact.tsx
   - Square mobile-first (280×280px)
   - Icon-based actions
   - Optimized for touch
   - Location: web/components/products/variants/ProductCardCompact.tsx

All components should:
- Use TypeScript with proper interfaces
- Import from '@/components/ui' if needed
- Use Tailwind CSS with custom color classes
- Include ARIA labels
- Be fully responsive

Please generate these 3 files using the Magic MCP server.
```

Kiro will:
1. Invoke the Magic MCP server
2. Generate all 3 component files
3. Create them in your project at the specified locations
4. Show you a summary of what was created

---

## 📦 What You'll Get

### Variant A: Image-Heavy Focus

**Use Case:** Product galleries, visual catalogs, image-first browsing

**Key Features:**
- Image dominates the card (80% of space)
- Hover effects: zoom, overlay with quick actions
- Minimal distraction from product photo
- Best for high-quality product photography

**When to Use:**
- Homepage featured products
- Category landing pages
- Visual-first product discovery

**Example Code Structure:**
```typescript
<div className="group relative overflow-hidden rounded-lg">
  <Image 
    src={product.image}
    alt={product.name}
    width={400}
    height={400}
    className="object-cover transition-transform group-hover:scale-105"
    loading="lazy"
  />
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
    <button className="absolute bottom-4 left-4 right-4 bg-[#1a3a5c] text-white...">
      Quick Add
    </button>
  </div>
</div>
```

---

### Variant B: Text-Heavy with Details

**Use Case:** B2B buyers who need specifications, comparison shopping

**Key Features:**
- Balanced image + text (40/60 split)
- Detailed product specs visible
- Multiple CTAs for different buyer journeys
- Stock and pricing transparency

**When to Use:**
- Search results pages
- Category pages with filters
- B2B product listings
- Wholesale inquiry flows

**Example Code Structure:**
```typescript
<div className="flex gap-4 p-4 border rounded-lg">
  <Image 
    src={product.image}
    width={200}
    height={200}
    className="object-cover rounded"
  />
  <div className="flex-1 space-y-2">
    <h3 className="font-semibold text-lg">{product.name}</h3>
    <p className="text-sm text-gray-600 line-clamp-3">{product.description}</p>
    <div className="flex gap-2">
      <span className="text-xl font-bold">${product.price}</span>
      {product.comparePrice && (
        <span className="text-sm line-through text-gray-400">${product.comparePrice}</span>
      )}
    </div>
    <div className="flex gap-2">
      <button className="flex-1 bg-[#1a3a5c] text-white...">Add to Cart</button>
      <button className="flex-1 border border-[#c9a84c] text-[#c9a84c]...">Wholesale</button>
    </div>
  </div>
</div>
```

---

### Variant C: Compact Mobile-First

**Use Case:** Mobile browsing, infinite scroll, dense product grids

**Key Features:**
- Optimized for small screens (280×280px)
- Touch-friendly icon actions (48×48px)
- Fast loading and rendering
- Grid-friendly (2 columns on mobile)

**When to Use:**
- Mobile product browsing
- "Quick add" shopping flows
- Product carousels
- Mobile-first marketplaces

**Example Code Structure:**
```typescript
<div className="w-[280px] rounded-lg border">
  <Image 
    src={product.image}
    width={280}
    height={280}
    className="w-full aspect-square object-cover"
  />
  <div className="p-3 space-y-2">
    <h3 className="text-sm font-medium truncate">{product.name}</h3>
    <p className="text-lg font-bold text-[#1a3a5c]">${product.price}</p>
    <div className="flex gap-2 justify-between">
      <button aria-label="Add to cart" className="w-12 h-12...">
        <ShoppingCart size={20} />
      </button>
      <button aria-label="Wholesale inquiry" className="w-12 h-12...">
        <MessageSquare size={20} />
      </button>
      <button aria-label="Share" className="w-12 h-12...">
        <Share2 size={20} />
      </button>
      <button aria-label="Add to wishlist" className="w-12 h-12...">
        <Heart size={20} />
      </button>
    </div>
  </div>
</div>
```

---

## 🧪 Testing Your Variants

### 1. Create Test Page

Create `web/app/test-cards/page.tsx`:

```typescript
import ProductCardImageHeavy from '@/components/products/variants/ProductCardImageHeavy'
import ProductCardTextHeavy from '@/components/products/variants/ProductCardTextHeavy'
import ProductCardCompact from '@/components/products/variants/ProductCardCompact'

const sampleProduct = {
  id: '1',
  name: 'Stainless Steel Frying Pan 10"',
  slug: 'stainless-steel-frying-pan-10',
  price: 24.99,
  comparePrice: 34.99,
  image: '/images/products/placeholder.jpg',
  description: 'Premium stainless steel construction with encapsulated base for even heating.',
  stock: 150,
  hsCode: '7323.93.0000',
  material: 'Stainless Steel',
  weightKg: 1.2,
  category: 'Cookware',
  isFeatured: true,
}

export default function TestCardsPage() {
  return (
    <div className="container mx-auto p-8 space-y-12">
      <h1 className="text-3xl font-bold">Product Card Variants Test</h1>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">Variant A: Image-Heavy</h2>
        <div className="max-w-sm">
          <ProductCardImageHeavy 
            product={sampleProduct}
            variant="image-heavy"
            onAddToCart={(id) => console.log('Add to cart:', id)}
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Variant B: Text-Heavy</h2>
        <div className="max-w-2xl">
          <ProductCardTextHeavy 
            product={sampleProduct}
            variant="text-heavy"
            onAddToCart={(id) => console.log('Add to cart:', id)}
            onWholesaleInquiry={(id) => console.log('Wholesale:', id)}
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Variant C: Compact Mobile-First</h2>
        <div className="flex gap-4">
          <ProductCardCompact 
            product={sampleProduct}
            variant="compact"
            onAddToCart={(id) => console.log('Add to cart:', id)}
          />
          <ProductCardCompact 
            product={sampleProduct}
            variant="compact"
            onAddToCart={(id) => console.log('Add to cart:', id)}
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Grid Comparison</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProductCardCompact product={sampleProduct} variant="compact" />
          <ProductCardCompact product={sampleProduct} variant="compact" />
          <ProductCardCompact product={sampleProduct} variant="compact" />
        </div>
      </section>
    </div>
  )
}
```

### 2. Run Development Server

```bash
cd web
npm run dev
```

Navigate to `http://localhost:3001/test-cards`

### 3. Visual Testing Checklist

For each variant, test:

- [ ] **Desktop (1440px)**: Layout looks professional
- [ ] **Tablet (768px)**: Responsive breakpoints work
- [ ] **Mobile (375px)**: Touch targets are adequate
- [ ] **Hover States**: Smooth transitions (200-300ms)
- [ ] **Focus States**: Visible keyboard focus indicators
- [ ] **Loading State**: Images lazy load properly
- [ ] **Error State**: Broken images show fallback

### 4. Accessibility Testing

```bash
# Open Chrome DevTools
# Run Lighthouse audit
# Target: Accessibility score ≥90
```

Checklist:
- [ ] All buttons have `aria-label`
- [ ] Images have descriptive `alt` text
- [ ] Color contrast ≥4.5:1
- [ ] Keyboard navigation works (Tab through all actions)
- [ ] Screen reader announces all information

### 5. Performance Testing

Check in Chrome DevTools → Performance:

- [ ] No layout shift (CLS < 0.1)
- [ ] Images load progressively
- [ ] Hover animations are smooth (60fps)
- [ ] Touch responses are immediate (<100ms feedback)

---

## 🎨 Integration with UI/UX Pro Max Skill

### Validate Against Skill Checklist

After generating variants, validate them:

```
Review the 3 product card variants against the ui-ux-pro-max skill checklist 
(.kiro/skills/ui-ux-pro-max/SKILL.md).

Check these priority categories:

P1 - Accessibility:
- [ ] Contrast ratio ≥4.5:1 on all text
- [ ] Alt text on all images
- [ ] ARIA labels on icon buttons
- [ ] Keyboard navigation support
- [ ] Focus indicators visible

P2 - Touch & Interaction:
- [ ] Touch targets ≥44×44px
- [ ] Spacing between targets ≥8px
- [ ] Loading feedback on button clicks
- [ ] Clear hover states (not hover-only)

P3 - Performance:
- [ ] Images use Next.js Image component
- [ ] Lazy loading enabled
- [ ] Width/height specified (no CLS)
- [ ] WebP format preferred

P4 - E-Commerce UX:
- [ ] Clear pricing display
- [ ] Stock indicator visible
- [ ] Primary CTA prominent
- [ ] Secondary actions available

P5 - Responsive:
- [ ] Mobile-first approach
- [ ] No horizontal scroll
- [ ] Touch-friendly on mobile
- [ ] Breakpoints at 768/1024/1440px

Report any violations and suggest fixes.
```

---

## 🔄 Iteration Examples

### Refine Variant A (Image-Heavy)

If you want to adjust the generated code:

**Magic Chat Web:**
```
Update Variant A (Image-Heavy):
- Increase image aspect ratio to 4:3 instead of 1:1
- Move price badge from top-right to bottom-right
- Add subtle shadow on hover instead of zoom
- Show product category tag at top-left
```

**Kiro MCP:**
```
Update the ProductCardImageHeavy component:
1. Change aspect ratio to 4:3
2. Reposition price badge to bottom-right
3. Replace scale hover effect with shadow transition
4. Add category badge at top-left (use product.category)

File: web/components/products/variants/ProductCardImageHeavy.tsx
```

### Add Dark Mode Support

```
Add dark mode support to all 3 product card variants:
- Use Tailwind dark: classes
- Background: dark:bg-gray-800
- Text: dark:text-gray-100
- Borders: dark:border-gray-700
- Maintain 4.5:1 contrast in dark mode
- Test with class="dark" on parent
```

### Add Animation

```
Enhance Variant B (Text-Heavy) with animations:
- Stagger fade-in for card elements (image → title → description → price → buttons)
- Use Framer Motion or CSS animations
- Duration: 150ms per element, 50ms delay between
- Trigger on viewport entry (useInView hook)
- Respect prefers-reduced-motion
```

---

## 📊 Choosing the Right Variant

### Decision Matrix

| Use Case | Recommended Variant | Why |
|----------|---------------------|-----|
| Homepage Hero | Variant A (Image-Heavy) | Maximum visual impact |
| Category Pages | Variant B (Text-Heavy) | Buyers need specs for comparison |
| Mobile Shopping | Variant C (Compact) | Optimized for touch and small screens |
| Search Results | Variant B (Text-Heavy) | Context needed for relevance |
| Related Products | Variant A (Image-Heavy) | Quick visual recognition |
| Wholesale Catalog | Variant B (Text-Heavy) | B2B buyers need details |
| Quick Browse | Variant C (Compact) | Fast scrolling, many items |

### A/B Testing Recommendation

Implement all 3 variants and test with real users:

```typescript
// web/app/products/page.tsx

const [selectedVariant, setSelectedVariant] = useState<'image-heavy' | 'text-heavy' | 'compact'>('text-heavy')

// Or use A/B testing library
const variant = useABTest('product-card-variant', ['image-heavy', 'text-heavy', 'compact'])

<ProductCard 
  product={product}
  variant={variant}
  {...handlers}
/>
```

Track metrics:
- Click-through rate (CTR)
- Add to cart rate
- Wholesale inquiry rate
- Time on page
- Bounce rate

---

## 🚀 Next Steps

### 1. Generate Your Variants

Choose your method:
- **Magic Chat Web**: Go to https://21st.dev/magic-chat and paste the prompt
- **Kiro MCP**: Configure API key and use in Kiro chat

### 2. Review & Select

- Generate all 3 variants
- Test on multiple devices
- Validate against ui-ux-pro-max skill
- Pick the best fit (or use all 3 in different contexts)

### 3. Integrate

- Copy code to `web/components/products/variants/`
- Create test page
- Run accessibility audit
- Deploy to staging

### 4. Iterate

- Collect user feedback
- A/B test variants
- Refine based on metrics
- Update design system tokens

---

## 📚 Additional Resources

### Magic Chat Documentation
- **Quick Start**: https://help.21st.dev/magic-chat/quick-start
- **Best Practices**: https://help.21st.dev/magic-chat/best-practices
- **Examples**: https://21st.dev/community

### UI/UX Pro Max Skill
- **Skill File**: `.kiro/skills/ui-ux-pro-max/SKILL.md`
- **E-Commerce Guidelines**: Section "E-Commerce Specific Guidelines"
- **Priority Checklist**: "Quick Reference" section

### YIWU EXPRESS Design System
- **Setup Guide**: `UI_UX_SKILL_SETUP.md`
- **Sample Data**: `SAMPLE_DATA_SETUP.md`
- **Color Palette**: Primary #1a3a5c, Secondary #c9a84c, Accent #e74c3c

---

## ✨ Summary

You now have everything you need to generate 3 production-ready product card variants:

1. **Access Magic Chat**: https://21st.dev/magic-chat or via Kiro MCP
2. **Use the Prompt**: Copy the detailed prompt from this guide
3. **Review Variants**: Test all 3 options (Image-Heavy, Text-Heavy, Compact)
4. **Validate**: Check against ui-ux-pro-max skill checklist
5. **Deploy**: Integrate into YIWU EXPRESS

**Your first components are just a prompt away!** 🎉

---

**Last Updated:** June 24, 2026  
**Status:** ✅ Ready to Generate  
**Next**: Open Magic Chat and paste your prompt!
