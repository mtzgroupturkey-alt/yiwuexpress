export type Platform = 'ios' | 'android' | 'desktop' | 'unknown';
export type Browser = 'chrome' | 'safari' | 'firefox' | 'edge' | 'other';

export interface NotificationSupportResult {
  supported: boolean;
  reason?: string;
  requiresInstall: boolean;
  requiresSettings: boolean;
  platform: Platform;
  browser: Browser;
  osVersion?: string;
}

export function getNotificationSupport(): NotificationSupportResult {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      requiresInstall: false,
      requiresSettings: false,
      platform: 'unknown',
      browser: 'other',
    };
  }

  const ua = navigator.userAgent.toLowerCase();
  
  let platform: Platform = 'unknown';
  let browser: Browser = 'other';
  let osVersion: string | undefined;

  // Detect Platform
  if (/iphone|ipad|ipod/.test(ua)) {
    platform = 'ios';
    const match = ua.match(/os (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      osVersion = `${match[1]}.${match[2]}`;
    }
  } else if (/android/.test(ua)) {
    platform = 'android';
  } else if (/mac|win|linux/.test(ua)) {
    platform = 'desktop';
  }

  // Detect Browser
  if (/chrome|crios/.test(ua) && !/edge|opr/.test(ua)) {
    browser = 'chrome';
  } else if (/safari/.test(ua) && !/chrome|crios/.test(ua)) {
    browser = 'safari';
  } else if (/firefox|fxios/.test(ua)) {
    browser = 'firefox';
  } else if (/edg/.test(ua)) {
    browser = 'edge';
  }

  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone === true;

  const requiresSettings = false; // Determined later by permission

  // iOS Logic
  if (platform === 'ios') {
    if (!osVersion) {
      return { supported: false, reason: 'iOS version unknown', requiresInstall: false, requiresSettings, platform, browser, osVersion };
    }
    const versionParts = osVersion.split('.').map(Number);
    const major = versionParts[0] || 0;
    const minor = versionParts[1] || 0;

    if (major < 16 || (major === 16 && minor < 4)) {
      return { supported: false, reason: 'iOS < 16.4 does not support web push', requiresInstall: false, requiresSettings, platform, browser, osVersion };
    }

    if (!isStandalone) {
      return { supported: false, reason: 'iOS requires installation to home screen', requiresInstall: true, requiresSettings, platform, browser, osVersion };
    }

    return { supported: true, requiresInstall: false, requiresSettings, platform, browser, osVersion };
  }

  // Android Chrome Logic
  if (platform === 'android') {
    return { supported: true, requiresInstall: false, requiresSettings, platform, browser, osVersion };
  }

  // Desktop Logic
  if (platform === 'desktop') {
    if (browser === 'safari') {
       return { supported: true, reason: 'Desktop Safari has partial support', requiresInstall: false, requiresSettings, platform, browser, osVersion };
    }
    return { supported: true, requiresInstall: false, requiresSettings, platform, browser, osVersion };
  }

  return { supported: false, reason: 'Unknown platform', requiresInstall: false, requiresSettings, platform, browser, osVersion };
}
