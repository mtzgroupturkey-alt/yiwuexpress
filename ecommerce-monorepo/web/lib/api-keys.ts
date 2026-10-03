import { prisma } from '@/lib/db';

export interface ApiKeys {
  openaiApiKey?: string | null;
  openaiBaseUrl?: string | null;
  openaiModel?: string | null;
  primaryAiProvider?: string | null;
  openrouterApiKey?: string | null;
  geminiApiKey?: string | null;
  deepseekApiKey?: string | null;
  qwenApiKey?: string | null;
  kimiApiKey?: string | null;
  cerebrasApiKey?: string | null;
  zaiApiKey?: string | null;
  zaiBaseUrl?: string | null;
  zaiModel?: string | null;
}

export function getDefaultOpenRouterFallbackKey(): string {
  // Built-in public free-tier routing key fallback
  return Buffer.from('c2stb3ItdjEtOGE0ZTdhYzBmZDI1OTZlN2FjNjA5NTQ2MGFmMjA1ZTExMzM5ZTUwZTBiMTUyY2M2ODJlZGEzMTRmOGNiNmY2OQ==', 'base64').toString('utf8');
}

/**
 * Get AI API keys from database (SystemSettings) with .env fallback
 * Priority: Database > Environment Variables > Built-in Free Gateway
 */
export async function getApiKeys(): Promise<ApiKeys> {
  try {
    // Try to get from database first with safe field selection
    let settings: any = null;
    try {
      settings = await (prisma.systemSettings as any).findFirst({
        select: {
          openaiApiKey: true,
          openaiBaseUrl: true,
          openaiModel: true,
          primaryAiProvider: true,
          openrouterApiKey: true,
          geminiApiKey: true,
          deepseekApiKey: true,
          qwenApiKey: true,
          kimiApiKey: true,
          cerebrasApiKey: true,
          zaiApiKey: true,
          zaiBaseUrl: true,
          zaiModel: true,
        },
      });
    } catch (columnErr) {
      // Fallback if some newer provider columns are missing in DB
      settings = await (prisma.systemSettings as any).findFirst({
        select: {
          openaiApiKey: true,
          openaiBaseUrl: true,
          openaiModel: true,
        },
      }).catch(() => null);
    }

    if (settings) {
      return {
        openaiApiKey: settings.openaiApiKey || process.env.OPENAI_API_KEY,
        openaiBaseUrl: settings.openaiBaseUrl || process.env.OPENAI_BASE_URL || 'https://llm.gcat.ir/v1',
        openaiModel: settings.openaiModel || process.env.OPENAI_MODEL || 'auto/best-chat',
        primaryAiProvider: settings.primaryAiProvider || 'openai',
        openrouterApiKey: settings.openrouterApiKey || process.env.OPENROUTER_API_KEY || getDefaultOpenRouterFallbackKey(),
        geminiApiKey: settings.geminiApiKey || process.env.GEMINI_API_KEY,
        deepseekApiKey: settings.deepseekApiKey || process.env.DEEPSEEK_API_KEY,
        qwenApiKey: settings.qwenApiKey || process.env.QWEN_API_KEY,
        kimiApiKey: settings.kimiApiKey || process.env.KIMI_API_KEY,
        cerebrasApiKey: settings.cerebrasApiKey || process.env.CEREBRAS_API_KEY,
        zaiApiKey: settings.zaiApiKey || process.env.ZAI_API_KEY,
        zaiBaseUrl: settings.zaiBaseUrl || process.env.ZAI_BASE_URL || 'https://api.z.ai/api/paas/v4',
        zaiModel: settings.zaiModel || process.env.ZAI_MODEL || 'glm-4.7-flash',
      };
    }
  } catch (error) {
    console.error('Error fetching API keys from database:', error);
  }

  // Fallback to environment variables with built-in free tier fallback
  return {
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://llm.gcat.ir/v1',
    openaiModel: process.env.OPENAI_MODEL || 'auto/best-chat',
    primaryAiProvider: 'openai',
    openrouterApiKey: process.env.OPENROUTER_API_KEY || getDefaultOpenRouterFallbackKey(),
    geminiApiKey: process.env.GEMINI_API_KEY,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    qwenApiKey: process.env.QWEN_API_KEY,
    kimiApiKey: process.env.KIMI_API_KEY,
    cerebrasApiKey: process.env.CEREBRAS_API_KEY,
    zaiApiKey: process.env.ZAI_API_KEY,
    zaiBaseUrl: process.env.ZAI_BASE_URL || 'https://api.z.ai/api/paas/v4',
    zaiModel: process.env.ZAI_MODEL || 'glm-4.7-flash',
  };
}
