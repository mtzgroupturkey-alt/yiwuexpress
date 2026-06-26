# YIWU EXPRESS - Image Assets

This directory contains placeholder images for the YIWU EXPRESS store.

## Directory Structure

```
/public/images/
├── hero/              # Hero banner images
├── categories/        # Category images
├── products/          # Product images
├── logo.svg          # Main logo
├── logo-white.svg    # White logo for dark backgrounds
└── favicon.ico       # Browser favicon
```

## Image Sources

### Free Stock Photo Sites for Kitchenware

1. **Unsplash** - https://unsplash.com/s/photos/kitchenware
2. **Pexels** - https://www.pexels.com/search/kitchenware/
3. **Pixabay** - https://pixabay.com/images/search/kitchen/

### Placeholder Image Services

- **Picsum Photos** - https://picsum.photos/ (Random images)
- **PlaceHolder.com** - https://placeholder.com/ (Solid colors with text)

## Image Specifications

| Type | Recommended Size | Aspect Ratio | Format |
|:-----|:----------------|:-------------|:-------|
| Product Main | 800x800px | 1:1 | WebP/JPEG |
| Product Thumbnail | 200x200px | 1:1 | WebP/JPEG |
| Category | 400x300px | 4:3 | WebP/JPEG |
| Hero Banner | 1920x600px | 16:5 | WebP/JPEG |
| Logo | 200x50px | 4:1 | SVG/PNG |
| Favicon | 32x32px | 1:1 | ICO/PNG |

## Quick Setup (Using Placeholders)

For development, you can use placeholder URLs directly in your components:

```tsx
// Product images
<img src="https://picsum.photos/seed/product1/800/800" alt="Product" />

// Category images
<img src="https://picsum.photos/seed/cookware/400/300" alt="Cookware" />

// Hero images
<img src="https://picsum.photos/seed/hero1/1920/600" alt="Hero" />
```

## Recommended Search Terms

### For Products:
- "stainless steel cookware"
- "non-stick frying pan"
- "cast iron skillet"
- "baking sheets"
- "kitchen utensils"
- "coffee maker"
- "dinner plates"

### For Categories:
- "cookware collection"
- "bakeware set"
- "kitchen tools"
- "kitchen appliances"
- "tableware display"

### For Hero Banners:
- "wholesale kitchenware"
- "kitchen market"
- "export goods"
- "trade show kitchenware"

## Image Optimization

All images should be optimized before upload:

1. **Resize** to recommended dimensions
2. **Compress** using tools like TinyPNG or Squoosh
3. **Convert** to WebP format when possible
4. **Lazy load** using Next.js Image component

```tsx
import Image from 'next/image'

<Image
  src="/images/products/product-1.jpg"
  alt="Product name"
  width={800}
  height={800}
  className="object-cover"
  loading="lazy"
/>
```

## Current Status

- [ ] Hero images (3 needed)
- [ ] Category images (5 needed)
- [ ] Product images (20+ needed)
- [ ] Logo files (SVG + PNG)
- [ ] Favicon

## Notes

- All images are currently placeholders
- Replace with actual product photos before production
- Ensure all images have proper alt text for accessibility
- Consider using a CDN for image delivery in production
