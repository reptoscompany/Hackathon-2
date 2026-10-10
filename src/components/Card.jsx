import { forwardRef } from 'react';

const Card = forwardRef(function Card({ 
  children, 
  className = '', 
  elevated = false,
  padded = true,
  ...props 
}, ref) {
  return (
    <div
      ref={ref}
      className={`
        bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg min-w-0 overflow-hidden
        ${elevated ? 'shadow-md' : 'shadow-sm'}
        ${padded ? 'p-4 sm:p-6' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

const CardHeader = forwardRef(function CardHeader({ children, className = '', ...props }, ref) {
  return (
    <div ref={ref} className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
});
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef(function CardTitle({ children, className = '', ...props }, ref) {
  return (
    <h3 ref={ref} className={`text-lg font-semibold text-[var(--color-text-primary)] ${className}`} {...props}>
      {children}
    </h3>
  );
});
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef(function CardDescription({ children, className = '', ...props }, ref) {
  return (
    <p ref={ref} className={`text-sm text-[var(--color-text-secondary)] mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
});
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef(function CardContent({ children, className = '', ...props }, ref) {
  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  );
});
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef(function CardFooter({ children, className = '', ...props }, ref) {
  return (
    <div ref={ref} className={`mt-4 pt-4 border-t border-[var(--color-border)] flex items-center gap-3 flex-wrap ${className}`} {...props}>
      {children}
    </div>
  );
});
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };