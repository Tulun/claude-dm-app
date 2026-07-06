'use client';

import { useState, useCallback, useMemo } from 'react';

// Drag-to-reorder state + handlers for the initiative list. Owns the
// drag/drag-over indices so the page doesn't have to; returns a `dragHandlers`
// bundle to pass as ONE prop to each memoized row. Handlers use useCallback so
// the bundle identity only changes while a drag is in flight (onDrop reads
// dragIndex). `onReorder(fromIndex, toIndex)` fires when a drop lands.
export function useDragReorder(onReorder) {
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const onDragStart = useCallback((e, idx) => {
    setDragIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDragOver = useCallback((e, idx) => {
    e.preventDefault();
    setDragOverIndex(idx);
  }, []);

  const onDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  const onDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== dropIndex) onReorder(dragIndex, dropIndex);
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, onReorder]);

  const dragHandlers = useMemo(
    () => ({ onDragStart, onDragOver, onDrop, onDragEnd }),
    [onDragStart, onDragOver, onDrop, onDragEnd]
  );

  return { dragIndex, dragOverIndex, dragHandlers };
}
