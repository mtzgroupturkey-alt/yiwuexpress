export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createAuthErrorResponse } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendOrderConfirmationEmail } from '@/lib/email'

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || ''
const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  const data = await response.json()
  return data.access_token
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const { paypalOrderId, orderId } = await req.json()

    if (!paypalOrderId || !orderId) {
      return NextResponse.json(
        { success: false, error: 'PayPal order ID and order ID are required' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: user.id },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    const accessToken = await getPayPalAccessToken()

    const captureResponse = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const captureData = await captureResponse.json()

    if (!captureResponse.ok || captureData.status !== 'COMPLETED') {
      console.error('[PAYPAL CAPTURE] Error:', captureData)
      return NextResponse.json(
        { success: false, error: 'Failed to capture PayPal payment or payment not completed' },
        { status: 400 }
      )
    }

    // 1. Verify purchase_unit reference_id matches this order if provided
    const purchaseUnit = captureData.purchase_units?.[0]
    if (purchaseUnit?.reference_id && purchaseUnit.reference_id !== order.id) {
      console.error(`[PAYPAL FRAUD] Reference ID mismatch. Expected: ${order.id}, Received: ${purchaseUnit.reference_id}`)
      return NextResponse.json(
        { success: false, error: 'Payment reference mismatch. Transaction blocked.' },
        { status: 400 }
      )
    }

    // 2. Validate captured amount matches order total
    const capture = purchaseUnit?.payments?.captures?.[0]
    if (!capture || capture.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Payment capture was not completed by provider' },
        { status: 400 }
      )
    }

    const capturedAmount = parseFloat(capture.amount?.value || '0')
    const expectedAmount = parseFloat(order.total.toFixed(2))

    if (Math.abs(capturedAmount - expectedAmount) > 0.01) {
      console.error(`[PAYPAL FRAUD] Amount mismatch! Order: ${expectedAmount}, Captured: ${capturedAmount}`)
      return NextResponse.json(
        { success: false, error: 'Captured payment amount does not match order total. Transaction flagged for review.' },
        { status: 400 }
      )
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        paidAt: new Date(),
        status: order.status === 'PENDING' ? 'PAID' : order.status,
        customerCarrierNotes: `PayPal Capture ID: ${capture.id}`,
      },
    })

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'ORDER_PAID',
        title: 'Payment Received',
        message: `Payment for order #${order.orderNumber} has been received successfully.`,
        data: { orderId: order.id, orderNumber: order.orderNumber },
      },
    })

    try {
      await sendOrderConfirmationEmail(order.customerEmail, {
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        total: order.total,
        paymentMethod: 'PayPal',
        orderId: order.id,
      })
    } catch (emailErr) {
      console.error('[PAYPAL CAPTURE] Failed to send confirmation email:', emailErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment captured successfully',
      captureData,
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return createAuthErrorResponse(error)
    }
    console.error('[PAYPAL CAPTURE] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to capture payment' },
      { status: 500 }
    )
  }
}
