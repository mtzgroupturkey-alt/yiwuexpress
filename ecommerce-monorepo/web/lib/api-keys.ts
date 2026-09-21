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
}

/**
 * Get AI API keys from database (SystemSettings) with .env fallback
 * Priority: Database > Environment Variables
 */
export async function getApiKeys(): Promise<ApiKeys> {
  try {
    // Try to get from database first
    const settings = await prisma.systemSettings.findFirst({
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
      },
    });

    if (settings) {
      // Return database values, fallback to env if database value is null/empty
      return {
        openaiApiKey: settings.openaiApiKey || process.env.OPENAI_API_KEY,
        openaiBaseUrl: settings.openaiBaseUrl || process.env.OPENAI_BASE_URL || 'https://llm.gcat.ir/v1',
        openaiModel: settings.openaiModel || process.env.OPENAI_MODEL || 'auto/best-chat',
        primaryAiProvider: settings.primaryAiProvider || 'openai',
        openrouterApiKey: settings.openrouterApiKey || process.env.OPENROUTER_API_KEY,
        geminiApiKey: settings.geminiApiKey || process.env.GEMINI_API_KEY,
        deepseekApiKey: settings.deepseekApiKey || process.env.DEEPSEEK_API_KEY,
        qwenApiKey: settings.qwenApiKey || process.env.QWEN_API_KEY,
        kimiApiKey: settings.kimiApiKey || process.env.KIMI_API_KEY,
        cerebrasApiKey: settings.cerebrasApiKey || process.env.CEREBRAS_API_KEY,
      };
    }
  } catch (error) {
    console.error('Error fetching API keys from database:', error);
  }

  // Fallback to environment variables only
  return {
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://llm.gcat.ir/v1',
    openaiModel: process.env.OPENAI_MODEL || 'auto/best-chat',
    primaryAiProvider: 'openai',
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    qwenApiKey: process.env.QWEN_API_KEY,
    kimiApiKey: process.env.KIMI_API_KEY,
    cerebrasApiKey: process.env.CEREBRAS_API_KEY,
  };
}
