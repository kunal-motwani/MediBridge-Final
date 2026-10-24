import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const SelectContext = createContext({
  value: undefined,
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
  items: {},
  registerItem: () => {},
  placeholder: '',
  setPlaceholder: () => {},
});

export const Select = ({
  children,
  value: controlledValue,
  defaultValue,
  onValueChange,
  name,
  disabled = false,
}) => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState({});
  const [placeholder, setPlaceholder] = useState('');
  const containerRef = useRef(null);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleValueChange = (val) => {
    if (!isControlled) {
      setUncontrolledValue(val);
    }
    onValueChange?.(val);
    setOpen(false);
  };

  const registerItem = (val, label) => {
    setItems((prev) => (prev[val] === label ? prev : { ...prev, [val]: label }));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
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
    <SelectContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        open,
        setOpen,
        items,
        registerItem,
        placeholder,
        setPlaceholder,
        disabled,
      }}
    >
      <div ref={containerRef} className="relative inline-block w-full">
        {name && <input type="hidden" name={name} value={value || ''} />}
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen, disabled } = useContext(SelectContext);

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0 transition-transform duration-200" />
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

export const SelectValue = ({ placeholder = '', className = '' }) => {
  const { value, items, setPlaceholder } = useContext(SelectContext);

  useEffect(() => {
    if (placeholder) {
      setPlaceholder(placeholder);
    }
  }, [placeholder, setPlaceholder]);

  const display = (value !== undefined && items[value] !== undefined)
    ? items[value]
    : (value || placeholder);

  const isPlaceholder = !value && placeholder;

  return (
    <span className={cn('block truncate text-left', isPlaceholder ? 'text-slate-400' : 'text-slate-900 dark:text-slate-100', className)}>
      {display}
    </span>
  );
};

export const SelectContent = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    const { open } = useContext(SelectContext);

    if (!open) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'absolute left-0 top-[calc(100%+4px)] z-50 max-h-60 min-w-[8rem] w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md animate-in fade-in-80 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectContent.displayName = 'SelectContent';

function extractText(node) {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractText).filter(Boolean).join(' ').trim();
  }
  if (React.isValidElement(node)) {
    return extractText(node.props?.children);
  }
  return '';
}

export const SelectItem = React.forwardRef(
  ({ className, children, value, disabled = false, ...props }, ref) => {
    const { value: selectedValue, onValueChange, registerItem } = useContext(SelectContext);

    useEffect(() => {
      if (value !== undefined && children !== undefined) {
        const textLabel = extractText(children);
        registerItem(value, textLabel || (typeof value === 'string' ? value : String(value ?? '')));
      }
    }, [value, children, registerItem]);

    const isSelected = selectedValue === value;

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        onClick={() => {
          if (!disabled) {
            onValueChange(value);
          }
        }}
        className={cn(
          'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:hover:bg-slate-800 dark:focus:bg-slate-800',
          isSelected && 'font-medium text-blue-600 dark:text-blue-400',
          disabled && 'pointer-events-none opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {isSelected && (
          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </span>
        )}
        <span className="truncate">{children}</span>
      </div>
    );
  }
);
SelectItem.displayName = 'SelectItem';

export const SelectGroup = ({ className, children, ...props }) => (
  <div className={cn('p-1', className)} {...props}>
    {children}
  </div>
);

export const SelectLabel = ({ className, children, ...props }) => (
  <div className={cn('py-1.5 pl-8 pr-2 text-xs font-semibold text-slate-500 uppercase tracking-wider', className)} {...props}>
    {children}
  </div>
);

export const SelectSeparator = ({ className, ...props }) => (
  <div className={cn('-mx-1 my-1 h-px bg-slate-200 dark:bg-slate-800', className)} {...props} />
);

export default Select;
