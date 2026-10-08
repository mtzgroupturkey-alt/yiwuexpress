export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { sendOrderConfirmationEmail } from '@/lib/email'
import { restoreOrderInventory } from '@/lib/inventory/order-restoration'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[STRIPE WEBHOOK] Invalid signature:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = paymentIntent.metadata.orderId

        if (!orderId) break

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { user: true },
        })

        if (!order) {
          console.error(`[STRIPE WEBHOOK] Order not found: ${orderId}`)
          break
        }

        // Replay guard: If order is already PAID, skip duplicate email and notifications
        if (order.paymentStatus === 'PAID') {
          console.info(`[STRIPE WEBHOOK] Order ${orderId} already marked PAID. Replay safely ignored.`)
          break
        }

        const shouldAdvanceStatus = order.status === 'PENDING' || order.status === 'PAYMENT_PENDING'

        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'PAID',
            paidAt: order.paidAt || new Date(),
            status: shouldAdvanceStatus ? 'PAID' : order.status,
          },
        })

        await prisma.notification.create({
          data: {
            userId: order.userId,
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
            paymentMethod: 'Credit Card (Stripe)',
            orderId: order.id,
          })
        } catch (emailErr) {
          console.error('[STRIPE WEBHOOK] Failed to send confirmation email:', emailErr)
        }

        await prisma.emailLog.create({
          data: {
            orderId: order.id,
            userId: order.userId,
            recipient: order.customerEmail,
            subject: `Order Confirmation #${order.orderNumber} - Global Trade`,
            template: 'orderConfirmation',
            content: `Payment confirmed for order #${order.orderNumber}`,
            status: 'SENT',
            sentAt: new Date(),
          },
        }).catch((err) => console.error('[STRIPE WEBHOOK] Failed to log email:', err))

        break
      }

      case 'payment_intent.payment_failed': {
        const failedIntent = event.data.object as Stripe.PaymentIntent
        const failedOrderId = failedIntent.metadata?.orderId

        if (!failedOrderId) break

        console.error(`[STRIPE WEBHOOK] Payment failed for order: ${failedOrderId}`)

        await prisma.$transaction(async (tx) => {
          const order = await tx.order.findUnique({
            where: { id: failedOrderId },
            include: { items: true },
          })

          if (!order) {
            console.error(`[STRIPE WEBHOOK] Order not found for failed payment: ${failedOrderId}`)
            return
          }

          // Idempotency guard: If order is already in FAILED or CANCELLED state, or if payment was already PAID, skip
          if (order.status === 'FAILED' || order.status === 'CANCELLED' || order.paymentStatus === 'PAID') {
            console.info(`[STRIPE WEBHOOK] Order ${failedOrderId} already in terminal/paid state (${order.status}/${order.paymentStatus}). Skipping restock.`)
            return
          }

          // Restore inventory atomically
          await restoreOrderInventory(tx, order.id, {
            reason: 'PAYMENT_FAILED',
            notes: `Stripe payment failed: ${failedIntent.last_payment_error?.message || 'Payment intent failed'}`,
          })

          // Update order status to FAILED and paymentStatus to FAILED
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'FAILED',
              paymentStatus: 'FAILED',
              hasException: true,
              exceptionType: 'PAYMENT_FAILED',
              exceptionNotes: `Stripe PaymentIntent failed: ${failedIntent.last_payment_error?.message || 'Payment failed'}`,
              adminNotes: (order.adminNotes ? order.adminNotes + '\n' : '') +
                `[${new Date().toISOString()}] Payment failed via Stripe: ${failedIntent.last_payment_error?.message || 'Payment failed'}. Inventory restored.`,
            },
          })
        })

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[STRIPE WEBHOOK] Error processing event:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
