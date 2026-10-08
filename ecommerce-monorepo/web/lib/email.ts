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
      from: process.env.SMTP_FROM || `"${companyName}" <noreply@dromkok.com>`,
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
      from: process.env.SMTP_FROM || `"${companyName}" <orders@dromkok.com>`,
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
      from: process.env.SMTP_FROM || `"${companyName}" <shipping@dromkok.com>`,
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
      from: process.env.SMTP_FROM || `"${companyName}" <welcome@dromkok.com>`,
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

// B2B Customer Application Received Confirmation
export async function sendB2BApplicationReceivedEmail(
  email: string,
  data: {
    contactName: string
    companyName: string
    taxId: string
  }
) {
  const companyName = await getCompanyName()
  const subject = `Your ${companyName} B2B application is under review`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #00407a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 22px;">${companyName} B2B Wholesale</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">Application Received</h2>
        <p>Dear ${data.contactName},</p>
        <p>Thank you for submitting your wholesale account application for <strong>${data.companyName}</strong> (Tax / Reg ID: ${data.taxId}).</p>
        <p>Our trade compliance and operations team will review your business credentials within <strong>24 hours</strong>.</p>
        <p>Once approved, you will receive an email confirmation and gain full access to wholesale catalog prices, commercial payment terms, and direct factory container ordering.</p>
        <p style="margin-top: 24px; font-size: 13px; color: #64748b;">If you need urgent onboarding assistance, please reply directly to this email.</p>
      </div>
    </div>
  `
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"${companyName} B2B" <b2b@dromkok.com>`,
      to: email,
      subject,
      html,
    })
    return { success: true }
  } catch (err) {
    console.warn('[Email] B2B customer confirmation email skipped/failed:', err)
    return { success: false, error: err }
  }
}

// Admin notification for new B2B Application
export async function sendAdminB2BNotificationEmail(data: {
  companyName: string
  contactName: string
  email: string
  phone: string
  taxId: string
  country: string
  userId: string
}) {
  const companyName = await getCompanyName()
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@dromkok.com'
  const appUrl = process.env.APP_URL || 'http://localhost:3001'
  const reviewUrl = `${appUrl}/admin/users?verificationStatus=PENDING`
  const subject = `[New B2B Application] ${data.companyName}`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #00407a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">New Wholesale B2B Application</h2>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
        <p>A new commercial applicant has applied for wholesale access on ${companyName}:</p>
        <ul style="line-height: 1.8;">
          <li><strong>Company:</strong> ${data.companyName}</li>
          <li><strong>Tax / Reg ID:</strong> ${data.taxId}</li>
          <li><strong>Contact:</strong> ${data.contactName} (${data.email})</li>
          <li><strong>Phone:</strong> ${data.phone}</li>
          <li><strong>Country:</strong> ${data.country}</li>
        </ul>
        <p style="text-align: center; margin: 25px 0;">
          <a href="${reviewUrl}" style="background: #F5A602; color: #020617; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block;">
            Review Application in Admin Panel
          </a>
        </p>
      </div>
    </div>
  `
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"${companyName} Alerts" <notifications@dromkok.com>`,
      to: adminEmail,
      subject,
      html,
    })
    return { success: true }
  } catch (err) {
    console.warn('[Email] Admin B2B notification email skipped/failed:', err)
    return { success: false, error: err }
  }
}

// B2B Customer Application Approved Email
export async function sendB2BApprovalEmail(params: {
  to: string
  companyName?: string | null
  locale?: string
}) {
  const companyName = await getCompanyName()
  const appUrl = process.env.APP_URL || 'http://localhost:3001'
  const targetLocale = params.locale || 'en'
  const portalUrl = `${appUrl}/${targetLocale}/business/dashboard`
  const subject = `Your Wholesale Account Has Been Approved - ${companyName}`
  const targetCompany = params.companyName || 'Valued Partner'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #00407a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 22px;">${companyName} B2B Portal</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">Application Approved!</h2>
        <p>Dear ${targetCompany},</p>
        <p>Congratulations! Your business wholesale application has been approved by our trade compliance team.</p>
        <p>Your account now has full access to:</p>
        <ul>
          <li>Tier-1 factory wholesale pricing across our entire catalog</li>
          <li>Direct container procurement (FCL / LCL) & export documentation</li>
          <li>Instant Request for Quote (RFQ) & Proforma Invoices</li>
          <li>Your dedicated China trade support manager</li>
        </ul>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}" style="background: #F5A602; color: #020617; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block;">
            Access Wholesale Dashboard
          </a>
        </p>
        <p style="font-size: 13px; color: #64748b;">If the button does not work, visit: <a href="${portalUrl}">${portalUrl}</a></p>
      </div>
    </div>
  `
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"${companyName} B2B" <b2b@dromkok.com>`,
      to: params.to,
      subject,
      html,
    })
    return { success: true }
  } catch (err) {
    console.warn('[Email] B2B approval email skipped/failed:', err)
    return { success: false, error: err }
  }
}

// B2B Customer Application Rejected Email
export async function sendB2BRejectionEmail(params: {
  to: string
  companyName?: string | null
  reason?: string | null
  locale?: string
}) {
  const companyName = await getCompanyName()
  const appUrl = process.env.APP_URL || 'http://localhost:3001'
  const targetLocale = params.locale || 'en'
  const statusUrl = `${appUrl}/${targetLocale}/business/rejected`
  const subject = `Update Regarding Your ${companyName} Wholesale Application`
  const targetCompany = params.companyName || 'Valued Applicant'
  const reasonText = params.reason || 'The uploaded commercial documentation or registration information could not be verified by our compliance team.'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #00407a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 22px;">${companyName} B2B Portal</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">Application Status Update</h2>
        <p>Dear ${targetCompany},</p>
        <p>Thank you for your interest in opening a wholesale B2B account with ${companyName}.</p>
        <p>After reviewing your submission, our trade verification team was unable to approve your application at this time.</p>
        <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: bold; color: #991b1b; font-size: 13px;">Reason from Verification Officer:</p>
          <p style="margin: 4px 0 0; color: #7f1d1d; font-size: 14px;">${reasonText}</p>
        </div>
        <p>You may submit updated or additional business registration documentation by visiting your application status page:</p>
        <p style="text-align: center; margin: 25px 0;">
          <a href="${statusUrl}" style="background: #00407a; color: white; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block;">
            View Details & Re-apply
          </a>
        </p>
        <p style="font-size: 13px; color: #64748b;">If you believe this decision was made in error, please reply to this email.</p>
      </div>
    </div>
  `
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"${companyName} B2B" <b2b@dromkok.com>`,
      to: params.to,
      subject,
      html,
    })
    return { success: true }
  } catch (err) {
    console.warn('[Email] B2B rejection email skipped/failed:', err)
    return { success: false, error: err }
  }
}

