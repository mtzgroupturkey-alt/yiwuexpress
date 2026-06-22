# Admin Sidebar - Visual Guide

## New Sidebar Structure

### Expanded View (Default)

```
╔════════════════════════════════════════╗
║  🌐 YIWU EXPRESS              ✕       ║
╠════════════════════════════════════════╣
║         🏆 ADMIN PANEL                 ║
╠════════════════════════════════════════╣
║                                        ║
║  📊 Dashboard                    →     ║
║                                        ║
║  📦 Services                           ║
║                                        ║
║  📄 Quotes                       ▼     ║ ← Click to expand
║    ├─ 👁️ View Quotes             •    ║ ← Active submenu (gold dot)
║    └─ ✓ Approve/Reject                ║
║                                        ║
║  🚢 Shipments                    ▼     ║
║    ├─ 🚢 All Shipments                ║
║    └─ 📍 Tracking                     ║
║                                        ║
║  👥 Users                              ║
║                                        ║
║  ⚙️ Settings                      ▼     ║
║    ├─ 🎚️ General                      ║
║    ├─ 🏢 Company Info                 ║
║    ├─ 📧 Email Config                 ║
║    ├─ 🛡️ Permissions                  ║
║    └─ 💾 Backup & Export              ║
║                                        ║
╠════════════════════════════════════════╣
║  🚪 Logout                             ║
╚════════════════════════════════════════╝
```

### Collapsed View

```
╔═══════╗
║ 🌐 ☰  ║
╠═══════╣
║       ║
║  📊   ║
║       ║
║  📦   ║
║       ║
║  📄   ║ ← Submenus hidden when collapsed
║       ║
║  🚢   ║
║       ║
║  👥   ║
║       ║
║  ⚙️   ║
║       ║
╠═══════╣
║  🚪   ║
╚═══════╝
```

## Visual States

### 1. Collapsed Parent Menu (Not Active)
```
║  📄 Quotes                       ▶     ║
   ↑                                ↑
   Icon                      Chevron Right
   (white/60%)                (collapsed)
```

### 2. Expanded Parent Menu (Active)
```
║  📄 Quotes                       ▼     ║
   ↑                                ↑
   Icon (gold)              Chevron Down
                             (rotated 180°)
```

### 3. Active Submenu Item
```
║    ├─ 👁️ View Quotes             •    ║
       ↑                            ↑
    Icon (gold)              Active dot
                             (gold circle)
```

### 4. Inactive Submenu Item
```
║    └─ ✓ Approve/Reject                ║
       ↑
    Icon (white/50%)
```

### 5. Submenu Indentation
```
║  📄 Quotes                       ▼     ║ ← Parent (no indent)
║    ├─ 👁️ View Quotes                  ║ ← ml-3 + pl-6 = ~36px indent
       ↑
    Left border (border-white/10)
    shows parent-child relationship
```

## Color Scheme

### Background Colors
- **Sidebar**: Gradient from #0f2238 → #1a3a5c → #0f2238
- **Active Parent**: rgba(201, 168, 76, 0.2) with border
- **Active Submenu**: rgba(255, 255, 255, 0.1)
- **Hover**: rgba(255, 255, 255, 0.1) or 0.05

### Text Colors
- **Active**: white (100%)
- **Inactive Parent**: white/60%
- **Inactive Submenu**: white/50%
- **Hover**: white/80%

### Accent Color
- **Gold**: #c9a84c (used for icons, dots, borders)

## Interactive Behaviors

### 1. Click on Parent Menu (with submenus)
```
Before:                      After:
║  📄 Quotes          ▶   →   ║  📄 Quotes          ▼  
                                ║    ├─ 👁️ View Quotes
                                ║    └─ ✓ Approve/Reject
```

### 2. Click on Parent Menu Again (to collapse)
```
Before:                      After:
║  📄 Quotes          ▼   →   ║  📄 Quotes          ▶
║    ├─ 👁️ View Quotes
║    └─ ✓ Approve/Reject
```

### 3. Click on Submenu Item
```
Navigation to that page
+ Gold dot appears next to item
+ Parent remains expanded
```

### 4. Navigate to Submenu Page Directly
```
On page load:
- Parent menu auto-expands
- Active submenu shows gold dot
- Parent menu highlights in gold
```

### 5. Hover Effects
```
Parent (inactive):           Parent (active):
white/60% → white           Already white + gold icon
bg-transparent → bg-white/10 Already has gold background

Submenu (inactive):         Submenu (active):
white/50% → white/80%       Already white + gold icon
bg-transparent → bg-white/5  Already has white/10 background
```

## Spacing & Dimensions

### Sidebar Width
- **Expanded**: 256px (w-64)
- **Collapsed**: 80px (w-20)
- **Transition**: 300ms ease-in-out

### Menu Item Heights
- **Parent**: py-2.5 (10px top/bottom) + icon 20px
- **Submenu**: py-2 (8px top/bottom) + icon 14px

### Icon Sizes
- **Parent**: 20px
- **Submenu**: 14px
- **Chevron**: 14px
- **Active Dot**: 6px (w-1.5 h-1.5)

### Spacing
- **Parent to Submenu**: mt-1 (4px)
- **Between Submenu Items**: space-y-1 (4px)
- **Left Indent**: ml-3 (12px) + pl-6 (24px) = 36px total

### Border
- **Submenu Left Border**: 1px solid white/10
- **Active Parent Border**: 1px solid rgba(201, 168, 76, 0.3)

## Animation Details

### Expand/Collapse Transition
```css
transition-all duration-300 ease-in-out
```

### Chevron Rotation
```css
transition-transform
rotate-180 (when expanded)
```

### Hover Scale (Parent Icons)
```css
group-hover:scale-110 transition-transform
```

## Accessibility Features

### Keyboard Navigation
- Tab through menu items
- Enter to activate/expand
- Arrow keys for navigation (future enhancement)

### Screen Readers
- All links have descriptive labels
- Icons are decorative (not read)
- Clear hierarchy with proper nesting

### Visual Indicators
- Multiple cues for active state:
  - Gold color
  - Background highlight
  - Active dot
  - Icon color change

## Mobile Responsive

### Tablet (< 1024px)
- Sidebar remains functional
- May want to add auto-collapse on small screens

### Mobile (< 768px)
- Consider overlay sidebar instead of fixed
- Collapse by default
- Show hamburger menu

## Code Snippet Examples

### Adding a New Submenu Section
```typescript
{ 
  href: '/admin/analytics', 
  label: 'Analytics', 
  icon: TrendingUp,
  subItems: [
    { href: '/admin/analytics/overview', label: 'Overview', icon: BarChart },
    { href: '/admin/analytics/reports', label: 'Reports', icon: FileText },
    { href: '/admin/analytics/export', label: 'Export Data', icon: Download },
  ]
}
```

### Check if Menu is Expanded
```typescript
const isExpanded = expandedMenus[item.href]
```

### Toggle Menu Programmatically
```typescript
setExpandedMenus(prev => ({
  ...prev,
  ['/admin/quotes']: true  // Expand Quotes menu
}))
```

## Quick Reference

| Feature | Implementation |
|---------|----------------|
| Expand/Collapse | Click parent menu |
| Auto-expand | On page load if submenu is active |
| Active indicator | Gold icon + background + dot |
| Submenu indent | ml-3 + pl-6 + border-l |
| Icon rotation | ChevronDown with rotate-180 |
| Smooth animation | transition-all duration-300 |
| Scrollable | overflow-y-auto with maxHeight |
| Collapsed behavior | Hide submenus completely |

## Testing Checklist

✅ Parent menus expand on click
✅ Parent menus collapse on second click
✅ Auto-expands when on submenu page
✅ Submenu items navigate correctly
✅ Active states show correctly
✅ Hover effects work
✅ Icons display properly
✅ Animations are smooth
✅ Collapsed sidebar hides submenus
✅ No layout shifts on expand/collapse
✅ Scrollbar appears when needed
✅ No console errors
✅ No TypeScript errors
