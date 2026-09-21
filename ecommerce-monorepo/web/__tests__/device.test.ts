import { describe, it, expect } from 'vitest'
import { isMobile, isIOS, isAndroid } from '@/lib/device'

describe('Device detection utility (lib/device.ts)', () => {
  const IPHONE_UA =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  const IPAD_UA =
    'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  const ANDROID_PHONE_UA =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
  const ANDROID_TABLET_UA =
    'Mozilla/5.0 (Linux; Android 13; SM-X800) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  const DESKTOP_CHROME_WINDOWS_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  const DESKTOP_SAFARI_MAC_UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'

  describe('isMobile()', () => {
    it('returns true for iPhone', () => {
      expect(isMobile(IPHONE_UA)).toBe(true)
    })

    it('returns true for iPad (tablet)', () => {
      expect(isMobile(IPAD_UA)).toBe(true)
    })

    it('returns true for Android phone', () => {
      expect(isMobile(ANDROID_PHONE_UA)).toBe(true)
    })

    it('returns true for Android tablet', () => {
      expect(isMobile(ANDROID_TABLET_UA)).toBe(true)
    })

    it('returns false for Windows Desktop Chrome', () => {
      expect(isMobile(DESKTOP_CHROME_WINDOWS_UA)).toBe(false)
    })

    it('returns false for Mac Desktop Safari', () => {
      expect(isMobile(DESKTOP_SAFARI_MAC_UA)).toBe(false)
    })

    it('returns false for empty or undefined user agent', () => {
      expect(isMobile('')).toBe(false)
    })
  })

  describe('isIOS()', () => {
    it('returns true for iPhone and iPad', () => {
      expect(isIOS(IPHONE_UA)).toBe(true)
      expect(isIOS(IPAD_UA)).toBe(true)
    })

    it('returns false for Android devices and Desktops', () => {
      expect(isIOS(ANDROID_PHONE_UA)).toBe(false)
      expect(isIOS(DESKTOP_CHROME_WINDOWS_UA)).toBe(false)
    })
  })

  describe('isAndroid()', () => {
    it('returns true for Android phone and tablet', () => {
      expect(isAndroid(ANDROID_PHONE_UA)).toBe(true)
      expect(isAndroid(ANDROID_TABLET_UA)).toBe(true)
    })

    it('returns false for iOS and Desktops', () => {
      expect(isAndroid(IPHONE_UA)).toBe(false)
      expect(isAndroid(DESKTOP_CHROME_WINDOWS_UA)).toBe(false)
    })
  })
})
