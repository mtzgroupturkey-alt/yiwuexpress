'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Bell,
  Send,
  Calendar,
  Users,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Link2,
  Clock,
  ShieldCheck,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { useSettings } from '@/components/SettingsProvider'

export default function ComposePushNotificationPage() {
  const router = useRouter()
  const { settings } = useSettings()
  const companyName = settings?.companyName || 'Global Trade'
  const defaultIcon = settings?.companyLogo || '/icons/icon-192x192.png'

  // Form State
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [actionUrl, setActionUrl] = useState('/store')
  const [actionLabel, setActionLabel] = useState('View Details')
  const [iconUrl, setIconUrl] = useState(defaultIcon)
  const [imageUrl, setImageUrl] = useState('')
  const [segment, setSegment] = useState('ALL')
  const [targetUserId, setTargetUserId] = useState('')

  // Schedule State
  const [sendTiming, setSendTiming] = useState<'now' | 'schedule'>('now')
  const [scheduledFor, setScheduledFor] = useState('')

  // Audience Count State
  const [targetCount, setTargetCount] = useState<number | null>(null)
  const [loadingAudience, setLoadingAudience] = useState(false)

  // Preview State
  const [previewDevice, setPreviewDevice] = useState<'android' | 'ios' | 'desktop'>('android')

  // Submission State
  const [sending, setSending] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Update default icon when settings load
  useEffect(() => {
    if (settings?.companyLogo && iconUrl === '/icons/icon-192x192.png') {
      setIconUrl(settings.companyLogo)
    }
  }, [settings, iconUrl])

  // Fetch Audience Count dynamically as segment changes
  const fetchAudienceCount = useCallback(async () => {
    try {
      setLoadingAudience(true)
      const params = new URLSearchParams({ segment })
      if (segment === 'SINGLE_USER' && targetUserId) {
        params.append('targetUserId', targetUserId)
      }
      const res = await fetch(`/api/admin/push/subscribers/count?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTargetCount(data.count)
      }
    } catch (err) {
      console.error('Error fetching audience count:', err)
    } finally {
      setLoadingAudience(false)
    }
  }, [segment, targetUserId])

  useEffect(() => {
    fetchAudienceCount()
  }, [fetchAudienceCount])

  // Send Test Push to current device
  const handleSendTest = async () => {
    if (!title.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter a title for the test notification', variant: 'destructive' })
      return
    }

    try {
      setTesting(true)
      const res = await fetch('/api/admin/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          iconUrl,
          imageUrl,
          actionUrl,
          actionLabel,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast({
          title: 'Test Notification Dispatched',
          description: data.success ? 'Delivered successfully to active device' : `Sent with result: ${data.statusCode}`,
        })
      } else {
        toast({
          title: 'Test Failed',
          description: data.error || 'Failed to dispatch test notification',
          variant: 'destructive',
        })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setTesting(false)
    }
  }

  // Final Submit Handler
  const handleFinalSubmit = async () => {
    try {
      setSending(true)

      if (sendTiming === 'schedule') {
        const res = await fetch('/api/admin/push/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            body,
            iconUrl,
            imageUrl,
            actionUrl,
            actionLabel,
            segment,
            targetUserId: segment === 'SINGLE_USER' ? targetUserId : null,
            scheduledFor,
          }),
        })

        const data = await res.json()
        if (res.ok) {
          toast({ title: 'Notification Scheduled', description: 'Your notification has been scheduled successfully' })
          router.push('/admin/notifications')
        } else {
          toast({ title: 'Schedule Failed', description: data.error || 'Failed to schedule', variant: 'destructive' })
        }
      } else {
        const res = await fetch('/api/admin/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            body,
            iconUrl,
            imageUrl,
            actionUrl,
            actionLabel,
            segment,
            targetUserId: segment === 'SINGLE_USER' ? targetUserId : null,
          }),
        })

        const data = await res.json()
        if (res.ok) {
          toast({
            title: 'Notification Sent!',
            description: `Delivered to ${data.stats?.totalSent ?? 0} devices (${data.stats?.totalFailed ?? 0} failed)`,
          })
          router.push('/admin/notifications')
        } else {
          toast({ title: 'Sending Failed', description: data.error || 'Failed to send notification', variant: 'destructive' })
        }
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSending(false)
      setShowConfirmModal(false)
    }
  }

  const isFormValid =
    title.trim().length > 0 &&
    title.length <= 60 &&
    body.trim().length > 0 &&
    body.length <= 180 &&
    (sendTiming === 'now' || (sendTiming === 'schedule' && scheduledFor))

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/notifications">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Compose Push Notification
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Create and preview your campaign with real-time multi-device rendering
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSendTest}
            disabled={testing || !title.trim()}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            <span>Send Test Push</span>
          </Button>

          <Button
            type="button"
            disabled={!isFormValid}
            onClick={() => setShowConfirmModal(true)}
            className="bg-[#00407a] hover:bg-[#00305c] text-white flex items-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer"
          >
            {sendTiming === 'schedule' ? (
              <>
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule Campaign</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Immediately</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Two Column Workspace: Left = Form, Right = Multi-Device Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Content */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-gray-900 dark:text-white">
                1. Notification Content
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 dark:text-slate-400">
                Write concise, engaging copy adhering to mobile notification standards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <Label htmlFor="title" className="text-xs font-bold text-gray-700 dark:text-slate-200">
                    Title <span className="text-rose-500">*</span>
                  </Label>
                  <span
                    className={`text-[11px] font-mono ${
                      title.length > 55
                        ? title.length > 60
                          ? 'text-rose-500 font-bold'
                          : 'text-amber-500 font-semibold'
                        : 'text-gray-400'
                    }`}
                  >
                    {title.length} / 60
                  </span>
                </div>
                <Input
                  id="title"
                  placeholder="e.g. ⚡ Flash Sale: 30% Off Industrial Supplies!"
                  value={title}
                  maxLength={60}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xs"
                />
                {title.length > 60 && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Title exceeds standard 60-character limit
                  </p>
                )}
              </div>

              {/* Body Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <Label htmlFor="body" className="text-xs font-bold text-gray-700 dark:text-slate-200">
                    Message Body <span className="text-rose-500">*</span>
                  </Label>
                  <span
                    className={`text-[11px] font-mono ${
                      body.length > 160
                        ? body.length > 180
                          ? 'text-rose-500 font-bold'
                          : 'text-amber-500 font-semibold'
                        : 'text-gray-400'
                    }`}
                  >
                    {body.length} / 180
                  </span>
                </div>
                <Textarea
                  id="body"
                  rows={3}
                  placeholder="e.g. Exclusive factory-direct deals on containers and warehouse hardware. Valid until midnight."
                  value={body}
                  maxLength={180}
                  onChange={(e) => setBody(e.target.value)}
                  className="text-xs resize-none"
                />
                {body.length > 180 && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Body exceeds recommended 180-character limit
                  </p>
                )}
              </div>

              {/* Action Destination URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="actionUrl" className="text-xs font-bold text-gray-700 dark:text-slate-200 flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-gray-400" /> Target URL
                  </Label>
                  <Input
                    id="actionUrl"
                    placeholder="/store/wholesale"
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    className="text-xs"
                  />
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <span>Quick:</span>
                    <button
                      type="button"
                      onClick={() => setActionUrl('/store')}
                      className="hover:underline text-blue-600 dark:text-blue-400"
                    >
                      /store
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setActionUrl('/en/quote-cart')}
                      className="hover:underline text-blue-600 dark:text-blue-400"
                    >
                      /quote-cart
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setActionUrl('/orders')}
                      className="hover:underline text-blue-600 dark:text-blue-400"
                    >
                      /orders
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="actionLabel" className="text-xs font-bold text-gray-700 dark:text-slate-200">
                    Action Button Label (Optional)
                  </Label>
                  <Input
                    id="actionLabel"
                    placeholder="e.g. Shop Now"
                    value={actionLabel}
                    maxLength={30}
                    onChange={(e) => setActionLabel(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Media URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="iconUrl" className="text-xs font-bold text-gray-700 dark:text-slate-200">
                    App Icon URL
                  </Label>
                  <Input
                    id="iconUrl"
                    placeholder="/icons/icon-192x192.png"
                    value={iconUrl}
                    onChange={(e) => setIconUrl(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="imageUrl" className="text-xs font-bold text-gray-700 dark:text-slate-200 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-gray-400" /> Rich Banner Image URL
                  </Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://.../banner.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Audience Targeting */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-gray-900 dark:text-white">
                    2. Audience Targeting
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 dark:text-slate-400">
                    Select who should receive this notification blast
                  </CardDescription>
                </div>

                {/* Dynamic Audience Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-[#00407a] dark:text-blue-300 text-xs font-bold border border-blue-200/60">
                  <Users className="w-3.5 h-3.5" />
                  {loadingAudience ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span>{targetCount ?? 0} devices</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'ALL', title: 'All Subscribers', desc: 'Every registered active browser and device' },
                  { id: 'ACTIVE_30D', title: 'Active (30 Days)', desc: 'Users active within the last 30 days' },
                  { id: 'BUYERS', title: 'Verified Buyers', desc: 'Subscribers who have placed orders' },
                  { id: 'INACTIVE', title: 'Re-engagement', desc: 'Subscribers inactive for over 30 days' },
                  { id: 'SINGLE_USER', title: 'Single User', desc: 'Target a specific customer by ID' },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      segment === item.id
                        ? 'border-[#00407a] bg-blue-50/40 dark:bg-blue-950/30 dark:border-blue-500 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="segment"
                      value={item.id}
                      checked={segment === item.id}
                      onChange={(e) => setSegment(e.target.value)}
                      className="mt-0.5 text-[#00407a] focus:ring-[#00407a]"
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {segment === 'SINGLE_USER' && (
                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="targetUserId" className="text-xs font-bold text-gray-700 dark:text-slate-200">
                    Customer User ID <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="targetUserId"
                    placeholder="e.g. clk09..."
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="text-xs"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Delivery Schedule */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-gray-900 dark:text-white">
                3. Delivery Timing
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 dark:text-slate-400">
                Choose whether to broadcast right away or queue for scheduled dispatch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    sendTiming === 'now'
                      ? 'border-[#00407a] bg-blue-50/40 dark:bg-blue-950/30 dark:border-blue-500'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="sendTiming"
                    value="now"
                    checked={sendTiming === 'now'}
                    onChange={() => setSendTiming('now')}
                    className="mt-0.5 text-[#00407a]"
                  />
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-[#00407a]" /> Send Immediately
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                      Dispatches to all targeted active devices immediately
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    sendTiming === 'schedule'
                      ? 'border-[#00407a] bg-blue-50/40 dark:bg-blue-950/30 dark:border-blue-500'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="sendTiming"
                    value="schedule"
                    checked={sendTiming === 'schedule'}
                    onChange={() => setSendTiming('schedule')}
                    className="mt-0.5 text-[#00407a]"
                  />
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" /> Schedule for Later
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                      Queue notification to dispatch at a specific date & time
                    </div>
                  </div>
                </label>
              </div>

              {sendTiming === 'schedule' && (
                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="scheduledFor" className="text-xs font-bold text-gray-700 dark:text-slate-200">
                    Schedule Date & Time <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="scheduledFor"
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="text-xs w-full sm:w-72"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Interactive Multi-Device Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-slate-50/60 dark:bg-slate-900/60">
            <CardHeader className="pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-[#00407a] dark:text-blue-400" />
                    Multi-Device Preview
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 dark:text-slate-400">
                    Real-time native rendering
                  </CardDescription>
                </div>

                <div className="flex items-center p-0.5 bg-slate-200 dark:bg-slate-800 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('android')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      previewDevice === 'android'
                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
                    }`}
                  >
                    Android
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('ios')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      previewDevice === 'ios'
                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
                    }`}
                  >
                    iOS
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      previewDevice === 'desktop'
                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
                    }`}
                  >
                    Desktop
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-[360px]">
              {/* ANDROID PREVIEW */}
              {previewDevice === 'android' && (
                <div className="w-full max-w-sm bg-slate-900 text-white rounded-3xl p-3 shadow-2xl border-4 border-slate-800 relative">
                  {/* Android Status Bar */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-3 pb-2 border-b border-slate-800">
                    <span className="font-semibold">12:30</span>
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px]">5G</span>
                      <span className="text-[10px]">100%</span>
                    </div>
                  </div>

                  {/* Android Notification Card */}
                  <div className="mt-3 bg-slate-800/90 rounded-2xl p-3.5 shadow-md border border-slate-700/60 backdrop-blur-md">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={iconUrl || '/icons/icon-192x192.png'}
                          alt="icon"
                          className="w-4 h-4 rounded-full object-contain"
                          onError={(e) => {
                            ;(e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                        <span className="font-bold text-[11px] text-slate-300">
                          {companyName}
                        </span>
                        <span>•</span>
                        <span className="text-[10px]">now</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {title || '⚡ Flash Sale: 30% Off Supplies'}
                        </h4>
                        <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
                          {body || 'Tap to explore newly arrived wholesale products from our verified China suppliers.'}
                        </p>
                      </div>

                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt="Rich media"
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-600"
                        />
                      )}
                    </div>

                    {actionLabel && (
                      <div className="mt-3 pt-2 border-t border-slate-700/60 flex justify-end">
                        <button
                          type="button"
                          className="px-3 py-1 rounded-lg bg-blue-600/30 text-blue-300 font-bold text-[11px] hover:bg-blue-600/40"
                        >
                          {actionLabel}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* IOS PREVIEW */}
              {previewDevice === 'ios' && (
                <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-indigo-950 text-white rounded-3xl p-3 shadow-2xl border-4 border-slate-800 relative">
                  {/* Dynamic Island Notch */}
                  <div className="w-24 h-5 bg-black rounded-full mx-auto mb-2 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-800" />
                  </div>

                  {/* iOS Lock Screen Notification */}
                  <div className="mt-2 bg-white/15 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 rounded-2xl p-3.5 shadow-lg">
                    <div className="flex items-center justify-between text-xs mb-1 text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-md overflow-hidden bg-white flex items-center justify-center">
                          <img
                            src={iconUrl || '/icons/icon-192x192.png'}
                            alt="icon"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="font-semibold text-[11px] tracking-tight">
                          {companyName.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-300">NOW</span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {title || 'Special Promotion Announcement'}
                        </h4>
                        <p className="text-[11px] text-slate-200 line-clamp-2 mt-0.5 leading-snug font-normal">
                          {body || 'Check out the latest product catalog and discounted logistics rates today.'}
                        </p>
                      </div>

                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt="Rich media"
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/20"
                        />
                      )}
                    </div>

                    {actionLabel && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-end">
                        <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                          {actionLabel} →
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DESKTOP PREVIEW */}
              {previewDevice === 'desktop' && (
                <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-3.5 shadow-xl border border-slate-200 dark:border-slate-800 text-gray-900 dark:text-white">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs text-gray-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded bg-[#00407a] text-white text-[8px] flex items-center justify-center font-bold">
                        G
                      </div>
                      <span className="font-semibold text-[11px] text-gray-700 dark:text-slate-300">
                        {companyName} • Google Chrome
                      </span>
                    </div>
                    <span className="text-[10px]">dromkok.com</span>
                  </div>

                  <div className="mt-2.5 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img
                        src={iconUrl || '/icons/icon-192x192.png'}
                        alt="icon"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold line-clamp-1 text-gray-900 dark:text-white">
                        {title || 'Important Account Update'}
                      </h4>
                      <p className="text-[11px] text-gray-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                        {body || 'Your shipment or quote is updated with new tracking information.'}
                      </p>
                    </div>
                  </div>

                  {imageUrl && (
                    <div className="mt-2.5 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img src={imageUrl} alt="banner" className="w-full h-28 object-cover" />
                    </div>
                  )}

                  {actionLabel && (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        className="px-3 py-1 text-xs font-bold rounded-md bg-[#00407a] hover:bg-[#00305c] text-white shadow-xs"
                      >
                        {actionLabel}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[11px] text-gray-400 mt-4 text-center">
                Device mockups accurately emulate OS notification layout and button behaviors
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Confirm Push Broadcast
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review your campaign specifications before triggering the dispatch pipeline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Title:</span>
                <span className="font-bold text-gray-900 dark:text-white max-w-xs truncate text-right">
                  {title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Target Audience:</span>
                <span className="font-bold text-[#00407a] dark:text-blue-400">
                  {segment} ({targetCount ?? 0} active devices)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Delivery:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {sendTiming === 'schedule'
                    ? `Scheduled for ${scheduledFor}`
                    : 'Immediate broadcast'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Destination:</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">
                  {actionUrl}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-start gap-2 text-[11px]">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Broadcast pushes are delivered directly to subscribers' device notification trays and cannot be undone.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={sending}
              onClick={handleFinalSubmit}
              className="bg-[#00407a] hover:bg-[#00305c] text-white font-bold"
            >
              {sending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Dispatching...</span>
                </>
              ) : sendTiming === 'schedule' ? (
                <span>Confirm & Schedule</span>
              ) : (
                <span>Confirm & Send Now</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
