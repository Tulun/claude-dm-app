'use client';

import { useState, useEffect, useRef } from 'react';

// Shared Tooltip component - uses fixed positioning to avoid container clipping
export const Tooltip = ({ text, children }) => {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const handleMouseEnter = () => {
    if (triggerRef.current && text) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipWidth = 280;
      
      // Start position: above the element, aligned to left
      let top = rect.top - 8;
      let left = rect.left;
      
      // Prevent going off right edge of viewport
      if (left + tooltipWidth > window.innerWidth - 16) {
        left = window.innerWidth - tooltipWidth - 16;
      }
      
      // Prevent going off left edge
      if (left < 16) {
        left = 16;
      }
      
      setPosition({ top, left });
      setShow(true);
    }
  };

  return (
    <span 
      ref={triggerRef}
      className="inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && text && (
        <span 
          className="fixed px-2 py-1.5 bg-stone-900 border border-stone-600 rounded text-xs text-stone-200 shadow-xl pointer-events-none"
          style={{ 
            zIndex: 99999, 
            top: position.top,
            left: position.left,
            transform: 'translateY(-100%)',
            maxWidth: '280px',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
};

export const EditableField = ({ value, onChange, type = 'text', className = '', min, max, placeholder }) => {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(String(value));

  const handleBlur = () => {
    setEditing(false);
    if (type === 'number') {
      const num = parseInt(tempValue);
      if (!isNaN(num)) {
        let finalNum = num;
        if (min !== undefined) finalNum = Math.max(min, finalNum);
        if (max !== undefined) finalNum = Math.min(max, finalNum);
        onChange(finalNum);
      }
      // If not a valid number, don't update (keep old value)
    } else {
      onChange(tempValue);
    }
  };

  if (editing) {
    return (
      <input
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        className={`bg-stone-900/50 border border-amber-700/50 rounded px-2 py-1 focus:outline-none focus:border-amber-500 ${className}`}
        autoFocus
      />
    );
  }

  return (
    <span
      onClick={() => { setEditing(true); setTempValue(String(value)); }}
      className={`cursor-pointer hover:bg-amber-900/30 rounded px-2 py-1 transition-colors ${className}`}
    >
      {value || placeholder || '—'}
    </span>
  );
};

export const HpBar = ({ current, max, onChange }) => {
  const [currentText, setCurrentText] = useState(String(current));
  const [maxText, setMaxText] = useState(String(max));

  useEffect(() => {
    setCurrentText(String(current));
  }, [current]);

  useEffect(() => {
    setMaxText(String(max));
  }, [max]);

  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  let barColor = 'bg-emerald-600';
  if (percentage <= 50) barColor = 'bg-amber-500';
  if (percentage <= 25) barColor = 'bg-red-600';
  if (current < 0) barColor = 'bg-purple-600'; // Negative HP = permadeath territory

  const handleCurrentBlur = () => {
    const num = parseInt(currentText);
    if (!isNaN(num)) {
      onChange(num, max); // Allow any value including negative
    } else {
      setCurrentText(String(current));
    }
  };

  const handleMaxBlur = () => {
    const num = parseInt(maxText);
    if (!isNaN(num) && num > 0) {
      onChange(current, num); // Don't clamp current to max
    } else {
      setMaxText(String(max));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-3 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
        <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="flex items-center gap-1 text-sm font-mono">
        <input
          type="text"
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          onBlur={handleCurrentBlur}
          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
          className="w-12 text-center bg-stone-900/50 border border-stone-700 rounded px-1 py-0.5 focus:outline-none focus:border-amber-500"
        />
        <span className="text-stone-500">/</span>
        <input
          type="text"
          value={maxText}
          onChange={(e) => setMaxText(e.target.value)}
          onBlur={handleMaxBlur}
          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
          className="w-12 text-center bg-stone-900/50 border border-stone-700 rounded px-1 py-0.5 focus:outline-none focus:border-amber-500"
        />
      </div>
    </div>
  );
};
