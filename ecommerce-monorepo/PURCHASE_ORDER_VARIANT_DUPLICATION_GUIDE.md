# Purchase Order Variant Duplication Feature

## Overview
This feature provides a streamlined workflow for managing product variants in purchase orders. Products are added with a single click, and then users can duplicate them with multiple variant combinations based on category attributes.

## Simplified Workflow

### 1. **Add Product to Purchase Order**
- Click "Add Product" button in the Order Items section
- Select a product from your catalog
- Click the **"Add"** button (works for all products, with or without variants)
- The product is added to the order items list immediately

### 2. **Duplicate with Variants** (After Adding)
- In the order items section, find the product you want to create variants for
- Click the **Copy icon** (📋) button next to the order item
- This opens the "Duplicate with Variant Combinations" dialog

### 3. **Category Attributes Check**
The system automatically:
- Checks if the product has a category assigned
- Fetches variant attributes from both the category and its parent category
- Only shows attributes that can define product variations (select/color types)
- Generates all possible combinations of these variant attributes

### 4. **Select Variant Combinations**
In the dialog, you can:
- See all possible variant combinations displayed as chips
- Each combination shows the attribute values (e.g., "Color: Red • Size: Large")
- Click on any combination to select/deselect it
- Select multiple combinations at once
- Already-existing combinations in the order are grayed out and marked

### 5. **Add Selected Variants**
- Click "Add Selected Variants" button
- The system creates separate order items for each selected combination
- Each variant gets a unique SKU based on the original SKU + variant values
- All other properties (quantity, price) are copied from the original item

## Key Changes from Previous Version

### ✅ **Simplified Product Selection Modal**
- **Before**: Products with variants showed "Select Variant" button, opening a variant selection dialog
- **Now**: All products show a simple "Add" button - variants are managed AFTER adding to order

### ✅ **Variant Management in Order Items**
- Products are added without variants first
- Users can then duplicate with specific variant combinations they need
- More flexible - choose only the variants you want to order

### ✅ **Benefits of New Approach**
1. **Faster Initial Add**: One click to add any product
2. **More Control**: Select specific variant combinations instead of all or one
3. **Better for Bulk Orders**: Add product once, then generate multiple variants
4. **Cleaner UI**: Simplified modal with consistent "Add" action

## Key Features

### ✅ **Intelligent Attribute Detection**
- Automatically fetches category attributes from the product's category
- Also includes parent category attributes (inheritance)
- Only shows variant-capable attributes (select dropdowns and color pickers)

### ✅ **Cartesian Product Generation**
- Generates all possible combinations of variant attributes
- Example: 3 colors × 4 sizes = 12 combinations

### ✅ **Duplicate Prevention**
- Prevents adding the same variant combination twice
- Shows "Already in order" for existing combinations
- Provides visual feedback with grayed-out items

### ✅ **Visual Attribute Display**
- Attributes displayed as colored chips
- Color attributes show color swatches
- Clear attribute name and value separation

### ✅ **Bulk Selection**
- Select multiple variant combinations at once
- Counter shows how many variants are selected
- Add all selected variants with one click

## Use Case Example

### Scenario: Ordering T-Shirts

#### Step 1: Add Product
1. Click "Add Product" in purchase order
2. Search for "Basic T-Shirt"
3. Click "Add" button
4. Product appears in order items (no variant selected yet)

#### Step 2: Generate Variants
1. Click the Copy (📋) button on the T-Shirt item
2. System checks the T-Shirt category and finds attributes:
   - **Color**: Red, Blue, Green, Yellow
   - **Size**: S, M, L, XL
3. System generates 16 combinations (4 colors × 4 sizes)

#### Step 3: Select Needed Variants
Select only the combinations you need to order:
- ✓ Red / M
- ✓ Red / L
- ✓ Blue / M
- ✓ Blue / L
- ✓ Green / M

#### Step 4: Add to Order
1. Click "Add Selected Variants"
2. Five new order items are created, each with unique variant attributes
3. Original item can be kept or deleted

### Result
You now have 6 items in the order:
1. Basic T-Shirt (no variant) - can be deleted if not needed
2. Basic T-Shirt (Red / M)
3. Basic T-Shirt (Red / L)
4. Basic T-Shirt (Blue / M)
5. Basic T-Shirt (Blue / L)
6. Basic T-Shirt (Green / M)

## Technical Details

### Attribute Requirements
For an attribute to be considered for variant generation:
- Must have `inputType` of "select" or "color"
- Must have options defined (as JSON array or string)
- Must be associated with the product's category or parent category

### SKU Generation
New variants get SKUs in the format:
```
{original-sku}-{value1}-{value2}-...
```
Example: `TSHIRT-001-Red-M`

### Data Storage
Each variant order item stores:
- `productId`: Original product ID
- `variantId`: null (custom combinations)
- `variantAttributes`: JSON object with attribute slug/value pairs
- `variantName`: Human-readable string (e.g., "color: Red • size: M")
- `categoryId`: Category ID for reference
- `parentCategoryId`: Parent category ID if exists

## UI Components

### Copy Button
- Located next to the delete button for each order item
- Blue color to indicate duplication action
- Tooltip: "Duplicate with variant combinations"

### Variant Dialog
- Large modal showing all possible combinations
- Searchable/scrollable list
- Info banner showing:
  - Variant attribute names
  - Total combinations count
  - Selected count
- Checkbox selection interface
- Color-coded states (selected, existing, available)

### Visual States
- **Available**: White background, gray border
- **Selected**: Blue background, blue border, checkmark
- **Existing**: Gray background, grayed out, checkmark (disabled)
- **Hover**: Slight background change for available items

## Error Handling

### No Category
If a product has no category assigned:
- Shows error toast: "This product has no category assigned. Cannot determine variant attributes."
- Dialog doesn't open

### No Variant Attributes
If the category has no variant attributes:
- Opens dialog
- Shows message: "No variant attributes found"
- Explains that the category doesn't have variant attributes defined

### API Errors
If fetching category attributes fails:
- Shows error toast: "Failed to load category attributes"
- Dialog shows empty state

## Benefits

1. **Time Saving**: Generate multiple variants quickly instead of adding each manually
2. **Error Prevention**: Ensures consistent variant naming and prevents duplicates
3. **Flexibility**: Select only the variants you need to order
4. **Traceability**: Each variant maintains link to original product and category
5. **Scalability**: Handles products with multiple attribute dimensions

## Future Enhancements

Possible improvements:
- Bulk price adjustment for selected variants
- Import variants from CSV
- Save variant sets as templates
- Filter combinations by specific attribute values
- Variant SKU customization rules

---

**Last Updated**: 2026-06-30
**Feature Version**: 1.0
