-- ADD TEST VARIANTS TO EXISTING PRODUCT
-- This will add 3 variants to "Stainless Steel Mixing Bowls Set of 3"

-- First, find the product ID (replace with actual ID from your database)
-- Run this query first to get the product ID:
-- SELECT id, name, sku FROM products WHERE name LIKE '%Mixing Bowls%';

-- Then, replace 'YOUR_PRODUCT_ID_HERE' below with the actual product ID

-- Variant 1: Small, Silver
INSERT INTO product_variants (
  id,
  "productId",
  sku,
  attributes,
  price,
  "costPrice",
  stock,
  "lowStockThreshold",
  images,
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'var_' || substr(md5(random()::text), 1, 20),
  'YOUR_PRODUCT_ID_HERE',  -- Replace with actual product ID
  'YW-TW-MB3-SM-SLV',
  '{"Size": "Small (1L, 2L, 3L)", "Color": "Silver"}'::jsonb,
  14.99,
  10.50,
  50,
  10,
  ARRAY[]::text[],
  true,
  NOW(),
  NOW()
);

-- Variant 2: Medium, Silver
INSERT INTO product_variants (
  id,
  "productId",
  sku,
  attributes,
  price,
  "costPrice",
  stock,
  "lowStockThreshold",
  images,
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'var_' || substr(md5(random()::text), 1, 20),
  'YOUR_PRODUCT_ID_HERE',  -- Replace with actual product ID
  'YW-TW-MB3-MD-SLV',
  '{"Size": "Medium (2L, 3L, 4L)", "Color": "Silver"}'::jsonb,
  16.19,
  12.00,
  40,
  10,
  ARRAY[]::text[],
  true,
  NOW(),
  NOW()
);

-- Variant 3: Large, Copper
INSERT INTO product_variants (
  id,
  "productId",
  sku,
  attributes,
  price,
  "costPrice",
  stock,
  "lowStockThreshold",
  images,
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'var_' || substr(md5(random()::text), 1, 20),
  'YOUR_PRODUCT_ID_HERE',  -- Replace with actual product ID
  'YW-TW-MB3-LG-COP',
  '{"Size": "Large (3L, 4L, 5L)", "Color": "Copper"}'::jsonb,
  18.99,
  14.50,
  30,
  10,
  ARRAY[]::text[],
  true,
  NOW(),
  NOW()
);

-- After running this, refresh your purchase order page and:
-- 1. Click "Add Product"
-- 2. Search for "Mixing Bowls"
-- 3. You should now see a "3 variants" badge
-- 4. Click "Select Variant" button
-- 5. Choose a variant and add it!
