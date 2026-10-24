import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const DropdownMenuContext = createContext({
  open: false,
  setOpen: () => {},
});

export const DropdownMenu = ({ children }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

export const DropdownMenuTrigger = React.forwardRef(
  ({ children, asChild = false, onClick, ...props }, ref) => {
    const { open, setOpen } = useContext(DropdownMenuContext);

    const handleClick = (e) => {
      onClick?.(e);
      setOpen(!open);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        onClick: (e) => {
          children.props?.onClick?.(e);
          handleClick(e);
        },
        ref: ref || children.ref,
        ...props,
      });
    }

    return (
      <button type="button" ref={ref} onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

export const DropdownMenuContent = React.forwardRef(
  ({ className, align = 'right', children, ...props }, ref) => {
    const { open } = useContext(DropdownMenuContext);

    if (!open) return null;

    const alignClasses =
      align === 'right'
        ? 'right-0 origin-top-right'
        : align === 'left'
        ? 'left-0 origin-top-left'
        : 'left-1/2 -translate-x-1/2 origin-top';

    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md animate-in fade-in-80 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50',
          alignClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

export const DropdownMenuItem = React.forwardRef(
  ({ className, onClick, disabled = false, children, ...props }, ref) => {
    const { setOpen } = useContext(DropdownMenuContext);

    const handleClick = (e) => {
      if (disabled) return;
      onClick?.(e);
      setOpen(false);
    };

    return (
      <div
        ref={ref}
        role="menuitem"
        onClick={handleClick}
        className={cn(
          'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:hover:bg-slate-800 dark:focus:bg-slate-800',
          disabled && 'pointer-events-none opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuSeparator = ({ className, ...props }) => (
  <div className={cn('-mx-1 my-1 h-px bg-slate-200 dark:bg-slate-800', className)} {...props} />
);

export const DropdownMenuLabel = ({ className, ...props }) => (
  <div className={cn('px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider', className)} {...props} />
);

export default DropdownMenu;
