# 🚀 Attribute System - Quick Start Guide

## ⚡ Get Started in 3 Steps

### Step 1: Check the Database Migration
```bash
cd web
npx prisma migrate status
```

You should see migration `20260625182745_add_attribute_system` applied.

### Step 2: Start the Development Server
```bash
npm run dev
```

### Step 3: Access the Attribute Manager
Open your browser and navigate to:
```
http://localhost:3000/admin/attributes
```

## 🎯 Quick Demo: Create Attributes for Clothing

### 1. Select "Clothing" Category
Click on the "Clothing" category in the left panel.

### 2. Add "Size" Attribute
- Click "+ Add Attribute"
- **Name:** Size
- **Slug:** size (auto-generated)
- **Type:** Select (Dropdown)
- **Options:** S, M, L, XL, XXL
- **Required:** ✅ Yes
- **Filterable:** ✅ Yes
- **Used for Variants:** ✅ Yes
- Click "Create Attribute"

### 3. Add "Color" Attribute
- Click "+ Add Attribute"
- **Name:** Color
- **Type:** Color Picker
- **Required:** ✅ Yes
- **Filterable:** ✅ Yes
- **Used for Variants:** ✅ Yes
- Click "Create Attribute"

### 4. Add "Material" Attribute
- Click "+ Add Attribute"
- **Name:** Material
- **Type:** Text
- **Placeholder:** e.g., Cotton, Polyester
- **Required:** ❌ No
- **Filterable:** ✅ Yes
- Click "Create Attribute"

### 5. Add "Brand" Attribute
- Click "+ Add Attribute"
- **Name:** Brand
- **Type:** Text
- **Required:** ❌ No
- **Filterable:** ✅ Yes
- Click "Create Attribute"

## ✅ Result
You should now see 4 attributes listed for the Clothing category:

| Attribute | Type   | Required | Filterable | Visible |
|-----------|--------|----------|------------|---------|
| Size      | SELECT | ✅       | ✅         | ✅      |
| Color     | COLOR  | ✅       | ✅         | ✅      |
| Material  | TEXT   | ❌       | ✅         | ✅      |
| Brand     | TEXT   | ❌       | ✅         | ✅      |

## 🔧 Common Attribute Configurations

### Electronics Category
```
1. Voltage       | NUMBER   | Required | Options: -
2. Power         | NUMBER   | Required | Options: -
3. Battery       | CHECKBOX | Optional | Options: -
4. Connectivity  | MULTISELECT | Optional | Options: WiFi, Bluetooth, NFC, USB-C
5. Weight (kg)   | NUMBER   | Required | Options: -
```

### Cookware Category
```
1. Material      | SELECT   | Required | Options: Stainless Steel, Aluminum, Cast Iron, Copper
2. Coating       | SELECT   | Optional | Options: Non-stick, Ceramic, Enamel, None
3. Diameter (cm) | NUMBER   | Required | Options: -
4. Induction     | CHECKBOX | Optional | Options: -
```

### Furniture Category
```
1. Dimensions    | TEXT     | Required | Placeholder: "120x80x75 cm"
2. Material      | MULTISELECT | Required | Options: Wood, Metal, Glass, Fabric, Leather
3. Color         | COLOR    | Required | Options: -
4. Assembly      | CHECKBOX | Optional | Options: -
5. Weight (kg)   | NUMBER   | Required | Options: -
```

## 🎨 Attribute Type Cheatsheet

| Type | When to Use | Example Options |
|------|-------------|-----------------|
| **TEXT** | Short text input | Brand, Model Number |
| **TEXTAREA** | Long text input | Product description, Notes |
| **NUMBER** | Numeric values | Weight, Voltage, Capacity |
| **SELECT** | Single choice from list | Size: S, M, L, XL |
| **MULTISELECT** | Multiple choices | Features: WiFi, Bluetooth, NFC |
| **COLOR** | Color selection | Product color |
| **FILE** | Document upload | Manual PDF, Certificate |
| **URL** | Website link | Product video, Demo |
| **CHECKBOX** | Yes/No question | Waterproof? Induction-ready? |
| **DATE** | Date selection | Release date, Warranty |

## 🔄 Edit or Delete Attributes

### Edit an Attribute
1. Click the **pencil icon** (✏️) next to the attribute
2. Modify the fields as needed
3. Click "Update Attribute"

### Delete an Attribute
1. Click the **trash icon** (🗑️) next to the attribute
2. Confirm deletion
3. **Note:** Cannot delete attributes that are being used by products

### Toggle Visibility
Use the **switch toggle** in the "Visible" column to show/hide attributes without deleting them.

## 🚨 Troubleshooting

### Problem: Cannot see the Attributes menu
**Solution:** Check that the admin sidebar has been updated and the server is running.

### Problem: Error creating attribute
**Solutions:**
- Ensure name and type are filled
- Check that slug is unique
- For SELECT/MULTISELECT types, provide options

### Problem: Cannot delete attribute
**Reason:** Attribute is being used by existing products
**Solution:** First remove the attribute from all products, then delete

## 📱 Mobile Responsive
The Attribute Manager works on mobile devices with a collapsible sidebar.

## 🎯 Next: Using Attributes in Products

Once attributes are defined, you'll be able to:
1. **Add products** with dynamic attribute fields based on category
2. **Filter products** by attribute values
3. **Display attributes** on product detail pages
4. **Create variants** using variant-enabled attributes

## 💡 Pro Tips

1. **Use Variants for SKU:** Enable "Used for Variants" for attributes like Size and Color to create product variations
2. **Keep it Organized:** Use consistent naming conventions (e.g., "Weight (kg)", "Voltage (V)")
3. **Add Helper Text:** Provide clear instructions in the helper text field
4. **Plan Ahead:** Define all attributes before adding products to avoid rework

## 🎉 You're Ready!

Start creating custom attributes for your product categories now. Happy configuring! 🚀
