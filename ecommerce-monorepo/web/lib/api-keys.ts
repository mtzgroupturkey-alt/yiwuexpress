import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ApiKeys {
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
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    qwenApiKey: process.env.QWEN_API_KEY,
    kimiApiKey: process.env.KIMI_API_KEY,
    cerebrasApiKey: process.env.CEREBRAS_API_KEY,
  };
}
