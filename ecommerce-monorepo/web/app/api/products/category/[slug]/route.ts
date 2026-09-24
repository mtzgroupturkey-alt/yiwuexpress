export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fetchCuratedProducts } from '@/lib/curatedProducts';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params?.slug;
    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Category slug is required' },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const categoryIds = [category.id];
    const collectChildIds = (cat: any) => {
      if (cat.children && cat.children.length > 0) {
        cat.children.forEach((child: any) => {
          categoryIds.push(child.id);
          collectChildIds(child);
        });
      }
    };
    collectChildIds(category);

    const products = await fetchCuratedProducts(req, {
      where: {
        categoryId: { in: categoryIds },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      defaultLimit: 6,
    });

    return NextResponse.json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
      },
      data: products,
    });
  } catch (error) {
    console.error('Error fetching category products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category products' },
      { status: 500 }
    );
  }
}
