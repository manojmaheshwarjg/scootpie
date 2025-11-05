import { NextRequest, NextResponse } from 'next/server';
import { getMockProducts, getTrendingProducts, getNewProducts, getEditorialProducts } from '@/lib/mock-data/products';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const filter = searchParams.get('filter');
    const count = parseInt(searchParams.get('count') || '15');

    let products;

    switch (filter) {
      case 'trending':
        products = getTrendingProducts();
        break;
      case 'new':
        products = getNewProducts();
        break;
      case 'editorial':
        products = getEditorialProducts();
        break;
      default:
        products = getMockProducts(count);
    }

    return NextResponse.json({
      products,
      count: products.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
