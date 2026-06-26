/**
 * Generate placeholder images using online services
 * Run: node scripts/generate-placeholders.js
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..', 'public', 'images');

// Placeholder image service URLs
const PLACEHOLDER_SERVICE = 'https://placehold.co';

const images = {
  hero: [
    { name: 'hero-1.jpg', width: 1920, height: 600, text: 'Premium Kitchenware', bg: '1a3a5c', color: 'ffffff' },
    { name: 'hero-2.jpg', width: 1920, height: 600, text: 'Wholesale Prices', bg: '1a1a2e', color: 'c9a84c' },
    { name: 'hero-3.jpg', width: 1920, height: 600, text: 'Export Ready', bg: '2c3e50', color: 'ffffff' },
  ],
  categories: [
    { name: 'cookware.jpg', width: 400, height: 300, text: 'Cookware', bg: 'e8e8e8', color: '333333' },
    { name: 'bakeware.jpg', width: 400, height: 300, text: 'Bakeware', bg: 'e8e8e8', color: '333333' },
    { name: 'utensils.jpg', width: 400, height: 300, text: 'Kitchen Utensils', bg: 'e8e8e8', color: '333333' },
    { name: 'appliances.jpg', width: 400, height: 300, text: 'Appliances', bg: 'e8e8e8', color: '333333' },
    { name: 'tableware.jpg', width: 400, height: 300, text: 'Tableware', bg: 'e8e8e8', color: '333333' },
    { name: 'storage.jpg', width: 400, height: 300, text: 'Storage', bg: 'e8e8e8', color: '333333' },
  ],
  services: [
    { name: 'air-freight.jpg', width: 400, height: 300, text: 'Air Freight', bg: '1a3a5c', color: 'ffffff' },
    { name: 'sea-freight.jpg', width: 400, height: 300, text: 'Sea Freight', bg: '1a3a5c', color: 'ffffff' },
    { name: 'customs.jpg', width: 400, height: 300, text: 'Customs', bg: '1a3a5c', color: 'ffffff' },
    { name: 'warehouse.jpg', width: 400, height: 300, text: 'Warehouse', bg: '1a3a5c', color: 'ffffff' },
    { name: 'sourcing.jpg', width: 400, height: 300, text: 'Sourcing', bg: '1a3a5c', color: 'ffffff' },
    { name: 'door-to-door.jpg', width: 400, height: 300, text: 'Door to Door', bg: '1a3a5c', color: 'ffffff' },
  ],
};

// Generate product placeholder URLs (we'll use a single generic image for all products)
const productPlaceholder = { width: 800, height: 800, text: 'Product Image', bg: 'f8f9fa', color: '666666' };

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

async function generatePlaceholders() {
  console.log('🎨 Generating placeholder images for YIWU EXPRESS...\n');

  // Generate hero images
  console.log('📸 Generating hero images...');
  for (const img of images.hero) {
    const url = `${PLACEHOLDER_SERVICE}/${img.width}x${img.height}/${img.bg}/${img.color}?text=${encodeURIComponent(img.text)}`;
    const filepath = path.join(BASE_DIR, 'hero', img.name);
    try {
      await downloadImage(url, filepath);
      console.log(`  ✓ ${img.name}`);
    } catch (err) {
      console.error(`  ✗ Failed to download ${img.name}:`, err.message);
    }
  }

  // Generate category images
  console.log('\n📸 Generating category images...');
  for (const img of images.categories) {
    const url = `${PLACEHOLDER_SERVICE}/${img.width}x${img.height}/${img.bg}/${img.color}?text=${encodeURIComponent(img.text)}`;
    const filepath = path.join(BASE_DIR, 'categories', img.name);
    try {
      await downloadImage(url, filepath);
      console.log(`  ✓ ${img.name}`);
    } catch (err) {
      console.error(`  ✗ Failed to download ${img.name}:`, err.message);
    }
  }

  // Generate service images
  console.log('\n📸 Generating service images...');
  for (const img of images.services) {
    const url = `${PLACEHOLDER_SERVICE}/${img.width}x${img.height}/${img.bg}/${img.color}?text=${encodeURIComponent(img.text)}`;
    const filepath = path.join(BASE_DIR, 'services', img.name);
    try {
      await downloadImage(url, filepath);
      console.log(`  ✓ ${img.name}`);
    } catch (err) {
      console.error(`  ✗ Failed to download ${img.name}:`, err.message);
    }
  }

  // Generate a generic product placeholder
  console.log('\n📸 Generating product placeholder...');
  const productUrl = `${PLACEHOLDER_SERVICE}/${productPlaceholder.width}x${productPlaceholder.height}/${productPlaceholder.bg}/${productPlaceholder.color}?text=${encodeURIComponent(productPlaceholder.text)}`;
  const productFilepath = path.join(BASE_DIR, 'products', 'placeholder.jpg');
  try {
    await downloadImage(productUrl, productFilepath);
    console.log(`  ✓ placeholder.jpg`);
  } catch (err) {
    console.error(`  ✗ Failed to download product placeholder:`, err.message);
  }

  console.log('\n✅ Placeholder generation complete!');
  console.log('\n📝 Note: These are temporary placeholders. Replace with actual product photos before production.');
}

generatePlaceholders().catch(console.error);
