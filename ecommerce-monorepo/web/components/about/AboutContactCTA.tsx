'use client'

import { useTranslations } from 'next-intl'
import { useSettings } from '@/components/SettingsProvider'
import { LocaleLink } from '@/components/LocaleLink'

export function AboutContactCTA() {
  const t = useTranslations('About')
  const { settings } = useSettings()

  const email = settings?.companyEmail || 'hello@yiwuexpress.com'
  const phone = settings?.companyPhone || '+86 571 8512 7890'

  return (
    <div className="mt-10 pt-8 border-t border-white/10">
      <p className="text-white/60 text-sm mb-4">{t('cta.questions')}</p>
      <div className="flex flex-col sm:flex-row gap-6 justify-center text-sm">
        <LocaleLink href={`mailto:${email}`} className="text-white/80 hover:text-white transition-colors">
          {email}
        </LocaleLink>
        <LocaleLink href={`tel:${phone.replace(/\s+/g, '')}`} className="text-white/80 hover:text-white transition-colors">
          {phone}
        </LocaleLink>
        <LocaleLink href="/contact" className="text-secondary-300 hover:text-secondary-200 transition-colors">
          {t('cta.scheduleCall')}
        </LocaleLink>
      </div>
    </div>
  )
}
