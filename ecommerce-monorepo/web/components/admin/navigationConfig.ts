import React from 'react'
import {
  LayoutDashboard, ShoppingCart, Warehouse, Truck, Store,
  DollarSign, Users, Package, CreditCard, Settings,
  Globe, FileText, Factory, RotateCcw,
  ArrowLeftRight, AlertTriangle, Ship, UserCheck, ShoppingBag,
  MessageSquare, Building2, User, FolderTree, Tag, Star,
  PieChart, ArrowUpCircle, ArrowDownCircle, TrendingUp, Image as ImageIcon,
  Building, Globe2, Shield, BarChart3, Server, Bell, Sparkles, Zap, LucideIcon, Search, UtensilsCrossed, Tv, Bot, Cpu, Brain, Megaphone
} from 'lucide-react'

export interface NavItem {
  label: string
  translationKey: string
  href: string
  icon?: LucideIcon
  badgeKey?: 'pendingOrders' | 'pendingQuotes' | 'lowStock' | 'newInquiries'
  children?: NavItem[]
}

export interface NavGroup {
  id: string
  label: string
  translationKey: string
  icon: LucideIcon
  items: NavItem[]
}

export const navigationConfig: NavGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    translationKey: 'dashboard',
    icon: LayoutDashboard,
    items: [
      { label: 'Home', translationKey: 'home', href: '/admin', icon: LayoutDashboard },
      { label: 'AI Assistant', translationKey: 'aiAssistant', href: '/admin/ai-assistant', icon: Sparkles },
      { label: 'Reports', translationKey: 'reports', href: '/admin/reports/sales', icon: BarChart3 },
    ]
  },
  {
    id: 'products',
    label: 'Products',
    translationKey: 'products',
    icon: Package,
    items: [
      { label: 'All Products', translationKey: 'allProducts', href: '/admin/products', icon: Package },
      { label: 'Categories', translationKey: 'categories', href: '/admin/categories', icon: FolderTree },
      { label: 'Attributes', translationKey: 'attributes', href: '/admin/attributes', icon: Tag },
      { label: 'Delivery & Badges', translationKey: 'productBadges', href: '/admin/products/badges', icon: Shield },
      { label: 'Reviews', translationKey: 'reviews', href: '/admin/reviews', icon: Star },
    ]
  },
  {
    id: 'buying',
    label: 'Buying',
    translationKey: 'buying',
    icon: ShoppingCart,
    items: [
      { label: 'Purchase Orders', translationKey: 'purchaseOrders', href: '/admin/purchase-orders', icon: FileText },
      { label: 'Suppliers', translationKey: 'suppliers', href: '/admin/suppliers', icon: Factory },
      { label: 'Returns to Supplier', translationKey: 'returnsToSupplier', href: '/admin/returns-to-supplier', icon: RotateCcw },
    ]
  },
  {
    id: 'selling',
    label: 'Selling',
    translationKey: 'selling',
    icon: DollarSign,
    items: [
      { label: 'Orders', translationKey: 'orders', href: '/admin/orders', icon: ShoppingBag, badgeKey: 'pendingOrders' },
      { label: 'Wholesale Inquiries', translationKey: 'wholesaleInquiries', href: '/admin/wholesale', icon: MessageSquare, badgeKey: 'newInquiries' },
      { label: 'Quotes', translationKey: 'quotes', href: '/admin/quotes', icon: FileText, badgeKey: 'pendingQuotes' },
      { label: 'Returns', translationKey: 'returns', href: '/admin/returns', icon: RotateCcw },
    ]
  },
  {
    id: 'warehouses',
    label: 'Warehouses',
    translationKey: 'warehouses',
    icon: Warehouse,
    items: [
      { label: 'China Warehouse', translationKey: 'chinaWarehouse', href: '/admin/inventory?warehouse=cn', icon: Globe },
      { label: 'Belarus Warehouse', translationKey: 'belarusWarehouse', href: '/admin/inventory?warehouse=by', icon: Globe },
      { label: 'Stock Transfers', translationKey: 'stockTransfers', href: '/admin/stock-transfers', icon: ArrowLeftRight },
      { label: 'Low Stock Alerts', translationKey: 'lowStockAlerts', href: '/admin/inventory/alerts', icon: AlertTriangle, badgeKey: 'lowStock' },
    ]
  },
  {
    id: 'shipping',
    label: 'Shipping',
    translationKey: 'shipping',
    icon: Truck,
    items: [
      { label: 'Containers', translationKey: 'containers', href: '/admin/containers', icon: Package },
      { label: 'Logistics Center', translationKey: 'logisticsOverview', href: '/admin/logistics/overview', icon: Ship },
      { label: 'Shipping Agents', translationKey: 'shippingAgents', href: '/admin/agents', icon: UserCheck },
      { label: 'Carriers', translationKey: 'carriers', href: '/admin/carriers', icon: Truck },
    ]
  },
  {
    id: 'money',
    label: 'Money',
    translationKey: 'money',
    icon: CreditCard,
    items: [
      { label: 'Overview', translationKey: 'overview', href: '/admin/finance/overview', icon: PieChart },
      { label: 'Accounts Payable', translationKey: 'accountsPayable', href: '/admin/finance/accounts-payable', icon: ArrowUpCircle },
      { label: 'Accounts Receivable', translationKey: 'accountsReceivable', href: '/admin/finance/accounts-receivable', icon: ArrowDownCircle },
      { label: 'Profit & Loss', translationKey: 'profitLoss', href: '/admin/finance/profit-loss', icon: TrendingUp },
    ]
  },
  {
    id: 'customers',
    label: 'Customer Hub',
    translationKey: 'customers',
    icon: Users,
    items: [
      { label: 'All Customers', translationKey: 'allCustomers', href: '/admin/customers', icon: Users },
      { label: 'B2B Customers', translationKey: 'b2bCustomers', href: '/admin/customers?type=b2b', icon: Building2 },
      { label: 'B2C Customers', translationKey: 'b2cCustomers', href: '/admin/customers?type=b2c', icon: User },
    ]
  },
  {
    id: 'website',
    label: 'Website',
    translationKey: 'website',
    icon: Globe,
    items: [
      { label: 'Hero Slider', translationKey: 'heroSlider', href: '/admin/settings/hero-slider', icon: ImageIcon },
      { label: 'Featured Products', translationKey: 'featuredProducts', href: '/admin/settings/featured-products', icon: Star },
      { label: 'Flash & Seasonal Deals', translationKey: 'flashDeals', href: '/admin/settings/flash-sales', icon: Zap },
      { label: 'Kitchen & Dining Block', translationKey: 'kitchenSection', href: '/admin/settings/kitchen-section', icon: UtensilsCrossed },
      { label: 'Electronics & Appliances Block', translationKey: 'electronicsSection', href: '/admin/settings/electronics-section', icon: Tv },
      { label: 'Homepage Ads & Banners', translationKey: 'adsManager', href: '/admin/settings/ads-manager', icon: Megaphone },
      { label: 'Push Notifications', translationKey: 'notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Content Pages', translationKey: 'contentPages', href: '/admin/content/pages', icon: FileText },
      { label: 'Testimonials', translationKey: 'testimonials', href: '/admin/testimonials', icon: Star },
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    translationKey: 'settings',
    icon: Settings,
    items: [
      { label: 'Store Mode & Sales', translationKey: 'storeMode', href: '/admin/settings/general', icon: Store },
      { label: 'Company Info', translationKey: 'companyInfo', href: '/admin/settings/company', icon: Building },
      { label: 'Warehouses', translationKey: 'warehouses', href: '/admin/settings/warehouses', icon: Warehouse },
      { label: 'Countries', translationKey: 'countries', href: '/admin/countries', icon: Globe2 },
      { label: 'Currencies', translationKey: 'currencies', href: '/admin/currencies', icon: DollarSign },
      { label: 'Shipping Methods', translationKey: 'shippingMethods', href: '/admin/settings/shipping-methods', icon: Truck },
      { label: 'Users', translationKey: 'users', href: '/admin/users', icon: Users },
      { label: 'Roles & Permissions', translationKey: 'usersPermissions', href: '/admin/settings/permissions', icon: Shield },
      { label: 'System', translationKey: 'system', href: '/admin/settings/system', icon: Settings },
      { label: 'Deployment', translationKey: 'deployment', href: '/admin/deployment', icon: Server },
      { label: 'Image Migration', translationKey: 'imageMigration', href: '/admin/tools/images', icon: ImageIcon },
      { label: 'Image Finder', translationKey: 'imageFinder', href: '/admin/tools/image-finder', icon: Search },
    ]
  },
  {
    id: 'autopilot',
    label: 'Auto-Pilot',
    translationKey: 'autopilot',
    icon: Bot,
    items: [
      { label: 'Neural Cockpit (The Brain)', translationKey: 'neuralCockpit', href: '/admin/autopilot/orb', icon: Brain },
      { label: 'Classic Cockpit', translationKey: 'classicCockpit', href: '/admin/autopilot/classic', icon: Cpu },
      { label: 'Approvals Inbox', translationKey: 'approvals', href: '/admin/autopilot/approvals', icon: Bell },
      { label: 'Predictions & Radar', translationKey: 'predictions', href: '/admin/autopilot/predictions', icon: TrendingUp },
      { label: 'Insights & Retrospective', translationKey: 'insights', href: '/admin/autopilot/insights', icon: Sparkles },
      { label: 'Policy Rules', translationKey: 'policies', href: '/admin/autopilot/policies', icon: Shield },
      { label: 'Audit Trail', translationKey: 'audit', href: '/admin/autopilot/audit', icon: FileText },
      { label: 'System Settings', translationKey: 'settings', href: '/admin/autopilot/settings', icon: Settings },
    ]
  },
]

// Backward-compatibility flattening for AdminHeader command palette & search
export interface FlatAdminNavItem {
  href: string
  label: string
  key: string
  icon: LucideIcon
}

export const ADMIN_NAV_ITEMS: FlatAdminNavItem[] = navigationConfig.flatMap(group => 
  group.items.map(item => ({
    href: item.href,
    label: item.label,
    key: item.translationKey,
    icon: item.icon || group.icon
  }))
)

export function isItemActive(
  itemHref: string,
  pathname: string,
  searchParams?: { get: (name: string) => string | null } | null
): boolean {
  const [itemPath, itemQuery] = itemHref.split('?')

  if (itemQuery) {
    if (pathname !== itemPath) return false
    if (!searchParams) return false
    const expectedParams = new URLSearchParams(itemQuery)
    for (const [key, val] of expectedParams.entries()) {
      const currentVal = searchParams.get(key)
      if (!currentVal || currentVal.toLowerCase() !== val.toLowerCase()) {
        return false
      }
    }
    return true
  }

  // If item has NO query parameters
  if (pathname === itemPath) {
    if (searchParams) {
      if (itemPath === '/admin/inventory' && (searchParams.get('warehouse') || searchParams.get('warehouseId'))) {
        return false
      }
      if (itemPath === '/admin/customers' && searchParams.get('type')) {
        return false
      }
    }
    return true
  }

  // Prefix matching for nested routes (e.g. /admin/products/123 -> /admin/products),
  // ensuring boundary match (with slash) and not matching parent if a more specific sibling exists
  if (itemPath !== '/admin' && (pathname === itemPath || pathname.startsWith(`${itemPath}/`))) {
    // If there is another navigation item whose path is longer and also matches the pathname, don't activate this shorter one
    const hasMoreSpecificSibling = ADMIN_NAV_ITEMS.some(nav => {
      const p = nav.href.split('?')[0]
      return p !== itemPath && p.startsWith(itemPath) && (pathname === p || pathname.startsWith(`${p}/`))
    })
    if (!hasMoreSpecificSibling) {
      return true
    }
  }

  return false
}

