/**
 * Shared utility to resolve and split Swedish product name vs English product name.
 * 
 * Priority:
 * 1. Explicit admin/database values:
 *    - If swedenName is entered (e.g. "Nordic"), Line 1 = "Nordic"
 *    - If englishName is entered (e.g. "Nordic Low TV"), Line 2 = "Nordic Low TV"
 *    Never strip or mutate explicitly entered names!
 * 
 * 2. Automated fallback (only when explicit values are absent):
 *    - Recognize Swedish collections / IKEA names from product.name
 *    - Line 1 = Swedish name
 *    - Line 2 = English description / product type
 */

export interface ProductDisplayNames {
  swedenName: string | null
  englishName: string
}

export function getProductDisplayNames(product: {
  name?: string | null
  swedenName?: string | null
  englishName?: string | null
  rawIkeaPayload?: any
  attributes?: any
}): ProductDisplayNames {
  if (!product) {
    return { swedenName: null, englishName: '' }
  }

  const rawIkea = product.rawIkeaPayload || {}
  const rawName = (product.name || '').trim()
  const rawIkeaName = typeof rawIkea.name === 'string' ? rawIkea.name.trim() : ''

  // 1. Check explicit fields set in DB, admin form, or attributes
  const explicitSw = (
    product.swedenName ||
    rawIkea.swedenName ||
    rawIkea.productDetails?.swedenName ||
    product.attributes?.sweden_name ||
    product.attributes?.swedenName ||
    ''
  ).trim()

  // 2. Explicit English Name
  // If product.name was updated/customized (differs from rawIkea.englishName and rawIkeaName),
  // product.name is the authoritative live source of truth from the database!
  let explicitEn = (product.englishName || '').trim()
  const rawIkeaEn = (rawIkea.englishName || rawIkea.productDetails?.englishName || '').trim()

  // If explicitEn is identical to stale rawIkeaEn, but rawName was edited/updated,
  // prioritize the fresh rawName!
  if (explicitEn && rawIkeaEn && explicitEn === rawIkeaEn && rawName && rawName !== rawIkeaEn && rawName !== rawIkeaName) {
    explicitEn = rawName
  }

  if (!explicitEn) {
    if (rawName && rawIkeaEn && rawName !== rawIkeaEn && rawName !== rawIkeaName) {
      explicitEn = rawName
    } else {
      explicitEn = (
        rawIkeaEn ||
        product.attributes?.english_name ||
        product.attributes?.englishName ||
        rawName ||
        ''
      ).trim()
    }
  }

  // If explicitEn is virtually identical to explicitSw (e.g. Swedish name was copied into English field),
  // try to use real English name from rawIkeaEn if available.
  if (explicitSw && explicitEn) {
    const normSw = explicitSw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
    const normEn = explicitEn.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
    if (normSw && normEn && normSw === normEn && rawIkeaEn && rawIkeaEn.toLowerCase() !== explicitSw.toLowerCase()) {
      explicitEn = rawIkeaEn
    }
  }

  // If explicit swedenName and/or englishName are provided, RESPECT THEM DIRECTLY!
  if (explicitSw || explicitEn) {
    return {
      swedenName: explicitSw || null,
      englishName: explicitEn || rawName
    }
  }

  // 2. Automated fallback: parse from product.name when no explicit values exist
  let sw: string | null = null
  let en: string | null = null

  if (rawName) {
    // Pattern A: Name ends with ALL-CAPS Swedish code after hyphen/dash
    // e.g. "Danish Sleek Storage combination - GULDDRAGARE"
    const endCapsMatch = rawName.match(/^(.*?)\s+[-–—]\s+([A-ZÅÄÖØÆÉÈÜ0-9]{2,})$/u)
    if (endCapsMatch) {
      sw = endCapsMatch[2].trim()
      en = endCapsMatch[1].trim()
    }
  }

  if (!sw && rawName) {
    // Pattern B: Name starts with ALL-CAPS Swedish series name
    // e.g. "GULDÖRING 7-piece cookware set", "BILLY Bookcase with doors"
    const startCapsMatch = rawName.match(/^([A-ZÅÄÖØÆÉÈÜ0-9]{2,})(?:\s+[-–—]\s+|\s+)(.*)$/u)
    if (startCapsMatch) {
      sw = startCapsMatch[1].trim()
      en = startCapsMatch[2].trim()
    }
  }

  if (!sw && rawName) {
    // Pattern C: Known Nordic / Scandinavian design collection series
    // e.g. "Scandinavian Modern Sectional, 4-seat corner - Beige"
    // e.g. "Copenhagen Studio Coffee table - Brown"
    // e.g. "Nordic 6-Drawer Chest Dresser in White Oak"
    const geoMatch = rawName.match(
      /^(Scandinavian|Danish|Nordic|Stockholm|Copenhagen|Malmo|Malmö|Helsinki|Scandi|Bergen|Uppsala|Reykjavik|Gothenburg|Oslo|Vasa|Fjord|Aarhus|Lund|Västerås|Sarek|Tampere|Odense|Contemporary(?:\s+Nordic)?)\b(?:\s+([A-Za-zÅÄÖØÆÉÈÜ-]+))?(?:\s+[-–—]\s+|\s+)(.*)$/u
    )
    if (geoMatch) {
      const p1 = geoMatch[1].trim()
      const p2 = geoMatch[2] ? geoMatch[2].trim() : ''
      const rest = geoMatch[3] ? geoMatch[3].trim() : ''

      if (
        p2 &&
        /^(Modern|Functional|Minimalist|Studio|Craft|Contemporary|Living|Style|Artisan|Natural|Sleek|Pure|Modular|Balance|Eco-Craft|Horizon|Essential|Haven|Classic|Urban|Heritage|Design|Comfort|Alpine|Line|Form)$/i.test(
          p2
        )
      ) {
        sw = (p1 + ' ' + p2).trim()
        en = rest
      } else {
        sw = p1
        en = p2 ? (p2 + ' ' + rest).trim() : rest
      }
    }
  }

  // Clean automated English name only when auto-generated
  if (sw && en) {
    if (en.toLowerCase().startsWith(sw.toLowerCase())) {
      let rest = en.slice(sw.length).trim()
      rest = rest.replace(/^[-–—,:]+\s*/, '').trim()
      if (rest) en = rest
    }
  }

  if (!en) {
    if (sw && rawName.toLowerCase().startsWith(sw.toLowerCase())) {
      let rest = rawName.slice(sw.length).trim()
      rest = rest.replace(/^[-–—,:]+\s*/, '').trim()
      en = rest || rawName
    } else {
      en = rawName
    }
  }

  return {
    swedenName: sw || null,
    englishName: en || rawName
  }
}
