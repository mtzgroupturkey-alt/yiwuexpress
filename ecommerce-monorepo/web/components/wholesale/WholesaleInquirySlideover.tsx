'use client'

import { X, Minus, Plus, Trash2, ExternalLink, Send } from 'lucide-react'
import Image from 'next/image'
import { LocaleLink } from '@/components/LocaleLink'
import { useWholesaleInquiry } from '@/contexts/WholesaleInquiryContext'
import { useSessionMode } from '@/contexts/SessionModeContext'

interface WholesaleInquirySlideoverProps {
  open: boolean
  onClose: () => void
}

export function WholesaleInquirySlideover({ open, onClose }: WholesaleInquirySlideoverProps) {
  const { items, count, removeItem, updateQuantity, clear } = useWholesaleInquiry()
  const { enableWholesaleSession } = useSessionMode()

  if (!open) return null

  const total = items.reduce((sum, i) => sum + i.wholesalePrice * i.quantity, 0)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[60] transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md z-[70] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Quote List</h2>
            <p className="text-sm text-gray-500">{count} item{count !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close quote list"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">Your quote list is empty</p>
              <p className="text-gray-400 text-xs mt-1">Add wholesale products to get started</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-3 bg-gray-50 rounded-lg p-3">
                {/* Thumbnail */}
                <LocaleLink href={`/products/${item.slug}`} className="shrink-0" onClick={onClose}>
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-200 relative">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                  </div>
                </LocaleLink>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <LocaleLink
                    href={`/products/${item.slug}`}
                    className="text-sm font-medium text-gray-900 hover:text-secondary-600 line-clamp-1"
                    onClick={onClose}
                  >
                    {item.name}
                  </LocaleLink>
                  <p className="text-xs text-gray-500 mt-0.5">MOQ: {item.minOrderQty}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-sm font-bold text-secondary-600">
                      ${(item.wholesalePrice * item.quantity).toFixed(2)}
                    </span>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const next = item.quantity - item.minOrderQty
                          if (next < item.minOrderQty) {
                            removeItem(item.productId)
                          } else {
                            updateQuantity(item.productId, next)
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-medium text-gray-700 w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + item.minOrderQty)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Unit price */}
                  <p className="text-xs text-gray-400 mt-0.5">
                    ${item.wholesalePrice.toFixed(2)} / unit
                  </p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.productId)}
                  className="p-1 text-gray-300 hover:text-red-500 self-start transition-colors"
                  aria-label={`Remove ${item.name} from quote list`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Estimated total</span>
              <span className="text-lg font-bold text-secondary-600">${total.toFixed(2)}</span>
            </div>

            <button
              onClick={() => {
                enableWholesaleSession()
                window.location.href = '/wholesale'
              }}
              className="w-full py-2.5 bg-secondary-600 text-white rounded-lg text-sm font-semibold hover:bg-secondary-700 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit as Inquiry
            </button>

            <div className="flex items-center gap-2">
              <LocaleLink
                href="/wholesale"
                className="flex-1 py-2 text-center text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                onClick={onClose}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Inquiry Form
              </LocaleLink>
              <button
                onClick={() => {
                  clear()
                  onClose()
                }}
                className="flex-1 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}