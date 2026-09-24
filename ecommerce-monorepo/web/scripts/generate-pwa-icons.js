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

  console.log('Generating PWA icons from:', sourceLogo);

  // 1. Standard transparent icons
  const standardSizes = [72, 96, 128, 144, 152, 192, 384, 512];

  for (const size of standardSizes) {
    // Fit logo within square with 10% padding so it looks balanced
    const innerSize = Math.round(size * 0.88);
    const padding = Math.round((size - innerSize) / 2);

    const resizedLogo = await sharp(sourceLogo)
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
      .png()
      .toBuffer();

    // Write icon-SIZE.png and icon-SIZExSIZE.png
    fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), finalIcon);
    fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), finalIcon);
    console.log(`✓ Generated icon-${size}.png and icon-${size}x${size}.png`);
  }

  // 2. Apple Touch Icon (180x180 with clean solid background)
  // iOS Safari requires a solid background (no transparency)
  const appleTouchSize = 180;
  const appleInnerSize = 150;
  const applePadding = Math.round((appleTouchSize - appleInnerSize) / 2);

  const appleResized = await sharp(sourceLogo)
    .resize(appleInnerSize, appleInnerSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();

  const appleTouchIcon = await sharp({
    create: {
      width: appleTouchSize,
      height: appleTouchSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: appleResized, top: applePadding, left: applePadding }])
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), appleTouchIcon);
  fs.writeFileSync(path.join(root, 'public', 'apple-touch-icon.png'), appleTouchIcon);
  console.log('✓ Generated apple-touch-icon.png');

  // 3. Maskable Icon (512x512)
  // Android adaptive icons: safe zone is the inner 75% circle
  const maskableSize = 512;
  const maskableInnerSize = Math.round(maskableSize * 0.72); // 368px
  const maskablePadding = Math.round((maskableSize - maskableInnerSize) / 2);

  const maskableResized = await sharp(sourceLogo)
    .resize(maskableInnerSize, maskableInnerSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();

  const maskableIcon = await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: maskableResized, top: maskablePadding, left: maskablePadding }])
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(iconsDir, 'maskable-512.png'), maskableIcon);
  fs.writeFileSync(path.join(iconsDir, 'maskable-512x512.png'), maskableIcon);
  console.log('✓ Generated maskable-512.png and maskable-512x512.png');

  // 4. Favicon PNGs
  const favicon32 = await sharp(sourceLogo).resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  fs.writeFileSync(path.join(root, 'public', 'favicon.png'), favicon32);
  fs.writeFileSync(path.join(root, 'public', 'favicon-32x32.png'), favicon32);

  const favicon16 = await sharp(sourceLogo).resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  fs.writeFileSync(path.join(root, 'public', 'favicon-16x16.png'), favicon16);
  console.log('✓ Generated favicon-32x32.png and favicon-16x16.png');

  console.log('\nAll PWA icons successfully generated from official Dromkok logo!');
}

generatePwaIcons().catch(console.error);
