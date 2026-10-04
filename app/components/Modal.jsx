'use client';

import { useEffect, useRef } from 'react';

// Shared modal overlay — replaces the ~33 hand-rolled `fixed inset-0 bg-black/…`
// copies whose opacity (50–80), z-index (50/60/100), and padding drifted apart.
//
// - Backdrop click calls onClose only when the backdrop itself was clicked
//   (e.target === e.currentTarget), so panel content needs no stopPropagation.
// - Escape calls onClose too — but only for the TOPMOST open modal, so a
//   modal over a modal peels off one layer per press. A handler that wants
//   Escape for itself can call e.preventDefault() to keep the modal open.
// - Omit onClose for modals that must not close on backdrop click or Escape
//   (they still count as the top layer, so Escape won't close what's beneath).
// - `layer`: 'base' (z-50, default) · 'raised' (z-[60], modal over a modal) ·
//   'top' (z-[100], must beat everything).
// - Children are direct flex children of the centered overlay; render your
//   panel div as usual.
const Z_CLASS = { base: 'z-50', raised: 'z-[60]', top: 'z-[100]' };

// Open modals in mount order; the last entry owns the Escape key.
const openStack = [];

export default function Modal({ isOpen = true, onClose, layer = 'base', className = '', children }) {
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const token = {};
    openStack.push(token);
    const onKeyDown = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (openStack[openStack.length - 1] !== token) return;
      if (onCloseRef.current) onCloseRef.current(e);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const i = openStack.indexOf(token);
      if (i >= 0) openStack.splice(i, 1);
    };
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div
      className={`fixed inset-0 bg-black/70 flex items-center justify-center p-4 ${Z_CLASS[layer] || Z_CLASS.base} ${className}`}
      onClick={onClose ? (e) => { if (e.target === e.currentTarget) onClose(e); } : undefined}
    >
      {children}
    </div>
  );
}
