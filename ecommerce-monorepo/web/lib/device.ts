import { UAParser } from 'ua-parser-js'

export function isMobile(userAgent: string): boolean {
  if (!userAgent) return false
  const parser = new UAParser(userAgent)
  const device = parser.getDevice()
  return device.type === 'mobile' || device.type === 'tablet'
}

export function isIOS(userAgent: string): boolean {
  if (!userAgent) return false
  return /iPhone|iPad|iPod/i.test(userAgent)
}

export function isAndroid(userAgent: string): boolean {
  if (!userAgent) return false
  return /Android/i.test(userAgent)
}
