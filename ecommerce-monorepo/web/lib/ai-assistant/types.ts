export type AdminChatLocale = 'en' | 'ru' | 'zh'

export type PendingActionType = 'createCategories' | 'createAttributes' | 'bulkTranslate' | 'createProducts'

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
  type: 'products' | 'categories' | 'attributes'
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
    attributes?: PendingAttributeItem[]
    translations?: PendingTranslationItem
    products?: PendingProductItem[]
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
