'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMockProducts, getTrendingProducts, getNewProducts, getEditorialProducts } from '@/lib/mock-data/products';
import { formatPrice } from '@/lib/utils';
import { Heart, Flame, Sparkles, Tag } from 'lucide-react';
import { Product } from '@/types';
import { Navigation } from '@/components/Navigation';

export default function FeedPage() {
  const [feedItems, setFeedItems] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'all' | 'trending' | 'new' | 'editorial'>('all');

  useEffect(() => {
    loadFeed();
  }, [filter]);

  const loadFeed = () => {
    let items: Product[] = [];
    
    switch (filter) {
      case 'trending':
        items = getTrendingProducts();
        break;
      case 'new':
        items = getNewProducts();
        break;
      case 'editorial':
        items = getEditorialProducts();
        break;
      default:
        const trending = getTrendingProducts();
        const newItems = getNewProducts();
        const editorial = getEditorialProducts();
        const personalized = getMockProducts(10);
        items = [...trending, ...newItems, ...editorial, ...personalized];
    }
    
    setFeedItems(items);
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0 lg:pl-72">
      <div className="lg:px-8 lg:py-8 p-6">
        {/* Desktop Header */}
        <div className="hidden lg:block mb-8 bg-white rounded-3xl p-8 border border-gray-200">
          <h1 className="text-4xl font-black text-gray-900">Fashion Feed</h1>
          <p className="text-gray-600 mt-2">Trending styles curated for you</p>
        </div>

        {/* Mobile Header */}
        <h1 className="lg:hidden text-3xl font-bold mb-6">Your Feed</h1>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'trending' ? 'default' : 'outline'}
            onClick={() => setFilter('trending')}
          >
            <Flame className="mr-2 h-4 w-4" />
            Trending
          </Button>
          <Button
            variant={filter === 'new' ? 'default' : 'outline'}
            onClick={() => setFilter('new')}
          >
            <Tag className="mr-2 h-4 w-4" />
            New Arrivals
          </Button>
          <Button
            variant={filter === 'editorial' ? 'default' : 'outline'}
            onClick={() => setFilter('editorial')}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Editor's Pick
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {feedItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition cursor-pointer group">
              <div className="relative aspect-[3/4]">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition"
                />
                {item.trending && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    Trending
                  </div>
                )}
                {item.isNew && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    New
                  </div>
                )}
                {item.isEditorial && (
                  <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Editor's Pick
                  </div>
                )}
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm mb-1 line-clamp-1">{item.name}</h3>
                <p className="text-xs text-gray-600 mb-1">{item.brand}</p>
                <p className="font-bold text-sm">{formatPrice(item.price, item.currency)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
    <Navigation />
    </>
  );
}
