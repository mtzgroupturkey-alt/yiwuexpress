'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { ProductImageGallery } from '@/components/products/ProductImageGallery'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ShoppingCart, Minus, Plus, Package, Truck, Shield, ArrowLeft, FileText, ChevronDown, ChevronUp, Heart, Share2, Star, Check, MessageCircle, Ruler, RefreshCw, HelpCircle } from 'lucide-react'
import ProductCard from '@/components/products/ProductCard'
import { ReviewSection } from '@/components/products/ReviewSection'
import { TrustBadgesMini } from '@/components/TrustBadgesMini'
import { Eye, Flame } from 'lucide-react'
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
  attributes?: Record<string, any> | null
  categoryAttributes?: Array<{
    id: string
    slug: string
    name: string
    inputType: string
    isRequired: boolean
    isFilterable: boolean
    isVisible: boolean
    displayOrder: number
    options?: string[] | null
    colorOptions?: { label: string; value: string }[] | null
  }> | null
}

interface RelatedProduct {
  id: string
  slug: string
  name: string
  description?: string
  price: number
  image?: string
  category?: string
  stock?: number
  minOrder?: number
  wholesalePrice?: number
  colors?: { label: string; value: string }[]
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { refreshCartCount } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [isSpecificationsExpanded, setIsSpecificationsExpanded] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [showReturnPolicy, setShowReturnPolicy] = useState(false)
  const [viewingCount, setViewingCount] = useState(0)

  useEffect(() => {
    if (slug) {
      fetchProduct()
      fetchRelatedProducts()
      setViewingCount(Math.floor(Math.random() * 35) + 12)
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

  const fetchRelatedProducts = async () => {
    try {
      const response = await fetch(`/api/products/${slug}/related?limit=4`)
      const data = await response.json()
      
      if (data.success) {
        setRelatedProducts(data.data)
      }
    } catch (error) {
      console.error('Error fetching related products:', error)
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
      // ✅ MIGRATED TO COOKIE-BASED AUTH - userId extracted from cookie on server
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Send httpOnly cookie
        body: JSON.stringify({
          productId: product.id,
          quantity
        })
      })

      if (!response.ok) {
        if (response.status === 401) {
          alert('Please login to add items to cart')
          router.push('/login')
          return
        }
        throw new Error('Failed to add item to cart')
      }

      const data = await response.json()
      
      if (data.success) {
        setShowSuccessMessage(true)
        refreshCartCount()
        // Hide success message after 3 seconds
        setTimeout(() => setShowSuccessMessage(false), 3000)
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

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite)
    // TODO: Implement API call to save favorite
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description || '',
        url: window.location.href,
      }).catch(() => {
        setShareMenuOpen(!shareMenuOpen)
      })
    } else {
      setShareMenuOpen(!shareMenuOpen)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Link copied to clipboard!')
    setShareMenuOpen(false)
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
      <div className="bg-gradient-to-b from-gray-50 to-white py-4">
        <Container maxWidth="2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Left Column: Image Gallery + Description + Specs */}
          <div className="lg:col-span-6 animate-fade-in">
            <div className="sticky top-20">
              <ProductImageGallery
                images={product.images.length > 0 ? product.images : [product.thumbnail || '']}
                productName={product.name}
              />
            </div>

            {/* Description & Specifications below images */}
            <div className="mt-4 space-y-4">
              {/* Specifications Card - Compact */}
              <Card className="shadow-md border border-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3">
                  <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'rgb(26, 58, 92)' }}>
                    <FileText className="w-5 h-5" style={{ color: 'rgb(26, 58, 92)' }} />
                    Specifications
                  </h2>
                </div>
                <CardContent className="p-4 bg-gradient-to-br from-white to-gray-50">
                  <dl className="space-y-0.5">{/* Build complete specifications array first */}
                    {(() => {
                      const allSpecs: JSX.Element[] = []
                      
                      // Product Attributes from Category
                      if (product.attributes && Object.entries(product.attributes).length > 0) {
                        if (product.categoryAttributes && product.categoryAttributes.length > 0) {
                          product.categoryAttributes
                            .filter(attr => {
                              const value = product.attributes?.[attr.slug]
                              if (!value) return false
                              if (Array.isArray(value) && value.length === 0) return false
                              return true
                            })
                            .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                            .forEach((attr, idx) => {
                              const value = product.attributes?.[attr.slug]
                              if (!value) return

                              const isColorType = attr.inputType === 'COLOR' || attr.inputType === 'COLOR_MULTI'
                              const colorOpts = attr.colorOptions || []

                              // Color attribute — show swatches
                              if (isColorType) {
                                const colorVals: string[] = Array.isArray(value) ? value : [value]
                                allSpecs.push(
                                  <div key={attr.slug ?? `color-${idx}`} className="py-2 border-b border-gray-200 last:border-0 hover:bg-white px-2 rounded transition-colors">
                                    <div className="flex justify-between items-start gap-2">
                                      <dt className="text-gray-700 font-semibold flex-shrink-0 text-xs">{attr.name}</dt>
                                      <dd className="flex flex-wrap gap-1 justify-end">
                                        {colorVals.map((hex: string, ci) => {
                                          const label = colorOpts.find((c: any) => c.value === hex)?.label || hex
                                          return (
                                            <div key={hex ?? `color-val-${idx}-${ci}`} className="flex items-center gap-1">
                                              <span
                                                className="inline-block w-4 h-4 rounded-full border border-white shadow-sm ring-1 ring-gray-300"
                                                style={{ backgroundColor: hex }}
                                                title={label}
                                              />
                                              <span className="text-xs font-bold text-gray-900">{label}</span>
                                            </div>
                                          )
                                        })}
                                      </dd>
                                    </div>
                                  </div>
                                )
                              } else {
                                // Regular attribute — text display
                                const displayValue = Array.isArray(value) ? value.join(', ') : String(value)
                                allSpecs.push(
                                  <div key={attr.slug ?? `spec-${idx}`} className="flex justify-between items-center py-2 px-2 border-b border-gray-200 last:border-0 hover:bg-white rounded transition-colors">
                                    <dt className="text-gray-700 font-semibold text-xs">{attr.name}</dt>
                                    <dd className="font-bold text-gray-900 text-xs">{displayValue}</dd>
                                  </div>
                                )
                              }
                            })
                        } else {
                          Object.entries(product.attributes)
                            .filter(([, value]) => !!value && !(Array.isArray(value) && value.length === 0))
                            .forEach(([key, value]) => {
                              const displayName = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
                              const displayValue = Array.isArray(value) ? value.join(', ') : String(value)
                              allSpecs.push(
                                <div key={key} className="flex justify-between items-center py-2 px-2 border-b border-gray-200 last:border-0 hover:bg-white rounded transition-colors">
                                  <dt className="text-gray-700 font-semibold text-xs">{displayName}</dt>
                                  <dd className="font-bold text-gray-900 text-xs">{displayValue}</dd>
                                </div>
                              )
                            })
                        }
                      }
                      
                      // Basic Product Info
                      allSpecs.push(
                        <div key="weight" className="flex justify-between py-2 px-2 border-b border-gray-200 hover:bg-white rounded transition-colors">
                          <dt className="text-gray-700 font-semibold text-xs">Weight</dt>
                          <dd className="font-bold text-gray-900 text-xs">{product.weightKg} kg</dd>
                        </div>
                      )
                      
                      if (product.hsCode) {
                        allSpecs.push(
                          <div key="hsCode" className="flex justify-between py-2 px-2 border-b border-gray-200 hover:bg-white rounded transition-colors">
                            <dt className="text-gray-700 font-semibold text-xs">HS Code</dt>
                            <dd className="font-bold text-gray-900 text-xs">{product.hsCode}</dd>
                          </div>
                        )
                      }
                      
                      allSpecs.push(
                        <div key="origin" className="flex justify-between py-2 px-2 border-b border-gray-200 hover:bg-white rounded transition-colors">
                          <dt className="text-gray-700 font-semibold text-xs">Country of Origin</dt>
                          <dd className="font-bold text-gray-900 text-xs">{product.countryOfOrigin}</dd>
                        </div>
                      )
                      
                      if (product.material) {
                        allSpecs.push(
                          <div key="material" className="flex justify-between py-2 px-2 border-b border-gray-200 hover:bg-white rounded transition-colors">
                            <dt className="text-gray-700 font-semibold text-xs">Material</dt>
                            <dd className="font-bold text-gray-900 text-xs">{product.material}</dd>
                          </div>
                        )
                      }
                      
                      if (product.dimensions) {
                        allSpecs.push(
                          <div key="dimensions" className="flex justify-between py-2 px-2 hover:bg-white rounded transition-colors">
                            <dt className="text-gray-700 font-semibold text-xs">Dimensions</dt>
                            <dd className="font-bold text-gray-900 text-xs">
                              {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm
                            </dd>
                          </div>
                        )
                      }

                      // Show preview (first 5 items) or all items
                      const previewCount = 5
                      const specsToShow = isSpecificationsExpanded ? allSpecs : allSpecs.slice(0, previewCount)
                      const hasMore = allSpecs.length > previewCount

                      return (
                        <>
                          {specsToShow}
                          {hasMore && (
                            <div className="pt-3">
                              <button
                                onClick={() => setIsSpecificationsExpanded(!isSpecificationsExpanded)}
                                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 text-gray-800 font-semibold rounded-lg transition-all shadow-sm hover:shadow text-sm"
                              >
                                {isSpecificationsExpanded ? (
                                  <>
                                    <span>Show Less</span>
                                    <ChevronUp className="w-4 h-4" />
                                  </>
                                ) : (
                                  <>
                                    <span>Show All ({allSpecs.length - previewCount} more)</span>
                                    <ChevronDown className="w-4 h-4" />
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column: Product Info */}
          <div className="lg:col-span-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {/* Success Message Toast */}
            {showSuccessMessage && (
              <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-slide-in">
                <div className="bg-white rounded-full p-0.5">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Added to Cart!</p>
                  <p className="text-xs text-green-100">{quantity} item(s) added</p>
                </div>
              </div>
            )}

            {/* Top Action Bar - Favorites & Share */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-xs text-gray-600 ml-1">Rated 4.8 — see reviews below</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleToggleFavorite}
                  className={`p-2 rounded-lg border transition-all hover:scale-105 ${
                    isFavorite 
                      ? 'bg-red-50 border-red-300 text-red-600' 
                      : 'bg-white border-gray-300 text-gray-600 hover:border-red-300'
                  }`}
                  aria-label="Add to favorites"
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <div className="relative">
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-all hover:scale-105"
                    aria-label="Share product"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  {shareMenuOpen && (
                    <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[160px] z-10">
                      <button
                        onClick={copyLink}
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded text-sm transition-colors"
                      >
                        Copy Link
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category & SKU */}
            <div className="flex items-center gap-2 mb-2">
              {product.category && (
                <Badge variant="secondary" className="text-sm px-4 py-1.5">
                  {product.category.name}
                </Badge>
              )}
              {product.stock > 100 && (
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white text-sm px-4 py-1.5 border-0">
                  ⚡ In High Demand
                </Badge>
              )}
              <span className="text-sm text-gray-500 font-medium">SKU: {product.sku}</span>
            </div>

            {/* Product Name */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight">{product.name}</h1>

            {/* Description Card - Compact */}
            <Card className="shadow-md border border-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow mb-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3">
                <h2 className="text-lg font-bold" style={{ color: 'rgb(26, 58, 92)' }}>Product Description</h2>
              </div>
              <CardContent className="pt-5 px-4 pb-4">
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {product.description || 'No description available for this product. Contact us for more details about features, materials, and specifications.'}
                </p>
              </CardContent>
            </Card>

            {/* Price Section - Compact */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-100">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-gradient-gold">
                  ${product.price.toFixed(2)}
                </span>
                {product.compareAtPrice && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      ${product.compareAtPrice.toFixed(2)}
                    </span>
                    <Badge variant="destructive" className="text-xs px-2 py-0.5">
                      SAVE {discount}%
                    </Badge>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-600">Price per unit (excluding taxes)</p>
            </div>

            {/* Wholesale Price - Compact */}
            {product.wholesalePrice && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-300 rounded-lg p-4 mb-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-blue-600 rounded-full p-1.5">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-blue-900">Wholesale Pricing Available</p>
                </div>
                <p className="text-2xl font-bold text-blue-700 mb-1">
                  ${product.wholesalePrice.toFixed(2)}
                </p>
                <p className="text-xs text-blue-600 font-medium">
                  Minimum Order: {product.minOrderQty} units • Save up to {Math.round((1 - product.wholesalePrice / product.price) * 100)}% on bulk orders
                </p>
              </div>
            )}

            {/* Stock Status & Scarcity */}
            <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200 shadow-sm space-y-3">
              {product.stock > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 rounded-full p-1.5">
                    <Package className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-700 text-sm">In Stock</p>
                    <p className="text-xs text-gray-600">{product.stock} units available</p>
                  </div>
                  {product.stock <= 50 && (
                    <Badge variant="destructive" className="animate-pulse bg-red-100 text-red-700 border-red-200 hover:bg-red-200">
                      Only {product.stock} left!
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="bg-red-100 rounded-full p-1.5">
                    <Package className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-700 text-sm">Out of Stock</p>
                    <p className="text-xs text-gray-600">Contact us for restock information</p>
                  </div>
                </div>
              )}
              
              {viewingCount > 0 && (
                <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                  <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span className="text-xs font-medium text-gray-700">
                    <strong className="text-orange-600">{viewingCount} people</strong> are viewing this right now
                  </span>
                </div>
              )}
            </div>

            {/* Quantity Selector - Compact */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Select Quantity {product.minOrderQty > 1 && <span className="text-xs text-gray-600 font-normal">(Minimum: {product.minOrderQty} units)</span>}
              </label>
              <div className="flex items-center gap-3 mb-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= product.minOrderQty}
                  className="h-10 w-10 rounded-lg border hover:border-primary-500 hover:bg-primary-50"
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
                  className="w-20 text-center border border-gray-300 rounded-lg py-2 text-base font-bold focus:border-primary-500 focus:ring-1 focus:ring-primary-200 transition-all"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  className="h-10 w-10 rounded-lg border hover:border-primary-500 hover:bg-primary-50"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="bg-white rounded-md p-3 border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium text-sm">Subtotal:</span>
                  <span className="text-xl font-bold text-primary-600">
                    ${(product.price * quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons - Compact */}
            <div className="flex flex-col gap-3 mb-6">
              <Button
                size="lg"
                className="relative w-full h-12 text-base font-bold shadow-[0_8px_30px_rgb(26,58,92,0.2)] hover:shadow-[0_8px_30px_rgb(26,58,92,0.3)] transition-all rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 bg-[length:200%_auto] hover:bg-right hover:scale-[1.02] overflow-hidden group"
                onClick={handleAddToCart}
                disabled={product.stock === 0 || adding}
              >
                <div className="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <ShoppingCart className="w-5 h-5 mr-2" />
                {adding ? 'Adding to Cart...' : 'Add to Cart'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full h-11 text-base font-semibold border-2 border-primary-600 text-primary-700 hover:bg-primary-50 rounded-lg transition-all"
                onClick={handleRequestQuote}
              >
                <FileText className="w-5 h-5 mr-2" />
                Request Wholesale Quote
              </Button>
            </div>

            {/* Trust Badges - Compact */}
            <TrustBadgesMini className="mb-4" />

            {/* Delivery Estimate - Compact */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 mb-4 border border-blue-200">
              <div className="flex items-start gap-2">
                <div className="bg-blue-500 rounded-full p-1.5 mt-0.5">
                  <Truck className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-0.5 text-sm">Estimated Delivery</h3>
                  <p className="text-xs text-gray-700 mb-1">
                    Get it by <span className="font-bold text-blue-700">{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> - <span className="font-bold text-blue-700">{new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-blue-600">
                    <Check className="w-3 h-3" />
                    <span>Free shipping on orders over $500</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Features Section - Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 mb-6">
          {/* Ask a Question */}
          <Card className="shadow-sm border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowQuestionForm(!showQuestionForm)}>
            <CardContent className="px-4 pt-6 pb-5">
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 rounded-full p-2 flex-shrink-0">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-0.5 text-sm">Have Questions?</h3>
                  <p className="text-xs text-gray-600 mb-2">Our experts are here to help you</p>
                  <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    Ask a Question
                    <ChevronDown className={`w-3 h-3 transition-transform ${showQuestionForm ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
              {showQuestionForm && (
                <div className="mt-3 pt-3 border-t border-gray-200 animate-fade-in">
                  <textarea
                    placeholder="Type your question here..."
                    className="w-full border border-gray-300 rounded-md p-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                    rows={3}
                  />
                  <Button size="sm" className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-xs h-8">
                    Submit Question
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Size Guide */}
          <Card className="shadow-sm border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowSizeGuide(!showSizeGuide)}>
            <CardContent className="px-4 pt-6 pb-5">
              <div className="flex items-start gap-3">
                <div className="bg-purple-50 rounded-full p-2 flex-shrink-0">
                  <Ruler className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-0.5 text-sm">Size Guide</h3>
                  <p className="text-xs text-gray-600 mb-2">Find your perfect fit</p>
                  <button className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1">
                    View Size Chart
                    <ChevronDown className={`w-3 h-3 transition-transform ${showSizeGuide ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
              {showSizeGuide && (
                <div className="mt-3 pt-3 border-t border-gray-200 animate-fade-in">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-1.5 text-left font-semibold">Size</th>
                          <th className="px-2 py-1.5 text-left font-semibold">US</th>
                          <th className="px-2 py-1.5 text-left font-semibold">EU</th>
                          <th className="px-2 py-1.5 text-left font-semibold">UK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr><td className="px-2 py-1.5">S</td><td className="px-2 py-1.5">6-8</td><td className="px-2 py-1.5">36-38</td><td className="px-2 py-1.5">8-10</td></tr>
                        <tr><td className="px-2 py-1.5">M</td><td className="px-2 py-1.5">8-10</td><td className="px-2 py-1.5">38-40</td><td className="px-2 py-1.5">10-12</td></tr>
                        <tr><td className="px-2 py-1.5">L</td><td className="px-2 py-1.5">10-12</td><td className="px-2 py-1.5">40-42</td><td className="px-2 py-1.5">12-14</td></tr>
                        <tr><td className="px-2 py-1.5">XL</td><td className="px-2 py-1.5">12-14</td><td className="px-2 py-1.5">42-44</td><td className="px-2 py-1.5">14-16</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Return Policy */}
          <Card className="shadow-sm border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowReturnPolicy(!showReturnPolicy)}>
            <CardContent className="px-4 pt-6 pb-5">
              <div className="flex items-start gap-3">
                <div className="bg-green-50 rounded-full p-2 flex-shrink-0">
                  <RefreshCw className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-0.5 text-sm">Easy Returns</h3>
                  <p className="text-xs text-gray-600 mb-2">30-day return policy</p>
                  <button className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
                    Learn More
                    <ChevronDown className={`w-3 h-3 transition-transform ${showReturnPolicy ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
              {showReturnPolicy && (
                <div className="mt-3 pt-3 border-t border-gray-200 animate-fade-in">
                  <ul className="space-y-1.5 text-xs text-gray-700">
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>30-day return window</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Free return shipping</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Full refund guarantee</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>No questions asked</span>
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer Support Callout - Compact */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-5 mb-6 shadow-md border border-blue-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2.5 backdrop-blur-sm border border-white/30">
                <MessageCircle className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <h3 className="text-base font-bold mb-0.5 text-gray-900">Need Help Deciding?</h3>
                <p className="text-gray-800 text-sm">Chat with our experts - 24/7</p>
              </div>
            </div>
            <Button
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-6 shadow-md hover:shadow-lg transition-all text-sm h-10"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Start Live Chat
            </Button>
          </div>
        </div>

        {/* Related Products Section - Compact */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-0.5">You May Also Like</h2>
                <p className="text-gray-600 text-sm">Discover similar products from our collection</p>
              </div>
              {product.category && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/products?category=${product.category?.slug}`)}
                  className="border border-primary-600 text-primary-700 hover:bg-primary-50 font-semibold rounded-lg px-4 text-sm h-9"
                >
                  View All in {product.category.name}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  onAddToCart={async (productId) => {
                    try {
                      // ✅ MIGRATED TO COOKIE-BASED AUTH - cookies sent automatically
                      const response = await fetch('/api/cart', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          productId,
                          quantity: 1
                        })
                      })

                      if (!response.ok) {
                        if (response.status === 401) {
                          alert('Please login to add items to cart')
                          router.push('/login')
                          return
                        }
                        throw new Error('Failed to add item')
                      }

                      const data = await response.json()
                      
                      if (data.success) {
                        refreshCartCount()
                      } else {
                        alert(data.error || 'Failed to add item to cart')
                      }
                    } catch (error) {
                      console.error('Error adding to cart:', error)
                      alert('Failed to add item to cart')
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Customer Reviews and FAQ Section - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Customer Reviews Section - Dynamic */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <ReviewSection productId={product.id} productName={product.name} />
          </div>

          {/* FAQ Section - Compact */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-gray-900 mb-0.5">Frequently Asked Questions</h2>
            <p className="text-gray-600 text-xs">Get quick answers to common questions</p>
          </div>

          <div className="space-y-2">
            {[
              {
                q: "What is the minimum order quantity?",
                a: `The minimum order quantity for this product is ${product.minOrderQty} units. However, wholesale pricing is available for larger orders.`
              },
              {
                q: "What is the shipping time?",
                a: "Standard shipping takes 7-14 business days. Express shipping options are available at checkout for faster delivery."
              },
              {
                q: "Do you offer bulk discounts?",
                a: "Yes! We offer competitive wholesale pricing for bulk orders. Contact our sales team for custom quotes on large quantities."
              },
              {
                q: "What is your return policy?",
                a: "We offer a 30-day return policy. Products must be unused and in original packaging. Return shipping is free for defective items."
              },
              {
                q: "Can I customize this product?",
                a: "Yes, customization is available for orders over 500 units. Contact us to discuss your specific requirements and branding options."
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                <div className="flex items-start gap-2">
                  <div className="bg-primary-100 rounded-full p-1.5 flex-shrink-0 mt-0.5">
                    <HelpCircle className="w-3.5 h-3.5 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-0.5 text-sm">{faq.q}</h4>
                    <p className="text-gray-700 leading-relaxed text-xs">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2">
              <div className="bg-blue-500 rounded-full p-1.5">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-0 text-xs">Still have questions?</h4>
                <p className="text-gray-700 text-xs">Our support team is ready to help</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 text-xs h-8">
                Contact Support
              </Button>
            </div>
          </div>
        </div>
        </div>
      </Container>
    </div>
    </SharedLayout>
  )
}
