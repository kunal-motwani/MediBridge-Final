import React from 'react';
import { cn } from '@/lib/utils';

export const badgeVariants = ({ variant = 'default', className = '' } = {}) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors border';

  const variantMap = {
    // Legacy variants (exact backwards compatibility)
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
    danger: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300',
    warning: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
    info: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300',
    default: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200',

    // Standard shadcn/ui variants
    primary: 'bg-blue-600 text-white border-blue-600 shadow-sm hover:bg-blue-700',
    secondary: 'bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100',
    destructive: 'bg-red-600 text-white border-red-600 shadow-sm hover:bg-red-700',
    outline: 'text-slate-800 border-slate-300 dark:text-slate-200 dark:border-slate-700',
  };

  const selectedVariant = variantMap[variant] || variantMap.default;
  return cn(base, selectedVariant, className);
};

export const Badge = ({ children, variant = 'default', className = '', ...props }) => {
  return (
    <span className={badgeVariants({ variant, className })} {...props}>
      {children}
    </span>
  );
};

export default Badge;
