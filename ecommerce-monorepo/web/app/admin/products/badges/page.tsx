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
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext';
import { DEFAULT_PRODUCT_BADGES, ProductBadgeKey } from '@/lib/constants/productBadges';

type TranslationLocale = 'en' | 'ru' | 'zh';

const LOCALES: Array<{ code: TranslationLocale; label: string; flag: string }> = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export default function ProductBadgesSettingsPage() {
  const { dict } = useAdminLocale();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeLocaleTab, setActiveLocaleTab] = useState<TranslationLocale>('en');
  const [activeSectionTab, setActiveSectionTab] = useState<'reassurance' | 'delivery' | 'demand' | 'trust' | 'faq'>('delivery');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Multilingual values map
  const [badgesState, setBadgesState] = useState<Record<TranslationLocale, Record<string, string>>>({
    en: { ...DEFAULT_PRODUCT_BADGES.en },
    ru: { ...DEFAULT_PRODUCT_BADGES.ru },
    zh: { ...DEFAULT_PRODUCT_BADGES.zh },
  });

  const t = (dict as any)?.badges || {};

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
      setFetching(true);
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
    } finally {
      setFetching(false);
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
        showToast('success', t.translateSuccess || 'Translations generated successfully! Click "Save Settings" to apply.');
      } else {
        showToast('error', 'No translation data returned');
      }
    } catch (err: any) {
      console.error('Auto-translate error:', err);
      showToast('error', t.translateError || 'Failed to auto-translate. Please try again.');
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

      showToast('success', t.saveSuccess || 'Delivery rules & Product Badges saved successfully!');
    } catch (err: any) {
      console.error('Save badges error:', err);
      showToast('error', t.saveError || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentValues = badgesState[activeLocaleTab] || badgesState.en;

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
              {t.pageTitle || 'Delivery Timing & Reassurance Badges'}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {t.pageSubtitle || 'Configure country/city delivery rules (Belarus & China), warranty, express shipping badges, returns guarantee, and factory trust signals across Desktop and Mobile product detail pages.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchBadges}
            disabled={saving || fetching}
            className="rounded-xl h-9 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${fetching ? 'animate-spin' : ''}`} />
            {t.resetBtn || 'Reset'}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-xs font-bold px-4 shadow-xs cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                {t.saving || 'Saving...'}
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {t.saveBtn || 'Save Settings'}
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
            <span>{t.tabDelivery || 'Delivery Timings by City'}</span>
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
            <span>{t.tabReassurance || '3-Card Reassurance Strip'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSectionTab('demand')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeSectionTab === 'demand'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.tabDemand || '⚡ Badges ON/OFF Manager'}</span>
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
            <span>{t.tabTrust || 'Factory & QC Trust Badges'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSectionTab('faq')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeSectionTab === 'faq'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t.tabFaq || 'Buyer Q&A / FAQ'}</span>
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
            {isTranslating ? (t.translating || 'Translating...') : (t.autoTranslate || 'Auto-Translate')}
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
                      {t.belarusRulesTitle || 'Belarus Delivery Timing Rules'}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      {t.belarusRulesDesc || 'Displayed automatically when customer IP or chosen delivery location is inside Belarus (Minsk vs Regional Cities).'}
                    </CardDescription>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  {t.ipAwareBadge || 'IP-Aware Active'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    {t.minskMetroLabel || 'Minsk Metro Area (Local Hub)'}
                  </Label>
                  <Input
                    value={currentValues.pdpDeliveryMinsk || ''}
                    onChange={(e) => updateField('pdpDeliveryMinsk', e.target.value)}
                    placeholder={t.minskMetroPlaceholder || 'e.g. Tomorrow (1 business day)'}
                    className="rounded-xl text-xs font-medium"
                  />
                  <p className="text-[11px] text-slate-500">
                    {t.minskMetroDesc || 'Shown when delivery address contains Minsk / Минск.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    {t.belarusRegionLabel || 'Belarus Regional Cities (Brest, Grodno, Gomel, Vitebsk, Mogilev)'}
                  </Label>
                  <Input
                    value={currentValues.pdpDeliveryBelarusRegion || ''}
                    onChange={(e) => updateField('pdpDeliveryBelarusRegion', e.target.value)}
                    placeholder={t.belarusRegionPlaceholder || 'e.g. 1 – 3 business days'}
                    className="rounded-xl text-xs font-medium"
                  />
                  <p className="text-[11px] text-slate-500">
                    {t.belarusRegionDesc || 'Shown when delivery address is in regional Belarus oblasťs or regional centers.'}
                  </p>
                </div>
              </div>

              {/* Countdown Cutoff Hour */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    {t.cutoffHourTitle || 'Daily Order Cutoff Hour (24-Hour Format)'}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {t.cutoffHourDesc || 'Calculates countdown timer: "Order within XX:XX:XX for delivery tomorrow".'}
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
                    {t.chinaLogisticsTitle || 'China Domestic & Sourcing Hub Timing'}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    {t.chinaLogisticsDesc || 'Displayed when customer delivery destination is within China (Local warehouse vs nationwide express).'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    {t.chinaLocalLabel || 'China Warehouse / Sourcing Hub Local Delivery'}
                  </Label>
                  <Input
                    value={currentValues.pdpDeliveryChinaLocal || ''}
                    onChange={(e) => updateField('pdpDeliveryChinaLocal', e.target.value)}
                    placeholder={t.chinaLocalPlaceholder || 'e.g. 24 – 48 hours'}
                    className="rounded-xl text-xs font-medium"
                  />
                  <p className="text-[11px] text-slate-500">
                    {t.chinaLocalDesc || 'Same-city or Zhejiang / nearby province dispatch.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    {t.chinaNationwideLabel || 'China Nationwide Domestic Express'}
                  </Label>
                  <Input
                    value={currentValues.pdpDeliveryChinaNationwide || ''}
                    onChange={(e) => updateField('pdpDeliveryChinaNationwide', e.target.value)}
                    placeholder={t.chinaNationwidePlaceholder || 'e.g. 2 – 3 days'}
                    className="rounded-xl text-xs font-medium"
                  />
                  <p className="text-[11px] text-slate-500">
                    {t.chinaNationwideDesc || 'Inter-provincial standard express shipping.'}
                  </p>
                </div>
              </div>

              {/* Warehouse / Hub Self-Pickup Box */}
              <div className="pt-3 border-t border-slate-100 space-y-3 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100/60">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                    {t.pickupHubTitle || 'Hub / Warehouse Self-Pickup Box (China Central Hub)'}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {t.pickupHubDesc || 'Configures the self-pickup strip displayed in the product page buy-box (Location title, price/badge, and pickup readiness timing).'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700">
                      {t.pickupLocationTitle || 'Pickup Location Title'}
                    </Label>
                    <Input
                      value={currentValues.pdpPickupTitle || ''}
                      onChange={(e) => updateField('pdpPickupTitle', e.target.value)}
                      placeholder="e.g. China Central Hub"
                      className="rounded-xl text-xs font-medium bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700">
                      {t.pickupPriceLabel || 'Pickup Price / Fee Badge'}
                    </Label>
                    <Input
                      value={currentValues.pdpPickupPrice || ''}
                      onChange={(e) => updateField('pdpPickupPrice', e.target.value)}
                      placeholder="e.g. Free"
                      className="rounded-xl text-xs font-medium bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700">
                      {t.pickupEstimateLabel || 'Pickup Readiness Time'}
                    </Label>
                    <Input
                      value={currentValues.pdpPickupEstimate || ''}
                      onChange={(e) => updateField('pdpPickupEstimate', e.target.value)}
                      placeholder="e.g. Ready for pickup in 1 hour"
                      className="rounded-xl text-xs font-medium bg-white"
                    />
                  </div>
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
                    {t.intlLinesTitle || 'International Cross-Border Shipping Lines (China ➔ Belarus & Global)'}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    {t.intlLinesDesc || 'Configures transit times shown in the "Shipping & Trade Terms" tab on Product Detail pages.'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200/80">
                  <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-sky-600" />
                    {t.airFreightLabel || 'Air Express (DDP)'}
                  </Label>
                  <Input
                    value={currentValues.pdpAirFreightDays || ''}
                    onChange={(e) => updateField('pdpAirFreightDays', e.target.value)}
                    placeholder={t.airFreightPlaceholder || 'e.g. 5 – 8 business days'}
                    className="rounded-xl text-xs font-medium bg-white"
                  />
                  <p className="text-[11px] text-slate-500">
                    {t.airFreightDesc || 'Fast air cargo line including customs duty.'}
                  </p>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200/80">
                  <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Train className="w-3.5 h-3.5 text-indigo-600" />
                    {t.railFreightLabel || 'CR Express Railway'}
                  </Label>
                  <Input
                    value={currentValues.pdpRailFreightDays || ''}
                    onChange={(e) => updateField('pdpRailFreightDays', e.target.value)}
                    placeholder={t.railFreightPlaceholder || 'e.g. 14 – 20 business days'}
                    className="rounded-xl text-xs font-medium bg-white"
                  />
                  <p className="text-[11px] text-slate-500">
                    {t.railFreightDesc || 'China-Europe regular container rail transit.'}
                  </p>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200/80">
                  <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Ship className="w-3.5 h-3.5 text-emerald-600" />
                    {t.seaFreightLabel || 'Sea Freight (FCL / LCL)'}
                  </Label>
                  <Input
                    value={currentValues.pdpSeaFreightDays || ''}
                    onChange={(e) => updateField('pdpSeaFreightDays', e.target.value)}
                    placeholder={t.seaFreightPlaceholder || 'e.g. 20 – 35 days'}
                    className="rounded-xl text-xs font-medium bg-white"
                  />
                  <p className="text-[11px] text-slate-500">
                    {t.seaFreightDesc || 'Ocean container freight via Ningbo/Shanghai.'}
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
                      {t.reassuranceTitle || 'Product Detail Reassurance Badges'}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      {t.reassuranceDesc || 'Edit the three highlighted guarantee cards displayed directly under product gallery on desktop and mobile.'}
                    </CardDescription>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {t.editingBadge ? t.editingBadge.replace('{locale}', LOCALES.find((l) => l.code === activeLocaleTab)?.label || '') : `Editing: ${LOCALES.find((l) => l.code === activeLocaleTab)?.label}`}
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
                  <h3 className="font-bold text-sm text-slate-900">{t.warrantyCardTitle || 'Warranty Card'}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">{t.badgeTitleLabel || 'Badge Title'}</Label>
                    <Input
                      value={currentValues.pdpWarrantyTitle || ''}
                      onChange={(e) => updateField('pdpWarrantyTitle', e.target.value)}
                      placeholder="e.g. 2-Year Warranty"
                      className="rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">{t.badgeSubtitleLabel || 'Badge Subtitle'}</Label>
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
                  <h3 className="font-bold text-sm text-slate-900">{t.expressDeliveryCardTitle || 'Express Delivery Card'}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">{t.badgeTitleLabel || 'Badge Title'}</Label>
                    <Input
                      value={currentValues.pdpDeliveryTitle || ''}
                      onChange={(e) => updateField('pdpDeliveryTitle', e.target.value)}
                      placeholder="e.g. Express Delivery"
                      className="rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">{t.badgeSubtitleLabel || 'Badge Subtitle'}</Label>
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
                  <h3 className="font-bold text-sm text-slate-900">{t.returnsCardTitle || 'Returns & Replacement Card'}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">{t.badgeTitleLabel || 'Badge Title'}</Label>
                    <Input
                      value={currentValues.pdpReturnsTitle || ''}
                      onChange={(e) => updateField('pdpReturnsTitle', e.target.value)}
                      placeholder="e.g. 14-Day Returns"
                      className="rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">{t.badgeSubtitleLabel || 'Badge Subtitle'}</Label>
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
                  {t.livePreviewTitle || 'Live Preview (As rendered on Product Page)'}
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

      {/* TAB: Badges & Signals ON/OFF Manager */}
      {activeSectionTab === 'demand' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Header Card */}
          <Card className="rounded-2xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                    <Zap className="w-4 h-4 text-amber-500" />
                  </span>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Product Badges &amp; Signals ON/OFF Manager
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Enable or disable any product detail badge with independent ON/OFF switches, custom text, and instant storefront preview.
                    </CardDescription>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  Editing: {LOCALES.find((l) => l.code === activeLocaleTab)?.label}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">

              {/* 1. High Demand & Urgency Badge */}
              <div className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/30 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                      <Zap className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        ⚡ &ldquo;In High Demand&rdquo; Badge
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Green urgency pill badge shown next to category pill in the main buy box.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${currentValues.pdpHighDemandBadgeEnabled !== 'false' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {currentValues.pdpHighDemandBadgeEnabled !== 'false' ? 'ON' : 'OFF'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={currentValues.pdpHighDemandBadgeEnabled !== 'false'}
                        onChange={(e) => updateField('pdpHighDemandBadgeEnabled', e.target.checked ? 'true' : 'false')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-amber-200/60">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Minimum Stock Trigger (Units)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={currentValues.pdpHighDemandThreshold ?? '100'}
                      onChange={(e) => updateField('pdpHighDemandThreshold', e.target.value)}
                      placeholder="100"
                      className="rounded-xl text-xs font-bold bg-white"
                    />
                    <p className="text-[11px] text-slate-500">Only displayed when available stock exceeds this amount.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Badge Label ({LOCALES.find((l) => l.code === activeLocaleTab)?.label})</Label>
                    <Input
                      value={currentValues.pdpHighDemandText || ''}
                      onChange={(e) => updateField('pdpHighDemandText', e.target.value)}
                      placeholder="e.g. ⚡ In High Demand"
                      className="rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Preview:</span>
                  <span className="bg-[#EFF6FF] text-[#00407a] border border-blue-200/80 font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    COOKWARE &amp; BAKEWARE
                  </span>
                  {currentValues.pdpHighDemandBadgeEnabled !== 'false' ? (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {currentValues.pdpHighDemandText || '⚡ In High Demand'}
                    </span>
                  ) : (
                    <span className="text-xs italic text-rose-500">
                      (Hidden / Disabled)
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Courier Delivery & Dispatch Countdown Box */}
              <div className="p-4 rounded-2xl border border-blue-200/80 bg-blue-50/30 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#00407a] flex items-center justify-center font-bold text-xs shrink-0">
                      <Truck className="w-4 h-4 text-[#00407a]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        🚚 Courier Delivery &amp; Live Dispatch Countdown Box
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Shows or hides the Courier Delivery timing box (&ldquo;Delivery on 2-3 business days&rdquo; with live order dispatch countdown) on the product details page.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${currentValues.pdpCourierDeliveryBadgeEnabled !== 'false' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {currentValues.pdpCourierDeliveryBadgeEnabled !== 'false' ? 'ON' : 'OFF'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={currentValues.pdpCourierDeliveryBadgeEnabled !== 'false'}
                        onChange={(e) => updateField('pdpCourierDeliveryBadgeEnabled', e.target.checked ? 'true' : 'false')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                {/* Preview */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Preview:</span>
                    {currentValues.pdpCourierDeliveryBadgeEnabled !== 'false' ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <div className="w-6 h-6 rounded-md bg-blue-50 text-[#00407a] flex items-center justify-center">
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-900">
                          {activeLocaleTab === 'ru' ? 'Курьерская доставка' : activeLocaleTab === 'zh' ? '特快专递送达' : 'Courier Delivery'}
                        </span>
                        <span className="font-bold text-emerald-600 font-mono">
                          {activeLocaleTab === 'ru' ? '1 – 3 рабочих дня' : activeLocaleTab === 'zh' ? '1 – 3个工作日' : '1 – 3 business days'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs italic text-rose-500 font-medium">
                        (Hidden / Disabled on Product Details Page)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Reassurance Badges Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    3-Benefit Reassurance Strip Badges
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Warranty Card */}
                  <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/20 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            <Shield className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-xs text-slate-900">Warranty Badge</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={currentValues.pdpWarrantyBadgeEnabled !== 'false'}
                            onChange={(e) => updateField('pdpWarrantyBadgeEnabled', e.target.checked ? 'true' : 'false')}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-slate-700">Title</Label>
                        <Input
                          value={currentValues.pdpWarrantyTitle || ''}
                          onChange={(e) => updateField('pdpWarrantyTitle', e.target.value)}
                          placeholder="e.g. 2-Year Warranty"
                          className="rounded-xl text-xs bg-white h-8"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-slate-700">Subtitle</Label>
                        <Input
                          value={currentValues.pdpWarrantySubtitle || ''}
                          onChange={(e) => updateField('pdpWarrantySubtitle', e.target.value)}
                          placeholder="e.g. Full factory coverage"
                          className="rounded-xl text-xs bg-white h-8"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-blue-100/80">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentValues.pdpWarrantyBadgeEnabled !== 'false' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {currentValues.pdpWarrantyBadgeEnabled !== 'false' ? '● Active' : '○ Hidden'}
                      </span>
                    </div>
                  </div>

                  {/* Express Delivery Card */}
                  <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                            <Truck className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-xs text-slate-900">Express Delivery</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={currentValues.pdpDeliveryBadgeEnabled !== 'false'}
                            onChange={(e) => updateField('pdpDeliveryBadgeEnabled', e.target.checked ? 'true' : 'false')}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-slate-700">Title</Label>
                        <Input
                          value={currentValues.pdpDeliveryTitle || ''}
                          onChange={(e) => updateField('pdpDeliveryTitle', e.target.value)}
                          placeholder="e.g. Express Delivery"
                          className="rounded-xl text-xs bg-white h-8"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-slate-700">Subtitle</Label>
                        <Input
                          value={currentValues.pdpDeliverySubtitle || ''}
                          onChange={(e) => updateField('pdpDeliverySubtitle', e.target.value)}
                          placeholder="e.g. Free over $50+"
                          className="rounded-xl text-xs bg-white h-8"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-emerald-100/80">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentValues.pdpDeliveryBadgeEnabled !== 'false' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {currentValues.pdpDeliveryBadgeEnabled !== 'false' ? '● Active' : '○ Hidden'}
                      </span>
                    </div>
                  </div>

                  {/* 14-Day Returns Card */}
                  <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/20 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-xs text-slate-900">14-Day Returns</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={currentValues.pdpReturnsBadgeEnabled !== 'false'}
                            onChange={(e) => updateField('pdpReturnsBadgeEnabled', e.target.checked ? 'true' : 'false')}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-slate-700">Title</Label>
                        <Input
                          value={currentValues.pdpReturnsTitle || ''}
                          onChange={(e) => updateField('pdpReturnsTitle', e.target.value)}
                          placeholder="e.g. 14-Day Returns"
                          className="rounded-xl text-xs bg-white h-8"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-slate-700">Subtitle</Label>
                        <Input
                          value={currentValues.pdpReturnsSubtitle || ''}
                          onChange={(e) => updateField('pdpReturnsSubtitle', e.target.value)}
                          placeholder="e.g. Hassle-free guarantee"
                          className="rounded-xl text-xs bg-white h-8"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-100/80">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentValues.pdpReturnsBadgeEnabled !== 'false' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {currentValues.pdpReturnsBadgeEnabled !== 'false' ? '● Active' : '○ Hidden'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Factory & QC Trust Badges Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Factory &amp; Quality Control Trust Badges
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Factory Direct */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Factory className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-xs text-slate-900">Direct Verified Factory</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={currentValues.pdpFactoryBadgeEnabled !== 'false'}
                          onChange={(e) => updateField('pdpFactoryBadgeEnabled', e.target.checked ? 'true' : 'false')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[11px] font-semibold text-slate-700">Title</Label>
                        <Input
                          value={currentValues.pdpFactoryTitle || ''}
                          onChange={(e) => updateField('pdpFactoryTitle', e.target.value)}
                          className="rounded-xl text-xs bg-slate-50 h-8 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] font-semibold text-slate-700">Description</Label>
                        <Input
                          value={currentValues.pdpFactoryDesc || ''}
                          onChange={(e) => updateField('pdpFactoryDesc', e.target.value)}
                          className="rounded-xl text-xs bg-slate-50 h-8 mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* QC Inspection */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-xs text-slate-900">Rigorous Quality Inspection</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={currentValues.pdpQcBadgeEnabled !== 'false'}
                          onChange={(e) => updateField('pdpQcBadgeEnabled', e.target.checked ? 'true' : 'false')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[11px] font-semibold text-slate-700">Title</Label>
                        <Input
                          value={currentValues.pdpQcTitle || ''}
                          onChange={(e) => updateField('pdpQcTitle', e.target.value)}
                          className="rounded-xl text-xs bg-slate-50 h-8 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] font-semibold text-slate-700">Description</Label>
                        <Input
                          value={currentValues.pdpQcDesc || ''}
                          onChange={(e) => updateField('pdpQcDesc', e.target.value)}
                          className="rounded-xl text-xs bg-slate-50 h-8 mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Door-to-Door Logistics */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-500" />
                        <span className="font-bold text-xs text-slate-900">Door-to-Door Logistics</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={currentValues.pdpLogisticsBadgeEnabled !== 'false'}
                          onChange={(e) => updateField('pdpLogisticsBadgeEnabled', e.target.checked ? 'true' : 'false')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[11px] font-semibold text-slate-700">Title</Label>
                        <Input
                          value={currentValues.pdpLogisticsTitle || ''}
                          onChange={(e) => updateField('pdpLogisticsTitle', e.target.value)}
                          className="rounded-xl text-xs bg-slate-50 h-8 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] font-semibold text-slate-700">Description</Label>
                        <Input
                          value={currentValues.pdpLogisticsDesc || ''}
                          onChange={(e) => updateField('pdpLogisticsDesc', e.target.value)}
                          className="rounded-xl text-xs bg-slate-50 h-8 mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Trade Assurance Escrow */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-500" />
                        <span className="font-bold text-xs text-slate-900">Trade Assurance Escrow</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={currentValues.pdpEscrowBadgeEnabled !== 'false'}
                          onChange={(e) => updateField('pdpEscrowBadgeEnabled', e.target.checked ? 'true' : 'false')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[11px] font-semibold text-slate-700">Title</Label>
                        <Input
                          value={currentValues.pdpEscrowTitle || ''}
                          onChange={(e) => updateField('pdpEscrowTitle', e.target.value)}
                          className="rounded-xl text-xs bg-slate-50 h-8 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] font-semibold text-slate-700">Description</Label>
                        <Input
                          value={currentValues.pdpEscrowDesc || ''}
                          onChange={(e) => updateField('pdpEscrowDesc', e.target.value)}
                          className="rounded-xl text-xs bg-slate-50 h-8 mt-1"
                        />
                      </div>
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
                      {t.factoryTrustTitle || 'Factory Assurance & Quality Control Trust Badges'}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      {t.factoryTrustDesc || 'Displayed on the mobile product sheet and buyer reassurance section.'}
                    </CardDescription>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {t.editingBadge ? t.editingBadge.replace('{locale}', LOCALES.find((l) => l.code === activeLocaleTab)?.label || '') : `Editing: ${LOCALES.find((l) => l.code === activeLocaleTab)?.label}`}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Direct Factory */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Factory className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs text-slate-900">{t.trustDirectFactory || '1. Factory Direct Supply'}</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-slate-600 font-medium">{t.titleLabel || 'Title'}</Label>
                    <Input
                      value={currentValues.pdpFactoryTitle || ''}
                      onChange={(e) => updateField('pdpFactoryTitle', e.target.value)}
                      placeholder="Direct Verified Factory"
                      className="rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-slate-600 font-medium">{t.descLabel || 'Description'}</Label>
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
                    <span className="font-bold text-xs text-slate-900">{t.trustQc || '2. Quality Inspection (QC)'}</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-slate-600 font-medium">{t.titleLabel || 'Title'}</Label>
                    <Input
                      value={currentValues.pdpQcTitle || ''}
                      onChange={(e) => updateField('pdpQcTitle', e.target.value)}
                      placeholder="Rigorous Quality Inspection"
                      className="rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-slate-600 font-medium">{t.descLabel || 'Description'}</Label>
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
                    <span className="font-bold text-xs text-slate-900">{t.trustLogistics || '3. Customs Clearance & Logistics'}</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-slate-600 font-medium">{t.titleLabel || 'Title'}</Label>
                    <Input
                      value={currentValues.pdpLogisticsTitle || ''}
                      onChange={(e) => updateField('pdpLogisticsTitle', e.target.value)}
                      placeholder="Door-to-Door Logistics"
                      className="rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-slate-600 font-medium">{t.descLabel || 'Description'}</Label>
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
                    <span className="font-bold text-xs text-slate-900">{t.trustEscrow || '4. Trade Assurance Escrow'}</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-slate-600 font-medium">{t.titleLabel || 'Title'}</Label>
                    <Input
                      value={currentValues.pdpEscrowTitle || ''}
                      onChange={(e) => updateField('pdpEscrowTitle', e.target.value)}
                      placeholder="Trade Assurance Protected"
                      className="rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-slate-600 font-medium">{t.descLabel || 'Description'}</Label>
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

      {/* SECTION TAB 4: BUYER Q&A / FAQ */}
      {activeSectionTab === 'faq' && (
        <div className="space-y-6">
          <Card className="rounded-2xl border-slate-200 shadow-2xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    {t.faqTitle || 'Product Detail Page Buyer Q&A / FAQ'}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    {t.faqDesc || 'Configure the questions and answers displayed under the "Buyer Q&A / FAQ" tab on every product page. Supports variable placeholder {moq} for automatic product minimum order quantity insertion.'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Header Titles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/40">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">{t.faqHeadingLabel || 'Tab Heading Title'}</Label>
                  <Input
                    value={currentValues.pdpFaqTitle || ''}
                    onChange={(e) => updateField('pdpFaqTitle', e.target.value)}
                    placeholder={t.faqHeadingPlaceholder || 'Frequently Asked Questions'}
                    className="rounded-lg text-xs bg-white"
                  />
                  <p className="text-[10px] text-slate-400">{t.faqHeadingSub || 'Section title displayed above the questions list.'}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">{t.faqSubtitleLabel || 'Tab Subtitle'}</Label>
                  <Input
                    value={currentValues.pdpFaqSubtitle || ''}
                    onChange={(e) => updateField('pdpFaqSubtitle', e.target.value)}
                    placeholder={t.faqSubtitlePlaceholder || 'Get quick answers to common questions'}
                    className="rounded-lg text-xs bg-white"
                  />
                  <p className="text-[10px] text-slate-400">{t.faqSubtitleSub || 'Helpful explanation displayed beneath heading.'}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">{t.faqBtnLabel || 'Inquiry Button Text'}</Label>
                  <Input
                    value={currentValues.pdpFaqAskBtn || ''}
                    onChange={(e) => updateField('pdpFaqAskBtn', e.target.value)}
                    placeholder={t.faqBtnPlaceholder || 'Ask a Question'}
                    className="rounded-lg text-xs bg-white"
                  />
                  <p className="text-[10px] text-slate-400">{t.faqBtnSub || 'Button to trigger custom question form.'}</p>
                </div>
              </div>

              {/* Questions 1 to 5 List */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  {t.standardQuestionsTitle || 'Standard Questions & Answers (1 – 5)'}
                </h4>

                {[
                  {
                    num: 1,
                    qKey: 'pdpFaq1Q',
                    aKey: 'pdpFaq1A',
                    defaultQ: 'What is the minimum order quantity?',
                    defaultA: 'The minimum order quantity for this product is {moq} units. Wholesale pricing is available for larger orders.',
                    hint: 'Supports {moq} variable for automatic MOQ quantity replacement.',
                  },
                  {
                    num: 2,
                    qKey: 'pdpFaq2Q',
                    aKey: 'pdpFaq2A',
                    defaultQ: 'What is the shipping time?',
                    defaultA: 'Standard shipping takes 7-14 business days. Express door-to-door shipping options are available at checkout.',
                    hint: 'Explain shipping speed and door-to-door transit.',
                  },
                  {
                    num: 3,
                    qKey: 'pdpFaq3Q',
                    aKey: 'pdpFaq3A',
                    defaultQ: 'Do you offer bulk wholesale discounts?',
                    defaultA: 'Yes! We offer tiered wholesale pricing for bulk orders. Contact our trade managers for custom container rates.',
                    hint: 'Explain volume wholesale discounts or container rates.',
                  },
                  {
                    num: 4,
                    qKey: 'pdpFaq4Q',
                    aKey: 'pdpFaq4A',
                    defaultQ: 'What is your return & inspection policy?',
                    defaultA: 'We offer full pre-shipment quality inspection and 30-day return coverage for any verified manufacturing defects.',
                    hint: 'Provide reassurance on factory defects and returns.',
                  },
                  {
                    num: 5,
                    qKey: 'pdpFaq5Q',
                    aKey: 'pdpFaq5A',
                    defaultQ: 'Can I customize this product or add my logo (OEM/ODM)?',
                    defaultA: 'Yes, OEM packaging, custom branding, and ODM tooling are supported for volume orders. Contact sourcing for specs.',
                    hint: 'Cover custom logo printing, OEM packaging, and ODM molds.',
                  },
                ].map(({ num, qKey, aKey, defaultQ, defaultA, hint }) => (
                  <div
                    key={num}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 transition-colors hover:border-blue-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">
                          {num}
                        </span>
                        <span className="font-bold text-xs text-slate-900">
                          {t.questionNumber ? t.questionNumber.replace('{num}', num.toString()) : `Question #${num}`}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">{hint}</span>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-slate-600 font-semibold">{t.questionLabel || 'Question'}</Label>
                      <Input
                        value={currentValues[qKey] || ''}
                        onChange={(e) => updateField(qKey, e.target.value)}
                        placeholder={defaultQ}
                        className="rounded-lg text-xs bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-slate-600 font-semibold">{t.answerLabel || 'Answer'}</Label>
                      <textarea
                        value={currentValues[aKey] || ''}
                        onChange={(e) => updateField(aKey, e.target.value)}
                        placeholder={defaultA}
                        rows={2}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                      />
                    </div>
                  </div>
                ))}
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
            {t.footerNote || 'Changes saved here update both Desktop & Mobile storefronts instantly.'}
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
              {t.savingSettings || 'Saving Settings...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {t.saveAllBtn || 'Save All Changes'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
