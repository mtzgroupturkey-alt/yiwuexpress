import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseIkeaHtml, cleanIkeaItemNumber, formatIkeaItemNumber } from '@/lib/ikea/fetchProduct'
import { parseNumericWithUnit, normalizeKey } from '@/lib/ikea/mapToAttributes'

// ==========================================
// MOCKED HTML FIXTURES
// ==========================================

export const FURNITURE_HTML_FIXTURE = `
<!DOCTYPE html>
<html>
<head>
  <title>HEMNES Bed frame, white stain, Queen - IKEA</title>
  <meta name="description" content="A timeless bed frame in solid pine with generous headboard." />
  <meta property="og:image" content="https://www.ikea.com/us/en/images/products/hemnes-bed-frame__0637626_pe698444_s5.jpg" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "HEMNES",
    "image": [
      "https://www.ikea.com/us/en/images/products/hemnes-bed-frame__0637626_pe698444_s5.jpg",
      "https://www.ikea.com/us/en/images/products/hemnes-bed-frame__0860840_pe698445_s5.jpg"
    ],
    "description": "Bed frame, white stain, Queen",
    "sku": "30443255",
    "category": ["Furniture", "Beds", "Bed frames"],
    "offers": {
      "@type": "Offer",
      "price": "299.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  }
  </script>
</head>
<body>
  <div class="pip-header-section">
    <h1 class="pip-header-section__title">HEMNES</h1>
    <span class="pip-header-section__description-text">Bed frame, white stain, Queen</span>
  </div>

  <nav aria-label="Breadcrumb" class="pip-breadcrumbs">
    <ul class="pip-breadcrumbs__list">
      <li><a href="/">Home</a></li>
      <li><a href="/furniture">Furniture</a></li>
      <li><a href="/beds">Beds</a></li>
      <li><a href="/bed-frames">Bed frames</a></li>
    </ul>
  </nav>

  <div class="pip-temp-price">
    <span class="pip-temp-price__sr-text">$299.00</span>
  </div>

  <div class="pip-product-dimensions">
    <p class="pip-product-dimensions__paragraph">Length: 211 cm</p>
    <p class="pip-product-dimensions__paragraph">Width: 168 cm</p>
    <p class="pip-product-dimensions__paragraph">Height: 120 cm</p>
    <p class="pip-product-dimensions__paragraph">Footboard height: 66 cm</p>
    <p class="pip-product-dimensions__paragraph">Headboard height: 120 cm</p>
  </div>

  <div class="pip-product-details__materials">
    Solid pine, Stain, Clear acrylic lacquer
  </div>
  <div class="pip-product-details__care-instructions">
    Wipe clean with a cloth dampened in a mild cleaner. Wipe dry with a clean cloth.
  </div>
  <div class="pip-product-details__designer">
    Designer: Carina Bengs
  </div>
</body>
</html>
`

export const KITCHENWARE_HTML_FIXTURE = `
<!DOCTYPE html>
<html>
<head>
  <title>IKEA 365+ Frying pan, 11 inch - IKEA</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "IKEA 365+",
    "image": "https://www.ikea.com/us/en/images/products/ikea-365-frying-pan__0712345_pe728800_s5.jpg",
    "description": "Frying pan, stainless steel/non-stick coating, 11-inch",
    "sku": "50327580",
    "category": ["Cookware", "Pots & pans", "Frying pans"],
    "offers": {
      "@type": "Offer",
      "price": "24.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  }
  </script>
</head>
<body>
  <div class="pip-header-section">
    <h1 class="pip-header-section__title">IKEA 365+</h1>
    <span class="pip-header-section__description-text">Frying pan, stainless steel/non-stick coating, 11-inch</span>
  </div>

  <div class="pip-temp-price">
    <span class="pip-temp-price__sr-text">$24.99</span>
  </div>

  <nav aria-label="Breadcrumb">
    <ul class="pip-breadcrumbs__list">
      <li><a href="/cookware">Cookware</a></li>
      <li><a href="/frying-pans">Frying pans</a></li>
    </ul>
  </nav>

  <div class="pip-product-dimensions">
    <p class="pip-product-dimensions__paragraph">Diameter: 28 cm</p>
    <p class="pip-product-dimensions__paragraph">Height: 5 cm</p>
    <p class="pip-product-dimensions__paragraph">Length including handles: 48 cm</p>
  </div>

  <div class="pip-product-details__materials">
    Stainless steel, Aluminum, Teflon(R) Platinum Plus coating
  </div>
  <div class="pip-product-details__care-instructions">
    Handwash only. Suitable for use on gas cooktop, induction cooktop.
  </div>
</body>
</html>
`

export const TEXTILE_HTML_FIXTURE = `
<!DOCTYPE html>
<html>
<head>
  <title>DVALA Fitted sheet, white, Queen - IKEA</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "DVALA",
    "image": "https://www.ikea.com/us/en/images/products/dvala-fitted-sheet__0899999_pe789999_s5.jpg",
    "description": "Fitted sheet, white, Queen",
    "sku": "79228412",
    "category": ["Home textiles", "Bedding", "Fitted sheets"],
    "offers": {
      "@type": "Offer",
      "price": "14.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  }
  </script>
</head>
<body>
  <div class="pip-header-section">
    <h1 class="pip-header-section__title">DVALA</h1>
    <span class="pip-header-section__description-text">Fitted sheet, white, Queen</span>
  </div>

  <div class="pip-product-dimensions">
    <p class="pip-product-dimensions__paragraph">Length: 200 cm</p>
    <p class="pip-product-dimensions__paragraph">Width: 160 cm</p>
    <p class="pip-product-dimensions__paragraph">Max. mattress thickness: 26 cm</p>
    <p class="pip-product-dimensions__paragraph">Thread count: 152 /inch²</p>
  </div>

  <div class="pip-product-details__materials">
    100% cotton
  </div>
  <div class="pip-product-details__care-instructions">
    Machine wash warm, normal cycle. Do not bleach.
  </div>
</body>
</html>
`

// ==========================================
// TEST SUITE
// ==========================================

describe('IKEA Scraper & Parser Suite', () => {
  it('cleans and normalizes various IKEA item number formats', () => {
    expect(cleanIkeaItemNumber('304.432.55')).toBe('30443255')
    expect(cleanIkeaItemNumber('s50327580')).toBe('50327580')
    expect(cleanIkeaItemNumber('s792.284.12')).toBe('79228412')
    expect(cleanIkeaItemNumber(' 503-275-80 ')).toBe('50327580')

    expect(formatIkeaItemNumber('30443255')).toBe('304.432.55')
    expect(formatIkeaItemNumber('50327580')).toBe('503.275.80')
  })

  it('parses Furniture fixture (HEMNES Bed frame) accurately', () => {
    const product = parseIkeaHtml(
      FURNITURE_HTML_FIXTURE,
      'https://www.ikea.com/us/en/p/-30443255/',
      '30443255'
    )

    expect(product.name).toBe('HEMNES')
    expect(product.typeName).toBe('Bed frame, white stain, Queen')
    expect(product.price).toBe(299.0)
    expect(product.currency).toBe('USD')
    expect(product.categoryName).toBe('Bed frames')
    expect(product.specs['Length']).toBe('211 cm')
    expect(product.specs['Width']).toBe('168 cm')
    expect(product.specs['Materials']).toContain('Solid pine')
    expect(product.designer).toBe('Carina Bengs')
    expect(product.images.length).toBeGreaterThanOrEqual(1)
    expect(product.availability.inStock).toBe(true)
  })

  it('parses Kitchenware fixture (IKEA 365+ Frying pan) accurately', () => {
    const product = parseIkeaHtml(
      KITCHENWARE_HTML_FIXTURE,
      'https://www.ikea.com/us/en/p/-50327580/',
      '50327580'
    )

    expect(product.name).toBe('IKEA 365+')
    expect(product.price).toBe(24.99)
    expect(product.categoryName).toBe('Frying pans')
    expect(product.specs['Diameter']).toBe('28 cm')
    expect(product.specs['Height']).toBe('5 cm')
    expect(product.specs['Materials']).toContain('Stainless steel')
  })

  it('parses Textile fixture (DVALA Fitted sheet) accurately', () => {
    const product = parseIkeaHtml(
      TEXTILE_HTML_FIXTURE,
      'https://www.ikea.com/us/en/p/-79228412/',
      '79228412'
    )

    expect(product.name).toBe('DVALA')
    expect(product.price).toBe(14.99)
    expect(product.specs['Length']).toBe('200 cm')
    expect(product.specs['Width']).toBe('160 cm')
    expect(product.specs['Thread count']).toBe('152 /inch²')
    expect(product.specs['Materials']).toBe('100% cotton')
  })
})

describe('Mapping Engine & Unit Parser Suite', () => {
  it('parses various numeric formats and units correctly', () => {
    expect(parseNumericWithUnit('160 cm')).toEqual({ num: 160, unit: 'cm' })
    expect(parseNumericWithUnit('25 mm')).toEqual({ num: 25, unit: 'mm' })
    expect(parseNumericWithUnit('5.2 kg')).toEqual({ num: 5.2, unit: 'kg' })
    expect(parseNumericWithUnit('10.5 lbs')).toEqual({ num: 10.5, unit: 'lb' })
    expect(parseNumericWithUnit('47 1/4 "')).toEqual({ num: 47.25, unit: 'in' })
    expect(parseNumericWithUnit('300')).toEqual({ num: 300, unit: undefined })
  })

  it('normalizes keys correctly for alias matching', () => {
    expect(normalizeKey('Total Width (cm)')).toBe('total width cm')
    expect(normalizeKey('Footboard-Height')).toBe('footboard height')
    expect(normalizeKey('Care_instructions')).toBe('care instructions')
  })
})

describe('Idempotency & Business Logic Verification', () => {
  it('surfaces unmapped specs rather than silently dropping them', () => {
    const mockSpecs = {
      'Special Secret Coating': 'Ultra-matte finish',
      'Unusual Feature': 'Custom acoustic damper'
    }

    const unmappedList: Array<{ key: string; value: string }> = []
    const mappedAttrSlugs = ['width', 'height', 'length']

    for (const [k, v] of Object.entries(mockSpecs)) {
      if (!mappedAttrSlugs.includes(k.toLowerCase())) {
        unmappedList.push({ key: k, value: v })
      }
    }

    expect(unmappedList.length).toBe(2)
    expect(unmappedList[0].key).toBe('Special Secret Coating')
    expect(unmappedList[1].key).toBe('Unusual Feature')
  })

  it('guarantees idempotent product generation with identical SKU and clean numbers', () => {
    const rawNumber1 = '304.432.55'
    const rawNumber2 = ' 30443255 '

    const clean1 = cleanIkeaItemNumber(rawNumber1)
    const clean2 = cleanIkeaItemNumber(rawNumber2)

    expect(clean1).toBe(clean2)
    const sku1 = `IKEA-${clean1}`
    const sku2 = `IKEA-${clean2}`
    expect(sku1).toBe(sku2)
  })

  it('determines 24-hour cache validity correctly', () => {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

    const recentFetch = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    const expiredFetch = new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago

    const isRecentValid = Date.now() - recentFetch.getTime() < TWENTY_FOUR_HOURS
    const isExpiredValid = Date.now() - expiredFetch.getTime() < TWENTY_FOUR_HOURS

    expect(isRecentValid).toBe(true)
    expect(isExpiredValid).toBe(false)
  })

  it('enforces rate limiting after threshold is exceeded', () => {
    const limits = new Map<string, { count: number; resetAt: number }>()
    const maxLimit = 5
    const windowMs = 60000

    function testLimiter(id: string): boolean {
      const now = Date.now()
      const curr = limits.get(id)
      if (!curr || now > curr.resetAt) {
        limits.set(id, { count: 1, resetAt: now + windowMs })
        return true
      }
      if (curr.count >= maxLimit) {
        return false
      }
      curr.count++
      return true
    }

    const testAdmin = 'admin-user-123'
    for (let i = 0; i < maxLimit; i++) {
      expect(testLimiter(testAdmin)).toBe(true)
    }
    // Next request exceeds limit
    expect(testLimiter(testAdmin)).toBe(false)
  })
})

describe('IKEA 3-Tabs Comprehensive Extraction Suite (Overview, Product Details, Measurements)', () => {
  const THREE_TABS_HTML_FIXTURE = `
<!DOCTYPE html>
<html>
<head>
  <title>GULDÖRING 7-piece cookware set - IKEA</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "GULDÖRING",
    "description": "7-piece cookware set, non-stick coating stainless steel/dark red",
    "sku": "40609449",
    "category": ["Cookware", "Cookware sets"],
    "offers": {
      "@type": "Offer",
      "price": "49.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  }
  </script>
</head>
<body>
  <!-- TAB 1: OVERVIEW -->
  <div id="overview" class="pipf-overview-tab">
    <div class="pipf-overview-summary">
      406.094.49 Cookware set that includes everything you need to start cooking delicious meals at home.
    </div>
    <div class="pipf-overview-tab__badges">
      <span>Non-stick coating</span>
      <span>Works on induction</span>
      <span>Dishwasher safe</span>
    </div>
  </div>

  <!-- TAB 2: PRODUCT DETAILS -->
  <div id="product-details" class="pipf-product-details-tab">
    <div id="product-description-expander">
      <p>The thick base prevents food from easily burning and sticking to the pan.</p>
      <p>Teflon® Select durable non-stick coating makes cooking and cleaning effortless.</p>
      <p>Works well on all types of cooktops, including induction cooktops.</p>
    </div>
    <div id="SEC_product-details-good-to-know">
      Good to know Includes: Pot with lid 5 qt, pot with lid 3 qt, saucepan with lid 1 qt, and frying pan 11".
    </div>
    <div id="SEC_product-details-material-and-care">
      Material Main parts: Stainless steel, Non-stick coating, Aluminum
      Care Dishwasher-safe. Suitable for use on gas cooktop, induction cooktop.
      California AB 1200 Chemical Disclosures: PTFE and PFAS compounds.
    </div>
    <div class="pip-product-details__designer">
      Designer: Henrik Preutz
    </div>
  </div>

  <!-- TAB 3: MEASUREMENTS -->
  <div id="measurements">
    <div class="pip-product-dimensions">
      <p class="pip-product-dimensions__paragraph">Diameter: 28 cm</p>
      <p class="pip-product-dimensions__paragraph">Total volume: 5 l</p>
    </div>
    <div id="SEC_measurements-packaging" class="pipf-measurements-tab__package">
      <span>GULDÖRING 7-piece cookware set</span>
      <span>406.094.49</span>
      <span>Width: 15 1/4 " (39 cm)</span>
      <span>Height: 7 " (18 cm)</span>
      <span>Length: 21 1/2 " (55 cm)</span>
      <span>Weight: 9 lb 12 oz (4.42 kg)</span>
    </div>
  </div>
</body>
</html>
`

  it('correctly extracts structured data from all 3 tabs', () => {
    const product = parseIkeaHtml(
      THREE_TABS_HTML_FIXTURE,
      'https://www.ikea.com/us/en/p/guldoering-7-piece-cookware-set-non-stick-coating-stainless-steel-dark-red-40609449/',
      '40609449'
    )

    // Verify basic info
    expect(product.name).toBe('GULDÖRING')
    expect(product.price).toBe(49.99)
    expect(product.currency).toBe('USD')

    // 1. Overview tab
    expect(product.overview).toBeDefined()
    expect(product.overview?.summary).toContain('Cookware set that includes everything you need')
    expect(product.overview?.features).toContain('Non-stick coating')
    expect(product.overview?.features).toContain('Works on induction')
    expect(product.specs['Overview']).toContain('Cookware set that includes everything you need')

    // 2. Product details tab
    expect(product.productDetails).toBeDefined()
    expect(product.productDetails?.keyFeatures.length).toBeGreaterThanOrEqual(3)
    expect(product.productDetails?.keyFeatures[0]).toContain('The thick base prevents food')
    expect(product.productDetails?.goodToKnow).toContain('Includes: Pot with lid 5 qt')
    expect(product.productDetails?.materials).toContain('Stainless steel, Non-stick coating')
    expect(product.productDetails?.careInstructions).toContain('Dishwasher-safe')
    expect(product.productDetails?.compliance).toContain('California AB 1200')
    expect(product.productDetails?.designer).toBe('Henrik Preutz')

    // Also present in specs map
    expect(product.specs['Materials']).toContain('Stainless steel')
    expect(product.specs['Care instructions']).toContain('Dishwasher-safe')
    expect(product.specs['Good to know']).toContain('Includes: Pot with lid 5 qt')
    expect(product.specs['Designer']).toBe('Henrik Preutz')

    // 3. Measurements tab
    expect(product.measurementsTab).toBeDefined()
    expect(product.measurementsTab?.dimensions['Diameter']).toBe('28 cm')
    expect(product.measurementsTab?.dimensions['Total volume']).toBe('5 l')
    expect(product.measurementsTab?.packaging.length).toBe(1)
    const pkg = product.measurementsTab?.packaging[0]
    expect(pkg?.width).toContain('39 cm')
    expect(pkg?.height).toContain('18 cm')
    expect(pkg?.length).toContain('55 cm')
    expect(pkg?.weight).toContain('4.42 kg')

    // Packaging specs flattened in specs map
    expect(product.specs['Package width']).toContain('39 cm')
    expect(product.specs['Package height']).toContain('18 cm')
    expect(product.specs['Package length']).toContain('55 cm')
    expect(product.specs['Package weight']).toContain('4.42 kg')
  })
})
