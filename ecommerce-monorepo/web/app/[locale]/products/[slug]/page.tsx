import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailView from './ProductDetailView';
import { prisma } from '@/lib/db';
import { getCompanyName } from '@/lib/company';
import { localizeAttribute, localizeCategory, localizeProduct } from '@/lib/utils/localize';
import {
  getLocalizedOptionLabel,
  getLocalizedColorList,
  getLocalizedColorName,
} from '@/lib/utils/attributeOptionTranslations';

interface ProductPageProps {
  params: {
    locale: string;
    slug: string;
  };
}

async function getProductFromDB(slug: string, locale: string) {
  if (!slug) return null;

  const requestedLocale = locale || 'en';
  const localesToFetch = Array.from(new Set([requestedLocale, 'en']));

  const product = await prisma.product.findFirst({
    where: {
      isActive: true,
      OR: [{ id: slug }, { slug: slug }],
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          translations: {
            where: { locale: { in: localesToFetch } },
            select: { locale: true, name: true },
          },
          parentId: true,
          attributes: {
            where: { isVisible: true },
            orderBy: { displayOrder: 'asc' },
            include: {
              attribute: {
                include: { translations: true },
              },
            },
          },
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
              translations: {
                where: { locale: { in: localesToFetch } },
                select: { locale: true, name: true },
              },
              attributes: {
                where: { isVisible: true },
                orderBy: { displayOrder: 'asc' },
                include: {
                  attribute: {
                    include: { translations: true },
                  },
                },
              },
            },
          },
        },
      },
      attributeValues: {
        include: {
          attribute: true,
          translations: true,
        },
      },
      translations: {
        where: {
          locale: { in: localesToFetch },
        },
      },
      variants: {
        where: { isActive: true },
      },
      reviews: {
        where: { isApproved: true },
        include: {
          user: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!product || !product.isActive) {
    return null;
  }

  // Transform attributeValues array into a key-value object.
  const attributes: Record<string, any> = {};
  const valueTranslationMap: Record<string, string> = {};
  const slugTranslationMap: Record<string, string> = {};
  if (product.attributeValues && Array.isArray(product.attributeValues)) {
    product.attributeValues.forEach((av: any) => {
      let parsed: any;
      try {
        parsed = JSON.parse(av.value);
      } catch {
        parsed = av.value;
      }
      attributes[av.attribute.slug] = parsed;

      if (av.translations && Array.isArray(av.translations)) {
        const tr = av.translations.find(
          (t: any) => t.locale === requestedLocale && t.value && t.value.trim().length > 0
        );
        if (tr) {
          slugTranslationMap[av.attribute.slug] = tr.value;
          if (typeof av.value === 'string') {
            valueTranslationMap[av.value] = tr.value;
          }
        }
      }
    });
  }

  // Localize values in attributes object
  if (requestedLocale !== 'en') {
    for (const attrSlug of Object.keys(attributes)) {
      // Color attributes should remain as arrays so ProductDetailView can render swatch badges
      if (attrSlug === 'color' || attrSlug.endsWith('_color')) {
        continue;
      }

      if (slugTranslationMap[attrSlug]) {
        attributes[attrSlug] = slugTranslationMap[attrSlug];
      } else {
        const val = attributes[attrSlug];
        if (typeof val === 'string' && valueTranslationMap[val]) {
          attributes[attrSlug] = valueTranslationMap[val];
        } else if (val === 'true' || val === true) {
          attributes[attrSlug] = requestedLocale === 'ru' ? 'Да' : requestedLocale === 'zh' ? '是' : 'Yes';
        } else if (val === 'false' || val === false) {
          attributes[attrSlug] = requestedLocale === 'ru' ? 'Нет' : requestedLocale === 'zh' ? '否' : 'No';
        } else if (Array.isArray(val)) {
          // If it's an option array, translate each item
          attributes[attrSlug] = val.map((v) => getLocalizedOptionLabel(attrSlug, String(v), requestedLocale as any));
        } else if (typeof val === 'string') {
          attributes[attrSlug] = getLocalizedOptionLabel(attrSlug, val, requestedLocale as any);
        }
      }
    }
  }

  const flattenCategoryAttrs = (catAttrs: any[]) =>
    catAttrs
      .filter((ca: any) => ca.attribute)
      .map((ca: any) => ({
        id: ca.attribute.id,
        slug: ca.attribute.slug,
        name: localizeAttribute(ca.attribute, requestedLocale).name,
        inputType: ca.attribute.type,
        isRequired: ca.isRequired ?? ca.attribute.isRequired,
        isFilterable: ca.attribute.isFilterable,
        isVisible: ca.isVisible,
        displayOrder: ca.displayOrder ?? ca.attribute.displayOrder,
        isVariant: ca.attribute.isVariant ?? false,
        rawOptions: ca.attribute.options || [],
        rawColorOptions: ca.attribute.colorOptions || [],
        options: ca.attribute.options?.map((opt: string) =>
          getLocalizedOptionLabel(ca.attribute.slug, opt, requestedLocale as any)
        ) || ca.attribute.options,
        colorOptions: ca.attribute.colorOptions?.map((c: any) => ({
          ...c,
          label: getLocalizedColorName(c.value, c.label, requestedLocale as any)
        })) || ca.attribute.colorOptions,
      }));

  const parentAttributes = flattenCategoryAttrs(product.category?.parent?.attributes || []);
  const currentAttributes = flattenCategoryAttrs(product.category?.attributes || []);

  const allAttributes = [...parentAttributes, ...currentAttributes];
  const uniqueAttributes = allAttributes.reduce((acc: any[], attr: any) => {
    const existingIndex = acc.findIndex((a) => a.slug === attr.slug);
    if (existingIndex === -1) {
      acc.push(attr);
    } else {
      acc[existingIndex] = attr;
    }
    return acc;
  }, []);

  if (product.attributeValues && Array.isArray(product.attributeValues)) {
    product.attributeValues.forEach((av: any) => {
      if (av.attribute && !uniqueAttributes.some((a: any) => a.slug === av.attribute.slug)) {
        uniqueAttributes.push({
          id: av.attribute.id,
          slug: av.attribute.slug,
          name: localizeAttribute(av.attribute, requestedLocale).name,
          inputType: av.attribute.type,
          isRequired: av.attribute.isRequired,
          isFilterable: av.attribute.isFilterable,
          isVariant: av.attribute.isVariant ?? false,
          isVisible: true,
          displayOrder: av.attribute.displayOrder,
          options: av.attribute.options?.map((opt: string) =>
            getLocalizedOptionLabel(av.attribute.slug, opt, requestedLocale as any)
          ) || av.attribute.options,
          rawOptions: av.attribute.options || [],
          colorOptions: av.attribute.colorOptions?.map((c: any) => ({
            ...c,
            label: getLocalizedColorName(c.value, c.label, requestedLocale as any)
          })) || av.attribute.colorOptions,
          rawColorOptions: av.attribute.colorOptions || [],
        });
      }
    });
  }

  const rawCategory = product.category as any;
  const localizedCategory = rawCategory
    ? {
        ...rawCategory,
        name: localizeCategory(rawCategory, requestedLocale).name,
        parent: rawCategory.parent
          ? {
              ...rawCategory.parent,
              name: localizeCategory(rawCategory.parent, requestedLocale).name,
            }
          : rawCategory.parent,
      }
    : rawCategory;

  const localized = localizeProduct(product, requestedLocale);

  return {
    id: product.id,
    sku: product.sku,
    name: localized.name,
    slug: product.slug,
    description: localized.description,
    metaTitle: localized.metaTitle,
    metaDescription: localized.metaDescription,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    images: Array.isArray(product.images) ? product.images : [],
    thumbnail: product.thumbnail || (product.images?.[0] ?? null),
    stock: product.stock,
    weightKg: product.weightKg,
    dimensions: product.dimensions,
    hsCode: product.hsCode,
    countryOfOrigin: product.countryOfOrigin,
    material: product.material,
    minOrderQty: product.minOrderQty,
    wholesalePrice: product.wholesalePrice,
    translations: product.translations,
    category: localizedCategory,
    attributes,
    categoryAttributes: uniqueAttributes,
    variants: product.variants,
    reviews: product.reviews,
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug, locale } = params;
  const product = await getProductFromDB(slug, locale);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const localized = localizeProduct(product, locale);
  const title = localized.metaTitle || localized.name || product.name;
  const description = localized.metaDescription || localized.description?.slice(0, 160) || product.description?.slice(0, 160) || '';
  const firstImage = product.thumbnail || product.images?.[0] || '';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://dromkok.com';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: firstImage ? [firstImage] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: firstImage ? [firstImage] : [],
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/products/${product.slug || slug}`,
      languages: {
        en: `${baseUrl}/en/products/${product.slug || slug}`,
        ru: `${baseUrl}/ru/products/${product.slug || slug}`,
        zh: `${baseUrl}/zh/products/${product.slug || slug}`,
      },
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, locale } = params;
  const product = await getProductFromDB(slug, locale);

  if (!product) {
    notFound();
  }

  const companyName = await getCompanyName();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://dromkok.com';
  const localized = localizeProduct(product, locale);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: localized.name || product.name,
    image: product.thumbnail || product.images?.[0] ? [product.thumbnail || product.images[0]] : [],
    description: localized.description || product.description?.slice(0, 300) || '',
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: companyName,
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/${locale}/products/${product.slug || slug}`,
      priceCurrency: 'USD',
      price: product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailView product={product} slug={slug} locale={locale} />
    </>
  );
}
