export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { getPageContent } from '@/lib/contentPages'
import { getCompanyName } from '@/lib/company'
import { BusinessRegisterView } from '@/components/business/BusinessRegisterView'

export async function generateMetadata({
  params
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const content = await getPageContent('register-b2b', params.locale)
  const companyName = await getCompanyName()

  return {
    title: content.metaTitle || `${content.title} | ${companyName}`,
    description: content.metaDesc || content.subtitle,
    openGraph: {
      title: content.metaTitle || `${content.title} | ${companyName}`,
      description: content.metaDesc || content.subtitle,
    }
  }
}

export default async function RegisterB2BPage({
  params
}: {
  params: { locale: string }
}) {
  const content = await getPageContent('register-b2b', params.locale)

  return <BusinessRegisterView initialContent={content} />
}
