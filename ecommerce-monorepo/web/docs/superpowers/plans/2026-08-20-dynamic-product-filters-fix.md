# Dynamic Product Filters & Data Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded filters with dynamic DB-driven filters, fix ProductCard data structure mismatch, and enhance API to support attribute-based filtering.

**Architecture:** 
- API returns filter metadata alongside products (attributes with value counts)
- Page fetches filter config dynamically per category
- FilterSidebar renders from API data
- ProductCard receives unified product structure from ProductGrid

**Tech Stack:** Next.js 14.2.19, Prisma 6.0.0, PostgreSQL, TypeScript, Tailwind CSS

## Global Constraints
- Next.js 14.2.19 (App Router)
- Prisma 6.0.0 + PostgreSQL
- TypeScript strict mode
- Tailwind CSS 3.3.0
- i18n via next-intl (en/ru/zh)
- Maintain existing UI/UX patterns
- No breaking changes to public API contracts

---

### Task 1: Update API Route - Return Dynamic Filter Metadata

**Files:**
- Modify: `ecommerce-monorepo/web/app/api/products/route.ts`

**Interfaces:**
- Consumes: Prisma Category/Attribute models
- Produces: Extended API response with `filters` array

```typescript
// Extended response type
interface ProductsResponse {
  success: boolean
  data: Product[]
  pagination: { page: number; limit: number; total: number; pages: number }
  filters?: FilterMetadata[]
}

interface FilterMetadata {
  id: string
  name: string
  type: 'checkbox' | 'range' | 'color' | 'select'
  attributeSlug: string
  options: { label: string; value: string; count: number }[]
  min?: number
  max?: number
}
```

- [ ] **Step 1: Add filter metadata fetch after products query**

```typescript
// After fetching products, fetch attribute metadata for the current category
const fetchFilterMetadata = async (categoryId: string | null, locale: string) => {
  if (!categoryId) return []
  
  // Get all attributes for this category (including inherited from parents)
  const categoryAttributes = await prisma.categoryAttribute.findMany({
    where: {
      categoryId,
      isVisible: true,
      isFilterable: true,
    },
    include: {
      attribute: {
        include: {
          translations: {
            where: { locale: { in: [locale, 'en'] } },
            select: { locale: true, name: true }
          }
        }
      }
    },
    orderBy: { displayOrder: 'asc' }
  })

  // For each attribute, get value counts from products in this category
  const filterMetadata: FilterMetadata[] = []
  
  for (const ca of categoryAttributes) {
    const attr = ca.attribute
    const attrName = getLocalField(attr.translations, locale, 'name', attr.name)
    
    // Get distinct values with counts from attributeValues
    const valueCounts = await prisma.attributeValue.groupBy({
      by: ['value'],
      where: {
        attributeId: attr.id,
        product: {
          isActive: true,
          categoryId: { in: [categoryId, ...childCategoryIds] }
        }
      },
      _count: { value: true }
    })

    const options = valueCounts.map(vc => ({
      label: vc.value,
      value: vc.value,
      count: vc._count.value
    }))

    // Determine filter type based on attribute type
    let type: FilterMetadata['type'] = 'checkbox'
    if (attr.type === 'NUMBER') type = 'range'
    if (attr.type === 'COLOR' || attr.type === 'COLOR_MULTI') type = 'color'
    if (attr.type === 'SELECT' || attr.type === 'MULTISELECT') type = 'select'

    filterMetadata.push({
      id: attr.slug,
      name: attrName,
      type,
      attributeSlug: attr.slug,
      options,
      min: type === 'range' ? Math.min(...options.map(o => parseFloat(o.value))) : undefined,
      max: type === 'range' ? Math.max(...options.map(o => parseFloat(o.value))) : undefined,
    })
  }
  
  return filterMetadata
}
```

- [ ] **Step 2: Apply dynamic attribute filters from query params**

```typescript
// Parse dynamic attribute filters from query params
// Format: attr[attributeSlug]=value1,value2 or attr[attributeSlug][min]=10&attr[attributeSlug][max]=50
const dynamicFilters = searchParams.getAll('attr')
// Or iterate all searchParams and find those starting with 'attr['
```

- [ ] **Step 3: Include filters in response**

```typescript
return NextResponse.json({
  success: true,
  data: localizedProducts,
  pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  filters: filterMetadata
})
```

- [ ] **Step 4: Run build to verify**
```bash
cd ecommerce-monorepo/web && npm run build
```

- [ ] **Step 5: Commit**
```bash
git add ecommerce-monorepo/web/app/api/products/route.ts
git commit -m "feat(api): add dynamic filter metadata to products endpoint"
```

---

### Task 2: Fix ProductCard Data Structure Mismatch

**Files:**
- Modify: `ecommerce-monorepo/web/components/products/ProductCard.tsx`

**Interfaces:**
- Consumes: Unified Product type from ProductGrid
- Produces: Correctly displayed product card

```typescript
// Unified Product interface (matches what ProductGrid passes)
interface Product {
  id: string
  slug: string
  name: string
  description?: string
  price: number
  image?: string
  category?: string
  stock?: number
  minOrder?: number
  minOrderQty?: number
  wholesalePrice?: number
  colors?: { label: string; value: string }[]
  compareAtPrice?: number
}
```

- [ ] **Step 1: Update Product interface to include compareAtPrice**

```typescript
interface Product {
  id: string
  slug: string
  name: string
  description?: string
  price: number
  image?: string
  category?: string
  stock?: number
  minOrder?: number
  minOrderQty?: number
  wholesalePrice?: number
  colors?: { label: string; value: string }[]
  compareAtPrice?: number  // ADD THIS
}
```

- [ ] **Step 2: Update price display logic to use compareAtPrice**

```typescript
const hasWholesale = product.wholesalePrice && product.wholesalePrice < product.price
const displayPrice = hasWholesale ? product.wholesalePrice : product.price
const priceLabel = hasWholesale ? t('from') : ''
// Also check compareAtPrice for strikethrough
const hasDiscount = product.compareAtPrice && product.compareAtPrice > displayPrice
```

- [ ] **Step 3: Update badge logic for wholesale**

```typescript
{hasWholesale && (
  <span className="bg-secondary-500 text-white text-xs font-semibold px-2 py-1 rounded shadow-sm">
    {t('wholesalePrice')}
  </span>
)}
{product.compareAtPrice && product.compareAtPrice > product.price && (
  <span className="bg-accent-500 text-white text-xs font-semibold px-2 py-1 rounded shadow-sm">
    {t('savePct', { pct: Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) })}
  </span>
)}
```

- [ ] **Step 4: Update ProductGrid mapping to pass compareAtPrice**

In `ProductGrid.tsx`, update the mappedProduct:
```typescript
const mappedProduct = {
  id: product.id,
  slug: product.slug,
  name: product.name,
  price: product.price,
  compareAtPrice: product.compareAtPrice, // ADD THIS
  image: product.thumbnail || undefined,
  category: product.category?.name,
  stock: product.stock,
  wholesalePrice: product.wholesalePrice || undefined,
}
```

- [ ] **Step 5: Run build to verify**
```bash
cd ecommerce-monorepo/web && npm run build
```

- [ ] **Step 6: Commit**
```bash
git add ecommerce-monorepo/web/components/products/ProductCard.tsx ecommerce-monorepo/web/components/products/ProductGrid.tsx
git commit -m "fix(product): unify product data structure, add compareAtPrice support"
```

---

### Task 3: Update FilterSidebar Component

**Files:**
- Modify: `ecommerce-monorepo/web/components/products/FilterSidebar.tsx`

**Interfaces:**
- Consumes: FilterMetadata[] from API
- Produces: Dynamic filter UI

```typescript
// Update FilterSection type to match API
interface FilterSection {
  id: string
  name: string
  type: 'checkbox' | 'range' | 'color' | 'select'
  attributeSlug: string
  options?: { label: string; value: string; count: number }[]
  min?: number
  max?: number
}
```

- [ ] **Step 1: Update FilterSection interface**

```typescript
interface FilterSection {
  id: string
  name: string
  type: 'checkbox' | 'range' | 'color' | 'select'
  attributeSlug: string
  options?: { label: string; value: string; count: number }[]
  min?: number
  max?: number
}
```

- [ ] **Step 2: Add 'select' type handler**

```tsx
{section.type === 'select' && section.options?.map((option) => {
  const isSelected = selectedFilters[section.id]?.includes(option.value) || false
  return (
    <label key={option.value} className="flex items-center space-x-3 text-sm cursor-pointer group">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => {
          const current = selectedFilters[section.id] || []
          const newValue = e.target.checked
            ? [...current, option.value]
            : current.filter((v: string) => v !== option.value)
          handleFilterChange(section.id, newValue.length > 0 ? newValue : undefined)
        }}
        className="w-4 h-4 text-[#1a3a5c] border-gray-300 rounded focus:ring-[#1a3a5c]"
      />
      <span className="text-gray-600 group-hover:text-[#1a3a5c] transition-colors">
        {option.label}
      </span>
      {option.count !== undefined && (
        <span className="text-gray-400 text-xs">({option.count})</span>
      )}
    </label>
  )
})}
```

- [ ] **Step 3: Update filter value encoding for URL params**

```typescript
// In page.tsx - encode dynamic filters for API
const encodeFilters = (filters: Record<string, any>): URLSearchParams => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return
    if (Array.isArray(value)) {
      params.append(`attr[${key}]`, value.join(','))
    } else {
      params.append(`attr[${key}]`, String(value))
    }
  })
  return params
}
```

- [ ] **Step 4: Run build to verify**
```bash
cd ecommerce-monorepo/web && npm run build
```

- [ ] **Step 5: Commit**
```bash
git add ecommerce-monorepo/web/components/products/FilterSidebar.tsx
git commit -m "feat(filters): update FilterSidebar for dynamic attribute filters"
```

---

### Task 4: Update Products Page to Use Dynamic Filters

**Files:**
- Modify: `ecommerce-monorepo/web/app/[locale]/products/page.tsx`

**Interfaces:**
- Consumes: API response with filters
- Produces: Dynamic filter sections state

- [ ] **Step 1: Add state for dynamic filters**

```typescript
const [filterSections, setFilterSections] = useState<FilterSection[]>([])
const [filtersLoading, setFiltersLoading] = useState(true)
```

- [ ] **Step 2: Fetch filter metadata on category change**

```typescript
useEffect(() => {
  const fetchFilters = async () => {
    if (!categorySlug) {
      setFilterSections([])
      setFiltersLoading(false)
      return
    }
    try {
      const response = await fetch(`/api/products?category=${categorySlug}&locale=${locale}&limit=1`)
      const data = await response.json()
      if (data.success && data.filters) {
        setFilterSections(data.filters)
      }
    } catch (error) {
      console.error('Error fetching filters:', error)
      setFilterSections([])
    } finally {
      setFiltersLoading(false)
    }
  }
  fetchFilters()
}, [categorySlug, locale])
```

- [ ] **Step 3: Pass dynamic filters to FilterSidebar**

```tsx
<FilterSidebar
  filters={filterSections}
  onFilterChange={handleFilterChange}
  onClearFilters={handleClearFilters}
  isMobile
/>
```

- [ ] **Step 4: Update fetchProducts to include dynamic filters in API call**

```typescript
const fetchProducts = async () => {
  setLoading(true)
  try {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: productsPerPage.toString(),
    })

    if (categorySlug) params.append('category', categorySlug)
    if (searchQuery) params.append('search', searchQuery)
    if (sortBy && sortBy !== 'relevance') params.append('sort', sortBy)

    // Add dynamic filters
    Object.entries(filters).forEach(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return
      if (Array.isArray(value)) {
        params.append(`attr[${key}]`, value.join(','))
      } else if (typeof value === 'object' && value !== null) {
        // Range filter: { min, max }
        if (value.min !== undefined) params.append(`attr[${key}][min]`, String(value.min))
        if (value.max !== undefined) params.append(`attr[${key}][max]`, String(value.max))
      } else {
        params.append(`attr[${key}]`, String(value))
      }
    })

    const response = await fetch(`/api/products?${params}&locale=${locale}`)
    // ... rest unchanged
  }
}
```

- [ ] **Step 5: Remove hardcoded filterSections constant**

Delete the static `filterSections` array (lines 35-91)

- [ ] **Step 6: Run build to verify**
```bash
cd ecommerce-monorepo/web && npm run build
```

- [ ] **Step 7: Commit**
```bash
git add ecommerce-monorepo/web/app/[locale]/products/page.tsx
git commit -m "feat(products): use dynamic filters from API, remove hardcoded filters"
```

---

### Task 5: Add Prisma Indexes for Filter Performance

**Files:**
- Modify: `ecommerce-monorepo/web/prisma/schema.prisma`

- [ ] **Step 1: Add indexes to AttributeValue model**

```prisma
model AttributeValue {
  // ... existing fields
  
  @@index([attributeId])
  @@index([productId])
  @@index([attributeId, productId])  // ADD for filter queries
}
```

- [ ] **Step 2: Add indexes to CategoryAttribute**

```prisma
model CategoryAttribute {
  // ... existing fields
  
  @@index([categoryId])
  @@index([attributeId])
}
```

- [ ] **Step 3: Generate Prisma client**
```bash
cd ecommerce-monorepo/web && npx prisma generate
```

- [ ] **Step 4: Run build to verify**
```bash
cd ecommerce-monorepo/web && npm run build
```

- [ ] **Step 5: Commit**
```bash
git add ecommerce-monorepo/web/prisma/schema.prisma
git commit -m "perf(prisma): add indexes for attribute filter queries"
```

---

### Task 6: Integration Test & Verification

**Files:**
- Test: Manual verification in browser

- [ ] **Step 1: Start dev server**
```bash
cd ecommerce-monorepo/web && npm run dev
```

- [ ] **Step 2: Verify at http://localhost:3001/en/products**
- Filters load dynamically for each category
- FilterSidebar shows correct attributes with counts
- Product cards display correct prices (retail/wholesale)
- Filter changes update product list
- Pagination works with filters
- Mobile filter overlay works

- [ ] **Step 3: Test with different categories**
- Navigate to `/en/products?category=cookware`
- Navigate to `/en/products?category=bakeware`
- Verify filters differ per category

- [ ] **Step 4: Test wholesale/retail pricing**
- Verify wholesale badge shows when wholesalePrice < price
- Verify strikethrough shows compareAtPrice when present

- [ ] **Step 5: Commit final verification**
```bash
git commit -am "test: verify dynamic filters work end-to-end"
```

---

## Self-Review Checklist

- [ ] All 5 tasks map to the 4 issues in the spec
- [ ] No placeholders - all code blocks are complete
- [ ] Types match across tasks (FilterMetadata, FilterSection, Product)
- [ ] API changes support both existing and new filter params
- [ ] Backward compatible - old filter params still work
- [ ] Prisma indexes added for query performance

---

**Plan complete and saved to `docs/superpowers/plans/2026-08-20-dynamic-product-filters-fix.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**