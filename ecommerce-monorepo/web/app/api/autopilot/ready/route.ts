import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRedisClient, isRedisInMemory } from '@/lib/autopilot/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const readiness = {
    database: false,
    redis: false,
    llmProvider: false,
  };

  // 1. Check Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    readiness.database = true;
  } catch {
    readiness.database = false;
  }

  // 2. Check Redis / Bus
  try {
    const redis = getRedisClient();
    await redis.set('autopilot:readiness_ping', 'ok', 'EX', 10);
    readiness.redis = true;
  } catch {
    readiness.redis = false;
  }

  // 3. Check LLM Config
  const hasAiKey = !!(
    process.env.OPENAI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.OPENROUTER_API_KEY
  );
  readiness.llmProvider = hasAiKey;

  const isReady = readiness.database && readiness.redis;

  return NextResponse.json(
    {
      ready: isReady,
      checks: {
        database: readiness.database ? 'UP' : 'DOWN',
        redis: readiness.redis ? (isRedisInMemory() ? 'UP (IN_MEMORY)' : 'UP (CONNECTED)') : 'DOWN',
        llmConfigured: readiness.llmProvider ? 'CONFIGURED' : 'UNCONFIGURED (FALLBACK_ACTIVE)',
      },
      timestamp: new Date().toISOString(),
    },
    { status: isReady ? 200 : 503 }
  );
}
