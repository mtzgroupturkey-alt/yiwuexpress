import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'
import PDFDocument from 'pdfkit'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Verify admin authentication
async function verifyAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true }
    })

    if (user?.role !== 'ADMIN') {
      return null
    }

    return user
  } catch (error) {
    return null
  }
}

// POST /api/admin/orders/[id]/customs - Generate customs documents
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Fetch order with all details
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          include: {
            company: true
          }
        },
        shippingCountry: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    
    // Return promise that resolves when PDF is done
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    })

    // Header with company logo area
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('COMMERCIAL INVOICE', { align: 'center' })
      .moveDown(0.5)

    // Horizontal line
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke()
      .moveDown()

    // Invoice details box
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Invoice No: INV-${order.orderNumber}`, 50, doc.y)
      .text(`Invoice Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`)
      .text(`Order Number: ${order.orderNumber}`)
      .moveDown()

    // Seller/Shipper information
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('SELLER/SHIPPER:', 50, doc.y)
      .fontSize(10)
      .font('Helvetica')
      .text('YIWU EXPRESS')
      .text('Yiwu International Trade City')
      .text('Yiwu, Zhejiang Province, 322000')
      .text('China')
      .text('Phone: +86 579 8555 1234')
      .text('Email: export@yiwuexpress.com')
      .moveDown()

    // Buyer information
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('BUYER/CONSIGNEE:', 50, doc.y)
      .fontSize(10)
      .font('Helvetica')
      .text(order.customerName)
    
    if (order.companyName) {
      doc.text(order.companyName)
    }

    doc
      .text(order.shippingAddress)
      .text(`${order.shippingCity}, ${order.shippingState || ''} ${order.shippingPostalCode}`)
      .text(order.shippingCountry.name)
      .text(`Phone: ${order.customerPhone}`)
      .text(`Email: ${order.customerEmail}`)
      .moveDown()

    // Shipping information
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('SHIPPING INFORMATION:', 50, doc.y)
      .fontSize(10)
      .font('Helvetica')
      .text(`Country of Origin: China`)
      .text(`Destination: ${order.shippingCountry.name}`)
      .text(`Payment Method: ${order.paymentMethod}`)
      .text(`Shipping Terms: ${order.carrier || 'TBD'}`)
      .moveDown()

    // Items table
    const tableTop = doc.y
    const col1 = 50   // Description
    const col2 = 220  // HS Code
    const col3 = 310  // Origin
    const col4 = 380  // Qty
    const col5 = 430  // Unit Price
    const col6 = 500  // Amount

    // Table header
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('DESCRIPTION', col1, tableTop)
      .text('HS CODE', col2, tableTop)
      .text('ORIGIN', col3, tableTop)
      .text('QTY', col4, tableTop)
      .text('UNIT $', col5, tableTop)
      .text('AMOUNT $', col6, tableTop)

    // Draw header line
    doc
      .moveTo(col1, tableTop + 15)
      .lineTo(545, tableTop + 15)
      .stroke()

    let currentY = tableTop + 25

    // Table rows
    order.items.forEach((item) => {
      const product = item.product
      const hsCode = product?.hsCode || 'N/A'
      const origin = product?.countryOfOrigin || 'China'

      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage()
        currentY = 50
      }

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(item.productName.substring(0, 30), col1, currentY, { width: 160 })
        .text(hsCode, col2, currentY)
        .text(origin, col3, currentY)
        .text(item.quantity.toString(), col4, currentY)
        .text(item.price.toFixed(2), col5, currentY)
        .text((item.price * item.quantity).toFixed(2), col6, currentY)

      currentY += 30
    })

    // Draw footer line
    doc
      .moveTo(col1, currentY)
      .lineTo(545, currentY)
      .stroke()
      .moveDown()

    currentY += 10

    // Totals
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('SUBTOTAL:', 380, currentY)
      .text(`$${order.subtotal.toFixed(2)}`, 500, currentY, { align: 'right' })

    currentY += 20
    doc
      .font('Helvetica')
      .text('SHIPPING & HANDLING:', 380, currentY)
      .text(`$${order.shippingFee.toFixed(2)}`, 500, currentY, { align: 'right' })

    if (order.tax > 0) {
      currentY += 20
      doc
        .text('TAX:', 380, currentY)
        .text(`$${order.tax.toFixed(2)}`, 500, currentY, { align: 'right' })
    }

    if (order.discount > 0) {
      currentY += 20
      doc
        .text('DISCOUNT:', 380, currentY)
        .text(`-$${order.discount.toFixed(2)}`, 500, currentY, { align: 'right' })
    }

    // Draw total line
    currentY += 15
    doc
      .moveTo(380, currentY)
      .lineTo(545, currentY)
      .stroke()

    currentY += 10
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('TOTAL AMOUNT:', 380, currentY)
      .text(`$${order.total.toFixed(2)}`, 500, currentY, { align: 'right' })

    // Declaration
    currentY += 40
    if (currentY > 700) {
      doc.addPage()
      currentY = 50
    }

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('DECLARATION:', 50, currentY)
      .fontSize(9)
      .font('Helvetica')
      .text(
        'I hereby certify that the information on this invoice is true and correct, ' +
        'and that the goods described herein are of the origin stated above.',
        50,
        currentY + 20,
        { width: 495, align: 'justify' }
      )

    // Signature area
    currentY = doc.y + 40
    doc
      .fontSize(10)
      .text('_____________________________', 50, currentY)
      .text('_____________________________', 350, currentY)
      .fontSize(9)
      .text('Authorized Signature', 50, currentY + 20)
      .text('Date', 350, currentY + 20)

    // Footer
    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        'YIWU EXPRESS | Yiwu International Trade City, Zhejiang, China | +86 579 8555 1234 | www.yiwuexpress.com',
        50,
        750,
        { align: 'center', width: 495 }
      )

    // Finalize PDF
    doc.end()

    // Wait for PDF to be generated
    const pdfBuffer = await pdfPromise

    // Update order with customs docs info
    await prisma.order.update({
      where: { id },
      data: {
        customsDocs: {
          commercialInvoice: `invoice-${order.orderNumber}.pdf`,
          generatedAt: new Date().toISOString()
        }
      }
    })

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="commercial-invoice-${order.orderNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Generate customs documents error:', error)
    return NextResponse.json(
      { error: 'Failed to generate customs documents' },
      { status: 500 }
    )
  }
}
