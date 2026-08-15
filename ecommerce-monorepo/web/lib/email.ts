import nodemailer from 'nodemailer'
import { getCompanyName } from '@/lib/company'
import { prisma } from '@/lib/db'
import { localizeEmailTemplate } from '@/lib/utils/localize'

const FALLBACK_LOCALE = 'en'

// Create reusable transporter
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

// Email templates
const getEmailTemplate = async (type: string, data: Record<string, any>) => {
  const companyName = await getCompanyName()
  const baseStyles = `
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a3a5c; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; }
    .button { 
      display: inline-block; 
      padding: 12px 30px; 
      background: #c9a84c; 
      color: white; 
      text-decoration: none; 
      border-radius: 5px; 
      margin: 20px 0;
    }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  `

  const templates = {
    passwordReset: `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyles}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${companyName}</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hi there,</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${data.resetUrl}" class="button">Reset Password</a>
            </p>
            <p><strong>This link expires in 1 hour.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1a3a5c;">${data.resetUrl}</p>
          </div>
          <div class="footer">
            <p>${companyName} - ${companyName} & Logistics</p>
            <p>China, Zhejiang, China</p>
          </div>
        </div>
      </body>
      </html>
    `,

    orderConfirmation: `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyles}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Thank you for your order!</h2>
            <p>Hi ${data.customerName},</p>
            <p>Your order <strong>#${data.orderNumber}</strong> has been confirmed.</p>
            <h3>Order Details:</h3>
            <p><strong>Total:</strong> $${data.total}</p>
            <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
            <p style="text-align: center;">
              <a href="${data.trackingUrl}" class="button">Track Your Order</a>
            </p>
          </div>
          <div class="footer">
            <p>${companyName}</p>
          </div>
        </div>
      </body>
      </html>
    `,

    shipmentUpdate: `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyles}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Shipment Update</h1>
          </div>
          <div class="content">
            <h2>Your order is on the way!</h2>
            <p>Hi ${data.customerName},</p>
            <p>Your order <strong>#${data.orderNumber}</strong> has been shipped.</p>
            <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
            <p><strong>Carrier:</strong> ${data.carrier}</p>
            <p><strong>Status:</strong> ${data.status}</p>
            <p style="text-align: center;">
              <a href="${data.trackingUrl}" class="button">Track Shipment</a>
            </p>
          </div>
          <div class="footer">
            <p>${companyName}</p>
          </div>
        </div>
      </body>
      </html>
    `,

    welcomeEmail: `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyles}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${companyName}!</h1>
          </div>
          <div class="content">
            <h2>Account Created Successfully</h2>
            <p>Hi ${data.name},</p>
            <p>Welcome to ${companyName} - Your ${companyName} & Logistics Partner!</p>
            <p>Your account has been created successfully. You can now:</p>
            <ul>
              <li>Browse our product catalog</li>
              <li>Request quotes for shipping services</li>
              <li>Track your shipments in real-time</li>
              <li>Access wholesale pricing</li>
            </ul>
            <p style="text-align: center;">
              <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
            </p>
          </div>
          <div class="footer">
            <p>${companyName}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }

  return templates[type as keyof typeof templates] || ''
}

/**
 * Replace `{token}` placeholders in a template string with provided data values.
 * Unknown tokens are left untouched so partial data never blanks the copy.
 */
function applyPlaceholders(template: string, data: Record<string, any>): string {
  if (!template) return template
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = data?.[key]
    return value !== undefined && value !== null ? String(value) : match
  })
}

/**
 * Resolve localized email content for `type` and `locale`, falling back to the
 * canonical English template, then to the hardcoded legacy templates. Returns
 * `{ subject, html }` with all `{placeholder}` tokens already substituted.
 *
 * If `locale` is omitted or equals 'en', the canonical (legacy) columns are used
 * directly; otherwise the matching EmailTemplateTranslation row is preferred with
 * graceful fallback to 'en' via `localizeEmailTemplate`.
 */
async function resolveLocalizedEmail(
  type: string,
  locale: string,
  data: Record<string, any>
): Promise<{ subject: string; html: string }> {
  const target = String(locale || FALLBACK_LOCALE)
  try {
    const tmpl = await prisma.emailTemplate.findFirst({
      where: { type, isActive: true },
      include: { translations: true },
    })

    if (tmpl) {
      const localized = localizeEmailTemplate(tmpl, target)
      const subject = applyPlaceholders(localized.subject, data)
      const html = applyPlaceholders(localized.bodyHtml, data)
      if (html) return { subject, html }
    }
  } catch (err) {
    console.error('[email] DB template lookup failed, using legacy template:', err)
  }

  // Fallback: legacy hardcoded template (always English).
  const html = await getEmailTemplate(type, data)
  const companyName = await getCompanyName()
  const subjectMap: Record<string, string> = {
    passwordReset: `Reset Your Password - ${companyName}`,
    orderConfirmation: `Order Confirmation #${data.orderNumber} - ${companyName}`,
    shipmentUpdate: `Shipment Update - Order #${data.orderNumber}`,
    welcomeEmail: `Welcome to ${companyName}!`,
  }
  return { subject: subjectMap[type] || 'Notification', html }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, token: string, locale = FALLBACK_LOCALE) {
  const resetUrl = `${process.env.APP_URL || 'http://localhost:3001'}/reset-password?token=${token}`
  const companyName = await getCompanyName()

  const { subject, html } = await resolveLocalizedEmail('passwordReset', locale, { resetUrl, companyName })

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"${companyName}" <noreply@yiwuexpress.com>`,
      to: email,
      subject,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error }
  }
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(
  email: string,
  orderData: {
    customerName: string
    orderNumber: string
    total: number
    paymentMethod: string
    orderId: string
  },
  locale = FALLBACK_LOCALE
) {
  const trackingUrl = `${process.env.APP_URL || 'http://localhost:3001'}/orders/${orderData.orderId}`
  const companyName = await getCompanyName()

  const { subject, html } = await resolveLocalizedEmail('orderConfirmation', locale, {
    ...orderData,
    trackingUrl,
    companyName,
  })

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"${companyName}" <orders@yiwuexpress.com>`,
      to: email,
      subject,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error }
  }
}

// Send shipment update email
export async function sendShipmentUpdateEmail(
  email: string,
  shipmentData: {
    customerName: string
    orderNumber: string
    trackingNumber: string
    carrier: string
    status: string
    orderId: string
  },
  locale = FALLBACK_LOCALE
) {
  const trackingUrl = `${process.env.APP_URL || 'http://localhost:3001'}/track?number=${shipmentData.trackingNumber}`
  const companyName = await getCompanyName()

  const { subject, html } = await resolveLocalizedEmail('shipmentUpdate', locale, {
    ...shipmentData,
    trackingUrl,
    companyName,
  })

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"${companyName}" <shipping@yiwuexpress.com>`,
      to: email,
      subject,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error }
  }
}

// Send welcome email
export async function sendWelcomeEmail(
  email: string,
  userData: {
    name: string
  },
  locale = FALLBACK_LOCALE
) {
  const dashboardUrl = `${process.env.APP_URL || 'http://localhost:3001'}/dashboard`
  const companyName = await getCompanyName()

  const { subject, html } = await resolveLocalizedEmail('welcomeEmail', locale, {
    ...userData,
    dashboardUrl,
    companyName,
  })

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"${companyName}" <welcome@yiwuexpress.com>`,
      to: email,
      subject,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error }
  }
}

// Verify SMTP connection
export async function verifyEmailConnection() {
  try {
    await transporter.verify()
    return { success: true, message: 'SMTP connection verified' }
  } catch (error) {
    console.error('SMTP verification error:', error)
    return { success: false, error }
  }
}
