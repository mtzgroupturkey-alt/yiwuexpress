'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Send,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bot,
  User,
  ShieldAlert,
  FolderTree,
  Tag,
  Languages,
  ArrowRight,
  Loader2,
  Info,
  Check,
  X,
} from 'lucide-react'
import { useAdminLocale } from '../contexts/AdminLocaleContext'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import {
  ChatMessage,
  PendingAction,
  AdminChatLocale,
} from '@/lib/ai-assistant/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'

export default function AiAssistantPage() {
  const { locale, dict } = useAdminLocale()
  const { user, isAdmin } = useAdminAuth()
  const t = dict?.aiAssistant || {
    title: 'AI Catalog Assistant',
    subtitle: 'Manage categories, attributes, and translations with natural language commands',
    safetyNotice: 'Safety Active: No database changes occur without your explicit confirmation.',
    inputPlaceholder: 'Ask AI (e.g. "Add missing categories for power tools", "Create clothing attributes", "Translate untranslated products")...',
    send: 'Send',
    clearHistory: 'Clear Chat',
    confirmAction: 'Confirm & Apply',
    cancelAction: 'Cancel',
    pendingProposal: 'Pending Confirmation',
    proposedSummary: 'Proposed Changes',
    statusExecuted: 'Executed',
    statusCancelled: 'Cancelled',
    quickPrompts: {
      tools: 'Add missing categories for tools & auto parts',
      attributes: 'Create attributes for clothing: Size, Color, Material, Season',
      translate: 'Translate untranslated product names & descriptions to Russian and Chinese',
      tree: 'Show category hierarchy tree',
    },
  }

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`admin_ai_chat_history_${locale}`)
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return []
  })

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activePendingAction, setActivePendingAction] = useState<PendingAction | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Persist messages in localStorage per locale
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`admin_ai_chat_history_${locale}`, JSON.stringify(messages))
      } catch {}
    }
  }, [messages, locale])

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus textarea on load
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleClearHistory = () => {
    setMessages([])
    setActivePendingAction(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`admin_ai_chat_history_${locale}`)
    }
    toast.success(dict.common?.success || 'Chat history cleared.')
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim()
    if (!text || isLoading) return

    const userMessageId = `msg_${Date.now()}_u`
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMessageId,
        role: 'user',
        content: text,
        timestamp: Date.now(),
      },
    ]

    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          locale,
          pendingAction: activePendingAction,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || `Server returned status ${response.status}`)
      }

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: data.content || '',
        timestamp: Date.now(),
        pendingAction: data.pendingAction || null,
        actionExecuted: data.actionExecuted || null,
      }

      setMessages((prev) => [...prev, assistantMessage])
      setActivePendingAction(data.pendingAction || null)

      if (data.actionExecuted?.status === 'SUCCESS') {
        toast.success(data.actionExecuted.summary || 'Operation executed successfully!')
      }
    } catch (err: any) {
      console.error('[AI Assistant Chat UI Error]:', err)
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: 'assistant',
        content: `⚠️ **Error**: ${err.message || 'Failed to process request. Please check AI Gateway settings.'}`,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
      toast.error(err.message || 'Failed to communicate with AI Assistant.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDirectExecuteAction = async (action: PendingAction) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/ai-assistant/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action,
          locale,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Execution failed.')
      }

      const successText =
        locale === 'ru'
          ? `✅ **Подтверждено и выполнено!**\n\nОперация «${action.summary}» успешно завершена.`
          : locale === 'zh'
          ? `✅ **已确认并成功执行！**\n\n操作 “${action.summary}” 已写入数据库。`
          : `✅ **Confirmed and applied!**\n\nOperation "${action.summary}" was executed successfully.`

      const confirmationMessage: ChatMessage = {
        id: `msg_${Date.now()}_exec`,
        role: 'assistant',
        content: successText,
        timestamp: Date.now(),
        actionExecuted: {
          type: action.type,
          status: 'SUCCESS',
          summary: action.summary,
          details: data.result,
        },
      }

      setMessages((prev) => [...prev, confirmationMessage])
      setActivePendingAction(null)
      toast.success(action.summary)
    } catch (err: any) {
      toast.error(err.message || 'Execution failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelAction = () => {
    setActivePendingAction(null)
    const cancelText =
      locale === 'ru'
        ? `❌ **Действие отменено.** Изменения в базу данных не внесены.`
        : locale === 'zh'
        ? `❌ **操作已取消。** 数据库未作任何变动。`
        : `❌ **Action cancelled.** No changes were made to the database.`

    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}_cancel`,
        role: 'assistant',
        content: cancelText,
        timestamp: Date.now(),
      },
    ])
    toast(t.statusCancelled || 'Cancelled')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-6xl mx-auto px-4 py-4 space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">{t.title}</h1>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs gap-1 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                AI Gateway Active
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs uppercase">
                {locale}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">{t.safetyNotice}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            className="text-xs text-slate-600 hover:text-rose-600 hover:border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            {t.clearHistory}
          </Button>
        </div>
      </div>

      {/* Main Chat Stream Container */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 rounded-xl border border-slate-200 p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
              <Bot className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-800">{t.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t.subtitle}. {t.safetyNotice}
              </p>
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left pt-2">
              <button
                onClick={() => handleSendMessage(t.quickPrompts.tools)}
                className="p-3 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 transition-all text-xs text-slate-700 font-medium flex items-center justify-between group shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-blue-600" />
                  {t.quickPrompts.tools}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                onClick={() => handleSendMessage(t.quickPrompts.attributes)}
                className="p-3 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 transition-all text-xs text-slate-700 font-medium flex items-center justify-between group shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-600" />
                  {t.quickPrompts.attributes}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                onClick={() => handleSendMessage(t.quickPrompts.translate)}
                className="p-3 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 transition-all text-xs text-slate-700 font-medium flex items-center justify-between group shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-emerald-600" />
                  {t.quickPrompts.translate}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                onClick={() => handleSendMessage(t.quickPrompts.tree)}
                className="p-3 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 transition-all text-xs text-slate-700 font-medium flex items-center justify-between group shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-amber-600" />
                  {t.quickPrompts.tree}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-2xl space-y-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Bubble Text */}
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                </div>

                {/* If AI formulated a Pending Action (Confirmation Card) */}
                {msg.pendingAction && msg.pendingAction.status === 'PENDING' && (
                  <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50/80 to-orange-50/40 p-4 rounded-xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                        <h4 className="font-bold text-amber-900 text-xs sm:text-sm uppercase tracking-wide">
                          {t.pendingProposal}
                        </h4>
                      </div>
                      <Badge className="bg-amber-600 text-white hover:bg-amber-700 text-2xs">
                        {msg.pendingAction.type}
                      </Badge>
                    </div>

                    <p className="text-xs text-amber-800 font-semibold">{msg.pendingAction.summary}</p>

                    {/* Category preview list */}
                    {msg.pendingAction.payload.categories && (
                      <div className="bg-white/80 rounded-lg p-2.5 border border-amber-200/60 max-h-48 overflow-y-auto space-y-1.5 text-xs text-slate-700">
                        {msg.pendingAction.payload.categories.map((c, i) => (
                          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-100 last:border-0 gap-1">
                            <span className="font-bold text-slate-900">{c.name}</span>
                            <div className="flex items-center gap-2 text-2xs text-slate-500">
                              {c.translations?.ru?.name && <span>RU: {c.translations.ru.name}</span>}
                              {c.translations?.zh?.name && <span>ZH: {c.translations.zh.name}</span>}
                              {c.parentName && <Badge variant="outline" className="text-2xs">Parent: {c.parentName}</Badge>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Attributes preview list */}
                    {msg.pendingAction.payload.attributes && (
                      <div className="bg-white/80 rounded-lg p-2.5 border border-amber-200/60 max-h-48 overflow-y-auto space-y-1.5 text-xs text-slate-700">
                        {msg.pendingAction.payload.attributes.map((a, i) => (
                          <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0 gap-2">
                            <span className="font-bold text-slate-900">{a.name} ({a.type})</span>
                            <div className="flex items-center gap-2 text-2xs text-slate-500">
                              {a.options && <span>Options: {a.options.slice(0, 3).join(', ')}</span>}
                              {a.translations?.ru?.name && <span>RU: {a.translations.ru.name}</span>}
                              {a.translations?.zh?.name && <span>ZH: {a.translations.zh.name}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Translations preview list */}
                    {msg.pendingAction.payload.translations && (
                      <div className="bg-white/80 rounded-lg p-2.5 border border-amber-200/60 space-y-1 text-xs text-slate-700">
                        <p>Type: <strong>{msg.pendingAction.payload.translations.type}</strong></p>
                        <p>Items to translate: <strong>{msg.pendingAction.payload.translations.itemIds.length}</strong> items</p>
                        <p>Target Languages: <strong>{msg.pendingAction.payload.translations.targetLocales.join(', ')}</strong></p>
                      </div>
                    )}

                    {/* Products preview list */}
                    {msg.pendingAction.payload.products && (
                      <div className="bg-white/80 rounded-lg p-2.5 border border-amber-200/60 max-h-56 overflow-y-auto space-y-2 text-xs text-slate-700">
                        {msg.pendingAction.payload.products.map((p, i) => (
                          <div key={i} className="flex items-start gap-2.5 py-1.5 border-b border-slate-100 last:border-0">
                            {p.images && p.images[0] ? (
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-10 h-10 object-cover rounded-md border border-slate-200 shrink-0 bg-slate-50"
                                onError={(e) => {
                                  // Fallback to placeholder if external URL is broken
                                  ;(e.target as HTMLImageElement).src = '/images/placeholder.jpg'
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-2xs text-slate-400">
                                No Pic
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-slate-900 truncate">{p.name}</span>
                                <span className="font-semibold text-emerald-600 shrink-0">${p.price}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-2xs text-slate-500">
                                {p.categoryName && (
                                  <Badge variant="outline" className="text-2xs py-0 h-4 border-slate-300">
                                    {p.categoryName}
                                  </Badge>
                                )}
                                {p.translations?.ru?.name && <span>RU: {p.translations.ru.name}</span>}
                                {p.translations?.zh?.name && <span>ZH: {p.translations.zh.name}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Interactive Confirmation Action Bar */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/80">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        onClick={handleCancelAction}
                        className="text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        {t.cancelAction}
                      </Button>
                      <Button
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleDirectExecuteAction(msg.pendingAction!)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        {t.confirmAction}
                      </Button>
                    </div>
                  </Card>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 items-center text-slate-500 text-xs py-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <span className="font-medium animate-pulse">
              {locale === 'ru' ? 'AI думает и анализирует каталог...' : locale === 'zh' ? 'AI 正在分析目录并处理...' : 'AI is analyzing catalog & thinking...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-xs space-y-2">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.inputPlaceholder}
            disabled={isLoading}
            className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
          />

          <Button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shrink-0 shadow-xs disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-1.5" />
                <span>{t.send}</span>
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between text-2xs text-slate-400 px-1">
          <span>Shift + Enter for new line • Enter to send</span>
          <span className="flex items-center gap-1 text-slate-500">
            <Info className="w-3 h-3" />
            {locale === 'ru' ? 'Подтверждение обязательно перед записью' : locale === 'zh' ? '写操作前必须经由管理员确认' : 'Confirmation required before DB write'}
          </span>
        </div>
      </div>
    </div>
  )
}
