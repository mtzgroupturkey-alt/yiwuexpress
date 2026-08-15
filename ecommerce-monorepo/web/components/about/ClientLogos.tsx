'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'

export function ClientLogos() {
  const t = useTranslations('About')
  // Placeholder logos - in production these would be actual client logos
  const clients = [
    { name: 'TechStart Solutions', logo: 'TS' },
    { name: 'Global Retail Corp', logo: 'GRC' },
    { name: 'Innovation Labs', logo: 'IL' },
    { name: 'Supply Chain Pro', logo: 'SCP' },
    { name: 'Manufacturing Plus', logo: 'M+' },
    { name: 'Trade Connect', logo: 'TC' },
    { name: 'Smart Logistics', logo: 'SL' },
    { name: 'Global Sourcing', logo: 'GS' }
  ]

  return (
    <div>
      <div className="text-center mb-8">
        <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">
          {t('clients.trustedBy')}
        </p>
      </div>
      
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
        {clients.map((client, index) => (
          <motion.div
            key={client.name}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            viewport={{ once: true }}
            className="aspect-square bg-white rounded-lg border border-gray-200 flex items-center justify-center hover:shadow-md transition-all duration-300 group"
          >
            <div className="text-center">
              <div className="text-lg font-bold text-gray-400 group-hover:text-secondary-500 transition-colors duration-300">
                {client.logo}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <p className="text-gray-500 text-sm">
          {t('clients.joinPrefix')} <span className="font-semibold text-secondary-500">15,000+ others</span> {t('clients.joinSuffix')}
        </p>
      </div>
    </div>
  )
}