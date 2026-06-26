# Visual Reference: Category Menu System

## Frontend Menu Bar (Expected Result)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  YIWU EXPRESS                                       🔍 Search   🛒 Cart  │
├─────────────────────────────────────────────────────────────────────────┤
│  [CLOTHING ▾] [BAKEWARE ▾] [COOKWARE ▾] [ELECTRONICS] [HOME GOODS] ... │
└─────────────────────────────────────────────────────────────────────────┘
     │
     └─► Hover shows dropdown:
         ┌──────────────────────┐
         │ Man                  │
         │ women                │
         │ Boys                 │
         └──────────────────────┘
```

### Menu Structure Visualization

```
MAIN MENU BAR (Blue Background)
├─ CLOTHING ▾ (Dropdown - 3 items)
│  ├─ Man → /products?category=man
│  ├─ women → /products?category=women
│  └─ Boys → /products?category=boys
│
├─ BAKEWARE ▾ (Dropdown - 4 items)
│  ├─ Cast Iron Dutch Ovens → /products?category=cast-iron-dutch-ovens
│  ├─ Cake Pans → /products?category=cake-pans
│  ├─ Muffin & Cupcake Pans → /products?category=muffin-cupcake-pans
│  └─ Baking Trays & Sheets → /products?category=baking-trays-sheets
│
├─ COOKWARE ▾ (Dropdown - 5 items)
│  ├─ Cast Iron Cookware → /products?category=cast-iron-cookware
│  ├─ Non-Stick Cookware → /products?category=non-stick-cookware
│  ├─ Sauce Pans → /products?category=sauce-pans
│  ├─ Stainless Steel Cookware → /products?category=stainless-steel-cookware
│  └─ Stock Pots → /products?category=stock-pots
│
├─ ELECTRONICS → /products?category=electronics (Direct Link)
│
├─ HOME GOODS → /products?category=home-goods (Direct Link)
│
├─ KITCHEN APPLIANCES ▾ (Dropdown - 3 items)
│  ├─ Blenders & Mixers → /products?category=blenders-mixers
│  ├─ Coffee Makers → /products?category=coffee-makers
│  └─ Electric Kettles → /products?category=electric-kettles
│
├─ KITCHEN UTENSILS ▾ (Dropdown - 3 items)
│  ├─ Measuring Cups & Spoons → /products?category=measuring-cups-spoons
│  ├─ Spatulas & Turners → /products?category=spatulas-turners
│  └─ Whisks & Mixers → /products?category=whisks-mixers
│
├─ STORAGE & ORGANIZATION → /products?category=storage-organization (Direct Link)
│
└─ TABLEWARE ▾ (Dropdown - 3 items)
   ├─ Bowls & Plates → /products?category=bowls-plates
   ├─ Cups & Mugs → /products?category=cups-mugs
   └─ Dinner Sets → /products?category=dinner-sets
```

---

## Admin Menu Manager (Expected Interface)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Category Menu Manager                      [Refresh] [Add] [Save]   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Drag and drop to reorder categories                                 │
│                                                                        │
│  ⋮⋮ ▾  CLOTHING          (1 products)  👁 ✎ 🗑                       │
│      ⋮⋮    Man           (0 products)  👁 ✎ 🗑                       │
│      ⋮⋮    women         (0 products)  👁 ✎ 🗑                       │
│      ⋮⋮    Boys          (0 products)  👁 ✎ 🗑                       │
│                                                                        │
│  ⋮⋮ ▾  BAKEWARE          (0 products)  👁 ✎ 🗑                       │
│      ⋮⋮    Cast Iron Dutch Ovens  (1 products)  👁 ✎ 🗑             │
│      ⋮⋮    Cake Pans              (1 products)  👁 ✎ 🗑             │
│      ⋮⋮    Muffin & Cupcake Pans  (1 products)  👁 ✎ 🗑             │
│      ⋮⋮    Baking Trays & Sheets  (1 products)  👁 ✎ 🗑             │
│                                                                        │
│  ⋮⋮ ▾  COOKWARE          (0 products)  👁 ✎ 🗑                       │
│      ⋮⋮    Cast Iron Cookware      (1 products)  👁 ✎ 🗑             │
│      ⋮⋮    Non-Stick Cookware      (2 products)  👁 ✎ 🗑             │
│      ⋮⋮    Sauce Pans              (1 products)  👁 ✎ 🗑             │
│      ⋮⋮    Stainless Steel Cookware (1 products) 👁 ✎ 🗑            │
│      ⋮⋮    Stock Pots              (1 products)  👁 ✎ 🗑             │
│                                                                        │
│  ⋮⋮    ELECTRONICS       (3 products)  👁 ✎ 🗑                       │
│                                                                        │
│  ⋮⋮    HOME GOODS        (1 products)  👁 ✎ 🗑                       │
│                                                                        │
│  ... (4 more categories)                                              │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘

Legend:
⋮⋮ = Drag handle
▾  = Expanded (click to collapse)
▸  = Collapsed (click to expand)
👁 = Show in menu (blue = visible, gray = hidden)
✎  = Edit category
🗑 = Delete category
```

---

## Interaction Behaviors

### Frontend Menu:

| Category Type | Has Children? | On Click | On Hover |
|--------------|---------------|----------|----------|
| CLOTHING | Yes (3) | Nothing | Show dropdown |
| BAKEWARE | Yes (4) | Nothing | Show dropdown |
| COOKWARE | Yes (5) | Nothing | Show dropdown |
| ELECTRONICS | No | Navigate to /products?category=electronics | Nothing |
| HOME GOODS | No | Navigate to /products?category=home-goods | Nothing |

### Admin Manager:

| Action | Behavior |
|--------|----------|
| Drag ⋮⋮ on root category | Reorder among root categories |
| Drag ⋮⋮ on subcategory | Reorder among siblings (within same parent) |
| Click ▾ | Collapse category (hide children) |
| Click ▸ | Expand category (show children) |
| Click 👁 (blue) | Hide from menu (turns gray) |
| Click 👁 (gray) | Show in menu (turns blue) |
| Click ✎ | Edit category (coming soon) |
| Click 🗑 | Delete category (with confirmation) |
| Click [Save Changes] | Persist all changes to database |

---

## Dropdown Style Reference

```css
/* White dropdown that appears on hover */
Position: Absolute, below menu item
Background: White (#FFFFFF)
Shadow: Large shadow (shadow-lg)
Border Radius: Rounded bottom (rounded-b-lg)
Padding: 1rem (p-4)
Min Width: 220px
Z-Index: 50 (appears above other content)

/* Each subcategory link */
Color: Gray-600 (#4B5563)
Hover Color: Primary Blue (#1a3a5c)
Hover Background: Light gray (#F9FAFB)
Font Size: Small (text-sm)
Padding: 0.5rem 0.75rem (py-2 px-3)
Border Radius: Rounded

/* Product count badge */
Color: Gray-400 (#9CA3AF)
Font Size: Extra small (text-xs)
Margin Left: 0.5rem (ml-2)
```

---

## Browser Console Expected Output

When visiting http://localhost:3000, you should see:

```
API Response: {success: true, categories: Array(32), count: 32}
Category Clothing: isParent=true, isActive=true, showInMenu=true
Category Bakeware: isParent=true, isActive=true, showInMenu=true
Category Cookware: isParent=true, isActive=true, showInMenu=true
Category Electronics: isParent=true, isActive=true, showInMenu=true
Category Home Goods: isParent=true, isActive=true, showInMenu=true
Category Kitchen Appliances: isParent=true, isActive=true, showInMenu=true
Category Kitchen Utensils: isParent=true, isActive=true, showInMenu=true
Category Storage & Organization: isParent=true, isActive=true, showInMenu=true
Category Tableware: isParent=true, isActive=true, showInMenu=true
Parent categories: 9
Category CLOTHING has 3 children
Category BAKEWARE has 4 children
Category COOKWARE has 5 children
Category ELECTRONICS has 0 children
Category HOME GOODS has 0 children
Category KITCHEN APPLIANCES has 3 children
Category KITCHEN UTENSILS has 3 children
Category STORAGE & ORGANIZATION has 0 children
Category TABLEWARE has 3 children
Final categories with children: Array(9)
```

---

## Colors Reference

| Element | Color | Hex Code |
|---------|-------|----------|
| Menu Bar Background | Navy Blue | #1a3a5c |
| Menu Text | White | #FFFFFF |
| Menu Hover Border | Gold/Accent | #c9a84c |
| Dropdown Background | White | #FFFFFF |
| Dropdown Text | Gray | #4B5563 |
| Dropdown Hover | Light Gray | #F9FAFB |
| Dropdown Hover Text | Navy Blue | #1a3a5c |
| Badge Text | Light Gray | #9CA3AF |

---

## Expected User Flow

### Customer Journey:
1. Visit homepage
2. See 9 categories in blue menu bar
3. Hover over "COOKWARE"
4. See dropdown with 5 subcategories
5. Click "Non-Stick Cookware"
6. Navigate to products page filtered by that category

### Admin Journey:
1. Visit /admin/categories/menu
2. See all categories in tree structure
3. Drag "ELECTRONICS" to top position
4. Drag "Electric Kettles" above "Blenders & Mixers" within "KITCHEN APPLIANCES"
5. Click "Save Changes"
6. Visit homepage
7. See "ELECTRONICS" first in menu
8. Hover "KITCHEN APPLIANCES"
9. See "Electric Kettles" first in dropdown

---

**This visual reference should match the actual implementation after testing.**
