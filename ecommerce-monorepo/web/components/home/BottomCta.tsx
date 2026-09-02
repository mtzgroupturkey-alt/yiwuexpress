'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LocaleLink } from '@/components/LocaleLink'
import { Container } from '@/components/ui/Container'
import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export function BottomCta() {
  const t = useTranslations('Home.cta')
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-[#0f2744]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,76,0.2),transparent_65%)]" />
      <div className="absolute inset-0 bg-[url('/pattern-china.svg')] opacity-5" />

      {/* Floating Animated Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15],
          x: [0, 20, 0],
          y: [0, -20, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-20 -left-20 w-80 h-80 bg-secondary-400/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1],
          x: [0, -25, 0],
          y: [0, 25, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"
      />

      <Container maxWidth="2xl" className="relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 25 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-8 md:p-12 lg:p-16 shadow-2xl relative overflow-hidden"
          >
            {/* Top glass reflection highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <div className="text-center">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary-500/20 border border-secondary-400/30 rounded-full text-secondary-300 text-xs font-semibold mb-6 shadow-inner"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                {t('badge')}
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 tracking-tight"
              >
                {t('title1')}
                <span className="text-secondary-400 ml-2">{t('title2')}</span>
              </motion.h2>

              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-lg md:text-xl text-primary-100/90 max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
              >
                {t('subtitle')}
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <LocaleLink
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#c9a84c] to-[#deb859] hover:from-[#deb859] hover:to-[#c9a84c] text-primary-950 font-bold px-8 py-4 rounded-xl text-base md:text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-secondary-500/30 group"
                >
                  {t('browse')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </LocaleLink>
                <LocaleLink
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white hover:bg-white/10 hover:border-white font-semibold px-8 py-4 rounded-xl text-base md:text-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                >
                  {t('contact')}
                </LocaleLink>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
