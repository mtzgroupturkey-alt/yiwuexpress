'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tv,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  Trash2,
  Search,
  Layers,
  ArrowRight,
  Sparkles,
  Cpu,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface ProductSearchItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  thumbnail: string | null;
  category?: { name: string } | null;
}

type TranslationLocale = 'en' | 'ru' | 'zh';

interface SectionTextValues {
  title: string;
  subtitle: string;
  badgeText: string;
  viewAllLabel: string;
}

export default function ElectronicsSectionSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeLocaleTab, setActiveLocaleTab] = useState<TranslationLocale>('en');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [enabled, setEnabled] = useState(true);
  const [maxProducts, setMaxProducts] = useState(8);

  // Multi-language text state (English, Russian, Chinese)
  const [textTranslations, setTextTranslations] = useState<Record<TranslationLocale, SectionTextValues>>({
    en: {
      title: 'Popular in Electronics & Appliances',
      subtitle: 'Official manufacturer equipment with factory guarantee',
      badgeText: 'ELECTRONICS & APPLIANCES',
      viewAllLabel: 'View all in category',
    },
    ru: {
      title: 'Популярное в электронике и технике',
      subtitle: 'Официальная техника от производителей с заводской гарантией',
      badgeText: 'ЭЛЕКТРОНИКА И ТЕХНИКА',
      viewAllLabel: 'Смотреть всю категорию',
    },
    zh: {
      title: '热销家电与数码装备',
      subtitle: '官方正品行货，全国联保与原厂售后质保',
      badgeText: '智能家电与数码',
      viewAllLabel: '查看本类全部商品',
    },
  });

  // Categories
  const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Pinned Products
  const [pinnedProducts, setPinnedProducts] = useState<ProductSearchItem[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSearchItem[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Load Settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/electronics-section');
      if (!res.ok) throw new Error('Failed to load electronics section settings');
      const data = await res.json();

      if (data.settings) {
        const s = data.settings;
        setEnabled(s.electronicsSectionEnabled !== false);
        setMaxProducts(s.electronicsSectionMaxProducts || 8);

        const loadedTranslations: Record<TranslationLocale, SectionTextValues> = {
          en: {
            title: s.electronicsSectionTitle || 'Popular in Electronics & Appliances',
            subtitle: s.electronicsSectionSubtitle || 'Official manufacturer equipment with factory guarantee',
            badgeText: s.electronicsSectionBadge || 'ELECTRONICS & APPLIANCES',
            viewAllLabel: s.electronicsSectionViewAllLabel || 'View all in category',
          },
          ru: {
            title: 'Популярное в электронике и технике',
            subtitle: 'Официальная техника от производителей с заводской гарантией',
            badgeText: 'ЭЛЕКТРОНИКА И ТЕХНИКА',
            viewAllLabel: 'Смотреть всю категорию',
          },
          zh: {
            title: '热销家电与数码装备',
            subtitle: '官方正品行货，全国联保与原厂售后质保',
            badgeText: '智能家电与数码',
            viewAllLabel: '查看本类全部商品',
          },
        };

        if (Array.isArray(data.translations)) {
          for (const t of data.translations) {
            if (t.locale === 'ru' || t.locale === 'zh' || t.locale === 'en') {
              const loc = t.locale as TranslationLocale;
              if (t.key === 'electronicsSectionTitle' && t.value) loadedTranslations[loc].title = t.value;
              if (t.key === 'electronicsSectionSubtitle' && t.value) loadedTranslations[loc].subtitle = t.value;
              if (t.key === 'electronicsSectionBadge' && t.value) loadedTranslations[loc].badgeText = t.value;
              if (t.key === 'electronicsSectionViewAllLabel' && t.value) loadedTranslations[loc].viewAllLabel = t.value;
            }
          }
        }

        setTextTranslations(loadedTranslations);

        if (s.electronicsSectionCategoryIds) {
          const ids = s.electronicsSectionCategoryIds.split(',').map((id: string) => id.trim()).filter(Boolean);
          setSelectedCategoryIds(ids);
        } else {
          setSelectedCategoryIds([]);
        }
      }

      setAvailableCategories(data.categories || []);
      setPinnedProducts(data.pinnedProducts || []);
    } catch (err: any) {
      showToast('error', err.message || 'Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auto translate across all locales
  const handleAutoTranslate = async () => {
    setIsTranslating(true);
    try {
      const sourceLocale = activeLocaleTab;
      const sourceValues = textTranslations[sourceLocale];

      if (!sourceValues.title.trim()) {
        showToast('error', 'Please enter a Section Title before translating');
        return;
      }

      const targetLocales: TranslationLocale[] = (['en', 'ru', 'zh'] as TranslationLocale[]).filter(
        (l) => l !== sourceLocale
      );

      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            title: sourceValues.title,
            subtitle: sourceValues.subtitle,
            badgeText: sourceValues.badgeText,
            viewAllLabel: sourceValues.viewAllLabel,
          },
          targetLocales,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast('error', data?.error || 'Translation request failed');
        return;
      }

      const incoming: Record<string, Record<string, string>> = data.translations || {};

      setTextTranslations((prev) => {
        const next = { ...prev };
        for (const loc of targetLocales) {
          if (incoming[loc]) {
            next[loc] = {
              title: incoming[loc].title || prev[loc].title,
              subtitle: incoming[loc].subtitle || prev[loc].subtitle,
              badgeText: incoming[loc].badgeText || prev[loc].badgeText,
              viewAllLabel: incoming[loc].viewAllLabel || prev[loc].viewAllLabel,
            };
          }
        }
        return next;
      });

      showToast('success', 'Successfully translated to all languages! Click Save Settings to apply.');
    } catch (err: any) {
      console.error('Auto-translate error:', err);
      showToast('error', 'Failed to translate texts. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Save Settings
  const handleSave = async () => {
    setSaving(true);
    try {
      const apiTranslations: Array<{ locale: string; key: string; value: string }> = [];
      (['en', 'ru', 'zh'] as TranslationLocale[]).forEach((loc) => {
        const row = textTranslations[loc];
        if (row.title) apiTranslations.push({ locale: loc, key: 'electronicsSectionTitle', value: row.title.trim() });
        if (row.subtitle) apiTranslations.push({ locale: loc, key: 'electronicsSectionSubtitle', value: row.subtitle.trim() });
        if (row.badgeText) apiTranslations.push({ locale: loc, key: 'electronicsSectionBadge', value: row.badgeText.trim() });
        if (row.viewAllLabel) apiTranslations.push({ locale: loc, key: 'electronicsSectionViewAllLabel', value: row.viewAllLabel.trim() });
      });

      const payload = {
        electronicsSectionEnabled: enabled,
        electronicsSectionTitle: textTranslations.en.title.trim() || textTranslations[activeLocaleTab].title.trim(),
        electronicsSectionSubtitle: textTranslations.en.subtitle.trim() || textTranslations[activeLocaleTab].subtitle.trim(),
        electronicsSectionBadge: textTranslations.en.badgeText.trim() || textTranslations[activeLocaleTab].badgeText.trim(),
        electronicsSectionViewAllLabel: textTranslations.en.viewAllLabel.trim() || textTranslations[activeLocaleTab].viewAllLabel.trim(),
        electronicsSectionCategoryIds: selectedCategoryIds.join(','),
        electronicsSectionPinnedProductIds: pinnedProducts.map((p) => p.id).join(','),
        electronicsSectionMaxProducts: Number(maxProducts),
        translations: apiTranslations,
      };

      const res = await fetch('/api/admin/settings/electronics-section', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update settings');
      }

      showToast('success', 'Electronics & Appliances section settings saved successfully!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Category Selection
  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Auto-Select Electronics / Smart Lighting categories
  const handleAutoSelectElectronics = () => {
    const matchedIds = availableCategories
      .filter((c) => {
        const name = c.name.toLowerCase();
        const slug = c.slug.toLowerCase();
        return (
          name.includes('electr') ||
          name.includes('appliance') ||
          name.includes('smart') ||
          name.includes('lighting') ||
          name.includes('lamp') ||
          name.includes('bulb') ||
          name.includes('sensor') ||
          name.includes('tech') ||
          name.includes('tv') ||
          name.includes('vacuum') ||
          slug.includes('electronics') ||
          slug.includes('appliances') ||
          slug.includes('smart-lighting') ||
          slug.includes('lighting')
        );
      })
      .map((c) => c.id);

    setSelectedCategoryIds(matchedIds);
    showToast('success', `Auto-selected ${matchedIds.length} electronics & smart lighting categories`);
  };

  // Clear Category Selection
  const handleClearCategories = () => {
    setSelectedCategoryIds([]);
    showToast('success', 'Cleared categories filter. Block will use automatic keyword matching.');
  };

  // Search Products for Pinning
  const handleSearchProducts = async (query: string) => {
    setProductSearchQuery(query);
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchingProducts(true);
    try {
      const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(query)}&limit=15`);
      if (res.ok) {
        const data = await res.json();
        const items = data.products || data.data || [];
        setSearchResults(
          items.map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku || '',
            price: typeof p.price === 'number' ? p.price : parseFloat(p.price || '0'),
            thumbnail: p.thumbnail || (p.images && p.images[0]) || null,
            category: p.category ? { name: p.category.name || '' } : null,
          }))
        );
      }
    } catch (e) {
      console.error('Failed to search products', e);
    } finally {
      setSearchingProducts(false);
    }
  };

  // Add Product to Pinned
  const addPinnedProduct = (product: ProductSearchItem) => {
    if (pinnedProducts.some((p) => p.id === product.id)) {
      showToast('error', 'This product is already pinned');
      return;
    }
    setPinnedProducts([...pinnedProducts, product]);
    setIsSearchOpen(false);
    setProductSearchQuery('');
    setSearchResults([]);
    showToast('success', `Pinned "${product.name.slice(0, 30)}..." to top of section`);
  };

  // Remove Pinned Product
  const removePinnedProduct = (id: string) => {
    setPinnedProducts(pinnedProducts.filter((p) => p.id !== id));
  };

  // Filter Categories in view
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const filteredCategories = availableCategories.filter((c) =>
    c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Loading Electronics & Appliances settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
              <Tv className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Electronics & Appliances Block Settings
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Configure the titles, category filters, and featured products displayed in the Electronics & Appliances homepage section.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Storefront</span>
          </Link>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-xs"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </Button>
        </div>
      </div>

      {/* Main Switch: Enable Section */}
      <Card className="border-blue-100 bg-blue-50/40 shadow-xs">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">
                  Enable Electronics & Appliances Section on Homepage
                </span>
                <Badge variant={enabled ? 'default' : 'secondary'} className={enabled ? 'bg-blue-600' : ''}>
                  {enabled ? 'Active on Homepage' : 'Hidden'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                When enabled, this curated product block appears on your homepage with subcategory tabs.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Live Storefront Mock Preview */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="bg-slate-50/80 border-b border-slate-200 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-sm font-bold text-slate-800">
                Live Homepage Block Preview
              </CardTitle>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Storefront Preview
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="border border-slate-200/80 rounded-2xl p-6 bg-slate-50/30">
            <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 mb-4 border-b border-slate-200 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {textTranslations[activeLocaleTab].badgeText || 'ELECTRONICS & APPLIANCES'}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {textTranslations[activeLocaleTab].title || 'Popular in Electronics & Appliances'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {textTranslations[activeLocaleTab].subtitle || 'Official manufacturer equipment with factory guarantee'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto border border-slate-200/60">
                <span className="px-3.5 py-1.5 bg-white text-blue-800 font-bold rounded-lg text-xs shadow-xs">
                  All Popular
                </span>
                <span className="px-3 py-1.5 text-slate-600 font-bold text-xs">Smart Lighting</span>
                <span className="px-3 py-1.5 text-slate-600 font-bold text-xs">Ceiling Lights</span>
                <span className="px-3 py-1.5 text-slate-600 font-bold text-xs">Floor & Table Lamps</span>
                <span className="text-xs font-bold text-blue-800 flex items-center gap-1 px-3 py-1.5 ml-1">
                  {textTranslations[activeLocaleTab].viewAllLabel || 'View all in category'}
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(pinnedProducts.length > 0 ? pinnedProducts.slice(0, 4) : [1, 2, 3, 4]).map((item: any, i: number) => (
                <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="aspect-square bg-slate-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Cpu className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div className="h-3.5 bg-slate-200 rounded w-3/4 mb-1.5" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Text & Configuration */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Header Texts & Multi-Language Translations
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Configure titles, taglines, and badges in English, Russian, and Chinese. Click Translate to auto-fill all languages.
                  </CardDescription>
                </div>
                {/* Auto Translate Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoTranslate}
                  disabled={isTranslating}
                  className="bg-blue-50/70 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 text-xs font-bold gap-1.5 rounded-xl h-8 shadow-2xs shrink-0 cursor-pointer"
                >
                  {isTranslating ? (
                    <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>{isTranslating ? 'Translating...' : 'Translate to All'}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Language Selector Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
                {(
                  [
                    { code: 'en', label: 'English', flag: '🇬🇧' },
                    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
                    { code: 'zh', label: '中文', flag: '🇨🇳' },
                  ] as const
                ).map((item) => {
                  const isSelected = activeLocaleTab === item.code;
                  const hasValues = Boolean(
                    textTranslations[item.code].title?.trim() &&
                    textTranslations[item.code].subtitle?.trim()
                  );

                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setActiveLocaleTab(item.code)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      <span className="text-sm">{item.flag}</span>
                      <span>{item.label}</span>
                      {hasValues && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Completed" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Input Fields for Current Language */}
              <div className="space-y-3.5 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Section Title ({activeLocaleTab.toUpperCase()})
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {activeLocaleTab === 'en'
                        ? 'Main headline'
                        : `Headline in ${activeLocaleTab === 'ru' ? 'Russian' : 'Chinese'}`}
                    </span>
                  </div>
                  <Input
                    value={textTranslations[activeLocaleTab].title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTextTranslations((prev) => ({
                        ...prev,
                        [activeLocaleTab]: { ...prev[activeLocaleTab], title: val },
                      }));
                    }}
                    placeholder={
                      activeLocaleTab === 'ru'
                        ? 'Популярное в электронике и технике'
                        : activeLocaleTab === 'zh'
                        ? '热销家电与数码装备'
                        : 'Popular in Electronics & Appliances'
                    }
                    className="font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Subtitle / Tagline ({activeLocaleTab.toUpperCase()})
                    </label>
                    <span className="text-[10px] text-slate-400">Supporting promotional copy</span>
                  </div>
                  <Textarea
                    value={textTranslations[activeLocaleTab].subtitle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTextTranslations((prev) => ({
                        ...prev,
                        [activeLocaleTab]: { ...prev[activeLocaleTab], subtitle: val },
                      }));
                    }}
                    placeholder={
                      activeLocaleTab === 'ru'
                        ? 'Официальная техника от производителей с заводской гарантией'
                        : activeLocaleTab === 'zh'
                        ? '官方正品行货，全国联保与原厂售后质保'
                        : 'Official manufacturer equipment with factory guarantee'
                    }
                    rows={2}
                    className="font-medium text-xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Badge Text ({activeLocaleTab.toUpperCase()})
                    </label>
                    <Input
                      value={textTranslations[activeLocaleTab].badgeText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTextTranslations((prev) => ({
                          ...prev,
                          [activeLocaleTab]: { ...prev[activeLocaleTab], badgeText: val },
                        }));
                      }}
                      placeholder={
                        activeLocaleTab === 'ru'
                          ? 'ЭЛЕКТРОНИКА И ТЕХНИКА'
                          : activeLocaleTab === 'zh'
                          ? '智能家电与数码'
                          : 'ELECTRONICS & APPLIANCES'
                      }
                      className="font-medium text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      View All Button Label ({activeLocaleTab.toUpperCase()})
                    </label>
                    <Input
                      value={textTranslations[activeLocaleTab].viewAllLabel}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTextTranslations((prev) => ({
                          ...prev,
                          [activeLocaleTab]: { ...prev[activeLocaleTab], viewAllLabel: val },
                        }));
                      }}
                      placeholder={
                        activeLocaleTab === 'ru'
                          ? 'Смотреть всю категорию'
                          : activeLocaleTab === 'zh'
                          ? '查看本类全部商品'
                          : 'View all in category'
                      }
                      className="font-medium text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Maximum Products to Display
                </label>
                <select
                  value={maxProducts}
                  onChange={(e) => setMaxProducts(Number(e.target.value))}
                  aria-label="Maximum Products to Display"
                  className="w-full h-10 px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value={4}>4 Products (Single Row)</option>
                  <option value={8}>8 Products (2 Rows - Recommended)</option>
                  <option value={12}>12 Products (3 Rows)</option>
                  <option value={16}>16 Products (4 Rows)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Pinned Products */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Pinned / Highlighted Products ({pinnedProducts.length})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Pick specific products that will always appear first in this section.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSearchOpen(true)}
                className="text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pin a Product</span>
              </Button>
            </CardHeader>
            <CardContent>
              {pinnedProducts.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Cpu className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">No pinned products yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    The section automatically populates products from your selected categories. You can pin specific bestsellers above.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pinnedProducts.map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="w-9 h-9 rounded bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.thumbnail ? (
                            <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Cpu className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>SKU: {p.sku || 'N/A'}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">${p.price.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePinnedProduct(p.id)}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Category Selection Filter */}
        <div>
          <Card className="border-slate-200 shadow-xs h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Categories Filter
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Choose which categories supply products for this block.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAutoSelectElectronics}
                  className="text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50 gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Auto-Select Electronics</span>
                </Button>
              </div>

              {selectedCategoryIds.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                    Filtering by {selectedCategoryIds.length} selected category/categories
                  </Badge>
                  <button
                    type="button"
                    onClick={handleClearCategories}
                    className="text-xs text-rose-600 hover:underline font-medium cursor-pointer"
                  >
                    Clear Selection (Use Keyword Auto-Match)
                  </button>
                </div>
              )}

              <div className="relative pt-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-5" />
                <Input
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  placeholder="Search categories..."
                  className="pl-8 text-xs font-medium h-9"
                />
              </div>
            </CardHeader>

            <CardContent className="flex-1 max-h-[500px] overflow-y-auto space-y-1.5 pr-2">
              {filteredCategories.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No categories found matching filter</p>
              ) : (
                filteredCategories.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-white text-[9px] ${
                            isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && '✓'}
                        </div>
                        <span>{cat.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{cat.slug}</span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Pin Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Search Catalog to Pin Product</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchResults([]);
                  setProductSearchQuery('');
                }}
                className="text-slate-400 hover:text-slate-700 h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  autoFocus
                  value={productSearchQuery}
                  onChange={(e) => handleSearchProducts(e.target.value)}
                  placeholder="Type product name or SKU (e.g. Smart Bulb, Floor Lamp)..."
                  className="pl-9"
                />
              </div>

              <div className="max-h-[350px] overflow-y-auto space-y-1.5 divide-y divide-slate-100">
                {searchingProducts ? (
                  <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    Searching products...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    {productSearchQuery.length < 2
                      ? 'Type at least 2 characters to search catalog'
                      : 'No products found'}
                  </div>
                ) : (
                  searchResults.map((product) => {
                    const isAlreadyPinned = pinnedProducts.some((p) => p.id === product.id);
                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors pt-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {product.thumbnail ? (
                              <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Cpu className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{product.name}</p>
                            <p className="text-[10px] text-slate-400">
                              SKU: {product.sku} • Category: {product.category?.name || 'General'}
                            </p>
                            <span className="text-xs font-black text-blue-600">
                              ${product.price.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          disabled={isAlreadyPinned}
                          onClick={() => addPinnedProduct(product)}
                          className={`text-xs h-8 ${
                            isAlreadyPinned
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isAlreadyPinned ? 'Pinned' : 'Pin'}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
