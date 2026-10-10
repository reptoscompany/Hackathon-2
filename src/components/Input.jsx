import { forwardRef, useId, useState, useEffect } from 'react';
import { Search, X, ChevronDown, Calendar, MapPin } from 'lucide-react';
import { Badge } from './Badge';

const Input = forwardRef(function Input({ 
  label, 
  error, 
  hint, 
  leftIcon, 
  rightIcon, 
  className = '',
  id: providedId,
  ...props 
}, ref) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            w-full rounded-md border transition-colors duration-150
            ${leftIcon ? 'pl-10' : 'px-3'} ${rightIcon ? 'pr-10' : 'px-3'}
            py-2 text-sm
            bg-[var(--color-surface)] text-[var(--color-text-primary)]
            placeholder:text-[var(--color-text-muted)]
            ${error 
              ? 'border-[var(--color-crime-assault)] focus:border-[var(--color-crime-assault)] focus:ring-[var(--color-crime-assault)]/20' 
              : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent-light)]'
            }
            focus:outline-none focus:ring-2
            disabled:bg-[var(--color-navy-50)] disabled:cursor-not-allowed
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
            {rightIcon}
          </div>
        )}
        {props.value && !props.readOnly && !props.disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              props.onChange?.({ target: { ...e.target, value: '' } });
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Clear input"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-[var(--color-crime-assault)]" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
});
Input.displayName = 'Input';

const Select = forwardRef(function Select({ 
  label, 
  error, 
  hint, 
  options = [], 
  placeholder,
  className = '',
  id: providedId,
  ...props 
}, ref) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={`
            w-full rounded-md border appearance-none transition-colors duration-150
            px-3 py-2 pr-10 text-sm
            bg-[var(--color-surface)] text-[var(--color-text-primary)]
            ${error 
              ? 'border-[var(--color-crime-assault)] focus:border-[var(--color-crime-assault)] focus:ring-[var(--color-crime-assault)]/20' 
              : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent-light)]'
            }
            focus:outline-none focus:ring-2
            disabled:bg-[var(--color-navy-50)] disabled:cursor-not-allowed
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]">
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-[var(--color-crime-assault)]" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
});
Select.displayName = 'Select';

const MultiSelect = forwardRef(function MultiSelect({ 
  label, 
  error, 
  hint, 
  options = [], 
  value = [], 
  onChange,
  placeholder = 'Select...',
  className = '',
  id: providedId,
  ...props 
}, ref) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const [open, setOpen] = useState(false);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  useEffect(() => {
    function handleClickOutside(e) {
      if (open && !e.target.closest(`[data-multiselect="${id}"]`)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, id]);

  const toggleOption = (optValue) => {
    const newValue = value.includes(optValue)
      ? value.filter(v => v !== optValue)
      : [...value, optValue];
    onChange?.(newValue);
  };

  return (
    <div className={className} data-multiselect={id}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          ref={ref}
          id={id}
          onClick={() => setOpen(!open)}
          className={`
            w-full rounded-md border transition-colors duration-150 text-left
            px-3 py-2 pr-10 text-sm
            bg-[var(--color-surface)] text-[var(--color-text-primary)]
            ${error 
              ? 'border-[var(--color-crime-assault)] focus:border-[var(--color-crime-assault)] focus:ring-[var(--color-crime-assault)]/20' 
              : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent-light)]'
            }
            focus:outline-none focus:ring-2
            disabled:bg-[var(--color-navy-50)] disabled:cursor-not-allowed
          `}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          disabled={props.disabled}
        >
          <span className="flex flex-wrap gap-1.5">
            {value.length > 0 ? (
              value.map(v => {
                const opt = options.find(o => o.value === v);
                return (
                  <Badge key={v} variant="primary" size="sm">
                    {opt?.label || v}
                  </Badge>
                );
              })
            ) : (
              <span className="text-[var(--color-text-muted)]">{placeholder}</span>
            )}
          </span>
        </button>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]">
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </div>
        
        {open && (
          <ul
            role="listbox"
            aria-label="Options"
            className={`
              absolute z-[var(--z-dropdown)] mt-1 w-full max-h-60 overflow-auto
              bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-lg
              py-1
            `}
          >
            {options.map((opt) => (
              <li key={opt.value} role="option" aria-selected={value.includes(opt.value)}>
                <button
                  type="button"
                  onClick={() => toggleOption(opt.value)}
                  className={`
                    w-full px-3 py-2 text-sm text-left transition-colors
                    ${value.includes(opt.value) 
                      ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]' 
                      : 'hover:bg-[var(--color-navy-50)] text-[var(--color-text-primary)]'
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    <span className={`
                      w-4 h-4 rounded border-2 flex items-center justify-center
                      ${value.includes(opt.value) 
                        ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' 
                        : 'border-[var(--color-border)]'
                      }
                    `}>
                      {value.includes(opt.value) && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      )}
                    </span>
                    {opt.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-[var(--color-crime-assault)]" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
});
MultiSelect.displayName = 'MultiSelect';

const DateRangePicker = forwardRef(function DateRangePicker({ 
  label, 
  value = [], 
  onChange, 
  className = '',
  ...props 
}, ref) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          {label}
        </label>
      )}
      <div className="flex gap-3">
        <Input
          type="date"
          value={value[0] || ''}
          onChange={(e) => onChange?.([e.target.value, value[1]])}
          placeholder="Start date"
          leftIcon={<Calendar className="w-4 h-4" aria-hidden="true" />}
        />
        <span className="flex items-center text-[var(--color-text-muted)]">to</span>
        <Input
          type="date"
          value={value[1] || ''}
          onChange={(e) => onChange?.([value[0], e.target.value])}
          placeholder="End date"
          leftIcon={<Calendar className="w-4 h-4" aria-hidden="true" />}
        />
      </div>
    </div>
  );
});
DateRangePicker.displayName = 'DateRangePicker';

export { Input, Select, MultiSelect, DateRangePicker };