# 📡 Attribute System - API Reference

## Base URL
```
http://localhost:3000/api/admin
```

## Authentication
All endpoints require admin authentication. Include auth token in headers or cookies.

---

## 📋 Attributes Endpoints

### 1. List All Attributes
**GET** `/api/admin/attributes`

**Description:** Retrieve all attributes with category associations and usage counts.

**Response:**
```json
{
  "data": [
    {
      "id": "clx...",
      "name": "Size",
      "slug": "size",
      "type": "SELECT",
      "options": ["S", "M", "L", "XL"],
      "placeholder": "Select size",
      "helperText": "Choose product size",
      "isRequired": true,
      "isFilterable": true,
      "isVariant": true,
      "displayOrder": 0,
      "isActive": true,
      "createdAt": "2026-06-25T12:00:00Z",
      "updatedAt": "2026-06-25T12:00:00Z",
      "categories": [
        {
          "id": "clx...",
          "categoryId": "clx...",
          "attributeId": "clx...",
          "category": {
            "id": "clx...",
            "name": "Clothing"
          }
        }
      ],
      "_count": {
        "values": 42
      }
    }
  ]
}
```

---

### 2. Create Attribute
**POST** `/api/admin/attributes`

**Description:** Create a new attribute and optionally link it to a category.

**Request Body:**
```json
{
  "name": "Size",
  "slug": "size",
  "type": "SELECT",
  "options": ["S", "M", "L", "XL", "XXL"],
  "placeholder": "Select size",
  "helperText": "Choose the product size",
  "isRequired": true,
  "isFilterable": true,
  "isVariant": true,
  "categoryId": "clx..."
}
```

**Field Descriptions:**
- `name` (string, required) - Display name of the attribute
- `slug` (string, optional) - URL-friendly identifier (auto-generated if not provided)
- `type` (enum, required) - One of: TEXT, TEXTAREA, NUMBER, SELECT, MULTISELECT, COLOR, FILE, URL, CHECKBOX, DATE
- `options` (array, optional) - For SELECT/MULTISELECT types only
- `placeholder` (string, optional) - Form field placeholder text
- `helperText` (string, optional) - Helper text below the field
- `isRequired` (boolean, optional) - Whether field is required (default: false)
- `isFilterable` (boolean, optional) - Can be used in filters (default: true)
- `isVariant` (boolean, optional) - Can create SKU variants (default: false)
- `categoryId` (string, optional) - Link to category immediately

**Success Response (201):**
```json
{
  "data": {
    "id": "clx...",
    "name": "Size",
    "slug": "size",
    ...
  }
}
```

**Error Responses:**
```json
// 400 - Missing required fields
{
  "error": "Name and type are required"
}

// 400 - Duplicate slug
{
  "error": "An attribute with this slug already exists"
}

// 500 - Server error
{
  "error": "Failed to create attribute"
}
```

---

### 3. Get Single Attribute
**GET** `/api/admin/attributes/:id`

**Description:** Retrieve a single attribute with full details.

**Response:**
```json
{
  "data": {
    "id": "clx...",
    "name": "Size",
    "slug": "size",
    "type": "SELECT",
    "options": ["S", "M", "L", "XL"],
    "placeholder": "Select size",
    "helperText": null,
    "isRequired": true,
    "isFilterable": true,
    "isVariant": true,
    "displayOrder": 0,
    "isActive": true,
    "createdAt": "2026-06-25T12:00:00Z",
    "updatedAt": "2026-06-25T12:00:00Z",
    "categories": [
      {
        "id": "clx...",
        "category": {
          "id": "clx...",
          "name": "Clothing"
        }
      }
    ],
    "_count": {
      "values": 42
    }
  }
}
```

**Error Response (404):**
```json
{
  "error": "Attribute not found"
}
```

---

### 4. Update Attribute
**PUT** `/api/admin/attributes/:id`

**Description:** Update an existing attribute.

**Request Body:**
```json
{
  "name": "Product Size",
  "slug": "product_size",
  "type": "SELECT",
  "options": ["XS", "S", "M", "L", "XL", "XXL"],
  "placeholder": "Choose size",
  "helperText": "Select the appropriate size",
  "isRequired": true,
  "isFilterable": true,
  "isVariant": true,
  "categoryId": "clx..."
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": "clx...",
    "name": "Product Size",
    ...
  }
}
```

**Error Responses:**
```json
// 404 - Not found
{
  "error": "Attribute not found"
}

// 400 - Duplicate slug
{
  "error": "An attribute with this slug already exists"
}

// 500 - Server error
{
  "error": "Failed to update attribute"
}
```

---

### 5. Delete Attribute
**DELETE** `/api/admin/attributes/:id`

**Description:** Delete an attribute. Only works if attribute is not in use.

**Success Response (200):**
```json
{
  "message": "Attribute deleted successfully"
}
```

**Error Responses:**
```json
// 404 - Not found
{
  "error": "Attribute not found"
}

// 400 - In use
{
  "error": "Cannot delete attribute that is being used by products"
}

// 500 - Server error
{
  "error": "Failed to delete attribute"
}
```

---

### 6. Toggle Attribute Visibility
**PUT** `/api/admin/attributes/:id/visibility`

**Description:** Toggle attribute active status (visibility).

**Request Body:**
```json
{
  "isVisible": true
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": "clx...",
    "isActive": true,
    ...
  }
}
```

---

## 🗂️ Category-Attribute Endpoints

### 7. Get Category Attributes
**GET** `/api/admin/categories/:id/attributes`

**Description:** Get all attributes associated with a specific category.

**Response:**
```json
{
  "data": [
    {
      "id": "clx...",
      "name": "Size",
      "slug": "size",
      "type": "SELECT",
      "options": ["S", "M", "L", "XL"],
      "placeholder": "Select size",
      "helperText": null,
      "isRequired": true,
      "isFilterable": true,
      "isVariant": true,
      "displayOrder": 0,
      "isActive": true,
      "categoryAttributeId": "clx...",
      "isVisible": true,
      "createdAt": "2026-06-25T12:00:00Z",
      "updatedAt": "2026-06-25T12:00:00Z"
    },
    {
      "id": "clx...",
      "name": "Color",
      "slug": "color",
      "type": "COLOR",
      ...
    }
  ]
}
```

---

### 8. List Categories with Attribute Counts
**GET** `/api/admin/categories?includeAttributes=true`

**Description:** Get all categories with their attribute counts.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "name": "Clothing",
      "slug": "clothing",
      "description": "Clothing and apparel",
      "image": null,
      "parentId": null,
      "level": 1,
      "displayOrder": 0,
      "menuOrder": 0,
      "isActive": true,
      "showInMenu": true,
      "isFeatured": false,
      "createdAt": "2026-06-01T12:00:00Z",
      "updatedAt": "2026-06-01T12:00:00Z",
      "parent": null,
      "children": [],
      "_count": {
        "products": 125,
        "children": 0,
        "attributes": 4
      }
    }
  ]
}
```

---

## 📊 Attribute Types Reference

### Type: TEXT
```json
{
  "type": "TEXT",
  "placeholder": "Enter brand name",
  "helperText": "e.g., Nike, Adidas"
}
```

### Type: TEXTAREA
```json
{
  "type": "TEXTAREA",
  "placeholder": "Enter detailed description",
  "helperText": "Provide comprehensive product information"
}
```

### Type: NUMBER
```json
{
  "type": "NUMBER",
  "placeholder": "Enter weight in kg",
  "helperText": "Product weight for shipping calculation"
}
```

### Type: SELECT
```json
{
  "type": "SELECT",
  "options": ["S", "M", "L", "XL", "XXL"],
  "placeholder": "Select size",
  "helperText": "Choose one size"
}
```

### Type: MULTISELECT
```json
{
  "type": "MULTISELECT",
  "options": ["WiFi", "Bluetooth", "NFC", "USB-C"],
  "placeholder": "Select connectivity options",
  "helperText": "Choose all applicable"
}
```

### Type: COLOR
```json
{
  "type": "COLOR",
  "placeholder": "#000000",
  "helperText": "Pick product color"
}
```

### Type: FILE
```json
{
  "type": "FILE",
  "placeholder": "Upload PDF manual",
  "helperText": "Max file size: 10MB"
}
```

### Type: URL
```json
{
  "type": "URL",
  "placeholder": "https://example.com/product-video",
  "helperText": "Link to product demonstration"
}
```

### Type: CHECKBOX
```json
{
  "type": "CHECKBOX",
  "helperText": "Is this product waterproof?"
}
```

### Type: DATE
```json
{
  "type": "DATE",
  "placeholder": "YYYY-MM-DD",
  "helperText": "Product release date"
}
```

---

## 🔄 Workflow Examples

### Example 1: Create Attribute for Clothing
```bash
# Step 1: Create "Size" attribute
curl -X POST http://localhost:3000/api/admin/attributes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Size",
    "type": "SELECT",
    "options": ["S", "M", "L", "XL"],
    "isRequired": true,
    "isFilterable": true,
    "isVariant": true,
    "categoryId": "CLOTHING_CATEGORY_ID"
  }'

# Step 2: Get all attributes for category
curl http://localhost:3000/api/admin/categories/CLOTHING_CATEGORY_ID/attributes
```

### Example 2: Update Attribute Options
```bash
curl -X PUT http://localhost:3000/api/admin/attributes/ATTRIBUTE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "options": ["XS", "S", "M", "L", "XL", "XXL", "XXXL"]
  }'
```

### Example 3: Delete Unused Attribute
```bash
curl -X DELETE http://localhost:3000/api/admin/attributes/ATTRIBUTE_ID
```

---

## ⚠️ Error Codes Summary

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error, duplicate slug, in use) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🔐 Security Notes

1. All endpoints require admin authentication
2. Input validation on both client and server
3. SQL injection protection via Prisma ORM
4. XSS protection via React escaping
5. Unique slug constraint at database level
6. Usage checks before deletion

---

## 📚 Related Documentation

- [Quick Start Guide](./ATTRIBUTE_SYSTEM_QUICK_START.md)
- [Complete Documentation](./DYNAMIC_ATTRIBUTE_SYSTEM_COMPLETE.md)
- [Implementation Summary](../ATTRIBUTE_SYSTEM_IMPLEMENTATION_SUMMARY.md)

---

## 🎯 Next Steps

After setting up attributes, integrate them into:
1. **Product Forms** - Dynamic fields based on category
2. **Product Display** - Show attributes on detail pages
3. **Product Filters** - Filter by attribute values
4. **Product Variants** - Use variant attributes for SKUs
