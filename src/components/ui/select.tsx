import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-11 w-full border border-[#E5E5E5] bg-white px-4 py-2 text-sm text-[#1A1A1A] ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2D2D2D] focus-visible:border-[#2D2D2D] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 rounded-lg cursor-pointer',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export { Select };

