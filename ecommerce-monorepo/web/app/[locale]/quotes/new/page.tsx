'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import QuotesPage from '../page'

export default function NewQuoteRedirectPage() {
  // QuotesPage already contains the full interactive quote request form and accepts query params
  return <QuotesPage />
}
