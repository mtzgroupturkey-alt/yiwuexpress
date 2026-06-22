# Permissions System - Hierarchical Menu Structure

## Overview
The permissions system now supports hierarchical menu structure with parent menus and submenus, providing granular control over access rights.

## Visual Structure

```
┌─────────────────────────────┬──────┬────────┬──────┬────────┐
│ Resource                     │ View │ Create │ Edit │ Delete │
│                              │ [✓]  │  [✓]   │ [✓]  │  [✓]   │ ← Select All
├─────────────────────────────┼──────┼────────┼──────┼────────┤
│ Dashboard                    │ [✓]  │  [ ]   │ [ ]  │  [ ]   │
│ Users Management             │ [✓]  │  [✓]   │ [✓]  │  [ ]   │
│ Services                     │ [✓]  │  [✓]   │ [✓]  │  [ ]   │
├─────────────────────────────┼──────┼────────┼──────┼────────┤
│ 📂 Quotes Management         │ [✓]  │  [✓]   │ [✓]  │  [ ]   │ ← Parent (controls all below)
│    └─ View Quotes            │ [✓]  │  [✓]   │ [✓]  │  [ ]   │ ← Submenu (indented)
│    └─ Approve/Reject Quotes  │ [ ]  │  [ ]   │ [ ]  │  [ ]   │ ← Submenu
├─────────────────────────────┼──────┼────────┼──────┼────────┤
│ 📂 Shipments                 │ [✓]  │  [✓]   │ [✓]  │  [ ]   │ ← Parent
│    └─ Tracking Management    │ [✓]  │  [✓]   │ [✓]  │  [ ]   │ ← Submenu
├─────────────────────────────┼──────┼────────┼──────┼────────┤
│ 📂 System Settings           │ [✓]  │  [ ]   │ [✓]  │  [ ]   │ ← Parent
│    └─ Company Info           │ [✓]  │  [ ]   │ [✓]  │  [ ]   │ ← Submenu
│    └─ General Settings       │ [✓]  │  [ ]   │ [✓]  │  [ ]   │ ← Submenu
│    └─ Email Configuration    │ [✓]  │  [ ]   │ [ ]  │  [ ]   │ ← Submenu
├─────────────────────────────┼──────┼────────┼──────┼────────┤
│ Permissions                  │ [ ]  │  [ ]   │ [ ]  │  [ ]   │
│ Backup & Export              │ [✓]  │  [✓]   │ [ ]  │  [ ]   │
└─────────────────────────────┴──────┴────────┴──────┴────────┘
```

## Menu Hierarchy

### Level 0 - Main Menus (No Indent)
- **Dashboard** - Single menu, no children
- **Users Management** - Single menu, no children
- **Services** - Single menu, no children

### Level 0 - Parent Menus (Bold, Purple Background)
- **Quotes Management** 📂
  - Controls all quote-related submenus
  - Checking parent checkbox = check all children
  - Unchecking parent checkbox = uncheck all children

- **Shipments** 📂
  - Controls all shipment-related submenus

- **System Settings** 📂
  - Controls all settings-related submenus

### Level 1 - Submenus (Indented with "└─")
Under **Quotes Management**:
- └─ View Quotes
- └─ Approve/Reject Quotes

Under **Shipments**:
- └─ Tracking Management

Under **System Settings**:
- └─ Company Info
- └─ General Settings
- └─ Email Configuration

## Features

### 1. Visual Hierarchy
- **Parent menus** are displayed with purple background and bold text
- **Submenus** are indented with "└─" tree symbol
- Clear visual distinction between menu levels

### 2. Bulk Parent Control
- Click any checkbox on a **parent menu row** → toggles all its children
- If all children are checked → parent shows checked
- If any child is unchecked → parent shows unchecked
- Makes it easy to grant/revoke access to entire sections

### 3. Individual Submenu Control
- Each submenu can still be controlled individually
- Allows fine-grained permissions (e.g., "View Quotes" yes, "Approve Quotes" no)

### 4. Select All Column Headers
- Each column (View/Create/Edit/Delete) has a select-all checkbox
- Toggles all resources in that column at once
- Works across both parent and submenu items

## Permission Structure

### Resource Keys
```typescript
// Main menus (level 0)
'dashboard'
'users'
'services'
'permissions'
'backup'

// Parent menus with children (level 0)
'quotes'           // Parent
'shipments'        // Parent
'settings'         // Parent

// Submenus (level 1)
'quotes_view'              // parent: 'quotes'
'quotes_approve'           // parent: 'quotes'
'shipments_tracking'       // parent: 'shipments'
'settings_company'         // parent: 'settings'
'settings_general'         // parent: 'settings'
'settings_email'           // parent: 'settings'
```

## Default Role Permissions

### Administrator
✅ Full access to all menus and submenus

### Manager
✅ All quotes (including approval)  
✅ All shipments  
✅ Settings (except email config)  
❌ Permissions management

### Staff
✅ View and create quotes  
❌ Approve/reject quotes  
✅ Shipments and tracking  
❌ Settings, permissions, backup

### Viewer
✅ Read-only access to main sections  
❌ No approval or settings access

## Usage Examples

### Grant Full Quotes Access
1. Open role/user permission modal
2. Find "Quotes Management" (purple row)
3. Check "View" on parent row
4. All submenus automatically get "View" permission

### Grant Selective Quote Access
1. Check "View" on "View Quotes" submenu
2. Leave "Approve/Reject Quotes" unchecked
3. User can see quotes but not approve them

### Quick Setup - Manager Role
1. Check all on "Quotes Management" parent
2. Check all on "Shipments" parent
3. Check "View" + "Edit" on "System Settings" parent
4. Uncheck "Email Configuration" submenu individually

## Technical Implementation

### Parent Toggle Logic
```typescript
// Toggles parent + all children
toggleParentPermissions(parentKey, type) {
  - Find all child resources where parent === parentKey
  - Create array of [parent, ...children]
  - Check if all are currently checked
  - Toggle all to opposite state
}
```

### Parent Checked State
```typescript
// Returns true only if parent + ALL children are checked
isParentChecked(parentKey, type) {
  - Find all child resources
  - Include parent in check
  - Return true if every one is checked
}
```

## Benefits

1. **Easier Permission Management**
   - One click to control entire sections
   - Clear visual hierarchy

2. **Fine-Grained Control**
   - Can still override individual submenus
   - Flexible for different user needs

3. **Better Organization**
   - Related permissions grouped together
   - Easier to understand access levels

4. **Scalable Structure**
   - Easy to add new submenus
   - Can nest deeper if needed

## Adding New Menus

### To add a new parent menu with submenus:
```typescript
// In RESOURCES array
{ key: 'reports', label: 'Reports', level: 0 },
{ key: 'reports_sales', label: 'Sales Reports', level: 1, parent: 'reports' },
{ key: 'reports_analytics', label: 'Analytics', level: 1, parent: 'reports' },
```

### To add a submenu to existing parent:
```typescript
{ key: 'quotes_export', label: 'Export Quotes', level: 1, parent: 'quotes' },
```

The system automatically:
- Detects parent relationships
- Applies proper styling
- Enables bulk toggle functionality
- Displays hierarchy visually
