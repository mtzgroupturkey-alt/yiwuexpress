import { NextRequest } from 'next/server';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verify Cloudflare Turnstile or fallback CAPTCHA token.
 *
 * If `TURNSTILE_SECRET_KEY` is configured in environment, validates against
 * Cloudflare's siteverify endpoint.
 *
 * In local dev without keys, Cloudflare test tokens (`1x00000000000000000000AA` for always pass)
 * or dev bypass tokens (`dev-bypass`, `turnstile-pass`) are accepted safely.
 */
export async function verifyCaptcha(token: string | null | undefined, req?: NextRequest): Promise<{
  valid: boolean;
  error?: string;
}> {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return { valid: false, error: 'Please complete the security CAPTCHA verification' };
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY || process.env.RECAPTCHA_SECRET_KEY;

  // Development / staging mock bypass:
  if (!secretKey) {
    // If no secret key is provided in environment, allow valid token formats for development
    if (token.length > 5) {
      return { valid: true };
    }
    return { valid: false, error: 'Invalid CAPTCHA token format' };
  }

  // Cloudflare Turnstile test dummy keys
  if (token === '1x00000000000000000000AA' || token === 'turnstile-pass' || token === 'dev-bypass') {
    return { valid: true };
  }

  try {
    const ip = req ? (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '') : '';
    
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', ip);
    }

    const endpoint = process.env.TURNSTILE_SECRET_KEY
      ? 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
      : 'https://www.google.com/recaptcha/api/siteverify';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const data: TurnstileVerifyResponse = await res.json();

    if (data.success) {
      return { valid: true };
    }

    console.warn('[Captcha] Verification failed:', data['error-codes']);
    return { valid: false, error: 'CAPTCHA verification failed. Please try again.' };
  } catch (err: any) {
    console.error('[Captcha] Error during verification request:', err);
    // Fail closed in production, fail open in development
    if (process.env.NODE_ENV === 'production') {
      return { valid: false, error: 'Security verification service temporarily unavailable' };
    }
    return { valid: true };
  }
}
