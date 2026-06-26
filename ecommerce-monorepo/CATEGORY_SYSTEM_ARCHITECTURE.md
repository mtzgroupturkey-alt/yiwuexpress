# 🏗️ Category System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADMIN PANEL                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Category Menu Manager (Drag & Drop)                        │   │
│  │  - Reorder categories                                        │   │
│  │  - Show/Hide from menu                                       │   │
│  │  - Visual hierarchy management                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↕                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Categories CRUD Page                                        │   │
│  │  - Create/Edit/Delete categories                             │   │
│  │  - Set parent relationships                                  │   │
│  │  - Upload images                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                               ↕
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ /categories/tree │  │ /categories/order│  │ /categories/[id]│  │
│  │  (GET tree)      │  │  (POST save)     │  │  (PUT/DELETE)   │  │
│  └──────────────────┘  └──────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                               ↕
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Category Table                                              │   │
│  │  - id, name, slug                                            │   │
│  │  - parentId (self-reference)                                 │   │
│  │  - level, menuOrder, displayOrder                            │   │
│  │  - isActive, showInMenu, isFeatured                          │   │
│  │  - description, image                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                               ↕
┌─────────────────────────────────────────────────────────────────────┐
│                       FRONTEND (Customer)                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  CategoryMenu Component                                      │   │
│  │  - Fetches from /api/categories                              │   │
│  │  - Shows only active & showInMenu=true                       │   │
│  │  - Displays in menuOrder sequence                            │   │
│  │  - Renders dropdowns for children                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Admin Reorders Categories

```
┌──────────────┐
│ Admin drags  │
│ Category A   │
│ above        │
│ Category B   │
└──────┬───────┘
       │
       ↓
┌──────────────────────┐
│ React State Updates  │
│ (optimistic update)  │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Click "Save Changes" │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────────────┐
│ POST /api/admin/categories/  │
│      order                   │
│ Body: {                      │
│   categories: [              │
│     {id, menuOrder, level}   │
│   ]                          │
│ }                            │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Database Transaction     │
│ UPDATE each category     │
│ SET menuOrder = X        │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Success Response         │
│ {success: true}          │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Show Success Message     │
│ "Order saved!"           │
└──────────────────────────┘
```

### 2. Category Display on Frontend

```
┌────────────────────┐
│ User visits        │
│ Homepage           │
└─────────┬──────────┘
          │
          ↓
┌─────────────────────────┐
│ CategoryMenu Component  │
│ useEffect() triggers    │
└─────────┬───────────────┘
          │
          ↓
┌───────────────────────────────┐
│ GET /api/categories           │
│     ?includeChildren=true     │
└─────────┬─────────────────────┘
          │
          ↓
┌─────────────────────────────────┐
│ Query Database                  │
│ WHERE isActive = true           │
│ AND showInMenu = true           │
│ ORDER BY menuOrder ASC          │
└─────────┬───────────────────────┘
          │
          ↓
┌─────────────────────────────────┐
│ Build Tree Structure            │
│ Parent → Children               │
└─────────┬───────────────────────┘
          │
          ↓
┌─────────────────────────────────┐
│ Return JSON                     │
│ {categories: [...]}             │
└─────────┬───────────────────────┘
          │
          ↓
┌─────────────────────────────────┐
│ React State Updates             │
│ setCategories(data)             │
└─────────┬───────────────────────┘
          │
          ↓
┌─────────────────────────────────┐
│ Render Menu                     │
│ Map categories → Links          │
│ Map children → Dropdowns        │
└─────────────────────────────────┘
```

---

## Component Architecture

### Menu Manager Page Structure

```
CategoryMenuManager (page.tsx)
├── State Management
│   ├── categories: CategoryItem[]
│   ├── isLoading: boolean
│   ├── isSaving: boolean
│   ├── error: string
│   └── success: string
│
├── DnD Context
│   ├── Sensors (PointerSensor, KeyboardSensor)
│   ├── CollisionDetection (closestCenter)
│   ├── onDragStart
│   ├── onDragEnd
│   └── onDragOver
│
├── API Functions
│   ├── fetchCategories()
│   ├── handleSaveOrder()
│   ├── handleToggleMenu()
│   ├── handleEdit()
│   └── handleDelete()
│
└── Components
    ├── Header (title, buttons)
    ├── Alerts (error, success)
    ├── DndContext
    │   └── SortableContext
    │       └── SortableCategoryItem (recursive)
    │           ├── Drag Handle
    │           ├── Expand/Collapse
    │           ├── Category Info
    │           ├── Actions (show/hide, edit, delete)
    │           └── Children (recursive render)
    └── Footer (tips)
```

### SortableCategoryItem Component

```
SortableCategoryItem
├── Props
│   ├── category: CategoryItem
│   ├── onEdit: (category) => void
│   ├── onDelete: (id) => void
│   ├── onToggleMenu: (id, show) => void
│   └── level: number
│
├── Hooks
│   ├── useState(isExpanded)
│   └── useSortable({ id })
│       ├── attributes (accessibility)
│       ├── listeners (drag events)
│       ├── setNodeRef (DOM ref)
│       ├── transform (drag transform)
│       ├── transition (animation)
│       └── isDragging (state)
│
└── Render
    ├── Drag Handle (with listeners)
    ├── Expand/Collapse Button
    ├── Category Info
    │   ├── Name (with active/inactive style)
    │   ├── Badges (Hidden, Featured)
    │   └── Product Count
    ├── Action Buttons
    │   ├── Show/Hide Toggle
    │   ├── Edit Button
    │   └── Delete Button
    └── Children (if expanded)
        └── Recursive SortableCategoryItem
```

---

## Database Schema Relationships

```
Category (Self-Referencing)
┌─────────────────────────────┐
│ id          (PK)            │
│ name                        │
│ slug        (UNIQUE)        │
│ parentId    (FK → id)  ────┐
│ level                       │
│ menuOrder                   │
│ isActive                    │
│ showInMenu                  │
│ ...                         │
└─────────────────────────────┘
         │                    │
         │                    │
         │ (one-to-many)      │
         │                    │
         └────────────────────┘
              (self-join)


Category ←─────→ Product
(one-to-many)
┌─────────────┐    ┌──────────────┐
│ Category    │    │ Product      │
│ id (PK) ────┼───→│ categoryId   │
│ name        │    │ name         │
│ ...         │    │ ...          │
└─────────────┘    └──────────────┘
```

---

## API Endpoint Details

### 1. GET /api/admin/categories/tree

**Purpose:** Fetch hierarchical category structure

**Query Params:** None

**Response Structure:**
```typescript
{
  success: boolean
  data: CategoryItem[]
}

interface CategoryItem {
  id: string
  name: string
  slug: string
  level: number
  menuOrder: number
  showInMenu: boolean
  isActive: boolean
  productCount: number
  children: CategoryItem[]  // Recursive
}
```

**Algorithm:**
```
1. Fetch root categories (parentId = null)
2. For each root category:
   a. Fetch children (parentId = category.id)
   b. For each child:
      i. Fetch grandchildren (parentId = child.id)
      ii. Calculate product count
3. Build tree structure
4. Return JSON
```

---

### 2. POST /api/admin/categories/order

**Purpose:** Save new category order

**Request Body:**
```typescript
{
  categories: Array<{
    id: string
    parentId: string | null
    menuOrder: number
    level: number
  }>
}
```

**Process:**
```
1. Validate request data
2. Begin database transaction
3. For each category:
   UPDATE Category
   SET menuOrder = X,
       parentId = Y,
       level = Z
   WHERE id = category.id
4. Commit transaction
5. Return success
```

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

---

### 3. PUT /api/admin/categories/[id]

**Purpose:** Update category details

**Request Body:**
```typescript
{
  name?: string
  slug?: string
  description?: string
  image?: string
  parentId?: string | null
  showInMenu?: boolean
  isActive?: boolean
  isFeatured?: boolean
}
```

**Validations:**
```
1. Check slug uniqueness (exclude current)
2. Prevent circular parent references
3. Validate parent exists (if provided)
```

---

## State Management Flow

### Local State (Menu Manager)

```
┌─────────────────────────────┐
│ categories: CategoryItem[]  │ ← Main category tree
├─────────────────────────────┤
│ isLoading: boolean          │ ← Loading state
├─────────────────────────────┤
│ isSaving: boolean           │ ← Saving state
├─────────────────────────────┤
│ error: string               │ ← Error message
├─────────────────────────────┤
│ success: string             │ ← Success message
├─────────────────────────────┤
│ activeId: string | null     │ ← Currently dragged
└─────────────────────────────┘
```

### State Updates

**Optimistic Update (Drag):**
```typescript
// Immediate UI update
setCategories(newOrder)

// Later: persist to DB
await saveOrder()
```

**Toggle Menu Visibility:**
```typescript
// 1. Update local state immediately
const updatedCategories = updateCategory(categories, id, { showInMenu })
setCategories(updatedCategories)

// 2. Send to API
await fetch(`/api/admin/categories/${id}`, {
  method: 'PUT',
  body: JSON.stringify({ showInMenu })
})

// 3. On save, persist all changes
await handleSaveOrder()
```

---

## Drag and Drop Mechanism

### @dnd-kit Flow

```
1. User clicks grip handle
   ↓
2. Activate drag sensor
   ↓
3. onDragStart(event)
   - Set activeId
   - Visual feedback starts
   ↓
4. User moves cursor/touch
   ↓
5. onDragOver(event) [optional]
   - Calculate drop position
   - Show drop indicator
   ↓
6. User releases
   ↓
7. onDragEnd(event)
   - Get active & over items
   - Calculate new position
   - Reorder array
   - Update state
   ↓
8. Clear activeId
   ↓
9. Visual feedback ends
```

### Position Calculation

```typescript
const oldIndex = categories.findIndex(c => c.id === active.id)
const newIndex = categories.findIndex(c => c.id === over.id)

const reordered = arrayMove(categories, oldIndex, newIndex)

// Update menuOrder
const withNewOrder = reordered.map((cat, index) => ({
  ...cat,
  menuOrder: index
}))
```

---

## Performance Considerations

### Optimization Strategies

1. **Recursive Queries**
   - Limit depth to 3 levels
   - Use Prisma include for efficient joins
   - Cache category tree in memory (future)

2. **React Rendering**
   - Use React.memo for CategoryItem
   - Avoid inline function definitions
   - Use useCallback for handlers

3. **Drag Performance**
   - CSS transforms (hardware accelerated)
   - requestAnimationFrame for smooth animations
   - Debounce save operations

4. **Database**
   - Index on menuOrder, parentId
   - Use transactions for atomic updates
   - Batch updates when possible

---

## Security Considerations

### Authentication
```typescript
// Check admin role
const user = await getAuthUser(req)
if (!user || user.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Validation
```typescript
// Prevent circular references
if (body.parentId === id) {
  return error('Category cannot be its own parent')
}

// Check slug uniqueness
const existing = await prisma.category.findUnique({ where: { slug } })
if (existing) return error('Slug already exists')

// Validate data types
if (!Array.isArray(categories)) {
  return error('Invalid data format')
}
```

### SQL Injection Protection
- Prisma ORM provides parameterized queries
- No raw SQL used
- All user input validated

---

## Testing Strategy

### Unit Tests (Future)
```typescript
describe('CategoryMenuManager', () => {
  test('should reorder categories', () => {})
  test('should toggle menu visibility', () => {})
  test('should save order', () => {})
})

describe('API /categories/order', () => {
  test('should update menu order', async () => {})
  test('should reject invalid data', async () => {})
})
```

### Integration Tests (Future)
- Test full drag-drop flow
- Test API endpoints with real database
- Test frontend-backend integration

### Manual Testing Checklist
✅ Drag category up
✅ Drag category down
✅ Toggle show/hide
✅ Save changes
✅ Refresh data
✅ Delete with validation
✅ Browser compatibility

---

## Deployment Checklist

### Before Deployment
- ✅ Run database migration
- ✅ Install npm dependencies
- ✅ Test in development
- ✅ Check TypeScript compilation
- ✅ Verify API endpoints
- ✅ Test on staging environment

### Deployment Steps
```bash
# 1. Database
npx prisma db push

# 2. Dependencies
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# 3. Build
npm run build

# 4. Test
npm run start

# 5. Verify
# Open http://localhost:3001/admin/categories/menu
```

---

## Monitoring & Maintenance

### Metrics to Track
- Average drag-drop operation time
- Save success rate
- API response times
- Error rates
- Category tree depth distribution

### Regular Maintenance
- Monthly: Review category structure
- Quarterly: Clean up empty categories
- Yearly: Archive unused categories

---

**Last Updated:** June 24, 2026
**Version:** 1.0
**Status:** Production Ready ✅
