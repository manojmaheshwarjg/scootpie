'use client';

import { useState, useEffect } from 'react';
import { SwipeCard } from '@/components/swipe/SwipeCard';
import { Button } from '@/components/ui/button';
import { getMockProducts } from '@/lib/mock-data/products';
import { Product } from '@/types';
import { generateSessionId } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { Heart, X, Star, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation } from '@/components/Navigation';

export default function SwipePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const {
    sessionId,
    setSessionId,
    leftSwipeCount,
    incrementLeftSwipeCount,
    resetLeftSwipeCount,
    setSelectedProduct,
  } = useStore();

  useEffect(() => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    loadProducts();
  }, [setSessionId]);

  const loadProducts = async () => {
    setLoading(true);
    const mockProducts = getMockProducts(15);
    setProducts(mockProducts);
    setLoading(false);
  };

  const handleSwipe = async (direction: 'left' | 'right' | 'up') => {
    if (currentIndex >= products.length) return;

    if (direction === 'left') {
      incrementLeftSwipeCount();
      
      if (leftSwipeCount + 1 >= 15) {
        alert('Looks like you\'re not finding what you like. Let me help you refine your preferences!');
        resetLeftSwipeCount();
      }
    } else {
      resetLeftSwipeCount();
    }

    setCurrentIndex((prev) => prev + 1);

    if (currentIndex >= products.length - 5) {
      const moreProducts = getMockProducts(15);
      setProducts((prev) => [...prev, ...moreProducts]);
    }
  };

  const handleCardTap = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleManualSwipe = (direction: 'left' | 'right' | 'up') => {
    handleSwipe(direction);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your personalized recommendations...</p>
        </div>
      </div>
    );
  }

  const currentProduct = products[currentIndex];
  const remainingCards = products.length - currentIndex;

  return (
    <>
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-16 lg:pb-0 lg:pl-72">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between px-8 py-6 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Discover Fashion</h1>
          <p className="text-sm text-gray-600 mt-1">Swipe to find your style</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-gradient-to-r from-yellow-400 to-pink-500 px-6 py-3 text-sm font-bold text-white shadow-lg">
            {remainingCards} cards remaining
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-6 py-6 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <h1 className="text-3xl font-black bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
          vesaki
        </h1>
        <div className="rounded-full bg-gradient-to-r from-yellow-400 to-pink-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
          {remainingCards} left
        </div>
      </div>

      <div className="flex-1 relative px-4 py-8 lg:max-w-xl lg:mx-auto w-full">
        <AnimatePresence>
          {currentProduct && (
            <motion.div
              key={currentProduct.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute inset-0"
            >
              <SwipeCard
                product={currentProduct}
                onSwipe={handleSwipe}
                onTap={() => handleCardTap(currentProduct)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!currentProduct && (
          <div className="flex flex-col items-center justify-center h-full">
            <RotateCcw className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No more cards!</h2>
            <p className="text-gray-600 mb-4">You've seen all available items</p>
            <Button onClick={loadProducts}>Load More</Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 pb-8 px-4">
        <button
          onClick={() => handleManualSwipe('left')}
          disabled={!currentProduct}
          className="group relative h-16 w-16 rounded-full bg-white shadow-xl transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400 to-red-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
          <X className="relative z-10 h-8 w-8 text-red-500 transition-colors group-hover:text-white" style={{ margin: '0 auto', paddingTop: '16px' }} />
        </button>
        
        <button
          onClick={() => handleManualSwipe('up')}
          disabled={!currentProduct}
          className="group relative h-20 w-20 rounded-full bg-white shadow-2xl transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
          <Star className="relative z-10 h-10 w-10 text-purple-500 transition-colors group-hover:text-white" style={{ margin: '0 auto', paddingTop: '20px' }} />
        </button>
        
        <button
          onClick={() => handleManualSwipe('right')}
          disabled={!currentProduct}
          className="group relative h-16 w-16 rounded-full bg-white shadow-xl transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
          <Heart className="relative z-10 h-8 w-8 text-green-500 transition-colors group-hover:text-white" style={{ margin: '0 auto', paddingTop: '16px' }} />
        </button>
      </div>
    </div>
    <Navigation />
    </>
  );
}
