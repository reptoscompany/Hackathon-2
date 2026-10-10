import { forwardRef } from 'react';

const Badge = forwardRef(function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  dot = false,
  className = '',
  ...props 
}, ref) {
  const variants = {
    default: 'bg-[var(--color-navy-100)] text-[var(--color-text-secondary)]',
    primary: 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
    success: 'bg-[var(--color-crime-resolved)]/15 text-[var(--color-crime-resolved)]',
    warning: 'bg-[var(--color-crime-traffic)]/15 text-[var(--color-crime-traffic)]',
    danger: 'bg-[var(--color-crime-assault)]/15 text-[var(--color-crime-assault)]',
    info: 'bg-[var(--color-crime-theft)]/15 text-[var(--color-crime-theft)]',
    purple: 'bg-[var(--color-crime-cyber)]/15 text-[var(--color-crime-cyber)]',
    orange: 'bg-[var(--color-crime-missing)]/15 text-[var(--color-crime-missing)]',
    gray: 'bg-[var(--color-navy-200)] text-[var(--color-navy-600)]',
    gold: 'bg-[var(--color-gold-light)] text-[var(--color-gold-ink)]'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  const dotColors = {
    default: 'bg-[var(--color-navy-400)]',
    primary: 'bg-[var(--color-accent)]',
    success: 'bg-[var(--color-crime-resolved)]',
    warning: 'bg-[var(--color-crime-traffic)]',
    danger: 'bg-[var(--color-crime-assault)]',
    info: 'bg-[var(--color-crime-theft)]',
    purple: 'bg-[var(--color-crime-cyber)]',
    orange: 'bg-[var(--color-crime-missing)]',
    gray: 'bg-[var(--color-navy-500)]',
    gold: 'bg-[var(--color-gold)]'
  };

  return (
    <span
      ref={ref}
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} aria-hidden="true" />}
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';
export { Badge };