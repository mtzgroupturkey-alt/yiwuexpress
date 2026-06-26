# 🚀 YIWU EXPRESS - Tramontina Layout Quick Start Guide

## Getting Started

This guide will help you understand and customize the new Tramontina-inspired components for YIWU EXPRESS.

---

## 📦 Available Components

### 1. **HeroBanner** - Full-width hero section with slideshow

```tsx
import HeroBanner from '@/components/HeroBanner'

<HeroBanner
  title="Your custom title"
  subtitle="Your custom subtitle"
  backgroundImage="/path/to/image.jpg"
  ctaPrimary={{ text: "Shop Now", href: "/products" }}
  ctaSecondary={{ text: "Learn More", href: "/about" }}
/>
```

**Customization Options:**
- `title` - Main headline (string)
- `subtitle` - Secondary text (string)
- `backgroundImage` - Hero image URL (string)
- `ctaPrimary` - Primary button config (object with text & href)
- `ctaSecondary` - Secondary button config (object with text & href)

**Features:**
- Auto-rotating slideshow (5 seconds)
- Responsive typography
- Trust indicators
- Scroll animation

---

### 2. **ProductCard** - Individual product display

```tsx
import ProductCard from '@/components/products/ProductCard'

<ProductCard
  product={productData}
  onAddToCart={(id) => handleAddToCart(id)}
  onToggleWishlist={(id) => handleToggleWishlist(id)}
  isInWishlist={false}
/>
```

**Product Data Structure:**
```typescript
{
  id: number
  name: string
  description?: string
  price: number
  image?: string
  category?: string
  stock?: number
  minOrder?: number
  wholesalePrice?: number
}
```

**Features:**
- Wishlist toggle (heart icon)
- "From $X.XX" pricing
- Hover effects
- Add to cart button
- Wholesale inquiry link
- Stock badges

---

### 3. **ProductGrid** - Grid layout for multiple products

```tsx
import ProductGrid from '@/components/products/ProductGrid'

<ProductGrid
  title="Featured Products"
  subtitle="Our best sellers"
  products={productsArray}
  columns={4}
  showLoadMore={true}
  onLoadMore={() => loadMoreProducts()}
  isLoading={false}
/>
```

**Props:**
- `title` - Section heading (optional)
- `subtitle` - Section description (optional)
- `products` - Array of product objects
- `columns` - Grid columns: 2, 3, or 4 (default: 4)
- `showLoadMore` - Show load more button (boolean)
- `onLoadMore` - Load more callback function
- `isLoading` - Loading state (boolean)

**Features:**
- Responsive grid (1-4 columns)
- Wishlist management
- Cart integration
- Loading skeletons
- Empty state

---

### 4. **TrustBadges** - Why shop with us section

```tsx
import TrustBadges from '@/components/TrustBadges'

<TrustBadges />
```

**No props required** - fully self-contained

**Features:**
- 6 trust indicators
- Hover animations
- Responsive layout
- Professional icons

**To Customize:**
Edit the `badges` array in `TrustBadges.tsx`:
```typescript
const badges = [
  {
    icon: Check,
    title: 'Your Title',
    description: 'Your description',
    color: 'text-color-600 bg-color-50'
  },
  // ... more badges
]
```

---

### 5. **CategoryShowcase** - Product categories grid

```tsx
import CategoryShowcase from '@/components/CategoryShowcase'

<CategoryShowcase />
```

**No props required** - categories defined internally

**Features:**
- 6 main categories
- Gradient icons
- Product counts
- Hover effects
- View all CTA

**To Customize:**
Edit the `categories` array in `CategoryShowcase.tsx`:
```typescript
const categories = [
  {
    id: 'category-id',
    name: 'Category Name',
    icon: IconComponent,
    productCount: 100,
    href: '/products?category=id',
    color: 'from-blue-500 to-indigo-500'
  },
  // ... more categories
]
```

---

### 6. **BlogSection** - Kitchen tips & insights

```tsx
import BlogSection from '@/components/BlogSection'

<BlogSection />
```

**No props required** - posts defined internally

**Features:**
- 3 featured articles
- Category badges
- Date & read time
- Image hover effects
- View all link

**To Customize:**
Edit the `posts` array in `BlogSection.tsx`:
```typescript
const posts = [
  {
    id: '1',
    title: 'Article Title',
    excerpt: 'Brief description...',
    image: '/path/to/image.jpg',
    category: 'Kitchen Tips',
    date: '2024-01-15',
    readTime: '5 min read',
    href: '/blog/article-slug'
  },
  // ... more posts
]
```

---

### 7. **MegaMenu** - Enhanced navigation dropdown

```tsx
import MegaMenu from '@/components/MegaMenu'

// In your Navbar component:
<MegaMenu />
```

**No props required** - categories defined internally

**Features:**
- Category sidebar
- Sub-category grid
- Featured products
- Quick links
- Hover interactions

**To Customize:**
Edit the `categories` array in `MegaMenu.tsx`

---

## 🎨 Styling & Theming

### Color Variables
All components use the existing color system defined in `globals.css`:

```css
--primary-color: #1a3a5c (Deep Navy Blue)
--accent-color: #c9a84c (Gold)
/* Accent red: #e74c3c */
```

### Tailwind Classes
Common utility classes used:
- `bg-primary-600` - Primary color background
- `text-primary-600` - Primary color text
- `bg-secondary-500` - Gold background
- `text-secondary-500` - Gold text
- `bg-accent-500` - Red background
- `shadow-brand` - Brand shadow
- `hover:shadow-brand-lg` - Large shadow on hover

---

## 🔌 API Integration

### Required API Endpoints

#### Products API
```typescript
// Fetch products
GET /api/products
Query params:
  - featured: boolean
  - sort: string (e.g., 'createdAt:desc')
  - limit: number
  - category: string
  - page: number

Response:
{
  products: Product[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    pages: number
  }
}
```

#### Cart API
```typescript
// Add to cart
POST /api/cart
Body: {
  userId: number,
  productId: number,
  quantity: number
}

// Get cart
GET /api/cart?userId={id}
Response: {
  success: boolean,
  data: {
    summary: {
      itemCount: number
    }
  }
}
```

#### Wishlist API (To be implemented)
```typescript
// Sync wishlist
POST /api/wishlist
Body: {
  productIds: number[]
}

// Toggle wishlist item
POST /api/wishlist/toggle
Body: {
  productId: number
}
```

---

## 📱 Responsive Behavior

### Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md, lg)
- **Desktop**: > 1024px (xl)

### Grid Columns
```typescript
columns={4}
// Mobile: 1 column
// Tablet: 2-3 columns
// Desktop: 4 columns
```

### Component Behavior
- **HeroBanner**: Font sizes scale down, CTAs stack vertically
- **ProductGrid**: Columns reduce on smaller screens
- **TrustBadges**: 1-6 columns responsive
- **CategoryShowcase**: 2-6 columns responsive
- **BlogSection**: 1-3 columns responsive
- **MegaMenu**: Disabled on mobile (use hamburger menu)

---

## 🔧 Common Customizations

### Change Hero Slideshow Speed
In `HeroBanner.tsx`, line ~39:
```typescript
const interval = setInterval(() => {
  setCurrentSlide((prev) => (prev + 1) % slides.length)
}, 5000) // Change this value (milliseconds)
```

### Change Product Grid Columns
```tsx
<ProductGrid columns={3} /> // 3 columns instead of 4
```

### Add More Trust Badges
In `TrustBadges.tsx`, add to the `badges` array:
```typescript
{
  icon: YourIcon,
  title: 'New Badge',
  description: 'Badge description',
  color: 'text-color-600 bg-color-50'
}
```

### Update Stats Bar
In `page.tsx`, modify the `stats` array:
```typescript
const stats = [
  { value: '2000+', label: 'Updated Label', icon: YourIcon },
  // ... more stats
]
```

---

## ⚡ Performance Tips

### Image Optimization
1. Use WebP format for images
2. Provide multiple sizes for responsive images
3. Use Next.js Image component when possible
4. Lazy load images below the fold

### Code Splitting
Components are already set up for optimal code splitting. Avoid importing unused components.

### Data Fetching
Use React Query (already implemented) for:
- Automatic caching
- Background refetching
- Loading states
- Error handling

---

## 🐛 Troubleshooting

### Products Not Displaying
**Issue**: Grid shows loading state forever
**Solution**: Check API endpoint is returning correct data structure

### Images Not Loading
**Issue**: Broken image icons appear
**Solution**: 
1. Check image paths are correct
2. Ensure images are in `/public/uploads/`
3. Verify fallback gradients are showing

### Wishlist Not Working
**Issue**: Heart icon not toggling
**Solution**:
1. Check localStorage is enabled
2. Verify `onToggleWishlist` prop is passed
3. Check browser console for errors

### Cart Count Not Updating
**Issue**: Badge doesn't update after adding item
**Solution**: Dispatch cart updated event:
```typescript
window.dispatchEvent(new Event('cartUpdated'))
```

---

## 📚 Next Steps

1. **Add Real Product Data**
   - Connect to your database
   - Seed with actual products
   - Add product images

2. **Implement Wishlist Backend**
   - Create wishlist API endpoints
   - Connect to user accounts
   - Sync across devices

3. **Create Blog System**
   - Build blog listing page
   - Create article detail page
   - Add CMS integration

4. **Enhance Navigation**
   - Integrate MegaMenu into Navbar
   - Add search suggestions
   - Implement breadcrumbs

5. **Add Product Pages**
   - Category listing with filters
   - Product detail with gallery
   - Related products section

---

## 🆘 Support

### Documentation
- [Implementation Plan](./TRAMONTINA_LAYOUT_IMPLEMENTATION.md)
- [Completion Summary](./TRAMONTINA_IMPLEMENTATION_COMPLETE.md)

### Common Issues
- Check browser console for errors
- Verify API responses match expected format
- Ensure all dependencies are installed
- Check TypeScript types match data structure

### Best Practices
- Always use TypeScript types
- Handle loading and error states
- Provide fallbacks for images
- Test responsive design
- Optimize for performance

---

**Last Updated**: 2024-01-20
**Version**: 1.0.0
**Components**: 7 new components ready to use
