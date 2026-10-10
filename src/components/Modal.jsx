import { forwardRef, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { createPortal } from 'react-dom';

const Modal = forwardRef(function Modal({ 
  open, 
  onClose, 
  title, 
  description, 
  children, 
  size = 'md',
  showClose = true,
  className = '',
  ...props 
}, ref) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      contentRef.current?.focus();
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose?.();
    if (e.key === 'Tab') trapFocus(e);
  };

  const trapFocus = (e) => {
    const focusableElements = contentRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusableElements?.length) return;
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  const modalContent = (
    <div
      className={`
        fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4
        bg-black/50 backdrop-blur-sm animate-fade-in
      `}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
    >
      <div
        ref={contentRef}
        tabIndex={-1}
        className={`
          w-full ${sizes[size]} bg-[var(--color-surface)] rounded-lg shadow-xl
          animate-slide-up max-h-[90vh] flex flex-col
          ${className}
        `}
        {...props}
      >
        {(title || showClose) && (
          <div className="flex items-start justify-between p-6 border-b border-[var(--color-border)]">
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close modal"
                className="flex-shrink-0"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </Button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
});
Modal.displayName = 'Modal';

const Drawer = forwardRef(function Drawer({ 
  open, 
  onClose, 
  title, 
  description, 
  children, 
  position = 'right',
  size = 'md',
  className = '',
  ...props 
}, ref) {
  const drawerRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      drawerRef.current?.focus();
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose?.();
  };

  if (!open) return null;

  const sizes = {
    sm: 'w-72',
    md: 'w-96',
    lg: 'w-[480px]',
    xl: 'w-[600px]',
    full: 'w-full max-w-full'
  };

  const positions = {
    right: 'right-0',
    left: 'left-0'
  };

  const drawerContent = (
    <div
      className={`
        fixed inset-y-0 ${positions[position]} z-[var(--z-modal)] flex
        bg-black/50 backdrop-blur-sm animate-fade-in
      `}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'drawer-title' : undefined}
      aria-describedby={description ? 'drawer-description' : undefined}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        ref={drawerRef}
        tabIndex={-1}
        className={`
          flex-1 flex flex-col ${sizes[size]} bg-[var(--color-surface)] shadow-xl
          animate-slide-in-${position === 'right' ? 'right' : 'left'} max-h-full
          ${className}
        `}
        {...props}
      >
        {(title || description) && (
          <div className="flex items-start justify-between p-6 border-b border-[var(--color-border)] flex-shrink-0">
            <div>
              {title && (
                <h2 id="drawer-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {title}
                </h2>
              )}
              {description && (
                <p id="drawer-description" className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {description}
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close drawer">
              <X className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
});
Drawer.displayName = 'Drawer';

export { Modal, Drawer };