import React, { useEffect } from 'react';

const Modal = ({ open, title, description, onClose, children, maxWidth = 'max-w-3xl' }) => {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto px-3 py-4 sm:px-5 sm:py-6" role="presentation">
      <div className="fixed inset-0 animate-modal-fade bg-slate-950/55 backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>
      <div className="flex min-h-full items-start justify-center sm:items-center">
        <div
          className={`app-modal relative w-full ${maxWidth} animate-modal-enter overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-5 py-4">
            <div className="min-w-0">
              <h2 id="modal-title" className="truncate text-base font-semibold text-slate-950">{title}</h2>
              {description && <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="max-h-[calc(100vh-9rem)] overflow-y-auto px-5 py-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
