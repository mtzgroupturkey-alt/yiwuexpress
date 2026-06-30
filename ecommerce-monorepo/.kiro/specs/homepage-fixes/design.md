# Homepage Fixes - Design Document

## Overview

This design addresses three critical issues on the homepage:
1. Non-functional scrolling
2. Limited product display (only featured/new arrivals)
3. Category display improvements

## Architecture

### Component Structure

```
HomePage (app/page.tsx)
├── SharedLayout
│   ├── TopBar
│   ├── MainHeader
│   ├── CategoryMenu
│   ├── HeroSlider
│   └── Footer
└── Main Content
    ├── StatsSection
    ├── TrustBadges
    ├── ParentCategoriesSection (NEW/ENHANCED)
    ├── AllProductsSection (NEW)
    ├── FeaturedProductsSection (EXISTING)
    ├── NewArrivalsSection (EXISTING)
    ├── BlogSection
    └── CTASection
```

### Data Flow

```
HomePage Component
  ↓
React Query (useQuery)
  ↓
API Routes
  ├── /api/categories?parent=null (Parent Categories)
  └── /api/products (All Products with pagination)
  ↓
Prisma → PostgreSQL Database
  ↓
Response Data
  ↓
Component Rendering
```

## Issue 1: Fix Scrolling

### Root Cause Analysis

Potential causes:
1. Fixed height containers with `overflow: hidden`
2. Absolute positioning blocking scroll
3. `height: 100vh` on parent containers
4. `overflow-y: hidden` in CSS

### Solution

**Step 1:** Audit CSS for scroll-blocking properties
- Check `SharedLayout`, `body`, `html`, `main` elements
- Remove fixed heights
- Ensure `overflow-y: auto` or `overflow-y: scroll` on body

**Step 2:** Update SharedLayout
```tsx
<div className="min-h-screen bg-gray-50"> {/* Keep min-h-screen, not h-screen */}
  {/* Remove any fixed height constraints */}
</div>
```

**Step 3:** Verify globals.css
```css
body {
  overflow-x: hidden; /* Keep */
  overflow-y: auto; /* Ensure this, not hidden */
}
```

## Issue 2: Display All Products

### Current State
- Homepage shows only 8 featured products
- Homepage shows only 8 new arrivals
- Total: 16 products maximum

### Desired State
- Show **all active products** from database
- Implement pagination or infinite scroll
- Maintain featured and new arrivals sections
- Add comprehensive "All Products" section

### Solution Design

**Option A: Paginated Approach** (Recommended)
```tsx
const AllProductsSection = () => {
  const [page, setPage] = useState(1);
  const limit = 20;
  
  const { data, isLoading } = useQuery({
    queryKey: ['all-products', page],
    queryFn: () => fetch(`/api/products?page=${page}&limit=${limit}`)
  });
  
  return (
    <section>
      <ProductGrid products={data?.data} />
      <Pagination 
        currentPage={page}
        totalPages={data?.pagination.pages}
        onPageChange={setPage}
      />
    </section>
  );
};
```

**Option B: Infinite Scroll**
```tsx
const AllProductsSection = () => {
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteQuery({
    queryKey: ['all-products'],
    queryFn: ({ pageParam = 1 }) => 
      fetch(`/api/products?page=${pageParam}&limit=20`),
    getNextPageParam: (lastPage) => 
      lastPage.pagination.page < lastPage.pagination.pages 
        ? lastPage.pagination.page + 1 
        : undefined
  });
  
  return (
    <section>
      <ProductGrid products={allProducts} />
      {hasNextPage && (
        <button onClick={fetchNextPage}>Load More</button>
      )}
    </section>
  );
};
```

**Recommended:** Option A (Paginated) for better UX and SEO

### API Endpoint Enhancement

Update `/api/products/route.ts`:
- Ensure it returns all active products when no filters applied
- Current implementation ✅ Already supports pagination
- Current implementation ✅ Already filters by `isActive: true`

No changes needed to API!

## Issue 3: Display Parent Categories

### Current State
- CategoryGrid shows featured categories only (`?featured=true&limit=8`)
- Limited to 8 categories

### Desired State
- Show **all parent categories** (categories with no parent)
- Display prominently at top after hero/stats
- No arbitrary limit

### Solution Design

**Update CategoryGrid Component:**

```tsx
export function CategoryGrid({ 
  variant = 'featured' // 'featured' | 'parent' 
}: CategoryGridProps) {
  const queryParams = variant === 'parent' 
    ? 'parent=null' // Fetch parent categories only
    : 'featured=true&limit=8'; // Current behavior
  
  const { data, isLoading } = useQuery({
    queryKey: ['categories', variant],
    queryFn: () => api.get(`/api/categories?${queryParams}`),
  });
  
  // Rest of component...
}
```

**Update Homepage to use both:**
```tsx
<ParentCategoriesSection>
  <CategoryGrid variant="parent" />
</ParentCategoriesSection>

{/* Later in page */}
<CategoryGrid variant="featured" /> 
```

### API Endpoint Requirements

Update `/api/categories/route.ts` to support `parent` query param:

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parent = searchParams.get('parent');
  
  const where: any = { isActive: true };
  
  // Filter by parent categories only
  if (parent === 'null' || parent === 'none') {
    where.parentId = null;
  }
  
  const categories = await prisma.category.findMany({
    where,
    include: {
      _count: {
        select: { products: true }
      }
    }
  });
  
  return NextResponse.json({
    success: true,
    data: categories.map(cat => ({
      ...cat,
      productCount: cat._count.products
    }))
  });
}
```

## UI/UX Design

### Layout Order
1. **Hero Slider** (existing)
2. **Stats Section** (existing)
3. **Trust Badges** (existing)
4. **Parent Categories Section** ⭐ NEW/ENHANCED
   - Title: "Browse by Category"
   - Show all parent categories
   - Circle design with images
   - Responsive grid: 5 cols desktop, 3 cols tablet, 2 cols mobile
5. **All Products Section** ⭐ NEW
   - Title: "All Products"
   - Grid of all products (paginated)
   - 4 cols desktop, 2-3 cols tablet, 1-2 cols mobile
   - Pagination controls at bottom
6. **Featured Products** (existing, keep)
7. **New Arrivals** (existing, keep)
8. **Blog Section** (existing)
9. **CTA Section** (existing)

### Responsive Breakpoints

```css
/* Mobile: 0-639px */
- Categories: 2 columns
- Products: 1-2 columns
- Compact spacing

/* Tablet: 640-1023px */
- Categories: 3 columns
- Products: 2-3 columns
- Medium spacing

/* Desktop: 1024px+ */
- Categories: 4-5 columns
- Products: 4 columns
- Full spacing
```

### Color Scheme (Existing)
- Primary: `#1a3a5c` (dark blue)
- Secondary: `#c9a84c` (gold)
- Accent: `#e74c3c` (red)
- Background: `#f9fafb` (light gray)
- Text: `#111827` (dark gray)

## Performance Considerations

### Optimization Strategies

1. **React Query Caching**
   ```tsx
   {
     staleTime: 5 * 60 * 1000, // 5 minutes
     cacheTime: 10 * 60 * 1000, // 10 minutes
   }
   ```

2. **Image Optimization**
   - Use Next.js `<Image>` component
   - Lazy loading enabled by default
   - Optimize image sizes: 400x400 for products, 200x200 for categories

3. **Pagination Benefits**
   - Load 20 products per page (not all at once)
   - Reduces initial page load
   - Better for SEO (each page indexable)

4. **Code Splitting**
   - Product components load on-demand
   - Heavy components (modals, dialogs) lazy loaded

## Accessibility

### ARIA Labels
```tsx
<section aria-label="Parent Categories">
<section aria-label="All Products">
<button aria-label="Go to next page">
<button aria-label="Go to previous page">
```

### Keyboard Navigation
- Tab order: logical flow top to bottom
- Focus visible on all interactive elements
- Enter/Space activate buttons and links

### Screen Readers
- Semantic HTML: `<section>`, `<nav>`, `<main>`
- Alt text for all images
- Loading/error states announced

## Error Handling

### Scenarios

1. **API Failure**
   ```tsx
   if (error) {
     return <ErrorState message="Failed to load products" />;
   }
   ```

2. **Empty State**
   ```tsx
   if (products.length === 0) {
     return <EmptyState message="No products available" />;
   }
   ```

3. **Network Timeout**
   - React Query retry: 3 attempts
   - Show friendly error message
   - Provide "Retry" button

## Testing Strategy

### Unit Tests
- Component rendering
- Data fetching logic
- Pagination logic

### Integration Tests
- API endpoint responses
- Full user flow: view categories → click category → see products

### E2E Tests
- Scroll functionality
- Category navigation
- Product pagination
- Mobile responsiveness

## Migration Plan

### Phase 1: Fix Scrolling (Critical)
1. Audit and fix CSS
2. Test on multiple browsers
3. Deploy hotfix

### Phase 2: Add Parent Categories Section
1. Update `/api/categories` to support parent filter
2. Enhance CategoryGrid component
3. Add to homepage

### Phase 3: Add All Products Section
1. Create AllProductsSection component
2. Implement pagination UI
3. Add to homepage
4. Test performance

### Phase 4: Polish & Optimize
1. Image optimization
2. Loading states refinement
3. Error handling
4. Performance monitoring

## Technical Specifications

### Dependencies
```json
{
  "@tanstack/react-query": "^5.x",
  "next": "^14.x",
  "react": "^18.x",
  "prisma": "^5.x",
  "lucide-react": "^0.x"
}
```

### File Changes

**New Files:**
- `components/home/AllProductsSection.tsx`
- `components/ui/Pagination.tsx`

**Modified Files:**
- `app/page.tsx` (add new sections)
- `app/api/categories/route.ts` (add parent filter)
- `components/home/CategoryGrid.tsx` (add variant prop)
- `app/globals.css` (fix scroll if needed)

### Database Schema (No changes needed)

Existing schema already supports:
```prisma
model Category {
  id       String   @id @default(cuid())
  parentId String?  // null = parent category
  // ...
}

model Product {
  id         String   @id @default(cuid())
  isActive   Boolean  @default(true)
  // ...
}
```

## Success Metrics

### Before (Current State)
- ❌ Scrolling: Not working
- 📊 Products shown: 16 (8 featured + 8 new)
- 📊 Categories shown: 8 featured only

### After (Target State)
- ✅ Scrolling: Fully functional
- 📊 Products shown: All active products (paginated)
- 📊 Categories shown: All parent categories + 8 featured

### KPIs
- Page scroll rate: >95%
- Average products viewed per session: >20
- Category click-through rate: >15%
- Page load time: <3 seconds
