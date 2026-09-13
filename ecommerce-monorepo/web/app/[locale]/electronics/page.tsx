'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Search, 
  ShoppingCart, 
  User, 
  Clock, 
  ChevronRight, 
  Flame, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Award, 
  Check, 
  Star, 
  X,
  Phone,
  Mail,
  ArrowRight,
  Sparkles,
  Bell,
  Heart,
  Smartphone,
  Laptop,
  Tv,
  Home as HomeIcon,
  Headphones,
  Gamepad2,
  Watch,
  Camera
} from 'lucide-react'
import { PRODUCTS_DATA, BRANDS, CUSTOMER_REVIEWS, ProductItem } from '@/data/products'
import { ElectronicsProductCard } from '@/components/electronics/ElectronicsProductCard'

export default function ElectronicsStorePage() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  // Cart state
  const [cartItems, setCartItems] = useState<{ product: ProductItem; count: number }[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  // Quick view state
  const [quickViewProduct, setQuickViewProduct] = useState<ProductItem | null>(null)
  // Newsletter subscription state
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  // Countdown timer for Daily Deal Section (Section 4)
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 43, seconds: 14 })

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 }
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return { hours: 23, minutes: 59, seconds: 59 }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Add to cart handler
  const handleAddToCart = (product: ProductItem) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, count: item.count + 1 } : item
        )
      }
      return [...prev, { product, count: 1 }]
    })
  }

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== id))
  }

  const totalCartPrice = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.count,
    0
  )
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.count, 0)

  // Filter products by category/section
  const hitProducts = PRODUCTS_DATA.filter(p => p.id.startsWith('hit-')).slice(0, 4)
  const smartphoneProducts = PRODUCTS_DATA.filter(p => p.category === 'smartphones').slice(0, 4)
  const laptopProducts = PRODUCTS_DATA.filter(p => p.category === 'laptops').slice(0, 4)
  const tvProducts = PRODUCTS_DATA.filter(p => p.category === 'tv').slice(0, 4)
  const homeAppliancesProducts = PRODUCTS_DATA.filter(p => p.category === 'home-appliances').slice(0, 4)
  const audioProducts = PRODUCTS_DATA.filter(p => p.category === 'audio').slice(0, 4)
  const gamingProducts = PRODUCTS_DATA.filter(p => p.category === 'gaming').slice(0, 4)
  const watchProducts = PRODUCTS_DATA.filter(p => p.category === 'smart-watches').slice(0, 4)
  const photoProducts = PRODUCTS_DATA.filter(p => p.category === 'photo-video').slice(0, 4)

  const newArrivals = PRODUCTS_DATA.filter(p => p.id.startsWith('new-')).slice(0, 6)
  const preOrders = PRODUCTS_DATA.filter(p => p.id.startsWith('pre-')).slice(0, 3)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail) return
    setIsSubscribed(true)
    setTimeout(() => setIsSubscribed(false), 4000)
    setNewsletterEmail('')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-['Inter',sans-serif] selection:bg-[#FF4D00] selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. TOP PROMOTIONAL BAR */}
      {/* ========================================================================= */}
      <div className="bg-[#111827] text-white py-2 px-4 text-xs font-medium border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
            <span className="inline-flex items-center text-amber-400 font-bold">🔥</span>
            <span>Бесплатная доставка при заказе от 2 000 ₽ · Рассрочка 0% до 24 мес · Гарантия 2 года · Пункты выдачи по всему городу</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-slate-400 flex-shrink-0 text-xs">
            <a href="tel:88005553535" className="hover:text-white transition-colors flex items-center gap-1.5 font-mono">
              <Phone className="w-3.5 h-3.5 text-[#FF4D00]" />
              8 (800) 555-35-35
            </a>
            <span>Пн-Вс 08:00 - 22:00</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN HEADER & NAVIGATION */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        {/* Main Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/electronics" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-[#FF4D00] text-white font-black text-xl flex items-center justify-center shadow-md shadow-[#FF4D00]/25 group-hover:scale-105 transition-transform">
                ⚡
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 block leading-none">
                  TechStore
                </span>
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">
                  Электроника и Гаджеты
                </span>
              </div>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Искать iPhone 16 Pro, MacBook, OLED телевизор, PlayStation..."
                className="w-full pl-11 pr-24 py-2.5 rounded-xl bg-slate-100/90 border border-slate-200 text-sm focus:outline-none focus:border-[#FF4D00] focus:bg-white focus:ring-2 focus:ring-[#FF4D00]/15 transition-all text-slate-900 placeholder-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <button 
                type="button" 
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-[#FF4D00] hover:bg-[#e04400] text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Найти
              </button>
            </div>
          </div>

          {/* Actions: Cart & Login */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 p-2.5 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 hover:border-[#FF4D00] hover:bg-[#FF4D00]/5 text-slate-800 transition-colors cursor-pointer"
              aria-label="Открыть корзину"
            >
              <ShoppingCart className="w-5 h-5 text-[#FF4D00]" />
              <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider">Корзина</span>
              {totalCartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#FF4D00] text-white font-black text-[11px] flex items-center justify-center shadow-xs">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Login Button */}
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
            >
              <User className="w-4 h-4" />
              <span>Войти</span>
            </button>
          </div>
        </div>

        {/* Categories Navigation Sub-bar */}
        <div className="border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2 text-xs font-bold text-slate-700 whitespace-nowrap">
              <a href="#new-arrivals" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#FF4D00] flex items-center gap-1.5 transition-colors">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Новинки</span>
              </a>
              <a href="#smartphones" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#FF4D00] transition-colors">
                Смартфоны
              </a>
              <a href="#laptops" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#FF4D00] transition-colors">
                Ноутбуки
              </a>
              <a href="#tv" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#FF4D00] transition-colors">
                Телевизоры
              </a>
              <a href="#home-appliances" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#FF4D00] transition-colors">
                Бытовая техника
              </a>
              <a href="#audio" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#FF4D00] transition-colors">
                Аудиотехника
              </a>
              <a href="#gaming" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#FF4D00] transition-colors">
                Игры
              </a>
              <a href="#daily-deal" className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1 transition-colors">
                <Flame className="w-3.5 h-3.5" />
                <span>Скидки</span>
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. HERO SECTION WITH FEATURE CARDS */}
      {/* ========================================================================= */}
      <section className="py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Large Banner */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-slate-800">
            {/* Background Glow */}
            <div className="absolute right-0 top-0 w-96 h-96 bg-[#FF4D00]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4D00] text-white text-xs font-black uppercase tracking-wider shadow-sm">
                  <span>✨</span>
                  <span>НОВИНКИ СЕЗОНА</span>
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                  MacBook Pro M4 Pro — <span className="text-[#FF4D00]">уже в наличии</span>
                </h1>
                <p className="text-slate-300 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
                  Рассрочка 0% · Гарантия 2 года · Быстрая доставка
                </p>
                <div className="pt-3 flex flex-wrap items-center gap-4">
                  <a
                    href="#laptops"
                    className="px-8 py-3.5 rounded-2xl bg-[#FF4D00] hover:bg-[#e04400] text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-[#FF4D00]/30 hover:scale-105 transition-all inline-flex items-center gap-2"
                  >
                    <span>Купить от 249 990 ₽</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="#new-arrivals"
                    className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 backdrop-blur-md transition-all"
                  >
                    Все новинки
                  </a>
                </div>
              </div>

              {/* Banner Right Image */}
              <div className="lg:col-span-5 relative flex items-center justify-center">
                <div className="relative w-full aspect-video sm:aspect-square max-w-md">
                  <Image
                    src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=85"
                    alt="MacBook Pro M4 Pro"
                    fill
                    priority
                    className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Three Feature Cards Below Hero */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-4 hover:border-[#FF4D00]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xl flex-shrink-0">
                ⭐
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Лучшая цена</h3>
                <p className="text-xs text-slate-500 mt-0.5">Гарантируем выгодные условия и кэшбэк до 10%</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-4 hover:border-[#FF4D00]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl flex-shrink-0">
                📱
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Смартфоны от 4 999 ₽</h3>
                <p className="text-xs text-slate-500 mt-0.5">Большой выбор бюджетных и флагманских моделей</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-4 hover:border-[#FF4D00]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black text-xl flex-shrink-0">
                🔥
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Скидки до 40%</h3>
                <p className="text-xs text-slate-500 mt-0.5">Еженедельные закрытые распродажи на гаджеты</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. DAILY DEAL SECTION WITH LIVE COUNTDOWN TIMER */}
      {/* ========================================================================= */}
      <section id="daily-deal" className="py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-br from-[#FF4D00] via-[#FF6A00] to-[#E04400] text-white p-6 sm:p-8 lg:p-10 shadow-xl overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 backdrop-blur-xs text-xs font-black uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span>⏰ Предложение дня</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                  Скидки до 50% на электронику
                </h2>
                <p className="text-white/90 text-xs sm:text-sm max-w-lg">
                  Ограниченная партия флагманских телевизоров, планшетов и наушников по специальным ценам.
                </p>
              </div>

              {/* Countdown Clock Display */}
              <div className="flex items-center gap-2 sm:gap-3 bg-black/25 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/20">
                <div className="text-center">
                  <div className="w-14 sm:w-16 h-12 sm:h-14 rounded-xl bg-white text-slate-950 font-black font-mono text-xl sm:text-2xl flex items-center justify-center shadow-md">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-white/80 mt-1 block">часов</span>
                </div>
                <span className="text-2xl font-black font-mono text-white mb-4">:</span>
                <div className="text-center">
                  <div className="w-14 sm:w-16 h-12 sm:h-14 rounded-xl bg-white text-slate-950 font-black font-mono text-xl sm:text-2xl flex items-center justify-center shadow-md">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-white/80 mt-1 block">минут</span>
                </div>
                <span className="text-2xl font-black font-mono text-white mb-4">:</span>
                <div className="text-center">
                  <div className="w-14 sm:w-16 h-12 sm:h-14 rounded-xl bg-white text-slate-950 font-black font-mono text-xl sm:text-2xl flex items-center justify-center shadow-md">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-white/80 mt-1 block">секунд</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CATALOG SECTIONS (9 Categories x 4 Products) */}
      {/* ========================================================================= */}
      <div className="space-y-12 sm:space-y-16 py-8">
        {/* 5.1 🔥 Хиты продаж */}
        <section id="hits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🔥</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Хиты продаж
              </h2>
            </div>
            <a href="#catalog" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Смотреть все</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {hitProducts.map(p => (
              <ElectronicsProductCard
                key={p.id}
                product={p}
                onQuickView={setQuickViewProduct}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* 5.2 📱 Смартфоны */}
        <section id="smartphones" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📱</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Смартфоны
              </h2>
            </div>
            <a href="#smartphones" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Все смартфоны</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {smartphoneProducts.map(p => (
              <ElectronicsProductCard
                key={p.id}
                product={p}
                onQuickView={setQuickViewProduct}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* 5.3 💻 Ноутбуки */}
        <section id="laptops" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">💻</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Ноутбуки
              </h2>
            </div>
            <a href="#laptops" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Все ноутбуки</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {laptopProducts.map(p => (
              <ElectronicsProductCard
                key={p.id}
                product={p}
                onQuickView={setQuickViewProduct}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* 5.4 📺 Телевизоры */}
        <section id="tv" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📺</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Телевизоры
              </h2>
            </div>
            <a href="#tv" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Все телевизоры</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {tvProducts.map(p => (
              <ElectronicsProductCard
                key={p.id}
                product={p}
                onQuickView={setQuickViewProduct}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* 5.5 🏠 Бытовая техника */}
        <section id="home-appliances" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🏠</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Бытовая техника
              </h2>
            </div>
            <a href="#home-appliances" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Вся бытовая техника</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {homeAppliancesProducts.map(p => (
              <ElectronicsProductCard
                key={p.id}
                product={p}
                onQuickView={setQuickViewProduct}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* 5.6 🎧 Аудиотехника */}
        <section id="audio" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🎧</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Аудиотехника
              </h2>
            </div>
            <a href="#audio" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Вся аудиотехника</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {audioProducts.map(p => (
              <ElectronicsProductCard
                key={p.id}
                product={p}
                onQuickView={setQuickViewProduct}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* 5.7 🎮 Игровая зона */}
        <section id="gaming" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🎮</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Игровая зона
              </h2>
            </div>
            <a href="#gaming" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Все для гейминга</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {gamingProducts.map(p => (
              <ElectronicsProductCard
                key={p.id}
                product={p}
                onQuickView={setQuickViewProduct}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* 5.8 ⌚ Умные часы и браслеты */}
        <section id="watches" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">⌚</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Умные часы и браслеты
              </h2>
            </div>
            <a href="#watches" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Все смарт-часы</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {watchProducts.map(p => (
              <ElectronicsProductCard
                key={p.id}
                product={p}
                onQuickView={setQuickViewProduct}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* 5.9 📷 Фото и видео */}
        <section id="photo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📷</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Фото и видео
              </h2>
            </div>
            <a href="#photo" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Вся фототехника</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {photoProducts.map(p => (
              <ElectronicsProductCard
                key={p.id}
                product={p}
                onQuickView={setQuickViewProduct}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 6. NEW ARRIVALS: ✨ Новинки — только поступили (6 products) */}
      {/* ========================================================================= */}
      <section id="new-arrivals" className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider mb-2">
                <span>✨</span>
                <span>Свежее поступление</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Новинки — только поступили
              </h2>
            </div>
            <a href="#catalog" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Смотреть все новинки</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {newArrivals.map(p => (
              <ElectronicsProductCard
                key={p.id}
                product={p}
                onQuickView={setQuickViewProduct}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. PRE-ORDERS: 🔔 Предзаказы (3 products) */}
      {/* ========================================================================= */}
      <section id="pre-orders" className="py-12 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider mb-2">
                <Bell className="w-3 h-3" />
                <span>Ожидаемые гаджеты</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                🔔 Предзаказы
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Гарантированная цена первого дня
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {preOrders.map(p => (
              <div key={p.id} className="relative p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-[#FF4D00]/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 mb-4">
                    <span className="absolute top-3 left-3 z-10 bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                      ПРЕДЗАКАЗ
                    </span>
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      loading="lazy"
                      className="object-contain p-4 hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 mb-2">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {p.description}
                  </p>

                  {p.specs && (
                    <div className="space-y-1.5 py-2 border-y border-slate-100 mb-4">
                      {Object.entries(p.specs).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-slate-400">{key}:</span>
                          <span className="font-bold text-slate-700">{val}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Ожидаемая цена</span>
                    <span className="text-xl font-black font-mono text-slate-950">
                      {p.price.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(p)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-[#FF4D00] text-white font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Оформить предзаказ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FEATURES STRIP (4 Guarantee Badges) */}
      {/* ========================================================================= */}
      <section className="py-10 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#FF4D00] flex items-center justify-center flex-shrink-0 border border-orange-100">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Быстрая доставка</h3>
                <p className="text-xs text-slate-500 mt-0.5">Курьером до двери или в один из 500+ пунктов выдачи</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Безопасная оплата</h3>
                <p className="text-xs text-slate-500 mt-0.5">Оплата картой онлайн, при получении или рассрочка 0%</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Возврат 30 дней</h3>
                <p className="text-xs text-slate-500 mt-0.5">Быстрый обмен или возврат денежных средств без лишних вопросов</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Гарантия 2 года</h3>
                <p className="text-xs text-slate-500 mt-0.5">Официальное сервисное обслуживание на всю сертифицированную технику</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. BRANDS SECTION */}
      {/* ========================================================================= */}
      <section className="py-10 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Официальные партнеры и бренды
            </span>
          </div>
          <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
            {BRANDS.map(brand => (
              <div
                key={brand.id}
                className="px-6 py-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-[#FF4D00] hover:shadow-md transition-all flex items-center justify-center font-black tracking-wider text-slate-700 hover:text-[#FF4D00] text-sm cursor-pointer select-none"
              >
                {brand.logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. CUSTOMER REVIEWS (3 Verified Reviews) */}
      {/* ========================================================================= */}
      <section className="py-14 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#FF4D00] block mb-2">
              Честные мнения
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Отзывы реальных покупателей
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CUSTOMER_REVIEWS.map(rev => (
              <div
                key={rev.id}
                className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-lg transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{rev.date}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic mb-4">
                    «{rev.text}»
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/60">
                  <span className="text-xs font-bold text-[#FF4D00] block mb-1">
                    {rev.productName}
                  </span>
                  <div className="flex items-center justify-between text-xs text-slate-900 font-bold">
                    <span>{rev.name}</span>
                    <span className="text-slate-400 font-normal">{rev.city}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FOOTER & NEWSLETTER */}
      {/* ========================================================================= */}
      <footer className="bg-[#0F172A] text-slate-300 border-t border-slate-800">
        {/* Newsletter Strip */}
        <div className="border-b border-slate-800 py-10 bg-[#0B1120]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-extrabold text-white">
                  Подпишитесь на скидки и спецпредложения
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Узнавайте первыми о закрытых распродажах электроники и закрытых промокодах
                </p>
              </div>

              <form onSubmit={handleSubscribe} className="flex items-center gap-2 w-full lg:w-auto">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Ваш адрес электронной почты..."
                  className="w-full lg:w-80 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D00]"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
                >
                  <span>{isSubscribed ? 'Готово!' : 'Подписаться'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Column 1: Каталог */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4 border-l-2 border-[#FF4D00] pl-2">
                Каталог
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#smartphones" className="hover:text-white transition-colors">Смартфоны и гаджеты</a></li>
                <li><a href="#laptops" className="hover:text-white transition-colors">Ноутбуки и ПК</a></li>
                <li><a href="#tv" className="hover:text-white transition-colors">Телевизоры и медиа</a></li>
                <li><a href="#audio" className="hover:text-white transition-colors">Наушники и акустика</a></li>
                <li><a href="#gaming" className="hover:text-white transition-colors">Игровые приставки</a></li>
              </ul>
            </div>

            {/* Column 2: О нас */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4 border-l-2 border-[#FF4D00] pl-2">
                О нас
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#" className="hover:text-white transition-colors">О магазине TechStore</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Программа лояльности</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Сертификаты и гарантия</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Корпоративным клиентам</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Вакансии</a></li>
              </ul>
            </div>

            {/* Column 3: Помощь */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4 border-l-2 border-[#FF4D00] pl-2">
                Помощь
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#" className="hover:text-white transition-colors">Доставка и оплата</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Рассрочка и кредит 0%</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Возврат и обмен товара</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Сервисные центры</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Вопросы и ответы (FAQ)</a></li>
              </ul>
            </div>

            {/* Column 4: Контакты */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4 border-l-2 border-[#FF4D00] pl-2">
                Контакты
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-center gap-2 text-white font-mono font-bold">
                  <Phone className="w-3.5 h-3.5 text-[#FF4D00]" />
                  8 (800) 555-35-35
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#FF4D00]" />
                  support@techstore.ru
                </li>
                <li>Ежедневно: с 08:00 до 22:00</li>
                <li>Пункты самовывоза: 120+ адресов</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright notice */}
        <div className="border-t border-slate-800 py-6 bg-[#0B1120]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © 2026 Create shop store website (TechStore). Все права защищены.
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-300 transition-colors">Политика конфиденциальности</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Пользовательское соглашение</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Оферта</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* CART DRAWER SLIDEOVER */}
      {/* ========================================================================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
              {/* Cart Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#FF4D00]" />
                  <h3 className="font-extrabold text-base text-slate-900">Ваша корзина</h3>
                  <span className="text-xs font-bold text-slate-400 font-mono">({totalCartCount})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Item List */}
              <div className="p-5 flex-1 overflow-y-auto divide-y divide-slate-100">
                {cartItems.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                      🛒
                    </div>
                    <p className="font-bold text-slate-700 text-sm">Ваша корзина пуста</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Выберите электронику и гаджеты в каталоге со скидками и быстрой доставкой.
                    </p>
                  </div>
                ) : (
                  cartItems.map(({ product, count }) => (
                    <div key={product.id} className="py-4 flex gap-3 items-center">
                      <div className="relative w-16 h-16 rounded-xl bg-slate-50 flex-shrink-0 overflow-hidden border border-slate-200/80">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                          {product.name}
                        </h4>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-mono font-bold text-slate-900">
                            {count} × {product.price.toLocaleString('ru-RU')} ₽
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(product.id)}
                            className="text-[11px] font-bold text-red-500 hover:underline"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer Checkout */}
              {cartItems.length > 0 && (
                <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-3">
                  <div className="flex justify-between text-sm font-extrabold text-slate-900">
                    <span>Итого к оплате:</span>
                    <span className="text-xl font-mono text-[#FF4D00]">
                      {totalCartPrice.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      alert('Заказ успешно оформлен! Наш менеджер свяжется с вами в течение 10 минут.')
                      setCartItems([])
                      setIsCartOpen(false)
                    }}
                    className="w-full py-3.5 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-white font-extrabold text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer"
                  >
                    Перейти к оформлению
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK VIEW MODAL */}
      {/* ========================================================================= */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setQuickViewProduct(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl z-10 border border-slate-100">
            <button
              type="button"
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="relative aspect-square rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 flex items-center justify-center">
                <Image
                  src={quickViewProduct.image}
                  alt={quickViewProduct.name}
                  fill
                  className="object-contain p-4"
                />
              </div>
              <div className="space-y-4">
                <span className="text-xs font-black text-[#FF4D00] uppercase tracking-wider">
                  В наличии
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {quickViewProduct.name}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {quickViewProduct.description}
                </p>

                {quickViewProduct.specs && (
                  <div className="space-y-1.5 py-2 border-y border-slate-100 text-xs">
                    {Object.entries(quickViewProduct.specs).map(([key, val]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-400">{key}:</span>
                        <span className="font-bold text-slate-800">{val}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-black font-mono text-slate-950">
                    {quickViewProduct.price.toLocaleString('ru-RU')} ₽
                  </span>
                  {quickViewProduct.oldPrice && (
                    <span className="text-sm text-slate-400 line-through font-mono">
                      {quickViewProduct.oldPrice.toLocaleString('ru-RU')} ₽
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleAddToCart(quickViewProduct)
                    setQuickViewProduct(null)
                  }}
                  className="w-full py-3 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-white font-extrabold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Добавить в корзину</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
