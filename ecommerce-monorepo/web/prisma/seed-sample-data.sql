-- ============================================
-- SAMPLE DATA INSERTION SCRIPT
-- Run this in your PostgreSQL database
-- ============================================

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE "HeroSlide", "Currency", "CurrencyRate" CASCADE;

-- ============================================
-- 1. HERO SLIDERS (Homepage Banner Slides)
-- ============================================

INSERT INTO "HeroSlide" (id, title, subtitle, description, "buttonText", "buttonLink", "imageUrl", "mobileImageUrl", order, "isActive", "createdAt", "updatedAt")
VALUES
  -- Slide 1: Welcome Banner
  ('hero-slide-1', 
   'Global Trade Made Simple', 
   'Your Gateway to Yiwu International Market',
   'Connect with 75,000+ suppliers and ship worldwide with confidence. Experience seamless logistics, customs clearance, and quality assurance.',
   'Start Trading Now',
   '/products',
   'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&h=600&fit=crop',
   'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop',
   1,
   true,
   NOW(),
   NOW()),

  -- Slide 2: Logistics Services
  ('hero-slide-2',
   'Professional Logistics Solutions',
   'Door-to-Door Shipping to 200+ Countries',
   'Sea freight, air cargo, express delivery - we handle it all. Real-time tracking, insurance coverage, and dedicated customer support.',
   'Get a Quote',
   '/services/logistics',
   'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1920&h=600&fit=crop',
   'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800&h=600&fit=crop',
   2,
   true,
   NOW(),
   NOW()),

  -- Slide 3: Quality Assurance
  ('hero-slide-3',
   'Quality You Can Trust',
   'Professional Inspection & Verification Services',
   'Third-party quality control, product testing, and supplier verification. Ensure your products meet international standards.',
   'Learn More',
   '/services/quality-control',
   'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&h=600&fit=crop',
   'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&h=600&fit=crop',
   3,
   true,
   NOW(),
   NOW()),

  -- Slide 4: Wholesale Opportunities
  ('hero-slide-4',
   'Wholesale Prices Direct from Factory',
   'Save 40-60% on Bulk Orders',
   'Access manufacturer direct pricing with MOQ flexibility. Perfect for retailers, distributors, and e-commerce sellers.',
   'Browse Products',
   '/products?wholesale=true',
   'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=600&fit=crop',
   'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
   4,
   true,
   NOW(),
   NOW()),

  -- Slide 5: Special Offer
  ('hero-slide-5',
   'Limited Time Offer',
   'Free Shipping on Orders Over $1,000',
   'Enjoy complimentary sea freight for bulk orders. Offer valid until end of month. Terms and conditions apply.',
   'Shop Now',
   '/products',
   'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&h=600&fit=crop',
   'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&fit=crop',
   5,
   true,
   NOW(),
   NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  "buttonText" = EXCLUDED."buttonText",
  "buttonLink" = EXCLUDED."buttonLink",
  "imageUrl" = EXCLUDED."imageUrl",
  "mobileImageUrl" = EXCLUDED."mobileImageUrl",
  order = EXCLUDED.order,
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- ============================================
-- 2. CURRENCIES (Supported Payment Currencies)
-- ============================================

INSERT INTO "Currency" (id, code, name, symbol, "isActive", "isDefault", "createdAt", "updatedAt")
VALUES
  -- Major Currencies
  ('curr-usd', 'USD', 'US Dollar', '$', true, true, NOW(), NOW()),
  ('curr-eur', 'EUR', 'Euro', '€', true, false, NOW(), NOW()),
  ('curr-gbp', 'GBP', 'British Pound', '£', true, false, NOW(), NOW()),
  ('curr-cny', 'CNY', 'Chinese Yuan', '¥', true, false, NOW(), NOW()),
  ('curr-jpy', 'JPY', 'Japanese Yen', '¥', true, false, NOW(), NOW()),
  
  -- Asian Currencies
  ('curr-inr', 'INR', 'Indian Rupee', '₹', true, false, NOW(), NOW()),
  ('curr-krw', 'KRW', 'South Korean Won', '₩', true, false, NOW(), NOW()),
  ('curr-sgd', 'SGD', 'Singapore Dollar', 'S$', true, false, NOW(), NOW()),
  ('curr-hkd', 'HKD', 'Hong Kong Dollar', 'HK$', true, false, NOW(), NOW()),
  ('curr-thb', 'THB', 'Thai Baht', '฿', true, false, NOW(), NOW()),
  ('curr-myr', 'MYR', 'Malaysian Ringgit', 'RM', true, false, NOW(), NOW()),
  ('curr-idr', 'IDR', 'Indonesian Rupiah', 'Rp', true, false, NOW(), NOW()),
  ('curr-php', 'PHP', 'Philippine Peso', '₱', true, false, NOW(), NOW()),
  ('curr-vnd', 'VND', 'Vietnamese Dong', '₫', true, false, NOW(), NOW()),
  
  -- Middle East Currencies
  ('curr-aed', 'AED', 'UAE Dirham', 'د.إ', true, false, NOW(), NOW()),
  ('curr-sar', 'SAR', 'Saudi Riyal', 'ر.س', true, false, NOW(), NOW()),
  ('curr-qar', 'QAR', 'Qatari Riyal', 'ر.ق', true, false, NOW(), NOW()),
  ('curr-kwd', 'KWD', 'Kuwaiti Dinar', 'د.ك', true, false, NOW(), NOW()),
  
  -- Other Major Currencies
  ('curr-aud', 'AUD', 'Australian Dollar', 'A$', true, false, NOW(), NOW()),
  ('curr-cad', 'CAD', 'Canadian Dollar', 'C$', true, false, NOW(), NOW()),
  ('curr-chf', 'CHF', 'Swiss Franc', 'CHF', true, false, NOW(), NOW()),
  ('curr-nzd', 'NZD', 'New Zealand Dollar', 'NZ$', true, false, NOW(), NOW()),
  ('curr-rub', 'RUB', 'Russian Ruble', '₽', true, false, NOW(), NOW()),
  ('curr-brl', 'BRL', 'Brazilian Real', 'R$', true, false, NOW(), NOW()),
  ('curr-mxn', 'MXN', 'Mexican Peso', 'Mex$', true, false, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  symbol = EXCLUDED.symbol,
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- ============================================
-- 3. CURRENCY RATES (Exchange Rates to USD)
-- ============================================
-- Base Currency: USD = 1.00
-- Rates as of example date (adjust based on current rates)

INSERT INTO "CurrencyRate" (id, "fromCurrency", "toCurrency", rate, "effectiveDate", "createdAt", "updatedAt")
VALUES
  -- USD to Major Currencies
  ('rate-usd-usd', 'USD', 'USD', 1.000000, NOW(), NOW(), NOW()),
  ('rate-usd-eur', 'USD', 'EUR', 0.920000, NOW(), NOW(), NOW()),
  ('rate-usd-gbp', 'USD', 'GBP', 0.790000, NOW(), NOW(), NOW()),
  ('rate-usd-cny', 'USD', 'CNY', 7.240000, NOW(), NOW(), NOW()),
  ('rate-usd-jpy', 'USD', 'JPY', 149.500000, NOW(), NOW(), NOW()),
  
  -- USD to Asian Currencies
  ('rate-usd-inr', 'USD', 'INR', 83.120000, NOW(), NOW(), NOW()),
  ('rate-usd-krw', 'USD', 'KRW', 1320.500000, NOW(), NOW(), NOW()),
  ('rate-usd-sgd', 'USD', 'SGD', 1.350000, NOW(), NOW(), NOW()),
  ('rate-usd-hkd', 'USD', 'HKD', 7.820000, NOW(), NOW(), NOW()),
  ('rate-usd-thb', 'USD', 'THB', 35.800000, NOW(), NOW(), NOW()),
  ('rate-usd-myr', 'USD', 'MYR', 4.680000, NOW(), NOW(), NOW()),
  ('rate-usd-idr', 'USD', 'IDR', 15750.000000, NOW(), NOW(), NOW()),
  ('rate-usd-php', 'USD', 'PHP', 56.200000, NOW(), NOW(), NOW()),
  ('rate-usd-vnd', 'USD', 'VND', 24350.000000, NOW(), NOW(), NOW()),
  
  -- USD to Middle East Currencies
  ('rate-usd-aed', 'USD', 'AED', 3.673000, NOW(), NOW(), NOW()),
  ('rate-usd-sar', 'USD', 'SAR', 3.750000, NOW(), NOW(), NOW()),
  ('rate-usd-qar', 'USD', 'QAR', 3.640000, NOW(), NOW(), NOW()),
  ('rate-usd-kwd', 'USD', 'KWD', 0.307000, NOW(), NOW(), NOW()),
  
  -- USD to Other Major Currencies
  ('rate-usd-aud', 'USD', 'AUD', 1.530000, NOW(), NOW(), NOW()),
  ('rate-usd-cad', 'USD', 'CAD', 1.360000, NOW(), NOW(), NOW()),
  ('rate-usd-chf', 'USD', 'CHF', 0.880000, NOW(), NOW(), NOW()),
  ('rate-usd-nzd', 'USD', 'NZD', 1.650000, NOW(), NOW(), NOW()),
  ('rate-usd-rub', 'USD', 'RUB', 91.500000, NOW(), NOW(), NOW()),
  ('rate-usd-brl', 'USD', 'BRL', 4.980000, NOW(), NOW(), NOW()),
  ('rate-usd-mxn', 'USD', 'MXN', 17.120000, NOW(), NOW(), NOW()),
  
  -- Reverse rates (from other currencies to USD)
  ('rate-eur-usd', 'EUR', 'USD', 1.086957, NOW(), NOW(), NOW()),
  ('rate-gbp-usd', 'GBP', 'USD', 1.265823, NOW(), NOW(), NOW()),
  ('rate-cny-usd', 'CNY', 'USD', 0.138122, NOW(), NOW(), NOW()),
  ('rate-jpy-usd', 'JPY', 'USD', 0.006689, NOW(), NOW(), NOW()),
  ('rate-inr-usd', 'INR', 'USD', 0.012032, NOW(), NOW(), NOW()),
  ('rate-krw-usd', 'KRW', 'USD', 0.000757, NOW(), NOW(), NOW()),
  ('rate-sgd-usd', 'SGD', 'USD', 0.740741, NOW(), NOW(), NOW()),
  ('rate-hkd-usd', 'HKD', 'USD', 0.127877, NOW(), NOW(), NOW()),
  ('rate-aed-usd', 'AED', 'USD', 0.272257, NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  rate = EXCLUDED.rate,
  "effectiveDate" = EXCLUDED."effectiveDate",
  "updatedAt" = NOW();

-- ============================================
-- 4. SYSTEM SETTINGS (Company Info)
-- ============================================

INSERT INTO "SystemSettings" (
  id, 
  "companyName", 
  "companyAddress", 
  "companyPhone", 
  "companyEmail",
  "companyWebsite",
  "companyDescription",
  "companyLogo",
  "companyLogoHeight",
  "primaryColor",
  "accentColor",
  currency,
  timezone,
  language,
  "createdAt",
  "updatedAt"
)
VALUES (
  'system-settings-1',
  'YIWU EXPRESS',
  'Yiwu International Trade City, Building 3, Floor 5, Yiwu, Zhejiang, China 322000',
  '+86 579 8555 1234',
  'info@yiwuexpress.com',
  'https://yiwuexpress.com',
  'Leading international logistics and trade platform connecting businesses worldwide. Specializing in China sourcing, quality control, customs clearance, and global shipping services.',
  '/logo.svg',
  40,
  '#1a3a5c',
  '#c9a84c',
  'USD',
  'Asia/Shanghai',
  'en',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  "companyName" = EXCLUDED."companyName",
  "companyAddress" = EXCLUDED."companyAddress",
  "companyPhone" = EXCLUDED."companyPhone",
  "companyEmail" = EXCLUDED."companyEmail",
  "companyWebsite" = EXCLUDED."companyWebsite",
  "companyDescription" = EXCLUDED."companyDescription",
  "updatedAt" = NOW();

-- ============================================
-- 5. BREADCRUMB SETTINGS (Page Headers)
-- ============================================

INSERT INTO "BreadcrumbSettings" (
  id,
  page,
  title,
  subtitle,
  "backgroundImage",
  "mobileBackgroundImage",
  "showBreadcrumb",
  "textColor",
  "overlayOpacity",
  alignment,
  "createdAt",
  "updatedAt"
)
VALUES
  ('breadcrumb-home', 'home', 'Welcome Home', 'Your trusted logistics partner', 
   'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&h=400&fit=crop',
   'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=400&fit=crop',
   true, '#FFFFFF', 0.5, 'center', NOW(), NOW()),
   
  ('breadcrumb-products', 'products', 'Our Products', 'Quality products from trusted suppliers',
   'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=400&fit=crop',
   'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
   true, '#FFFFFF', 0.6, 'left', NOW(), NOW()),
   
  ('breadcrumb-services', 'services', 'Our Services', 'Comprehensive logistics solutions',
   'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1920&h=400&fit=crop',
   'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800&h=400&fit=crop',
   true, '#FFFFFF', 0.5, 'center', NOW(), NOW()),
   
  ('breadcrumb-about', 'about', 'About Us', 'Your partner in global trade',
   'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&h=400&fit=crop',
   'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&h=400&fit=crop',
   true, '#FFFFFF', 0.5, 'center', NOW(), NOW()),
   
  ('breadcrumb-contact', 'contact', 'Contact Us', 'Get in touch with our team',
   'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=400&fit=crop',
   'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop',
   true, '#FFFFFF', 0.5, 'center', NOW(), NOW())
ON CONFLICT (page) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  "backgroundImage" = EXCLUDED."backgroundImage",
  "mobileBackgroundImage" = EXCLUDED."mobileBackgroundImage",
  "updatedAt" = NOW();

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Sample data inserted successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '   - % Hero Slides', (SELECT COUNT(*) FROM "HeroSlide");
  RAISE NOTICE '   - % Currencies', (SELECT COUNT(*) FROM "Currency");
  RAISE NOTICE '   - % Currency Rates', (SELECT COUNT(*) FROM "CurrencyRate");
  RAISE NOTICE '   - % Breadcrumb Settings', (SELECT COUNT(*) FROM "BreadcrumbSettings");
  RAISE NOTICE '';
  RAISE NOTICE '🌐 View your site at: http://localhost:3005';
END $$;
