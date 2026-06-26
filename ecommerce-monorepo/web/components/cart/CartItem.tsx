'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface CartItemProps {
  item: {
    id: string
    productId: string
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
  const total = item.product.price * item.quantity

  return (
    <div className="flex gap-4 py-4 border-b border-gray-200">
      {/* Product Image */}
      <Link href={`/products/${item.product.slug}`} className="flex-shrink-0">
        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
          {item.product.thumbnail ? (
            <img
              src={item.product.thumbnail}
              alt={item.product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-2xl">
              📦
            </div>
          )}
        </div>
      </Link>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <Link 
          href={`/products/${item.product.slug}`}
          className="font-semibold text-gray-900 hover:text-primary transition-colors line-clamp-2"
        >
          {item.product.name}
        </Link>
        
        <p className="text-sm text-gray-500 mt-1">
          ${item.product.price.toFixed(2)} per unit
        </p>
        
        <p className="text-xs text-gray-400 mt-1">
          Weight: {item.product.weightKg} kg/unit
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
          Remove
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
