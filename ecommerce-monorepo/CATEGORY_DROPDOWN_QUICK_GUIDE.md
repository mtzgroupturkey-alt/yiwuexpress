# Category Dropdown - Quick Reference Guide

## 🎯 What is it?

An enhanced dropdown component for selecting categories with:
- **Hierarchical display** (Parent → Child → Grandchild)
- **Search functionality** (filter by name or path)
- **Clear selection** (X button to unselect)
- **Path display** (shows full category path)

---

## 🚀 Quick Start

### Basic Usage

```tsx
import { CategoryDropdown } from '@/components/ui/CategoryDropdown'

function MyForm() {
  const [categoryId, setCategoryId] = useState(null)
  const [categories, setCategories] = useState([])

  return (
    <CategoryDropdown
      categories={categories}
      value={categoryId}
      onChange={setCategoryId}
      placeholder="Select a category..."
    />
  )
}
```

---

## 📋 All Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `categories` | `Category[]` | **required** | Array of categories |
| `value` | `string \| null` | **required** | Selected category ID |
| `onChange` | `function` | **required** | Callback when selection changes |
| `placeholder` | `string` | "Select a category" | Placeholder text |
| `searchPlaceholder` | `string` | "Search categories..." | Search input placeholder |
| `className` | `string` | `undefined` | Additional CSS classes |
| `disabled` | `boolean` | `false` | Disable the dropdown |
| `required` | `boolean` | `false` | Show as required field |
| `clearable` | `boolean` | `true` | Show clear button |
| `showPath` | `boolean` | `true` | Show full path in selection |
| `showLevelIndicator` | `boolean` | `true` | Show L1, L2, L3 badges |

---

## 🎨 Visual Examples

### With Path Display (showPath=true)
```
┌─────────────────────────────────────────┐
│ Electronics > Computers > Laptops     ▼│
└─────────────────────────────────────────┘
```

### Without Path Display (showPath=false)
```
┌─────────────────────────────────────────┐
│ Laptops                               ▼│
└─────────────────────────────────────────┘
```

### With Level Indicators
```
┌─────────────────────────────────────────┐
│ Electronics                          [L1]│
│   ▼ Computers                        [L2]│
│       Laptops                        [L3]│
│       Desktops                       [L3]│
└─────────────────────────────────────────┘
```

---

## 💡 Common Use Cases

### 1. Product Form

```tsx
<Label>Category *</Label>
<CategoryDropdown
  categories={categories}
  value={categoryId}
  onChange={setCategoryId}
  placeholder="Select a category..."
  required
  clearable
  showPath
/>
```

### 2. Filter (Admin)

```tsx
<CategoryDropdown
  categories={categories}
  value={filterCategory}
  onChange={setFilterCategory}
  placeholder="All Categories"
  clearable
  showPath
  showLevelIndicator={false}
/>
```

### 3. Filter (Frontend)

```tsx
<CategoryDropdown
  categories={categories}
  value={filters.category}
  onChange={(val) => setFilters({...filters, category: val})}
  placeholder="All Categories"
  clearable
/>
```

---

## 🔑 Key Features

### ✅ Hierarchy Display
- Parent categories can be expanded/collapsed
- Children are indented for visual clarity
- Up to 3+ levels deep supported

### ✅ Search
- Type to filter categories
- Matches category names and parent names
- Auto-expands matching categories

### ✅ Clear Selection
- Click X button next to selected value
- Click "Clear selection" in dropdown footer
- Pass `null` to `onChange` programmatically

### ✅ Path Display
- Shows full category path: `Parent > Child > Grandchild`
- Toggle with `showPath` prop
- Helps users understand category location

### ✅ Level Indicators
- Shows badges: L1, L2, L3
- Helps identify category depth
- Toggle with `showLevelIndicator` prop

---

## 🎮 User Interactions

| Action | Result |
|--------|--------|
| Click dropdown | Opens category list |
| Click category | Selects and closes |
| Click parent with children | Expands/collapses children |
| Type in search | Filters categories |
| Click X button | Clears selection |
| Click outside | Closes dropdown |
| Press Escape | Closes dropdown |

---

## 📊 Category Data Format

### Flat Structure (from API)
```json
[
  {
    "id": "cat-1",
    "name": "Electronics",
    "slug": "electronics",
    "parentId": null
  },
  {
    "id": "cat-2",
    "name": "Computers",
    "slug": "computers",
    "parentId": "cat-1"
  },
  {
    "id": "cat-3",
    "name": "Laptops",
    "slug": "laptops",
    "parentId": "cat-2"
  }
]
```

Component automatically builds tree structure:
```
Electronics (cat-1)
└── Computers (cat-2)
    └── Laptops (cat-3)
```

---

## 🔧 Customization Examples

### Remove Clear Button
```tsx
<CategoryDropdown
  clearable={false}
  // ... other props
/>
```

### Hide Level Badges
```tsx
<CategoryDropdown
  showLevelIndicator={false}
  // ... other props
/>
```

### Show Only Name (No Path)
```tsx
<CategoryDropdown
  showPath={false}
  // ... other props
/>
```

### Custom Styling
```tsx
<CategoryDropdown
  className="w-full max-w-md"
  // ... other props
/>
```

### Disabled State
```tsx
<CategoryDropdown
  disabled={true}
  // ... other props
/>
```

---

## 🐛 Common Issues & Solutions

### Issue: "Categories not showing"
**Solution:** Make sure categories array is populated
```tsx
useEffect(() => {
  fetch('/api/categories')
    .then(res => res.json())
    .then(data => setCategories(data.data || []))
}, [])
```

### Issue: "Selected value not displaying"
**Solution:** Ensure value matches a category ID
```tsx
// ✅ Correct
<CategoryDropdown value="cat-123" />

// ❌ Wrong
<CategoryDropdown value="Electronics" /> // Use ID, not name
```

### Issue: "Dropdown closes when clicking inside"
**Solution:** Use `e.stopPropagation()` if needed
```tsx
// Already handled in component, no action needed
```

---

## 📱 Responsive Behavior

| Screen Size | Behavior |
|-------------|----------|
| Desktop (1024px+) | Full width with all features |
| Tablet (768px-1023px) | Adapts to container width |
| Mobile (<768px) | Stacks vertically, touch-friendly |

---

## ⚡ Performance Tips

1. **Memoize categories** if they don't change often
```tsx
const categories = useMemo(() => fetchedCategories, [fetchedCategories])
```

2. **Fetch once** on component mount
```tsx
useEffect(() => {
  fetchCategories()
}, []) // Empty dependency array
```

3. **Use tree endpoint** for better performance
```tsx
fetch('/api/admin/categories/tree') // Already built hierarchy
```

---

## 📚 Related Components

- **Select** - Basic dropdown (for simple lists)
- **Input** - Text input field
- **Label** - Form field label
- **Button** - Action buttons

---

## ✨ Best Practices

### ✅ DO
- Fetch categories once on mount
- Use controlled component pattern
- Provide clear placeholder text
- Show path for clarity
- Enable clear button for filters

### ❌ DON'T
- Don't fetch on every render
- Don't use category name as value
- Don't disable without reason
- Don't hide level indicators in admin
- Don't make required fields unclearable

---

## 🎓 Complete Example

```tsx
import { useState, useEffect } from 'react'
import { CategoryDropdown } from '@/components/ui/CategoryDropdown'
import { Label } from '@/components/ui/label'

export function ProductForm() {
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [categories, setCategories] = useState([])

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data.data || []))
      .catch(err => console.error('Failed to fetch categories:', err))
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!categoryId) {
      alert('Please select a category')
      return
    }
    // Submit form with categoryId
    console.log('Selected category:', categoryId)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="category">
          Category *
        </Label>
        <CategoryDropdown
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
          placeholder="Select a category..."
          searchPlaceholder="Search categories..."
          required
          clearable
          showPath
          showLevelIndicator
        />
        {!categoryId && (
          <p className="text-sm text-red-500">
            Category is required
          </p>
        )}
      </div>
      
      <button type="submit">
        Submit
      </button>
    </form>
  )
}
```

---

## 🎉 You're Ready!

The CategoryDropdown component is production-ready and fully featured. Use this guide as a quick reference while implementing it in your application.

**Need more details?** Check the full documentation: `CATEGORY_DROPDOWN_IMPLEMENTATION.md`

---

**Created**: June 25, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
