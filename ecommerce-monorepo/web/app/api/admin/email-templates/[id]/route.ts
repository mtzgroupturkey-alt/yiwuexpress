export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/admin/email-templates/[id] - Get single email template
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { id: params.id },
      include: { translations: true },
    })
    if (!template) {
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 })
    }
    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching email template:', error)
    return NextResponse.json({ error: 'Failed to fetch email template' }, { status: 500 })
  }
}

// PUT /api/admin/email-templates/[id] - Update email template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const existing = await prisma.emailTemplate.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 })
    }

    // Update canonical (English) columns — these are the fallback source of truth.
    const template = await prisma.emailTemplate.update({
      where: { id: params.id },
      data: {
        name: body.name ?? existing.name,
        subject: body.subject ?? existing.subject,
        bodyHtml: body.bodyHtml ?? existing.bodyHtml,
        bodyText: body.bodyText !== undefined ? body.bodyText : existing.bodyText,
        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
      },
    })

    // Dual-write: upsert per-locale translation rows.
    if (Array.isArray(body.translations)) {
      await prisma.$transaction(
        body.translations
          .filter((t: any) => t && t.locale && (t.subject ?? '').trim() && (t.bodyHtml ?? '').trim())
          .map((t: any) =>
            prisma.emailTemplateTranslation.upsert({
              where: {
                emailTemplateId_locale: { emailTemplateId: params.id, locale: t.locale },
              },
              create: {
                emailTemplateId: params.id,
                locale: t.locale,
                subject: t.subject.trim(),
                bodyHtml: t.bodyHtml.trim(),
                bodyText: (t.bodyText ?? '').trim() || null,
              },
              update: {
                subject: t.subject.trim(),
                bodyHtml: t.bodyHtml.trim(),
                bodyText: (t.bodyText ?? '').trim() || null,
              },
            })
          )
      )
      // Keep the canonical English columns in sync with the submitted `en` row.
      const en = body.translations.find(
        (t: any) => t.locale === 'en' && (t.subject ?? '').trim() && (t.bodyHtml ?? '').trim()
      )
      if (en) {
        await prisma.emailTemplate.update({
          where: { id: params.id },
          data: {
            subject: en.subject.trim(),
            bodyHtml: en.bodyHtml.trim(),
            bodyText: (en.bodyText ?? '').trim() || null,
          },
        })
      }
    }

    const withTranslations = await prisma.emailTemplate.findUnique({
      where: { id: params.id },
      include: { translations: true },
    })

    return NextResponse.json({ template: withTranslations })
  } catch (error) {
    console.error('Error updating email template:', error)
    return NextResponse.json({ error: 'Failed to update email template' }, { status: 500 })
  }
}

// DELETE /api/admin/email-templates/[id] - Delete email template
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.emailTemplate.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Email template deleted successfully' })
  } catch (error) {
    console.error('Error deleting email template:', error)
    return NextResponse.json({ error: 'Failed to delete email template' }, { status: 500 })
  }
}
