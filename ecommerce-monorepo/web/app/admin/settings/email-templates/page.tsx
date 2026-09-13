'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LocalizedFieldsForm, translationsArrayToInitial, TranslationRow } from '@/components/admin/LocalizedFieldsForm'
import { toast } from 'react-hot-toast'
import { Plus, Pencil, Trash2, Mail } from 'lucide-react'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'

interface EmailTemplateData {
  id: string
  type: string
  name: string
  subject: string
  bodyHtml: string
  bodyText?: string | null
  isActive: boolean
  translations?: Array<{ locale: string; subject?: string | null; bodyHtml?: string | null; bodyText?: string | null }>
}

export default function EmailTemplatesPage() {
  const { dict } = useAdminLocale()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EmailTemplateData | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{ templates: EmailTemplateData[] }>({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const res = await fetch('/api/admin/email-templates')
      if (!res.ok) throw new Error(dict.settings.templateSaveFailed)
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const isEdit = !!editing
      const res = await fetch(
        isEdit ? `/api/admin/email-templates/${editing!.id}` : '/api/admin/email-templates',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || dict.settings.templateSaveFailed)
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      toast.success(dict.settings.templateSavedSuccess)
      setIsDialogOpen(false)
      setEditing(null)
    },
    onError: (err: any) => {
      toast.error(err.message || dict.settings.templateSaveFailed)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/email-templates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(dict.settings.templateDeleteFailed)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      toast.success(dict.settings.templateDeletedSuccess)
    },
    onError: () => {
      toast.error(dict.settings.templateDeleteFailed)
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1a3a5c]">{dict.settings.emailTemplates}</h1>
          <p className="text-gray-500 mt-1">{dict.settings.emailTemplatesSubtitle}</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setIsDialogOpen(true)
          }}
          className="bg-[#1a3a5c] hover:bg-[#1a3a5c]/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          {dict.settings.newTemplate}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dict.settings.allEmailTemplates}</CardTitle>
          <CardDescription>{dict.settings.emailTemplatesHelp}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-[#1a3a5c] rounded-full animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dict.settings.templateType}</TableHead>
                  <TableHead>{dict.common.name}</TableHead>
                  <TableHead>{dict.settings.templateSubject}</TableHead>
                  <TableHead>{dict.common.status}</TableHead>
                  <TableHead>{dict.settings.templateTranslations}</TableHead>
                  <TableHead className="text-right">{dict.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.templates && data.templates.length > 0 ? (
                  data.templates.map((tpl) => (
                    <TableRow key={tpl.id}>
                      <TableCell className="font-mono text-xs">{tpl.type}</TableCell>
                      <TableCell className="font-medium">{tpl.name}</TableCell>
                      <TableCell>{tpl.subject}</TableCell>
                      <TableCell>
                        <Badge variant={tpl.isActive ? 'default' : 'secondary'}>
                          {tpl.isActive ? dict.common.active : dict.common.inactive}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(tpl.translations || [])
                          .filter((tr) => tr.locale !== 'en')
                          .map((tr) => tr.locale.toUpperCase())
                          .join(', ') || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(tpl)
                            setIsDialogOpen(true)
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(dict.settings.deleteTemplateConfirm.replace('{name}', tpl.name))) {
                              deleteMutation.mutate(tpl.id)
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      {dict.settings.noEmailTemplatesFound}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? dict.settings.editTemplate : dict.settings.newTemplateTitle}</DialogTitle>
            <DialogDescription>
              {editing ? dict.settings.editTemplateDesc : dict.settings.newTemplateDesc}
            </DialogDescription>
          </DialogHeader>
          <EmailTemplateForm
            dict={dict}
            initialData={editing}
            onSave={(payload) => saveMutation.mutate(payload)}
            onCancel={() => {
              setIsDialogOpen(false)
              setEditing(null)
            }}
            isSubmitting={saveMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmailTemplateForm({
  initialData,
  onSave,
  onCancel,
  isSubmitting,
  dict,
}: {
  initialData: EmailTemplateData | null
  onSave: (data: any) => void
  onCancel: () => void
  isSubmitting: boolean
  dict: any
}) {
  const [type, setType] = useState(initialData?.type || '')
  const [name, setName] = useState(initialData?.name || '')
  const [subject, setSubject] = useState(initialData?.subject || '')
  const [bodyHtml, setBodyHtml] = useState(initialData?.bodyHtml || '')
  const [bodyText, setBodyText] = useState(initialData?.bodyText || '')
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true)
  const [translations, setTranslations] = useState<TranslationRow[]>(
    translationsArrayToInitial(
      (initialData?.translations || [])
        .filter((t) => t.locale !== 'en')
        .map((t) => ({
          locale: t.locale,
          subject: t.subject || '',
          bodyHtml: t.bodyHtml || '',
          bodyText: t.bodyText || '',
        }))
    )
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      type,
      name,
      subject,
      bodyHtml,
      bodyText,
      isActive,
      translations: [
        { locale: 'en', subject, bodyHtml, bodyText },
        ...translations,
      ],
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">{dict.settings.templateType} *</Label>
          <Input
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="orderConfirmation"
            disabled={!!initialData}
            required
          />
        </div>
        <div>
          <Label htmlFor="name">{dict.common.name} *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Order Confirmation"
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4"
        />
        <Label htmlFor="isActive">{dict.common.active}</Label>
      </div>

      <div>
        <Label htmlFor="subject">{dict.settings.templateSubject} *</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="bodyHtml">{dict.settings.htmlBodyEn} *</Label>
        <Textarea
          id="bodyHtml"
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
          rows={6}
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          {dict.settings.placeholdersHelp}
        </p>
      </div>

      <div>
        <Label htmlFor="bodyText">{dict.settings.textBodyEn}</Label>
        <Textarea
          id="bodyText"
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <Label className="mb-2 block">{dict.suppliers.localizedFields}</Label>
        <LocalizedFieldsForm
          fields={[
            { key: 'subject', label: dict.settings.templateSubject },
            { key: 'bodyHtml', label: dict.settings.htmlBodyEn, textarea: true },
            { key: 'bodyText', label: dict.settings.textBodyEn, textarea: true },
          ]}
          initialValues={translations}
          onChange={setTranslations}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {dict.common.cancel}
        </Button>
        <Button type="submit" className="bg-[#1a3a5c]" disabled={isSubmitting}>
          {isSubmitting ? dict.common.saving : dict.settings.saveTemplate}
        </Button>
      </DialogFooter>
    </form>
  )
}
