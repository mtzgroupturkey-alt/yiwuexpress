# Admin Sidebar - Expandable Submenus Update

## Changes Made

### 1. Added Expandable/Collapsible Submenus

The admin sidebar now supports nested menu items with expand/collapse functionality:

- **Quotes** (expandable)
  - └─ View Quotes
  - └─ Approve/Reject

- **Shipments** (expandable)
  - └─ All Shipments
  - └─ Tracking

- **Settings** (expandable)
  - └─ General
  - └─ Company Info
  - └─ Email Config
  - └─ Permissions
  - └─ Backup & Export

### 2. Visual Features

#### Indentation
- Submenus are indented with proper spacing
- Left border line shows parent-child relationship
- Visual hierarchy is clear

#### Icons
- Each submenu item has its own icon
- Parent menu items have ChevronDown icon that rotates when expanded
- Active submenu items show a small dot indicator

#### Expand/Collapse Behavior
- Click on parent menu to toggle submenu visibility
- Smooth transition animation
- Auto-expands if current page is a submenu item
- State is preserved across navigation

#### Active States
- Parent menu highlights when any submenu is active
- Submenu items have distinct active state
- Gold accent color (#c9a84c) for active items

### 3. Technical Implementation

#### New State Management
```typescript
const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})
```

#### Data Structure
```typescript
interface NavItem {
  href: string
  label: string
  icon: any
  subItems?: NavItem[]  // Optional nested items
}
```

#### Auto-Expansion Logic
On mount, checks if current pathname matches any submenu item and auto-expands the parent:
```typescript
useEffect(() => {
  const initialExpanded: Record<string, boolean> = {}
  navItems.forEach(item => {
    if (item.subItems) {
      const isActive = item.subItems.some(sub => pathname.startsWith(sub.href))
      if (isActive) {
        initialExpanded[item.href] = true
      }
    }
  })
  setExpandedMenus(initialExpanded)
}, [])
```

### 4. New Icons Added

Imported additional Lucide icons for submenu items:
- `ChevronDown` - for expand/collapse indicator
- `Eye` - View Quotes
- `CheckCircle` - Approve/Reject
- `MapPin` - Tracking
- `Building` - Company Info
- `Sliders` - General Settings
- `Mail` - Email Config
- `Shield` - Permissions
- `Database` - Backup & Export

### 5. Styling Details

#### Parent Menu Items
- Same styling as before when collapsed
- ChevronDown icon replaces ChevronRight when has subItems
- Icon rotates 180° when expanded

#### Submenu Container
```css
ml-3        /* margin-left for overall indentation */
pl-6        /* padding-left for content */
border-l    /* left border to show hierarchy */
border-white/10  /* subtle border */
```

#### Submenu Items
- Smaller text (text-xs)
- Smaller icons (14px)
- More subtle colors (white/50 when inactive)
- Gold dot indicator when active
- Hover effect with lighter background

### 6. Responsive Behavior

#### When Sidebar is Collapsed
- Submenus are hidden
- Only parent icons are visible
- No expand/collapse functionality (prevents UI clutter)

#### When Sidebar is Open
- Full menu hierarchy is visible
- Smooth expand/collapse animations
- Clear visual hierarchy

### 7. User Experience Improvements

1. **Intuitive Navigation**: Clear parent-child relationships
2. **Context Awareness**: Auto-expands to show current location
3. **Visual Feedback**: 
   - Hover effects on all clickable items
   - Active states clearly visible
   - Smooth transitions
4. **Space Efficient**: Collapsed state saves space while maintaining functionality
5. **Scrollable**: Overflow scroll if menu gets too long

## Usage

### For Users
1. Click on a parent menu item (Quotes, Shipments, Settings) to expand/collapse
2. Click on submenu items to navigate
3. Current page is highlighted with gold accent
4. Menu automatically expands to show your current location

### For Developers

#### Adding New Submenu
```typescript
{ 
  href: '/admin/reports', 
  label: 'Reports', 
  icon: BarChart,
  subItems: [
    { href: '/admin/reports/sales', label: 'Sales Report', icon: DollarSign },
    { href: '/admin/reports/analytics', label: 'Analytics', icon: TrendingUp },
  ]
}
```

#### Adding New Top-Level Menu
```typescript
{ href: '/admin/customers', label: 'Customers', icon: Users }
```

## File Modified

- `web/app/admin/layout.tsx`

## Testing Checklist

- [x] Submenus expand/collapse on click
- [x] Auto-expands when navigating to submenu page
- [x] Active states work correctly
- [x] Icons display properly
- [x] Indentation is correct
- [x] Animations are smooth
- [x] Works when sidebar is collapsed
- [x] Scrolling works when menu is long
- [x] No TypeScript errors
- [x] No console errors

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Opera

## Performance

- Minimal re-renders (state updates are optimized)
- Smooth CSS transitions (hardware accelerated)
- No performance impact on navigation

## Future Enhancements

Potential improvements for later:
1. Remember expanded/collapsed state in localStorage
2. Add tooltips when sidebar is collapsed
3. Add keyboard navigation support
4. Add search/filter functionality for menu items
5. Badge indicators for notifications/counts
