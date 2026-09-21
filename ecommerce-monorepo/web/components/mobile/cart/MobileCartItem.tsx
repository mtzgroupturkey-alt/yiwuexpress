'use client'

import React from 'react'
import Image from 'next/image'
import { Trash2, Package, AlertCircle } from 'lucide-react'
import { useCurrency } from '@/hooks/useCurrency'
import { MobileQuantityStepper } from '../product/MobileQuantityStepper'

export interface MobileCartItemData {
  id: string
  productId: string
  name: string
  slug?: string
  price: number
  image?: string | null
  stock?: number
  quantity: number
  weightKg?: number
  variantName?: string
  moq?: number
  isActive?: boolean
}

interface MobileCartItemProps {
  item: MobileCartItemData
  onUpdateQuantity: (id: string, newQty: number) => void
  onRemove: (id: string) => void
  updating?: boolean
  className?: string
}

export function MobileCartItem({
  item,
  onUpdateQuantity,
  onRemove,
  updating = false,
  className = '',
}: MobileCartItemProps) {
  const { formatPrice } = useCurrency()

  const maxStock = item.stock !== undefined ? Math.max(1, item.stock) : 9999
  const minQty = item.moq || 1

  return (
    <div
      data-testid="mobile-cart-item"
      className={`relative bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-3.5 shadow-2xs transition-all ${
        updating ? 'opacity-60 pointer-events-none' : ''
      } ${className}`}
    >
      <div className="flex gap-3">
        {/* Product Image */}
        <div className="relative w-20 h-20 rounded-xl bg-gray-50 dark:bg-slate-900 overflow-hidden shrink-0 border border-gray-100 dark:border-slate-800 flex items-center justify-center">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="80px"
              className="object-contain p-1.5"
            />
          ) : (
            <Package className="w-8 h-8 text-gray-300 dark:text-slate-600" />
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                {item.name}
              </h3>
              {/* Delete button (>=44px touch target) */}
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label={`Remove ${item.name}`}
                className="w-8 h-8 -mr-1 -mt-1 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 active:scale-90 transition-transform touch-manipulation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Variant / Weight details */}
            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-400 dark:text-slate-400">
              {item.variantName && (
                <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium text-gray-700 dark:text-slate-300">
                  {item.variantName}
                </span>
              )}
              {item.weightKg ? (
                <span>{(item.weightKg * item.quantity).toFixed(2)} kg</span>
              ) : null}
            </div>

            {item.stock !== undefined && item.stock < 5 && item.stock > 0 && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3 h-3" />
                Only {item.stock} left in stock
              </p>
            )}
          </div>

          {/* Pricing & Stepper Row */}
          <div className="flex items-end justify-between gap-2 pt-2 border-t border-gray-100 dark:border-slate-800/80 mt-2">
            <div>
              <p className="text-xs font-extrabold text-[#00407a] dark:text-[#F5A602]">
                {formatPrice(item.price * item.quantity)}
              </p>
              <p className="text-[10px] text-gray-400">
                {formatPrice(item.price)} / unit
              </p>
            </div>

            <MobileQuantityStepper
              quantity={item.quantity}
              onChange={(newQty) => onUpdateQuantity(item.id, newQty)}
              min={minQty}
              max={maxStock}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
