'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { LocaleLink } from '@/components/LocaleLink'
import { Button } from '@/components/ui/button'
import { ProductImage } from '@/components/ui/ProductImage'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface CartItemProps {
  item: {
    id: string
    productId: string
    variantId?: string | null
    selectedOptions?: Record<string, any> | null
    quantity: number
    product: {
      id: string
      name: string
      slug: string
      price: number
      thumbnail?: string | null
      stock: number
      weightKg: number
    }
  }
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
  updating: boolean
}

export function CartItem({ item, onUpdateQuantity, onRemove, updating }: CartItemProps) {
  const t = useTranslations('Cart')
  const total = item.product.price * item.quantity

  return (
    <div className="flex gap-4 py-4 border-b border-gray-200">
      {/* Product Image */}
      <LocaleLink href={`/products/${item.product.slug}`} className="flex-shrink-0">
        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden relative">
          <ProductImage
            src={item.product.thumbnail}
            alt={item.product.name || 'Product image'}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>
      </LocaleLink>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <LocaleLink 
          href={`/products/${item.product.slug}`}
          className="font-semibold text-gray-900 hover:text-primary transition-colors line-clamp-2"
        >
          {item.product.name}
        </LocaleLink>

        {/* Selected Options (Color, Size, etc.) */}
        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {Object.entries(item.selectedOptions).map(([key, val]) => {
              const isHex = typeof val === 'string' && val.startsWith('#')
              const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs"
                >
                  <span className="text-slate-500 font-normal">{label}:</span>
                  {isHex && (
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-gray-300 inline-block flex-shrink-0"
                      style={{ backgroundColor: val }}
                    />
                  )}
                  <span>{String(val)}</span>
                </span>
              )
            })}
          </div>
        )}
        
        <p className="text-sm text-gray-500 mt-1">
          ${item.product.price.toFixed(2)} {t('perUnit')}
        </p>
        
        <p className="text-xs text-gray-400 mt-1">
          {t('weightPerUnit', { n: item.product.weightKg })}
        </p>

        {/* Quantity Controls - Mobile */}
        <div className="flex items-center gap-2 mt-3 md:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1 || updating}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={item.quantity >= item.product.stock || updating}
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            disabled={updating}
            className="text-red-600 hover:text-red-700 ml-2"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quantity Controls - Desktop */}
      <div className="hidden md:flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          disabled={item.quantity <= 1 || updating}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <span className="font-medium w-12 text-center">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          disabled={item.quantity >= item.product.stock || updating}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Total Price */}
      <div className="hidden md:flex flex-col items-end justify-between">
        <p className="text-xl font-bold text-gray-900">
          ${total.toFixed(2)}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.id)}
          disabled={updating}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          {t('remove')}
        </Button>
      </div>

      {/* Mobile Total */}
      <div className="md:hidden flex flex-col items-end justify-start">
        <p className="text-lg font-bold text-gray-900">
          ${total.toFixed(2)}
        </p>
      </div>
    </div>
  )
}
