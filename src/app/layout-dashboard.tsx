'use client';

import { Navigation } from '@/components/Navigation';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-16">
      {children}
      <Navigation />
    </div>
  );
}
