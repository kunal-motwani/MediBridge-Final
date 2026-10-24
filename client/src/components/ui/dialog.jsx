import React, { createContext, useContext, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const DialogContext = createContext({
  open: false,
  setOpen: () => {},
});

export const Dialog = ({ children, open: controlledOpen, onOpenChange, defaultOpen = false }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (value) => {
    if (!isControlled) {
      setUncontrolledOpen(value);
    }
    onOpenChange?.(value);
  };

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
};

export const DialogTrigger = React.forwardRef(({ children, asChild = false, onClick, ...props }, ref) => {
  const { setOpen } = useContext(DialogContext);

  const handleClick = (e) => {
    onClick?.(e);
    setOpen(true);
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
});
DialogTrigger.displayName = 'DialogTrigger';

export const DialogClose = React.forwardRef(({ children, asChild = false, onClick, ...props }, ref) => {
  const { setOpen } = useContext(DialogContext);

  const handleClick = (e) => {
    onClick?.(e);
    setOpen(false);
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
});
DialogClose.displayName = 'DialogClose';

export const DialogContent = React.forwardRef(({ className, children, onClose, ...props }, ref) => {
  const { open, setOpen } = useContext(DialogContext);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        onClose?.();
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, setOpen, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in-0"
        onClick={() => {
          setOpen(false);
          onClose?.();
        }}
        aria-hidden="true"
      />
      {/* Modal Dialog */}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-50 grid w-full max-w-lg gap-4 border border-slate-200 bg-white p-6 shadow-xl rounded-xl duration-200 animate-in fade-in-0 zoom-in-95 dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto mx-4',
          className
        )}
        {...props}
      >
        {children}
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onClose?.();
          }}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none cursor-pointer"
        >
          <X className="h-4 w-4 text-slate-500" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
});
DialogContent.displayName = 'DialogContent';

export const DialogHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
    {...props}
  />
));
DialogHeader.displayName = 'DialogHeader';

export const DialogFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0', className)}
    {...props}
  />
));
DialogFooter.displayName = 'DialogFooter';

export const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-100', className)}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-slate-500 dark:text-slate-400', className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';

export default Dialog;
