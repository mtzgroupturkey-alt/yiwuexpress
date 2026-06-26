# YIWU EXPRESS - API Reference Guide

> Complete API documentation for all implemented endpoints

**Base URL:** `http://localhost:3001/api`

---

## 🔐 Authentication

Most endpoints require JWT authentication. Include the token in request headers:

```http
Authorization: Bearer <your_jwt_token>
```

**Get Token:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@yiwuexpress.com",
  "password": "admin123"
}
```

---

## 🌍 Countries API

### Get All Countries

```http
GET /api/countries?active=true
```

**Query Parameters:**
- `active` (optional) - Filter by active status (default: true)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "code": "RU",
      "name": "Russia",
      "currency": "RUB",
      "currencySymbol": "₽",
      "flag": "🇷🇺",
      "shippingMethods": { ... },
      "customsRules": { ... },
      "paymentMethods": ["BANK_TRANSFER", "CRYPTO"],
      "deliverySLA": "Standard: 15-20 days, Express: 5-7 days",
      "restrictedProducts": [],
      "isActive": true,
      "shippingRates": [ ... ]
    }
  ],
  "count": 8
}
```

### Get Country by Code

```http
GET /api/countries/RU
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "code": "RU",
    "name": "Russia",
    "shippingRates": [
      {
        "carrier": "DHL Express",
        "serviceType": "express",
        "baseRate": 120,
        "ratePerKg": 18,
        "estimatedDays": "5-7 days"
      }
    ]
  }
}
```

---

## 🚚 Shipping API

### Calculate Shipping Cost

```http
POST /api/shipping/calculate
Content-Type: application/json

{
  "countryCode": "RU",
  "weightKg": 10.5,
  "serviceType": "express"
}
```

**Request Body:**
- `countryCode` (required) - Two-letter country code
- `weightKg` (required) - Package weight in kilograms
- `serviceType` (optional) - "standard", "express", or "sea"

**Response:**
```json
{
  "success": true,
  "data": {
    "country": {
      "code": "RU",
      "name": "Russia",
      "currency": "RUB",
      "currencySymbol": "₽"
    },
    "weight": 10.5,
    "shippingOptions": [
      {
        "carrier": "DHL Express",
        "serviceType": "express",
        "cost": 309.00,
        "estimatedDays": "5-7 days",
        "baseRate": 120,
        "ratePerKg": 18
      }
    ],
    "customsInfo": {
      "dutyRate": 15,
      "vatRate": 20,
      "thresholdUSD": 200,
      "documentRequirements": ["COMMERCIAL_INVOICE", "PACKING_LIST", "COO"]
    }
  }
}
```

---

## 📁 Categories API

### Get All Categories

```http
GET /api/categories?active=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "name": "Kitchenware",
      "slug": "kitchenware",
      "description": "Kitchen tools, utensils, and cookware",
      "image": "/images/categories/kitchenware.jpg",
      "isActive": true,
      "_count": {
        "products": 2
      }
    }
  ],
  "count": 6
}
```

### Create Category (Admin)

```http
POST /api/categories
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "New Category",
  "slug": "new-category",
  "description": "Category description",
  "image": "/images/category.jpg"
}
```

---

## 📦 Products API

### Get All Products

```http
GET /api/products?category=kitchenware&featured=true&page=1&limit=20
```

**Query Parameters:**
- `category` (optional) - Filter by category slug
- `search` (optional) - Search in name, description, SKU
- `featured` (optional) - Filter featured products
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "sku": "KW-ST-001",
      "name": "Stainless Steel Cooking Set",
      "slug": "stainless-steel-cooking-set",
      "price": 89.99,
      "compareAtPrice": 129.99,
      "thumbnail": "/images/products/cooking-set-1.jpg",
      "stock": 500,
      "hsCode": "7323.93.00",
      "weightKg": 8.5,
      "dimensions": { "length": 45, "width": 35, "height": 25 },
      "fragile": false,
      "dangerousGoods": false,
      "isFeatured": true,
      "category": {
        "name": "Kitchenware",
        "slug": "kitchenware"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 4,
    "pages": 1
  }
}
```

### Get Product by Slug

```http
GET /api/products/stainless-steel-cooking-set
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "sku": "KW-ST-001",
    "name": "Stainless Steel Cooking Set",
    "description": "12-piece professional stainless steel cookware set...",
    "price": 89.99,
    "stock": 500,
    "hsCode": "7323.93.00",
    "weightKg": 8.5,
    "declaredCustomsValue": 45.00,
    "countryOfOrigin": "China",
    "material": "Stainless Steel 304",
    "requiredExportDocs": ["COMMERCIAL_INVOICE", "PACKING_LIST", "COO"],
    "minOrderQty": 10,
    "wholesalePrice": 75.00
  }
}
```

### Create Product (Admin)

```http
POST /api/products
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "sku": "TEST-001",
  "name": "Test Product",
  "slug": "test-product",
  "categoryId": "clxxx...",
  "price": 29.99,
  "weightKg": 1.5,
  "stock": 100,
  "hsCode": "1234.56.78"
}
```

### Update Product (Admin)

```http
PUT /api/products/test-product
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "price": 24.99,
  "stock": 150
}
```

### Delete Product (Admin)

```http
DELETE /api/products/test-product
Authorization: Bearer <admin_token>
```

---

## 🛒 Cart API

### Get User's Cart

```http
GET /api/cart?userId=clxxx...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": {
      "id": "clxxx...",
      "userId": "clxxx...",
      "items": [
        {
          "id": "clxxx...",
          "productId": "clxxx...",
          "quantity": 2,
          "product": {
            "name": "Stainless Steel Cooking Set",
            "price": 89.99,
            "thumbnail": "/images/product.jpg",
            "stock": 500,
            "weightKg": 8.5
          }
        }
      ]
    },
    "summary": {
      "itemCount": 1,
      "totalQuantity": 2,
      "subtotal": 179.98,
      "totalWeight": 17.0
    }
  }
}
```

### Add Item to Cart

```http
POST /api/cart
Content-Type: application/json

{
  "userId": "clxxx...",
  "productId": "clxxx...",
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Item added to cart"
}
```

### Update Cart Item Quantity

```http
PUT /api/cart/clxxx...
Content-Type: application/json

{
  "quantity": 3
}
```

### Remove Cart Item

```http
DELETE /api/cart/clxxx...
```

### Clear Cart

```http
DELETE /api/cart?userId=clxxx...
```

---

## 📦 Orders API

### Get User's Orders

```http
GET /api/orders?userId=clxxx...&status=PENDING
```

**Query Parameters:**
- `userId` (required) - User ID
- `status` (optional) - Filter by status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "orderNumber": "YWE-1703123456789-ABC12",
      "status": "PENDING",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "total": 299.99,
      "shippingCountry": {
        "code": "RU",
        "name": "Russia"
      },
      "items": [ ... ],
      "createdAt": "2026-06-23T10:00:00Z"
    }
  ],
  "count": 1
}
```

### Create Order

```http
POST /api/orders
Content-Type: application/json

{
  "userId": "clxxx...",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+7 900 123-45-67",
  "shippingAddress": "123 Main St",
  "shippingCity": "Moscow",
  "shippingPostalCode": "101000",
  "shippingCountryId": "clxxx...",
  "paymentMethod": "BANK_TRANSFER",
  "shippingFee": 50.00,
  "items": [
    {
      "productId": "clxxx...",
      "quantity": 2
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "orderNumber": "YWE-1703123456789-ABC12",
    "status": "PENDING",
    "total": 299.99
  },
  "message": "Order created successfully"
}
```

### Get Order by ID

```http
GET /api/orders/clxxx...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "orderNumber": "YWE-1703123456789-ABC12",
    "status": "PENDING",
    "trackingHistory": [
      {
        "status": "PENDING",
        "notes": "Order created",
        "timestamp": "2026-06-23T10:00:00Z",
        "location": "Yiwu, China"
      }
    ],
    "items": [ ... ],
    "exceptions": []
  }
}
```

### Update Order Status (Admin)

```http
PUT /api/orders/clxxx.../status
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "status": "PAID",
  "notes": "Payment confirmed",
  "location": "Yiwu, China"
}
```

**Valid Status Transitions:**
- PENDING → PAID, CANCELLED
- PAID → PROCESSING, CANCELLED
- PROCESSING → PICKING, ON_HOLD, CANCELLED
- PICKING → PACKING, ON_HOLD
- PACKING → SHIPPED, ON_HOLD
- SHIPPED → IN_TRANSIT, CANCELLED
- IN_TRANSIT → CUSTOMS_HOLD, CUSTOMS_CLEARED, ARRIVED
- CUSTOMS_CLEARED → ARRIVED, IN_TRANSIT
- ARRIVED → OUT_FOR_DELIVERY
- OUT_FOR_DELIVERY → DELIVERED, DELIVERY_FAILED
- DELIVERED → RETURN_REQUESTED, COMPLETED

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Order status updated to PAID"
}
```

### Get Order Status History

```http
GET /api/orders/clxxx.../status
```

---

## 🏢 Wholesale API

### Get Wholesale Inquiries

```http
GET /api/wholesale?userId=clxxx...&status=QUOTED
```

**Query Parameters:**
- `userId` (optional) - Filter by user
- `status` (optional) - Filter by status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "inquiryNumber": "WH-1703123456789-ABC12",
      "companyName": "Global Trade Co.",
      "businessType": "wholesaler",
      "country": "Russia",
      "status": "QUOTED",
      "quotedPrice": 5000.00,
      "products": [ ... ],
      "user": { ... }
    }
  ],
  "count": 1
}
```

### Create Wholesale Inquiry

```http
POST /api/wholesale
Content-Type: application/json

{
  "userId": "clxxx...",
  "companyName": "Global Trade Co.",
  "businessType": "wholesaler",
  "country": "Russia",
  "countryCode": "RU",
  "products": [
    {
      "productId": "clxxx...",
      "productName": "Stainless Steel Cooking Set",
      "quantity": 1000,
      "targetPrice": 70.00
    }
  ],
  "paymentTerms": "30% deposit + 70% before shipment",
  "shippingTerms": "FOB",
  "preferredShipping": "sea",
  "requiredDeliveryDate": "2026-08-01",
  "targetPrice": 70000.00,
  "customerNotes": "Need quote urgently"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "inquiryNumber": "WH-1703123456789-ABC12",
    "status": "INQUIRY_SUBMITTED"
  },
  "message": "Wholesale inquiry submitted successfully"
}
```

### Get Inquiry by ID

```http
GET /api/wholesale/clxxx...
```

### Create Quote (Admin)

```http
POST /api/wholesale/clxxx.../quote
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "quotedPrice": 72000.00,
  "quoteNotes": "Special discount for bulk order",
  "quoteValidDays": 30,
  "quotedBy": "admin_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "QUOTED",
    "quotedPrice": 72000.00,
    "quoteValidUntil": "2026-07-23T10:00:00Z"
  },
  "message": "Quote created successfully"
}
```

### Update Inquiry Status (Admin)

```http
PUT /api/wholesale/clxxx.../status
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "status": "APPROVED",
  "notes": "Customer approved the quote"
}
```

**Valid Status Transitions:**
- INQUIRY_SUBMITTED → UNDER_REVIEW, REJECTED
- UNDER_REVIEW → QUOTED, REJECTED
- QUOTED → NEGOTIATING, APPROVED, REJECTED
- NEGOTIATING → QUOTED, APPROVED, REJECTED
- APPROVED → INVOICED, CANCELLED
- INVOICED → PAID, CANCELLED
- PAID → FULFILLMENT
- FULFILLMENT → SHIPPED
- SHIPPED → CLOSED

### Get Status History

```http
GET /api/wholesale/clxxx.../status
```

---

## 📊 Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## 🧪 Example Workflows

### Complete Shopping Flow

```bash
# 1. Browse products
curl http://localhost:3001/api/products?featured=true

# 2. Get product details
curl http://localhost:3001/api/products/stainless-steel-cooking-set

# 3. Calculate shipping
curl -X POST http://localhost:3001/api/shipping/calculate \
  -H "Content-Type: application/json" \
  -d '{"countryCode":"RU","weightKg":17.0,"serviceType":"express"}'

# 4. Add to cart
curl -X POST http://localhost:3001/api/cart \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","productId":"PRODUCT_ID","quantity":2}'

# 5. Get cart
curl http://localhost:3001/api/cart?userId=USER_ID

# 6. Create order
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d @order.json

# 7. Track order
curl http://localhost:3001/api/orders/ORDER_ID/status
```

### Wholesale Inquiry Flow

```bash
# 1. Submit inquiry
curl -X POST http://localhost:3001/api/wholesale \
  -H "Content-Type: application/json" \
  -d @wholesale-inquiry.json

# 2. Admin: Create quote
curl -X POST http://localhost:3001/api/wholesale/INQUIRY_ID/quote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"quotedPrice":72000,"quoteNotes":"Special bulk pricing"}'

# 3. Customer: View quote
curl http://localhost:3001/api/wholesale/INQUIRY_ID

# 4. Admin: Update status
curl -X PUT http://localhost:3001/api/wholesale/INQUIRY_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"status":"APPROVED"}'
```

---

## 📝 Notes

- All dates are in ISO 8601 format
- All prices are in USD unless specified otherwise
- Weight is in kilograms (kg)
- Dimensions are in centimeters (cm)
- JSON fields (shippingMethods, customsRules, dimensions, etc.) contain structured data
- Authentication is required for most POST/PUT/DELETE operations
- Admin endpoints require admin role authentication

---

**API Version:** 1.0.0  
**Last Updated:** 2026-06-23  
**Base URL:** http://localhost:3001/api
