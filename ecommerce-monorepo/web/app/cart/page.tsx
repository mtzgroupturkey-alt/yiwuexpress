'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { CartItem } from '@/components/cart/CartItem'
import { CartSummary } from '@/components/cart/CartSummary'
import { Button } from '@/components/ui/button'
import { ShoppingBag, ArrowLeft } from 'lucide-react'
import { useCart } from '@/components/CartContext'

interface Cart {
  id: string
  userId: string
  items: Array<{
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
      isActive: boolean
    }
  }>
}

export default function CartPage() {
  const router = useRouter()
  const { refreshCartCount } = useCart()
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
    fetchCart()
  }, [])

  const fetchCart = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login?redirect=/cart')
        return
      }

      let userId
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        userId = payload.userId
        if (!userId) {
          throw new Error('Invalid token: missing userId')
        }
      } catch (e) {
        console.error('Invalid token:', e)
        localStorage.removeItem('token')
        router.push('/login?redirect=/cart')
        return
      }

      const response = await fetch(`/api/cart?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (response.status === 404) {
        // User not found - redirect to login
        localStorage.removeItem('token')
        router.push('/login?redirect=/cart')
        return
      }
      
      if (data.success) {
        setCart(data.data.cart)
        setSummary(data.data.summary)
        setError('')
        refreshCartCount()
      } else {
        setError(data.error || 'Failed to load cart')
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      setError('Failed to load cart')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setUpdating(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQuantity })
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchCart() // Refresh cart
      } else {
        alert(data.error || 'Failed to update quantity')
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      alert('Failed to update quantity')
    } finally {
      setUpdating(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this item from cart?')) {
      return
    }

    setUpdating(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchCart() // Refresh cart
      } else {
        alert(data.error || 'Failed to remove item')
      }
    } catch (error) {
      console.error('Error removing item:', error)
      alert('Failed to remove item')
    } finally {
      setUpdating(false)
    }
  }

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      alert('Your cart is empty')
      return
    }
    router.push('/checkout')
  }

  if (loading) {
    return (
      <SharedLayout 
        pageTitle="Shopping Cart"
        pageDescription="Review your cart items"
        breadcrumbs={[{ name: 'Cart', href: '/cart' }]}
      >
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </SharedLayout>
    )
  }

  const isEmpty = !cart || cart.items.length === 0

  return (
    <SharedLayout 
      pageTitle="Shopping Cart"
      pageDescription={isEmpty ? 'Your cart is empty' : `${summary.itemCount} items in your cart`}
      breadcrumbs={[{ name: 'Cart', href: '/cart' }]}
    >
      <div className="bg-gray-50 py-8">
        {/* Header */}
        <div className="container mx-auto px-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/products')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">
                Add some products to your cart to get started
              </p>
              <Button onClick={() => router.push('/products')}>
                Start Shopping
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
                  Cart Items ({summary.itemCount})
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
            </div>
          </div>
        </div>
      )}
    </div>
    </SharedLayout>
  )
}
