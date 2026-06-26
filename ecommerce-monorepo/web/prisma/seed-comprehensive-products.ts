import { PrismaClient, AttributeType } from '@prisma/client'
const prisma = new PrismaClient()

// High-quality product images from Unsplash
const PRODUCT_IMAGES = {
  // Cookware
  nonStickPan: 'https://images.unsplash.com/photo-1556909075-f3e0c4afb96d?w=800&h=800&fit=crop',
  stockPot: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=800&fit=crop',
  wok: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=800&fit=crop',
  saucePan: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=800&fit=crop',
  
  // Bakeware
  cakePane: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop',
  muffinTin: 'https://images.unsplash.com/photo-1609501676725-7186f132248c?w=800&h=800&fit=crop',
  bakingSheet: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=800&fit=crop',
  loafPan: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&h=800&fit=crop',
  
  // Kitchen Utensils
  spatulaSet: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop',
  kniveSet: 'https://images.unsplash.com/photo-1593618998160-e34014e67541?w=800&h=800&fit=crop',
  whisk: 'https://images.unsplash.com/photo-1556909075-4b8d669cd773?w=800&h=800&fit=crop',
  
  // Small Appliances
  blender: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=800&h=800&fit=crop',
  toaster: 'https://images.unsplash.com/photo-1574781330855-d0db2706b3d0?w=800&h=800&fit=crop',
  coffeeMaker: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=800&fit=crop',
  
  // Cutlery & Tableware
  dinnerSet: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop',
  glasses: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=800&fit=crop',
  silverware: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop',
  
  // Electronics
  headphones: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
  smartphone: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop',
  laptop: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop',
  tablet: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop',
  
  // Clothing
  tshirt: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
  jeans: 'https://images.unsplash.com/photo-1542272454315-7ad9f0b297ac?w=800&h=800&fit=crop',
  dress: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=800&fit=crop',
  shoes: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop',
  
  // Furniture
  chair: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop',
  table: 'https://images.unsplash.com/photo-1549497538-303791108f95?w=800&h=800&fit=crop',
  sofa: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop',
  bed: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=800&fit=crop'
}

export async function seedComprehensiveProducts() {
  console.log('🌱 Starting comprehensive product seeding...')

  // Get all categories
  const categories = await prisma.category.findMany({
    include: {
      children: true,
      _count: { select: { products: true } }
    }
  })

  console.log(`Found ${categories.length} categories`)
  // Helper function to generate SKU
  function generateSKU(categoryName: string, index: number): string {
    const prefix = categoryName.toUpperCase().substring(0, 4)
    return `${prefix}-${String(index).padStart(3, '0')}`
  }

  // Helper function to generate variants
  function createVariants(basePrice: number, sizes: string[], colors: string[]) {
    const variants = []
    let variantIndex = 1
    
    for (const size of sizes) {
      for (const color of colors) {
        // Price variation based on size and color
        let priceMultiplier = 1
        if (size === 'XL' || size === 'XXL') priceMultiplier = 1.1
        if (color === 'Premium' || color === 'Gold') priceMultiplier *= 1.15
        
        variants.push({
          sku: `VAR-${String(variantIndex).padStart(3, '0')}`,
          name: `${size} - ${color}`,
          price: Math.round(basePrice * priceMultiplier * 100) / 100,
          stock: Math.floor(Math.random() * 100) + 20,
          attributes: {
            size: size,
            color: color
          }
        })
        variantIndex++
      }
    }
    return variants
  }

  // COOKWARE PRODUCTS
  const cookwareProducts = [
    {
      name: 'Professional Non-Stick Frying Pan Set',
      slug: 'professional-non-stick-frying-pan-set',
      description: 'Premium 3-piece non-stick frying pan set with ergonomic handles. Perfect for professional and home kitchens. PFOA-free coating ensures healthy cooking.',
      basePrice: 89.99,
      compareAtPrice: 129.99,
      costPrice: 45.00,
      images: [PRODUCT_IMAGES.nonStickPan],
      weightKg: 2.5,
      hsCode: '7323.93',
      material: 'Aluminum with Non-stick Coating',
      minOrderQty: 2,
      wholesalePrice: 65.00,
      variants: createVariants(89.99, ['20cm', '24cm', '28cm'], ['Black', 'Red', 'Stainless'])
    },
    {
      name: 'Heavy-Duty Stainless Steel Stock Pot',
      slug: 'heavy-duty-stainless-steel-stock-pot',
      description: 'Professional grade 8-quart stainless steel stock pot with tri-ply base for even heat distribution. Perfect for soups, stews, and pasta.',
      basePrice: 124.99,
      compareAtPrice: 179.99,
      costPrice: 62.00,
      images: [PRODUCT_IMAGES.stockPot],
      weightKg: 3.2,
      hsCode: '7323.93',
      material: '304 Stainless Steel',
      minOrderQty: 1,
      wholesalePrice: 89.99,
      variants: createVariants(124.99, ['6L', '8L', '12L'], ['Silver', 'Brushed'])
    },
    {
      name: 'Carbon Steel Wok with Lid',
      slug: 'carbon-steel-wok-with-lid',
      description: 'Traditional 14-inch carbon steel wok with dome lid. Pre-seasoned and ready to use. Includes wooden handles for safe handling.',
      basePrice: 68.99,
      compareAtPrice: 95.99,
      costPrice: 28.00,
      images: [PRODUCT_IMAGES.wok],
      weightKg: 2.8,
      hsCode: '7323.93',
      material: 'Carbon Steel',
      minOrderQty: 2,
      wholesalePrice: 48.99,
      variants: createVariants(68.99, ['12inch', '14inch', '16inch'], ['Black', 'Natural'])
    },
    {
      name: 'Ceramic Coated Sauce Pan Set',
      slug: 'ceramic-coated-sauce-pan-set',
      description: '4-piece ceramic coated sauce pan set with pour spouts and measurement marks. Non-toxic ceramic coating for healthy cooking.',
      basePrice: 76.99,
      compareAtPrice: 108.99,
      costPrice: 35.00,
      images: [PRODUCT_IMAGES.saucePan],
      weightKg: 2.1,
      hsCode: '7323.93',
      material: 'Aluminum with Ceramic Coating',
      minOrderQty: 1,
      wholesalePrice: 54.99,
      variants: createVariants(76.99, ['1.5L', '2L', '3L'], ['White', 'Blue', 'Green'])
    }
  ]

  // BAKEWARE PRODUCTS  
  const bakewareProducts = [
    {
      name: 'Professional Cake Pan Set - 3 Sizes',
      slug: 'professional-cake-pan-set-3-sizes',
      description: 'Premium aluminum cake pan set includes 6", 8", and 10" round pans. Non-stick coating ensures easy release and cleanup.',
      basePrice: 45.99,
      compareAtPrice: 68.99,
      costPrice: 22.00,
      images: [PRODUCT_IMAGES.cakePane],
      weightKg: 1.2,
      hsCode: '7323.93',
      material: 'Aluminum with Non-stick Coating',
      minOrderQty: 2,
      wholesalePrice: 32.99,
      variants: createVariants(45.99, ['6inch', '8inch', '10inch'], ['Silver', 'Black', 'Rose Gold'])
    },
    {
      name: '24-Cup Commercial Muffin Tin',
      slug: '24-cup-commercial-muffin-tin',
      description: 'Heavy-duty 24-cup muffin tin perfect for bakeries and large families. Even heat distribution for perfectly baked muffins every time.',
      basePrice: 38.99,
      compareAtPrice: 55.99,
      costPrice: 18.00,
      images: [PRODUCT_IMAGES.muffinTin],
      weightKg: 1.8,
      hsCode: '7323.93',
      material: 'Carbon Steel',
      minOrderQty: 2,
      wholesalePrice: 27.99,
      variants: createVariants(38.99, ['12-Cup', '24-Cup', '36-Cup'], ['Silver', 'Black'])
    },
    {
      name: 'Half-Sheet Baking Pans - Restaurant Quality',
      slug: 'half-sheet-baking-pans-restaurant-quality',
      description: 'Set of 2 aluminum half-sheet pans (13x18 inches). Restaurant-grade quality with reinforced edges for durability.',
      basePrice: 32.99,
      compareAtPrice: 48.99,
      costPrice: 15.00,
      images: [PRODUCT_IMAGES.bakingSheet],
      weightKg: 1.4,
      hsCode: '7323.93',
      material: 'Aluminum',
      minOrderQty: 2,
      wholesalePrice: 23.99,
      variants: createVariants(32.99, ['Half-Sheet', 'Quarter-Sheet', 'Full-Sheet'], ['Silver', 'Black'])
    },
    {
      name: 'Artisan Bread Loaf Pan Set',
      slug: 'artisan-bread-loaf-pan-set',
      description: 'Set of 3 premium loaf pans in different sizes. Perfect for bread, meatloaf, and pound cakes. Easy-release coating.',
      basePrice: 29.99,
      compareAtPrice: 42.99,
      costPrice: 14.00,
      images: [PRODUCT_IMAGES.loafPan],
      weightKg: 1.1,
      hsCode: '7323.93',
      material: 'Aluminum with Non-stick Coating',
      minOrderQty: 2,
      wholesalePrice: 21.99,
      variants: createVariants(29.99, ['Small', 'Medium', 'Large'], ['Silver', 'Black', 'Copper'])
    }
  ]

  // KITCHEN UTENSILS PRODUCTS
  const utensilProducts = [
    {
      name: 'Premium Silicone Cooking Utensil Set - 12 Pieces',
      slug: 'premium-silicone-cooking-utensil-set-12-pieces',
      description: 'Complete 12-piece silicone utensil set with stainless steel handles. Heat resistant up to 450°F. Includes holder.',
      basePrice: 56.99,
      compareAtPrice: 79.99,
      costPrice: 25.00,
      images: [PRODUCT_IMAGES.spatulaSet],
      weightKg: 1.3,
      hsCode: '3924.10',
      material: 'Silicone and Stainless Steel',
      minOrderQty: 2,
      wholesalePrice: 39.99,
      variants: createVariants(56.99, ['12-Piece', '15-Piece', '18-Piece'], ['Black', 'Red', 'Blue', 'Green'])
    },
    {
      name: 'Professional Chef Knife Set - German Steel',
      slug: 'professional-chef-knife-set-german-steel',
      description: '8-piece German steel knife set with magnetic block. Includes chef, paring, utility, bread, and steak knives.',
      basePrice: 189.99,
      compareAtPrice: 279.99,
      costPrice: 85.00,
      images: [PRODUCT_IMAGES.kniveSet],
      weightKg: 2.5,
      hsCode: '8211.91',
      material: 'German Stainless Steel',
      minOrderQty: 1,
      wholesalePrice: 135.99,
      variants: createVariants(189.99, ['6-Piece', '8-Piece', '12-Piece'], ['Black Handle', 'Wood Handle'])
    },
    {
      name: 'Stainless Steel Wire Whisk Set',
      slug: 'stainless-steel-wire-whisk-set',
      description: 'Set of 3 professional whisks in different sizes. Perfect for whipping cream, beating eggs, and mixing batters.',
      basePrice: 24.99,
      compareAtPrice: 34.99,
      costPrice: 11.00,
      images: [PRODUCT_IMAGES.whisk],
      weightKg: 0.5,
      hsCode: '8205.51',
      material: 'Stainless Steel',
      minOrderQty: 3,
      wholesalePrice: 17.99,
      variants: createVariants(24.99, ['Small', 'Medium', 'Large'], ['Silver', 'Black Handle'])
    }
  ]

  // SMALL APPLIANCES PRODUCTS
  const applianceProducts = [
    {
      name: 'High-Performance Blender - 1200W',
      slug: 'high-performance-blender-1200w',
      description: '1200W professional blender with variable speed control and pulse function. Perfect for smoothies, soups, and nut butters.',
      basePrice: 149.99,
      compareAtPrice: 199.99,
      costPrice: 75.00,
      images: [PRODUCT_IMAGES.blender],
      weightKg: 4.2,
      hsCode: '8509.40',
      material: 'Stainless Steel and BPA-Free Plastic',
      minOrderQty: 1,
      wholesalePrice: 109.99,
      variants: createVariants(149.99, ['900W', '1200W', '1500W'], ['Black', 'Silver', 'Red'])
    },
    {
      name: '4-Slice Stainless Steel Toaster',
      slug: '4-slice-stainless-steel-toaster',
      description: 'Premium 4-slice toaster with 7 browning settings, cancel function, and removable crumb tray. Brushed stainless steel finish.',
      basePrice: 78.99,
      compareAtPrice: 108.99,
      costPrice: 35.00,
      images: [PRODUCT_IMAGES.toaster],
      weightKg: 3.1,
      hsCode: '8516.72',
      material: 'Stainless Steel',
      minOrderQty: 2,
      wholesalePrice: 56.99,
      variants: createVariants(78.99, ['2-Slice', '4-Slice', '6-Slice'], ['Stainless', 'Black', 'White'])
    },
    {
      name: 'Programmable Coffee Maker - 12 Cup',
      slug: 'programmable-coffee-maker-12-cup',
      description: '12-cup programmable coffee maker with auto-shutoff, pause-and-serve, and gold-tone filter. Perfect for offices and homes.',
      basePrice: 94.99,
      compareAtPrice: 134.99,
      costPrice: 42.00,
      images: [PRODUCT_IMAGES.coffeeMaker],
      weightKg: 3.8,
      hsCode: '8516.71',
      material: 'Stainless Steel and Plastic',
      minOrderQty: 1,
      wholesalePrice: 68.99,
      variants: createVariants(94.99, ['10-Cup', '12-Cup', '14-Cup'], ['Black', 'Stainless', 'White'])
    }
  ]
  // TABLEWARE PRODUCTS
  const tablewareProducts = [
    {
      name: '16-Piece Porcelain Dinner Set - Classic White',
      slug: '16-piece-porcelain-dinner-set-classic-white',
      description: 'Elegant 16-piece porcelain dinner set serves 4. Includes dinner plates, salad plates, bowls, and mugs. Dishwasher safe.',
      basePrice: 89.99,
      compareAtPrice: 129.99,
      costPrice: 40.00,
      images: [PRODUCT_IMAGES.dinnerSet],
      weightKg: 4.5,
      hsCode: '6911.10',
      material: 'High-Quality Porcelain',
      minOrderQty: 1,
      wholesalePrice: 64.99,
      variants: createVariants(89.99, ['12-Piece', '16-Piece', '20-Piece'], ['White', 'Blue Pattern', 'Floral'])
    },
    {
      name: 'Crystal Wine Glass Set - 6 Pieces',
      slug: 'crystal-wine-glass-set-6-pieces',
      description: 'Premium crystal wine glasses with elegant stems. Perfect for red wine, white wine, or champagne. Gift boxed.',
      basePrice: 67.99,
      compareAtPrice: 95.99,
      costPrice: 28.00,
      images: [PRODUCT_IMAGES.glasses],
      weightKg: 1.8,
      hsCode: '7013.37',
      material: 'Lead-Free Crystal',
      minOrderQty: 2,
      wholesalePrice: 48.99,
      variants: createVariants(67.99, ['4-Piece', '6-Piece', '8-Piece'], ['Clear', 'Smoke', 'Amber'])
    },
    {
      name: 'Stainless Steel Flatware Set - 20 Pieces',
      slug: 'stainless-steel-flatware-set-20-pieces',
      description: '20-piece stainless steel flatware set serves 4. Mirror finish with comfortable grip handles. Dishwasher safe.',
      basePrice: 45.99,
      compareAtPrice: 68.99,
      costPrice: 20.00,
      images: [PRODUCT_IMAGES.silverware],
      weightKg: 1.2,
      hsCode: '8215.20',
      material: '18/10 Stainless Steel',
      minOrderQty: 2,
      wholesalePrice: 32.99,
      variants: createVariants(45.99, ['16-Piece', '20-Piece', '24-Piece'], ['Mirror', 'Matte', 'Gold'])
    }
  ]

  // ELECTRONICS PRODUCTS
  const electronicsProducts = [
    {
      name: 'Wireless Bluetooth Headphones - Noise Cancelling',
      slug: 'wireless-bluetooth-headphones-noise-cancelling',
      description: 'Premium wireless headphones with active noise cancellation. 30-hour battery life, quick charge, and superior sound quality.',
      basePrice: 129.99,
      compareAtPrice: 179.99,
      costPrice: 60.00,
      images: [PRODUCT_IMAGES.headphones],
      weightKg: 0.3,
      hsCode: '8518.30',
      material: 'Plastic and Metal',
      minOrderQty: 2,
      wholesalePrice: 92.99,
      variants: createVariants(129.99, ['Standard', 'Pro', 'Max'], ['Black', 'White', 'Silver', 'Rose Gold'])
    },
    {
      name: '64GB Smartphone - Dual Camera',
      slug: '64gb-smartphone-dual-camera',
      description: 'Latest smartphone with dual camera system, 6.1-inch display, and 64GB storage. Fast processor and all-day battery life.',
      basePrice: 299.99,
      compareAtPrice: 399.99,
      costPrice: 150.00,
      images: [PRODUCT_IMAGES.smartphone],
      weightKg: 0.2,
      hsCode: '8517.13',
      material: 'Aluminum and Glass',
      minOrderQty: 1,
      wholesalePrice: 219.99,
      variants: createVariants(299.99, ['32GB', '64GB', '128GB'], ['Black', 'White', 'Blue', 'Red'])
    },
    {
      name: 'Business Laptop - 15.6 Inch',
      slug: 'business-laptop-15-6-inch',
      description: 'Professional laptop with Intel processor, 8GB RAM, 256GB SSD. Perfect for business, students, and everyday use.',
      basePrice: 549.99,
      compareAtPrice: 699.99,
      costPrice: 285.00,
      images: [PRODUCT_IMAGES.laptop],
      weightKg: 2.1,
      hsCode: '8471.30',
      material: 'Aluminum and Plastic',
      minOrderQty: 1,
      wholesalePrice: 399.99,
      variants: createVariants(549.99, ['13-inch', '15.6-inch', '17-inch'], ['Silver', 'Space Gray', 'Black'])
    },
    {
      name: '10-Inch Android Tablet',
      slug: '10-inch-android-tablet',
      description: '10-inch Android tablet with HD display, 32GB storage, and 10-hour battery life. Perfect for entertainment and productivity.',
      basePrice: 189.99,
      compareAtPrice: 249.99,
      costPrice: 95.00,
      images: [PRODUCT_IMAGES.tablet],
      weightKg: 0.5,
      hsCode: '8471.30',
      material: 'Aluminum and Glass',
      minOrderQty: 2,
      wholesalePrice: 139.99,
      variants: createVariants(189.99, ['8-inch', '10-inch', '12-inch'], ['Black', 'White', 'Gold'])
    }
  ]

  // CLOTHING PRODUCTS
  const clothingProducts = [
    {
      name: 'Premium Cotton T-Shirt - Unisex',
      slug: 'premium-cotton-t-shirt-unisex',
      description: '100% premium cotton t-shirt with reinforced seams. Comfortable fit, pre-shrunk fabric, and available in multiple colors.',
      basePrice: 24.99,
      compareAtPrice: 34.99,
      costPrice: 8.00,
      images: [PRODUCT_IMAGES.tshirt],
      weightKg: 0.2,
      hsCode: '6109.10',
      material: '100% Cotton',
      minOrderQty: 5,
      wholesalePrice: 16.99,
      variants: createVariants(24.99, ['XS', 'S', 'M', 'L', 'XL', 'XXL'], ['White', 'Black', 'Navy', 'Red', 'Green'])
    },
    {
      name: 'Classic Denim Jeans - Straight Cut',
      slug: 'classic-denim-jeans-straight-cut',
      description: 'Classic straight-cut denim jeans with 5-pocket design. Durable construction, comfortable fit, and timeless style.',
      basePrice: 59.99,
      compareAtPrice: 89.99,
      costPrice: 22.00,
      images: [PRODUCT_IMAGES.jeans],
      weightKg: 0.8,
      hsCode: '6203.42',
      material: '98% Cotton, 2% Elastane',
      minOrderQty: 3,
      wholesalePrice: 41.99,
      variants: createVariants(59.99, ['28', '30', '32', '34', '36', '38'], ['Dark Blue', 'Light Blue', 'Black'])
    },
    {
      name: 'Elegant Summer Dress',
      slug: 'elegant-summer-dress',
      description: 'Beautiful summer dress with floral print. Lightweight fabric, comfortable fit, perfect for casual and semi-formal occasions.',
      basePrice: 49.99,
      compareAtPrice: 74.99,
      costPrice: 18.00,
      images: [PRODUCT_IMAGES.dress],
      weightKg: 0.3,
      hsCode: '6204.44',
      material: '100% Polyester',
      minOrderQty: 3,
      wholesalePrice: 34.99,
      variants: createVariants(49.99, ['XS', 'S', 'M', 'L', 'XL'], ['Floral Blue', 'Floral Pink', 'Solid Black'])
    },
    {
      name: 'Comfortable Running Shoes',
      slug: 'comfortable-running-shoes',
      description: 'Lightweight running shoes with cushioned sole and breathable mesh upper. Perfect for running, walking, and gym workouts.',
      basePrice: 79.99,
      compareAtPrice: 119.99,
      costPrice: 32.00,
      images: [PRODUCT_IMAGES.shoes],
      weightKg: 0.8,
      hsCode: '6404.11',
      material: 'Mesh and Rubber',
      minOrderQty: 2,
      wholesalePrice: 55.99,
      variants: createVariants(79.99, ['7', '8', '9', '10', '11', '12'], ['Black/White', 'Navy/Gray', 'Red/Black'])
    }
  ]

  // FURNITURE PRODUCTS
  const furnitureProducts = [
    {
      name: 'Ergonomic Office Chair - Mesh Back',
      slug: 'ergonomic-office-chair-mesh-back',
      description: 'Professional office chair with mesh back, adjustable height, lumbar support, and armrests. Perfect for long work sessions.',
      basePrice: 189.99,
      compareAtPrice: 259.99,
      costPrice: 85.00,
      images: [PRODUCT_IMAGES.chair],
      weightKg: 15.2,
      hsCode: '9401.30',
      material: 'Mesh, Steel, and Plastic',
      minOrderQty: 1,
      wholesalePrice: 135.99,
      variants: createVariants(189.99, ['Standard', 'Executive', 'Gaming'], ['Black', 'Gray', 'White'])
    },
    {
      name: 'Modern Coffee Table - Glass Top',
      slug: 'modern-coffee-table-glass-top',
      description: 'Contemporary coffee table with tempered glass top and steel legs. Perfect centerpiece for modern living rooms.',
      basePrice: 299.99,
      compareAtPrice: 399.99,
      costPrice: 135.00,
      images: [PRODUCT_IMAGES.table],
      weightKg: 25.4,
      hsCode: '9403.20',
      material: 'Tempered Glass and Steel',
      minOrderQty: 1,
      wholesalePrice: 215.99,
      variants: createVariants(299.99, ['Small', 'Medium', 'Large'], ['Clear Glass', 'Smoked Glass'])
    },
    {
      name: '3-Seater Fabric Sofa',
      slug: '3-seater-fabric-sofa',
      description: 'Comfortable 3-seater sofa with high-quality fabric upholstery. Sturdy wooden frame and plush cushions for maximum comfort.',
      basePrice: 749.99,
      compareAtPrice: 999.99,
      costPrice: 325.00,
      images: [PRODUCT_IMAGES.sofa],
      weightKg: 45.8,
      hsCode: '9401.61',
      material: 'Wood Frame and Fabric',
      minOrderQty: 1,
      wholesalePrice: 539.99,
      variants: createVariants(749.99, ['2-Seater', '3-Seater', 'L-Shape'], ['Gray', 'Beige', 'Navy', 'Brown'])
    },
    {
      name: 'Queen Size Platform Bed Frame',
      slug: 'queen-size-platform-bed-frame',
      description: 'Modern platform bed frame with built-in nightstands. Solid wood construction with clean lines and minimalist design.',
      basePrice: 459.99,
      compareAtPrice: 649.99,
      costPrice: 195.00,
      images: [PRODUCT_IMAGES.bed],
      weightKg: 38.6,
      hsCode: '9403.50',
      material: 'Solid Wood',
      minOrderQty: 1,
      wholesalePrice: 329.99,
      variants: createVariants(459.99, ['Twin', 'Full', 'Queen', 'King'], ['Natural Wood', 'White', 'Walnut'])
    }
  ]

  // Product categories mapping
  const productsByCategory = {
    'cookware': cookwareProducts,
    'bakeware': bakewareProducts,
    'kitchen-utensils': utensilProducts,
    'small-appliances': applianceProducts,
    'cutlery': tablewareProducts,
    'electronics': electronicsProducts,
    'smartphones': electronicsProducts.slice(1, 2), // Just smartphone
    'laptops': electronicsProducts.slice(2, 3), // Just laptop
    'tablets': electronicsProducts.slice(3, 4), // Just tablet
    'clothing': clothingProducts,
    'mens-clothing': clothingProducts,
    'womens-clothing': clothingProducts,
    'kids-clothing': clothingProducts,
    'shoes': clothingProducts.slice(3, 4), // Just shoes
    'furniture': furnitureProducts,
    'living-room': furnitureProducts.slice(1, 3), // Sofa and table
    'bedroom': furnitureProducts.slice(3, 4), // Just bed
    'office-furniture': furnitureProducts.slice(0, 1), // Just chair
  }
  // Now create products for each category
  let totalProductsCreated = 0
  
  for (const category of categories) {
    if (category._count.products > 0) {
      console.log(`⏭️ Skipping ${category.name} - already has ${category._count.products} products`)
      continue
    }

    const categoryProducts = productsByCategory[category.slug] || []
    
    if (categoryProducts.length === 0) {
      console.log(`⚠️ No products defined for category: ${category.name} (${category.slug})`)
      continue
    }

    console.log(`📦 Creating ${categoryProducts.length} products for ${category.name}...`)

    for (let i = 0; i < categoryProducts.length; i++) {
      const productTemplate = categoryProducts[i]
      
      try {
        // Create the main product
        const product = await prisma.product.create({
          data: {
            sku: generateSKU(category.name, i + 1),
            name: productTemplate.name,
            slug: productTemplate.slug,
            description: productTemplate.description,
            categoryId: category.id,
            price: productTemplate.basePrice,
            compareAtPrice: productTemplate.compareAtPrice,
            costPrice: productTemplate.costPrice,
            stock: Math.floor(Math.random() * 200) + 50,
            lowStockThreshold: 10,
            images: productTemplate.images,
            weightKg: productTemplate.weightKg,
            hsCode: productTemplate.hsCode,
            countryOfOrigin: 'China',
            material: productTemplate.material,
            minOrderQty: productTemplate.minOrderQty,
            wholesalePrice: productTemplate.wholesalePrice,
            isActive: true,
            isFeatured: Math.random() > 0.7, // 30% chance of being featured
            isNewArrival: Math.random() > 0.8, // 20% chance of being new arrival
            metaTitle: `${productTemplate.name} - Premium Quality`,
            metaDescription: productTemplate.description.substring(0, 160)
          }
        })

        // Create product variants if defined
        if (productTemplate.variants && productTemplate.variants.length > 0) {
          for (const variantTemplate of productTemplate.variants.slice(0, 6)) { // Limit to 6 variants per product
            await prisma.productVariant.create({
              data: {
                productId: product.id,
                sku: `${product.sku}-${variantTemplate.sku}`,
                price: variantTemplate.price,
                comparePrice: variantTemplate.price * 1.3,
                stock: variantTemplate.stock,
                attributes: variantTemplate.attributes,
                images: productTemplate.images, // Use same images as main product
                isActive: true
              }
            })
          }
        }

        totalProductsCreated++
        
      } catch (error) {
        console.error(`❌ Error creating product ${productTemplate.name}:`, error)
      }
    }
    
    console.log(`✅ Created products for ${category.name}`)
  }
  console.log(`🎉 Successfully created ${totalProductsCreated} products with variants and attributes!`)
  
  // Update category product counts
  const categoryStats = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } }
    }
  })
  
  console.log('\n📊 Category Statistics:')
  categoryStats.forEach(cat => {
    if (cat._count.products > 0) {
      console.log(`   ${cat.name}: ${cat._count.products} products`)
    }
  })
  
  return { productsCreated: totalProductsCreated }
}

// Helper function to seed attributes for categories
async function seedAttributesForCategories() {
  console.log('🏷️ Creating product attributes...')
  
  const attributeTemplates = [
    // Universal attributes
    { name: 'Brand', slug: 'brand', type: AttributeType.TEXT, isFilterable: true },
    { name: 'Color', slug: 'color', type: AttributeType.COLOR, isFilterable: true, isVariant: true },
    { name: 'Size', slug: 'size', type: AttributeType.SELECT, isFilterable: true, isVariant: true, 
      options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    { name: 'Material', slug: 'material', type: AttributeType.SELECT, isFilterable: true,
      options: ['Cotton', 'Polyester', 'Steel', 'Aluminum', 'Plastic', 'Wood', 'Glass'] },
    { name: 'Weight', slug: 'weight', type: AttributeType.NUMBER, isFilterable: true },
    { name: 'Dimensions', slug: 'dimensions', type: AttributeType.TEXT, isFilterable: false },
    { name: 'Warranty', slug: 'warranty', type: AttributeType.SELECT, isFilterable: true,
      options: ['1 Year', '2 Years', '3 Years', '5 Years', 'Lifetime'] }
  ]
  
  // Create attributes
  for (const attrTemplate of attributeTemplates) {
    try {
      await prisma.attribute.upsert({
        where: { slug: attrTemplate.slug },
        update: {},
        create: {
          name: attrTemplate.name,
          slug: attrTemplate.slug,
          type: attrTemplate.type,
          options: attrTemplate.options || null,
          isFilterable: attrTemplate.isFilterable,
          isVariant: attrTemplate.isVariant || false,
          isActive: true
        }
      })
    } catch (error) {
      console.error(`Error creating attribute ${attrTemplate.name}:`, error)
    }
  }
  
  console.log('✅ Product attributes created')
}

// Main execution
if (require.main === module) {
  seedAttributesForCategories()
    .then(() => seedComprehensiveProducts())
    .then(() => {
      console.log('🌟 Comprehensive product seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
    .finally(() => {
      prisma.$disconnect()
    })
}