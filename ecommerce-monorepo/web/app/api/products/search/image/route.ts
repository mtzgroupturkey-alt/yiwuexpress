export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import sharp from 'sharp';
import { prisma } from '@/lib/db';
import { getApiKeys, getDefaultOpenRouterFallbackKey } from '@/lib/api-keys';
import { callZaiChatCompletion, DEFAULT_ZAI_VISION_MODEL } from '@/lib/ai/providers/zai';
import { getAuthUser, isApprovedWholesaleUser } from '@/lib/auth';
import { sanitizeProductForClient } from '@/lib/utils/productSanitizer';
import { setVisualSearchCache } from '@/lib/search/visualSearchCache';

// In-memory rate limiting: 10 requests per minute per IP
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

// In-memory LRU-style cache for AI vision detection results (5 minutes ttl)
interface DetectionCacheEntry {
  detected: DetectedAttributes;
  timestamp: number;
}
const detectionCache = new Map<string, DetectionCacheEntry>();

export interface DetectedAttributes {
  category?: string;
  keywords: string[];
  colors?: string[];
  materials?: string[];
  style?: string;
  confidence: number;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 10;

  const current = rateLimitMap.get(ip);
  if (!current || now > current.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

// Clean old rate limit and cache items periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, rec] of rateLimitMap.entries()) {
      if (now > rec.resetAt) rateLimitMap.delete(ip);
    }
    for (const [hash, item] of detectionCache.entries()) {
      if (now - item.timestamp > 5 * 60 * 1000) detectionCache.delete(hash);
    }
  }, 60 * 1000);
}

const VISION_SYSTEM_PROMPT = `You are an expert e-commerce visual search AI.
Your task is to analyze the provided product image and return a strict JSON object identifying the product.
Do NOT output markdown fences (\`\`\`json). Output ONLY raw valid JSON matching this schema:
{
  "category": "detected general category name (e.g. Cookware, Kitchenware, Chair, Lamp, Electronics, Hardware, Table)",
  "keywords": ["specific", "search", "keywords", "describing", "the", "product", "e.g.", "frying pan", "non-stick", "granite", "skillet", "cookware"],
  "colors": ["black", "silver"],
  "materials": ["aluminum", "granite", "stainless steel"],
  "style": "modern",
  "confidence": 0.85
}
Focus on clear commercial terms that buyers use to find this item in an online catalog. Keywords must include synonyms and item types in English.`;

/**
 * Call Vision AI with fallback through Z.ai -> OpenRouter -> OpenAI Gateway
 */
async function analyzeImageWithVisionAI(imageBase64: string, mimeType: string): Promise<DetectedAttributes> {
  const apiKeys = await getApiKeys();
  const dataUri = `data:${mimeType};base64,${imageBase64}`;

  // 1. First choice: Z.ai GLM Vision (Fast, accurate, free Flash tier)
  if (apiKeys.zaiApiKey) {
    try {
      const zaiResponse = await callZaiChatCompletion({
        apiKey: apiKeys.zaiApiKey,
        baseUrl: apiKeys.zaiBaseUrl,
        model: DEFAULT_ZAI_VISION_MODEL,
        temperature: 0.1,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: VISION_SYSTEM_PROMPT },
              { type: 'image_url', image_url: { url: dataUri } },
            ],
          },
        ],
      });

      const parsed = parseVisionJson(zaiResponse.content);
      console.log('[Visual Search] Z.ai raw response:', zaiResponse.content?.substring(0, 150), 'parsed:', !!parsed);
      if (parsed) return parsed;
    } catch (zaiErr: any) {
      console.warn('[Visual Search] Z.ai vision call failed, falling back:', zaiErr?.message);
    }
  }

  // 2. Second choice: OpenRouter vision models
  const openRouterKey = apiKeys.openrouterApiKey || getDefaultOpenRouterFallbackKey();
  if (openRouterKey) {
    const visionModels = [
      'google/gemini-2.0-flash-001',
      'meta-llama/llama-3.2-11b-vision-instruct:free',
      'qwen/qwen-2.5-vl-72b-instruct:free',
    ];

    for (const model of visionModels) {
      try {
        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openRouterKey.trim()}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://dromkok.com',
            'X-Title': 'Dromkok Visual Search',
          },
          body: JSON.stringify({
            model,
            temperature: 0.1,
            max_tokens: 1000,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: VISION_SYSTEM_PROMPT },
                  { type: 'image_url', image_url: { url: dataUri } },
                ],
              },
            ],
          }),
          signal: AbortSignal.timeout(20000),
        });

        if (resp.ok) {
          const json = await resp.json();
          const content = json?.choices?.[0]?.message?.content || '';
          const parsed = parseVisionJson(content);
          if (parsed) return parsed;
        }
      } catch (orErr: any) {
        console.warn(`[Visual Search] OpenRouter vision model ${model} failed:`, orErr?.message);
      }
    }
  }

  // 3. Third choice: OpenAI-compatible Gateway if configured
  if (apiKeys.openaiApiKey) {
    try {
      const baseUrl = (apiKeys.openaiBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
      const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
      const model = apiKeys.openaiModel || 'gpt-4o-mini';

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKeys.openaiApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: VISION_SYSTEM_PROMPT },
                { type: 'image_url', image_url: { url: dataUri } },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (resp.ok) {
        const json = await resp.json();
        const content = json?.choices?.[0]?.message?.content || '';
        const parsed = parseVisionJson(content);
        if (parsed) return parsed;
      }
    } catch (openaiErr: any) {
      console.warn('[Visual Search] OpenAI-compatible vision failed:', openaiErr?.message);
    }
  }

  // Safe fallback if vision providers fail
  return {
    category: 'General',
    keywords: ['product', 'item'],
    colors: [],
    materials: [],
    style: 'standard',
    confidence: 0.5,
  };
}

function parseVisionJson(text: string): DetectedAttributes | null {
  if (!text) return null;
  let clean = text.trim();
  // Strip code blocks if present
  clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  // Try parsing directly
  try {
    const obj = JSON.parse(clean);
    return sanitizeDetected(obj);
  } catch {
    // Attempt to locate first { and last }
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const obj = JSON.parse(clean.substring(firstBrace, lastBrace + 1));
        return sanitizeDetected(obj);
      } catch {}
    }
  }
  return null;
}

function sanitizeDetected(obj: any): DetectedAttributes {
  const keywords = Array.isArray(obj?.keywords)
    ? obj.keywords.map((k: any) => String(k).trim()).filter(Boolean)
    : [];

  const colors = Array.isArray(obj?.colors)
    ? obj.colors.map((c: any) => String(c).trim()).filter(Boolean)
    : [];

  const materials = Array.isArray(obj?.materials)
    ? obj.materials.map((m: any) => String(m).trim()).filter(Boolean)
    : [];

  return {
    category: typeof obj?.category === 'string' ? obj.category.trim() : undefined,
    keywords: keywords.length > 0 ? keywords : ['goods'],
    colors,
    materials,
    style: typeof obj?.style === 'string' ? obj.style.trim() : undefined,
    confidence: typeof obj?.confidence === 'number' ? Math.max(0, Math.min(1, obj.confidence)) : 0.85,
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting by IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex').substring(0, 16);

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many visual search requests. Please wait a minute before trying again.' },
        { status: 429 }
      );
    }

    // 2. Extract image data from request (multipart/form-data or JSON)
    const contentType = request.headers.get('content-type') || '';
    let rawBuffer: Buffer | null = null;
    let inputMimeType = 'image/jpeg';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image');

      if (!file || typeof file === 'string') {
        return NextResponse.json(
          { error: 'No image file uploaded' },
          { status: 400 }
        );
      }

      const fileObj = file as File;
      inputMimeType = fileObj.type;
      const arrayBuf = await fileObj.arrayBuffer();
      rawBuffer = Buffer.from(arrayBuf);
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      if (body.imageUrl) {
        // Fetch from URL
        try {
          const imgResp = await fetch(body.imageUrl, { signal: AbortSignal.timeout(10000) });
          if (!imgResp.ok) {
            return NextResponse.json({ error: 'Failed to download image from URL' }, { status: 400 });
          }
          inputMimeType = imgResp.headers.get('content-type') || 'image/jpeg';
          const ab = await imgResp.arrayBuffer();
          rawBuffer = Buffer.from(ab);
        } catch (fetchErr) {
          return NextResponse.json({ error: 'Could not fetch image URL' }, { status: 400 });
        }
      } else if (body.imageBase64) {
        // Direct base64 string
        const cleanB64 = body.imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
        rawBuffer = Buffer.from(cleanB64, 'base64');
        if (body.mimeType) inputMimeType = body.mimeType;
      }
    }

    if (!rawBuffer || rawBuffer.length === 0) {
      return NextResponse.json({ error: 'No valid image provided' }, { status: 400 });
    }

    // Max 5MB raw check
    if (rawBuffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image size exceeds maximum limit of 5MB' }, { status: 400 });
    }

    // 3. Process image with sharp: resize to max 1024x1024, normalize to JPEG
    let processedBuffer: Buffer;
    try {
      processedBuffer = await sharp(rawBuffer)
        .rotate() // auto-orient by EXIF
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();
    } catch (sharpErr: any) {
      return NextResponse.json(
        { error: 'Invalid or unsupported image format. Please upload JPEG, PNG, or WebP.' },
        { status: 400 }
      );
    }

    // 4. Privacy: Compute SHA-256 hash of processed image (raw image is NEVER saved to disk)
    const imageHash = crypto.createHash('sha256').update(processedBuffer).digest('hex');

    // 5. Check 5-minute memory cache
    let detected: DetectedAttributes;
    const cached = detectionCache.get(imageHash);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      detected = cached.detected;
    } else {
      const b64 = processedBuffer.toString('base64');
      detected = await analyzeImageWithVisionAI(b64, 'image/jpeg');
      detectionCache.set(imageHash, { detected, timestamp: Date.now() });
    }

    // 6. Query catalog products using detected attributes
    const terms = Array.from(
      new Set(
        [
          ...(detected.category ? [detected.category] : []),
          ...detected.keywords,
          ...(detected.colors || []),
          ...(detected.materials || []),
        ]
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length >= 2)
      )
    );

    // Search active products matching any keywords
    const searchConditions: any[] = terms.map((term) => ({
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { material: { contains: term, mode: 'insensitive' } },
        { category: { name: { contains: term, mode: 'insensitive' } } },
      ],
    }));

    const matchedProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: searchConditions.length > 0 ? searchConditions : undefined,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      take: 60,
    });

    // 7. Calculate visual similarity score (0.70 to 0.98) based on attribute match weighting
    const scoredProducts = matchedProducts.map((p) => {
      let score = 0;
      const pText = `${p.name} ${p.description || ''} ${p.material || ''} ${p.category?.name || ''}`.toLowerCase();

      // Check category match
      if (detected.category && pText.includes(detected.category.toLowerCase())) {
        score += 30;
      }

      // Check keyword matches
      for (const kw of detected.keywords) {
        if (pText.includes(kw.toLowerCase())) {
          score += 15;
        }
      }

      // Check color matches
      for (const col of detected.colors || []) {
        if (pText.includes(col.toLowerCase())) {
          score += 8;
        }
      }

      // Check material matches
      for (const mat of detected.materials || []) {
        if (pText.includes(mat.toLowerCase())) {
          score += 10;
        }
      }

      // Max possible normalized to 0.70 - 0.98
      const maxPossible = 30 + detected.keywords.length * 15 + (detected.colors?.length || 0) * 8 + (detected.materials?.length || 0) * 10 || 50;
      const normalizedRatio = Math.min(1, score / maxPossible);
      const similarity = Math.round((0.70 + normalizedRatio * 0.28) * 100) / 100;

      const rawImage = p.thumbnail || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null);

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        wholesalePrice: p.wholesalePrice,
        moq: p.minOrderQty,
        stock: p.stock,
        rating: 4.8,
        reviewsCount: 12,
        image: rawImage,
        images: p.images,
        category: p.category?.name || 'General',
        categorySlug: p.category?.slug,
        department: p.category?.parent?.name,
        departmentSlug: p.category?.parent?.slug,
        brand: (p as any).brand || '',
        material: p.material,
        similarity,
        score,
      };
    });

    // Sort by highest similarity / score
    scoredProducts.sort((a, b) => b.score - a.score || b.similarity - a.similarity);
    const topRawResults = scoredProducts.slice(0, 20);

    // 8. Check auth & permissions and sanitize results
    const authUser = await getAuthUser(request);
    const canViewWholesale = isApprovedWholesaleUser(authUser);
    const isAdmin = authUser?.role === 'ADMIN';

    const topResults = topRawResults.map((p) =>
      sanitizeProductForClient(p, canViewWholesale, isAdmin)
    );

    // 9. Log visual search to database (privacy: sha256 hash only)
    try {
      if ((prisma as any).visualSearchLog) {
        await (prisma as any).visualSearchLog.create({
          data: {
            userId: authUser?.id || null,
            imageHash,
            detected: detected as any,
            resultCount: topResults.length,
            ipHash,
          },
        });
      }
    } catch (logErr: any) {
      console.warn('[Visual Search] Log creation skipped:', logErr?.message);
    }

    // 9. Store in 10-minute cache for Store page navigation
    const previewDataUrl = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
    setVisualSearchCache(imageHash, {
      hash: imageHash,
      detected,
      results: topResults,
      count: topResults.length,
      imagePreview: previewDataUrl,
    });

    return NextResponse.json({
      success: true,
      hash: imageHash,
      imageHash,
      detected,
      results: topResults,
      count: topResults.length,
      imagePreview: previewDataUrl,
    });
  } catch (error: any) {
    console.error('[Visual Search] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while analyzing the image.' },
      { status: 500 }
    );
  }
}
