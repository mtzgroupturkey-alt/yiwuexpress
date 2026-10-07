export type AdminChatLocale = 'en' | 'ru' | 'zh'

export type PendingActionType =
  | 'createCategories'
  | 'updateCategories'
  | 'createAttributes'
  | 'bulkTranslate'
  | 'createProducts'
  | 'updateProducts'
  | 'deleteEmptyCategories'

export interface PendingCategoryItem {
  name: string
  slug?: string
  parentId?: string | null
  parentName?: string | null
  description?: string | null
  level?: number
  translations?: {
    en?: { name: string; description?: string }
    ru?: { name: string; description?: string }
    zh?: { name: string; description?: string }
  }
}

export interface PendingCategoryUpdateItem {
  id?: string
  name: string
  newName?: string
  slug?: string
  parentId?: string | null
  parentName?: string | null
  description?: string | null
  isActive?: boolean
  isFeatured?: boolean
  showInMenu?: boolean
  displayOrder?: number
  translations?: {
    en?: { name: string; description?: string }
    ru?: { name: string; description?: string }
    zh?: { name: string; description?: string }
  }
}

export interface PendingProductItem {
  name: string
  slug?: string
  sku?: string
  price: number
  compareAtPrice?: number
  categoryName?: string
  categoryId?: string
  description?: string
  images?: string[]
  weightKg?: number
  stock?: number
  translations?: {
    en?: { name: string; description?: string }
    ru?: { name: string; description?: string }
    zh?: { name: string; description?: string }
  }
}

export interface PendingProductUpdateItem {
  id?: string
  sku?: string
  name?: string
  newName?: string
  price?: number
  compareAtPrice?: number
  categoryName?: string
  categoryId?: string
  description?: string
  stock?: number
  isActive?: boolean
  isFeatured?: boolean
  isNewArrival?: boolean
  isFlashSale?: boolean
  translations?: {
    en?: { name: string; description?: string }
    ru?: { name: string; description?: string }
    zh?: { name: string; description?: string }
  }
}

export interface PendingSliderItem {
  id?: string
  title: string
  subtitle?: string | null
  description?: string | null
  imageUrl: string
  mobileImageUrl?: string | null
  productImageUrl?: string | null
  badgeText?: string | null
  badgeColor?: string | null
  ctaText: string
  ctaLink: string
  secondaryCtaText?: string | null
  secondaryCtaLink?: string | null
  alignment?: 'left' | 'center' | 'right'
  displayOrder?: number
  isActive?: boolean
  slideDuration?: number
  translations?: {
    en?: { title: string; subtitle?: string; description?: string; ctaText?: string; badgeText?: string }
    ru?: { title: string; subtitle?: string; description?: string; ctaText?: string; badgeText?: string }
    zh?: { title: string; subtitle?: string; description?: string; ctaText?: string; badgeText?: string }
  }
}

export interface PendingAttributeItem {
  name: string
  slug?: string
  type: 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'SELECT' | 'MULTISELECT' | 'COLOR' | 'COLOR_MULTI' | 'FILE' | 'URL' | 'CHECKBOX'
  options?: string[]
  placeholder?: string
  helperText?: string
  isRequired?: boolean
  isFilterable?: boolean
  isVariant?: boolean
  categoryIds?: string[]
  categoryNames?: string[]
  translations?: {
    en?: { name: string; placeholder?: string; helperText?: string }
    ru?: { name: string; placeholder?: string; helperText?: string }
    zh?: { name: string; placeholder?: string; helperText?: string }
  }
}

export interface PendingTranslationItem {
  type: 'products' | 'categories' | 'attributes' | 'sliders'
  itemIds: string[]
  targetLocales: ('ru' | 'zh')[]
  previewItems?: Array<{
    id: string
    name: string
    missingLocales: string[]
  }>
}

export interface PendingAction {
  id: string
  type: PendingActionType
  summary: string
  payload: {
    categories?: PendingCategoryItem[]
    categoryUpdates?: PendingCategoryUpdateItem[]
    attributes?: PendingAttributeItem[]
    translations?: PendingTranslationItem
    products?: PendingProductItem[]
    productUpdates?: PendingProductUpdateItem[]
    sliders?: PendingSliderItem[]
  }
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXECUTED' | 'FAILED'
  createdAt: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  pendingAction?: PendingAction | null
  actionExecuted?: {
    type: PendingActionType
    status: 'SUCCESS' | 'FAILED'
    summary: string
    details?: any
  } | null
  isStreaming?: boolean
}

export interface ChatRequestPayload {
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  locale: AdminChatLocale
  pendingAction?: PendingAction | null
}
