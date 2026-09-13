'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Scale,
  Menu,
  X,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  Truck,
  Lock,
  RotateCcw,
  Shield,
  Star
} from 'lucide-react'
import { useCompanyName } from '@/hooks/useCompanyName'

// Product Item Type
export interface Product {
  id: number
  name: string
  price: number
  oldPrice?: number
  image: string
  category: string
  badge?: 'SALE' | 'NEW' | 'HIT'
  rating: number
  reviews: number
}

// Cart Item Type
export interface CartItem extends Product {
  qty: number
}

// 1. DATASETS EXTRACTED DIRECTLY FROM FIGMA MAKE DESIGN
const SLIDES = [
  {
    bg: 'linear-gradient(135deg, #0f3460 0%, #16213e 100%)',
    image: 'https://images.unsplash.com/photo-1526406915894-7bcd65f60845?w=900&h=500&fit=crop&auto=format',
    tag: 'НОВИНКИ СЕЗОНА',
    tagColor: '#f59e0b',
    title: 'MacBook Pro M4 Pro\n— уже в наличии',
    sub: 'Рассрочка 0% · Гарантия 2 года · Быстрая доставка',
    btn: 'Смотреть →',
    btnColor: '#e63946'
  },
  {
    bg: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    image: 'https://images.unsplash.com/photo-1593697909822-5d9da12b4680?w=900&h=500&fit=crop&auto=format',
    tag: 'ХИТ ПРОДАЖ',
    tagColor: '#fbbf24',
    title: 'Samsung Galaxy S25 Ultra\nот 3 299 ₽',
    sub: 'Trade-in до 15 000 ₽ · Подарок при покупке',
    btn: 'Купить →',
    btnColor: '#e63946'
  },
  {
    bg: 'linear-gradient(135deg, #0891b2, #0f3460)',
    image: 'https://images.unsplash.com/photo-1696710257827-75e2e5954059?w=900&h=500&fit=crop&auto=format',
    tag: 'ИГРОВОЙ СЕЗОН',
    tagColor: '#4ade80',
    title: 'PlayStation 5 Pro\nв наличии!',
    sub: 'Без наценок · Бесплатная доставка · Гарантия',
    btn: 'Заказать →',
    btnColor: '#16a34a'
  },
  {
    bg: 'linear-gradient(135deg, #be185d, #9f1239)',
    image: 'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=900&h=500&fit=crop&auto=format',
    tag: 'ФЕСТИВАЛЬ LG',
    tagColor: '#fbbf24',
    title: 'LG OLED 4K Smart TV\nСкидки до 40%',
    sub: 'Дополнительная скидка по кредиту банка',
    btn: 'Все ТВ →',
    btnColor: '#f59e0b'
  }
]

const NAV_CATEGORIES = [
  'Смартфоны',
  'Ноутбуки',
  'Планшеты',
  'Аудио',
  'Телевизоры',
  'Техника',
  'Игры',
  'Распродажа 🔥'
]

const CATALOG_ICONS = [
  { name: 'Смартфоны', icon: '📱', count: 847 },
  { name: 'Ноутбуки', icon: '💻', count: 423 },
  { name: 'Планшеты', icon: '📟', count: 215 },
  { name: 'Телевизоры', icon: '📺', count: 178 },
  { name: 'Аудио', icon: '🎧', count: 634 },
  { name: 'Умные часы', icon: '⌚', count: 312 },
  { name: 'Фото/Видео', icon: '📷', count: 289 },
  { name: 'Игры', icon: '🎮', count: 456 },
  { name: 'Холодильники', icon: '🧊', count: 198 },
  { name: 'Стиральные', icon: '🫧', count: 234 },
  { name: 'Пылесосы', icon: '🌀', count: 187 },
  { name: 'Телефоны', icon: '☎️', count: 95 },
  { name: 'Принтеры', icon: '🖨️', count: 143 },
  { name: 'Мониторы', icon: '🖥️', count: 267 },
  { name: 'Видеокарты', icon: '🔲', count: 112 },
  { name: 'Аксессуары', icon: '🔌', count: 1204 },
  { name: 'Электросамокат', icon: '🛴', count: 87 },
  { name: 'Умный дом', icon: '🏠', count: 321 }
]

const BRANDS = [
  'Apple', 'Samsung', 'Sony', 'LG', 'Xiaomi', 'Huawei',
  'Bose', 'HP', 'Lenovo', 'Asus', 'Dell', 'Dyson',
  'Bosch', 'Philips', 'Canon', 'Nikon', 'JBL', 'Garmin'
]

// Product category lists from Figma site
const SMARTPHONES: Product[] = [
  { id: 1, name: 'Samsung Galaxy S25 Ultra 256GB', price: 3299, oldPrice: 3799, image: 'https://images.unsplash.com/photo-1593697909822-5d9da12b4680?w=400&h=400&fit=crop&auto=format', category: 'Смартфоны', badge: 'SALE', rating: 4.8, reviews: 312 },
  { id: 2, name: 'iPhone 16 Pro Max 512GB Natural', price: 5799, image: 'https://images.unsplash.com/photo-1563119689-8a82b83a7510?w=400&h=400&fit=crop&auto=format', category: 'Смартфоны', badge: 'NEW', rating: 4.9, reviews: 521 },
  { id: 3, name: 'Xiaomi 14 Ultra 512GB Black', price: 2499, oldPrice: 2899, image: 'https://images.unsplash.com/photo-1620783770629-122b7f187703?w=400&h=400&fit=crop&auto=format', category: 'Смартфоны', badge: 'SALE', rating: 4.6, reviews: 187 },
  { id: 4, name: 'Google Pixel 9 Pro 256GB Porcelain', price: 2999, image: 'https://images.unsplash.com/photo-1515940175183-6798529cb860?w=400&h=400&fit=crop&auto=format', category: 'Смартфоны', rating: 4.7, reviews: 94 }
]

const LAPTOPS: Product[] = [
  { id: 10, name: 'Apple MacBook Pro 14" M4 Pro', price: 7499, oldPrice: 8299, image: 'https://images.unsplash.com/photo-1589979034086-5885b60c8f59?w=400&h=400&fit=crop&auto=format', category: 'Ноутбуки', badge: 'HIT', rating: 4.9, reviews: 198 },
  { id: 11, name: 'ASUS ROG Zephyrus G16 RTX 4080', price: 4999, oldPrice: 5499, image: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?w=400&h=400&fit=crop&auto=format', category: 'Ноутбуки', badge: 'SALE', rating: 4.7, reviews: 143 },
  { id: 12, name: 'Lenovo ThinkPad X1 Carbon Gen 12', price: 3799, image: 'https://images.unsplash.com/photo-1526406915894-7bcd65f60845?w=400&h=400&fit=crop&auto=format', category: 'Ноутбуки', rating: 4.6, reviews: 88 },
  { id: 13, name: 'HP Spectre x360 14 OLED', price: 3299, oldPrice: 3699, image: 'https://images.unsplash.com/photo-1579362243176-b746a02bc030?w=400&h=400&fit=crop&auto=format', category: 'Ноутбуки', badge: 'SALE', rating: 4.5, reviews: 76 }
]

const TVS: Product[] = [
  { id: 20, name: 'Samsung Neo QLED 8K 65" QN900D', price: 8999, oldPrice: 11999, image: 'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=400&h=400&fit=crop&auto=format', category: 'Телевизоры', badge: 'SALE', rating: 4.8, reviews: 67 },
  { id: 21, name: 'LG OLED evo C4 55" 4K Smart TV', price: 4499, oldPrice: 5299, image: 'https://images.unsplash.com/photo-1646861039459-fd9e3aabf3fb?w=400&h=400&fit=crop&auto=format', category: 'Телевизоры', badge: 'HIT', rating: 4.9, reviews: 234 },
  { id: 22, name: 'Sony Bravia 7 75" Mini LED 4K', price: 6799, image: 'https://images.unsplash.com/photo-1586899028174-e7098604235b?w=400&h=400&fit=crop&auto=format', category: 'Телевизоры', badge: 'NEW', rating: 4.7, reviews: 41 },
  { id: 23, name: 'Hisense U8N 65" ULED 4K 144Hz', price: 3199, oldPrice: 3799, image: 'https://images.unsplash.com/photo-1692188071339-2825a8a997f1?w=400&h=400&fit=crop&auto=format', category: 'Телевизоры', badge: 'SALE', rating: 4.5, reviews: 119 }
]

const AUDIO: Product[] = [
  { id: 30, name: 'Sony WH-1000XM5 Headphones Black', price: 1199, oldPrice: 1499, image: 'https://images.unsplash.com/photo-1593652501996-01c8e515345d?w=400&h=400&fit=crop&auto=format', category: 'Аудио', badge: 'SALE', rating: 4.7, reviews: 445 },
  { id: 31, name: 'Apple AirPods Pro 2 USB-C', price: 1599, image: 'https://images.unsplash.com/photo-1648316316198-5f15553e55df?w=400&h=400&fit=crop&auto=format', category: 'Аудио', badge: 'HIT', rating: 4.8, reviews: 876 },
  { id: 32, name: 'Bose QuietComfort Ultra Headphones', price: 1699, oldPrice: 1999, image: 'https://images.unsplash.com/photo-1519335553051-96f1218cd5fa?w=400&h=400&fit=crop&auto=format', category: 'Аудио', badge: 'SALE', rating: 4.6, reviews: 213 },
  { id: 33, name: 'JBL Xtreme 4 Portable Speaker', price: 599, oldPrice: 749, image: 'https://images.unsplash.com/photo-1602526432604-029a709e131c?w=400&h=400&fit=crop&auto=format', category: 'Аудио', rating: 4.5, reviews: 328 }
]

const APPLIANCES: Product[] = [
  { id: 40, name: 'Bosch Serie 8 Washing Machine 9kg', price: 2299, oldPrice: 2799, image: 'https://images.unsplash.com/photo-1622473590925-e3616c0a41bf?w=400&h=400&fit=crop&auto=format', category: 'Техника', badge: 'SALE', rating: 4.7, reviews: 156 },
  { id: 41, name: 'Samsung French Door Refrigerator 600L', price: 4599, oldPrice: 5299, image: 'https://images.unsplash.com/photo-1588854337115-1c67d9247e4d?w=400&h=400&fit=crop&auto=format', category: 'Техника', badge: 'HIT', rating: 4.6, reviews: 89 },
  { id: 42, name: 'LG Front Load Washer-Dryer Combo', price: 3199, image: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=400&h=400&fit=crop&auto=format', category: 'Техника', badge: 'NEW', rating: 4.5, reviews: 44 },
  { id: 43, name: 'Miele Freestanding Dishwasher G7000', price: 1899, oldPrice: 2199, image: 'https://images.unsplash.com/photo-1585314293845-4db3b9d0c6e9?w=400&h=400&fit=crop&auto=format', category: 'Техника', badge: 'SALE', rating: 4.4, reviews: 67 }
]

const GAMING: Product[] = [
  { id: 50, name: 'Sony PlayStation 5 Pro 2TB', price: 3999, image: 'https://images.unsplash.com/photo-1696710257827-75e2e5954059?w=400&h=400&fit=crop&auto=format', category: 'Игры', badge: 'NEW', rating: 4.9, reviews: 1204 },
  { id: 51, name: 'ASUS ROG Swift Pro PG248QP 360Hz', price: 2499, oldPrice: 2899, image: 'https://images.unsplash.com/photo-1626218174358-7769486c4b79?w=400&h=400&fit=crop&auto=format', category: 'Игры', badge: 'SALE', rating: 4.7, reviews: 87 },
  { id: 52, name: 'Razer Blade 16 RTX 4090 240Hz', price: 8999, image: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?w=400&h=400&fit=crop&auto=format', category: 'Игры', badge: 'HIT', rating: 4.8, reviews: 143 },
  { id: 53, name: 'Gaming PC Setup — RGB Monitor 27"', price: 1899, oldPrice: 2299, image: 'https://images.unsplash.com/photo-1614179924047-e1ab49a0a0cf?w=400&h=400&fit=crop&auto=format', category: 'Игры', badge: 'SALE', rating: 4.6, reviews: 56 }
]

const CAMERAS: Product[] = [
  { id: 60, name: 'Sony Alpha A7 IV Mirrorless 33MP', price: 5499, oldPrice: 6299, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop&auto=format', category: 'Фото/Видео', badge: 'SALE', rating: 4.9, reviews: 178 },
  { id: 61, name: 'Canon EOS R8 Full Frame Mirrorless', price: 3299, image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=400&fit=crop&auto=format', category: 'Фото/Видео', badge: 'NEW', rating: 4.7, reviews: 92 },
  { id: 62, name: 'DJI Osmo Pocket 3 Creator Combo', price: 1299, oldPrice: 1499, image: 'https://images.unsplash.com/photo-1495745966610-2a67f2297e5e?w=400&h=400&fit=crop&auto=format', category: 'Фото/Видео', badge: 'HIT', rating: 4.8, reviews: 321 },
  { id: 63, name: 'Nikon Z6 III 24.5MP Full Frame', price: 4799, image: 'https://images.unsplash.com/photo-1615655406736-b37c4fabf923?w=400&h=400&fit=crop&auto=format', category: 'Фото/Видео', rating: 4.6, reviews: 54 }
]

const WATCHES: Product[] = [
  { id: 70, name: 'Apple Watch Ultra 2 49mm Titanium', price: 2999, oldPrice: 3299, image: 'https://images.unsplash.com/photo-1519335553051-96f1218cd5fa?w=400&h=400&fit=crop&auto=format', category: 'Умные часы', badge: 'SALE', rating: 4.7, reviews: 203 },
  { id: 71, name: 'Samsung Galaxy Watch 7 Ultra 47mm', price: 1899, image: 'https://images.unsplash.com/photo-1602526432604-029a709e131c?w=400&h=400&fit=crop&auto=format', category: 'Умные часы', badge: 'NEW', rating: 4.6, reviews: 118 },
  { id: 72, name: 'Garmin Fenix 8 Solar 51mm', price: 3499, oldPrice: 3999, image: 'https://images.unsplash.com/photo-1648316316198-5f15553e55df?w=400&h=400&fit=crop&auto=format', category: 'Умные часы', badge: 'SALE', rating: 4.8, reviews: 89 },
  { id: 73, name: 'Xiaomi Smart Band 9 Pro', price: 299, oldPrice: 399, image: 'https://images.unsplash.com/photo-1593652501996-01c8e515345d?w=400&h=400&fit=crop&auto=format', category: 'Умные часы', rating: 4.4, reviews: 674 }
]

const ALL_PRODUCTS = [
  ...SMARTPHONES,
  ...LAPTOPS,
  ...TVS,
  ...AUDIO,
  ...APPLIANCES,
  ...GAMING,
  ...CAMERAS,
  ...WATCHES
]

// Star Rating Component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`w-3 h-3 ${star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
        />
      ))}
    </div>
  )
}

// Product Card Component matching Figma Make exactly
function FigmaProductCard({
  product,
  onAddToCart
}: {
  product: Product
  onAddToCart: (p: Product) => void
}) {
  const [isLiked, setIsLiked] = useState(false)
  const discountPercent = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group flex flex-col">
      <div className="relative bg-slate-50 aspect-square overflow-hidden">
        {product.badge && (
          <span
            className="absolute top-2 left-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded text-white"
            style={{
              background:
                product.badge === 'NEW'
                  ? '#0f3460'
                  : product.badge === 'HIT'
                  ? '#7c3aed'
                  : '#e63946'
            }}
          >
            {product.badge}
          </span>
        )}

        {discountPercent && (
          <span className="absolute top-2 right-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400 text-white">
            -{discountPercent}%
          </span>
        )}

        <button
          type="button"
          onClick={() => setIsLiked(!isLiked)}
          className="absolute bottom-2 right-2 z-10 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="В избранное"
        >
          <Heart
            className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#e63946] text-[#e63946]' : 'text-slate-400'}`}
          />
        </button>

        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-3 flex flex-col flex-1">
        <p className="text-[10px] text-slate-400 font-medium mb-1">{product.category}</p>
        <h3 className="text-xs font-semibold text-slate-800 leading-snug mb-2 line-clamp-2 flex-1">
          {product.name}
        </h3>

        <div className="flex items-center gap-1.5 mb-2">
          <StarRating rating={product.rating} />
          <span className="text-[10px] text-slate-400">({product.reviews})</span>
        </div>

        <div className="flex items-end gap-1.5 mb-3">
          <span className="text-base font-bold text-slate-900">
            {product.price.toLocaleString('ru-RU')} ₽
          </span>
          {product.oldPrice && (
            <span className="text-xs text-slate-400 line-through mb-0.5">
              {product.oldPrice.toLocaleString('ru-RU')} ₽
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onAddToCart(product)}
          className="w-full py-2 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer"
          style={{ background: '#0f3460' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#16213e')}
          onMouseLeave={e => (e.currentTarget.style.background = '#0f3460')}
        >
          В корзину
        </button>
      </div>
    </div>
  )
}

// Section Header with Title & Action Link
function SectionHeader({
  title,
  link = 'Смотреть все →'
}: {
  title: string
  link?: string
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
        {title}
      </h2>
      <button
        type="button"
        className="text-sm font-medium hover:underline cursor-pointer"
        style={{ color: '#0f3460' }}
      >
        {link}
      </button>
    </div>
  )
}

// Horizontal Scroll Product Strip
function HorizontalProductStrip({
  products,
  onAddToCart
}: {
  products: Product[]
  onAddToCart: (p: Product) => void
}) {
  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
      {products.map(p => (
        <div key={p.id} className="shrink-0 w-52">
          <FigmaProductCard product={p} onAddToCart={onAddToCart} />
        </div>
      ))}
    </div>
  )
}

// Grid of Products (4 columns on desktop)
function ProductGrid({
  products,
  onAddToCart
}: {
  products: Product[]
  onAddToCart: (p: Product) => void
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map(p => (
        <FigmaProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
      ))}
    </div>
  )
}

export default function FigmaStorePage() {
  const companyName = useCompanyName()

  // State
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  // Countdown timer: 05:43:17
  const [timeLeft, setTimeLeft] = useState({ h: 5, m: 43, s: 17 })

  // Auto slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev
        s--
        if (s < 0) {
          s = 59
          m--
        }
        if (m < 0) {
          m = 59
          h--
        }
        if (h < 0) {
          h = 23
          m = 59
          s = 59
        }
        return { h, m, s }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Cart actions
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id: number, qty: number) => {
    if (qty <= 0) return removeFromCart(id)
    setCart(prev => prev.map(item => (item.id === id ? { ...item, qty } : item)))
  }

  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  // Search filter
  const searchResults = searchQuery.trim()
    ? ALL_PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const pad = (n: number) => String(n).padStart(2, '0')
  const slide = SLIDES[currentSlide]

  return (
    <div className="min-h-full flex flex-col bg-[#f0f2f5] text-[#1a1a2e] font-sans">
      {/* 1. TOP PROMO BANNER */}
      <aside aria-label="Промо-акция" className="text-white text-xs py-2 text-center font-medium tracking-wide bg-[#e63946]">
        🔥 Бесплатная доставка при заказе от 2 000 ₽ &nbsp;·&nbsp; Рассрочка 0% до 24 мес &nbsp;·&nbsp; Гарантия 2 года &nbsp;·&nbsp;
        <span className="underline cursor-pointer">Пункты выдачи по всему городу</span>
      </aside>

      {/* 2. HEADER */}
      <header className="bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 h-16">
            {/* Store Brand / Logo */}
            <div className="flex items-center shrink-0">
              <Link href="/" className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xs"
                  style={{ background: '#0f3460' }}
                >
                  D2
                </div>
                <span className="text-xl font-extrabold tracking-tight" style={{ color: '#0f3460' }}>
                  Design 2
                </span>
              </Link>
            </div>

            {/* Desktop Search Bar */}
            <div className="flex-1 max-w-2xl mx-4 hidden sm:flex relative">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск товаров, брендов, категорий..."
                className="flex-1 h-10 px-4 text-sm border border-r-0 border-slate-200 rounded-l-lg focus:outline-none focus:border-blue-400 bg-slate-50"
              />
              <button
                type="button"
                className="h-10 px-5 rounded-r-lg text-white text-sm flex items-center justify-center cursor-pointer"
                style={{ background: '#0f3460' }}
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Instant Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 max-h-80 overflow-y-auto">
                  {searchResults.slice(0, 6).map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer"
                      onClick={() => {
                        addToCart(item)
                        setSearchQuery('')
                      }}
                    >
                      <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-slate-50">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                        <p className="text-xs font-bold" style={{ color: '#0f3460' }}>
                          {item.price.toLocaleString('ru-RU')} ₽
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                className="hidden sm:flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-600 cursor-pointer"
              >
                <User className="w-5 h-5" />
                <span className="text-[10px] font-medium">Войти</span>
              </button>

              <button
                type="button"
                className="hidden sm:flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-600 cursor-pointer"
              >
                <Heart className="w-5 h-5" />
                <span className="text-[10px] font-medium">Избранное</span>
              </button>

              <button
                type="button"
                className="hidden sm:flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-600 cursor-pointer"
              >
                <Scale className="w-5 h-5" />
                <span className="text-[10px] font-medium">Сравнение</span>
              </button>

              {/* Cart Drawer Trigger */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-600 relative cursor-pointer"
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {totalCartCount > 0 && (
                    <span
                      className="absolute -top-2 -right-2 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                      style={{ background: '#e63946', width: 18, height: 18 }}
                    >
                      {totalCartCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">Корзина</span>
              </button>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                className="sm:hidden p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="sm:hidden pb-3">
            <div className="flex">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск..."
                className="flex-1 h-9 px-3 text-sm border border-r-0 border-slate-200 rounded-l-lg focus:outline-none bg-slate-50"
              />
              <button
                type="button"
                className="h-9 px-4 rounded-r-lg text-white"
                style={{ background: '#0f3460' }}
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories Strip */}
        <div style={{ background: '#0f3460' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center overflow-x-auto no-scrollbar">
              {NAV_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className="px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer"
                  style={
                    cat.includes('🔥')
                      ? { color: '#fbbf24' }
                      : { color: 'rgba(255,255,255,0.8)' }
                  }
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#fff'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = cat.includes('🔥')
                      ? '#fbbf24'
                      : 'rgba(255,255,255,0.8)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="bg-white border-b border-slate-100 shadow-lg sm:hidden z-30 relative">
          <div className="px-4 py-3 space-y-1">
            {[
              'Войти в аккаунт',
              'Избранное',
              'Сравнение',
              'Доставка и оплата',
              'Возврат товара',
              'Помощь'
            ].map(item => (
              <button
                key={item}
                type="button"
                className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. MAIN PAGE CONTENT */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 py-6">
          {/* SECTION 1: HERO SLIDER & 2 PROMO TILES */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Slider (lg:col-span-2) */}
              <div
                className="lg:col-span-2 rounded-2xl overflow-hidden relative h-72 sm:h-80 flex items-end"
                style={{ background: slide.bg }}
              >
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  <Image
                    src={slide.image}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover opacity-25 transition-opacity duration-700"
                  />
                </div>

                <div className="relative z-10 p-7 pb-8 flex-1">
                  <span
                    className="inline-block text-slate-900 text-xs font-bold px-3 py-1 rounded-full mb-3"
                    style={{ background: slide.tagColor }}
                  >
                    {slide.tag}
                  </span>
                  <h1 className="text-white text-2xl sm:text-3xl font-bold leading-tight mb-2 whitespace-pre-line font-sans">
                    {slide.title}
                  </h1>
                  <p className="text-white/70 text-sm mb-5">{slide.sub}</p>
                  <button
                    type="button"
                    className="px-6 py-2.5 rounded-lg font-semibold text-sm text-white cursor-pointer"
                    style={{ background: slide.btnColor }}
                  >
                    {slide.btn}
                  </button>
                </div>

                {/* Slider dots */}
                <div className="absolute bottom-4 right-5 flex gap-1.5 z-10">
                  {SLIDES.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      className="rounded-full transition-all duration-300 cursor-pointer"
                      style={{
                        width: idx === currentSlide ? 20 : 8,
                        height: 8,
                        background:
                          idx === currentSlide ? '#fff' : 'rgba(255,255,255,0.4)'
                      }}
                      aria-label={`Слайд ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* 2 Right Promo Cards */}
              <div className="flex flex-col gap-4">
                <div
                  className="rounded-2xl overflow-hidden relative h-36 flex items-end"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                >
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1593697909822-5d9da12b4680?w=500&h=300&fit=crop&auto=format"
                      alt=""
                      fill
                      sizes="33vw"
                      className="object-cover opacity-25"
                    />
                  </div>
                  <div className="relative z-10 p-5">
                    <p className="text-white/80 text-xs font-medium mb-1">Лучшая цена</p>
                    <p className="text-white font-bold text-lg leading-tight font-sans">
                      Смартфоны<br />от 4 999 ₽
                    </p>
                  </div>
                </div>

                <div
                  className="rounded-2xl overflow-hidden relative h-36 flex items-end"
                  style={{ background: 'linear-gradient(135deg, #0891b2, #0f3460)' }}
                >
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1593652501996-01c8e515345d?w=500&h=300&fit=crop&auto=format"
                      alt=""
                      fill
                      sizes="33vw"
                      className="object-cover opacity-25"
                    />
                  </div>
                  <div className="relative z-10 p-5">
                    <p className="text-white/80 text-xs font-medium mb-1">Скидки до 40%</p>
                    <p className="text-white font-bold text-lg leading-tight font-sans">
                      Аудиотехника<br />Sony, Bose, JBL
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: 18 CATALOG CATEGORIES GRID */}
          <section>
            <SectionHeader title="Каталог товаров" />
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-2">
              {CATALOG_ICONS.map(item => (
                <button
                  key={item.name}
                  type="button"
                  className="flex flex-col items-center gap-1.5 p-2.5 bg-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group col-span-1 cursor-pointer"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-[10px] font-medium text-slate-700 group-hover:text-blue-700 text-center leading-tight">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* SECTION 3: DAILY DEAL STRIP WITH LIVE COUNTDOWN TIMER */}
          <section>
            <div
              className="rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{ background: 'linear-gradient(135deg, #e63946, #c1121f)' }}
            >
              <div>
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">
                  ⏰ Предложение дня
                </p>
                <h2 className="text-white text-xl sm:text-2xl font-bold font-sans">
                  Скидки до 50% на электронику
                </h2>
                <p className="text-white/70 text-sm mt-1">
                  Только сегодня · Без промокодов · Ограниченный остаток
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {/* Live Countdown Timer */}
                <div className="flex items-center gap-1.5">
                  {[pad(timeLeft.h), pad(timeLeft.m), pad(timeLeft.s)].map((val, idx) => (
                    <span key={idx} className="flex items-center gap-1">
                      <span className="bg-white/20 rounded px-2 py-0.5 text-white font-mono font-bold text-sm tabular-nums">
                        {val}
                      </span>
                      {idx < 2 && <span className="text-white font-bold">:</span>}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  className="px-6 py-2.5 bg-white rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                  style={{ color: '#e63946' }}
                >
                  Все акции →
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 4: 🔥 ХИТЫ ПРОДАЖ (Horizontal Scroll) */}
          <section>
            <SectionHeader title="🔥 Хиты продаж" />
            <HorizontalProductStrip
              products={[...SMARTPHONES, ...AUDIO].slice(0, 6)}
              onAddToCart={addToCart}
            />
          </section>

          {/* SECTION 5: 📱 СМАРТФОНЫ (Grid 4 items) */}
          <section>
            <SectionHeader title="📱 Смартфоны" />
            <ProductGrid products={SMARTPHONES} onAddToCart={addToCart} />
          </section>

          {/* SECTION 6: 3 PROMOTIONAL TILES */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                bg: 'linear-gradient(135deg, #16213e, #0f3460)',
                img: 'https://images.unsplash.com/photo-1526406915894-7bcd65f60845?w=600&h=250&fit=crop&auto=format',
                tag: 'РАССРОЧКА 0%',
                title: 'MacBook & iMac\nдо 24 месяцев'
              },
              {
                bg: 'linear-gradient(135deg, #065f46, #047857)',
                img: 'https://images.unsplash.com/photo-1696710257827-75e2e5954059?w=600&h=250&fit=crop&auto=format',
                tag: 'НОВИНКА',
                title: 'PlayStation 5 Pro\nв наличии!'
              },
              {
                bg: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                img: 'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=600&h=250&fit=crop&auto=format',
                tag: 'ТВ ФЕСТИВАЛЬ',
                title: 'LG OLED & Samsung\nскидки до 40%'
              }
            ].map((card, idx) => (
              <div
                key={idx}
                className="rounded-2xl overflow-hidden relative h-40 flex items-end cursor-pointer group"
                style={{ background: card.bg }}
              >
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  <Image
                    src={card.img}
                    alt=""
                    fill
                    sizes="33vw"
                    className="object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                  />
                </div>
                <div className="relative z-10 p-5">
                  <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">
                    {card.tag}
                  </p>
                  <p className="text-white font-bold text-base leading-tight whitespace-pre-line font-sans">
                    {card.title}
                  </p>
                </div>
              </div>
            ))}
          </section>

          {/* SECTION 7: 💻 НОУТБУКИ */}
          <section>
            <SectionHeader title="💻 Ноутбуки" />
            <ProductGrid products={LAPTOPS} onAddToCart={addToCart} />
          </section>

          {/* SECTION 8: 📺 ТЕЛЕВИЗОРЫ */}
          <section>
            <SectionHeader title="📺 Телевизоры" />
            <ProductGrid products={TVS} onAddToCart={addToCart} />
          </section>

          {/* SECTION 9: LARGE HOME APPLIANCES BANNER */}
          <section>
            <div
              className="rounded-2xl overflow-hidden relative h-52 flex items-center"
              style={{
                background: 'linear-gradient(120deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)'
              }}
            >
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1588854337115-1c67d9247e4d?w=1200&h=400&fit=crop&auto=format"
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover opacity-15"
                />
              </div>
              <div className="relative z-10 px-8 sm:px-12 max-w-lg">
                <span className="inline-block bg-amber-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  СЕЗОН ТЕХНИКИ ДЛЯ ДОМА
                </span>
                <h2 className="text-white text-2xl sm:text-3xl font-bold mb-2 font-sans">
                  Стиральные машины,<br />холодильники, посудомойки
                </h2>
                <p className="text-white/60 text-sm mb-4">
                  Bosch, LG, Samsung — официальные дилеры
                </p>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-lg text-white font-semibold text-sm cursor-pointer"
                  style={{ background: '#e63946' }}
                >
                  Смотреть технику →
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 10: 🏠 БЫТОВАЯ ТЕХНИКА */}
          <section>
            <SectionHeader title="🏠 Бытовая техника" />
            <ProductGrid products={APPLIANCES} onAddToCart={addToCart} />
          </section>

          {/* SECTION 11: 🎧 АУДИОТЕХНИКА */}
          <section>
            <SectionHeader title="🎧 Аудиотехника" />
            <ProductGrid products={AUDIO} onAddToCart={addToCart} />
          </section>

          {/* SECTION 12: ⌚ УМНЫЕ ЧАСЫ И БРАСЛЕТЫ */}
          <section>
            <SectionHeader title="⌚ Умные часы и браслеты" />
            <ProductGrid products={WATCHES} onAddToCart={addToCart} />
          </section>

          {/* SECTION 13: 📷 ФОТО И ВИДЕО */}
          <section>
            <SectionHeader title="📷 Фото и видео" />
            <ProductGrid products={CAMERAS} onAddToCart={addToCart} />
          </section>

          {/* SECTION 14: ✨ НОВИНКИ — ТОЛЬКО ПОСТУПИЛИ */}
          <section>
            <SectionHeader title="✨ Новинки — только поступили" />
            <HorizontalProductStrip
              products={[
                SMARTPHONES[1],
                GAMING[0],
                CAMERAS[1],
                TVS[2],
                WATCHES[1],
                LAPTOPS[0]
              ]}
              onAddToCart={addToCart}
            />
          </section>

          {/* SECTION 15: 🔔 ПРЕДЗАКАЗЫ */}
          <section>
            <SectionHeader title="🔔 Предзаказы" link="Все предзаказы →" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  name: 'Xiaomi Redmi Note 17 Pro 5G',
                  price: 'от 1 299 ₽',
                  img: 'https://images.unsplash.com/photo-1620783770629-122b7f187703?w=400&h=250&fit=crop&auto=format',
                  date: 'Старт: 15 сентября'
                },
                {
                  name: 'Samsung Galaxy Z Fold 7',
                  price: 'от 9 999 ₽',
                  img: 'https://images.unsplash.com/photo-1515940175183-6798529cb860?w=400&h=250&fit=crop&auto=format',
                  date: 'Старт: 20 сентября'
                },
                {
                  name: 'Apple Vision Pro 2 128GB',
                  price: 'от 24 999 ₽',
                  img: 'https://images.unsplash.com/photo-1526406915894-7bcd65f60845?w=400&h=250&fit=crop&auto=format',
                  date: 'Старт: 1 октября'
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="relative h-44 w-full bg-slate-50">
                    <Image src={item.img} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-bold text-slate-800 mb-1">{item.name}</p>
                    <p className="text-sm font-extrabold mb-1" style={{ color: '#0f3460' }}>
                      {item.price}
                    </p>
                    <p className="text-xs text-slate-400 mb-3">{item.date}</p>
                    <button
                      type="button"
                      onClick={() => alert(`Предзаказ на «${item.name}» оформлен!`)}
                      className="w-full py-2 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Оформить предзаказ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 16: 4 GUARANTEE TILES */}
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: '🚚', title: 'Быстрая доставка', desc: '1–3 дня по всей России' },
                { icon: '🔒', title: 'Безопасная оплата', desc: 'Картой, наличными, рассрочка 0%' },
                { icon: '↩️', title: 'Возврат 30 дней', desc: 'Без вопросов и лишних чеков' },
                { icon: '🛡️', title: 'Гарантия 2 года', desc: 'Официальная на все товары' }
              ].map(card => (
                <div
                  key={card.title}
                  className="bg-white rounded-xl p-4 flex gap-3 items-start border border-slate-100"
                >
                  <span className="text-2xl shrink-0">{card.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{card.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 17: POPULAR BRANDS */}
          <section>
            <SectionHeader title="Популярные бренды" link="Все бренды →" />
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {BRANDS.map(brand => (
                <button
                  key={brand}
                  type="button"
                  className="shrink-0 px-5 py-3 bg-white rounded-xl border border-slate-100 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:shadow-md transition-all whitespace-nowrap cursor-pointer"
                >
                  {brand}
                </button>
              ))}
            </div>
          </section>

          {/* SECTION 18: CUSTOMER REVIEWS */}
          <section>
            <SectionHeader title="Отзывы покупателей" link="Все отзывы →" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  name: 'Алексей М.',
                  date: '2 сен 2026',
                  rating: 5,
                  product: 'iPhone 16 Pro Max',
                  text: 'Отличный магазин! Заказал смартфон — доставили на следующий день. Упакован идеально, всё соответствует описанию. Буду заказывать ещё.'
                },
                {
                  name: 'Мария К.',
                  date: '28 авг 2026',
                  rating: 5,
                  product: 'Sony WH-1000XM5',
                  text: 'Наушники пришли быстро, цена ниже чем в других магазинах. Менеджер помог с выбором аксессуаров. Рекомендую!'
                },
                {
                  name: 'Дмитрий П.',
                  date: '20 авг 2026',
                  rating: 4,
                  product: 'LG OLED C4 55"',
                  text: 'Телевизор отличный, установили бесплатно. Единственное — немного долго ждал согласования доставки, но в итоге всё прошло гладко.'
                }
              ].map(rev => (
                <div
                  key={rev.name}
                  className="bg-white rounded-xl p-5 border border-slate-100 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{rev.name}</p>
                        <p className="text-xs text-slate-400">{rev.date} · {rev.product}</p>
                      </div>
                      <StarRating rating={rev.rating} />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      «{rev.text}»
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* 4. FOOTER */}
      <footer style={{ background: '#0f3460' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-white text-xl font-bold tracking-tight mb-3">
                Design 2
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                Надёжный магазин электроники и бытовой техники. Официальный дилер ведущих брендов.
              </p>
              <p className="text-white/80 text-sm font-bold">+7 (800) 100-00-00</p>
              <p className="text-white/50 text-xs mt-0.5">Бесплатно, пн–вс 8:00–22:00</p>
              <div className="flex gap-2 mt-4">
                {['VK', 'TG', 'YT', 'OK'].map(social => (
                  <button
                    key={social}
                    type="button"
                    className="w-8 h-8 rounded-full bg-white/10 text-white/70 text-xs font-bold hover:bg-white/20 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    {social}
                  </button>
                ))}
              </div>
            </div>

            {[
              {
                title: 'Каталог',
                links: [
                  'Смартфоны',
                  'Ноутбуки',
                  'Планшеты',
                  'Аудио',
                  'Телевизоры',
                  'Аксессуары',
                  'Игры',
                  'Умный дом'
                ]
              },
              {
                title: 'Покупателям',
                links: [
                  'Доставка и оплата',
                  'Возврат товара',
                  'Гарантия',
                  'Рассрочка 0%',
                  'Trade-in',
                  'Программа лояльности'
                ]
              },
              {
                title: 'Сервисы',
                links: [
                  'Установка и настройка',
                  'Сервисный центр',
                  'Корпоративным клиентам',
                  'Подарочные карты',
                  'Пункты выдачи'
                ]
              },
              {
                title: 'Компания',
                links: [
                  'О нас',
                  'Вакансии',
                  'Контакты',
                  'Пресс-центр',
                  'Партнёрам',
                  'Реквизиты'
                ]
              }
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-white font-bold text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-white/60 text-xs hover:text-white transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-4">
            <p>© {new Date().getFullYear()} Design 2. Все права защищены.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white/70 transition-colors">Политика конфиденциальности</a>
              <a href="#" className="hover:text-white/70 transition-colors">Пользовательское соглашение</a>
              <a href="#" className="hover:text-white/70 transition-colors">Оферта</a>
            </div>
          </div>
        </div>
      </footer>

      {/* 5. CART DRAWER MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-slate-700" />
                  <h3 className="font-bold text-base text-slate-900">
                    Корзина ({totalCartCount})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <ShoppingCart className="w-16 h-16 text-slate-200 mb-3 stroke-[1.5]" />
                  <p className="text-sm font-medium">Корзина пуста</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug">
                            {item.name}
                          </p>
                          <p className="text-sm font-bold text-slate-900 mt-1">
                            {(item.price * item.qty).toLocaleString('ru-RU')} ₽
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.qty - 1)}
                              className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors text-base cursor-pointer"
                            >
                              −
                            </button>
                            <span className="text-sm font-semibold w-5 text-center">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.qty + 1)}
                              className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors text-base cursor-pointer"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="ml-auto text-slate-300 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Checkout Footer */}
                  <div className="p-5 border-t border-slate-100 space-y-3 bg-slate-50">
                    <div className="flex justify-between text-base font-bold text-slate-900">
                      <span>Итого:</span>
                      <span>{totalCartPrice.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        alert('Заказ успешно оформлен! Наш оператор свяжется с вами.')
                        setCart([])
                        setIsCartOpen(false)
                      }}
                      className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-95 shadow-md cursor-pointer"
                      style={{ background: '#e63946' }}
                    >
                      Оформить заказ
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
