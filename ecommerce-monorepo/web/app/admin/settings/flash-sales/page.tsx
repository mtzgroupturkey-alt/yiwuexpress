'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Zap,
  ArrowLeft,
  Package,
  Clock,
  DollarSign,
  Calendar,
  Plus,
  Trash2,
  Search,
  MoveUp,
  MoveDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  Check,
  X,
  Sparkles,
  Percent,
} from 'lucide-react';
import Image from 'next/image';
import { useAdminLocale } from '../../contexts/AdminLocaleContext';

interface DealProduct {
  id: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  thumbnail?: string | null;
  images?: string[];
  stock: number;
  category?: {
    id: string;
    name: string;
  } | null;
  flashSalePrice: number | null;
  flashSaleStock: number | null;
  flashSaleOrder: number;
}

interface CampaignSettings {
  enabled: boolean;
  startDate: string;
  endDate: string;
  title: string;
  subtitle: string;
  badgeText: string;
}

export default function SeasonalFlashDealsSettings() {
  const router = useRouter();
  const { dict } = useAdminLocale();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Campaign Settings
  const [settings, setSettings] = useState<CampaignSettings>({
    enabled: false,
    startDate: '',
    endDate: '',
    title: 'Seasonal Discounts & Flash Home Deals',
    subtitle: 'Special prices on furniture, kitchenware, and smart living appliances',
    badgeText: 'LIMITED QUANTITY',
  });

  // Selected Products for Deal
  const [dealProducts, setDealProducts] = useState<DealProduct[]>([]);

  // Product Picker Modal State
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerProducts, setPickerProducts] = useState<any[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Convert Date to YYYY-MM-DDTHH:mm string in local timezone
  const toLocalISOString = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const fetchCampaignData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/products/flash-sales');
      const data = await response.json();

      if (data.success) {
        if (data.settings) {
          setSettings({
            enabled: Boolean(data.settings.enabled),
            startDate: data.settings.startDate ? toLocalISOString(new Date(data.settings.startDate)) : '',
            endDate: data.settings.endDate ? toLocalISOString(new Date(data.settings.endDate)) : '',
            title: data.settings.title || 'Seasonal Discounts & Flash Home Deals',
            subtitle: data.settings.subtitle || 'Special prices on furniture, kitchenware, and smart living appliances',
            badgeText: data.settings.badgeText || 'LIMITED QUANTITY',
          });
        }
        setDealProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching flash sale settings:', error);
      showToast('Failed to load flash deals configuration', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaignData();
  }, [fetchCampaignData]);

  // Compute live campaign status
  const currentStatus = useMemo(() => {
    if (!settings.enabled) return 'disabled';
    const now = new Date();
    if (settings.startDate) {
      const start = new Date(settings.startDate);
      if (now < start) return 'scheduled';
    }
    if (settings.endDate) {
      const end = new Date(settings.endDate);
      if (now > end) return 'expired';
    }
    return 'active';
  }, [settings.enabled, settings.startDate, settings.endDate]);

  // Real-time ticking remaining time for preview
  const [previewRemaining, setPreviewRemaining] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      if (!settings.endDate) {
        setPreviewRemaining(null);
        return;
      }
      const diff = new Date(settings.endDate).getTime() - Date.now();
      if (diff <= 0) {
        setPreviewRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setPreviewRemaining({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [settings.endDate]);

  // Quick Preset Handlers
  const handleApplyPreset = (preset: '24h' | '3d' | '7d' | 'weekend' | 'clear') => {
    const now = new Date();
    if (preset === 'clear') {
      setSettings((prev) => ({ ...prev, startDate: '', endDate: '' }));
      return;
    }

    let start = new Date(now);
    let end = new Date(now);

    if (preset === '24h') {
      end = new Date(now.getTime() + 24 * 3600 * 1000);
    } else if (preset === '3d') {
      end = new Date(now.getTime() + 3 * 24 * 3600 * 1000);
    } else if (preset === '7d') {
      end = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    } else if (preset === 'weekend') {
      const day = now.getDay();
      const daysUntilFriday = (5 - day + 7) % 7;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilFriday, 18, 0, 0);
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 2, 23, 59, 59);
    }

    setSettings((prev) => ({
      ...prev,
      startDate: toLocalISOString(start),
      endDate: toLocalISOString(end),
    }));
  };

  // Search products for the picker modal
  const handleSearchPickerProducts = async (query: string) => {
    setPickerLoading(true);
    try {
      const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(query)}&limit=30`);
      const data = await res.json();
      if (data.success) {
        setPickerProducts(data.data || []);
      }
    } catch (e) {
      console.error('Failed to search products:', e);
    } finally {
      setPickerLoading(false);
    }
  };

  const handleOpenPicker = () => {
    setIsPickerOpen(true);
    setPickerSearch('');
    handleSearchPickerProducts('');
  };

  const handleToggleProductInPicker = (product: any) => {
    const isAlreadySelected = dealProducts.some((p) => p.id === product.id);
    if (isAlreadySelected) {
      setDealProducts((prev) => prev.filter((p) => p.id !== product.id));
    } else {
      const defaultDiscountPrice =
        product.price > 10 ? Math.round(product.price * 0.8 * 100) / 100 : Math.round(product.price * 0.9 * 100) / 100;
      const newDealProduct: DealProduct = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        compareAtPrice: product.compareAtPrice || product.price,
        thumbnail: product.image || product.thumbnail,
        stock: product.stock,
        category: product.category,
        flashSalePrice: defaultDiscountPrice,
        flashSaleStock: null,
        flashSaleOrder: dealProducts.length,
      };
      setDealProducts((prev) => [...prev, newDealProduct]);
    }
  };

  const handleRemoveProduct = (id: string) => {
    setDealProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePriceChange = (id: string, value: string) => {
    const num = parseFloat(value);
    setDealProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, flashSalePrice: isNaN(num) ? null : num } : p))
    );
  };

  const handleStockChange = (id: string, value: string) => {
    const num = parseInt(value, 10);
    setDealProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, flashSaleStock: isNaN(num) ? null : num } : p))
    );
  };

  const handleMoveProduct = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === dealProducts.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...dealProducts];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setDealProducts(updated);
  };

  // Save All Changes
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const payload = {
        settings: {
          enabled: settings.enabled,
          startDate: settings.startDate ? new Date(settings.startDate).toISOString() : null,
          endDate: settings.endDate ? new Date(settings.endDate).toISOString() : null,
          title: settings.title.trim(),
          subtitle: settings.subtitle.trim(),
          badgeText: settings.badgeText.trim(),
        },
        products: dealProducts.map((p, index) => ({
          id: p.id,
          flashSalePrice: p.flashSalePrice,
          flashSaleStock: p.flashSaleStock,
          flashSaleOrder: index,
        })),
      };

      const res = await fetch('/api/admin/products/flash-sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Seasonal Discounts & Flash Home Deals updated successfully!');
        fetchCampaignData();
      } else {
        showToast(data.error || 'Failed to update campaign', 'error');
      }
    } catch (err) {
      console.error('Error saving campaign:', err);
      showToast('An error occurred while saving', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-white font-semibold text-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
            toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/settings')}
              className="text-slate-500 hover:text-slate-800 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {dict.common.back}
            </Button>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Website Promotions</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Seasonal Discounts & Flash Home Deals
              </h1>
              <p className="text-xs text-slate-500">
                Easily schedule, feature products, and control the promotional deal banner on the homepage.
              </p>
            </div>
          </div>
        </div>

        {/* Master Status & Primary Action */}
        <div className="flex items-center gap-4 self-end sm:self-center">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Section Status:</span>
              {currentStatus === 'active' && (
                <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300 font-bold px-2.5 py-0.5 animate-pulse">
                  ● Live on Homepage
                </Badge>
              )}
              {currentStatus === 'scheduled' && (
                <Badge className="bg-blue-500/15 text-blue-700 border-blue-300 font-bold px-2.5 py-0.5">
                  Scheduled (Starts later)
                </Badge>
              )}
              {currentStatus === 'expired' && (
                <Badge className="bg-amber-500/15 text-amber-700 border-amber-300 font-bold px-2.5 py-0.5">
                  Expired (Past end date)
                </Badge>
              )}
              {currentStatus === 'disabled' && (
                <Badge className="bg-slate-200 text-slate-600 border-slate-300 font-bold px-2.5 py-0.5">
                  Disabled
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {currentStatus === 'active'
                ? 'Visible to all visitors'
                : 'Hidden from homepage'}
            </p>
          </div>

          <Button
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-[#00407a] hover:bg-[#003366] text-white font-bold px-5 rounded-xl shadow-md h-10"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center bg-white rounded-2xl border border-slate-200">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-[#00407a] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-500">Loading campaign settings...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Timing & Section Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Master Toggle Card */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                  <span>Enable Section</span>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enabled: checked }))}
                  />
                </CardTitle>
                <CardDescription className="text-xs">
                  Turn this switch on to display the deals banner on the homepage during the scheduled time.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                    settings.enabled
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      settings.enabled ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  <span>
                    {settings.enabled
                      ? 'Section is enabled. It will appear on the homepage whenever the current time is within schedule.'
                      : 'Section is turned off and will NOT appear on the homepage.'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Schedule Card */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Start & End Schedule</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Section automatically appears at Start Time and disappears the second End Time is reached.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Start Date & Time */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                    <span>Start Date & Time</span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional (default: immediately)</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={settings.startDate}
                    onChange={(e) => setSettings({ ...settings, startDate: e.target.value })}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                {/* End Date & Time */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                    <span>End Date & Time *</span>
                    <span className="text-[10px] text-amber-600 font-semibold">Auto-hides when reached</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={settings.endDate}
                    onChange={(e) => setSettings({ ...settings, endDate: e.target.value })}
                    className="h-10 text-xs rounded-xl border-amber-300 focus:border-amber-500"
                  />
                </div>

                {/* Quick Schedule Presets */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-2">Quick Duration Presets:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPreset('24h')}
                      className="text-xs rounded-lg h-8"
                    >
                      Next 24 Hours
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPreset('3d')}
                      className="text-xs rounded-lg h-8"
                    >
                      Next 3 Days
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPreset('7d')}
                      className="text-xs rounded-lg h-8"
                    >
                      Next 7 Days
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPreset('weekend')}
                      className="text-xs rounded-lg h-8"
                    >
                      This Weekend
                    </Button>
                  </div>
                  {settings.startDate || settings.endDate ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApplyPreset('clear')}
                      className="text-[11px] text-slate-400 hover:text-rose-600 w-full mt-2 h-7"
                    >
                      Clear schedule dates
                    </Button>
                  ) : null}
                </div>

                {/* Live Countdown Preview */}
                {previewRemaining && (
                  <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 rounded-xl p-3 text-xs">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                      Countdown Preview:
                    </span>
                    <div className="flex items-center gap-1.5 font-mono font-black text-amber-900 text-sm">
                      <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded">
                        {String(previewRemaining.hours).padStart(2, '0')}h
                      </span>
                      <span>:</span>
                      <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded">
                        {String(previewRemaining.minutes).padStart(2, '0')}m
                      </span>
                      <span>:</span>
                      <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded">
                        {String(previewRemaining.seconds).padStart(2, '0')}s
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Banner Labels Card */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900">Banner Text & Branding</CardTitle>
                <CardDescription className="text-xs">
                  Customize the heading, subtitle, and promotional badge text.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Section Title</label>
                  <Input
                    value={settings.title}
                    onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Subtitle</label>
                  <Input
                    value={settings.subtitle}
                    onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Badge Text</label>
                  <Input
                    value={settings.badgeText}
                    onChange={(e) => setSettings({ ...settings, badgeText: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Products Management */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-500" />
                    <span>Featured Deal Products ({dealProducts.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Select products from your catalog to showcase in the deal grid. Set special deal prices and order.
                  </CardDescription>
                </div>

                <Button
                  onClick={handleOpenPicker}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl h-9 px-4 shrink-0 shadow-xs"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Select Products from Catalog
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                {dealProducts.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-8 h-8 text-amber-500" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1">No products added to this deal yet</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                      Click the button below to pick products from your store catalog to include in this seasonal promotion.
                    </p>
                    <Button
                      onClick={handleOpenPicker}
                      className="bg-[#00407a] hover:bg-[#003366] text-white font-bold text-xs rounded-xl h-9"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Products
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {dealProducts.map((product, index) => {
                      const discountPct =
                        product.flashSalePrice && product.price > product.flashSalePrice
                          ? Math.round(((product.price - product.flashSalePrice) / product.price) * 100)
                          : 0;

                      return (
                        <div
                          key={product.id}
                          className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                        >
                          {/* Left: Thumbnail & Info */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-1 text-slate-400">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => handleMoveProduct(index, 'up')}
                                className="hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 p-0.5"
                                title="Move up"
                              >
                                <MoveUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={index === dealProducts.length - 1}
                                onClick={() => handleMoveProduct(index, 'down')}
                                className="hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 p-0.5"
                                title="Move down"
                              >
                                <MoveDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Image */}
                            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                              {product.thumbnail ? (
                                <Image
                                  src={product.thumbnail}
                                  alt={product.name}
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <Package className="w-6 h-6" />
                                </div>
                              )}
                            </div>

                            {/* Text */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-400">{product.sku}</span>
                                {product.category && (
                                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                    {product.category.name}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 truncate" title={product.name}>
                                {product.name}
                              </h4>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                <span>Original: <strong className="text-slate-700">${product.price.toFixed(2)}</strong></span>
                                <span>•</span>
                                <span>Stock: <strong className="text-slate-700">{product.stock}</strong></span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Deal Price & Remove */}
                          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                            {/* Deal Price Input */}
                            <div className="flex items-center gap-1.5">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                  Deal Price ($)
                                </label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={product.flashSalePrice ?? ''}
                                  onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                  placeholder={product.price.toString()}
                                  className="h-8 w-24 text-xs font-bold text-amber-700 rounded-lg"
                                />
                              </div>

                              {discountPct > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-1 rounded-md self-end mb-0.5">
                                  -{discountPct}%
                                </span>
                              )}
                            </div>

                            {/* Flash Stock Limit (Optional) */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                Stock Limit
                              </label>
                              <Input
                                type="number"
                                value={product.flashSaleStock ?? ''}
                                onChange={(e) => handleStockChange(product.id, e.target.value)}
                                placeholder="Max"
                                className="h-8 w-20 text-xs rounded-lg"
                                title="Limit flash units (leave blank for unlimited)"
                              />
                            </div>

                            {/* Remove button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProduct(product.id)}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 p-0 rounded-lg self-end mb-0.5"
                              title="Remove product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Select Products for Deal</h3>
                <p className="text-xs text-slate-500">
                  Search and check products to feature in the Seasonal Discounts section.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={pickerSearch}
                  onChange={(e) => {
                    setPickerSearch(e.target.value);
                    handleSearchPickerProducts(e.target.value);
                  }}
                  placeholder="Search products by title, SKU, or category..."
                  className="pl-9 h-10 text-xs bg-white rounded-xl"
                  autoFocus
                />
              </div>
            </div>

            {/* Products List */}
            <div className="overflow-y-auto flex-1 p-2 divide-y divide-slate-100">
              {pickerLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading products...</div>
              ) : pickerProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No matching products found</div>
              ) : (
                pickerProducts.map((product) => {
                  const isSelected = dealProducts.some((p) => p.id === product.id);

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleToggleProductInPicker(product)}
                      className={`p-3 flex items-center justify-between gap-3 rounded-xl cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-50/80 border border-amber-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{product.name}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span>SKU: {product.sku}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">${product.price.toFixed(2)}</span>
                            <span>•</span>
                            <span>Stock: {product.stock}</span>
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant={isSelected ? 'default' : 'outline'}
                        className={`text-[10px] shrink-0 ${
                          isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                {dealProducts.length} product{dealProducts.length === 1 ? '' : 's'} chosen
              </span>
              <Button
                onClick={() => setIsPickerOpen(false)}
                className="bg-[#00407a] hover:bg-[#003366] text-white font-bold text-xs rounded-xl h-9 px-5"
              >
                Done Selecting
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
