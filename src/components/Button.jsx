import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  'aria-label': ariaLabel,
  ...props 
}, ref) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2 font-medium rounded-md
    transition-colors duration-150 ease-out
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    select-none
  `;

  const variants = {
    primary: 'bg-[var(--color-gold)] text-[var(--color-navy-900)] hover:bg-[var(--color-gold-hover)] focus-visible:ring-[var(--color-accent)]',
    secondary: 'bg-[var(--color-navy-100)] text-[var(--color-text-primary)] hover:bg-[var(--color-navy-200)] focus-visible:ring-[var(--color-navy-400)] border border-[var(--color-border)]',
    outline: 'bg-transparent border border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:bg-[var(--color-navy-50)] focus-visible:ring-[var(--color-navy-400)]',
    ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-navy-100)] hover:text-[var(--color-text-primary)] focus-visible:ring-[var(--color-navy-400)]',
    danger: 'bg-[var(--color-crime-assault)] text-white hover:brightness-90 focus-visible:ring-[var(--color-crime-assault)]'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2'
  };

  const width = fullWidth ? 'w-full' : '';

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        <>
          {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
          {children}
          {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
export { Button };