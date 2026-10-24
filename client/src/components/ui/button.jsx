import React from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '@/lib/shims/radix-slot';

export const buttonVariants = ({
  variant = 'default',
  size = 'default',
  className = '',
} = {}) => {
  const base =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none';

  const variants = {
    default: 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700',
    destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500',
    outline: 'border border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
    secondary: 'bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
    ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
    link: 'text-blue-600 underline-offset-4 hover:underline active:text-blue-800 p-0 h-auto',
  };

  const sizes = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    lg: 'h-10 rounded-md px-8 text-base',
    icon: 'h-9 w-9 p-0 flex items-center justify-center',
  };

  return cn(
    base,
    variants[variant] || variants.default,
    sizes[size] || sizes.default,
    className
  );
};

export const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', asChild = false, type = 'button', ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const compProps = asChild ? props : { type, ...props };
    return (
      <Comp
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        {...compProps}
      />
    );
  }
);
Button.displayName = 'Button';

export default Button;
