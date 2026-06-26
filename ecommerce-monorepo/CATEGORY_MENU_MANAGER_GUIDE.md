# 📖 Category Menu Manager - User Guide

## Quick Start

### 🎯 Access the Menu Manager
1. Login to admin: `http://localhost:3001/admin`
2. Click **"Categories"** in the sidebar
3. Click **"Menu Manager"** from the submenu
4. Or go directly: `http://localhost:3001/admin/categories/menu`

---

## 🎨 Interface Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Category Menu Manager                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  [Refresh]  [Add Category]  [Save Changes]                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ☰ Cookware ─────── [👁️] [✏️] [🗑️]  (45 products)        │ │
│  │    ▼ Stainless Steel ─ [👁️] [✏️] [🗑️]  (12 products)     │ │
│  │      ► Sauce Pans ── [👁️] [✏️] [🗑️]  (5 products)        │ │
│  │  ☰ Bakeware ────────[👁️] [✏️] [🗑️]  (23 products)        │ │
│  │  ☰ Utensils ────────[👁️] [✏️] [🗑️]  (15 products)        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Icons Explained
- **☰** (Grip Handle) - Drag to reorder
- **▼/►** (Arrows) - Expand/collapse children
- **👁️** (Eye) - Show in menu
- **👁️‍🗨️** (Eye Off) - Hidden from menu
- **✏️** (Pencil) - Edit category
- **🗑️** (Trash) - Delete category

---

## 🎯 Common Tasks

### 1. Reorder Categories

**Steps:**
1. Click and hold the **☰ grip handle**
2. Drag up or down to new position
3. Release to drop
4. Click **"Save Changes"** button

**Visual Feedback:**
- Category becomes semi-transparent while dragging
- Blue border indicates drop target
- Smooth animation when dropped

**Example:**
```
Before:                After Dragging:
1. Cookware           1. Bakeware
2. Bakeware    →      2. Cookware
3. Utensils           3. Utensils
```

---

### 2. Show/Hide Categories from Menu

**Purpose:** Control which categories appear in the frontend navigation menu

**Steps:**
1. Click the **eye icon** (👁️) next to category name
2. **Blue eye** = Visible in menu
3. **Gray crossed-eye** = Hidden from menu
4. Click **"Save Changes"** to persist

**Use Cases:**
- Hide seasonal categories when not in season
- Hide empty categories (no products)
- Create categories for organization but hide from customers
- Temporarily disable categories without deleting

**Example:**
```
Cookware     👁️  ← Visible on frontend
Bakeware     👁️‍🗨️  ← Hidden from frontend (still in admin)
Utensils     👁️  ← Visible on frontend
```

---

### 3. Expand/Collapse Categories

**Steps:**
1. Click **▼** (down arrow) to collapse
2. Click **►** (right arrow) to expand
3. Works for categories with children only

**Use Cases:**
- Focus on specific category branch
- Reduce visual clutter
- Better overview of large category trees

---

### 4. Edit Categories

**Current Behavior:**
1. Click **✏️ pencil icon**
2. Alert shows (placeholder)
3. Go to regular Categories page for full editing

**For Full Editing:**
1. Click **"Categories"** in sidebar
2. Find the category in the list
3. Click Edit button
4. Modify: name, slug, description, parent, image, etc.
5. Save changes

---

### 5. Delete Categories

**Steps:**
1. Click **🗑️ trash icon**
2. Confirmation dialog appears
3. Click "OK" to confirm deletion

**Important Validations:**
- ❌ **Cannot delete** if category has children
- ❌ **Cannot delete** if category has products
- ✅ **Must** reassign children/products first

**Error Messages:**
- "Cannot delete category with 3 sub-categories..."
- "Cannot delete category with 12 products..."

**Safe Deletion Process:**
1. Move/delete all child categories first
2. Reassign all products to another category
3. Then delete the empty category

---

### 6. Create Nested Categories

**Method 1: Using Category Form**
1. Go to **Categories** page (not Menu Manager)
2. Click **"Add Category"**
3. Fill in category details
4. Select **"Parent Category"** from dropdown
5. Save

**Hierarchy Levels:**
- **Level 1**: Top-level parent (e.g., Cookware)
- **Level 2**: Child category (e.g., Stainless Steel)
- **Level 3**: Grandchild (e.g., Sauce Pans)

**Visual Result:**
```
Cookware (Level 1)
  ├─ Stainless Steel (Level 2)
  │   ├─ Sauce Pans (Level 3)
  │   └─ Frying Pans (Level 3)
  └─ Non-stick (Level 2)
```

**Limitation:** Maximum 3 levels of nesting

---

### 7. Save Changes

**Important:** Changes are NOT saved automatically!

**Steps:**
1. Make your changes (reorder, show/hide, etc.)
2. Click **"Save Changes"** button (green, top-right)
3. Wait for success message
4. Changes are now saved to database

**What Gets Saved:**
- ✅ Category order
- ✅ Show/hide status
- ✅ Parent-child relationships (if changed)

**What Doesn't Get Saved:**
- ❌ Unsaved edits (use Categories page for editing)
- ❌ Deleted categories (delete is immediate)

---

### 8. Refresh Data

**When to Use:**
- After making changes in another tab
- If data seems outdated
- To discard unsaved changes

**Steps:**
1. Click **"Refresh"** button (top-right)
2. Data reloads from database
3. Unsaved changes are lost

---

## 💡 Pro Tips

### Tip 1: Plan Your Hierarchy
Before creating categories:
- Sketch out your category tree on paper
- Keep it simple (2-3 levels max)
- Group related products logically

### Tip 2: Use Meaningful Names
- **Good**: "Stainless Steel Cookware"
- **Bad**: "Category 1"

### Tip 3: Hide Empty Categories
If a category has 0 products:
- Click the eye icon to hide
- Keeps frontend menu clean
- Make visible when you add products

### Tip 4: Featured Categories
Mark important categories as "Featured":
- Edit category in Categories page
- Enable "Featured" toggle
- Featured badge appears in Menu Manager

### Tip 5: Test on Frontend
After reordering:
1. Save changes
2. Visit frontend: `http://localhost:3001/`
3. Check the category menu (blue bar)
4. Verify order is correct

### Tip 6: Batch Your Changes
- Make multiple changes at once
- Save once at the end
- Reduces server requests

### Tip 7: Use Search in Categories Page
For large category lists:
- Go to Categories page
- Use search box to find specific category
- Edit directly from there

---

## 🚨 Common Issues & Solutions

### Issue 1: Can't Save Changes
**Problem:** "Save Changes" button doesn't work

**Solutions:**
1. Check console for errors (F12)
2. Verify database is running
3. Check network tab for failed requests
4. Try refreshing the page

### Issue 2: Categories Not Showing on Frontend
**Problem:** Saved categories don't appear in menu

**Checklist:**
- ✅ Category is **Active** (not strikethrough)
- ✅ Category has **Show in Menu** enabled (blue eye)
- ✅ Changes were **Saved** (clicked Save Changes button)
- ✅ Frontend page was **Refreshed** (Ctrl+F5)

### Issue 3: Can't Delete Category
**Problem:** Delete button shows error

**Reasons:**
1. Category has child categories → Delete/move children first
2. Category has products → Reassign products to another category
3. Network error → Check database connection

**Solution:**
1. Go to Categories page
2. Check product count and children count
3. Reassign/delete as needed
4. Try delete again

### Issue 4: Drag and Drop Not Working
**Problem:** Can't drag categories

**Solutions:**
1. Make sure you're clicking the **grip handle** (☰)
2. Try clicking and holding for 1 second before dragging
3. Try with mouse (not trackpad)
4. Check if browser is supported (Chrome/Edge/Firefox)
5. Refresh page and try again

### Issue 5: Changes Lost After Refresh
**Problem:** Made changes but they're gone

**Reason:** Forgot to click "Save Changes"

**Solution:** Always click **"Save Changes"** before:
- Navigating away
- Closing tab
- Refreshing page

---

## 📱 Keyboard Shortcuts

Currently not implemented, but you can use:
- **Tab** - Navigate between elements
- **Enter** - Activate buttons
- **Esc** - Close dialogs
- **Space** - Can be used with keyboard navigation for drag-drop

---

## 🎓 Best Practices

### Organizing Categories
1. **Keep it shallow**: 2 levels is usually enough
2. **Balance breadth vs depth**: Better to have more top-level categories than deep nesting
3. **Use consistent naming**: All caps, title case, or sentence case
4. **Avoid duplicates**: Each category should be unique

### Menu Visibility
1. **Show only active categories**: Hide inactive or empty
2. **Seasonal adjustments**: Hide summer items in winter
3. **Test on mobile**: Long menus don't work on small screens
4. **Use featured wisely**: Don't mark everything as featured

### Maintenance
1. **Regular review**: Monthly check for empty categories
2. **Update product counts**: Keep track of what's selling
3. **Clean up old categories**: Archive or delete unused ones
4. **Document changes**: Note why categories were hidden

---

## 🔗 Related Pages

- **Categories List**: `/admin/categories` - Full CRUD operations
- **Products**: `/admin/products` - Assign categories to products
- **Frontend Menu**: `/` - See how customers see the menu

---

## 📞 Need Help?

If you encounter issues:
1. Check this guide first
2. Look at error messages in browser console (F12)
3. Verify database is running
4. Check the main documentation: `DRAGGABLE_CATEGORY_ORDERING_COMPLETE.md`

---

**Last Updated:** June 24, 2026
**Version:** 1.0
**Status:** Production Ready ✅
