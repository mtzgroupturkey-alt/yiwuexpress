'use client'

import { useState, useEffect } from 'react'
import { Truck, Mail, Phone, MapPin, Globe, Shield } from 'lucide-react'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'

export default function Footer() {
  const [logoUrl, setLogoUrl] = useState('')
  const [companyName, setCompanyName] = useState('YIWU EXPRESS')
  const [accentColor, setAccentColor] = useState('#c9a84c')
  const [primaryColor, setPrimaryColor] = useState('#1a3a5c')
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    // Fetch settings for branding
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          if (data.settings.companyLogo) setLogoUrl(data.settings.companyLogo)
          if (data.settings.companyName) setCompanyName(data.settings.companyName)
          if (data.settings.accentColor) {
            setAccentColor(data.settings.accentColor)
            document.documentElement.style.setProperty('--accent-color', data.settings.accentColor)
          }
          if (data.settings.primaryColor) {
            setPrimaryColor(data.settings.primaryColor)
            document.documentElement.style.setProperty('--primary-color', data.settings.primaryColor)
          }
        }
      })
      .catch(err => console.error(err))
  }, [])

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
    { label: 'Air Freight', href: '/services/air-freight' },
    { label: 'Sea Freight', href: '/services/sea-freight' },
    { label: 'Customs Clearance', href: '/services/customs' },
    { label: 'Warehousing', href: '/services/warehousing' },
    { label: 'Sourcing Services', href: '/services/sourcing' },
    { label: 'Door-to-Door', href: '/services/door-to-door' },
  ]

  const companyLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Global Network', href: '/network' },
    { label: 'Careers', href: '/careers' },
    { label: 'Partners', href: '/partners' },
    { label: 'News & Updates', href: '/news' },
    { label: 'Sustainability', href: '/sustainability' },
  ]

  const supportLinks = [
    { label: 'Track Shipment', href: '/track' },
    { label: 'Get Quote', href: '/quotes' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Support Center', href: '/support' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Terms & Conditions', href: '/terms' },
  ]

  const socialLinks = [
    { icon: Globe, href: 'https://facebook.com/yiwuexpress', label: 'Facebook' },
    { icon: Globe, href: 'https://twitter.com/yiwuexpress', label: 'Twitter' },
    { icon: Globe, href: 'https://linkedin.com/company/yiwuexpress', label: 'LinkedIn' },
    { icon: Globe, href: 'https://instagram.com/yiwuexpress', label: 'Instagram' },
  ]

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <Container maxWidth="2xl" className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              {logoUrl ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center p-1">
                  <img
                    src={logoUrl}
                    alt={`${companyName} Logo`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <Truck className="w-8 h-8 text-accent" />
              )}
              <div>
                <h2 className="text-2xl font-bold">{companyName}</h2>
                <p className="text-gray-400 text-sm">Global Trade Solutions from Yiwu, China</p>
              </div>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Connecting businesses worldwide with professional logistics, customs clearance, 
              and sourcing services from the world&apos;s largest small commodities market.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">Yiwu International Trade City, Zhejiang, China</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">+86 579 8555 1234</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">info@yiwuexpress.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">www.yiwuexpress.com</span>
              </div>
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Our Services</h3>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Social Links */}
            <div className="mt-8">
              <h4 className="text-sm font-semibold mb-3 text-gray-400">FOLLOW US</h4>
              <div className="flex space-x-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center transition-colors hover-primary-bg"
                      aria-label={social.label}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Subscribe to Our Newsletter</h3>
              <p className="text-gray-400">Get the latest updates on international trade and logistics</p>
            </div>
            <form className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Your business email"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500 text-white"
              />
              <button
                type="submit"
                className="px-6 py-3 text-white font-medium rounded-lg transition-colors whitespace-nowrap btn-primary"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </Container>

      {/* Bottom Bar */}
      <div className="bg-gray-950 py-6">
        <Container maxWidth="2xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © {currentYear} {companyName}. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="hover:text-white transition-colors">
                Cookie Policy
              </Link>
              <Link href="/sitemap" className="hover:text-white transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </Container>
      </div>

      {/* Trust Badges */}
      <div className="bg-gray-800 py-4">
        <Container maxWidth="2xl">
          <div className="flex flex-wrap justify-center items-center gap-8 text-xs text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10b981' }}>
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span>ISO 9001 Certified</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span>Global Network</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span>Secure Transactions</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ef4444' }}>
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span>24/7 Support</span>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  )
}