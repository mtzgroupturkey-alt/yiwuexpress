'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
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
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext';

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

export default function KitchenSectionSettingsPage() {
  const { dict } = useAdminLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeLocaleTab, setActiveLocaleTab] = useState<TranslationLocale>('en');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [enabled, setEnabled] = useState(true);
  const [maxProducts, setMaxProducts] = useState(12);

  // Multi-language text state (English, Russian, Chinese)
  const [textTranslations, setTextTranslations] = useState<Record<TranslationLocale, SectionTextValues>>({
    en: {
      title: 'Kitchenware, Cookware & Dining Essentials',
      subtitle: 'Granite frying pans, chef cutlery sets, porcelain dinner sets, and Italian espresso barware',
      badgeText: 'KITCHEN & DINING',
      viewAllLabel: 'View all Kitchen & Dining',
    },
    ru: {
      title: 'Посуда, кухонная утварь и сервировка',
      subtitle: 'Гранитные сковороды, наборы ножей, фарфоровые сервизы и кофеварки',
      badgeText: 'КУХНЯ И СТОЛОВАЯ',
      viewAllLabel: 'Смотреть всю категорию',
    },
    zh: {
      title: '厨房用品、烹饪锅具与餐具精选',
      subtitle: '花岗岩不粘锅、厨师刀具套装、骨瓷餐具及意式咖啡器具',
      badgeText: '品质餐厨生活',
      viewAllLabel: '查看全部餐厨商品',
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
      const res = await fetch('/api/admin/settings/kitchen-section');
      if (!res.ok) throw new Error('Failed to load kitchen section settings');
      const data = await res.json();

      if (data.settings) {
        const s = data.settings;
        setEnabled(s.kitchenSectionEnabled !== false);
        setMaxProducts(s.kitchenSectionMaxProducts || 12);

        const loadedTranslations: Record<TranslationLocale, SectionTextValues> = {
          en: {
            title: s.kitchenSectionTitle || 'Kitchenware, Cookware & Dining Essentials',
            subtitle: s.kitchenSectionSubtitle || 'Granite frying pans, chef cutlery sets, porcelain dinner sets, and Italian espresso barware',
            badgeText: s.kitchenSectionBadge || 'KITCHEN & DINING',
            viewAllLabel: s.kitchenSectionViewAllLabel || 'View all Kitchen & Dining',
          },
          ru: {
            title: 'Посуда, кухонная утварь и сервировка',
            subtitle: 'Гранитные сковороды, наборы ножей, фарфоровые сервизы и кофеварки',
            badgeText: 'КУХНЯ И СТОЛОВАЯ',
            viewAllLabel: 'Смотреть всю категорию',
          },
          zh: {
            title: '厨房用品、烹饪锅具与餐具精选',
            subtitle: '花岗岩不粘锅、厨师刀具套装、骨瓷餐具及意式咖啡器具',
            badgeText: '品质餐厨生活',
            viewAllLabel: '查看全部餐厨商品',
          },
        };

        if (Array.isArray(data.translations)) {
          for (const t of data.translations) {
            if (t.locale === 'ru' || t.locale === 'zh' || t.locale === 'en') {
              const loc = t.locale as TranslationLocale;
              if (t.key === 'kitchenSectionTitle' && t.value) loadedTranslations[loc].title = t.value;
              if (t.key === 'kitchenSectionSubtitle' && t.value) loadedTranslations[loc].subtitle = t.value;
              if (t.key === 'kitchenSectionBadge' && t.value) loadedTranslations[loc].badgeText = t.value;
              if (t.key === 'kitchenSectionViewAllLabel' && t.value) loadedTranslations[loc].viewAllLabel = t.value;
            }
          }
        }

        setTextTranslations(loadedTranslations);

        if (s.kitchenSectionCategoryIds) {
          const ids = s.kitchenSectionCategoryIds.split(',').map((id: string) => id.trim()).filter(Boolean);
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

  // Toggle Category selection
  const handleToggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSelectSuggestedKitchenCategories = () => {
    const kitchenKeywords = ['kitchen', 'cookware', 'dining', 'tableware', 'cutlery', 'bakeware', 'pot', 'pan'];
    const matched = availableCategories
      .filter((c) => kitchenKeywords.some((k) => c.name.toLowerCase().includes(k) || c.slug.toLowerCase().includes(k)))
      .map((c) => c.id);

    setSelectedCategoryIds(Array.from(new Set([...selectedCategoryIds, ...matched])));
  };

  // Search products to pin
  const handleSearchProducts = async () => {
    if (!productSearchQuery.trim()) return;
    setSearchingProducts(true);
    try {
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(productSearchQuery)}&limit=8`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setSearchResults(data.products || []);
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setSearchingProducts(false);
    }
  };

  const handleAddPinnedProduct = (product: ProductSearchItem) => {
    if (pinnedProducts.some((p) => p.id === product.id)) return;
    setPinnedProducts([...pinnedProducts, product]);
    setProductSearchQuery('');
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  const handleRemovePinnedProduct = (productId: string) => {
    setPinnedProducts(pinnedProducts.filter((p) => p.id !== productId));
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
        if (row.title) apiTranslations.push({ locale: loc, key: 'kitchenSectionTitle', value: row.title.trim() });
        if (row.subtitle) apiTranslations.push({ locale: loc, key: 'kitchenSectionSubtitle', value: row.subtitle.trim() });
        if (row.badgeText) apiTranslations.push({ locale: loc, key: 'kitchenSectionBadge', value: row.badgeText.trim() });
        if (row.viewAllLabel) apiTranslations.push({ locale: loc, key: 'kitchenSectionViewAllLabel', value: row.viewAllLabel.trim() });
      });

      const payload = {
        kitchenSectionEnabled: enabled,
        kitchenSectionTitle: textTranslations.en.title.trim() || textTranslations[activeLocaleTab].title.trim(),
        kitchenSectionSubtitle: textTranslations.en.subtitle.trim() || textTranslations[activeLocaleTab].subtitle.trim(),
        kitchenSectionBadge: textTranslations.en.badgeText.trim() || textTranslations[activeLocaleTab].badgeText.trim(),
        kitchenSectionViewAllLabel: textTranslations.en.viewAllLabel.trim() || textTranslations[activeLocaleTab].viewAllLabel.trim(),
        kitchenSectionCategoryIds: selectedCategoryIds.join(','),
        kitchenSectionPinnedProductIds: pinnedProducts.map((p) => p.id).join(','),
        kitchenSectionMaxProducts: maxProducts,
        translations: apiTranslations,
      };

      const res = await fetch('/api/admin/settings/kitchen-section', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');

      showToast('success', 'Homepage Kitchen & Dining block settings saved successfully!');
    } catch (err: any) {
      showToast('error', err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl text-sm font-semibold flex items-center gap-2 border transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          {toastMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {dict.kitchenSection.pageTitle}
            </h1>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {dict.kitchenSection.badgeTag}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {dict.kitchenSection.pageSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/" target="_blank">
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="w-4 h-4" />
              {dict.kitchenSection.viewStorefront}
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            {saving ? dict.kitchenSection.saving : dict.kitchenSection.saveSettings}
          </Button>
        </div>
      </div>

      {/* Section Enable Toggle */}
      <Card className="border-gray-200 shadow-xs">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-semibold text-gray-900 flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-amber-600" />
              {dict.kitchenSection.enableSection}
            </div>
            <p className="text-xs text-gray-500">
              {dict.kitchenSection.enableSectionDesc}
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </CardContent>
      </Card>

      {/* Live Visual Preview */}
      <Card className="border-blue-200 bg-linear-to-r from-blue-50/40 via-white to-amber-50/30 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs uppercase font-bold text-gray-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              {dict.kitchenSection.livePreviewTitle}
            </CardTitle>
            <Badge variant="secondary" className="text-[10px]">
              {dict.kitchenSection.storefrontPreviewBadge}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-md tracking-wider uppercase mb-1.5">
                {textTranslations[activeLocaleTab].badgeText || 'KITCHEN & DINING'}
              </span>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {textTranslations[activeLocaleTab].title || 'Kitchenware, Cookware & Dining Essentials'}
              </h2>
              <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                {textTranslations[activeLocaleTab].subtitle || 'Granite frying pans, chef cutlery sets, porcelain dinner sets, and Italian espresso barware'}
              </p>
            </div>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 whitespace-nowrap self-start md:self-end">
              {textTranslations[activeLocaleTab].viewAllLabel || 'View all Kitchen & Dining'} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-gray-600 overflow-x-auto pb-1">
            <span className="px-3 py-1 rounded-full bg-blue-600 text-white shadow-xs">
              {activeLocaleTab === 'ru' ? 'Вся посуда и кухня' : activeLocaleTab === 'zh' ? '全部餐厨商品' : 'All Kitchen & Dining'}
            </span>
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">
              {activeLocaleTab === 'ru' ? 'Сковороды и кастрюли' : activeLocaleTab === 'zh' ? '烹饪锅具' : 'Cookware & Pans'}
            </span>
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">
              {activeLocaleTab === 'ru' ? 'Столовые приборы' : activeLocaleTab === 'zh' ? '刀叉餐具' : 'Cutlery & Knives'}
            </span>
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">
              {activeLocaleTab === 'ru' ? 'Сервизы и тарелки' : activeLocaleTab === 'zh' ? '餐盘与碗具' : 'Dinnerware & Plates'}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Text & Display Settings */}
        <div className="space-y-6">
          <Card className="border-gray-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-gray-900">
                    {dict.kitchenSection.headerTextsTitle}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {dict.kitchenSection.headerTextsDesc}
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
                  <span>{isTranslating ? dict.kitchenSection.translating : dict.kitchenSection.translateToAll}</span>
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
                    <label className="text-xs font-bold text-gray-700">
                      {dict.kitchenSection.sectionTitleLabel} ({activeLocaleTab.toUpperCase()})
                    </label>
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
                        ? 'Посуда, кухонная утварь и сервировка'
                        : activeLocaleTab === 'zh'
                        ? '厨房用品、烹饪锅具与餐具精选'
                        : 'Kitchenware, Cookware & Dining Essentials'
                    }
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700">
                      {dict.kitchenSection.subtitleLabel} ({activeLocaleTab.toUpperCase()})
                    </label>
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
                        ? 'Гранитные сковороды, наборы ножей, фарфоровые сервизы и кофеварки'
                        : activeLocaleTab === 'zh'
                        ? '花岗岩不粘锅、厨师刀具套装、骨瓷餐具及意式咖啡器具'
                        : 'Granite frying pans, chef cutlery sets, porcelain dinner sets, and Italian espresso barware'
                    }
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      {dict.kitchenSection.badgeTextLabel} ({activeLocaleTab.toUpperCase()})
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
                          ? 'КУХНЯ И СТОЛОВАЯ'
                          : activeLocaleTab === 'zh'
                          ? '品质餐厨生活'
                          : 'KITCHEN & DINING'
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      {dict.kitchenSection.viewAllLabel} ({activeLocaleTab.toUpperCase()})
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
                          ? '查看全部餐厨商品'
                          : 'View all Kitchen & Dining'
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">{dict.kitchenSection.maxProductsLabel}</label>
                <select
                  value={maxProducts}
                  onChange={(e) => setMaxProducts(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value={6}>6</option>
                  <option value={8}>8</option>
                  <option value={12}>12 ({dict.kitchenSection.recommended})</option>
                  <option value={16}>16</option>
                  <option value={24}>24</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Category Filtering */}
        <div className="space-y-6">
          <Card className="border-gray-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-gray-900">{dict.kitchenSection.categoriesFilterTitle}</CardTitle>
                  <CardDescription className="text-xs">
                    {dict.kitchenSection.categoriesFilterDesc}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSelectSuggestedKitchenCategories}
                  className="text-xs h-7"
                >
                  {dict.kitchenSection.autoSelectKitchen}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-gray-500">
                {selectedCategoryIds.length === 0
                  ? dict.kitchenSection.noCategoriesSelected
                  : dict.kitchenSection.filteringByCount.replace('{count}', String(selectedCategoryIds.length))}
              </p>

              <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50/50">
                {availableCategories.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleToggleCategory(cat.id)}
                      className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>

              {selectedCategoryIds.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedCategoryIds([])}
                  className="text-xs text-gray-500 h-6 px-2 hover:text-red-600"
                >
                  {dict.kitchenSection.clearSelection}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pinned Products Section */}
      <Card className="border-gray-200 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                {dict.kitchenSection.pinnedProductsTitle.replace('{count}', String(pinnedProducts.length))}
              </CardTitle>
              <CardDescription className="text-xs">
                {dict.kitchenSection.pinnedProductsDesc}
              </CardDescription>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsSearchOpen(true)}
              className="gap-1.5 text-xs h-8"
            >
              <Plus className="w-3.5 h-3.5" />
              {dict.kitchenSection.pinProductBtn}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {pinnedProducts.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <ShoppingBag className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
              <p className="text-sm font-semibold text-gray-700">{dict.kitchenSection.noPinnedProducts}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {dict.kitchenSection.noPinnedProductsDesc}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {pinnedProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors relative group"
                >
                  <div className="w-12 h-12 rounded-md bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="text-xs font-bold text-gray-900 truncate">{p.name}</div>
                    <div className="text-[11px] text-gray-500 font-mono">{p.sku}</div>
                    <div className="text-xs font-semibold text-emerald-600">\${p.price.toFixed(2)}</div>
                  </div>
                  <button
                    onClick={() => handleRemovePinnedProduct(p.id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600 p-1 transition-colors"
                    title="Remove from pinned"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Search & Picker Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-gray-900">{dict.kitchenSection.searchProductModalTitle}</h3>
              <button onClick={() => setIsSearchOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder={dict.kitchenSection.searchPlaceholder}
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchProducts();
                }}
              />
              <Button onClick={handleSearchProducts} disabled={searchingProducts} className="shrink-0">
                <Search className={`w-4 h-4 ${searchingProducts ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
              {searchResults.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  {searchingProducts ? dict.common.loading : dict.kitchenSection.typeQueryHint}
                </div>
              ) : (
                searchResults.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 hover:bg-gray-50 px-2 rounded">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded bg-gray-100 shrink-0 overflow-hidden">
                        {p.thumbnail && <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-900 truncate">{p.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{p.sku}</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddPinnedProduct(p)}
                      className="text-xs h-7"
                    >
                      {dict.kitchenSection.pinAction}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
