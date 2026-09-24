const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generatePwaIcons() {
  const root = path.join(__dirname, '..');
  const sourceLogo = path.join(root, 'public', 'logo.png');
  const iconsDir = path.join(root, 'public', 'icons');

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('Generating production PWA & iOS Apple Touch Icons from:', sourceLogo);

  // Trim transparent borders from source logo for perfect centering
  const trimmedLogoBuffer = await sharp(sourceLogo).trim().toBuffer();

  // -------------------------------------------------------------
  // 1. Standard Transparent Android / Web Icons (PNG, RGBA)
  // -------------------------------------------------------------
  const standardSizes = [72, 96, 128, 144, 152, 192, 384, 512];

  for (const size of standardSizes) {
    const innerSize = Math.round(size * 0.88);
    const padding = Math.round((size - innerSize) / 2);

    const resizedLogo = await sharp(trimmedLogoBuffer)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const finalIcon = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: resizedLogo, top: padding, left: padding }])
      .png({ quality: 100, compressionLevel: 9 })
      .toBuffer();

    fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), finalIcon);
    fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), finalIcon);
    console.log(`✓ Generated icon-${size}.png and icon-${size}x${size}.png`);
  }

  // -------------------------------------------------------------
  // 2. Apple Touch Icons for iOS Safari (Opaque RGB, hasAlpha: false)
  // Apple HIG requirement: NO transparency, solid background
  // -------------------------------------------------------------
  const appleSizes = [
    { size: 180, inner: 140, name: 'apple-touch-icon-180x180.png' },
    { size: 167, inner: 130, name: 'apple-touch-icon-167x167.png' },
    { size: 152, inner: 118, name: 'apple-touch-icon-152x152.png' },
    { size: 120, inner: 94, name: 'apple-touch-icon-120x120.png' },
  ];

  for (const { size, inner, name } of appleSizes) {
    const padding = Math.round((size - inner) / 2);

    const resizedLogo = await sharp(trimmedLogoBuffer)
      .resize(inner, inner, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toBuffer();

    const appleIcon = await sharp({
      create: {
        width: size,
        height: size,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite([{ input: resizedLogo, top: padding, left: padding }])
      .flatten({ background: '#ffffff' })
      .png({ quality: 100, compressionLevel: 9 })
      .toBuffer();

    fs.writeFileSync(path.join(iconsDir, name), appleIcon);
    console.log(`✓ Generated ${name}`);

    // If 180x180, also write primary root and standard icon locations
    if (size === 180) {
      fs.writeFileSync(path.join(root, 'public', 'apple-touch-icon.png'), appleIcon);
      fs.writeFileSync(path.join(root, 'public', 'apple-touch-icon-precomposed.png'), appleIcon);
      fs.writeFileSync(path.join(root, 'public', 'apple-touch-icon-180x180.png'), appleIcon);
      fs.writeFileSync(path.join(root, 'public', 'apple-touch-icon-180x180-precomposed.png'), appleIcon);
      fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), appleIcon);
      fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon-precomposed.png'), appleIcon);
      console.log('✓ Written root /apple-touch-icon.png and /apple-touch-icon-precomposed.png');
    }
  }

  // -------------------------------------------------------------
  // 3. Android Adaptive / Maskable Icon (512x512, Safe Area)
  // Safe area: centered within 75% circle so circular/squircle crops don't cut logo
  // -------------------------------------------------------------
  const maskableSize = 512;
  const maskableInner = 370;
  const maskablePadding = Math.round((maskableSize - maskableInner) / 2);

  const maskableResized = await sharp(trimmedLogoBuffer)
    .resize(maskableInner, maskableInner, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();

  const maskableIcon = await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: maskableResized, top: maskablePadding, left: maskablePadding }])
    .flatten({ background: '#ffffff' })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(iconsDir, 'maskable-512.png'), maskableIcon);
  fs.writeFileSync(path.join(iconsDir, 'maskable-512x512.png'), maskableIcon);
  console.log('✓ Generated maskable-512.png and maskable-512x512.png');

  // -------------------------------------------------------------
  // 4. Favicon files
  // -------------------------------------------------------------
  const favicon32 = await sharp(trimmedLogoBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(root, 'public', 'favicon.png'), favicon32);
  fs.writeFileSync(path.join(root, 'public', 'favicon-32x32.png'), favicon32);

  const favicon16 = await sharp(trimmedLogoBuffer)
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(root, 'public', 'favicon-16x16.png'), favicon16);
  console.log('✓ Generated favicon-32x32.png and favicon-16x16.png');

  console.log('\nAll PWA and iOS Apple Touch Icons successfully generated!');
}

generatePwaIcons().catch(console.error);
