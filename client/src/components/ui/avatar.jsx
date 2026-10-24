import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

const AvatarContext = createContext({
  imageLoaded: false,
  setImageLoaded: () => {},
});

export const Avatar = React.forwardRef(({ className, children, ...props }, ref) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <AvatarContext.Provider value={{ imageLoaded, setImageLoaded }}>
      <div
        ref={ref}
        className={cn(
          'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-slate-800',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </AvatarContext.Provider>
  );
});
Avatar.displayName = 'Avatar';

export const AvatarImage = React.forwardRef(({ className, src, alt = '', onLoad, onError, ...props }, ref) => {
  const { setImageLoaded } = useContext(AvatarContext);
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) return null;

  const handleLoad = (e) => {
    setImageLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setHasError(true);
    setImageLoaded(false);
    onError?.(e);
  };

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      onLoad={handleLoad}
      onError={handleError}
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  );
});
AvatarImage.displayName = 'AvatarImage';

export const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => {
  const { imageLoaded } = useContext(AvatarContext);

  if (imageLoaded) return null;

  return (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        className
      )}
      {...props}
    />
  );
});
AvatarFallback.displayName = 'AvatarFallback';

export default Avatar;
