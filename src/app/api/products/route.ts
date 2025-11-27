import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const filter = searchParams.get('filter');
    const count = parseInt(searchParams.get('count') || '15');

    let productResults;

    switch (filter) {
      case 'trending':
        productResults = await db
          .select()
          .from(products)
          .where(eq(products.trending, true))
          .limit(count);
        break;
      case 'new':
        productResults = await db
          .select()
          .from(products)
          .where(eq(products.isNew, true))
          .limit(count);
        break;
      case 'editorial':
        productResults = await db
          .select()
          .from(products)
          .where(eq(products.isEditorial, true))
          .limit(count);
        break;
      default:
        // Return random products
        productResults = await db
          .select()
          .from(products)
          .orderBy(sql`RANDOM()`)
          .limit(count);
    }

    // Transform to match expected format
    const transformedProducts = productResults.map((p) => ({
      id: p.id,
      externalId: p.externalId,
      name: p.name,
      brand: p.brand,
      price: parseFloat(p.price),
      currency: p.currency,
      retailer: p.retailer,
      category: p.category,
      subcategory: p.subcategory,
      imageUrl: p.imageUrl,
      productUrl: p.productUrl,
      description: p.description,
      availableSizes: p.availableSizes,
      colors: p.colors,
      inStock: p.inStock,
      trending: p.trending,
      isNew: p.isNew,
      isEditorial: p.isEditorial,
    }));

    return NextResponse.json({
      products: transformedProducts,
      count: transformedProducts.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
