import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailView from './ProductDetailView';
import { prisma } from '@/lib/db';
import { getCompanyName } from '@/lib/company';
import { localizeAttribute, localizeCategory, localizeProduct } from '@/lib/utils/localize';

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
  if (product.attributeValues && Array.isArray(product.attributeValues)) {
    product.attributeValues.forEach((av: any) => {
      let parsed: any;
      try {
        parsed = JSON.parse(av.value);
      } catch {
        parsed = av.value;
      }
      attributes[av.attribute.slug] = parsed;

      if (typeof av.value === 'string' && av.translations) {
        const tr = (av.translations as any[]).find(
          (t) => t.locale === requestedLocale && t.value && t.value.trim().length > 0
        );
        if (tr) valueTranslationMap[av.value] = tr.value;
      }
    });
  }

  // Localize values in attributes object
  if (requestedLocale !== 'en') {
    for (const attrSlug of Object.keys(attributes)) {
      const val = attributes[attrSlug];
      if (typeof val === 'string' && valueTranslationMap[val]) {
        attributes[attrSlug] = valueTranslationMap[val];
      } else if (Array.isArray(val)) {
        attributes[attrSlug] = val.map((v) =>
          typeof v === 'string' && valueTranslationMap[v] ? valueTranslationMap[v] : v
        );
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
        options: ca.attribute.options,
        colorOptions: ca.attribute.colorOptions,
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

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    description: product.description,
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

  const companyName = await getCompanyName(locale);
  const localized = localizeProduct(product, locale);
  const title = `${localized.name || product.name} — ${companyName}`;
  const description = localized.description?.slice(0, 160) || product.description?.slice(0, 160) || '';
  const firstImage = product.thumbnail || product.images?.[0] || '';

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
      canonical: `/${locale}/products/${product.slug || slug}`,
      languages: {
        en: `/en/products/${product.slug || slug}`,
        ru: `/ru/products/${product.slug || slug}`,
        zh: `/zh/products/${product.slug || slug}`,
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

  return <ProductDetailView product={product} slug={slug} locale={locale} />;
}
