import React from 'react';
import { cn } from '@/lib/utils';

export const Progress = React.forwardRef(
  ({ className, value = 0, max = 100, indicatorClassName, ...props }, ref) => {
    const safeMax = max > 0 ? max : 100;
    const percentage = Math.min(100, Math.max(0, ((value || 0) / safeMax) * 100));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn(
          'relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full bg-blue-600 transition-all duration-300 rounded-full dark:bg-blue-500',
            indicatorClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export default Progress;
