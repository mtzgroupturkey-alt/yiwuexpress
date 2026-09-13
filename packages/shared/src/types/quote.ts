export type QuoteStatus = 'PENDING' | 'UNDER_REVIEW' | 'QUOTED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

export interface WholesaleQuoteItem {
  productId: string
  name: string
  sku: string
  quantity: number
  targetPrice?: number
  quotedPrice?: number
  notes?: string
}

export interface WholesaleQuote {
  id: string
  inquiryNumber: string
  userId: string
  companyName: string
  businessType: string
  country: string
  products: WholesaleQuoteItem[]
  paymentTerms: string
  shippingTerms: string
  preferredShipping: string
  targetPrice?: number | null
  estimatedOrderValue?: number | null
  quotedPrice?: number | null
  status: QuoteStatus
  quoteNotes?: string | null
  createdAt: string | Date
  updatedAt: string | Date
}
