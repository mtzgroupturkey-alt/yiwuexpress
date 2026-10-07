'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowLeft,
  Sparkles,
  Percent,
  Tag,
  ChevronRight,
  Languages,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext';
import { useSettings } from '@/components/SettingsProvider';

type TranslationLocale = 'en' | 'ru' | 'zh';

interface WeeklyBargainsForm {
  enabled: boolean;
  badge: string;
  tag: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

interface MemberClubForm {
  enabled: boolean;
  badge: string;
  membersCount: string;
  title: string;
  description: string;
  activateBtn: string;
  activateLink: string;
  howPointsWork: string;
  howPointsLink: string;
}

const DEFAULT_STATE: {
  weeklyBargains: Record<TranslationLocale, WeeklyBargainsForm>;
  memberClub: Record<TranslationLocale, MemberClubForm>;
} = {
  weeklyBargains: {
    en: {
      enabled: true,
      badge: 'UP TO -40%',
      tag: 'Weekly Price Drop',
      title: 'Weekly Mega Bargains & Clearance',
      subtitle: 'Limited stock discounts up to 50% off retail pricing across home and garden collections',
      buttonText: 'View all deals',
      buttonLink: '',
    },
    ru: {
      enabled: true,
      badge: 'СКИДКИ ДО -40%',
      tag: 'Еженедельное снижение цен',
      title: 'Мега-распродажа недели и ликвидация',
      subtitle: 'Ограниченный запас скидок до 50% от розничной цены на товары для дома и сада',
      buttonText: 'Смотреть все скидки',
      buttonLink: '',
    },
    zh: {
      enabled: true,
      badge: '低至6折 (-40%)',
      tag: '每周特惠直降',
      title: '每周清仓超值盛典',
      subtitle: '全场家居与园艺系列限量特惠，低至零售价五折',
      buttonText: '查看全部特惠',
      buttonLink: '',
    },
  },
  memberClub: {
    en: {
      enabled: true,
      badge: 'EXCLUSIVE MEMBER CLUB',
      membersCount: 'Over 420,000 active members',
      title: 'Earn 3% Instant Cashback + Free Express Delivery',
      description: 'Join the {name} Club for free today. Spend points directly at checkout on furniture, kitchenware, and smart home appliances (1 point = $1).',
      activateBtn: 'Activate Free Membership',
      activateLink: '',
      howPointsWork: 'How points work',
      howPointsLink: '',
    },
    ru: {
      enabled: true,
      badge: 'ЭКСКЛЮЗИВНЫЙ КЛУБ ПРИВИЛЕГИЙ',
      membersCount: 'Более 420 000 активных участников',
      title: 'Кэшбэк 3% мгновенно + Бесплатная экспресс-доставка',
      description: 'Вступите в клуб {name} бесплатно уже сегодня. Тратьте баллы прямо при оформлении заказа на мебель, посуду и бытовую технику (1 балл = $1).',
      activateBtn: 'Активировать членство бесплатно',
      activateLink: '',
      howPointsWork: 'Как работают баллы',
      howPointsLink: '',
    },
    zh: {
      enabled: true,
      badge: '尊享会员俱乐部',
      membersCount: '超过 420,000 位活跃会员',
      title: '享3%即时返现 + 免费特快专递',
      description: '立即免费加入 {name} 会员俱乐部。在结账时直接抵扣家具、厨具和智能家居产品（1积分 = $1）。',
      activateBtn: '免费激活会员',
      activateLink: '',
      howPointsWork: '积分规则说明',
      howPointsLink: '',
    },
  },
};

export default function AdsManagerPage() {
  const { dict } = useAdminLocale();
  const { refreshSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TranslationLocale>('en');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [weeklyBargains, setWeeklyBargains] = useState<Record<TranslationLocale, WeeklyBargainsForm>>(
    DEFAULT_STATE.weeklyBargains
  );
  const [memberClub, setMemberClub] = useState<Record<TranslationLocale, MemberClubForm>>(
    DEFAULT_STATE.memberClub
  );
  const [companyName, setCompanyName] = useState('dromkok');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/ads-manager');
      if (!res.ok) throw new Error('Failed to load ads settings');
      const json = await res.json();
      if (json.data) {
        if (json.data.weeklyBargains) setWeeklyBargains(json.data.weeklyBargains);
        if (json.data.memberClub) setMemberClub(json.data.memberClub);
        if (json.data.companyName) setCompanyName(json.data.companyName);
      }
    } catch (err: any) {
      console.error(err);
      setToastMessage({ type: 'error', text: err.message || 'Error loading settings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setToastMessage(null);
    try {
      const res = await fetch('/api/admin/settings/ads-manager', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeklyBargains,
          memberClub,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      setToastMessage({ type: 'success', text: 'Homepage ads and promo banners saved successfully!' });
      refreshSettings();
    } catch (err: any) {
      console.error(err);
      setToastMessage({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all promo banner text and settings to factory defaults?')) {
      setWeeklyBargains(DEFAULT_STATE.weeklyBargains);
      setMemberClub(DEFAULT_STATE.memberClub);
    }
  };

  // Helper updates for current locale
  const updateWB = (key: keyof WeeklyBargainsForm, value: any) => {
    setWeeklyBargains((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [key]: value,
      },
    }));
  };

  const updateGlobalWbEnabled = (enabled: boolean) => {
    setWeeklyBargains((prev) => ({
      en: { ...prev.en, enabled },
      ru: { ...prev.ru, enabled },
      zh: { ...prev.zh, enabled },
    }));
  };

  const updateMC = (key: keyof MemberClubForm, value: any) => {
    setMemberClub((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [key]: value,
      },
    }));
  };

  const updateGlobalMcEnabled = (enabled: boolean) => {
    setMemberClub((prev) => ({
      en: { ...prev.en, enabled },
      ru: { ...prev.ru, enabled },
      zh: { ...prev.zh, enabled },
    }));
  };

  const currentWB = weeklyBargains[activeTab] || DEFAULT_STATE.weeklyBargains[activeTab];
  const currentMC = memberClub[activeTab] || DEFAULT_STATE.memberClub[activeTab];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-[#1a3a5c] animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading Homepage Ads Manager...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-200" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-200" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/settings"
              className="text-xs font-semibold text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Settings
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Homepage Ads & Promo Banners Manager
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Customize weekly clearance bargains and exclusive member club loyalty banners with live multilingual preview
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetDefaults}
            className="text-xs border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Reset Defaults
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1a3a5c] hover:bg-[#132c47] text-white font-bold text-xs px-5 shadow-sm flex items-center gap-2"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Locale Tabs */}
      <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-xs flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-600">Editing Language:</span>
          <div className="inline-flex p-1 bg-gray-100 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'en'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              🇺🇸 English (EN)
            </button>
            <button
              onClick={() => setActiveTab('ru')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ru'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              🇷🇺 Русский (RU)
            </button>
            <button
              onClick={() => setActiveTab('zh')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'zh'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              🇨🇳 中文 (ZH)
            </button>
          </div>
        </div>

        <div className="text-[11px] text-gray-400 font-medium">
          Global toggles apply across all languages. Text is displayed based on shopper's chosen language.
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: WEEKLY MEGA BARGAINS & CLEARANCE                    */}
      {/* ============================================================== */}
      <Card className="rounded-3xl border-gray-100 shadow-xs overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100/50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-xs">
                <Percent className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-gray-900">
                  Weekly Mega Bargains & Clearance (Price Drop Banner)
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 mt-0.5">
                  High-converting promotional bar displayed above the clearance and discounted items carousel
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-red-100 shadow-2xs">
              <span className="text-xs font-bold text-gray-700">Display Section:</span>
              <Switch
                checked={currentWB.enabled}
                onCheckedChange={updateGlobalWbEnabled}
              />
              <span className={`text-xs font-black ${currentWB.enabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                {currentWB.enabled ? 'VISIBLE' : 'HIDDEN'}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Discount Badge Text ({activeTab.toUpperCase()})
              </label>
              <Input
                value={currentWB.badge}
                onChange={(e) => updateWB('badge', e.target.value)}
                placeholder="e.g. UP TO -40%"
                className="font-bold text-sm bg-gray-50/50 border-gray-200"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Small yellow badge highlighting maximum discount percentage
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Tagline / Header Tag ({activeTab.toUpperCase()})
              </label>
              <Input
                value={currentWB.tag}
                onChange={(e) => updateWB('tag', e.target.value)}
                placeholder="e.g. Weekly Price Drop"
                className="text-sm bg-gray-50/50 border-gray-200"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Secondary label beside the discount badge
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Main Banner Title ({activeTab.toUpperCase()})
              </label>
              <Input
                value={currentWB.title}
                onChange={(e) => updateWB('title', e.target.value)}
                placeholder="e.g. Weekly Mega Bargains & Clearance"
                className="font-black text-sm bg-gray-50/50 border-gray-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Subtitle & Promotional Copy ({activeTab.toUpperCase()})
              </label>
              <Textarea
                rows={2}
                value={currentWB.subtitle}
                onChange={(e) => updateWB('subtitle', e.target.value)}
                placeholder="e.g. Limited stock discounts up to 50% off retail pricing across home and garden collections"
                className="text-xs bg-gray-50/50 border-gray-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Button Text ({activeTab.toUpperCase()})
              </label>
              <Input
                value={currentWB.buttonText}
                onChange={(e) => updateWB('buttonText', e.target.value)}
                placeholder="e.g. View all deals"
                className="text-xs bg-gray-50/50 border-gray-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Button Action / Target URL (Optional)
              </label>
              <Input
                value={currentWB.buttonLink}
                onChange={(e) => updateWB('buttonLink', e.target.value)}
                placeholder="Leave blank for default catalog filter, or enter e.g. /store?deals=true"
                className="text-xs bg-gray-50/50 border-gray-200"
              />
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-[#1a3a5c]" />
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Live Storefront Preview ({activeTab.toUpperCase()})
              </span>
            </div>

            <div
              className="rounded-2xl p-5 sm:p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden border border-red-900/40"
              style={{
                background: 'linear-gradient(135deg, #1C0A0A 0%, #3B0D0D 40%, #7F1D1D 80%, #991B1B 100%)',
              }}
            >
              <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-red-500/20 blur-2xl pointer-events-none" />
              <div className="absolute left-1/3 -bottom-12 w-48 h-48 rounded-full bg-amber-500/15 blur-xl pointer-events-none" />

              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-md border border-amber-300/30">
                  <Percent className="w-6 h-6 text-slate-950 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-sm uppercase tracking-wider shadow-xs">
                      {currentWB.badge || 'UP TO -40%'}
                    </span>
                    <span className="text-red-200 text-xs font-semibold">
                      • {currentWB.tag || 'Weekly Price Drop'}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-white drop-shadow-xs">
                    {currentWB.title || 'Weekly Mega Bargains & Clearance'}
                  </h2>
                  <p className="text-xs text-red-100/90 mt-0.5 max-w-[650px] leading-relaxed">
                    {currentWB.subtitle || 'Limited stock discounts up to 50% off retail pricing across home and garden collections'}
                  </p>
                </div>
              </div>

              <div className="self-start md:self-auto bg-[#F5A602] text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md relative z-10 shrink-0 cursor-default">
                <span>{currentWB.buttonText || 'View all deals'}</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================== */}
      {/* SECTION 2: EXCLUSIVE MEMBER CLUB BANNER                        */}
      {/* ============================================================== */}
      <Card className="rounded-3xl border-gray-100 shadow-xs overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00407a] text-white flex items-center justify-center shadow-xs">
                <Tag className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-gray-900">
                  Exclusive Member Club & Loyalty Banner
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 mt-0.5">
                  Loyalty rewards banner inviting shoppers to join club membership and earn cashback points
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-blue-100 shadow-2xs">
              <span className="text-xs font-bold text-gray-700">Display Section:</span>
              <Switch
                checked={currentMC.enabled}
                onCheckedChange={updateGlobalMcEnabled}
              />
              <span className={`text-xs font-black ${currentMC.enabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                {currentMC.enabled ? 'VISIBLE' : 'HIDDEN'}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Club Badge Text ({activeTab.toUpperCase()})
              </label>
              <Input
                value={currentMC.badge}
                onChange={(e) => updateMC('badge', e.target.value)}
                placeholder="e.g. EXCLUSIVE MEMBER CLUB"
                className="font-bold text-sm bg-gray-50/50 border-gray-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Active Member Count Tag ({activeTab.toUpperCase()})
              </label>
              <Input
                value={currentMC.membersCount}
                onChange={(e) => updateMC('membersCount', e.target.value)}
                placeholder="e.g. Over 420,000 active members"
                className="text-sm bg-gray-50/50 border-gray-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Club Title / Value Proposition ({activeTab.toUpperCase()})
              </label>
              <Input
                value={currentMC.title}
                onChange={(e) => updateMC('title', e.target.value)}
                placeholder="e.g. Earn 3% Instant Cashback + Free Express Delivery"
                className="font-black text-sm bg-gray-50/50 border-gray-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Club Description ({activeTab.toUpperCase()})
              </label>
              <Textarea
                rows={3}
                value={currentMC.description}
                onChange={(e) => updateMC('description', e.target.value)}
                placeholder="e.g. Join the {name} Club for free today. Spend points directly at checkout on furniture, kitchenware, and smart home appliances (1 point = $1)."
                className="text-xs bg-gray-50/50 border-gray-200"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Tip: Use <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 font-mono">{"{name}"}</code> to dynamically render your company brand name ({companyName}).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Primary Button Text ({activeTab.toUpperCase()})
              </label>
              <Input
                value={currentMC.activateBtn}
                onChange={(e) => updateMC('activateBtn', e.target.value)}
                placeholder="e.g. Activate Free Membership"
                className="text-xs bg-gray-50/50 border-gray-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Primary Button Action / Link
              </label>
              <Input
                value={currentMC.activateLink}
                onChange={(e) => updateMC('activateLink', e.target.value)}
                placeholder="Leave blank for register modal, or enter e.g. /auth/register"
                className="text-xs bg-gray-50/50 border-gray-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Secondary Button Text ({activeTab.toUpperCase()})
              </label>
              <Input
                value={currentMC.howPointsWork}
                onChange={(e) => updateMC('howPointsWork', e.target.value)}
                placeholder="e.g. How points work"
                className="text-xs bg-gray-50/50 border-gray-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Secondary Button Action / Link
              </label>
              <Input
                value={currentMC.howPointsLink}
                onChange={(e) => updateMC('howPointsLink', e.target.value)}
                placeholder="Leave blank for info modal, or enter e.g. /content/how-points-work"
                className="text-xs bg-gray-50/50 border-gray-200"
              />
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-[#1a3a5c]" />
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Live Storefront Preview ({activeTab.toUpperCase()})
              </span>
            </div>

            <div
              className="rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #072648 0%, #00407a 100%)',
              }}
            >
              <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-blue-400/10 pointer-events-none blur-xl" />

              <div className="flex items-start gap-4 z-10">
                <div className="w-13 h-13 rounded-2xl bg-[#F5A602] flex items-center justify-center text-slate-950 shrink-0 shadow-md">
                  <Tag className="w-6 h-6 stroke-[2.2]" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {currentMC.badge || 'EXCLUSIVE MEMBER CLUB'}
                    </span>
                    <span className="text-blue-200 text-xs font-medium">
                      • {currentMC.membersCount || 'Over 420,000 active members'}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {currentMC.title || 'Earn 3% Instant Cashback + Free Express Delivery'}
                  </h3>
                  <p className="text-xs text-blue-100/90 mt-1 max-w-[650px] leading-relaxed">
                    {(currentMC.description || 'Join the {name} Club for free today. Spend points directly at checkout on furniture, kitchenware, and smart home appliances (1 point = $1).').replace('{name}', companyName)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 z-10 self-start md:self-auto shrink-0 flex-wrap">
                <div className="bg-[#F5A602] text-slate-950 font-bold px-4 py-2.5 rounded-lg text-xs shadow-md cursor-default">
                  {currentMC.activateBtn || 'Activate Free Membership'}
                </div>
                <div className="text-white text-xs font-semibold px-2 py-1 cursor-default">
                  {currentMC.howPointsWork || 'How points work'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating Save Bar */}
      <div className="sticky bottom-6 z-40 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-gray-200 shadow-xl flex items-center justify-between gap-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Save updates across all storefront language versions immediately.</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={fetchSettings}
            className="text-xs border-gray-200"
          >
            Discard
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1a3a5c] hover:bg-[#132c47] text-white font-bold text-xs px-6 shadow-sm"
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
