'use client';

import { useState } from 'react';
import Icons from '../../../components/Icons';
import ResourceRow from '../ResourceRow';

export default function ResourcesTab({ character, onUpdate }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const addResource = () => {
    const newResource = { id: Date.now(), name: '', current: 1, max: 1 };
    onUpdate('resources', [...(character.resources || []), newResource]);
  };

  const updateResource = (index, field, value) => {
    const updated = [...(character.resources || [])];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate('resources', updated);
  };

  const removeResource = (index) => {
    const updated = [...(character.resources || [])];
    updated.splice(index, 1);
    onUpdate('resources', updated);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== index) setDragOverIndex(index);
  };

  const handleDragLeave = () => setDragOverIndex(null);

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...(character.resources || [])];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, draggedItem);
    onUpdate('resources', updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-stone-400">Track spell slots, abilities, wild shapes, and other limited-use resources.</p>
        <button onClick={addResource} className="px-3 py-1 rounded bg-amber-800 hover:bg-amber-700 text-xs flex items-center gap-1">
          <Icons.Plus /> Add Resource
        </button>
      </div>
      
      <div className="space-y-2">
        {(character.resources || []).map((resource, i) => (
          <div
            key={resource.id || i}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 transition-all ${
              draggedIndex === i ? 'opacity-50' : ''
            } ${dragOverIndex === i ? 'border-t-2 border-amber-500 pt-1' : ''}`}
          >
            <div className="cursor-grab active:cursor-grabbing text-stone-600 hover:text-stone-400 px-1">
              <Icons.GripVertical />
            </div>
            <div className="flex-1">
              <ResourceRow 
                resource={resource} 
                onUpdate={(field, value) => updateResource(i, field, value)}
                onRemove={() => removeResource(i)}
              />
            </div>
          </div>
        ))}
      </div>
      {(character.resources || []).length === 0 && (
        <div className="text-center text-stone-500 py-8">No resources yet. Add things like spell slots, wild shapes, rage uses, etc.</div>
      )}
    </div>
  );
}
