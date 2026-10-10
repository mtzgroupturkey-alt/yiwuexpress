'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText, Plus, RefreshCw, ChevronRight, Edit, Eye, CheckCircle2,
  Globe2, Sparkles, AlertCircle, Save, ExternalLink, X, Building2,
  ShieldCheck, Layers, HelpCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { AutoTranslateButton } from '@/components/admin/AutoTranslateButton'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export type LocaleCode = 'en' | 'ru' | 'zh'

const LOCALES: { code: LocaleCode; label: string; flag: string }[] = [
  { code: 'en', label: 'English (Default)', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'zh', label: '中文', flag: '🇨🇳' }
]

interface CmsPageTranslationItem {
  id?: string
  locale: string
  title?: string | null
  subtitle?: string | null
  badge?: string | null
  content?: string | null
  metaTitle?: string | null
  metaDesc?: string | null
  sections?: Record<string, any> | null
}

interface CmsPageItem {
  id: string
  slug: string
  title: string
  subtitle?: string | null
  badge?: string | null
  content: string
  metaTitle: string | null
  metaDesc: string | null
  sections?: Record<string, any> | null
  isPublished: boolean
  updatedAt: string
  translations?: CmsPageTranslationItem[]
}

// Editable form state representing all three languages
interface PageEditorState {
  id?: string
  slug: string
  isPublished: boolean
  // Localized fields per locale
  locales: Record<LocaleCode, {
    title: string
    subtitle: string
    badge: string
    content: string
    metaTitle: string
    metaDesc: string
    sections: Record<string, string>
  }>
}

const EMPTY_EDITOR_STATE: PageEditorState = {
  slug: '',
  isPublished: true,
  locales: {
    en: {
      title: '',
      subtitle: '',
      badge: '',
      content: '',
      metaTitle: '',
      metaDesc: '',
      sections: {}
    },
    ru: {
      title: '',
      subtitle: '',
      badge: '',
      content: '',
      metaTitle: '',
      metaDesc: '',
      sections: {}
    },
    zh: {
      title: '',
      subtitle: '',
      badge: '',
      content: '',
      metaTitle: '',
      metaDesc: '',
      sections: {}
    }
  }
}

export default function ContentPagesPage() {
  const { dict, locale: adminLocale } = useAdminLocale()
  const t = (dict as any)?.contentPages || {}
  const [loading, setLoading] = useState(true)
  const [pages, setPages] = useState<CmsPageItem[]>([])
  const [editorState, setEditorState] = useState<PageEditorState | null>(null)
  const [activeTab, setActiveTab] = useState<LocaleCode>('en')
  const [submitting, setSubmitting] = useState(false)
  const [activeSectionTab, setActiveSectionTab] = useState<'main' | 'formFields' | 'seo' | 'body'>('main')

  const fetchPages = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/content/pages')
      const json = await res.json()
      if (json.success && json.data) {
        setPages(json.data)
      }
    } catch (err) {
      console.error('Failed to load CMS pages:', err)
      toast.error(t.loadPagesFailedToast || 'Failed to load pages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPages()
  }, [])

  const handleOpenEdit = (page: CmsPageItem) => {
    const ruTrans = page.translations?.find((t) => t.locale === 'ru')
    const zhTrans = page.translations?.find((t) => t.locale === 'zh')

    const newEditorState: PageEditorState = {
      id: page.id,
      slug: page.slug,
      isPublished: page.isPublished,
      locales: {
        en: {
          title: page.title || '',
          subtitle: page.subtitle || '',
          badge: page.badge || '',
          content: page.content || '',
          metaTitle: page.metaTitle || '',
          metaDesc: page.metaDesc || '',
          sections: (page.sections && typeof page.sections === 'object' ? page.sections : {}) as Record<string, string>
        },
        ru: {
          title: ruTrans?.title || '',
          subtitle: ruTrans?.subtitle || '',
          badge: ruTrans?.badge || '',
          content: ruTrans?.content || '',
          metaTitle: ruTrans?.metaTitle || '',
          metaDesc: ruTrans?.metaDesc || '',
          sections: (ruTrans?.sections && typeof ruTrans.sections === 'object' ? ruTrans.sections : {}) as Record<string, string>
        },
        zh: {
          title: zhTrans?.title || '',
          subtitle: zhTrans?.subtitle || '',
          badge: zhTrans?.badge || '',
          content: zhTrans?.content || '',
          metaTitle: zhTrans?.metaTitle || '',
          metaDesc: zhTrans?.metaDesc || '',
          sections: (zhTrans?.sections && typeof zhTrans.sections === 'object' ? zhTrans.sections : {}) as Record<string, string>
        }
      }
    }

    setEditorState(newEditorState)
    setActiveTab('en')
    setActiveSectionTab(page.slug === 'register-b2b' ? 'main' : 'main')
  }

  const handleOpenCreate = () => {
    setEditorState({
      ...EMPTY_EDITOR_STATE,
      slug: 'new-page',
      locales: {
        en: { title: 'New Page', subtitle: '', badge: '', content: '<p>Write your content here...</p>', metaTitle: '', metaDesc: '', sections: {} },
        ru: { title: '', subtitle: '', badge: '', content: '', metaTitle: '', metaDesc: '', sections: {} },
        zh: { title: '', subtitle: '', badge: '', content: '', metaTitle: '', metaDesc: '', sections: {} }
      }
    })
    setActiveTab('en')
    setActiveSectionTab('main')
  }

  const updateCurrentLocaleField = (field: 'title' | 'subtitle' | 'badge' | 'content' | 'metaTitle' | 'metaDesc', value: string) => {
    if (!editorState) return
    setEditorState({
      ...editorState,
      locales: {
        ...editorState.locales,
        [activeTab]: {
          ...editorState.locales[activeTab],
          [field]: value
        }
      }
    })
  }

  const updateCurrentLocaleSection = (key: string, value: string) => {
    if (!editorState) return
    setEditorState({
      ...editorState,
      locales: {
        ...editorState.locales,
        [activeTab]: {
          ...editorState.locales[activeTab],
          sections: {
            ...editorState.locales[activeTab].sections,
            [key]: value
          }
        }
      }
    })
  }

  const handleAutoTranslated = (translatedAttrs: Record<string, Record<string, string>>) => {
    if (!editorState) return
    const nextState = { ...editorState }

    const targetLocales: LocaleCode[] = ['ru', 'zh', 'en'].filter(l => l !== activeTab) as LocaleCode[]

    for (const targetLoc of targetLocales) {
      const translatedMap = translatedAttrs[targetLoc]
      if (translatedMap) {
        nextState.locales[targetLoc] = {
          ...nextState.locales[targetLoc],
          title: translatedMap.title || nextState.locales[targetLoc].title,
          subtitle: translatedMap.subtitle || nextState.locales[targetLoc].subtitle,
          badge: translatedMap.badge || nextState.locales[targetLoc].badge,
          metaTitle: translatedMap.metaTitle || nextState.locales[targetLoc].metaTitle,
          metaDesc: translatedMap.metaDesc || nextState.locales[targetLoc].metaDesc,
          sections: {
            ...nextState.locales[targetLoc].sections,
            ...Object.keys(translatedMap)
              .filter(k => !['title', 'subtitle', 'badge', 'metaTitle', 'metaDesc'].includes(k))
              .reduce((acc, k) => {
                acc[k] = translatedMap[k]
                return acc
              }, {} as Record<string, string>)
          }
        }
      }
    }

    setEditorState(nextState)
    toast.success(t.translationsGeneratedToast || 'Translations generated! Review and click Save Page.')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editorState) return
    if (!editorState.slug.trim()) {
      toast.error(t.slugRequiredToast || 'Slug is required')
      return
    }
    if (!editorState.locales.en.title.trim()) {
      toast.error(t.englishTitleRequiredToast || 'English page title is required')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        slug: editorState.slug.trim().toLowerCase(),
        isPublished: editorState.isPublished,
        // Canonical English fields
        title: editorState.locales.en.title,
        subtitle: editorState.locales.en.subtitle,
        badge: editorState.locales.en.badge,
        content: editorState.locales.en.content,
        metaTitle: editorState.locales.en.metaTitle,
        metaDesc: editorState.locales.en.metaDesc,
        sections: editorState.locales.en.sections,
        // Non-English translations
        translations: [
          {
            locale: 'ru',
            title: editorState.locales.ru.title,
            subtitle: editorState.locales.ru.subtitle,
            badge: editorState.locales.ru.badge,
            content: editorState.locales.ru.content,
            metaTitle: editorState.locales.ru.metaTitle,
            metaDesc: editorState.locales.ru.metaDesc,
            sections: editorState.locales.ru.sections
          },
          {
            locale: 'zh',
            title: editorState.locales.zh.title,
            subtitle: editorState.locales.zh.subtitle,
            badge: editorState.locales.zh.badge,
            content: editorState.locales.zh.content,
            metaTitle: editorState.locales.zh.metaTitle,
            metaDesc: editorState.locales.zh.metaDesc,
            sections: editorState.locales.zh.sections
          }
        ]
      }

      const res = await fetch('/api/admin/content/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(t.pageSavedToast ? t.pageSavedToast.replace('{slug}', editorState.slug) : `Page "/${editorState.slug}" saved successfully!`)
        setEditorState(null)
        fetchPages()
      } else {
        toast.error(json.error || 'Failed to save page')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred while saving')
    } finally {
      setSubmitting(false)
    }
  }

  // Prepares all fields of active locale for auto-translate
  const getFieldsForTranslation = () => {
    if (!editorState) return {}
    const current = editorState.locales[activeTab]
    const map: Record<string, string> = {
      title: current.title || '',
      subtitle: current.subtitle || '',
      badge: current.badge || '',
      metaTitle: current.metaTitle || '',
      metaDesc: current.metaDesc || '',
    }
    // Also include structured sections
    if (current.sections) {
      for (const [k, v] of Object.entries(current.sections)) {
        if (typeof v === 'string' && v.trim()) {
          map[k] = v
        }
      }
    }
    return map
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 text-[#00407a]">
              <Layers size={20} />
            </span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {t.pageTitle || 'Dynamic Static Pages & CMS Manager'}
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            {t.pageSubtitle || 'Dynamically update page titles, hero headings, subtitles, custom form labels, trust badges, and rich content across all supported languages (EN, RU, ZH).'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchPages} disabled={loading} className="rounded-xl gap-1.5 text-xs">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {t.refreshBtn || 'Refresh'}
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="rounded-xl text-xs gap-1.5 bg-[#00407a] hover:bg-[#003366] text-white shadow-xs"
          >
            <Plus size={14} />
            {t.addCustomPageBtn || 'Add Custom Page'}
          </Button>
        </div>
      </div>

      {/* Pages Table */}
      <Card className="rounded-2xl border-gray-200/80 shadow-xs overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-[#00407a] rounded-full animate-spin" />
              <p className="text-xs text-gray-400 mt-3 font-medium">
                {t.loadingPages || 'Loading managed pages...'}
              </p>
            </div>
          ) : pages.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs">
              {t.noPagesFound || 'No pages found. Click "Add Custom Page" to create one.'}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-5">{t.thPageName || 'Page Name & Purpose'}</th>
                  <th className="py-3.5 px-4">{t.thStorefrontUrl || 'Storefront URL'}</th>
                  <th className="py-3.5 px-4">{t.thAvailableLocales || 'Available Locales'}</th>
                  <th className="py-3.5 px-4">{t.thStatus || 'Status'}</th>
                  <th className="py-3.5 px-4">{t.thLastUpdated || 'Last Updated'}</th>
                  <th className="py-3.5 px-5 text-right">{t.thActions || 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pages.map((p) => {
                  const isSpecial = p.slug === 'register-b2b'
                  return (
                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSpecial ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {isSpecial ? <Building2 size={16} /> : <FileText size={16} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">{p.title}</span>
                              {isSpecial && (
                                <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-2 py-0.5 rounded-full">
                                  {t.coreB2bBadge || 'CORE B2B PAGE'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 truncate max-w-sm mt-0.5">
                              {p.subtitle || p.badge || (t.staticDefaultDesc || 'Static content page with dynamic controls')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/${adminLocale || 'en'}/${p.slug}`}
                          target="_blank"
                          className="font-mono text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold group"
                        >
                          <span>/{p.slug}</span>
                          <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">EN</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            p.translations?.some(t => t.locale === 'ru' && t.title) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                          }`}>RU</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            p.translations?.some(t => t.locale === 'zh' && t.title) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                          }`}>ZH</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.isPublished ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {p.isPublished ? (t.liveAndActive || 'Live & Active') : (t.draft || 'Draft')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/${adminLocale || 'en'}/${p.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title={t.viewLivePage || 'View Live Page in Storefront'}
                          >
                            <Eye size={15} />
                          </Link>
                          <Button
                            size="sm"
                            onClick={() => handleOpenEdit(p)}
                            className="rounded-xl text-xs h-8 px-3 bg-[#00407a] hover:bg-[#003366] text-white flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit size={13} />
                            <span>{t.editContentBtn || 'Edit Content'}</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* =========================================================================
          SLIDE-OVER / MODAL DRAWER FOR EDITING PAGE CONTENT
          ========================================================================= */}
      {editorState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#00407a] text-white flex items-center justify-center shadow-xs">
                  <Edit size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900">
                      {t.editPageTitle ? t.editPageTitle.replace('{slug}', editorState.slug) : `Edit Page: /${editorState.slug}`}
                    </h2>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-[#00407a] font-mono font-bold">
                      {t.dynamicCmsBadge || 'Dynamic CMS'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t.liveChangesNote || 'Live changes apply to storefront immediately across all locales.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/${activeTab}/${editorState.slug}`}
                  target="_blank"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <Eye size={13} />
                  <span>
                    {t.viewLiveLocale ? t.viewLiveLocale.replace('{locale}', activeTab.toUpperCase()) : `View Live (${activeTab.toUpperCase()})`}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setEditorState(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Language Switcher Bar with Auto-Translate */}
            <div className="px-6 py-2.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">
                  {t.languageLabel || 'Language:'}
                </span>
                {LOCALES.map(({ code, label, flag }) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setActiveTab(code)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === code
                        ? 'bg-[#00407a] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{flag}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <div>
                <AutoTranslateButton
                  sourceLocale={activeTab}
                  sourceFields={getFieldsForTranslation()}
                  onTranslated={handleAutoTranslated}
                  disabled={submitting}
                  label={t.autoTranslateLabel ? t.autoTranslateLabel.replace('{locale}', LOCALES.find(l => l.code === activeTab)?.label.split(' ')[0] || '') : `✨ Auto-Translate from ${LOCALES.find(l => l.code === activeTab)?.label.split(' ')[0]}`}
                />
              </div>
            </div>

            {/* Tab navigation inside page editor */}
            <div className="px-6 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveSectionTab('main')}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeSectionTab === 'main'
                    ? 'border-[#00407a] text-[#00407a]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.tabHeadings || '1. Page Headings & Titles'}
              </button>

              {editorState.slug === 'register-b2b' && (
                <button
                  type="button"
                  onClick={() => setActiveSectionTab('formFields')}
                  className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeSectionTab === 'formFields'
                      ? 'border-[#00407a] text-[#00407a]'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Building2 size={13} className="text-amber-600" />
                  <span>{t.tabB2bFormFields || '2. B2B Registration Form Fields'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveSectionTab('seo')}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeSectionTab === 'seo'
                    ? 'border-[#00407a] text-[#00407a]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {editorState.slug === 'register-b2b' ? '3.' : '2.'} {t.tabSeo || 'SEO Meta Tags'}
              </button>

              <button
                type="button"
                onClick={() => setActiveSectionTab('body')}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeSectionTab === 'body'
                    ? 'border-[#00407a] text-[#00407a]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {editorState.slug === 'register-b2b' ? '4.' : '3.'} {t.tabRichContent || 'Rich Article Content (WYSIWYG)'}
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Active language reminder banner */}
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs text-[#00407a]">
                <div className="flex items-center gap-2">
                  <span className="text-base">{LOCALES.find(l => l.code === activeTab)?.flag}</span>
                  <span className="font-bold">
                    {t.editingLanguageBanner ? t.editingLanguageBanner.replace('{label}', LOCALES.find(l => l.code === activeTab)?.label || '') : `Editing language: ${LOCALES.find(l => l.code === activeTab)?.label}`}
                  </span>
                </div>
                <span className="text-[11px] text-blue-600">
                  {t.switchTabsHint || 'Switch tabs above to edit Russian or Chinese translations'}
                </span>
              </div>

              {/* =========================================================
                  SECTION 1: MAIN TITLES & HEADINGS
                  ========================================================= */}
              {activeSectionTab === 'main' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        {t.labelTitleHeading || 'Page Title / Main Heading'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editorState.locales[activeTab].title}
                        onChange={(e) => updateCurrentLocaleField('title', e.target.value)}
                        placeholder="e.g. Apply for B2B Wholesale Account"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">
                        {t.hintTitleHeading || 'Displayed as the main <h1> header on the page'}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        {t.labelEyebrowBadge || 'Top Badge / Eyebrow Tag'}
                      </label>
                      <input
                        type="text"
                        value={editorState.locales[activeTab].badge}
                        onChange={(e) => updateCurrentLocaleField('badge', e.target.value)}
                        placeholder="e.g. B2B Commercial Registration"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">
                        {t.hintEyebrowBadge || 'Pill badge shown above the main title'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      {t.labelSubtitleDesc || 'Subtitle / Introduction Description'}
                    </label>
                    <textarea
                      rows={2}
                      value={editorState.locales[activeTab].subtitle}
                      onChange={(e) => updateCurrentLocaleField('subtitle', e.target.value)}
                      placeholder="e.g. Register your company to access wholesale catalog pricing and commercial terms"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      {t.hintSubtitleDesc || 'Introductory sentence shown under the title'}
                    </p>
                  </div>

                  {activeTab === 'en' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          {t.labelSlugRoute || 'Slug URL Route'} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editorState.slug}
                          onChange={(e) => setEditorState({ ...editorState, slug: e.target.value })}
                          placeholder="e.g. register-b2b"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                        />
                        <p className="text-[11px] text-gray-400 mt-1">
                          {t.hintSlugRoute ? t.hintSlugRoute.replace('{locale}', activeTab).replace('{slug}', editorState.slug) : `Accessible at: /${activeTab}/${editorState.slug}`}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 self-end">
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            {t.labelPublishStatus || 'Publish Status'}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {t.hintPublishStatus || 'Make visible on storefront'}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={editorState.isPublished}
                          onChange={(e) => setEditorState({ ...editorState, isPublished: e.target.checked })}
                          className="w-4 h-4 rounded text-[#00407a] cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================
                  SECTION 2: B2B REGISTRATION FORM FIELDS & LABELS
                  ========================================================= */}
              {activeSectionTab === 'formFields' && editorState.slug === 'register-b2b' && (
                <div className="space-y-6">
                  {/* Stepper Titles */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={14} className="text-[#00407a]" />
                      {t.stepperSectionTitle || 'Multi-Step Indicator Titles'}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          {t.labelStep1Title || 'Step 1 Title'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.step1Title || ''}
                          onChange={(e) => updateCurrentLocaleSection('step1Title', e.target.value)}
                          placeholder="e.g. Business Information"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          {t.labelStep1Subtitle || 'Step 1 Subtitle'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.step1Subtitle || ''}
                          onChange={(e) => updateCurrentLocaleSection('step1Subtitle', e.target.value)}
                          placeholder="e.g. Company & Registration"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          {t.labelStep2Title || 'Step 2 Title'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.step2Title || ''}
                          onChange={(e) => updateCurrentLocaleSection('step2Title', e.target.value)}
                          placeholder="e.g. Account & Credentials"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          {t.labelStep2Subtitle || 'Step 2 Subtitle'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.step2Subtitle || ''}
                          onChange={(e) => updateCurrentLocaleSection('step2Subtitle', e.target.value)}
                          placeholder="e.g. Contact & License"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Field Labels */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      {t.step1InputsTitle || 'Step 1 Form Input Labels & Placeholders'}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          {t.labelCompanyName || 'Company Name Label'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.companyNameLabel || ''}
                          onChange={(e) => updateCurrentLocaleSection('companyNameLabel', e.target.value)}
                          placeholder="Company Name"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          {t.labelTaxId || 'Tax ID / Registration Label'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.taxIdLabel || ''}
                          onChange={(e) => updateCurrentLocaleSection('taxIdLabel', e.target.value)}
                          placeholder="Tax ID / Registration Number"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          {t.labelCountry || 'Country Label'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.countryLabel || ''}
                          onChange={(e) => updateCurrentLocaleSection('countryLabel', e.target.value)}
                          placeholder="Country"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          {t.labelCity || 'City Label'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.cityLabel || ''}
                          onChange={(e) => updateCurrentLocaleSection('cityLabel', e.target.value)}
                          placeholder="City"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          {t.labelAddress || 'Registered Address Label'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.addressLabel || ''}
                          onChange={(e) => updateCurrentLocaleSection('addressLabel', e.target.value)}
                          placeholder="Registered Address"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 2 Inputs & Upload */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      {t.step2InputsTitle || 'Step 2 Contact, License & Action Buttons'}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          {t.labelContactName || 'Contact Person Label'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.contactNameLabel || ''}
                          onChange={(e) => updateCurrentLocaleSection('contactNameLabel', e.target.value)}
                          placeholder="Contact Person Full Name"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          {t.labelEmail || 'Email Label'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.emailLabel || ''}
                          onChange={(e) => updateCurrentLocaleSection('emailLabel', e.target.value)}
                          placeholder="Business Email Address"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          {t.labelPhone || 'Phone / WhatsApp Label'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.phoneLabel || ''}
                          onChange={(e) => updateCurrentLocaleSection('phoneLabel', e.target.value)}
                          placeholder="Phone / WhatsApp"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          {t.labelLicenseTitle || 'License Upload Box Title'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.licenseUploadTitle || ''}
                          onChange={(e) => updateCurrentLocaleSection('licenseUploadTitle', e.target.value)}
                          placeholder="Click to upload Business License or Certificate of Incorporation"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          {t.labelLicenseHint || 'License Upload Format Hint'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.licenseUploadHint || ''}
                          onChange={(e) => updateCurrentLocaleSection('licenseUploadHint', e.target.value)}
                          placeholder="PDF, JPG, or PNG (Maximum file size: 5 MB)"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          {t.labelNextButton || 'Continue Button'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.nextButton || ''}
                          onChange={(e) => updateCurrentLocaleSection('nextButton', e.target.value)}
                          placeholder="Continue to Account Info"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          {t.labelBackButton || 'Back Button'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.backButton || ''}
                          onChange={(e) => updateCurrentLocaleSection('backButton', e.target.value)}
                          placeholder="Back"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          {t.labelSubmitButton || 'Submit Button'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.submitButton || ''}
                          onChange={(e) => updateCurrentLocaleSection('submitButton', e.target.value)}
                          placeholder="Submit B2B Application"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          {t.labelFooterPrompt || 'Footer Prompt'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.footerPrompt || ''}
                          onChange={(e) => updateCurrentLocaleSection('footerPrompt', e.target.value)}
                          placeholder="Already have an active B2B account?"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          {t.labelFooterLink || 'Footer Link Text'}
                        </label>
                        <input
                          type="text"
                          value={editorState.locales[activeTab].sections?.footerLinkText || ''}
                          onChange={(e) => updateCurrentLocaleSection('footerLinkText', e.target.value)}
                          placeholder="Sign in to Wholesale Portal"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================
                  SECTION 3: SEO META TAGS
                  ========================================================= */}
              {activeSectionTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      {t.labelSeoMetaTitle || 'SEO Meta Title (Browser Tab Title)'}
                    </label>
                    <input
                      type="text"
                      value={editorState.locales[activeTab].metaTitle}
                      onChange={(e) => updateCurrentLocaleField('metaTitle', e.target.value)}
                      placeholder="e.g. Apply for B2B Wholesale Account | Global Trade"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      {t.hintSeoMetaTitle || 'Recommended length: 50-60 characters'}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      {t.labelSeoMetaDesc || 'SEO Meta Description'}
                    </label>
                    <textarea
                      rows={3}
                      value={editorState.locales[activeTab].metaDesc}
                      onChange={(e) => updateCurrentLocaleField('metaDesc', e.target.value)}
                      placeholder="e.g. Register for a corporate business account to access direct factory wholesale pricing, flexible MOQs, and consolidated China export logistics."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      {t.hintSeoMetaDesc || 'Recommended length: 150-160 characters'}
                    </p>
                  </div>
                </div>
              )}

              {/* =========================================================
                  SECTION 4: RICH ARTICLE BODY CONTENT (WYSIWYG)
                  ========================================================= */}
              {activeSectionTab === 'body' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 block">
                      {t.labelBodyContent || 'Body Content (Rich Text / Article Guidance)'}
                    </label>
                    <span className="text-[11px] text-gray-400">
                      {t.hintBodyContent || 'Renders custom HTML formatted content or terms'}
                    </span>
                  </div>
                  <RichTextEditor
                    value={editorState.locales[activeTab].content}
                    onChange={(val) => updateCurrentLocaleField('content', val)}
                  />
                </div>
              )}

              {/* Footer action bar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditorState(null)}
                  className="rounded-xl text-xs cursor-pointer"
                >
                  {t.cancelBtn || 'Cancel'}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submitting}
                    className="bg-[#00407a] hover:bg-[#003366] text-white rounded-xl text-xs font-bold px-5 h-9 flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Save size={14} />
                    <span>{submitting ? (t.savingChangesBtn || 'Saving Live Changes...') : (t.saveAndPublishBtn || 'Save Page & Publish')}</span>
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
