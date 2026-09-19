'use client'

import React, { useState, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { Container } from '@/components/ui/Container'
import { LocaleLink } from '@/components/LocaleLink'
import { useSettings } from '@/components/SettingsProvider'
import { 
  Calendar, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  ChevronRight, 
  BookOpen, 
  TrendingUp, 
  ShieldCheck, 
  Globe2, 
  Mail, 
  Send,
  Building2
} from 'lucide-react'

export default function BlogPage() {
  const t = useTranslations('Blog')
  const locale = useLocale()
  const { settings } = useSettings()
  const companyName = settings?.companyName || 'Global Trade'

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const categories = [
    { id: 'all', label: locale === 'ru' ? 'Все статьи' : locale === 'zh' ? '全部文章' : 'All Insights' },
    { id: 'Sourcing Guides', label: locale === 'ru' ? 'Руководства по закупкам' : locale === 'zh' ? '采购实务指南' : 'Sourcing Guides' },
    { id: 'Trade Insights', label: locale === 'ru' ? 'Аналитика торговли' : locale === 'zh' ? '外贸前沿分析' : 'Trade Insights' },
    { id: 'Product Reviews', label: locale === 'ru' ? 'Обзоры продукции' : locale === 'zh' ? '选品与行业趋势' : 'Product Reviews' },
  ]

  const posts = [
    {
      title: 'The Complete Guide to Sourcing Commercial Equipment in China',
      excerpt:
        'Learn how to verify manufacturer licenses, inspect automated production lines, and structure payment milestones to minimize import risks.',
      image: '/uploads/blog-cookware.jpg',
      category: 'Sourcing Guides',
      date: '2026-03-15',
      readTime: '6 min read',
      author: 'Trade Engineering Desk',
      href: '/blog/complete-guide-restaurant-cookware',
    },
    {
      title: "Importing from China Port Hubs: 2026 Freight & Customs Playbook",
      excerpt:
        'Navigate the complexities of ocean FCL container allocations, export rebates, and multimodal rail corridors directly to destination terminals.',
      image: '/uploads/blog-importing.jpg',
      category: 'Trade Insights',
      date: '2026-02-28',
      readTime: '8 min read',
      author: 'Logistics Operations',
      href: '/blog/importing-from-china-guide',
    },
    {
      title: 'Top 10 High-Demand Industrial & Commercial Products This Year',
      excerpt:
        'Discover trending product categories, factory minimum order quantities (MOQs), and margin benchmarks for wholesale distributors.',
      image: '/uploads/blog-tools.jpg',
      category: 'Product Reviews',
      date: '2026-02-10',
      readTime: '5 min read',
      author: 'Market Research Team',
      href: '/blog/top-10-kitchen-tools-2024',
    },
  ]

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'all') return posts
    return posts.filter(p => p.category === selectedCategory)
  }, [selectedCategory, posts])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : locale === 'zh' ? 'zh-CN' : 'en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail.trim()) return
    setSubscribed(true)
    setTimeout(() => {
      setSubscribed(false)
      setNewsletterEmail('')
    }, 4000)
  }

  return (
    <SharedLayout showHero={true}>
      <div className="bg-slate-50/70 min-h-screen">
        {/* =========================================================================
            1. HERO SECTION (Design 3 Navy Gradient & Trust Badges)
           ========================================================================= */}
        <section className="relative bg-gradient-to-b from-[#0B192C] via-[#00407a] to-[#0B192C] text-white py-14 sm:py-18 overflow-hidden border-b border-slate-800">
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#F5A602_1px,transparent_1px)] [background-size:24px_24px]"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00B4D8]/10 rounded-full blur-3xl pointer-events-none"></div>

          <Container className="relative z-10">
            {/* Breadcrumb Pill */}
            <nav className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-slate-200 mb-5">
              <LocaleLink href="/" className="hover:text-white transition">
                {locale === 'ru' ? 'Главная' : locale === 'zh' ? '首页' : 'Home'}
              </LocaleLink>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-[#F5A602] font-semibold">{t('title')}</span>
            </nav>

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#F5A602]/20 border border-[#F5A602]/40 text-[#F5A602] text-xs font-black uppercase tracking-wider mb-3 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{locale === 'ru' ? 'Торговая аналитика и практические руководства' : locale === 'zh' ? '外贸知识库与出海洞察' : 'Global Trade Intelligence & Guides'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
                {companyName} {t('heading')}
              </h1>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                {t('subheading')}
              </p>

              {/* Trust Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/15 mt-8">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <span>Direct Playbooks</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <span>Market Trends</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>Audit Insights</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <Globe2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Global Corridors</span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* =========================================================================
            2. CATEGORY FILTER STRIP
           ========================================================================= */}
        <section className="relative -mt-6 z-20">
          <Container>
            <div className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-xs border border-slate-200/80 flex flex-wrap items-center gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00407a] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </Container>
        </section>

        {/* =========================================================================
            3. ARTICLES GRID & NEWSLETTER
           ========================================================================= */}
        <section className="py-12 sm:py-16">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {filteredPosts.map((post) => (
                <LocaleLink
                  key={post.href}
                  href={post.href}
                  className="bg-white rounded-3xl overflow-hidden shadow-xs border border-slate-200/80 hover:border-[#00407a]/40 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gradient-to-br from-[#0B192C] to-[#00407a] relative overflow-hidden">
                      {post.image ? (
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <BookOpen className="w-12 h-12" />
                        </div>
                      )}
                      <span className="absolute top-3.5 left-3.5 bg-[#00407a] text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-2xs border border-white/20">
                        {post.category}
                      </span>
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(post.date)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {post.readTime}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#00407a] transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">By {post.author}</span>
                    <span className="inline-flex items-center gap-1 text-[#00407a] font-bold group-hover:translate-x-0.5 transition-transform">
                      <span>Read Article</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </LocaleLink>
              ))}
            </div>

            {/* Newsletter Subscription Strip */}
            <div className="mt-14 rounded-3xl bg-gradient-to-br from-slate-900 via-[#00407a] to-slate-900 text-white p-8 sm:p-12 shadow-sm border border-slate-800">
              <div className="max-w-2xl mx-auto text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-amber-300 flex items-center justify-center mx-auto border border-white/15">
                  <Mail className="w-6 h-6" />
                </div>

                <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {locale === 'ru' ? 'Получайте оптовую аналитику Китая' : locale === 'zh' ? '订阅中国供应链行情周报' : 'Subscribe to Global Trade & China Sourcing Alerts'}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                  {locale === 'ru' 
                    ? 'Анализ фрахтовых ставок, изменения таможенного законодательства и списки проверенных фабрик прямо на вашу почту.'
                    : locale === 'zh' 
                    ? '一手工厂底价盘点、海关商品税率变动及海运拼箱专线行情，每周精准直达您的邮箱。'
                    : 'Get weekly spot freight benchmarks, customs tariff updates, and verified factory lists delivered to your inbox.'}
                </p>

                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={locale === 'ru' ? 'Введите рабочий email...' : locale === 'zh' ? '输入您的商务邮箱...' : 'Enter your business email...'}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F5A602] text-xs transition"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-[#F5A602] hover:bg-[#d99200] text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                  >
                    <span>{subscribed ? (locale === 'ru' ? 'Подписан!' : 'Subscribed!') : (locale === 'ru' ? 'Подписаться' : 'Subscribe')}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </Container>
        </section>
      </div>
    </SharedLayout>
  )
}
