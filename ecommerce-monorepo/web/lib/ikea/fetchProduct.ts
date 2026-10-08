import * as cheerio from 'cheerio'
import { prisma } from '@/lib/db'
import { IkeaProduct, IkeaFetchError } from './types'

/**
 * Normalizes IKEA item numbers by stripping dots, spaces, hyphens, and leading 's' prefix
 * e.g. "304.432.55" -> "30443255", "s503.275.80" -> "50327580"
 */
export function cleanIkeaItemNumber(raw: string): string {
  if (!raw) return ''
  let cleaned = raw.trim().replace(/[\s.-]/g, '')
  if (cleaned.toLowerCase().startsWith('s') && cleaned.length >= 8) {
    cleaned = cleaned.substring(1)
  }
  return cleaned
}

/**
 * Formats an 8-digit item number into standard dot-separated IKEA format: "304.432.55"
 */
export function formatIkeaItemNumber(clean: string): string {
  if (clean.length === 8 && /^\d+$/.test(clean)) {
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 8)}`
  }
  return clean
}

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'

interface FetchOptions {
  locale?: string // e.g. 'us/en' or 'gb/en'
  skipCache?: boolean
  maxRetries?: number
}

/**
 * Sleep helper for delays and exponential backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Composes a full comprehensive IKEA product description preserving all
 * real details (overview summary, key features bullets, good to know,
 * materials, care instructions, packaging, designer, compliance).
 */
export function buildComprehensiveIkeaDescription(data: {
  overviewSummary?: string
  description?: string
  keyFeatures?: string[]
  goodToKnow?: string
  materials?: string
  careInstructions?: string
  packagingList?: Array<{ name?: string; width?: string; height?: string; length?: string; weight?: string }>
  designer?: string
  compliance?: string
}): string {
  const sections: string[] = []

  // 1. Overview summary or base description
  const primaryText = (data.overviewSummary || data.description || '').trim()
  if (primaryText) {
    sections.push(primaryText)
  }

  // 2. Key features
  if (data.keyFeatures && data.keyFeatures.length > 0) {
    sections.push(`Key features:\n• ${data.keyFeatures.join('\n• ')}`)
  }

  // 3. Good to know / Package contents
  if (data.goodToKnow && data.goodToKnow.trim()) {
    sections.push(`Good to know:\n${data.goodToKnow.trim()}`)
  }

  // 4. Materials & Care (if present)
  const matCareLines: string[] = []
  if (data.materials && data.materials.trim()) {
    matCareLines.push(`• Materials: ${data.materials.trim()}`)
  }
  if (data.careInstructions && data.careInstructions.trim()) {
    matCareLines.push(`• Care: ${data.careInstructions.trim()}`)
  }
  if (matCareLines.length > 0) {
    sections.push(`Materials & Care:\n${matCareLines.join('\n')}`)
  }

  // 5. Packaging details
  if (data.packagingList && data.packagingList.length > 0) {
    const pkgLines = data.packagingList
      .map((pkg, idx) => {
        const parts: string[] = []
        if (pkg.name) parts.push(pkg.name)
        if (pkg.width) parts.push(`Width: ${pkg.width}`)
        if (pkg.height) parts.push(`Height: ${pkg.height}`)
        if (pkg.length) parts.push(`Length: ${pkg.length}`)
        if (pkg.weight) parts.push(`Weight: ${pkg.weight}`)
        return (data.packagingList!.length > 1 ? `Package ${idx + 1}: ` : '') + parts.join(', ')
      })
      .filter((line) => line.length > 0)

    if (pkgLines.length > 0) {
      sections.push(`Packaging details:\n${pkgLines.join('\n')}`)
    }
  }

  // 6. Designer
  if (data.designer && data.designer.trim()) {
    sections.push(`Designer:\n${data.designer.trim()}`)
  }

  // 7. Compliance
  if (data.compliance && data.compliance.trim()) {
    sections.push(`Compliance & Safety:\n${data.compliance.trim()}`)
  }

  return sections.join('\n\n')
}

/**
 * Parses raw IKEA product HTML string into structured IkeaProduct
 */
export function parseIkeaHtml(html: string, canonicalUrl: string, cleanNum: string): IkeaProduct {
  const $ = cheerio.load(html)

  // 1. Extract JSON-LD microdata if present
  let jsonLdProduct: any = null
  $('script[type="application/ld+json"]').each((_, elem) => {
    try {
      const parsed = JSON.parse($(elem).text().trim())
      if (parsed['@type'] === 'Product') {
        jsonLdProduct = parsed
      } else if (Array.isArray(parsed)) {
        const found = parsed.find((item: any) => item['@type'] === 'Product')
        if (found) jsonLdProduct = found
      }
    } catch {
      // ignore invalid json-ld blocks
    }
  })

  // 2. Product Name & Type Name
  let name = ''
  let typeName = ''

  const h1Title = $('h1.pip-header-section__title, .pip-header-section__title--big, .pip-header-section__title')
    .first()
    .text()
    .trim()
  const typeText = $('.pip-header-section__description-text, .pip-header-section__sub-title')
    .first()
    .text()
    .trim()

  if (h1Title) {
    name = h1Title
    typeName = typeText
  } else if (jsonLdProduct?.name) {
    name = jsonLdProduct.name
  } else {
    // Fallback to title tag
    const titleTag = $('title').text()
    name = titleTag.split('-')[0]?.trim() || `IKEA Item ${cleanNum}`
  }

  // 3. Description
  let description = ''
  const detailsDesc = $(
    '.pip-product-details__paragraph, .pip-product-summary__description, [data-testid="product-summary"]'
  )
    .first()
    .text()
    .trim()
  if (detailsDesc) {
    description = detailsDesc
  } else if (jsonLdProduct?.description) {
    description = jsonLdProduct.description
  } else {
    description = $('meta[name="description"]').attr('content') || ''
  }

  // 4. Breadcrumbs & Category
  const breadcrumbs: string[] = []
  $('.pip-breadcrumbs__list li a, nav[aria-label="Breadcrumb"] a, .pip-breadcrumb__item a').each((_, elem) => {
    const text = $(elem).text().trim()
    if (text && text.toLowerCase() !== 'home') {
      breadcrumbs.push(text)
    }
  })

  if (breadcrumbs.length === 0 && jsonLdProduct?.category) {
    if (Array.isArray(jsonLdProduct.category)) {
      breadcrumbs.push(...jsonLdProduct.category)
    } else if (typeof jsonLdProduct.category === 'string') {
      breadcrumbs.push(...jsonLdProduct.category.split('>').map((c: string) => c.trim()))
    }
  }

  const categoryName = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : 'Furniture'

  // 5. Price & Currency
  let price = 0
  let currency = 'USD'
  let familyPrice: number | null = null

  if (jsonLdProduct?.offers) {
    const offers = Array.isArray(jsonLdProduct.offers) ? jsonLdProduct.offers[0] : jsonLdProduct.offers
    if (offers.price) {
      price = parseFloat(offers.price)
    }
    if (offers.priceCurrency) {
      currency = offers.priceCurrency
    }
  }

  if (price === 0) {
    const priceText = $('.pip-temp-price__sr-text, .pip-price__sr-text, .pip-temp-price__integer').first().text()
    const numericMatch = priceText.match(/[\d]+([.,]\d{2})?/)
    if (numericMatch) {
      price = parseFloat(numericMatch[0].replace(',', '.'))
    }
  }

  const famPriceText = $('.pip-family-price, .pip-price--family').first().text()
  if (famPriceText) {
    const match = famPriceText.match(/[\d]+([.,]\d{2})?/)
    if (match) familyPrice = parseFloat(match[0].replace(',', '.'))
  }

  // 6. Tabs Extraction: Overview, Product details, Measurements
  const specs: Record<string, string> = {}
  const measurements: Record<string, string> = {}
  const materialsAndCare: Record<string, string> = {}

  // --- TAB 1: OVERVIEW ---
  const overviewEl = $('#overview, .pipf-overview-tab')
  let overviewSummary = overviewEl
    .find('.pipf-overview-summary')
    .text()
    .replace(/^.*?\d{3}\.\d{3}\.\d{2}\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!overviewSummary) {
    overviewSummary = overviewEl.find('p').first().text().replace(/\s+/g, ' ').trim()
  }
  if (!overviewSummary) {
    overviewSummary = description
  }

  const overviewFeatures: string[] = []
  overviewEl
    .find('.pipf-overview-tab__badges span, .pipf-badge, [data-testid*="badge"]')
    .each((_, el) => {
      const text = $(el).text().trim()
      if (text) overviewFeatures.push(text)
    })

  if (overviewSummary) {
    specs['Overview'] = overviewSummary
  }

  // --- TAB 2: PRODUCT DETAILS ---
  const detailsEl = $('#product-details, .pipf-product-details-tab')

  // Key Features / Bullets
  const keyFeatures: string[] = []
  $(
    '#product-description-expander p, #product-description-expander li, #product-details .pipf-product-details__summary p, #product-details ul li'
  ).each((_, el) => {
    const t = $(el).text().replace(/\s+/g, ' ').trim()
    if (t && !t.startsWith('Designer') && !t.startsWith('Show more') && t.length > 10) {
      if (!keyFeatures.includes(t)) {
        keyFeatures.push(t)
      }
    }
  })

  // Good to know / What's included
  let goodToKnow = $(
    '#SEC_product-details-good-to-know, [id*="good-to-know"], .pip-product-details__section:contains("Good to know")'
  )
    .text()
    .replace(/^Good to know\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (goodToKnow) {
    specs['Good to know'] = goodToKnow
  }

  // Materials
  let materials = ''
  const matCareEl = $('#SEC_product-details-material-and-care, [id*="material-and-care"]')
  if (matCareEl.length > 0) {
    const fullMatText = matCareEl.text().replace(/\s+/g, ' ').trim()
    const partsMatch = fullMatText.match(/(?:Material\s+)?Main parts\s*:\s*(.*?)(?=\s*Care|\s*California|\s*Assembly|$)/i)
    if (partsMatch) {
      materials = 'Main parts: ' + partsMatch[1].trim()
    } else {
      const genericMat = fullMatText.match(/\bMaterial\b\s*(?:Main parts:)?\s*(.*?)(?=\s*Care|\s*California|\s*Assembly|$)/i)
      if (genericMat) materials = genericMat[1].trim()
    }
  }
  if (!materials) {
    materials = $(
      '.pip-product-details__materials, [data-testid="materials-and-care"], .pipf-material-and-care__material'
    )
      .text()
      .replace(/\s+/g, ' ')
      .trim()
  }

  if (materials) {
    materialsAndCare['Materials'] = materials
    specs['Materials'] = materials
  }

  // Care instructions
  let careInstructions = ''
  if (matCareEl.length > 0) {
    const fullCareText = matCareEl.text().replace(/\s+/g, ' ').trim()
    const careMatch = fullCareText.match(/\bCare\b\s*(.*?)(?=\s*California|\s*Assembly|$)/i)
    if (careMatch) careInstructions = careMatch[1].trim()
  }
  if (!careInstructions) {
    careInstructions = $(
      '.pip-product-details__care-instructions, .pip-product-details__care, .pipf-material-and-care__care'
    )
      .text()
      .replace(/\s+/g, ' ')
      .trim()
  }

  if (careInstructions) {
    materialsAndCare['Care instructions'] = careInstructions
    specs['Care instructions'] = careInstructions
  }

  // Compliance (e.g. California AB 1200 / Safety)
  let compliance = ''
  if (matCareEl.length > 0) {
    const compMatch = matCareEl
      .text()
      .replace(/\s+/g, ' ')
      .match(/(California AB 1200.*?)(?=Assembly|$)/i)
    if (compMatch) compliance = compMatch[1].trim()
  }

  // Designer
  let designer: string | undefined
  const designerText = $(
    '.pip-product-details__designer, [data-testid="designer-info"], #product-details'
  ).text()
  const designerMatch = designerText.match(/Designer:?\s*([A-Za-z\s]+?)(?:Show more|Good to know|Materials|$)/i)
  if (designerMatch) {
    designer = designerMatch[1].trim()
    specs['Designer'] = designer
  }

  // --- TAB 3: MEASUREMENTS & PACKAGING ---
  // Parse standard measurements accordion / dl
  $('.pip-product-dimensions__dimension-container, .pip-product-dimensions dl, dl.pip-product-details__specifications').each(
    (_, container) => {
      $(container)
        .find('dt, .pip-product-dimensions__label')
        .each((i, dtElem) => {
          const key = $(dtElem).text().replace(/:$/, '').trim()
          const ddElem = $(dtElem).next('dd, .pip-product-dimensions__value')
          const val = ddElem.text().trim()
          if (key && val) {
            measurements[key] = val
            specs[key] = val
          }
        })
    }
  )

  // Direct dimension paragraphs: e.g. "Width: 160 cm"
  $('.pip-product-dimensions__paragraph, .pip-product-dimensions p, #measurements p').each((_, p) => {
    const text = $(p).text().trim()
    const colonIdx = text.indexOf(':')
    if (colonIdx > 0 && colonIdx < 50) {
      const key = text.slice(0, colonIdx).trim()
      const val = text.slice(colonIdx + 1).trim()
      if (key && val && !key.toLowerCase().includes('package')) {
        specs[key] = val
        if (/width|length|height|depth|weight|diameter|thickness|size|volume/i.test(key)) {
          measurements[key] = val
        }
      }
    }
  })

  // Packaging measurements: Width, Height, Length, Weight from #SEC_measurements-packaging / .pipf-measurements-tab__package
  const packagingList: Array<{
    name?: string
    articleNumber?: string
    width?: string
    height?: string
    length?: string
    weight?: string
  }> = []

  $('#SEC_measurements-packaging, .pipf-measurements-tab__package').each((_, pkg) => {
    const pkgText = $(pkg).text().replace(/\s+/g, ' ')
    const widthMatch = pkgText.match(/Width:\s*([^H\n\r]+?)(?=Height:|$)/i)
    const heightMatch = pkgText.match(/Height:\s*([^L\n\r]+?)(?=Length:|$)/i)
    const lengthMatch = pkgText.match(/Length:\s*([^W\n\r]+?)(?=Weight:|$)/i)
    const weightMatch = pkgText.match(/Weight:\s*([^\n\r]+)/i)

    if (widthMatch || heightMatch || lengthMatch || weightMatch) {
      const widthVal = widthMatch ? widthMatch[1].trim() : undefined
      const heightVal = heightMatch ? heightMatch[1].trim() : undefined
      const lengthVal = lengthMatch ? lengthMatch[1].trim() : undefined
      const weightVal = weightMatch ? weightMatch[1].trim() : undefined

      packagingList.push({
        width: widthVal,
        height: heightVal,
        length: lengthVal,
        weight: weightVal
      })

      if (widthVal && !specs['Package width']) specs['Package width'] = widthVal
      if (heightVal && !specs['Package height']) specs['Package height'] = heightVal
      if (lengthVal && !specs['Package length']) specs['Package length'] = lengthVal
      if (weightVal && !specs['Package weight']) {
        specs['Package weight'] = weightVal
        specs['Weight'] = weightVal
      }
    }
  })

  // 7. Images
  const imageSet = new Set<string>()

  // JSON-LD images
  if (jsonLdProduct?.image) {
    const ldImages = Array.isArray(jsonLdProduct.image) ? jsonLdProduct.image : [jsonLdProduct.image]
    ldImages.forEach((img: string) => {
      if (img && typeof img === 'string') imageSet.add(img)
    })
  }

  // Cheerio images
  $('img.pip-image, img.pip-media-grid__media-image, .pip-media-grid img').each((_, img) => {
    let src = $(img).attr('src') || $(img).attr('data-src')
    if (src && src.startsWith('http')) {
      // Remove thumbnail scaling query if present to get high-res
      src = src.replace(/\?f=s.*$/, '?f=xl').replace(/\?f=xxs.*$/, '?f=xl')
      imageSet.add(src)
    }
  })

  const ogImage = $('meta[property="og:image"]').attr('content')
  if (ogImage && ogImage.startsWith('http')) {
    imageSet.add(ogImage)
  }

  const images = Array.from(imageSet)
  const mainImage = images[0] || 'https://www.ikea.com/us/en/static/ikea-logo.svg'

  // 8. Availability
  const statusText = $('.pip-product-availability, [data-testid="stock-information"]').first().text().trim()
  const inStock = jsonLdProduct?.offers?.availability?.includes('InStock') || !/out of stock|not available/i.test(statusText)

  const fullDescription = buildComprehensiveIkeaDescription({
    overviewSummary,
    description,
    keyFeatures,
    goodToKnow,
    materials,
    careInstructions,
    packagingList,
    designer,
    compliance
  })

  return {
    itemNumber: formatIkeaItemNumber(cleanNum),
    cleanItemNumber: cleanNum,
    name: name || `IKEA Item ${cleanNum}`,
    typeName: typeName || undefined,
    description: fullDescription,
    categoryBreadcrumbs: breadcrumbs,
    categoryName,
    price: price || 0,
    currency,
    familyPrice,
    availability: {
      inStock,
      statusText: statusText || (inStock ? 'In stock' : 'Check availability')
    },
    mainImage,
    images: images.length > 0 ? images : [mainImage],
    specs,
    measurements,
    materialsAndCare,
    designer,
    url: canonicalUrl,
    rawJson: jsonLdProduct,

    // Three official tabs
    overview: {
      summary: overviewSummary,
      features: overviewFeatures
    },
    productDetails: {
      description,
      keyFeatures,
      goodToKnow,
      materials,
      careInstructions,
      designer,
      compliance
    },
    measurementsTab: {
      dimensions: measurements,
      packaging: packagingList
    }
  }
}

/**
 * Fetches an IKEA product by item number.
 * Features:
 * - 24-hour database caching via IkeaFetchCache
 * - Polite delay + exponential backoff retry on 429/503
 * - Canonical and fallback URL resolution
 */
export async function fetchIkeaProduct(
  rawItemNumber: string,
  options: FetchOptions = {}
): Promise<IkeaProduct> {
  const cleanNum = cleanIkeaItemNumber(rawItemNumber)
  if (!cleanNum) {
    const error: IkeaFetchError = {
      itemNumber: rawItemNumber,
      status: 'NOT_FOUND',
      reason: 'Invalid or empty IKEA item number provided',
      retryable: false
    }
    throw error
  }

  const { locale = 'us/en', skipCache = false, maxRetries = 3 } = options

  // 1. Check database cache within 24 hours
  if (!skipCache) {
    try {
      const cache = await prisma.ikeaFetchCache.findUnique({
        where: { itemNumber: cleanNum }
      })

      if (cache) {
        const cacheAgeMs = Date.now() - new Date(cache.fetchedAt).getTime()
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

        if (cacheAgeMs < TWENTY_FOUR_HOURS) {
          if (cache.html) {
            return parseIkeaHtml(cache.html, cache.url, cleanNum)
          } else if (cache.json) {
            return cache.json as unknown as IkeaProduct
          }
        }
      }
    } catch (dbErr) {
      console.warn('[IKEA Cache] Warning checking cache:', dbErr)
    }
  }

  // 2. Candidate URLs to resolve
  // IKEA canonical URLs typically match: https://www.ikea.com/us/en/p/-30443255/ or /gb/en/p/-30443255/
  const candidateUrls = [
    `https://www.ikea.com/${locale}/p/-${cleanNum}/`,
    `https://www.ikea.com/${locale}/products/${cleanNum}.json`,
    `https://www.ikea.com/gb/en/p/-${cleanNum}/`
  ]

  let lastStatus = 0
  let lastHtml = ''
  let resolvedUrl = ''

  for (const targetUrl of candidateUrls) {
    let attempt = 0
    let success = false

    while (attempt <= maxRetries) {
      try {
        // Respectful delay between network requests
        if (attempt > 0) {
          const backoffDelay = Math.pow(2, attempt) * 1000
          await sleep(backoffDelay)
        }

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 12000)

        const response = await fetch(targetUrl, {
          headers: {
            'User-Agent': DEFAULT_USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal
        })

        clearTimeout(timeout)
        lastStatus = response.status

        if (response.ok) {
          const contentType = response.headers.get('content-type') || ''
          if (contentType.includes('application/json')) {
            const jsonData = await response.json()
            // Convert product JSON to IkeaProduct if from json endpoint
            resolvedUrl = targetUrl
            lastHtml = JSON.stringify(jsonData)
            success = true
            break
          } else {
            lastHtml = await response.text()
            resolvedUrl = response.url || targetUrl
            success = true
            break
          }
        } else if (response.status === 404) {
          // Break inner loop and try next candidate URL
          break
        } else if (response.status === 429 || response.status === 503) {
          attempt++
          continue
        } else {
          // other HTTP errors
          break
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          attempt++
          continue
        }
        attempt++
      }
    }

    if (success && lastHtml) {
      break
    }
  }

  // 3. Handle failure cases
  if (!lastHtml || lastStatus === 404) {
    const error: IkeaFetchError = {
      itemNumber: rawItemNumber,
      status: lastStatus === 404 ? 'NOT_FOUND' : 'FETCH_FAILED',
      reason: lastStatus === 404 ? `IKEA product with item number ${rawItemNumber} not found.` : `Failed to fetch IKEA product (HTTP ${lastStatus}).`,
      retryable: lastStatus === 429 || lastStatus === 503
    }
    throw error
  }

  // 4. Parse the result
  let parsedProduct: IkeaProduct
  try {
    parsedProduct = parseIkeaHtml(lastHtml, resolvedUrl, cleanNum)
  } catch (parseErr: any) {
    const error: IkeaFetchError = {
      itemNumber: rawItemNumber,
      status: 'PARSE_FAILED',
      reason: `Failed to parse IKEA product markup: ${parseErr.message}`,
      retryable: false
    }
    throw error
  }

  // 5. Save to Prisma cache
  try {
    await prisma.ikeaFetchCache.upsert({
      where: { itemNumber: cleanNum },
      create: {
        itemNumber: cleanNum,
        url: resolvedUrl,
        html: lastHtml,
        json: parsedProduct as any,
        fetchedAt: new Date()
      },
      update: {
        url: resolvedUrl,
        html: lastHtml,
        json: parsedProduct as any,
        fetchedAt: new Date()
      }
    })
  } catch (cacheSaveErr) {
    console.warn('[IKEA Cache] Failed to persist cache:', cacheSaveErr)
  }

  return parsedProduct
}
