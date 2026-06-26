import nodemailer from 'nodemailer'

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
const getEmailTemplate = (type: string, data: Record<string, any>) => {
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
            <h1>YIWU EXPRESS</h1>
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
            <p>YIWU EXPRESS - Global Trade & Logistics</p>
            <p>Yiwu International Trade City, Zhejiang, China</p>
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
            <p>YIWU EXPRESS</p>
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
            <p>YIWU EXPRESS</p>
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
            <h1>Welcome to YIWU EXPRESS!</h1>
          </div>
          <div class="content">
            <h2>Account Created Successfully</h2>
            <p>Hi ${data.name},</p>
            <p>Welcome to YIWU EXPRESS - Your Global Trade & Logistics Partner!</p>
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
            <p>YIWU EXPRESS</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }

  return templates[type as keyof typeof templates] || ''
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.APP_URL || 'http://localhost:3001'}/reset-password?token=${token}`

  const html = getEmailTemplate('passwordReset', { resetUrl })

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"YIWU EXPRESS" <noreply@yiwuexpress.com>',
      to: email,
      subject: 'Reset Your Password - YIWU EXPRESS',
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
  }
) {
  const trackingUrl = `${process.env.APP_URL || 'http://localhost:3001'}/orders/${orderData.orderId}`

  const html = getEmailTemplate('orderConfirmation', {
    ...orderData,
    trackingUrl,
  })

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"YIWU EXPRESS" <orders@yiwuexpress.com>',
      to: email,
      subject: `Order Confirmation #${orderData.orderNumber} - YIWU EXPRESS`,
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
  }
) {
  const trackingUrl = `${process.env.APP_URL || 'http://localhost:3001'}/track?number=${shipmentData.trackingNumber}`

  const html = getEmailTemplate('shipmentUpdate', {
    ...shipmentData,
    trackingUrl,
  })

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"YIWU EXPRESS" <shipping@yiwuexpress.com>',
      to: email,
      subject: `Shipment Update - Order #${shipmentData.orderNumber}`,
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
  }
) {
  const dashboardUrl = `${process.env.APP_URL || 'http://localhost:3001'}/dashboard`

  const html = getEmailTemplate('welcomeEmail', {
    ...userData,
    dashboardUrl,
  })

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"YIWU EXPRESS" <welcome@yiwuexpress.com>',
      to: email,
      subject: 'Welcome to YIWU EXPRESS!',
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
