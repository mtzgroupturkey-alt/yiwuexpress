export interface IkeaTabOverview {
  summary: string
  features: string[]
}

export interface IkeaTabProductDetails {
  description: string
  keyFeatures: string[]
  goodToKnow: string
  materials: string
  careInstructions: string
  designer?: string
  whatsIncluded?: string
  compliance?: string
}

export interface IkeaPackageMeasurement {
  packageCount?: number
  name?: string
  articleNumber?: string
  width?: string
  height?: string
  length?: string
  weight?: string
}

export interface IkeaTabMeasurements {
  dimensions: Record<string, string>
  packaging: IkeaPackageMeasurement[]
}

export interface IkeaProduct {
  itemNumber: string // e.g. "406.094.49" or "40609449"
  cleanItemNumber: string // e.g. "40609449"
  name: string
  typeName?: string // e.g. "7-piece cookware set"
  description: string
  categoryBreadcrumbs: string[] // e.g. ["Cookware", "Pots and cooking accessories", "Cookware sets"]
  categoryName: string // e.g. "Cookware sets"
  price: number
  currency: string
  familyPrice?: number | null
  availability: {
    inStock: boolean
    statusText: string
  }
  mainImage: string
  images: string[]
  specs: Record<string, string> // comprehensive key/values including all tabs
  measurements: Record<string, string> // detailed dimension specs
  materialsAndCare: Record<string, string> // materials & care specifications
  designer?: string
  url: string
  rawJson?: any

  // The 3 official IKEA Tabs
  overview: IkeaTabOverview
  productDetails: IkeaTabProductDetails
  measurementsTab: IkeaTabMeasurements
}

export type FetchStatus = 'READY' | 'NOT_FOUND' | 'FETCH_FAILED' | 'PARSE_FAILED'

export interface IkeaFetchError {
  itemNumber: string
  status: FetchStatus
  reason: string
  retryable: boolean
}

export interface MappedAttributeValue {
  attributeId: string
  attributeName: string
  attributeSlug: string
  attributeType: string
  value: string
  rawIkeaKey: string
  rawIkeaValue: string
  unit?: string
  matchedVia: 'exact' | 'alias' | 'unit_aware' | 'configured_mapping' | 'manual'
}

export interface UnmappedSpec {
  key: string
  value: string
  suggestedAttributeId?: string
}

export interface IkeaMapResult {
  targetCategoryId: string | null
  targetCategoryName: string | null
  categoryMatchedVia: 'exact' | 'configured_mapping' | 'manual' | 'default'
  mapped: MappedAttributeValue[]
  unmapped: UnmappedSpec[]
  productDefaults: {
    name: string
    description: string
    price: number
    wholesalePrice: number
    images: string[]
    sku: string
    ikeaItemNumber: string
    rawIkeaPayload: any
  }
}
