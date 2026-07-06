'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { TOAST_DURATION_MS } from '../utils/timings';

// Shared save-status toast: show a message, auto-clear after `duration` ms.
// Replaces the hand-copied `setSaveStatus(msg); setTimeout(clear, 2000)` pairs.
// A newer message resets the timer, so a stale timer can't clear it early.
// Pass duration = null to show a message that stays until the next one.
export function useToast() {
  const [message, setMessage] = useState('');
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const showToast = useCallback((msg, duration = TOAST_DURATION_MS) => {
    clearTimeout(timerRef.current);
    setMessage(msg);
    if (duration !== null) {
      timerRef.current = setTimeout(() => setMessage(''), duration);
    }
  }, []);

  return [message, showToast];
}
