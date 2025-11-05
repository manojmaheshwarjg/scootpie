import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowUp, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect('/swipe');
  }

  const trendingItems = [
    { title: 'Suede bombers for everyday style', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400' },
    { title: 'Brown pants that sharpen any look', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400' },
    { title: 'Cashmere sweaters that work anywhere', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400' },
    { title: 'Hybrid boots for work and weekend', image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="absolute top-0 right-0 p-6 z-10">
        <Link
          href="/sign-up"
          className="rounded-full bg-white px-8 py-3 text-base font-semibold text-gray-900 shadow-sm hover:shadow-md transition-all hover:scale-105"
        >
          Sign up
        </Link>
      </header>

      {/* Hero Section */}
      <div className="mx-auto max-w-4xl px-6 pt-32 pb-16 text-center">
        {/* Logo Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-xl">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-7xl font-serif font-normal tracking-tight text-gray-900">
          Vesaki
        </h1>
        <p className="text-xl text-gray-700 mb-12">
          Your personal AI fashion agent
        </p>

        {/* Gender Toggle */}
        <div className="mb-8 inline-flex rounded-full bg-white p-1 shadow-lg">
          <button className="rounded-full px-8 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-100">
            Womens
          </button>
          <button className="rounded-full bg-gray-900 px-8 py-3 text-sm font-medium text-white transition-all">
            Mens
          </button>
        </div>

        {/* Search Box */}
        <div className="mx-auto max-w-2xl mb-16">
          <div className="relative rounded-3xl bg-white p-2 shadow-xl">
            <div className="flex items-center gap-4 rounded-2xl border-2 border-transparent focus-within:border-indigo-500 transition-all">
              <button className="pl-4">
                <ImageIcon className="h-5 w-5 text-gray-400" />
              </button>
              <input
                type="text"
                placeholder="Describe what you're shopping for..."
                className="flex-1 py-4 text-base text-gray-900 placeholder-gray-400 focus:outline-none"
              />
              <button className="mr-2 rounded-full bg-indigo-600 p-3 text-white hover:bg-indigo-700 transition-all hover:scale-110 shadow-lg">
                <ArrowUp className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Trending Section */}
        <div className="text-left">
          <div className="mb-6 flex items-center gap-2 text-gray-900">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <h2 className="text-lg font-semibold">Trending</h2>
          </div>

          {/* Trending Cards */}
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {trendingItems.map((item, index) => (
                <Link
                  key={index}
                  href="/sign-up"
                  className="group relative flex-shrink-0 w-64 h-80 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-lg font-bold text-white leading-tight">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>

            {/* Scroll Arrows */}
            <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 rounded-full bg-white p-2 shadow-lg hover:scale-110 transition-all">
              <svg className="h-6 w-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 rounded-full bg-white p-2 shadow-lg hover:scale-110 transition-all">
              <svg className="h-6 w-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
