'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Icons from '../../../components/Icons';
import { getCardActions } from './CardActionButtons';

const MENU_WIDTH = 208;

/**
 * The party card's ⋯ overflow menu: the same `getCardActions` list as the
 * icon row, plus an Edit Character link. The menu PORTALS to <body> with
 * fixed positioning because the card is `overflow-hidden` (an absolute
 * dropdown would be clipped). Closes on pick, outside click, scroll and Escape.
 */
export default function CardActionMenu({ character, spellcastingInfo, onOpen, editHref }) {
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const open = pos !== null;
  const close = () => setPos(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const toggle = (e) => {
    e.stopPropagation();
    if (open) return close();
    const rect = triggerRef.current.getBoundingClientRect();
    const left = Math.max(16, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 16));
    setPos({ top: rect.bottom + 4, left });
  };

  const actions = getCardActions(character, false, spellcastingInfo);
  const itemClass = 'w-full flex items-center gap-3 px-3 py-2 text-sm text-stone-200 hover:bg-stone-800 transition-colors text-left';

  return (
    <>
      <button
        ref={triggerRef}
        aria-label={`More actions for ${character.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className={`p-2 rounded-lg transition-colors ${open ? 'bg-stone-700/60 text-stone-200' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/40'}`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {open && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div
            role="menu"
            aria-label={`${character.name} actions`}
            className="fixed z-50 py-1 bg-stone-900 border border-stone-700 rounded-lg shadow-xl"
            style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
          >
            {actions.map(({ key, label, icon: Icon, className }) => (
              <button
                key={key}
                role="menuitem"
                onClick={(e) => { e.stopPropagation(); close(); onOpen(key); }}
                className={itemClass}
              >
                {/* keep the action's text colour for the icon only */}
                <span className={`inline-flex w-5 justify-center ${className.split(' ').filter(c => c.startsWith('text-')).join(' ')}`}>
                  <Icon className="w-5 h-5" />
                </span>
                {label}
              </button>
            ))}
            {editHref && (
              <>
                <div className="my-1 border-t border-stone-700/60" />
                <Link href={editHref} role="menuitem" onClick={close} className={itemClass}>
                  <span className="inline-flex w-5 justify-center text-stone-400"><Icons.Edit /></span>
                  Edit Character
                </Link>
              </>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
