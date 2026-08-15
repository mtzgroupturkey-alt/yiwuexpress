export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { buildEmailTemplateTranslations } from '@/lib/utils/translation-builders'

// GET /api/admin/email-templates - List all email templates
export async function GET() {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { type: 'asc' },
      include: { translations: true },
    })
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 })
  }
}

// POST /api/admin/email-templates - Create a new email template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.type || !body.name || !body.subject || !body.bodyHtml) {
      return NextResponse.json(
        { error: 'type, name, subject and bodyHtml are required' },
        { status: 400 }
      )
    }

    const existing = await prisma.emailTemplate.findUnique({ where: { type: body.type } })
    if (existing) {
      return NextResponse.json(
        { error: `Email template with type "${body.type}" already exists` },
        { status: 400 }
      )
    }

    const template = await prisma.emailTemplate.create({
      data: {
        type: body.type,
        name: body.name,
        subject: body.subject,
        bodyHtml: body.bodyHtml,
        bodyText: body.bodyText || null,
        isActive: body.isActive ?? true,
        translations: buildEmailTemplateTranslations(body),
      },
      include: { translations: true },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error creating email template:', error)
    return NextResponse.json({ error: 'Failed to create email template' }, { status: 500 })
  }
}
