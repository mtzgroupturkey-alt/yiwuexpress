# Product Attributes - Quick Start Guide

## What Are Product Attributes?

Product attributes are category-specific fields that let you add detailed information to your products. For example:
- **Electronics**: Brand, Warranty, Power Consumption
- **Clothing**: Material, Size, Color, Care Instructions
- **Furniture**: Dimensions, Weight Capacity, Assembly Required

---

## Step 1: Create Attributes for a Category

1. Go to **Admin → Attributes**
2. **Select a category** from the left sidebar (e.g., "Electronics")
3. Click **"Add Attribute"** button
4. Fill in the form:
   - **Name**: e.g., "Brand"
   - **Slug**: Auto-generated (e.g., "brand")
   - **Type**: Choose from dropdown:
     - TEXT: Simple text field
     - SELECT: Dropdown with options
     - NUMBER: Numeric value
     - etc.
   - **Options**: (Only for SELECT/MULTISELECT) Enter comma-separated values
     - Example: `Samsung, Apple, Sony, LG`
   - **Placeholder**: Helpful hint text
   - **Helper Text**: Instructions for this field
   - **Switches**:
     - ✅ Required: Must be filled when adding products
     - ✅ Filterable: Can be used to filter products
     - ✅ Used for Variants: Can create product variations
5. Click **"Create Attribute"**

### Example Attributes

**For Electronics Category:**
```
Name: Brand
Type: SELECT
Options: Samsung, Apple, Sony, LG
Required: Yes
```

```
Name: Warranty Period
Type: NUMBER
Placeholder: Enter months
Required: Yes
```

```
Name: Energy Star Certified
Type: CHECKBOX
Helper Text: Check if product is Energy Star certified
```

---

## Step 2: Add Products with Attributes

1. Go to **Admin → Products → Add New Product**
2. Fill in basic information:
   - SKU, Name, Price, etc.
3. **Select a Category** (e.g., "Electronics")
   - 💡 **Important**: The attributes section only appears AFTER selecting a category
4. The **"Product Attributes"** section appears automatically
5. Fill in all required attributes (marked with red asterisk *)
6. Fill in optional attributes as needed
7. Click **"Create Product"**

### What You'll See:

```
┌─────────────────────────────────────┐
│ Product Attributes                   │
│ Category-specific attributes for     │
│ this product                         │
├─────────────────────────────────────┤
│ Brand *                              │
│ [Samsung ▼]                          │
│                                      │
│ Warranty Period *                    │
│ [24                ]                 │
│ Enter warranty period in months      │
│                                      │
│ Energy Star Certified                │
│ ☐ Check if certified                │
└─────────────────────────────────────┘
```

---

## Step 3: Edit Product Attributes

1. Go to **Admin → Products**
2. Find your product and click **"Edit"**
3. Scroll to **"Product Attributes"** section
4. Existing values are already filled in
5. Modify any attribute values
6. Click **"Update Product"**

---

## Attribute Types Guide

### TEXT
- Single-line text input
- **Use for**: Brand names, model numbers, serial numbers

### TEXTAREA
- Multi-line text area
- **Use for**: Long descriptions, specifications, care instructions

### NUMBER
- Numeric input (integers or decimals)
- **Use for**: Dimensions, weight, capacity, warranty months

### SELECT
- Dropdown menu (choose one option)
- **Use for**: Size (S/M/L), Color, Material type
- **Remember**: Enter options separated by commas when creating

### MULTISELECT
- Multiple selection list (choose multiple)
- **Use for**: Available colors, compatible devices, features
- **How to use**: Hold Ctrl/Cmd and click multiple options

### COLOR
- Color picker with hex code input
- **Use for**: Product colors
- **Example**: #FF0000 for red

### URL
- URL/Link input field
- **Use for**: Manual links, warranty registration, documentation

### CHECKBOX
- Yes/No toggle
- **Use for**: Is waterproof? Assembly required? Batteries included?

### DATE
- Date picker
- **Use for**: Manufacturing date, expiration date, release date

### FILE
- File URL input
- **Use for**: Product manuals, assembly instructions, certificates

---

## Common Questions

### Q: I don't see the attributes section in the product form
**A**: Make sure you've selected a category first. The attributes section only appears after a category is selected.

### Q: Can I change attributes after creating a product?
**A**: Yes! Edit the product and modify any attribute values. Changes are saved immediately.

### Q: What happens if I mark an attribute as "Required"?
**A**: Users must fill in that attribute when creating a product. The form won't submit without it.

### Q: Can I use the same attribute across multiple categories?
**A**: Yes! Attributes can be assigned to multiple categories in the Attribute Manager.

### Q: How do I add options to a SELECT attribute?
**A**: When creating/editing the attribute, enter options separated by commas:
```
S, M, L, XL, XXL
```

### Q: Can customers filter products by attributes?
**A**: Yes, if you mark the attribute as "Filterable" when creating it.

### Q: What's the "Used for Variants" option?
**A**: This is for creating product variations (e.g., same shirt in different colors/sizes). This feature will be used for SKU management.

---

## Tips & Best Practices

### ✅ DO:
- Use clear, descriptive attribute names
- Add helpful placeholder and helper text
- Mark essential attributes as "Required"
- Use SELECT for limited choice fields (better UX than free text)
- Group related products in the same category for consistent attributes

### ❌ DON'T:
- Create too many required attributes (makes data entry tedious)
- Use TEXT when SELECT would be better (e.g., "Color" should be SELECT)
- Duplicate information that's already in basic fields (e.g., don't add "Product Name" attribute)
- Change attribute types after products are created (may cause data issues)

---

## Examples by Category

### Electronics Category
```
✓ Brand (SELECT: Samsung, Apple, Sony, LG, Other)
✓ Warranty Period (NUMBER, in months)
✓ Model Number (TEXT)
✓ Power Consumption (NUMBER, in watts)
✓ Energy Star Certified (CHECKBOX)
✓ User Manual (URL)
```

### Clothing Category
```
✓ Material (SELECT: Cotton, Polyester, Wool, Silk, Blend)
✓ Size (SELECT: XS, S, M, L, XL, XXL)
✓ Color (COLOR or MULTISELECT)
✓ Care Instructions (TEXTAREA)
✓ Machine Washable (CHECKBOX)
✓ Country of Manufacture (TEXT)
```

### Furniture Category
```
✓ Dimensions (TEXT: "W x D x H")
✓ Weight Capacity (NUMBER, in kg)
✓ Material (SELECT: Wood, Metal, Plastic, Glass)
✓ Assembly Required (CHECKBOX)
✓ Assembly Time (NUMBER, in minutes)
✓ Assembly Instructions (URL)
```

### Food & Beverage Category
```
✓ Ingredients (TEXTAREA)
✓ Allergens (MULTISELECT: Nuts, Dairy, Gluten, Soy)
✓ Expiration Date (DATE)
✓ Net Weight (NUMBER, in grams)
✓ Organic Certified (CHECKBOX)
✓ Storage Instructions (TEXTAREA)
```

---

## Need Help?

If you encounter any issues:

1. **Check the browser console** for error messages (F12 → Console tab)
2. **Verify category is selected** before expecting attributes to appear
3. **Ensure required fields are filled** before saving
4. **Contact support** with screenshots if problems persist

---

**Last Updated**: June 25, 2026  
**Version**: 1.0
