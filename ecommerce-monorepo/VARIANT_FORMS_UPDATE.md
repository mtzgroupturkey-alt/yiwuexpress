# Purchase Order - Inline Variant Forms Update

## Date: 2026-06-30

## Overview
Replaced the variant selection modal with inline variant form fields directly in each order item. Users can now set variant attributes right in the order item form and duplicate items to create variants.

## Key Changes

### ✅ **Inline Variant Form Fields**
- Each order item now shows variant attribute dropdowns directly in the form
- Variant fields appear in a blue highlighted section below product info
- Dropdowns are automatically populated from category attributes
- Real-time variant name updates as user selects attributes

### ✅ **Simplified Duplicate Workflow**
- **Before**: Click duplicate → modal opens → select combinations → add
- **Now**: Click duplicate → new item appears with empty variant fields → fill in manually

### ✅ **Automatic Attribute Loading**
- When product is added, system fetches category attributes automatically
- Includes both category and parent category attributes
- Only shows "select" and "color" type attributes (variant-capable)
- Stores attributes with each item for persistence

## User Workflow

### 1. Add Product
```
Click "Add Product" → Select product → Click "Add"
Product appears in order items
```

### 2. Set Variant Attributes
```
Scroll to order item
↓
See "Variant Attributes" section (blue box)
↓
Select values from dropdowns
↓
Variant name updates automatically (shown as badge)
```

### 3. Duplicate for More Variants
```
Click Copy button (📋)
↓
New item appears with same product but empty variants
↓
Fill in different variant values
↓
Repeat as needed
```

## Visual Structure

```
┌─────────────────────────────────────────────┐
│ Product Name                    [📋] [🗑️]   │
│ SKU: XXXX                                   │
│ [Variant Badge if set]                      │
├─────────────────────────────────────────────┤
│ ┌──── Variant Attributes ────────────────┐ │
│ │ Color: [Select Color ▼]  Size: [▼]    │ │
│ │ Material: [Select Material ▼]         │ │
│ └────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Quantity: [1]  Price: [32.00]  Total: 32.00│
└─────────────────────────────────────────────┘
```

## Technical Implementation

### Data Structure
```typescript
interface POItem {
  // ... existing fields
  variantAttributes: Record<string, string> // User-selected values
  availableVariantAttributes: any[]         // Dropdown options
  categoryId: string | null
  parentCategoryId: string | null
}
```

### State Management
```typescript
// Stores variant attributes for each item by ID
itemVariantAttributes: Record<string, any[]>

// Maps item.id to array of available attributes
{
  "item-uuid-1": [
    { slug: "color", name: "Color", options: ["Red", "Blue"] },
    { slug: "size", name: "Size", options: ["S", "M", "L"] }
  ]
}
```

### Key Functions

#### `addProduct(product, variant?)`
- Fetches category attributes when adding product
- Stores attributes with the item
- Initializes empty variantAttributes object

#### `updateItemVariantAttribute(itemId, slug, value)`
- Updates specific attribute value for an item
- Rebuilds variant name automatically
- Format: "color: Red • size: M"

#### `duplicateItem(item)`
- Creates copy of item with same product
- Clears variant attributes (empty for user to fill)
- Preserves quantity and price
- Copies available attributes list

#### `fetchCategoryAttributesForItem(categoryId, parentCategoryId)`
- Fetches from both category and parent
- Filters to select/color types only
- Returns array of attribute definitions

## Benefits

✅ **No Modal Interruptions** - Everything inline in the form
✅ **Flexible** - Set any combination of attributes freely
✅ **Visual Feedback** - See variant name update in real-time
✅ **Simple Duplication** - One click to create variant copy
✅ **Clear Layout** - Variant section visually separated
✅ **Parent Attributes** - Shows inherited attributes with label

## Example Usage

### Scenario: Ordering T-Shirts in Multiple Variants

**Step 1:** Add "Basic T-Shirt" product
```
Product appears with variant fields:
- Color: [Select Color ▼]
- Size: [Select Size ▼]
```

**Step 2:** Set first variant
```
Color: Red
Size: M
→ Shows badge: "color: Red • size: M"
```

**Step 3:** Duplicate for more variants
```
Click 📋 button
→ New item appears
Color: [Select Color ▼]  ← Empty
Size: [Select Size ▼]    ← Empty
```

**Step 4:** Set second variant
```
Color: Blue
Size: L
→ Shows badge: "color: Blue • size: L"
```

**Result:**
```
Order Items:
1. Basic T-Shirt (color: Red • size: M) - Qty: 5
2. Basic T-Shirt (color: Blue • size: L) - Qty: 3
3. Basic T-Shirt (color: Green • size: S) - Qty: 2
```

## Code Changes

### Modified Files
- `web/app/admin/purchase-orders/new/page.tsx`

### Removed Features
- Variant selection modal dialog
- Bulk variant combination generation
- Cartesian product logic
- Modal state management

### Added Features
- Inline variant attribute dropdowns
- Real-time variant name updates
- Simple item duplication
- Automatic attribute fetching on product add

### State Variables Removed
```typescript
- duplicateItem
- showDuplicateDialog
- categoryAttributes
- variantCombinations
- loadingAttributes
```

### State Variables Added
```typescript
+ itemVariantAttributes: Record<string, any[]>
```

### Functions Removed
```typescript
- fetchCategoryAttributes()
- generateVariantCombinations()
- handleDuplicateClick()
- toggleCombinationSelection()
- handleAddVariantCombinations()
```

### Functions Added
```typescript
+ fetchCategoryAttributesForItem()
+ updateItemVariantAttribute()
+ duplicateItem() // Simplified version
```

## Notes

- Variant attributes only show if product has a category with variant attributes
- Attributes are fetched asynchronously when product is added
- Parent category attributes are included and labeled
- Empty variant fields are allowed (product without specific variant)
- Variant name updates automatically as user selects values

---

**Version**: 2.0
**Previous Version**: Modal-based variant selection
**Migration**: No data migration needed - new behavior only
