'use client'

import React, { useState, useMemo } from 'react'
import * as LucideIcons from 'lucide-react'
import {
  Search, X, Check, ChevronDown, ChevronUp,
  Folder
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export interface CategoryIconMeta {
  name: string
  label: string
  category: 'kitchen' | 'appliances' | 'furniture' | 'hardware' | 'fashion' | 'retail'
  keywords: string[]
}

export const CATEGORY_ICONS_LIST: CategoryIconMeta[] = [
  // Kitchenware & Dining
  { name: 'Utensils', label: 'Cutlery & Utensils', category: 'kitchen', keywords: ['cutlery', 'fork', 'knife', 'spoon', 'kitchenware', 'dining', 'tableware'] },
  { name: 'CookingPot', label: 'Cookware & Pots', category: 'kitchen', keywords: ['pot', 'pan', 'cookware', 'kitchen', 'stew', 'cook', 'granite'] },
  { name: 'ChefHat', label: 'Chef & Culinary', category: 'kitchen', keywords: ['chef', 'cook', 'bakery', 'kitchen', 'restaurant', 'culinary'] },
  { name: 'Coffee', label: 'Coffee & Tea Mugs', category: 'kitchen', keywords: ['coffee', 'tea', 'cup', 'mug', 'espresso', 'cafe', 'breakfast'] },
  { name: 'CupSoda', label: 'Glassware & Drinks', category: 'kitchen', keywords: ['drink', 'soda', 'cup', 'glass', 'juice', 'beverage', 'tumbler'] },
  { name: 'Wine', label: 'Wine & Barware', category: 'kitchen', keywords: ['wine', 'bar', 'glass', 'cocktail', 'party', 'bottle', 'barware'] },
  { name: 'Refrigerator', label: 'Refrigerators & Cooling', category: 'kitchen', keywords: ['fridge', 'refrigerator', 'freezer', 'cooling', 'kitchen'] },
  { name: 'Cake', label: 'Bakery & Cake Molds', category: 'kitchen', keywords: ['cake', 'dessert', 'baking', 'sweet', 'bakery', 'mold'] },
  { name: 'Pizza', label: 'Pizza & Baking Trays', category: 'kitchen', keywords: ['pizza', 'bake', 'oven', 'slice', 'tray', 'fast food'] },
  { name: 'Apple', label: 'Fresh Fruits & Food', category: 'kitchen', keywords: ['apple', 'fruit', 'grocery', 'produce', 'healthy', 'organic'] },
  { name: 'Salad', label: 'Salads & Table Greens', category: 'kitchen', keywords: ['salad', 'vegetable', 'greens', 'healthy', 'diet', 'bowl'] },
  { name: 'Egg', label: 'Eggs & Baking Mix', category: 'kitchen', keywords: ['egg', 'breakfast', 'cooking', 'baking'] },
  { name: 'Fish', label: 'Fish & Seafood', category: 'kitchen', keywords: ['fish', 'seafood', 'meat', 'fresh'] },

  // Home Appliances & Tech
  { name: 'Tv', label: 'TV & Home Cinema', category: 'appliances', keywords: ['tv', 'television', 'monitor', 'screen', 'entertainment', 'cinema'] },
  { name: 'Microwave', label: 'Microwaves & Small Heat', category: 'appliances', keywords: ['microwave', 'oven', 'appliance', 'heat', 'warm'] },
  { name: 'WashingMachine', label: 'Washing Machines & Laundry', category: 'appliances', keywords: ['washing machine', 'washer', 'laundry', 'clean', 'clothes', 'dryer'] },
  { name: 'Fan', label: 'Cooling Fans & Air Circulators', category: 'appliances', keywords: ['fan', 'cooling', 'air', 'blower', 'climate', 'wind', 'desk fan'] },
  { name: 'AirVent', label: 'Air Purifiers & HVAC', category: 'appliances', keywords: ['air', 'vent', 'ac', 'purifier', 'filter', 'climate', 'conditioner'] },
  { name: 'Speaker', label: 'Speakers & Audio Systems', category: 'appliances', keywords: ['speaker', 'sound', 'music', 'audio', 'stereo', 'bass', 'bluetooth'] },
  { name: 'Plug', label: 'Small Electrical & Plugs', category: 'appliances', keywords: ['plug', 'socket', 'electric', 'power', 'cord', 'adapter', 'extension'] },
  { name: 'Lightbulb', label: 'Smart Lighting & Bulbs', category: 'appliances', keywords: ['lightbulb', 'light', 'bulb', 'illumination', 'smart', 'led'] },
  { name: 'Radio', label: 'Radios & Portable Sound', category: 'appliances', keywords: ['radio', 'wireless', 'music', 'broadcast', 'audio'] },
  { name: 'Monitor', label: 'PC Monitors & Displays', category: 'appliances', keywords: ['monitor', 'computer', 'screen', 'pc', 'desktop', 'oled'] },
  { name: 'Smartphone', label: 'Smartphones & Mobiles', category: 'appliances', keywords: ['smartphone', 'phone', 'mobile', 'cell', 'android', 'iphone'] },
  { name: 'Tablet', label: 'Tablets & E-Readers', category: 'appliances', keywords: ['tablet', 'ipad', 'touch', 'screen', 'reader'] },
  { name: 'Laptop', label: 'Laptops & Computers', category: 'appliances', keywords: ['laptop', 'notebook', 'macbook', 'pc', 'computer'] },
  { name: 'Headphones', label: 'Headphones & Headsets', category: 'appliances', keywords: ['headphones', 'earphones', 'headset', 'audio', 'sound', 'wireless'] },
  { name: 'Camera', label: 'Cameras & Surveillance', category: 'appliances', keywords: ['camera', 'photo', 'video', 'cctv', 'surveillance', 'lens'] },
  { name: 'Watch', label: 'Smartwatches & Clocks', category: 'appliances', keywords: ['watch', 'smartwatch', 'fitness', 'time', 'wearable', 'clock'] },
  { name: 'Wifi', label: 'Networking & Smart Home', category: 'appliances', keywords: ['wifi', 'network', 'router', 'internet', 'smart home', 'wireless'] },
  { name: 'Cpu', label: 'Electronics & Processors', category: 'appliances', keywords: ['cpu', 'chip', 'processor', 'hardware', 'tech', 'electronics'] },

  // Home, Living & Furniture
  { name: 'Home', label: 'Home & Household', category: 'furniture', keywords: ['home', 'house', 'living', 'family', 'household'] },
  { name: 'Armchair', label: 'Chairs & Armchairs', category: 'furniture', keywords: ['armchair', 'chair', 'furniture', 'seat', 'living room', 'accent'] },
  { name: 'Sofa', label: 'Sofas & Couches', category: 'furniture', keywords: ['sofa', 'couch', 'living room', 'furniture', 'lounge', 'sectional'] },
  { name: 'Bed', label: 'Beds & Mattresses', category: 'furniture', keywords: ['bed', 'bedroom', 'mattress', 'pillow', 'sleep', 'duvet'] },
  { name: 'Bath', label: 'Bathtubs & Washroom', category: 'furniture', keywords: ['bath', 'bathtub', 'bathroom', 'wash', 'sanitary'] },
  { name: 'ShowerHead', label: 'Showers & Sanitary Fixtures', category: 'furniture', keywords: ['shower', 'fixture', 'bathroom', 'water', 'faucet', 'plumbing'] },
  { name: 'Lamp', label: 'Table & Standing Lamps', category: 'furniture', keywords: ['lamp', 'desk lamp', 'light', 'interior', 'decor', 'lighting'] },
  { name: 'DoorClosed', label: 'Wardrobes & Cabinets', category: 'furniture', keywords: ['door', 'wardrobe', 'closet', 'cabinet', 'storage', 'cupboard'] },
  { name: 'Paintbrush', label: 'Decor, Paint & Wallpaper', category: 'furniture', keywords: ['paint', 'brush', 'decor', 'renovation', 'wall', 'finishes'] },
  { name: 'Layers', label: 'Bedding & Home Textiles', category: 'furniture', keywords: ['textile', 'linens', 'blanket', 'sheets', 'cushions', 'layers'] },
  { name: 'Sparkles', label: 'Luxury Decor & Accents', category: 'furniture', keywords: ['decor', 'luxury', 'sparkle', 'clean', 'mirror', 'accessories'] },
  { name: 'Boxes', label: 'Storage Bins & Organizers', category: 'furniture', keywords: ['boxes', 'storage', 'organizer', 'closet', 'bins', 'baskets'] },
  { name: 'Sun', label: 'Outdoor & Patio Furniture', category: 'furniture', keywords: ['outdoor', 'patio', 'garden', 'sun', 'furniture', 'balcony'] },
  { name: 'Flower2', label: 'Plants & Botanical Pots', category: 'furniture', keywords: ['flower', 'plant', 'gardening', 'botanical', 'pot', 'vase'] },

  // Hardware, Tools & Industrial
  { name: 'Hammer', label: 'Hand Tools & Hammers', category: 'hardware', keywords: ['hammer', 'tool', 'hardware', 'carpentry', 'repair'] },
  { name: 'Wrench', label: 'Wrenches & Plumbing Tools', category: 'hardware', keywords: ['wrench', 'tool', 'spanner', 'plumbing', 'mechanic', 'socket'] },
  { name: 'Drill', label: 'Power Drills & Machinery', category: 'hardware', keywords: ['drill', 'power tool', 'construction', 'hardware', 'machinery'] },
  { name: 'Scissors', label: 'Scissors & Craft Cutters', category: 'hardware', keywords: ['scissors', 'cut', 'craft', 'office', 'shears', 'cutting'] },
  { name: 'HardHat', label: 'Safety & Industrial Gear', category: 'hardware', keywords: ['safety', 'helmet', 'hardhat', 'construction', 'protection', 'work'] },
  { name: 'Warehouse', label: 'Warehouse & Bulk Supplies', category: 'hardware', keywords: ['warehouse', 'storage', 'depot', 'logistics', 'wholesale', 'bulk'] },
  { name: 'Factory', label: 'Factory Direct & Machinery', category: 'hardware', keywords: ['factory', 'manufacturing', 'industry', 'production', 'plant'] },
  { name: 'Truck', label: 'Freight & Heavy Logistics', category: 'hardware', keywords: ['truck', 'cargo', 'delivery', 'transport', 'shipping', 'freight'] },
  { name: 'Package', label: 'Packaging Materials & Cartons', category: 'hardware', keywords: ['package', 'parcel', 'box', 'packaging', 'shipping', 'carton'] },
  { name: 'ShieldCheck', label: 'Security & Quality Assured', category: 'hardware', keywords: ['shield', 'security', 'protection', 'quality', 'warranty', 'guard'] },

  // Fashion, Apparel & Beauty
  { name: 'Shirt', label: 'Apparel & Clothing', category: 'fashion', keywords: ['shirt', 'clothing', 'apparel', 'fashion', 'garment', 'wear', 'tshirt'] },
  { name: 'Glasses', label: 'Eyewear & Sunglasses', category: 'fashion', keywords: ['glasses', 'sunglasses', 'eyewear', 'fashion', 'optics', 'frames'] },
  { name: 'Footprints', label: 'Footwear & Shoes', category: 'fashion', keywords: ['shoes', 'footwear', 'boots', 'sneakers', 'steps', 'sandals'] },
  { name: 'Crown', label: 'Jewelry & Fine Luxury', category: 'fashion', keywords: ['crown', 'jewelry', 'royal', 'luxury', 'gold', 'accessories', 'tiara'] },
  { name: 'Gem', label: 'Gems & Crystal Accessories', category: 'fashion', keywords: ['gem', 'diamond', 'crystal', 'jewelry', 'stone', 'ring'] },
  { name: 'Baby', label: 'Baby & Kids Care', category: 'fashion', keywords: ['baby', 'kids', 'child', 'infant', 'nursery', 'toy'] },
  { name: 'Heart', label: 'Health, Beauty & Skincare', category: 'fashion', keywords: ['heart', 'health', 'beauty', 'cosmetics', 'wellness', 'skincare'] },

  // Store & Retail
  { name: 'ShoppingBag', label: 'Shopping Bags & Retail', category: 'retail', keywords: ['shopping', 'bag', 'retail', 'store', 'goods', 'purchases'] },
  { name: 'ShoppingCart', label: 'Supermarket & Shopping Carts', category: 'retail', keywords: ['cart', 'shopping cart', 'trolley', 'market', 'supermarket'] },
  { name: 'Store', label: 'Storefront & Hypermarkets', category: 'retail', keywords: ['store', 'shop', 'market', 'boutique', 'merchant', 'hypermarket'] },
  { name: 'Tag', label: 'Price Tags & Discounts', category: 'retail', keywords: ['tag', 'price', 'discount', 'label', 'sale', 'clearance'] },
  { name: 'BadgePercent', label: 'Promotions & Big Deals', category: 'retail', keywords: ['percent', 'promo', 'offer', 'deal', 'clearance', 'coupon'] },
  { name: 'Gift', label: 'Gifts & Festive Souvenirs', category: 'retail', keywords: ['gift', 'present', 'holiday', 'souvenir', 'box', 'surprise'] },
  { name: 'Star', label: 'Featured & Top Rated', category: 'retail', keywords: ['star', 'featured', 'top', 'bestseller', 'rated', 'popular'] },
  { name: 'Flame', label: 'Hot Drops & Flash Sales', category: 'retail', keywords: ['flame', 'fire', 'trending', 'hot', 'popular', 'flash'] },
  { name: 'Zap', label: 'Express Delivery & Power', category: 'retail', keywords: ['zap', 'lightning', 'flash', 'express', 'speed', 'fast', 'instant'] },
]

/**
 * Dynamic Lucide icon renderer
 */
export function DynamicCategoryIcon({
  name,
  className = 'w-5 h-5',
  fallback: Fallback = Folder
}: {
  name?: string | null
  className?: string
  fallback?: React.ComponentType<{ className?: string }>
}) {
  if (!name) return <Fallback className={className} />
  const IconComponent = (LucideIcons as any)[name]
  if (!IconComponent) return <Fallback className={className} />
  return <IconComponent className={className} />
}

export interface CategoryIconPickerProps {
  value?: string | null
  onChange: (iconName: string) => void
  label?: string
  helperText?: string
}

export function CategoryIconPicker({
  value = '',
  onChange,
  label = 'Category Icon',
  helperText
}: CategoryIconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'kitchen' | 'appliances' | 'furniture' | 'hardware' | 'fashion' | 'retail'>('all')
  const [customInput, setCustomInput] = useState('')

  // Quick 8 fast presets
  const popularPresets = [
    { name: 'Utensils', label: 'Kitchenware' },
    { name: 'CookingPot', label: 'Cookware' },
    { name: 'Tv', label: 'TV & Video' },
    { name: 'Microwave', label: 'Appliances' },
    { name: 'WashingMachine', label: 'Washers' },
    { name: 'Armchair', label: 'Furniture' },
    { name: 'Home', label: 'Home' },
    { name: 'ShoppingBag', label: 'Retail' },
  ]

  // Filtered icons
  const filteredIcons = useMemo(() => {
    let list = CATEGORY_ICONS_LIST
    if (activeTab !== 'all') {
      list = list.filter((item) => item.category === activeTab)
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter((item) =>
        item.name.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
      )
    }
    return list
  }, [search, activeTab])

  const selectedMeta = useMemo(() => {
    return CATEGORY_ICONS_LIST.find((i) => i.name === value)
  }, [value])

  const handleSelect = (iconName: string) => {
    onChange(iconName)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  const handleApplyCustom = () => {
    const trimmed = customInput.trim()
    if (trimmed) {
      const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
      onChange(formatted)
      setCustomInput('')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-gray-700">{label}</Label>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-0.5"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Selected Icon Trigger / Preview Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
          isOpen
            ? 'border-[#1a3a5c] ring-2 ring-[#1a3a5c]/10 bg-slate-50/70'
            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-slate-50/50'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            value ? 'bg-[#1a3a5c] text-white shadow-xs' : 'bg-gray-100 text-gray-400'
          }`}>
            <DynamicCategoryIcon name={value} className="w-5 h-5" fallback={Folder} />
          </div>

          <div className="min-w-0">
            {value ? (
              <div>
                <p className="text-xs font-bold text-gray-900 truncate">
                  {selectedMeta?.label || value}
                </p>
                <p className="text-[10px] font-mono text-gray-500">
                  &lt;{value} /&gt;
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500 font-medium">Select category icon...</p>
                <p className="text-[10px] text-gray-400">Kitchenware, appliances, home, tools...</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-gray-400 shrink-0">
          <span className="text-[11px] text-[#1a3a5c] font-semibold hidden sm:inline-block">
            {isOpen ? 'Close Box' : 'Choose Icon'}
          </span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* 1-Click Fast Presets */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] uppercase font-bold text-gray-400 mr-1">Quick:</span>
        {popularPresets.map((p) => {
          const isSelected = value === p.name
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => handleSelect(p.name)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium border transition-all ${
                isSelected
                  ? 'bg-[#1a3a5c] text-white border-[#1a3a5c] shadow-2xs font-bold'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <DynamicCategoryIcon name={p.name} className="w-3 h-3" />
              <span>{p.label}</span>
            </button>
          )
        })}
      </div>

      {/* Expanded Icon Selector Box */}
      {isOpen && (
        <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-lg space-y-3 mt-2 animate-in fade-in zoom-in-95 duration-150">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons (e.g., pan, cook, fridge, tv, chair, bed, wash, tool)..."
              className="pl-8 h-8 text-xs rounded-lg bg-gray-50 border-gray-200 focus:bg-white"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1 text-[11px]">
            {[
              { id: 'all', label: 'All' },
              { id: 'kitchen', label: 'Kitchenware' },
              { id: 'appliances', label: 'Appliances' },
              { id: 'furniture', label: 'Furniture' },
              { id: 'hardware', label: 'Tools' },
              { id: 'fashion', label: 'Fashion' },
              { id: 'retail', label: 'Retail' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-2.5 py-1 rounded-md shrink-0 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#1a3a5c] text-white font-semibold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Icon Grid */}
          <div className="max-h-[220px] overflow-y-auto grid grid-cols-4 sm:grid-cols-5 gap-2 p-1 border rounded-xl bg-slate-50/40 border-slate-100">
            {filteredIcons.length === 0 ? (
              <div className="col-span-full py-6 text-center text-xs text-gray-400">
                No matching icons found for &ldquo;{search}&rdquo;
              </div>
            ) : (
              filteredIcons.map((item) => {
                const isSelected = value === item.name
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      handleSelect(item.name)
                      setIsOpen(false)
                    }}
                    title={`${item.label} (${item.name})`}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all relative group ${
                      isSelected
                        ? 'border-[#1a3a5c] bg-[#1a3a5c]/10 ring-2 ring-[#1a3a5c]/20 text-[#1a3a5c] font-bold'
                        : 'border-transparent bg-white hover:border-gray-200 hover:bg-white hover:shadow-2xs text-gray-700'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#1a3a5c] text-white flex items-center justify-center text-[9px]">
                        <Check size={8} strokeWidth={3} />
                      </span>
                    )}
                    <DynamicCategoryIcon
                      name={item.name}
                      className={`w-5 h-5 transition-transform group-hover:scale-115 ${
                        isSelected ? 'text-[#1a3a5c]' : 'text-slate-700'
                      }`}
                    />
                    <span className="text-[10px] line-clamp-1 text-center w-full leading-tight font-medium">
                      {item.name}
                    </span>
                  </button>
                )
              })
            )}
          </div>

          {/* Custom Icon Name input fallback */}
          <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
            <span className="text-[11px] text-gray-400 shrink-0">Custom icon:</span>
            <Input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="e.g. ShieldAlert, Gift, Truck"
              className="h-7 text-xs rounded-lg flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleApplyCustom()
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleApplyCustom}
              disabled={!customInput.trim()}
              className="h-7 text-[11px] px-2.5 rounded-lg"
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
