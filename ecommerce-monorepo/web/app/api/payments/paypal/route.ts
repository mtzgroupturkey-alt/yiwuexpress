import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createAuthErrorResponse } from '@/lib/auth'
import { prisma } from '@/lib/db'

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
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
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

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Order is already paid' },
        { status: 400 }
      )
    }

    const accessToken = await getPayPalAccessToken()

    const paypalOrder = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: order.id,
            description: `Order #${order.orderNumber}`,
            amount: {
              currency_code: (order.currency || 'USD').toUpperCase(),
              value: order.total.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: 'YIWU EXPRESS',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${process.env.APP_URL || 'http://localhost:3001'}/orders/${order.id}?paypal=success`,
          cancel_url: `${process.env.APP_URL || 'http://localhost:3001'}/orders/${order.id}?paypal=cancel`,
        },
      }),
    })

    const paypalData = await paypalOrder.json()

    if (!paypalOrder.ok) {
      console.error('[PAYPAL] Error creating order:', paypalData)
      return NextResponse.json(
        { success: false, error: 'Failed to create PayPal order' },
        { status: 500 }
      )
    }

    const approvalUrl = paypalData.links?.find(
      (link: any) => link.rel === 'approve'
    )?.href

    return NextResponse.json({
      success: true,
      paypalOrderId: paypalData.id,
      approvalUrl,
      status: paypalData.status,
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return createAuthErrorResponse(error)
    }
    console.error('[PAYPAL] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create PayPal payment' },
      { status: 500 }
    )
  }
}
