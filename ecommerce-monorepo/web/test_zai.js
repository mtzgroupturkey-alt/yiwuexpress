const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

async function test() {
  const p = new PrismaClient();
  const s = await p.systemSettings.findFirst();
  const imgBuf = fs.readFileSync('public/uploads/blog-cookware.jpg');
  const b64 = imgBuf.toString('base64');
  const dataUri = 'data:image/jpeg;base64,' + b64;

  const url = (s.zaiBaseUrl || 'https://api.z.ai/api/paas/v4').replace(/\/+$/, '') + '/chat/completions';
  console.log('Target URL:', url);
  console.log('Key prefix:', s.zaiApiKey?.slice(0, 10));

  const prompt = 'You are an expert e-commerce visual search AI. Return raw JSON with schema: {"category":"Cookware","keywords":["frying pan","cookware","granite"],"colors":["black"],"materials":["granite"],"style":"modern","confidence":0.9}';

  const body = {
    model: 'glm-4.6v-flash',
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
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${s.zaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
  process.exit(0);
}

test();
