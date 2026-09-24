const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const targetDirs = [
  path.join(__dirname, '..', 'public', 'images'),
  path.join(__dirname, '..', 'public', 'uploads'),
];

let convertedCount = 0;
let skippedCount = 0;

async function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
    return;
  }

  const stat = fs.statSync(filePath);
  if (!stat.isFile() || stat.size === 0) return;

  const header = fs.readFileSync(filePath, { flag: 'r' }).slice(0, 50).toString('utf8');
  if (header.includes('<svg') || header.includes('<?xml')) {
    console.log(`Converting fake image to genuine binary: ${filePath} (${stat.size} bytes)...`);
    const svgBuffer = fs.readFileSync(filePath);
    
    // Render SVG into genuine JPEG binary buffer with sharp
    const jpegBuffer = await sharp(svgBuffer, { density: 150 })
      .jpeg({ quality: 90, progressive: true })
      .toBuffer();

    fs.writeFileSync(filePath, jpegBuffer);
    const newStat = fs.statSync(filePath);
    console.log(`  ✓ Converted to real JPEG: ${newStat.size} bytes, magic: ${jpegBuffer.slice(0, 4).toString('hex')}`);
    convertedCount++;
  } else {
    skippedCount++;
  }
}

async function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
      await walk(fullPath);
    } else if (entry.isFile()) {
      await processFile(fullPath);
    }
  }
}

async function main() {
  console.log('🔍 Scanning for fake SVG images saved with .jpg / .png extensions...');
  for (const dir of targetDirs) {
    await walk(dir);
  }
  console.log(`\n🎉 Conversion complete! Converted ${convertedCount} fake images. Already valid: ${skippedCount}.`);
}

main().catch(err => {
  console.error('Fatal error converting images:', err);
  process.exit(1);
});
