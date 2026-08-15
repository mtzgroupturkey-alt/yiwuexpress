/**
 * Phase 3 backfill: seed `en` translation rows from legacy flat text columns for
 * Countries, Suppliers, System Settings, and create the canonical EmailTemplate
 * rows (+ `en` EmailTemplateTranslation) from the hardcoded templates in lib/email.ts.
 *
 * Idempotent: uses upsert on the unique (parentId, locale) / (parentId, locale, key)
 * / (type) constraints so it is safe to re-run.
 */
import { prisma } from '../lib/db'

const EN = 'en'

async function backfillCountries() {
  const countries = await prisma.country.findMany()
  let created = 0
  for (const c of countries) {
    const existing = await prisma.countryTranslation.findUnique({
      where: { countryId_locale: { countryId: c.id, locale: EN } },
    })
    if (!existing && c.name?.trim()) {
      await prisma.countryTranslation.create({
        data: { countryId: c.id, locale: EN, name: c.name },
      })
      created++
    }
  }
  console.log(`Countries: ${countries.length} found, ${created} en translations seeded`)
}

async function backfillSuppliers() {
  const suppliers = await prisma.supplier.findMany()
  let created = 0
  for (const s of suppliers) {
    const existing = await prisma.supplierTranslation.findUnique({
      where: { supplierId_locale: { supplierId: s.id, locale: EN } },
    })
    if (!existing && (s.name?.trim() || s.notes?.trim())) {
      await prisma.supplierTranslation.create({
        data: {
          supplierId: s.id,
          locale: EN,
          name: s.name || '',
          description: s.notes || null,
          profileText: null,
        },
      })
      created++
    }
  }
  console.log(`Suppliers: ${suppliers.length} found, ${created} en translations seeded`)
}

async function backfillSystemSettings() {
  const settings = await prisma.systemSettings.findFirst()
  if (!settings) {
    console.log('SystemSettings: no row found, skipping')
    return
  }
  const keysToBackfill: Array<{ key: string; value: string | null }> = [
    { key: 'companyName', value: settings.companyName },
    { key: 'companyDescription', value: settings.companyDescription },
    { key: 'companyAddress', value: settings.companyAddress },
  ]
  let created = 0
  for (const { key, value } of keysToBackfill) {
    if (!value?.trim()) continue
    const existing = await prisma.systemSettingTranslation.findUnique({
      where: { systemSettingId_locale_key: { systemSettingId: settings.id, locale: EN, key } },
    })
    if (!existing) {
      await prisma.systemSettingTranslation.create({
        data: { systemSettingId: settings.id, locale: EN, key, value },
      })
      created++
    }
  }
  console.log(`SystemSettings: ${keysToBackfill.length} keys checked, ${created} en translations seeded`)
}

// Canonical English email templates (placeholders replaced at send time by the
// mailer). Keep in sync with lib/email.ts subject lines.
const EMAIL_TEMPLATES: Array<{
  type: string
  name: string
  subject: string
  bodyHtml: string
  bodyText: string
}> = [
  {
    type: 'passwordReset',
    name: 'Password Reset',
    subject: 'Reset Your Password - {companyName}',
    bodyHtml: `<h2>Reset Your Password</h2><p>Hi there,</p><p>We received a request to reset your password. Click the button below to create a new password:</p><p><a href="{resetUrl}">Reset Password</a></p><p><strong>This link expires in 1 hour.</strong></p><p>If you didn't request a password reset, you can safely ignore this email.</p><p>Or copy and paste this link: {resetUrl}</p>`,
    bodyText: 'Reset Your Password\n\nHi there,\nWe received a request to reset your password. Use this link (expires in 1 hour): {resetUrl}',
  },
  {
    type: 'orderConfirmation',
    name: 'Order Confirmation',
    subject: 'Order Confirmation #{orderNumber} - {companyName}',
    bodyHtml: `<h2>Thank you for your order!</h2><p>Hi {customerName},</p><p>Your order <strong>#{orderNumber}</strong> has been confirmed.</p><h3>Order Details:</h3><p><strong>Total:</strong> {total}</p><p><strong>Payment Method:</strong> {paymentMethod}</p><p><a href="{trackingUrl}">Track Your Order</a></p>`,
    bodyText: 'Thank you for your order!\nHi {customerName},\nYour order #{orderNumber} has been confirmed.\nTotal: {total}\nPayment Method: {paymentMethod}',
  },
  {
    type: 'shipmentUpdate',
    name: 'Shipment Update',
    subject: 'Shipment Update - Order #{orderNumber}',
    bodyHtml: `<h2>Your order is on the way!</h2><p>Hi {customerName},</p><p>Your order <strong>#{orderNumber}</strong> has been shipped.</p><p><strong>Tracking Number:</strong> {trackingNumber}</p><p><strong>Carrier:</strong> {carrier}</p><p><strong>Status:</strong> {status}</p><p><a href="{trackingUrl}">Track Shipment</a></p>`,
    bodyText: 'Your order is on the way!\nHi {customerName},\nOrder #{orderNumber} has been shipped.\nTracking: {trackingNumber}\nCarrier: {carrier}\nStatus: {status}',
  },
  {
    type: 'welcomeEmail',
    name: 'Welcome Email',
    subject: 'Welcome to {companyName}!',
    bodyHtml: `<h2>Account Created Successfully</h2><p>Hi {name},</p><p>Welcome to {companyName} - Your {companyName} & Logistics Partner!</p><p>Your account has been created successfully.</p><p><a href="{dashboardUrl}">Go to Dashboard</a></p>`,
    bodyText: 'Welcome to {companyName}!\nHi {name},\nYour account has been created successfully.',
  },
]

async function backfillEmailTemplates() {
  let created = 0
  for (const t of EMAIL_TEMPLATES) {
    const existing = await prisma.emailTemplate.findUnique({ where: { type: t.type } })
    if (!existing) {
      await prisma.emailTemplate.create({
        data: {
          type: t.type,
          name: t.name,
          subject: t.subject,
          bodyHtml: t.bodyHtml,
          bodyText: t.bodyText,
          isActive: true,
          translations: {
            create: [
              {
                locale: EN,
                subject: t.subject,
                bodyHtml: t.bodyHtml,
                bodyText: t.bodyText,
              },
            ],
          },
        },
      })
      created++
    }
  }
  console.log(`EmailTemplates: ${EMAIL_TEMPLATES.length} canonical templates, ${created} created`)
}

async function main() {
  console.log('--- Phase 3 backfill start ---')
  await backfillCountries()
  await backfillSuppliers()
  await backfillSystemSettings()
  await backfillEmailTemplates()
  console.log('--- Phase 3 backfill complete ---')
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
