'use client'

import { useMemo } from 'react'

interface TieredPrice {
  id: string
  minQuantity: number
  maxQuantity: number | null
  price: number
}

interface TieredPricingDisplayProps {
  tiers: TieredPrice[]
  quantity: number
  onQuantityChange?: (qty: number) => void
}

export function TieredPricingDisplay({ 
  tiers, 
  quantity, 
  onQuantityChange 
}: TieredPricingDisplayProps) {
  const sortedTiers = useMemo(() => {
    return [...tiers].sort((a, b) => a.minQuantity - b.minQuantity)
  }, [tiers])

  // Find current price tier
  const currentTier = useMemo(() => {
    return sortedTiers.find(tier => {
      const meetsMin = quantity >= tier.minQuantity
      const meetsMax = !tier.maxQuantity || quantity <= tier.maxQuantity
      return meetsMin && meetsMax
    })
  }, [sortedTiers, quantity])

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!currentTier) return 0
    return currentTier.price * quantity
  }, [currentTier, quantity])

  // Calculate savings if compare price exists
  const calculateSavings = (tier: TieredPrice) => {
    if (sortedTiers.length === 0) return null
    const basePrice = sortedTiers[0].price
    if (tier.price >= basePrice) return null
    const savings = ((basePrice - tier.price) / basePrice) * 100
    return savings.toFixed(0)
  }

  if (tiers.length === 0) {
    return null
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Volume Pricing</h3>
        <p className="text-xs text-gray-600 mt-1">
          Buy more, save more! Prices decrease with quantity.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                Unit Price
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                Savings
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                Total ({quantity} units)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedTiers.map((tier) => {
              const isCurrentTier = currentTier?.id === tier.id
              const savings = calculateSavings(tier)
              
              return (
                <tr
                  key={tier.id}
                  className={`
                    transition-colors cursor-pointer
                    ${isCurrentTier 
                      ? 'bg-[#1a3a5c]/5 border-l-4 border-l-[#1a3a5c]' 
                      : 'hover:bg-gray-50'
                    }
                  `}
                  onClick={() => onQuantityChange?.(tier.minQuantity)}
                >
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {tier.minQuantity}
                        {tier.maxQuantity ? ` - ${tier.maxQuantity}` : '+'}
                      </span>
                      {isCurrentTier && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1a3a5c] text-white">
                          Current
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                    ${tier.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {savings ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Save {savings}%
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {isCurrentTier ? (
                      <span className="font-bold text-[#1a3a5c]">
                        ${totalPrice.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-600">
                        ${(tier.price * quantity).toFixed(2)}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {currentTier && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Your price for {quantity} unit{quantity !== 1 ? 's' : ''}:
            </span>
            <span className="text-lg font-bold text-[#1a3a5c]">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
          {calculateSavings(currentTier) && (
            <p className="text-xs text-green-600 mt-1 text-right">
              You save {calculateSavings(currentTier)}% with this quantity!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
