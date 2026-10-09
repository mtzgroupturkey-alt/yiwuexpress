import { create } from 'zustand'

export interface CompanySettings {
  id?: string
  companyName: string
  siteTagline?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  companyWebsite?: string
  businessLicense?: string
  taxRegistrationNumber?: string
  companyDescription?: string
  companyLogo?: string
  companyLogoHeight?: number
  companyFavicon?: string
  primaryColor: string
  accentColor: string
  currency: string
  timezone: string
  language: string
  storeMode?: 'WHOLESALE' | 'RETAIL' | 'BOTH'
  rfqModel?: 'RFQ' | 'INSTANT'
  wholesaleDefaultMoq?: number
  rfqEnabled?: boolean
  wholesaleEnabled?: boolean
  retailEnabled?: boolean
  mapProvider?: 'yandex' | 'leaflet'
  yandexMapsApiKey?: string
  yandexGeocoderApiKey?: string
  storeHours?: string
  freeShippingThreshold?: number
  announcementTicker?: string
  facebookUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  instagramUrl?: string
  whatsappNumber?: string
  wechatId?: string
  kitchenSectionEnabled?: boolean
  kitchenSectionTitle?: string | null
  kitchenSectionSubtitle?: string | null
  kitchenSectionBadge?: string | null
  kitchenSectionViewAllLabel?: string | null
  kitchenSectionCategoryIds?: string | null
  kitchenSectionPinnedProductIds?: string | null
  kitchenSectionMaxProducts?: number
  electronicsSectionEnabled?: boolean
  electronicsSectionTitle?: string | null
  electronicsSectionSubtitle?: string | null
  electronicsSectionBadge?: string | null
  electronicsSectionViewAllLabel?: string | null
  electronicsSectionCategoryIds?: string | null
  electronicsSectionPinnedProductIds?: string | null
  electronicsSectionMaxProducts?: number
  // Weekly Mega Bargains & Clearance Ad Banner
  weeklyBargainsEnabled?: boolean
  weeklyBargainsBadge?: string | null
  weeklyBargainsTag?: string | null
  weeklyBargainsTitle?: string | null
  weeklyBargainsSubtitle?: string | null
  weeklyBargainsButtonText?: string | null
  weeklyBargainsButtonLink?: string | null
  // Exclusive Member Club & Loyalty Ad Banner
  memberClubEnabled?: boolean
  memberClubBadge?: string | null
  memberClubMembersCount?: string | null
  memberClubTitle?: string | null
  memberClubDescription?: string | null
  memberClubActivateBtn?: string | null
  memberClubActivateLink?: string | null
  memberClubHowPointsWork?: string | null
  memberClubHowPointsLink?: string | null
  // Homepage Trust & Reassurance Badges
  trustFeaturesEnabled?: boolean
  trustDeliveryTitle?: string | null
  trustDeliveryDesc?: string | null
  trustGuaranteeTitle?: string | null
  trustGuaranteeDesc?: string | null
  trustShowroomsTitle?: string | null
  trustShowroomsDesc?: string | null
  trustReturnsTitle?: string | null
  trustReturnsDesc?: string | null
  // Product Details Reassurance Badges & Delivery Timings
  pdpWarrantyTitle?: string | null
  pdpWarrantySubtitle?: string | null
  pdpDeliveryTitle?: string | null
  pdpDeliverySubtitle?: string | null
  pdpReturnsTitle?: string | null
  pdpReturnsSubtitle?: string | null
  pdpCutoffHour?: string | null
  pdpDeliveryMinsk?: string | null
  pdpDeliveryBelarusRegion?: string | null
  pdpDeliveryChinaLocal?: string | null
  pdpDeliveryChinaNationwide?: string | null
  pdpAirFreightDays?: string | null
  pdpRailFreightDays?: string | null
  pdpSeaFreightDays?: string | null
  // Pickup Hub Rules
  pdpPickupTitle?: string | null
  pdpPickupPrice?: string | null
  pdpPickupEstimate?: string | null
  pdpFactoryTitle?: string | null
  pdpFactoryDesc?: string | null
  pdpQcTitle?: string | null
  pdpQcDesc?: string | null
  pdpLogisticsTitle?: string | null
  pdpLogisticsDesc?: string | null
  pdpEscrowTitle?: string | null
  pdpEscrowDesc?: string | null
  // Buyer Q&A / FAQ
  pdpFaqTitle?: string | null
  pdpFaqSubtitle?: string | null
  pdpFaqAskBtn?: string | null
  pdpFaq1Q?: string | null
  pdpFaq1A?: string | null
  pdpFaq2Q?: string | null
  pdpFaq2A?: string | null
  pdpFaq3Q?: string | null
  pdpFaq3A?: string | null
  pdpFaq4Q?: string | null
  pdpFaq4A?: string | null
  pdpFaq5Q?: string | null
  pdpFaq5A?: string | null
  pdpCourierDeliveryBadgeEnabled?: boolean
}

export interface SettingsState {
  settings: CompanySettings | null
  loading: boolean
  setSettings: (settings: Partial<CompanySettings>) => void
  initializeSettings: (initialSettings: CompanySettings | null) => void
  setLoading: (loading: boolean) => void
}

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'Global Trade',
  companyLogo: '/logo.png',
  companyLogoHeight: 40,
  companyFavicon: '/favicon.svg',
  primaryColor: '#1a3a5c',
  accentColor: '#c9a84c',
  currency: 'USD',
  timezone: 'Asia/Shanghai',
  language: 'en',
  storeMode: 'WHOLESALE',
  rfqModel: 'RFQ',
  wholesaleDefaultMoq: 1,
  rfqEnabled: true,
  wholesaleEnabled: true,
  retailEnabled: true,
  storeHours: '08:00 – 23:00',
  freeShippingThreshold: 35.0,
  mapProvider: 'yandex',
  yandexMapsApiKey: '',
  yandexGeocoderApiKey: '',
  kitchenSectionEnabled: true,
  kitchenSectionTitle: 'Kitchenware, Cookware & Dining Essentials',
  kitchenSectionSubtitle: 'Granite frying pans, chef cutlery sets, porcelain dinner sets, and Italian espresso barware',
  kitchenSectionBadge: 'KITCHEN & DINING',
  kitchenSectionViewAllLabel: 'View all Kitchen & Dining',
  kitchenSectionCategoryIds: null,
  kitchenSectionPinnedProductIds: null,
  kitchenSectionMaxProducts: 12,
  electronicsSectionEnabled: true,
  electronicsSectionTitle: 'Popular in Electronics & Appliances',
  electronicsSectionSubtitle: 'Official manufacturer equipment with factory guarantee',
  electronicsSectionBadge: 'ELECTRONICS & APPLIANCES',
  electronicsSectionViewAllLabel: 'View all in category',
  electronicsSectionCategoryIds: null,
  electronicsSectionPinnedProductIds: null,
  electronicsSectionMaxProducts: 8,
  // Weekly Mega Bargains Defaults
  weeklyBargainsEnabled: true,
  weeklyBargainsBadge: 'UP TO -40%',
  weeklyBargainsTag: 'Weekly Price Drop',
  weeklyBargainsTitle: 'Weekly Mega Bargains & Clearance',
  weeklyBargainsSubtitle: 'Limited stock discounts up to 50% off retail pricing across home and garden collections',
  weeklyBargainsButtonText: 'View all deals',
  weeklyBargainsButtonLink: '',
  // Exclusive Member Club Defaults
  memberClubEnabled: true,
  memberClubBadge: 'EXCLUSIVE MEMBER CLUB',
  memberClubMembersCount: 'Over 420,000 active members',
  memberClubTitle: 'Earn 3% Instant Cashback + Free Express Delivery',
  memberClubDescription: 'Join the {name} Club for free today. Spend points directly at checkout on furniture, kitchenware, and smart home appliances (1 point = $1).',
  memberClubActivateBtn: 'Activate Free Membership',
  memberClubActivateLink: '',
  memberClubHowPointsWork: 'How points work',
  memberClubHowPointsLink: '',
  // PDP Reassurance Badges & Delivery Timings
  pdpWarrantyTitle: '2-Year Warranty',
  pdpWarrantySubtitle: 'Full factory coverage',
  pdpDeliveryTitle: 'Express Delivery',
  pdpDeliverySubtitle: 'Free over $50+',
  pdpReturnsTitle: '14-Day Returns',
  pdpReturnsSubtitle: 'Hassle-free guarantee',
  pdpCutoffHour: '18',
  pdpDeliveryMinsk: 'Tomorrow (1 business day)',
  pdpDeliveryBelarusRegion: '1 – 3 business days',
  pdpDeliveryChinaLocal: '24 – 48 hours',
  pdpDeliveryChinaNationwide: '2 – 3 days',
  pdpAirFreightDays: '5 – 8 business days',
  pdpRailFreightDays: '14 – 20 business days',
  pdpSeaFreightDays: '20 – 35 days',
  pdpPickupTitle: 'China Central Hub',
  pdpPickupPrice: 'Free',
  pdpPickupEstimate: 'Ready for pickup in 1 hour',
  pdpFactoryTitle: 'Direct Verified Factory',
  pdpFactoryDesc: 'Zero middleman markup directly from manufacturer',
  pdpQcTitle: 'Rigorous Quality Inspection',
  pdpQcDesc: 'Full physical check before shipment',
  pdpLogisticsTitle: 'Door-to-Door Logistics',
  pdpLogisticsDesc: 'Air, rail & sea freight with customs clearance',
  pdpEscrowTitle: 'Trade Assurance Escrow',
  pdpEscrowDesc: 'Funds protected until inspection passes',
  // Buyer Q&A / FAQ
  pdpFaqTitle: 'Frequently Asked Questions',
  pdpFaqSubtitle: 'Get quick answers to common questions',
  pdpFaqAskBtn: 'Ask a Question',
  pdpFaq1Q: 'What is the minimum order quantity?',
  pdpFaq1A: 'The minimum order quantity for this product is {moq} units. Wholesale pricing is available for larger orders.',
  pdpFaq2Q: 'What is the shipping time?',
  pdpFaq2A: 'Standard shipping takes 7-14 business days. Express door-to-door shipping options are available at checkout.',
  pdpFaq3Q: 'Do you offer bulk wholesale discounts?',
  pdpFaq3A: 'Yes! We offer tiered wholesale pricing for bulk orders. Contact our trade managers for custom container rates.',
  pdpFaq4Q: 'What is your return & inspection policy?',
  pdpFaq4A: 'We offer full pre-shipment quality inspection and 30-day return coverage for any verified manufacturing defects.',
  pdpFaq5Q: 'Can I customize this product or add my logo (OEM/ODM)?',
  pdpFaq5A: 'Yes, OEM packaging, custom branding, and ODM tooling are supported for volume orders. Contact sourcing for specs.',
  pdpCourierDeliveryBadgeEnabled: true,
  // Homepage Trust & Reassurance Badges
  trustFeaturesEnabled: true,
  trustDeliveryTitle: 'Express Home Delivery',
  trustDeliveryDesc: 'Carefully packaged and delivered straight to your apartment or front door.',
  trustGuaranteeTitle: 'Zero Damage Guarantee',
  trustGuaranteeDesc: 'Reinforced protective packaging ensuring ceramics, glass, and mirrors arrive pristine.',
  trustShowroomsTitle: '120+ Pickup Showrooms',
  trustShowroomsDesc: 'Inspect items in person, test furniture materials, and pick up free at your convenience.',
  trustReturnsTitle: 'Instant 14-Day Return',
  trustReturnsDesc: 'Simple exchange or full refund for home decor, cookware, and appliances.',
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  loading: false,
  setSettings: (newSettings) =>
    set((state) => ({
      settings: state.settings
        ? { ...state.settings, ...newSettings }
        : { ...DEFAULT_SETTINGS, ...newSettings },
    })),
  initializeSettings: (initialSettings) =>
    set({
      settings: initialSettings ? { ...DEFAULT_SETTINGS, ...initialSettings } : DEFAULT_SETTINGS,
      loading: false,
    }),
  setLoading: (loading) => set({ loading }),
}))
