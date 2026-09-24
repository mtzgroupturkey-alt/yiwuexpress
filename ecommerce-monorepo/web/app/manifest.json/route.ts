export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSystemSettings, resolveCompanyName } from '@/lib/company';

export async function GET() {
  try {
    const settings = await getSystemSettings();
    let companyName = resolveCompanyName(settings?.companyName);
    if (companyName.toLowerCase() === 'dromkok') {
      companyName = 'Dromkok';
    }

    const description =
      settings?.companyDescription ||
      `${companyName} - Global Trade & Logistics Platform from China`;

    const manifestData = {
      name: `${companyName} - E-Commerce & Freight Platform`,
      short_name: companyName,
      description,
      start_url: '/en',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#00407a',
      theme_color: '#00407a',
      icons: [
        {
          src: '/icons/icon-72.png',
          sizes: '72x72',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icons/icon-96.png',
          sizes: '96x96',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icons/icon-128.png',
          sizes: '128x128',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icons/icon-144.png',
          sizes: '144x144',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icons/icon-152.png',
          sizes: '152x152',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icons/icon-384.png',
          sizes: '384x384',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icons/maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: '/icons/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png',
          purpose: 'any',
        },
      ],
      shortcuts: [
        {
          name: 'Catalog',
          short_name: 'Catalog',
          description: 'Browse wholesale products',
          url: '/en/store',
          icons: [{ src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' }],
        },
        {
          name: 'Shopping Cart',
          short_name: 'Cart',
          description: 'View shopping cart and checkout',
          url: '/en/cart',
          icons: [{ src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' }],
        },
        {
          name: 'Freight Quotes',
          short_name: 'Quote',
          description: 'Submit RFQ and calculate freight',
          url: '/en/calculator',
          icons: [{ src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' }],
        },
      ],
    };

    return NextResponse.json(manifestData, {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[manifest.json] Error generating dynamic manifest:', error);
    return NextResponse.json({ error: 'Failed to generate manifest' }, { status: 500 });
  }
}
