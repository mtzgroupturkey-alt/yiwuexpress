'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Truck,
  RotateCcw,
  Clock,
  Sparkles,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MapPin,
  Building2,
  Plane,
  Train,
  Ship,
  Award,
  Factory,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext';
import { DEFAULT_PRODUCT_BADGES, ProductBadgeKey } from '@/app/api/admin/settings/product-badges/route';

type TranslationLocale = 'en' | 'ru' | 'zh';

const LOCALES: Array<{ code: TranslationLocale; label: string; flag: string }> = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export default function ProductBadgesSettingsPage() {
  const { dict } = useAdminLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeLocaleTab, setActiveLocaleTab] = useState<TranslationLocale>('en');
  const [activeSectionTab, setActiveSectionTab] = useState<'reassurance' | 'delivery' | 'trust'>('delivery');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Multilingual values map
  const [badgesState, setBadgesState] = useState<Record<TranslationLocale, Record<string, string>>>({
    en: { ...DEFAULT_PRODUCT_BADGES.en },
    ru: { ...DEFAULT_PRODUCT_BADGES.ru },
    zh: { ...DEFAULT_PRODUCT_BADGES.zh },
  });

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load current settings from backend
  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings/product-badges');
      if (res.ok) {
        const data = await res.json();
        if (data.badges) {
          setBadgesState({
            en: { ...DEFAULT_PRODUCT_BADGES.en, ...data.badges.en },
            ru: { ...DEFAULT_PRODUCT_BADGES.ru, ...data.badges.ru },
            zh: { ...DEFAULT_PRODUCT_BADGES.zh, ...data.badges.zh },
          });
        }
      }
    } catch (err) {
      console.error('Failed to load product badges:', err);
      showToast('error', 'Failed to load settings from server');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setBadgesState((prev) => ({
      ...prev,
      [activeLocaleTab]: {
        ...prev[activeLocaleTab],
        [key]: value,
      },
    }));
  };

  // Auto-translate using the existing AI translation endpoint
  const handleAutoTranslate = async () => {
    setIsTranslating(true);
    try {
      const sourceLocale = activeLocaleTab;
      const sourceValues = badgesState[sourceLocale];

      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: sourceValues,
          targetLocales: ['en', 'ru', 'zh'].filter((l) => l !== sourceLocale),
        }),
      });

      if (!res.ok) {
        throw new Error('Translation API responded with error');
      }

      const data = await res.json();
      if (data.translations) {
        setBadgesState((prev) => {
          const next = { ...prev };
          Object.keys(data.translations).forEach((targetLoc) => {
            const loc = targetLoc as TranslationLocale;
            if (next[loc]) {
              next[loc] = {
                ...next[loc],
                ...data.translations[targetLoc],
              };
            }
          });
          return next;
        });
        showToast('success', 'Translations generated successfully! Click "Save Settings" to apply.');
      } else {
        showToast('error', 'No translation data returned');
      }
    } catch (err: any) {
      console.error('Auto-translate error:', err);
      showToast('error', 'Failed to auto-translate. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/product-badges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badges: badgesState }),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      showToast('success', 'Delivery rules & Product Badges saved successfully!');
    } catch (err: any) {
      console.error('Save badges error:', err);
      showToast('error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentValues = badgesState[activeLocaleTab] || badgesState.en;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading Delivery & Badges configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold transition-all duration-300 animate-in slide-in-from-bottom-4 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-red-600 text-white border-red-500'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Delivery Timing & Reassurance Badges
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure country/city delivery rules (Belarus & China), warranty, express shipping badges, returns guarantee, and factory trust signals across Desktop and Mobile product detail pages.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchBadges}
            disabled={saving}
            className="rounded-xl h-9 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Reset
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-xs font-bold px-4 shadow-xs"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Navigation Toolbar: Locale Selector & Category Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSectionTab('delivery')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeSectionTab === 'delivery'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Delivery Timings by City</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSectionTab('reassurance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeSectionTab === 'reassurance'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>3-Card Reassurance Strip</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSectionTab('trust')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeSectionTab === 'trust'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Factory & QC Trust Badges</span>
          </button>
        </div>

        {/* Locale Tabs + AI Translate Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setActiveLocaleTab(l.code)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeLocaleTab === l.code
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoTranslate}
            disabled={isTranslating}
            className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 rounded-xl text-xs font-bold h-8 cursor-pointer"
          >
            {isTranslating ? (
              <div className="w-3.5 h-3.5 border-2 border-purple-700 border-t-transparent rounded-full animate-spin mr-1" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-600" />
            )}
            Auto-Translate
          </Button>
        </div>
      </div>

      {/* TAB 1: Delivery Timing by Country & City */}
      {activeSectionTab === 'delivery' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Belarus Logistics Configuration */}
          <Card className="rounded-2xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🇧🇾</span>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Belarus Delivery Timing Rules
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Displayed automatically when customer IP or chosen delivery location is inside Belarus (Minsk vs Regional Cities).
                    </CardDescription>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  IP-Aware Active
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Minsk Metro Area (Local Hub)
                  </Label>
                  <Input
                    value={currentValues.pdpDeliveryMinsk || ''}
                    onChange={(e) => updateField('pdpDeliveryMinsk', e.target.value)}
                    placeholder="e.g. Tomorrow (1 business day)"
                    className="rounded-xl text-xs font-medium"
                  />
                  <p className="text-[11px] text-slate-500">
                    Shown when delivery address contains Minsk / Минск.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    Belarus Regional Cities (Brest, Grodno, Gomel, Vitebsk, Mogilev)
                  </Label>
                  <Input
                    value={currentValues.pdpDeliveryBelarusRegion || ''}
                    onChange={(e) => updateField('pdpDeliveryBelarusRegion', e.target.value)}
                    placeholder="e.g. 1 – 3 business days"
                    className="rounded-xl text-xs font-medium"
                  />
                  <p className="text-[11px] text-slate-500">
                    Shown when delivery address is in regional Belarus oblasťs or regional centers.
                  </p>
                </div>
              </div>

              {/* Countdown Cutoff Hour */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    Daily Order Cutoff Hour (24-Hour Format)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Calculates countdown timer: &quot;Order within XX:XX:XX for delivery tomorrow&quot;.
                  </p>
                </div>
                <div className="w-32 shrink-0">
                  <Input
                    type="number"
                    min="1"
                    max="23"
                    value={currentValues.pdpCutoffHour || '18'}
                    onChange={(e) => updateField('pdpCutoffHour', e.target.value)}
                    placeholder="18"
                    className="rounded-xl text-xs font-bold text-center bg-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* China Logistics Configuration */}
          <Card className="rounded-2xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🇨🇳</span>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    China Domestic & Sourcing Hub Timing
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Displayed when customer delivery destination is within China (Local warehouse vs nationwide express).
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    China Warehouse / Sourcing Hub Local Delivery
                  </Label>
                  <Input
                    value={currentValues.pdpDeliveryChinaLocal || ''}
                    onChange={(e) => updateField('pdpDeliveryChinaLocal', e.target.value)}
                    placeholder="e.g. 24 – 48 hours"
                    className="rounded-xl text-xs font-medium"
                  />
                  <p className="text-[11px] text-slate-500">
                    Same-city or Zhejiang / nearby province dispatch.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    China Nationwide Domestic Express
                  </Label>
                  <Input
                    value={currentValues.pdpDeliveryChinaNationwide || ''}
                    onChange={(e) => updateField('pdpDeliveryChinaNationwide', e.target.value)}
                    placeholder="e.g. 2 – 3 days"
                    className="rounded-xl text-xs font-medium"
                  />
                  <p className="text-[11px] text-slate-500">
                    Inter-provincial standard express shipping.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* International Cross-Border Freight Lines */}
          <Card className="rounded-2xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Plane className="w-4 h-4" />
                </span>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    International Cross-Border Shipping Lines (China ➔ Belarus & Global)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Configures transit times shown in the &quot;Shipping &amp; Trade Terms&quot; tab on Product Detail pages.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200/80">
                  <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-sky-600" />
                    Air Express (DDP)
                  </Label>
                  <Input
                    value={currentValues.pdpAirFreightDays || ''}
                    onChange={(e) => updateField('pdpAirFreightDays', e.target.value)}
                    placeholder="e.g. 5 – 8 business days"
                    className="rounded-xl text-xs font-medium bg-white"
                  />
                  <p className="text-[11px] text-slate-500">
                    Fast air cargo line including customs duty.
                  </p>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200/80">
                  <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Train className="w-3.5 h-3.5 text-indigo-600" />
                    CR Express Railway
                  </Label>
                  <Input
                    value={currentValues.pdpRailFreightDays || ''}
                    onChange={(e) => updateField('pdpRailFreightDays', e.target.value)}
                    placeholder="e.g. 14 – 20 business days"
                    className="rounded-xl text-xs font-medium bg-white"
                  />
                  <p className="text-[11px] text-slate-500">
                    China-Europe regular container rail transit.
                  </p>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200/80">
                  <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Ship className="w-3.5 h-3.5 text-emerald-600" />
                    Sea Freight (FCL / LCL)
                  </Label>
                  <Input
                    value={currentValues.pdpSeaFreightDays || ''}
                    onChange={(e) => updateField('pdpSeaFreightDays', e.target.value)}
                    placeholder="e.g. 20 – 35 days"
                    className="rounded-xl text-xs font-medium bg-white"
                  />
                  <p className="text-[11px] text-slate-500">
                    Ocean container freight via Ningbo/Shanghai.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: 3-Card Reassurance Strip (Warranty, Express Delivery, Returns) */}
      {activeSectionTab === 'reassurance' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <Card className="rounded-2xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Shield className="w-4 h-4" />
                  </span>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Product Detail Reassurance Badges
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Edit the three highlighted guarantee cards displayed directly under product gallery on desktop and mobile.
                    </CardDescription>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  Editing: {LOCALES.find((l) => l.code === activeLocaleTab)?.label}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {/* Card 1: Warranty */}
              <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/30 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Warranty Card</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Badge Title</Label>
                    <Input
                      value={currentValues.pdpWarrantyTitle || ''}
                      onChange={(e) => updateField('pdpWarrantyTitle', e.target.value)}
                      placeholder="e.g. 2-Year Warranty"
                      className="rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Badge Subtitle</Label>
                    <Input
                      value={currentValues.pdpWarrantySubtitle || ''}
                      onChange={(e) => updateField('pdpWarrantySubtitle', e.target.value)}
                      placeholder="e.g. Full factory coverage"
                      className="rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Express Delivery */}
              <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Express Delivery Card</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Badge Title</Label>
                    <Input
                      value={currentValues.pdpDeliveryTitle || ''}
                      onChange={(e) => updateField('pdpDeliveryTitle', e.target.value)}
                      placeholder="e.g. Express Delivery"
                      className="rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Badge Subtitle</Label>
                    <Input
                      value={currentValues.pdpDeliverySubtitle || ''}
                      onChange={(e) => updateField('pdpDeliverySubtitle', e.target.value)}
                      placeholder="e.g. Free over $50+"
                      className="rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Returns Policy */}
              <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/30 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Returns &amp; Replacement Card</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Badge Title</Label>
                    <Input
                      value={currentValues.pdpReturnsTitle || ''}
                      onChange={(e) => updateField('pdpReturnsTitle', e.target.value)}
                      placeholder="e.g. 14-Day Returns"
                      className="rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Badge Subtitle</Label>
                    <Input
                      value={currentValues.pdpReturnsSubtitle || ''}
                      onChange={(e) => updateField('pdpReturnsSubtitle', e.target.value)}
                      placeholder="e.g. Hassle-free guarantee"
                      className="rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Strip */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-500 block mb-2 uppercase tracking-wider">
                  Live Preview (As rendered on Product Page)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50 rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#00407a] flex items-center justify-center shrink-0 border border-blue-100">
                      <Shield className="w-4 h-4 text-[#00407a]" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block leading-tight">
                        {currentValues.pdpWarrantyTitle || '2-Year Warranty'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {currentValues.pdpWarrantySubtitle || 'Full factory coverage'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <Truck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block leading-tight">
                        {currentValues.pdpDeliveryTitle || 'Express Delivery'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {currentValues.pdpDeliverySubtitle || 'Free over $50+'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                      <RotateCcw className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block leading-tight">
                        {currentValues.pdpReturnsTitle || '14-Day Returns'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {currentValues.pdpReturnsSubtitle || 'Hassle-free guarantee'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: Factory & QC Trust Badges */}
      {activeSectionTab === 'trust' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <Card className="rounded-2xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Award className="w-4 h-4" />
                  </span>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Factory Assurance &amp; Quality Control Trust Badges
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Displayed on the mobile product sheet and buyer reassurance section.
                    </CardDescription>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  Editing: {LOCALES.find((l) => l.code === activeLocaleTab)?.label}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Direct Factory */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Factory className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs text-slate-900">1. Factory Direct Supply</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-slate-600 font-medium">Title</Label>
                    <Input
                      value={currentValues.pdpFactoryTitle || ''}
                      onChange={(e) => updateField('pdpFactoryTitle', e.target.value)}
                      placeholder="Direct Verified Factory"
                      className="rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-slate-600 font-medium">Description</Label>
                    <Input
                      value={currentValues.pdpFactoryDesc || ''}
                      onChange={(e) => updateField('pdpFactoryDesc', e.target.value)}
                      placeholder="Zero middleman markup"
                      className="rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>

                {/* 2. Quality Control */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-xs text-slate-900">2. Quality Inspection (QC)</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-slate-600 font-medium">Title</Label>
                    <Input
                      value={currentValues.pdpQcTitle || ''}
                      onChange={(e) => updateField('pdpQcTitle', e.target.value)}
                      placeholder="Rigorous Quality Inspection"
                      className="rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-slate-600 font-medium">Description</Label>
                    <Input
                      value={currentValues.pdpQcDesc || ''}
                      onChange={(e) => updateField('pdpQcDesc', e.target.value)}
                      placeholder="Pre-shipment physical inspection"
                      className="rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>

                {/* 3. Door-to-Door Logistics */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-900">3. Customs Clearance &amp; Logistics</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-slate-600 font-medium">Title</Label>
                    <Input
                      value={currentValues.pdpLogisticsTitle || ''}
                      onChange={(e) => updateField('pdpLogisticsTitle', e.target.value)}
                      placeholder="Door-to-Door Logistics"
                      className="rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-slate-600 font-medium">Description</Label>
                    <Input
                      value={currentValues.pdpLogisticsDesc || ''}
                      onChange={(e) => updateField('pdpLogisticsDesc', e.target.value)}
                      placeholder="Air, rail & sea freight cleared"
                      className="rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>

                {/* 4. Escrow & Trade Assurance */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-xs text-slate-900">4. Trade Assurance Escrow</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-slate-600 font-medium">Title</Label>
                    <Input
                      value={currentValues.pdpEscrowTitle || ''}
                      onChange={(e) => updateField('pdpEscrowTitle', e.target.value)}
                      placeholder="Trade Assurance Protected"
                      className="rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-slate-600 font-medium">Description</Label>
                    <Input
                      value={currentValues.pdpEscrowDesc || ''}
                      onChange={(e) => updateField('pdpEscrowDesc', e.target.value)}
                      placeholder="Funds released upon inspection"
                      className="rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Sticky Action Bar */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm sticky bottom-4 z-20">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>
            Changes saved here update both Desktop &amp; Mobile storefronts instantly.
          </span>
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-5 text-xs font-bold shadow-xs cursor-pointer"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving Settings...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
