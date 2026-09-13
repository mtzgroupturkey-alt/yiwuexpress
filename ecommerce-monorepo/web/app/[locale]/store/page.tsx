'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCompanyName } from '@/hooks/useCompanyName'
import { useSettings } from '@/components/SettingsProvider'
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
  Home as HomeIcon,
  Shirt,
  Wrench,
  Car,
  Bike,
  Sparkle,
  Smartphone,
  Trees,
  SlidersHorizontal,
  Package
} from 'lucide-react'
import { GENERAL_PRODUCTS_DATA, GENERAL_BRANDS, GENERAL_CUSTOMER_REVIEWS, ProductItem } from '@/data/general-products'
import { ElectronicsProductCard } from '@/components/electronics/ElectronicsProductCard'

export default function GeneralStorePage() {
  const companyName = useCompanyName()
  const { settings } = useSettings()
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
    setIsCartOpen(true)
  }

  // Remove from cart handler
  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId))
  }

  // Calculate totals
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.count, 0)
  const totalCartPrice = cartItems.reduce((acc, item) => acc + item.product.price * item.count, 0)

  // Filter products by department
  const hitProducts = GENERAL_PRODUCTS_DATA.filter(p => p.badge === 'HIT').slice(0, 4)
  const homeProducts = GENERAL_PRODUCTS_DATA.filter(p => p.category === 'home').slice(0, 4)
  const fashionProducts = GENERAL_PRODUCTS_DATA.filter(p => p.category === 'fashion').slice(0, 4)
  const toolsProducts = GENERAL_PRODUCTS_DATA.filter(p => p.category === 'tools').slice(0, 4)
  const autoProducts = GENERAL_PRODUCTS_DATA.filter(p => p.category === 'auto').slice(0, 4)
  const sportsProducts = GENERAL_PRODUCTS_DATA.filter(p => p.category === 'sports').slice(0, 4)
  const beautyProducts = GENERAL_PRODUCTS_DATA.filter(p => p.category === 'beauty').slice(0, 4)
  const digitalProducts = GENERAL_PRODUCTS_DATA.filter(p => p.category === 'digital').slice(0, 4)
  const gardenProducts = GENERAL_PRODUCTS_DATA.filter(p => p.category === 'garden').slice(0, 4)

  const newArrivals = GENERAL_PRODUCTS_DATA.filter(p => p.id.startsWith('new-')).slice(0, 6)
  const preOrders = GENERAL_PRODUCTS_DATA.filter(p => p.id.startsWith('pre-')).slice(0, 3)

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#FF4D00] selection:text-white font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP PROMOTIONAL BANNER */}
      {/* ========================================================================= */}
      <aside aria-label="Промо-акция" className="bg-[#0F172A] text-slate-200 text-[11px] sm:text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
              <Flame className="w-3.5 h-3.5 text-[#FF4D00] flex-shrink-0 animate-pulse" />
              <span>Бесплатная доставка при заказе от 2 000 ₽</span>
            </span>
            <span className="text-slate-600 hidden md:inline">·</span>
            <span className="hidden md:inline text-slate-300">Рассрочка 0% до 24 мес</span>
            <span className="text-slate-600 hidden md:inline">·</span>
            <span className="hidden md:inline text-slate-300">Гарантия 2 года</span>
            <span className="text-slate-600 hidden lg:inline">·</span>
            <span className="hidden lg:inline text-slate-300">Пункты выдачи по всей стране</span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-slate-400 font-medium whitespace-nowrap flex-shrink-0">
            <a href="tel:+78005553535" className="hover:text-white flex items-center gap-1.5 transition-colors">
              <Phone className="w-3 h-3 text-[#FF4D00]" />
              <span>8 800 555-35-35</span>
            </a>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">Ежедневно 08:00 - 22:00</span>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. HEADER */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              {settings?.companyLogo ? (
                <div className="h-10 flex items-center justify-center shrink-0">
                  <img
                    src={settings.companyLogo}
                    alt={`${companyName} Logo`}
                    className="max-h-10 w-auto object-contain transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF4D00] to-[#FF7A00] flex items-center justify-center text-white font-black text-xl shadow-md shadow-[#FF4D00]/25 group-hover:scale-105 transition-transform">
                  {companyName ? companyName.charAt(0).toUpperCase() : 'M'}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-black text-lg sm:text-xl leading-none text-slate-900 tracking-tight">
                  {companyName}
                </span>
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">
                  Универсальный гипермаркет
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
                placeholder="Искать станки ЧПУ, DeLonghi, перфоратор DeWALT, шины, палатки, косметику..."
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
              <a href="#home" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#FF4D00] transition-colors">
                Дом и уют
              </a>
              <a href="#fashion" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#FF4D00] transition-colors">
                Одежда и обувь
              </a>
              <a href="#tools" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#FF4D00] transition-colors">
                Инструменты
              </a>
              <a href="#auto" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#FF4D00] transition-colors">
                Автотовары
              </a>
              <a href="#sports" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#FF4D00] transition-colors">
                Спорт и туризм
              </a>
              <a href="#beauty" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#FF4D00] transition-colors">
                Красота и уход
              </a>
              <a href="#digital" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#FF4D00] transition-colors">
                Гаджеты
              </a>
              <a href="#garden" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#FF4D00] transition-colors">
                Дача и сад
              </a>
              <a href="#daily-deal" className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1 transition-colors">
                <Flame className="w-3.5 h-3.5" />
                <span>Скидки дня</span>
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
                  <span>ГЛАВНАЯ РАСПРОДАЖА ГОДА</span>
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                  Все товары для жизни и дела — <span className="text-[#FF4D00]">по оптовым ценам</span>
                </h1>
                <p className="text-slate-300 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
                  Более 500 000 сертифицированных товаров от ведущих мировых брендов с гарантией до 3 лет и экспресс-доставкой.
                </p>
                <div className="pt-3 flex flex-wrap items-center gap-4">
                  <a
                    href="#hits"
                    className="px-8 py-3.5 rounded-2xl bg-[#FF4D00] hover:bg-[#e04400] text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-[#FF4D00]/30 hover:scale-105 transition-all inline-flex items-center gap-2"
                  >
                    <span>В каталог товаров</span>
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
                    src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=85"
                    alt="Оборудование и товары для жизни"
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
                <h3 className="font-extrabold text-sm text-slate-900">Гарантия лучшей цены</h3>
                <p className="text-xs text-slate-500 mt-0.5">Прямые поставки от производителей без лишних наценок</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-4 hover:border-[#FF4D00]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl flex-shrink-0">
                📦
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Более 500 000 товаров</h3>
                <p className="text-xs text-slate-500 mt-0.5">От бытовой техники до стройматериалов и одежды</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-4 hover:border-[#FF4D00]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black text-xl flex-shrink-0">
                🔥
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Скидки до 60%</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ежедневные закрытые распродажи во всех отделах</p>
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
                  Скидки до 50% на все категории каталога
                </h2>
                <p className="text-white/90 text-xs sm:text-sm max-w-lg">
                  Ограниченная ликвидация партий инструмента, техники для дома, автотоваров и спортивного инвентаря.
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
      {/* 5. CATALOG SECTIONS (9 Departments x 4 Products) */}
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
            <a href="#hits" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
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

        {/* 5.2 🏠 Товары для дома и уюта */}
        <section id="home" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🏠</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Товары для дома и уюта
              </h2>
            </div>
            <a href="#home" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Все товары для дома</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {homeProducts.map(p => (
              <ElectronicsProductCard
                key={p.id}
                product={p}
                onQuickView={setQuickViewProduct}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* 5.3 👗 Одежда, обувь и аксессуары */}
        <section id="fashion" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">👗</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Одежда, обувь и аксессуары
              </h2>
            </div>
            <a href="#fashion" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Вся одежда и обувь</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {fashionProducts.map(p => (
              <ElectronicsProductCard
                key={p.id}
                product={p}
                onQuickView={setQuickViewProduct}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* 5.4 🛠️ Ремонт, стройка и инструменты */}
        <section id="tools" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🛠️</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Ремонт, стройка и инструменты
              </h2>
            </div>
            <a href="#tools" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Все инструменты</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {toolsProducts.map(p => (
              <ElectronicsProductCard
                key={p.id}
                product={p}
                onQuickView={setQuickViewProduct}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* 5.5 🚗 Автотовары и автоэлектроника */}
        <section id="auto" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🚗</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Автотовары и автоэлектроника
              </h2>
            </div>
            <a href="#auto" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Все автотовары</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {autoProducts.map(p => (
              <ElectronicsProductCard
                key={p.id}
                product={p}
                onQuickView={setQuickViewProduct}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* 5.6 ⚽ Спорт, туризм и активный отдых */}
        <section id="sports" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">⚽</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Спорт, туризм и активный отдых
              </h2>
            </div>
            <a href="#sports" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Все спорттовары</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {sportsProducts.map(p => (
              <ElectronicsProductCard
                key={p.id}
                product={p}
                onQuickView={setQuickViewProduct}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* 5.7 💄 Красота, здоровье и уход */}
        <section id="beauty" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">💄</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Красота, здоровье и уход
              </h2>
            </div>
            <a href="#beauty" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Все товары красоты</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {beautyProducts.map(p => (
              <ElectronicsProductCard
                key={p.id}
                product={p}
                onQuickView={setQuickViewProduct}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* 5.8 📱 Смартфоны и цифровая техника */}
        <section id="digital" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📱</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Смартфоны и цифровая техника
              </h2>
            </div>
            <a href="#digital" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Вся электроника</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {digitalProducts.map(p => (
              <ElectronicsProductCard
                key={p.id}
                product={p}
                onQuickView={setQuickViewProduct}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* 5.9 🌳 Дача, сад и генераторы */}
        <section id="garden" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🌳</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Дача, сад и генераторы
              </h2>
            </div>
            <a href="#garden" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Все для дачи и сада</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {gardenProducts.map(p => (
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
      {/* 6. NEW ARRIVALS (6 Products) */}
      {/* ========================================================================= */}
      <section id="new-arrivals" className="py-12 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 font-black text-xs uppercase tracking-wider">
                Свежие поступления
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Новинки каталога
              </h2>
            </div>
            <a href="#new-arrivals" className="text-xs sm:text-sm font-bold text-[#FF4D00] hover:text-[#e04400] flex items-center gap-1 transition-colors">
              <span>Все поступления</span>
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
      {/* 7. PRE-ORDERS SECTION (3 Products) */}
      {/* ========================================================================= */}
      <section id="pre-orders" className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <Bell className="w-6 h-6 text-[#FF4D00]" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Скоро в продаже · Предзаказ
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Фиксация цены при предзаказе
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {preOrders.map(p => (
              <div 
                key={p.id}
                className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-lg transition-shadow relative overflow-hidden"
              >
                <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
                  Предзаказ
                </div>

                <div className="relative aspect-4/3 rounded-2xl bg-slate-50 overflow-hidden mb-4 flex items-center justify-center p-4">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    className="object-contain"
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="font-extrabold text-slate-900 text-base line-clamp-2 leading-snug">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {p.description}
                  </p>

                  <div className="flex items-baseline gap-2 pt-2">
                    <span className="text-xl font-black font-mono text-slate-950">
                      {p.price.toLocaleString('ru-RU')} ₽
                    </span>
                    {p.oldPrice && (
                      <span className="text-xs text-slate-400 line-through font-mono">
                        {p.oldPrice.toLocaleString('ru-RU')} ₽
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      alert(`Предзаказ на «${p.name}» успешно оформлен! Мы уведомим вас о поступлении на склад.`)
                    }}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-[#FF4D00] text-white font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer"
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
      {/* 8. FEATURES STRIP */}
      {/* ========================================================================= */}
      <section className="py-8 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#FF4D00] flex-shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base">Быстрая доставка</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  По всей России и СНГ от 1 дня курьером или в пункты выдачи
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#FF4D00] flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base">Безопасная оплата</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Банковские карты, СБП, рассрочка 0% без переплат
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#FF4D00] flex-shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base">Возврат 30 дней</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Без лишних вопросов и сложных экспертиз
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#FF4D00] flex-shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base">Гарантия до 3 лет</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Официальная сервисная поддержка и сертификаты соответствия
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. BRAND STRIP */}
      {/* ========================================================================= */}
      <section className="py-12 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-center text-xs font-black text-slate-400 uppercase tracking-widest mb-8">
            Официальный дилер ведущих мировых брендов
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 sm:gap-6 items-center">
            {GENERAL_BRANDS.map(brand => (
              <div 
                key={brand.id}
                className="h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center p-3 text-slate-700 font-black tracking-tight text-sm transition-colors cursor-pointer shadow-2xs"
              >
                {brand.logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. CUSTOMER REVIEWS */}
      {/* ========================================================================= */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Отзывы реальных покупателей
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-2">
              Более 150 000 довольных клиентов уже совершают регулярные покупки
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GENERAL_CUSTOMER_REVIEWS.map(rev => (
              <div 
                key={rev.id}
                className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex text-amber-400">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">{rev.date}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                    «{rev.text}»
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{rev.name}</h4>
                    <span className="text-[11px] text-slate-400">{rev.city}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#FF4D00] max-w-[130px] truncate text-right">
                    {rev.productName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Newsletter Box */}
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/60 p-8 sm:p-10 mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Подпишитесь на закрытые распродажи
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                  Получайте промокоды со скидками до 30%, обзоры новинок и эксклюзивные спецпредложения первыми.
                </p>
              </div>
              <div className="lg:col-span-5">
                {isSubscribed ? (
                  <div className="p-4 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 border border-emerald-500/30">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Спасибо! Промокод на первую покупку уже на вашей почте.</span>
                  </div>
                ) : (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (newsletterEmail) setIsSubscribed(true)
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Ваш адрес эл. почты..."
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D00]"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-white font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer flex-shrink-0"
                    >
                      Подписаться
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Links Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800/80 text-xs">
            <div className="space-y-3">
              <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">Каталог</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#home" className="hover:text-white transition-colors">Товары для дома</a></li>
                <li><a href="#fashion" className="hover:text-white transition-colors">Одежда и обувь</a></li>
                <li><a href="#tools" className="hover:text-white transition-colors">Строительство и ремонт</a></li>
                <li><a href="#auto" className="hover:text-white transition-colors">Автотовары</a></li>
                <li><a href="#sports" className="hover:text-white transition-colors">Спорт и туризм</a></li>
                <li><a href="#beauty" className="hover:text-white transition-colors">Красота и гигиена</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">Покупателям</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Доставка и оплата</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Рассрочка и кредит 0%</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Возврат и обмен</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Программа лояльности</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Вопросы и ответы</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">О компании</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">О маркетплейсе</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Вакансии</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Сертификаты качества</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Поставщикам и партнерам</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Контакты</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">Контакты</h4>
              <p className="text-slate-400 leading-relaxed">
                Бесплатный звонок по России:<br />
                <strong className="text-white text-sm">8 800 555-35-35</strong>
              </p>
              <p className="text-slate-400 leading-relaxed">
                Электронная почта:<br />
                <strong className="text-white">support@yiwuexpress.com</strong>
              </p>
              <p className="text-slate-500 text-[11px]">
                Время работы службы заботы о клиентах: круглосуточно 24/7
              </p>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} {companyName}. Все права защищены.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:underline">Политика конфиденциальности</a>
              <a href="#" className="hover:underline">Пользовательское соглашение</a>
              <a href="#" className="hover:underline">Публичная оферта</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* CART DRAWER SLIDE-OVER */}
      {/* ========================================================================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Cart Header */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#FF4D00]" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    Корзина ({totalCartCount})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart List */}
              <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100">
                {cartItems.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                      🛒
                    </div>
                    <p className="font-bold text-slate-700 text-sm">Ваша корзина пуста</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Выберите товары в каталоге со скидками и быстрой доставкой.
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
