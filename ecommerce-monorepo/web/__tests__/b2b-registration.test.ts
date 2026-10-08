import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

const registerB2BSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  taxId: z.string().min(2, 'Tax ID is required'),
  businessType: z.string().min(2, 'Business type is required'),
  country: z.string().min(2, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  address: z.string().min(2, 'Address is required'),
  contactName: z.string().min(2, 'Contact person name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Valid phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  notes: z.string().optional().default(''),
});

describe('B2B Registration Suite', () => {
  it('validates a complete and legitimate B2B applicant', () => {
    const validData = {
      companyName: 'B2B Global Trading Ltd',
      taxId: 'DE312984721',
      businessType: 'wholesaler',
      country: 'Germany',
      city: 'Hamburg',
      address: 'Hafenstrasse 42',
      contactName: 'Hans Schmidt',
      email: 'procurement@b2bglobal.de',
      phone: '+49 40 1234567',
      password: 'StrongB2BPassword123',
      notes: 'Need 2x 40ft containers monthly',
    };

    const parsed = registerB2BSchema.parse(validData);
    expect(parsed.companyName).toBe('B2B Global Trading Ltd');
    expect(parsed.email).toBe('procurement@b2bglobal.de');
    expect(parsed.taxId).toBe('DE312984721');
  });

  it('rejects incomplete B2B applications missing company or tax identification', () => {
    const invalidData = {
      companyName: '',
      taxId: '',
      businessType: 'wholesaler',
      country: 'Germany',
      city: 'Hamburg',
      address: 'Hafenstrasse 42',
      contactName: 'Hans Schmidt',
      email: 'not-an-email',
      phone: '123',
      password: 'short',
    };

    expect(() => registerB2BSchema.parse(invalidData)).toThrow();
  });

  it('enforces IP rate limiting on register-b2b endpoint (blocks after maxRequests)', async () => {
    const testIp = `test-ip-${Date.now()}`;
    const options = { windowSeconds: 60, maxRequests: 5 };

    // Requests 1 to 5 should succeed
    for (let i = 1; i <= 5; i++) {
      const res = await checkRateLimit(`register-b2b:${testIp}`, options);
      expect(res.allowed).toBe(true);
    }

    // 6th request must be rate limited
    const sixth = await checkRateLimit(`register-b2b:${testIp}`, options);
    expect(sixth.allowed).toBe(false);
    expect(sixth.retryAfter).toBeGreaterThan(0);
  });
});
