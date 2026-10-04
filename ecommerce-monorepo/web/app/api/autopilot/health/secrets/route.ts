import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SENSITIVE_VARS = [
  { name: 'DATABASE_URL', required: true, minLength: 20 },
  { name: 'JWT_SECRET', required: true, minLength: 32 },
  { name: 'NEXTAUTH_SECRET', required: false, minLength: 32 },
  { name: 'TELEGRAM_BOT_TOKEN', required: false, minLength: 20 },
  { name: 'TELEGRAM_WEBHOOK_SECRET', required: false, minLength: 16 },
  { name: 'WEBHOOK_HMAC_SECRET', required: false, minLength: 24 },
  { name: 'SLACK_WEBHOOK_URL', required: false, minLength: 25 },
  { name: 'SLACK_SIGNING_SECRET', required: false, minLength: 20 },
  { name: 'STRIPE_SECRET_KEY', required: false, minLength: 24 },
];

export async function GET() {
  const reports = SENSITIVE_VARS.map((v) => {
    const val = process.env[v.name];
    const exists = !!val;
    const length = val ? val.length : 0;
    const isWeak = exists && length < v.minLength;

    return {
      name: v.name,
      configured: exists,
      required: v.required,
      status: !exists ? (v.required ? 'MISSING_CRITICAL' : 'UNCONFIGURED') : isWeak ? 'WEAK_LENGTH' : 'SECURE',
      lengthWarning: isWeak ? `Length (${length}) below recommended minimum (${v.minLength})` : null,
    };
  });

  const hasCriticalMissing = reports.some((r) => r.status === 'MISSING_CRITICAL');
  const hasWeak = reports.some((r) => r.status === 'WEAK_LENGTH');

  return NextResponse.json({
    status: hasCriticalMissing ? 'critical' : hasWeak ? 'warning' : 'healthy',
    secretsAudited: reports.length,
    results: reports,
    timestamp: new Date().toISOString(),
  });
}
