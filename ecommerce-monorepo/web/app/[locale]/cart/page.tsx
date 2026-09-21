'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { CartItem } from '@/components/cart/CartItem'
import { CartSummary } from '@/components/cart/CartSummary'
import { Button } from '@/components/ui/button'
import { ShoppingBag, ArrowLeft, FileText } from 'lucide-react'
import { useCart } from '@/components/CartContext'
import { TrustBadgesMini } from '@/components/TrustBadgesMini'
import { useLocaleNav } from '@/hooks/useLocaleNav'
import { useTranslations } from 'next-intl'
import { useSettings } from '@/components/SettingsProvider'
import { useStoreMode } from '@/contexts/StoreModeContext'
import { useSessionMode } from '@/contexts/SessionModeContext'
import { MobileCartPage } from '@/components/mobile/cart/MobileCartPage'


interface Cart {
  id: string
  userId: string
  items: Array<{
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
      isActive: boolean
    }
  }>
}

export default function CartPage() {
  const router = useRouter()
  const navigate = useLocaleNav()
  const { refreshCartCount } = useCart()
  const t = useTranslations('Cart')
  const { settings, storeMode: systemStoreMode } = useSettings()
  const { storeMode: ctxStoreMode } = useStoreMode()
  const { sessionMode, isWholesaleSession, enableRetailSession } = useSessionMode()

  const currentStoreMode = ctxStoreMode || systemStoreMode || 'WHOLESALE'
  const isWholesaleActive =
    currentStoreMode === 'WHOLESALE' ||
    (currentStoreMode === 'BOTH' && (sessionMode === 'wholesale' || isWholesaleSession))

  const [cart, setCart] = useState<Cart | null>(null)
  const [summary, setSummary] = useState({
    itemCount: 0,
    totalQuantity: 0,
    subtotal: 0,
    totalWeight: 0
  })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isWholesaleActive) {
      navigate('/quote-cart')
      return
    }
    fetchCart()
  }, [isWholesaleActive])

  const fetchCart = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/cart', {
        credentials: 'include' // Send httpOnly cookie
      })

      if (response.status === 401) {
        // Not authenticated
        navigate('/login?redirect=/cart')
        return
      }

      const data = await response.json()
      
       if (data.success) {
         setCart(data.data.cart)
         setSummary(data.data.summary)
         setError('')
         refreshCartCount()
       } else {
         setError(data.error || t('failedLoadCart'))
       }
     } catch (error) {
       console.error('Error fetching cart:', error)
       setError(t('failedLoadCart'))
     } finally {
       setLoading(false)
     }
   }

   const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
     if (newQuantity < 1) return

     setUpdating(true)
     try {
       const response = await fetch(`/api/cart/${itemId}`, {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
         },
         credentials: 'include', // Send httpOnly cookie
         body: JSON.stringify({ quantity: newQuantity })
       })

       const data = await response.json()
       
       if (response.status === 401) {
         navigate('/login')
         return
       }
       
       if (data.success) {
         await fetchCart() // Refresh cart
       } else {
         alert(data.error || t('updateError'))
       }
     } catch (error) {
       console.error('Error updating quantity:', error)
       alert(t('updateError'))
     } finally {
       setUpdating(false)
     }
   }

   const handleRemoveItem = async (itemId: string) => {
     if (!confirm(t('removeConfirm'))) {
       return
     }

     setUpdating(true)
     try {
       const response = await fetch(`/api/cart/${itemId}`, {
         method: 'DELETE',
         credentials: 'include', // Send httpOnly cookie
       })

       const data = await response.json()
       
       if (response.status === 401) {
         navigate('/login')
         return
       }
       
       if (data.success) {
         await fetchCart() // Refresh cart
       } else {
         alert(data.error || t('removeError'))
       }
     } catch (error) {
       console.error('Error removing item:', error)
       alert(t('removeError'))
     } finally {
       setUpdating(false)
     }
   }

    const handleCheckout = () => {
      if (isWholesaleActive) {
        alert('Wholesale orders must be submitted via the B2B Quote Cart.')
        navigate('/quote-cart')
        return
      }
      if (!cart || cart.items.length === 0) {
        alert(t('emptyCartAlert'))
        return
      }
      navigate('/checkout')
    }

    if (isWholesaleActive) {
      return (
        <SharedLayout
          pageTitle="Wholesale Mode Active"
          pageDescription="Retail cart is not available in wholesale mode"
          breadcrumbs={[{ name: 'Quote Cart', href: '/quote-cart' }]}
        >
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-lg mx-auto text-center bg-white rounded-2xl p-8 border border-amber-200 shadow-sm space-y-4">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Wholesale Mode Active</h2>
              <p className="text-sm text-gray-600">
                You are in Wholesale mode. Retail cart and consumer checkout are not available.
              </p>
              <div className="pt-3 flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/quote-cart')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  View Quote Cart
                </Button>
                {currentStoreMode === 'BOTH' ? (
                  <Button variant="outline" onClick={() => {
                    enableRetailSession();
                    window.location.reload();
                  }}>
                    Switch to Retail
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => navigate('/store')}>
                    Browse Wholesale Catalog
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SharedLayout>
      )
    }

    if (loading) {
      return (
        <SharedLayout 
          pageTitle={t('title')}
          pageDescription={t('pageDescCart')}
          breadcrumbs={[{ name: t('title'), href: '/cart' }]}
        >
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </SharedLayout>
      )
    }

    const isEmpty = !cart || cart.items.length === 0

    const mobileCartItems = (cart?.items || []).map((it) => ({
      id: it.id,
      productId: it.productId,
      name: it.product.name,
      slug: it.product.slug,
      price: it.product.price,
      image: it.product.thumbnail,
      stock: it.product.stock,
      quantity: it.quantity,
      weightKg: it.product.weightKg,
      isActive: it.product.isActive,
    }))

    return (
      <>
        {/* MOBILE CART VIEW (Phase 4, hidden on md+) */}
        <div className="md:hidden">
          <MobileCartPage
            items={mobileCartItems}
            subtotal={summary.subtotal}
            totalWeight={summary.totalWeight}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={handleCheckout}
            onContinueShopping={() => navigate('/store')}
            updating={updating}
            isWholesaleActive={isWholesaleActive}
            onSwitchToQuoteCart={() => navigate('/quote-cart')}
          />
        </div>

        {/* DESKTOP CART VIEW (100% byte-identical, hidden on mobile) */}
        <div className="hidden md:block">
          <SharedLayout 
            pageTitle={t('title')}
            pageDescription={isEmpty ? t('pageDescEmpty') : t('reviewItems', { n: summary.itemCount })}
            breadcrumbs={[{ name: t('title'), href: '/cart' }]}
          >
            <div className="bg-gray-50 py-8">
              {/* Header */}
              <div className="container mx-auto px-4 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/store')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('continueShopping')}
                </Button>
              </div>

              {/* Error */}
              {error && (
                <div className="container mx-auto px-4 py-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Empty Cart */}
              {isEmpty && !error && (
                <div className="container mx-auto px-4 py-16">
                  <div className="max-w-md mx-auto text-center">
                    <div className="bg-white rounded-lg p-12 shadow-sm">
                      <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('empty')}</h2>
                      <p className="text-gray-600 mb-6">
                        {t('addSomeProducts')}
                      </p>
                      <Button onClick={() => navigate('/store')}>
                        {t('startShopping')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Cart Items */}
              {!isEmpty && (
                <div className="container mx-auto px-4 py-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items List */}
                    <div className="lg:col-span-2">
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold mb-4">
                          {t('cartItems', { n: summary.itemCount })}
                        </h2>
                        
                        <div className="space-y-0">
                          {cart.items.map((item) => (
                            <CartItem
                              key={item.id}
                              item={item}
                              onUpdateQuantity={handleUpdateQuantity}
                              onRemove={handleRemoveItem}
                              updating={updating}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div>
                      <CartSummary
                        subtotal={summary.subtotal}
                        totalWeight={summary.totalWeight}
                        itemCount={summary.itemCount}
                        onCheckout={handleCheckout}
                      />
                      <div className="mt-6">
                        <TrustBadgesMini layout="row" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SharedLayout>
        </div>
      </>
    )
  }
