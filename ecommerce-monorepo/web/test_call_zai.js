const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { callZaiChatCompletion, DEFAULT_ZAI_VISION_MODEL } = require('./lib/ai/providers/zai');

async function main() {
  const p = new PrismaClient();
  const s = await p.systemSettings.findFirst();
  const imgBuf = fs.readFileSync('public/uploads/blog-cookware.jpg');
  const b64 = imgBuf.toString('base64');
  const dataUri = 'data:image/jpeg;base64,' + b64;

  const prompt = `You are an expert e-commerce visual search AI.
Analyze the provided product image and return a strict JSON object identifying the product.
Do NOT output markdown fences (\`\`\`json). Output ONLY raw valid JSON matching this schema:
{
  "category": "Cookware",
  "keywords": ["frying pan", "cookware", "granite", "skillet", "kitchen"],
  "colors": ["black", "silver"],
  "materials": ["granite", "aluminum"],
  "style": "modern",
  "confidence": 0.85
}`;

  try {
    const res = await callZaiChatCompletion({
      apiKey: s.zaiApiKey,
      baseUrl: s.zaiBaseUrl,
      model: DEFAULT_ZAI_VISION_MODEL,
      temperature: 0.1,
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUri } }
          ]
        }
      ]
    });
    console.log('--- CALL ZAI SUCCESS ---');
    console.log(res.content);
  } catch (err) {
    console.error('--- CALL ZAI FAILED ---', err);
  }
  process.exit(0);
}

main();
