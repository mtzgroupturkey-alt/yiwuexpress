# SVG Patterns - YIWU EXPRESS

This directory contains decorative SVG patterns used throughout the application.

## Available Patterns

### pattern-china.svg
**Location:** `/public/pattern-china.svg`  
**Usage:** Background decoration in BottomCTA component  
**Style:** Traditional Chinese motifs (clouds, waves, lattice, bamboo)  
**Color:** Uses `currentColor` for easy theming  
**Opacity:** 5-20% for subtle effect

**Used in:**
- `components/home/BottomCta.tsx` - Background overlay
- `tailwind.config.ts` - CSS utility class `bg-pattern-china`

## Creating New Patterns

When creating new SVG patterns:

1. **Use currentColor** - Allows theming without duplicating files
2. **Set opacity** - Keep patterns subtle (5-20%)
3. **Tileable** - Use `patternUnits="userSpaceOnUse"` for seamless tiling
4. **Optimize** - Keep file size small for performance
5. **Meaningful names** - Use descriptive filenames

## Example Usage

```tsx
// Direct URL in component
<div className="bg-[url('/pattern-china.svg')] opacity-5" />

// Via Tailwind utility
<div className="bg-pattern-china opacity-5" />
```

## Cultural Patterns

### Chinese Traditional Motifs
- **Clouds** (祥云) - Auspicious clouds, symbolizing good fortune
- **Waves** (海浪) - Representing flow and prosperity
- **Lattice** (回纹) - Geometric patterns, longevity and continuity
- **Bamboo** (竹子) - Strength, flexibility, and integrity
- **Coins** (铜钱) - Wealth and prosperity

### Future Pattern Ideas
- Dragon scales pattern
- Lotus flower pattern
- Phoenix feather pattern
- Traditional window lattice
- Silk fabric texture
- Tea leaf pattern
- Pagoda silhouette pattern

## Performance Tips

1. Use CSS `background-image` with low opacity instead of multiple elements
2. Keep SVG file size under 5KB when possible
3. Use vector shapes instead of raster images
4. Leverage pattern repeating for large areas
5. Consider using CSS gradients for simple patterns

## Accessibility

Decorative patterns should:
- Have low contrast (5-20% opacity)
- Not interfere with text readability
- Work in both light and dark modes
- Be purely decorative (no semantic meaning)
