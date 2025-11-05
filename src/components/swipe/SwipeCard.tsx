'use client';

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import Image from 'next/image';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Heart, X, Star } from 'lucide-react';

interface SwipeCardProps {
  product: Product;
  tryOnImageUrl?: string;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  onTap: () => void;
  style?: React.CSSProperties;
}

export function SwipeCard({ product, tryOnImageUrl, onSwipe, onTap, style }: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateZ = useTransform(x, [-200, 200], [-20, 20]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    
    if (Math.abs(info.offset.y) > threshold && info.offset.y < 0) {
      onSwipe('up');
    } else if (info.offset.x > threshold) {
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      style={{
        x,
        y,
        rotateZ,
        opacity,
        ...style,
      }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.05 }}
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
    >
      <div
        onClick={onTap}
        className="relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white"
      >
        <div className="relative h-full w-full">
          <Image
            src={tryOnImageUrl || product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20"></div>
        </div>
        
        {/* Bottom Info Card */}
        <div className="absolute bottom-6 left-6 right-6 backdrop-blur-xl bg-white/20 rounded-3xl border border-white/30 p-6 shadow-2xl">
          <h3 className="text-3xl font-black text-white mb-2 drop-shadow-lg">{product.name}</h3>
          <p className="text-white/90 text-lg font-semibold mb-3">{product.brand}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-yellow-400 drop-shadow-lg">{formatPrice(product.price, product.currency)}</span>
            <span className="rounded-full bg-white/30 backdrop-blur-sm px-4 py-1 text-sm font-bold text-white">{product.retailer}</span>
          </div>
        </div>

        <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: useTransform(x, [-100, -50, 0], [1, 0.5, 0]).get() }}
            className="bg-red-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2"
          >
            <X className="h-5 w-5" />
            NOPE
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: useTransform(x, [0, 50, 100], [0, 0.5, 1]).get() }}
            className="bg-green-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2"
          >
            <Heart className="h-5 w-5" />
            LIKE
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: useTransform(y, [-100, -50, 0], [1, 0.5, 0]).get() }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-500 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 pointer-events-none"
        >
          <Star className="h-6 w-6" />
          SUPER LIKE
        </motion.div>
      </div>
    </motion.div>
  );
}
