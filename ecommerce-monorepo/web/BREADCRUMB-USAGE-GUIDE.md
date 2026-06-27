# Breadcrumb Background System - Usage Guide

## Overview
The breadcrumb background system automatically fetches and displays custom background images for pages based on settings configured in the admin panel.

## How It Works

### 1. Admin Configuration
Go to: `http://localhost:3005/admin/settings/breadcrumb`

You can configure backgrounds for:
- **Static Pages**: about, contact, blog, wholesale, etc.
- **Shop Default**: Fallback for all product pages
- **Categories**: Specific backgrounds for product categories

### 2. Automatic Display
The `PageHero` component automatically detects the current page and fetches the appropriate background.

## Page Slug Detection

The system auto-detects the page slug from the URL:
- `/about` → slug: `about`
- `/contact` → slug: `contact`
- `/blog` → slug: `blog`
- `/wholesale` → slug: `wholesale`

## Usage Examples

### Example 1: Static Page (Auto-detection)
```tsx
// app/about/page.tsx
import { SharedLayout } from '@/components/layout/SharedLayout'

export default function AboutPage() {
  return (
    <SharedLayout 
      pageTitle="About YIWU EXPRESS"
      pageDescription="Learn about our company"
      breadcrumbs={[{ name: 'About', href: '/about' }]}
    >
      {/* Page content */}
    </SharedLayout>
  )
}
```
The system will automatically fetch the background for slug: `about`

### Example 2: Static Page (Manual Slug)
```tsx
<SharedLayout 
  pageTitle="Contact Us"
  breadcrumbs={[{ name: 'Contact', href: '/contact' }]}
  pageSlug="contact"
>
  {/* Content */}
</SharedLayout>
```

### Example 3: Category Page
```tsx
<SharedLayout 
  pageTitle="Electronics"
  breadcrumbs={[{ name: 'Electronics', href: '/category/electronics' }]}
  categoryId="clxy123abc"
>
  {/* Content */}
</SharedLayout>
```

### Example 4: Custom PageHero (Direct)
```tsx
import { PageHero } from '@/components/layout/PageHero'

<PageHero
  title="Custom Page"
  description="Page description"
  breadcrumbs={[{ name: 'Custom', href: '/custom' }]}
  pageSlug="custom"
/>
```

## Fallback Hierarchy

The system uses a 4-level fallback:

1. **Exact Match** - Specific setting for the page/category
2. **Shop Default** - General shop background (for categories)
3. **Default Image** - Fallback from props
4. **Gradient** - Blue gradient background

## Admin Panel Features

### Add New Background
1. Click "Add New" button
2. Select page type (Static/Shop Default/Category)
3. Enter image URL
4. Optional: Add mobile image, overlay color, custom title/subtitle
5. Set as Active
6. Save

### Edit Background
1. Click pencil icon on any row
2. Modify settings
3. Save changes

### Delete Background
1. Click trash icon
2. Confirm deletion

## Image Requirements

- **Desktop**: Recommended 1920x400px or larger
- **Mobile**: Optional 768x400px (will use desktop if not provided)
- **Format**: JPG, PNG, WebP
- **Location**: Upload to `/public/images/` or use CDN URL

## Overlay Colors

Format: `rgba(26, 58, 92, 0.6)`
- First 3 numbers: RGB color
- Last number: Opacity (0.0 to 1.0)

Examples:
- Dark blue: `rgba(26, 58, 92, 0.6)`
- Black: `rgba(0, 0, 0, 0.5)`
- Navy: `rgba(13, 27, 42, 0.7)`

## Testing

1. Go to admin panel: `http://localhost:3005/admin/settings/breadcrumb`
2. Add a background for a static page (e.g., "about")
3. Visit that page: `http://localhost:3005/about`
4. You should see your custom background!

## Troubleshooting

**Background not showing?**
- Check the page slug matches exactly (lowercase)
- Verify the setting is marked as "Active"
- Check browser console for errors
- Try refreshing the page

**Image not loading?**
- Verify the image URL is accessible
- Check if the image is in `/public/images/`
- Test the image URL directly in browser

**Wrong background showing?**
- Check for multiple settings with same slug
- Verify pageType is correct (static vs category)
- Check fallback hierarchy

## API Endpoints

### Fetch Background (Public)
```
GET /api/breadcrumb-background?pageSlug=about
GET /api/breadcrumb-background?categoryId=xyz123
```

### Manage Settings (Admin Only)
```
GET    /api/admin/settings/breadcrumb        # List all
POST   /api/admin/settings/breadcrumb        # Create
PUT    /api/admin/settings/breadcrumb/:id    # Update
DELETE /api/admin/settings/breadcrumb/:id    # Delete
```

## Database Schema

```prisma
model BreadcrumbSetting {
  id              String   @id @default(cuid())
  pageType        String   // "static", "shop_default", "category"
  pageSlug        String?  // For static pages
  categoryId      String?  // For category pages
  imageUrl        String
  mobileImageUrl  String?
  overlayColor    String?
  title           String?
  subtitle        String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## Support

For issues or questions, check:
- `web/lib/breadcrumb-service.ts` - Background fetching logic
- `web/components/layout/PageHero.tsx` - Display component
- `web/app/api/breadcrumb-background/route.ts` - Public API
- `web/app/api/admin/settings/breadcrumb/route.ts` - Admin API
