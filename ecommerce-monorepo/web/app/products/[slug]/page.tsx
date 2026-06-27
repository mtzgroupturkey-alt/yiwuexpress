'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { ProductImageGallery } from '@/components/products/ProductImageGallery'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ShoppingCart, Minus, Plus, Package, Truck, Shield, ArrowLeft, FileText } from 'lucide-react'
import { useCart } from '@/components/CartContext'

interface Product {
  id: string
  sku: string
  name: string
  slug: string
  description?: string | null
  price: number
  compareAtPrice?: number | null
  images: string[]
  thumbnail?: string | null
  stock: number
  weightKg: number
  dimensions?: any
  hsCode?: string | null
  countryOfOrigin: string
  material?: string | null
  category?: {
    id: string
    name: string
    slug: string
  } | null
  minOrderQty: number
  wholesalePrice?: number | null
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { refreshCartCount } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchProduct()
    }
  }, [slug])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/products/${slug}`)
      const data = await response.json()
      
      if (data.success) {
        setProduct(data.data)
        setQuantity(data.data.minOrderQty || 1)
        setError('')
      } else {
        setError(data.error || 'Product not found')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      setError('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (delta: number) => {
    if (!product) return
    const newQty = quantity + delta
    if (newQty >= product.minOrderQty && newQty <= product.stock) {
      setQuantity(newQty)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return
    
    setAdding(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please login to add items to cart')
        router.push('/login')
        return
      }

      const userId = JSON.parse(atob(token.split('.')[1])).userId

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          productId: product.id,
          quantity
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Item added to cart successfully!')
        refreshCartCount()
      } else {
        alert(data.error || 'Failed to add item to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add item to cart')
    } finally {
      setAdding(false)
    }
  }

  const handleRequestQuote = () => {
    router.push(`/quotes?product=${slug}`)
  }

  if (loading) {
    return (
      <SharedLayout 
        pageTitle="Loading..."
        pageDescription="Please wait while we load the product details"
        breadcrumbs={[{ name: 'Products', href: '/products' }]}
      >
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </SharedLayout>
    )
  }

  if (error || !product) {
    return (
      <SharedLayout 
        pageTitle="Product Not Found"
        pageDescription="The product you are looking for could not be found"
        breadcrumbs={[{ name: 'Products', href: '/products' }]}
      >
        <div className="py-8">
          <Container maxWidth="2xl">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
              <p className="text-red-800 text-lg">{error || 'Product not found'}</p>
              <Button onClick={() => router.push('/products')} className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Button>
            </div>
          </Container>
        </div>
      </SharedLayout>
    )
  }

  const discount = product.compareAtPrice 
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0

  const breadcrumbs = [
    { name: 'Products', href: '/products' },
  ]
  
  if (product.category) {
    breadcrumbs.push({
      name: product.category.name,
      href: `/products?category=${product.category.slug}`
    })
  }
  
  breadcrumbs.push({
    name: product.name,
    href: `/products/${product.slug}`
  })

  return (
    <SharedLayout 
      pageTitle={product.name}
      pageDescription={product.description?.substring(0, 150) || `High-quality ${product.name} from Yiwu Express`}
      breadcrumbs={breadcrumbs}
      backgroundImage="/images/breadcrumb-bg.jpg"
    >
      <div className="bg-gray-50 py-8">
        <Container maxWidth="2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Image Gallery */}
          <div>
            <ProductImageGallery
              images={product.images.length > 0 ? product.images : [product.thumbnail || '']}
              productName={product.name}
            />
          </div>

          {/* Product Info */}
          <div>
            {/* Category & SKU */}
            <div className="flex items-center gap-2 mb-3">
              {product.category && (
                <Badge variant="secondary">{product.category.name}</Badge>
              )}
              <span className="text-sm text-gray-500">SKU: {product.sku}</span>
            </div>

            {/* Product Name */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold text-primary">
                ${product.price.toFixed(2)}
              </span>
              {product.compareAtPrice && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    ${product.compareAtPrice.toFixed(2)}
                  </span>
                  <Badge variant="destructive">-{discount}%</Badge>
                </>
              )}
            </div>

            {/* Wholesale Price */}
            {product.wholesalePrice && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900 mb-1">Wholesale Price Available</p>
                <p className="text-2xl font-bold text-blue-700">
                  ${product.wholesalePrice.toFixed(2)}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Min. Order: {product.minOrderQty} units
                </p>
              </div>
            )}

            {/* Stock Status */}
            <div className="mb-6">
              {product.stock > 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Package className="w-5 h-5" />
                  <span className="font-medium">In Stock ({product.stock} available)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <Package className="w-5 h-5" />
                  <span className="font-medium">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity {product.minOrderQty > 1 && `(Min: ${product.minOrderQty})`}
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= product.minOrderQty}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    if (val >= product.minOrderQty && val <= product.stock) {
                      setQuantity(val)
                    }
                  }}
                  className="w-20 text-center border border-gray-300 rounded-md py-2"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-500 ml-2">
                  Total: ${(product.price * quantity).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={product.stock === 0 || adding}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {adding ? 'Adding...' : 'Add to Cart'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={handleRequestQuote}
              >
                <FileText className="w-5 h-5 mr-2" />
                Request Wholesale Quote
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="w-5 h-5 text-primary" />
                <span>Global Shipping</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-5 h-5 text-primary" />
                <span>Quality Guaranteed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Package className="w-5 h-5 text-primary" />
                <span>Safe Packaging</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Description */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Product Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {product.description || 'No description available.'}
              </p>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Specifications</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Weight</dt>
                  <dd className="font-medium">{product.weightKg} kg</dd>
                </div>
                {product.hsCode && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">HS Code</dt>
                    <dd className="font-medium">{product.hsCode}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-600">Origin</dt>
                  <dd className="font-medium">{product.countryOfOrigin}</dd>
                </div>
                {product.material && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Material</dt>
                    <dd className="font-medium">{product.material}</dd>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Dimensions</dt>
                    <dd className="font-medium">
                      {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
    </SharedLayout>
  )
}
