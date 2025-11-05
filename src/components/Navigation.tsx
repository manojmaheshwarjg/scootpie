'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, LayoutGrid, MessageCircle, Layers, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/swipe', label: 'Swipe', icon: Layers },
  { href: '/collections', label: 'Collections', icon: Heart },
  { href: '/feed', label: 'Feed', icon: LayoutGrid },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 bg-gray-900 flex-col z-50">
        {/* Logo */}
        <div className="p-8 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">vesaki</h1>
          </div>
        </div>

        {/* Nav Items */}
        <div className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-4 rounded-2xl px-6 py-4 text-base font-semibold transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <Icon className="h-6 w-6" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="rounded-2xl bg-gradient-to-br from-yellow-400/10 via-pink-500/10 to-purple-600/10 p-4 border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">Premium Features</p>
            <p className="text-sm font-semibold text-white mb-2">Unlock unlimited swipes</p>
            <button className="w-full rounded-lg bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 px-4 py-2 text-sm font-bold text-white transition hover:scale-105">
              Upgrade Now
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-6 pb-6">
          <div className="rounded-full bg-white/80 backdrop-blur-xl border border-gray-200 shadow-2xl">
            <div className="flex items-center justify-around h-20 px-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group relative flex flex-col items-center justify-center gap-1 min-w-[60px] transition-all"
                  >
                    <div className={cn(
                      'relative rounded-2xl p-3 transition-all',
                      isActive
                        ? 'bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 shadow-lg scale-110'
                        : 'hover:bg-gray-100'
                    )}>
                      <Icon className={cn(
                        'h-6 w-6 transition-colors',
                        isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'
                      )} />
                    </div>
                    {isActive && (
                      <div className="absolute -bottom-1 h-1 w-1 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600"></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
