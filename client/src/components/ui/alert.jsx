import React from 'react';
import { cn } from '@/lib/utils';

export const alertVariants = ({ variant = 'default', className = '' } = {}) => {
  const base = 'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-slate-950 dark:[&>svg]:text-slate-50';

  const variants = {
    default: 'bg-white text-slate-950 border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-800',
    destructive: 'border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-600 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200 dark:[&>svg]:text-red-400',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900 [&>svg]:text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-200 dark:[&>svg]:text-emerald-400',
    warning: 'border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-600 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-200 dark:[&>svg]:text-amber-400',
    info: 'border-sky-200 bg-sky-50 text-sky-900 [&>svg]:text-sky-600 dark:border-sky-900/50 dark:bg-sky-950/50 dark:text-sky-200 dark:[&>svg]:text-sky-400',
  };

  return cn(base, variants[variant] || variants.default, className);
};

export const Alert = React.forwardRef(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={alertVariants({ variant, className })}
      {...props}
    />
  )
);
Alert.displayName = 'Alert';

export const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-100', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm [&_p]:leading-relaxed text-slate-700 dark:text-slate-300', className)}
      {...props}
    />
  )
);
AlertDescription.displayName = 'AlertDescription';

export default Alert;
