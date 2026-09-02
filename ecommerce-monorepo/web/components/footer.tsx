'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Truck, Mail, Phone, MapPin, Shield } from 'lucide-react'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { LocaleLink } from '@/components/LocaleLink'
import { GlobeInteractive } from '@/components/ui/cobe-globe-interactive'

// Brand SVG icons (lucide-react does not ship brand logos)
const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.9h-2.34V22c4.78-.79 8.43-4.94 8.43-9.94Z" />
  </svg>
)

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.16 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  </svg>
)

const LinkedInIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.8 0 0 .78 0 1.74v20.52C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.74C24 .78 23.2 0 22.22 0Z" />
  </svg>
)

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.62c-3.14 0-3.51.01-4.75.07-.98.04-1.51.21-1.86.35-.47.18-.8.4-1.15.75-.35.35-.57.68-.75 1.15-.14.35-.31.88-.35 1.86-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.04.98.21 1.51.35 1.86.18.47.4.8.75 1.15.35.35.68.57 1.15.75.35.14.88.31 1.86.35 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c.98-.04 1.51-.21 1.86-.35.47-.18.8-.4 1.15-.75.35-.35.57-.68.75-1.15.14-.35.31-.88.35-1.86.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.04-.98-.21-1.51-.35-1.86a3.1 3.1 0 0 0-.75-1.15 3.1 3.1 0 0 0-1.15-.75c-.35-.14-.88-.31-1.86-.35-1.24-.06-1.61-.07-4.75-.07Zm0 2.76a5.46 5.46 0 1 1 0 10.92 5.46 5.46 0 0 1 0-10.92Zm0 9.02a3.56 3.56 0 1 0 0-7.12 3.56 3.56 0 0 0 0 7.12Zm6.93-9.24a1.28 1.28 0 1 1-2.56 0 1.28 1.28 0 0 1 2.56 0Z" />
  </svg>
)

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.21 5.1 4.5.71.31 1.27.49 1.7.63.71.23 1.36.2 1.88.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Zm-5.47 7.87c-2.53 0-4.9-.97-6.68-2.74L3.4 19.6l1.92-3.18a8.46 8.46 0 0 1-1.3-4.46c0-4.68 3.81-8.49 8.5-8.49 2.27 0 4.4.88 6 2.49a8.46 8.46 0 0 1 2.49 6 8.49 8.49 0 0 1-8.51 8.49Z" />
  </svg>
)

const WeChatIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M8.69 3C4.35 3 1 5.86 1 9.36c0 1.94 1.03 3.66 2.65 4.82L3 16.94l2.45-1.27c.78.2 1.6.31 2.45.31.27 0 .53-.01.79-.04a5.6 5.6 0 0 1-.34-1.96c0-3.26 3.04-5.9 6.78-5.9.24 0 .48.01.71.04C15.54 5.3 12.4 3 8.69 3Zm-2.5 3.2c.6 0 1.08.48 1.08 1.08 0 .59-.49 1.07-1.08 1.07-.6 0-1.08-.48-1.08-1.07 0-.6.48-1.08 1.08-1.08Zm5 0c.6 0 1.08.48 1.08 1.08 0 .59-.49 1.07-1.08 1.07-.6 0-1.08-.48-1.08-1.07 0-.6.48-1.08 1.08-1.08Z" />
    <path d="M23 13.86c0-3.05-2.87-5.52-6.4-5.52-3.57 0-6.44 2.47-6.44 5.52 0 3.06 2.87 5.53 6.44 5.53.74 0 1.46-.1 2.12-.3l2.06 1.07-.55-1.8c1.52-1 2.77-2.49 2.77-4.5Zm-8.45-1.5c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9Zm3.9 0c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9Z" />
  </svg>
)

export default function Footer() {
  const t = useTranslations('Footer')
  const tl = useTranslations('FooterLinks')
  const locale = useLocale() // Get current locale
  const [logoUrl, setLogoUrl] = useState('')
  const [companyName, setCompanyName] = useState('Global Trade')
  const [siteTagline, setSiteTagline] = useState('')
  const [accentColor, setAccentColor] = useState('#c9a84c')
  const [primaryColor, setPrimaryColor] = useState('#1a3a5c')
  
  // Contact information state
  const [contactInfo, setContactInfo] = useState({
    address: 'China, Zhejiang, China',
    phone: '+86 579 8555 1234',
    email: 'info@globaltrade.com'
  })
  
  // Social media links state
  const [socialLinks, setSocialLinks] = useState({
    facebookUrl: '',
    twitterUrl: '',
    linkedinUrl: '',
    instagramUrl: '',
    wechatId: '',
    whatsappNumber: ''
  })

  const currentYear = new Date().getFullYear()

  useEffect(() => {
    // Fetch settings for branding, contact info, and social media
    fetch(`/api/settings/public?locale=${locale}`)
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          // Branding
          if (data.settings.companyLogo) setLogoUrl(data.settings.companyLogo)
          if (data.settings.companyName) setCompanyName(data.settings.companyName)
          if (data.settings.siteTagline) setSiteTagline(data.settings.siteTagline)
          if (data.settings.accentColor) {
            setAccentColor(data.settings.accentColor)
            document.documentElement.style.setProperty('--accent-color', data.settings.accentColor)
          }
          if (data.settings.primaryColor) {
            setPrimaryColor(data.settings.primaryColor)
            document.documentElement.style.setProperty('--primary-color', data.settings.primaryColor)
          }
          
          // Contact information with translation support
          const translations = data.settings.translations || []
          
          // Helper function to get localized value
          const getLocalizedValue = (key: string, fallback: string) => {
            // Try current locale
            const localeTrans = translations.find(
              (t: any) => t.locale === locale && t.key === key
            )
            if (localeTrans && localeTrans.value) return localeTrans.value
            
            // Fallback to English
            const enTrans = translations.find(
              (t: any) => t.locale === 'en' && t.key === key
            )
            if (enTrans && enTrans.value) return enTrans.value
            
            // Fallback to main field
            return fallback
          }
          
          setContactInfo({
            address: getLocalizedValue('companyAddress', data.settings.companyAddress || 'China, Zhejiang, China'),
            phone: data.settings.companyPhone || '+86 579 8555 1234',
            email: data.settings.companyEmail || 'info@yiwuexpress.com'
          })

          // Social media links
          setSocialLinks({
            facebookUrl: data.settings.facebookUrl || '',
            twitterUrl: data.settings.twitterUrl || '',
            linkedinUrl: data.settings.linkedinUrl || '',
            instagramUrl: data.settings.instagramUrl || '',
            wechatId: data.settings.wechatId || '',
            whatsappNumber: data.settings.whatsappNumber || ''
          })
        }
      })
      .catch(err => console.error(err))
  }, [locale]) // Re-fetch when locale changes

  // Helper to darken color for hover effect
  const adjustColor = (color: string, amount: number) => {
    const clamp = (num: number) => Math.min(Math.max(num, 0), 255)
    const hex = color.replace('#', '')
    const r = clamp(parseInt(hex.substr(0, 2), 16) + amount)
    const g = clamp(parseInt(hex.substr(2, 2), 16) + amount)
    const b = clamp(parseInt(hex.substr(4, 2), 16) + amount)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }
  
  
  const serviceLinks = [
    { label: tl('airFreight'), href: '/services?type=shipping' },
    { label: tl('seaFreight'), href: '/services?type=shipping' },
    { label: tl('customsClearance'), href: '/services?type=customs' },
    { label: tl('warehousing'), href: '/services?type=warehousing' },
    { label: tl('sourcingServices'), href: '/services?type=sourcing' },
    { label: tl('doorToDoor'), href: '/services?type=shipping' },
  ]

  const companyLinks = [
    { label: tl('aboutUs'), href: '/about' },
    { label: tl('globalNetwork'), href: '/network' },
    { label: tl('careers'), href: '/careers' },
    { label: tl('partners'), href: '/contact' },
    { label: tl('newsUpdates'), href: '/blog' },
    { label: tl('sustainability'), href: '/about' },
  ]

  const supportLinks = [
    { label: tl('trackShipment'), href: '/track' },
    { label: tl('getQuote'), href: '/quotes' },
    { label: tl('faq'), href: '/faq' },
    { label: tl('supportCenter'), href: '/contact' },
    { label: tl('contactUs'), href: '/contact' },
    { label: tl('termsConditions'), href: '/terms' },
  ]

  
  // Create dynamic social links based on database settings
  const dynamicSocialLinks = [
    ...(socialLinks.facebookUrl ? [{
      icon: FacebookIcon,
      href: socialLinks.facebookUrl,
      label: 'Facebook'
    }] : []),
    ...(socialLinks.twitterUrl ? [{
      icon: XIcon,
      href: socialLinks.twitterUrl,
      label: 'X (Twitter)'
    }] : []),
    ...(socialLinks.linkedinUrl ? [{
      icon: LinkedInIcon,
      href: socialLinks.linkedinUrl,
      label: 'LinkedIn'
    }] : []),
    ...(socialLinks.instagramUrl ? [{
      icon: InstagramIcon,
      href: socialLinks.instagramUrl,
      label: 'Instagram'
    }] : []),
    ...(socialLinks.whatsappNumber ? [{
      icon: WhatsAppIcon,
      href: `https://wa.me/${socialLinks.whatsappNumber.replace(/\D/g, '')}`,
      label: 'WhatsApp'
    }] : []),
    ...(socialLinks.wechatId ? [{
      icon: WeChatIcon,
      href: `https://u.wechat.com/${socialLinks.wechatId}`,
      label: 'WeChat'
    }] : []),
  ]

  // Custom markers for Global Trade global network
  const globalNetworkMarkers: { id: string; location: [number, number]; name: string; users: number }[] = [
    { id: "china", location: [35.86, 104.19], name: "CHINA", users: 2500 },
    { id: "russia", location: [55.75, 37.61], name: "RUSSIA", users: 1800 },
    { id: "turkmenistan", location: [37.96, 58.33], name: "Turkmenistan", users: 1200 },
    { id: "dubai", location: [25.2, 55.27], name: "DUBAI", users: 1100 },
    { id: "turkey", location: [39.92, 32.85], name: "Turkey", users: 900 },
    { id: "belarus", location: [53.90, 27.56], name: "Belarus", users: 800 },
    { id: "iraq", location: [33.31, 44.36], name: "Iraq", users: 700 },
    { id: "afghanistan", location: [34.52, 69.17], name: "Afghanistan", users: 650 },
  ]

  return (
    <footer className="relative bg-[#0a0f1a] text-white overflow-hidden">
      {/* Premium Gold Top Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary-500 to-transparent"></div>
      
      {/* Subtle Dot Pattern Overlay - Visual Texture */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      ></div>
      
      {/* Massive Background Globe - Enhanced Visibility & Glow */}
      <div className="hidden lg:block absolute -right-32 top-1/2 -translate-y-1/2 w-[700px] h-[700px] opacity-35 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-secondary-500/10 via-transparent to-transparent blur-3xl"></div>
        <GlobeInteractive 
          markers={globalNetworkMarkers}
          speed={0.0015}
          className="w-full h-full drop-shadow-[0_0_80px_rgba(201,168,76,0.15)]"
        />
      </div>
      
      {/* Animated Gradient Orbs - Ambient Background */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-secondary-500/5 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-20 right-40 w-80 h-80 bg-primary-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Main Footer Content - 4 Equal Columns */}
      <Container maxWidth="2xl" className="relative z-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* COLUMN 1: Logo + Brand Tagline + About Us */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3.5">
              {logoUrl ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-2 shadow-[0_8px_32px_rgba(201,168,76,0.25)] flex-shrink-0">
                  <img
                    src={logoUrl}
                    alt={`${companyName} Logo`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-400 via-secondary-500 to-secondary-600 flex items-center justify-center shadow-[0_8px_32px_rgba(201,168,76,0.3)] ring-2 ring-secondary-500/20 flex-shrink-0">
                  <Truck className="w-6 h-6 text-primary-950 drop-shadow-sm font-bold" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight drop-shadow-md">{companyName}</h2>
                <div className="inline-flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-400 animate-pulse"></span>
                  <p className="text-secondary-300 text-xs font-semibold tracking-wide">
                    {siteTagline || t('brandSubtitle')}
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-gray-300/90 leading-relaxed text-sm">
              {t('aboutText')}
            </p>

            {/* Core Capabilities Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-gray-300 text-[11px] font-medium">
                {locale === 'zh' ? '全球物流' : locale === 'ru' ? 'Международная логистика' : 'Global Logistics'}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-gray-300 text-[11px] font-medium">
                {locale === 'zh' ? '源头直采' : locale === 'ru' ? 'Прямые закупки' : 'Direct Sourcing'}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-gray-300 text-[11px] font-medium">
                {locale === 'zh' ? '双清报关' : locale === 'ru' ? 'Таможенное оформление' : 'Customs Clearance'}
              </span>
            </div>
          </div>

          {/* COLUMN 2: Quick Links */}
          <div>
            <h3 className="text-base font-bold mb-6 text-white relative inline-block">
              {t('quickLinks')}
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full shadow-lg shadow-secondary-500/50"></span>
            </h3>
            <ul className="space-y-3">
              {[
                ...serviceLinks.slice(0, 3),
                ...companyLinks.slice(0, 3)
              ].map((link, idx) => (
                <li key={`${link.href}-${link.label}-${idx}`}>
                  <LocaleLink 
                    href={link.href}
                    className="text-sm text-gray-300/90 hover:text-secondary-300 transition-all duration-300 inline-flex items-center group hover:translate-x-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mr-3 group-hover:bg-secondary-400 group-hover:shadow-lg group-hover:shadow-secondary-500/50 transition-all duration-300"></span>
                    <span className="group-hover:drop-shadow-lg">{link.label}</span>
                  </LocaleLink>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 3: Support / Help */}
          <div>
            <h3 className="text-base font-bold mb-6 text-white relative inline-block">
              {t('supportHelp')}
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full shadow-lg shadow-secondary-500/50"></span>
            </h3>
            <ul className="space-y-3">
              {supportLinks.map((link, idx) => (
                <li key={`${link.href}-${link.label}-${idx}`}>
                  <LocaleLink 
                    href={link.href}
                    className="text-sm text-gray-300/90 hover:text-secondary-300 transition-all duration-300 inline-flex items-center group hover:translate-x-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mr-3 group-hover:bg-secondary-400 group-hover:shadow-lg group-hover:shadow-secondary-500/50 transition-all duration-300"></span>
                    <span className="group-hover:drop-shadow-lg">{link.label}</span>
                  </LocaleLink>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 4: Contact Information + Social */}
          <div>
            <h3 className="text-base font-bold mb-6 text-white relative inline-block">
              {t('getInTouch')}
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full shadow-lg shadow-secondary-500/50"></span>
            </h3>
            
            {/* Contact Info - Compact Design */}
            <div className="space-y-3.5 mb-8">
              <div className="flex items-start space-x-2.5 group">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-gray-700/50 group-hover:border-secondary-500/50 transition-all duration-300">
                  <MapPin className="w-4 h-4 text-secondary-400 transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-0.5 font-medium">{t('address')}</p>
                  <span className="text-gray-200 text-xs leading-relaxed">{contactInfo.address}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2.5 group">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-gray-700/50 group-hover:border-secondary-500/50 transition-all duration-300">
                  <Phone className="w-4 h-4 text-secondary-400 transition-colors" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 font-medium">{t('phone')}</p>
                  <span className="text-gray-200 text-xs">{contactInfo.phone}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2.5 group">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-gray-700/50 group-hover:border-secondary-500/50 transition-all duration-300">
                  <Mail className="w-4 h-4 text-secondary-400 transition-colors" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 font-medium">{t('email')}</p>
                  <span className="text-gray-200 text-xs">{contactInfo.email}</span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="text-xs font-bold mb-4 text-gray-400 uppercase tracking-widest">{t('connectWithUs')}</h4>
              <div className="flex space-x-2.5">
                {dynamicSocialLinks.length > 0 ? (
                  dynamicSocialLinks.map((social) => {
                    const Icon = social.icon
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 hover:border-secondary-500/80 flex items-center justify-center transition-all duration-300 hover:scale-110 group overflow-hidden"
                        aria-label={social.label}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-secondary-500/0 to-secondary-600/0 group-hover:from-secondary-500/20 group-hover:to-secondary-600/20 transition-all duration-300"></div>
                        <Icon className="w-5 h-5 relative z-10 text-gray-400 group-hover:text-secondary-300 transition-colors" />
                      </a>
                    )
                  })
                ) : (
                  <p className="text-xs text-gray-500 italic">{t('noSocial')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>


      {/* Bottom Bar - Premium Design with Border Glow & ICP Compliance */}
      <div className="relative z-10 border-t border-gray-700/40">
        {/* Top border glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary-500/30 to-transparent"></div>
        
        <Container maxWidth="2xl" className="py-7">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm text-center md:text-left">
              © {currentYear} <span className="text-white font-bold drop-shadow-lg">{companyName}</span>. {t('rights')}
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <LocaleLink href="/privacy" className="text-gray-400 hover:text-secondary-300 transition-all duration-300 hover:drop-shadow-lg">
                {t('privacy')}
              </LocaleLink>
              <LocaleLink href="/terms" className="text-gray-400 hover:text-secondary-300 transition-all duration-300 hover:drop-shadow-lg">
                {t('terms')}
              </LocaleLink>
              <LocaleLink href="/cookies" className="text-gray-400 hover:text-secondary-300 transition-all duration-300 hover:drop-shadow-lg">
                {t('cookies')}
              </LocaleLink>
              <LocaleLink href="/sitemap" className="text-gray-400 hover:text-secondary-300 transition-all duration-300 hover:drop-shadow-lg">
                {t('sitemap')}
              </LocaleLink>
            </div>
          </div>

          {/* Chinese MIIT ICP & Website Registration Compliance Bar */}
          <div className="mt-4 pt-4 border-t border-gray-800/80 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
            <span className="inline-flex items-center gap-1.5 text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-400/80"></span>
              {t('registeredWebsiteName')}
            </span>
            <span className="hidden sm:inline text-gray-700">|</span>
            <a
              href="https://beian.miit.gov.cn/#/Integrated/index"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-secondary-300 transition-colors underline-offset-4 hover:underline"
              title="Ministry of Industry and Information Technology (MIIT) ICP License"
            >
              <Shield className="w-3.5 h-3.5 text-secondary-400" />
              <span>{t('icpLicense')}</span>
            </a>
          </div>
        </Container>
      </div>
    </footer>
  )
}