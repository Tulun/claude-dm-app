'use client';

// Shared modal overlay — replaces the ~33 hand-rolled `fixed inset-0 bg-black/…`
// copies whose opacity (50–80), z-index (50/60/100), and padding drifted apart.
//
// - Backdrop click calls onClose only when the backdrop itself was clicked
//   (e.target === e.currentTarget), so panel content needs no stopPropagation.
// - Omit onClose for modals that must not close on backdrop click.
// - `layer`: 'base' (z-50, default) · 'raised' (z-[60], modal over a modal) ·
//   'top' (z-[100], must beat everything).
// - Children are direct flex children of the centered overlay; render your
//   panel div as usual.
const Z_CLASS = { base: 'z-50', raised: 'z-[60]', top: 'z-[100]' };

export default function Modal({ isOpen = true, onClose, layer = 'base', className = '', children }) {
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
