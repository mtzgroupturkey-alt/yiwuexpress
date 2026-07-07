'use client'

import { useState, useEffect } from 'react'
import { Truck, Mail, Phone, MapPin, Globe, Shield } from 'lucide-react'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { GlobeInteractive } from '@/components/ui/cobe-globe-interactive'

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

  // Custom markers for YIWU EXPRESS global network
  const globalNetworkMarkers = [
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
          
          {/* COLUMN 1: Logo + About Us */}
          <div>
            <div className="flex items-center space-x-3 mb-5">
              {logoUrl ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-secondary-400 via-secondary-500 to-secondary-600 flex items-center justify-center p-2 shadow-[0_8px_32px_rgba(201,168,76,0.3)] ring-2 ring-secondary-500/20">
                  <img
                    src={logoUrl}
                    alt={`${companyName} Logo`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-400 via-secondary-500 to-secondary-600 flex items-center justify-center shadow-[0_8px_32px_rgba(201,168,76,0.3)] ring-2 ring-secondary-500/20">
                  <Truck className="w-7 h-7 text-white drop-shadow-lg" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-white drop-shadow-lg">{companyName}</h2>
                <p className="text-secondary-400 text-xs font-semibold">Global Trade</p>
              </div>
            </div>
            
            <p className="text-gray-300/90 leading-relaxed text-sm">
              Connecting businesses worldwide with professional logistics, customs clearance, 
              and sourcing services from Yiwu, China.
            </p>
          </div>

          {/* COLUMN 2: Quick Links */}
          <div>
            <h3 className="text-base font-bold mb-6 text-white relative inline-block">
              Quick Links
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full shadow-lg shadow-secondary-500/50"></span>
            </h3>
            <ul className="space-y-3">
              {[
                ...serviceLinks.slice(0, 3),
                ...companyLinks.slice(0, 3)
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-300/90 hover:text-secondary-300 transition-all duration-300 inline-flex items-center group hover:translate-x-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mr-3 group-hover:bg-secondary-400 group-hover:shadow-lg group-hover:shadow-secondary-500/50 transition-all duration-300"></span>
                    <span className="group-hover:drop-shadow-lg">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 3: Support / Help */}
          <div>
            <h3 className="text-base font-bold mb-6 text-white relative inline-block">
              Support & Help
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full shadow-lg shadow-secondary-500/50"></span>
            </h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-300/90 hover:text-secondary-300 transition-all duration-300 inline-flex items-center group hover:translate-x-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mr-3 group-hover:bg-secondary-400 group-hover:shadow-lg group-hover:shadow-secondary-500/50 transition-all duration-300"></span>
                    <span className="group-hover:drop-shadow-lg">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 4: Contact Information + Social */}
          <div>
            <h3 className="text-base font-bold mb-6 text-white relative inline-block">
              Get In Touch
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full shadow-lg shadow-secondary-500/50"></span>
            </h3>
            
            {/* Contact Info - Compact Design */}
            <div className="space-y-3.5 mb-8">
              <div className="flex items-start space-x-2.5 group">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-gray-700/50 group-hover:border-secondary-500/50 transition-all duration-300">
                  <MapPin className="w-4 h-4 text-secondary-400 transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-0.5 font-medium">Address</p>
                  <span className="text-gray-200 text-xs leading-relaxed">Yiwu International Trade City, Zhejiang, China</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2.5 group">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-gray-700/50 group-hover:border-secondary-500/50 transition-all duration-300">
                  <Phone className="w-4 h-4 text-secondary-400 transition-colors" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 font-medium">Phone</p>
                  <span className="text-gray-200 text-xs">+86 579 8555 1234</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2.5 group">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-gray-700/50 group-hover:border-secondary-500/50 transition-all duration-300">
                  <Mail className="w-4 h-4 text-secondary-400 transition-colors" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 font-medium">Email</p>
                  <span className="text-gray-200 text-xs">info@yiwuexpress.com</span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="text-xs font-bold mb-4 text-gray-400 uppercase tracking-widest">Connect With Us</h4>
              <div className="flex space-x-2.5">
                {socialLinks.map((social) => {
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
                      <Icon className="w-4 h-4 relative z-10 text-gray-400 group-hover:text-secondary-300 transition-colors" />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </Container>


      {/* Bottom Bar - Premium Design with Border Glow */}
      <div className="relative z-10 border-t border-gray-700/40">
        {/* Top border glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary-500/30 to-transparent"></div>
        
        <Container maxWidth="2xl" className="py-7">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              © {currentYear} <span className="text-white font-bold drop-shadow-lg">{companyName}</span>. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-secondary-300 transition-all duration-300 hover:drop-shadow-lg">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-secondary-300 transition-all duration-300 hover:drop-shadow-lg">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-secondary-300 transition-all duration-300 hover:drop-shadow-lg">
                Cookie Policy
              </Link>
              <Link href="/sitemap" className="text-gray-400 hover:text-secondary-300 transition-all duration-300 hover:drop-shadow-lg">
                Sitemap
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  )
}