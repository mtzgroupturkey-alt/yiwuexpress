# Task 1: Update API Route - Return Dynamic Filter Metadata

## Context
This is Task 1 of 6 in the "Dynamic Product Filters & Data Fix" plan. The products page currently uses hardcoded filters. We need to fetch filter metadata dynamically from the database based on the selected category's attributes.

## Requirements (verbatim from plan)

### Files to Modify
- `ecommerce-monorepo/web/app/api/products/route.ts`

### Extended Response Type
```typescript
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

### Step 1: Add filter metadata fetch after products query
Fetch attribute metadata for the current category (including inherited from parent categories). Get value counts from products in this category.

### Step 2: Apply dynamic attribute filters from query params
Parse dynamic attribute filters from query params (format: `attr[attributeSlug]=value1,value2` or `attr[attributeSlug][min]=10&attr[attributeSlug][max]=50`)

### Step 3: Include filters in response
Return `filters: filterMetadata` in the JSON response.

### Step 4: Run build to verify
```bash
cd ecommerce-monorepo/web && npm run build
```

## Global Constraints
- Next.js 14.2.19 (App Router)
- Prisma 6.0.0 + PostgreSQL
- TypeScript strict mode
- Tailwind CSS 3.3.0
- i18n via next-intl (en/ru/zh)
- Maintain existing UI/UX patterns
- No breaking changes to public API contracts

## Interfaces from Plan
- Consumes: Prisma Category/Attribute models
- Produces: Extended API response with `filters` array

## Report File
Write report to: `.superpowers/sdd/2026-08-20-dynamic-product-filters-fix/task-1-report.md`

## Report Contract
The report must contain:
1. Status: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED
2. Commits made (hash range)
3. Test command run and output
4. Any concerns or doubts