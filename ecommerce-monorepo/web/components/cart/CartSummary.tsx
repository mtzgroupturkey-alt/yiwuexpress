'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Truck, Tag } from 'lucide-react'

interface CartSummaryProps {
  subtotal: number
  totalWeight: number
  itemCount: number
  shippingEstimate?: number
  onCheckout: () => void
}

export function CartSummary({ 
  subtotal, 
  totalWeight, 
  itemCount, 
  shippingEstimate,
  onCheckout 
}: CartSummaryProps) {
  const total = subtotal + (shippingEstimate || 0)

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items Count */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Package className="w-4 h-4" />
            <span>Items ({itemCount})</span>
          </div>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>

        {/* Total Weight */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Tag className="w-4 h-4" />
            <span>Total Weight</span>
          </div>
          <span className="font-medium">{totalWeight.toFixed(2)} kg</span>
        </div>

        {/* Shipping Estimate */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Truck className="w-4 h-4" />
            <span>Shipping Estimate</span>
          </div>
          <span className="font-medium">
            {shippingEstimate !== undefined 
              ? `$${shippingEstimate.toFixed(2)}`
              : 'Calculated at checkout'
            }
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* Total */}
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">
            ${total.toFixed(2)}
          </span>
        </div>

        {/* Checkout Button */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={onCheckout}
        >
          Proceed to Checkout
        </Button>

        {/* Info Text */}
        <p className="text-xs text-gray-500 text-center">
          Shipping and taxes calculated at checkout
        </p>

        {/* Features */}
        <div className="space-y-2 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Secure checkout</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Free shipping over $500</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Quality guaranteed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
