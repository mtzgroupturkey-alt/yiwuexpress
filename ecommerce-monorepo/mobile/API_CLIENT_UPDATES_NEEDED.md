# Mobile API Client Updates Needed

## Overview
The 7 new mobile screens use mock data. Add these methods to `mobile/src/api/client.ts` to connect them to your backend.

---

## 1. Cart & Checkout APIs

Add these interfaces and methods:

```typescript
// Add to interfaces section
export interface CartItem {
  id: string
  productId: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    image: string | null
  }
}

export interface Cart {
  items: CartItem[]
  total: number
}

export interface CreateOrderData {
  shippingAddress: string
  city: string
  postalCode: string
  country: string
  phone: string
  paymentMethod: string
}

// Add to ApiClient class
async getCart(): Promise<Cart> {
  const response = await client.get('/cart')
  return response.data
}

async addToCart(productId: string, quantity: number) {
  const response = await client.post('/cart', { productId, quantity })
  return response.data
}

async updateCartItem(itemId: string, quantity: number) {
  const response = await client.put(`/cart/${itemId}`, { quantity })
  return response.data
}

async removeFromCart(itemId: string) {
  const response = await client.delete(`/cart/${itemId}`)
  return response.data
}

async createOrder(data: CreateOrderData) {
  const response = await client.post('/orders', data)
  return response.data
}
```

---

## 2. Orders APIs

```typescript
// Add to interfaces section
export interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    image: string | null
  }
}

export interface Order {
  id: string
  orderNumber: string
  createdAt: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  subtotal: number
  shipping: number
  tax: number
  itemCount: number
  shippingAddress: string
  city: string
  postalCode: string
  country: string
  phone: string
  paymentMethod: string
  trackingNumber: string | null
  items: OrderItem[]
}

// Add to ApiClient class
async getOrders(status?: string): Promise<{ orders: Order[] }> {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  const response = await client.get(`/orders?${params}`)
  return response.data
}

async getOrder(orderId: string): Promise<{ order: Order }> {
  const response = await client.get(`/orders/${orderId}`)
  return response.data
}

async cancelOrder(orderId: string) {
  const response = await client.put(`/orders/${orderId}/cancel`)
  return response.data
}
```

---

## 3. Products APIs

```typescript
// Add to interfaces section
export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  image: string | null
  category: string | null
  createdAt: string
}

// Add to ApiClient class
async getProducts(
  page = 1,
  limit = 10,
  category?: string,
  search?: string
): Promise<{ products: Product[]; total: number }> {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('limit', limit.toString())
  if (category) params.append('category', category)
  if (search) params.append('search', search)
  
  const response = await client.get(`/products?${params}`)
  return response.data
}

async getProduct(productId: string): Promise<{ product: Product }> {
  const response = await client.get(`/products/${productId}`)
  return response.data
}
```

---

## 4. Search API

```typescript
// Add to interfaces section
export interface SearchResult {
  id: string
  type: 'product' | 'service'
  name: string
  description: string | null
  price: number
  image: string | null
  category: string | null
}

// Add to ApiClient class
async search(
  query: string,
  type?: 'product' | 'service'
): Promise<{ results: SearchResult[] }> {
  const params = new URLSearchParams()
  params.append('q', query)
  if (type) params.append('type', type)
  
  const response = await client.get(`/search?${params}`)
  return response.data
}
```

---

## 5. Notifications APIs

```typescript
// Add to interfaces section
export interface Notification {
  id: string
  type: 'order' | 'shipment' | 'promotion' | 'system'
  title: string
  message: string
  createdAt: string
  read: boolean
  actionUrl?: string
}

// Add to ApiClient class
async getNotifications(): Promise<{ notifications: Notification[] }> {
  const response = await client.get('/notifications')
  return response.data
}

async markNotificationRead(notificationId: string) {
  const response = await client.put(`/notifications/${notificationId}/read`)
  return response.data
}

async markAllNotificationsRead() {
  const response = await client.put('/notifications/read-all')
  return response.data
}

async clearAllNotifications() {
  const response = await client.delete('/notifications')
  return response.data
}
```

---

## 6. Settings APIs

```typescript
// Add to ApiClient class
async updatePassword(currentPassword: string, newPassword: string) {
  const response = await client.put('/auth/change-password', {
    currentPassword,
    newPassword,
  })
  return response.data
}

async updateNotificationSettings(settings: {
  pushNotifications: boolean
  emailNotifications: boolean
  orderUpdates: boolean
  promotions: boolean
}) {
  const response = await client.put('/settings/notifications', settings)
  return response.data
}

async deleteAccount() {
  const response = await client.delete('/auth/account')
  return response.data
}
```

---

## Complete Updated client.ts

Here's where to add all these methods in your existing `mobile/src/api/client.ts`:

```typescript
class ApiClient {
  // ... existing methods (register, login, getServices, etc.) ...

  // ============= NEW METHODS FOR PHASE 1 COMPLETION =============

  // Cart & Checkout
  async getCart(): Promise<Cart> { /* ... */ }
  async addToCart(productId: string, quantity: number) { /* ... */ }
  async updateCartItem(itemId: string, quantity: number) { /* ... */ }
  async removeFromCart(itemId: string) { /* ... */ }
  async createOrder(data: CreateOrderData) { /* ... */ }

  // Orders
  async getOrders(status?: string): Promise<{ orders: Order[] }> { /* ... */ }
  async getOrder(orderId: string): Promise<{ order: Order }> { /* ... */ }
  async cancelOrder(orderId: string) { /* ... */ }

  // Products
  async getProducts(page = 1, limit = 10, category?: string, search?: string): Promise<{ products: Product[]; total: number }> { /* ... */ }
  async getProduct(productId: string): Promise<{ product: Product }> { /* ... */ }

  // Search
  async search(query: string, type?: 'product' | 'service'): Promise<{ results: SearchResult[] }> { /* ... */ }

  // Notifications
  async getNotifications(): Promise<{ notifications: Notification[] }> { /* ... */ }
  async markNotificationRead(notificationId: string) { /* ... */ }
  async markAllNotificationsRead() { /* ... */ }
  async clearAllNotifications() { /* ... */ }

  // Settings
  async updatePassword(currentPassword: string, newPassword: string) { /* ... */ }
  async updateNotificationSettings(settings: any) { /* ... */ }
  async deleteAccount() { /* ... */ }

  // ... existing methods continue ...
}

export default new ApiClient()
```

---

## Backend Endpoints Needed

Your backend needs to implement these REST API endpoints:

### Cart Endpoints
```
GET    /api/cart              - Get user's cart
POST   /api/cart              - Add item to cart
PUT    /api/cart/:id          - Update cart item quantity
DELETE /api/cart/:id          - Remove item from cart
```

### Order Endpoints
```
GET    /api/orders            - List user orders
POST   /api/orders            - Create new order
GET    /api/orders/:id        - Get order details
PUT    /api/orders/:id/cancel - Cancel order
```

### Product Endpoints (Customer)
```
GET    /api/products          - List products (paginated, searchable, filterable)
GET    /api/products/:id      - Get product detail
```

### Search Endpoint
```
GET    /api/search?q=query&type=product|service
```

### Notification Endpoints
```
GET    /api/notifications                   - List user notifications
PUT    /api/notifications/:id/read          - Mark single as read
PUT    /api/notifications/read-all          - Mark all as read
DELETE /api/notifications                   - Clear all
```

### Settings Endpoints
```
PUT    /api/auth/change-password            - Change password
PUT    /api/settings/notifications          - Update notification preferences
DELETE /api/auth/account                    - Delete account
```

---

## Testing After Implementation

Once you've added these methods, test each screen:

1. **CheckoutScreen**: Create an order
2. **OrderListScreen**: View order list
3. **OrderDetailScreen**: View order details
4. **ProductListScreen**: Browse products
5. **SearchScreen**: Search for items
6. **SettingsScreen**: Change password, update settings
7. **NotificationsScreen**: View and manage notifications

---

## Priority Order

Implement in this order for fastest results:

1. **Products** (enables ProductListScreen, SearchScreen)
2. **Cart** (enables CheckoutScreen)
3. **Orders** (enables OrderListScreen, OrderDetailScreen)
4. **Search** (enables SearchScreen fully)
5. **Notifications** (enables NotificationsScreen)
6. **Settings** (enables SettingsScreen fully)

---

**Good luck with the API integration!** 🚀
