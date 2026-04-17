'use client';

import { useState, useEffect } from 'react';
import Icons from '../../components/Icons';

export default function ResourceRow({ resource, onUpdate, onRemove }) {
  const [editCurrent, setEditCurrent] = useState(String(resource.current));
  const [editMax, setEditMax] = useState(String(resource.max));
  const [isEditingCurrent, setIsEditingCurrent] = useState(false);
  const [isEditingMax, setIsEditingMax] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showEditOptions, setShowEditOptions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasOptions = resource.options && resource.options.length > 0;

  // Sync local state when resource changes externally (e.g., +/- buttons)
  useEffect(() => {
    if (!isEditingCurrent) setEditCurrent(String(resource.current));
  }, [resource.current, isEditingCurrent]);
  
  useEffect(() => {
    if (!isEditingMax) setEditMax(String(resource.max));
  }, [resource.max, isEditingMax]);

  const handleCurrentBlur = () => {
    setIsEditingCurrent(false);
    const num = parseInt(editCurrent);
    if (!isNaN(num)) {
      const validMax = Math.max(1, resource.max);
      onUpdate('current', Math.max(0, Math.min(validMax, num)));
    } else {
      setEditCurrent(String(resource.current));
    }
  };

  const handleMaxBlur = () => {
    setIsEditingMax(false);
    const num = parseInt(editMax);
    if (!isNaN(num) && num >= 1) {
      onUpdate('max', num);
      if (resource.current > num) {
        onUpdate('current', num);
      }
    } else {
      setEditMax(String(resource.max));
    }
  };

  const handleKeyDown = (e, onBlur) => {
    if (e.key === 'Enter') onBlur();
    if (e.key === 'Escape') {
      setEditCurrent(String(resource.current));
      setEditMax(String(resource.max));
      setIsEditingCurrent(false);
      setIsEditingMax(false);
    }
  };

  const handleUseResource = () => {
    if (resource.current <= 0) return;
    
    if (hasOptions) {
      setShowOptions(true);
    } else {
      onUpdate('current', resource.current - 1);
    }
  };

  const handleSelectOption = (optionName) => {
    onUpdate('current', resource.current - 1);
    onUpdate('lastUsed', optionName);
    setShowOptions(false);
  };

  const addOption = () => {
    const newOptions = [...(resource.options || []), { name: '', description: '' }];
    onUpdate('options', newOptions);
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...(resource.options || [])];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onUpdate('options', newOptions);
  };

  const removeOption = (index) => {
    const newOptions = [...(resource.options || [])];
    newOptions.splice(index, 1);
    onUpdate('options', newOptions);
  };

  return (
    <>
      <div className={`bg-stone-800 rounded-lg overflow-hidden ${hasOptions ? 'border border-stone-700' : ''}`}>
        {/* Main Row */}
        <div className="p-3 flex items-center gap-4">
          {/* Expand button for resources with options */}
          {hasOptions && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-stone-400 hover:text-stone-200 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              >
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
              </svg>
            </button>
          )}
          
          <input 
            type="text" 
            value={resource.name} 
            onChange={(e) => onUpdate('name', e.target.value)}
            className="flex-1 bg-transparent font-medium focus:outline-none" 
            placeholder="Resource name (e.g., Wild Shape, Rage, Spirit Totem)" 
          />
          
          {/* Last used indicator */}
          {resource.lastUsed && (
            <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-1 rounded">
              {resource.lastUsed}
            </span>
          )}
          
          {/* Options badge / Add options button */}
          <button
            onClick={() => setShowEditOptions(!showEditOptions)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              hasOptions 
                ? 'text-amber-400 bg-amber-900/30 hover:bg-amber-900/50' 
                : 'text-stone-500 bg-stone-700/50 hover:bg-stone-700 hover:text-stone-300'
            }`}
            title={hasOptions ? 'Edit options' : 'Add options (for abilities with choices)'}
          >
            {hasOptions ? `${resource.options.length} option${resource.options.length !== 1 ? 's' : ''}` : '+ options'}
          </button>
          
          <div className="flex items-center gap-2">
            {/* Use button (shows options modal if has options) */}
            <button 
              onClick={handleUseResource}
              disabled={resource.current <= 0}
              className={`w-8 h-8 rounded text-lg transition-colors ${
                resource.current > 0 
                  ? hasOptions 
                    ? 'bg-purple-700 hover:bg-purple-600 text-white' 
                    : 'bg-stone-700 hover:bg-stone-600'
                  : 'bg-stone-800 text-stone-600 cursor-not-allowed'
              }`}
              title={hasOptions ? 'Use (choose option)' : 'Use'}
            >
              −
            </button>
            <div className="flex items-center gap-1">
              <input 
                type="text" 
                value={editCurrent} 
                onChange={(e) => setEditCurrent(e.target.value)}
                onFocus={() => setIsEditingCurrent(true)}
                onBlur={handleCurrentBlur}
                onKeyDown={(e) => handleKeyDown(e, handleCurrentBlur)}
                className="w-12 bg-stone-700 rounded px-2 py-1 text-center font-mono text-lg focus:outline-none focus:ring-1 focus:ring-amber-500" 
              />
              <span className="text-stone-500">/</span>
              <input 
                type="text" 
                value={editMax} 
                onChange={(e) => setEditMax(e.target.value)}
                onFocus={() => setIsEditingMax(true)}
                onBlur={handleMaxBlur}
                onKeyDown={(e) => handleKeyDown(e, handleMaxBlur)}
                className="w-12 bg-stone-700 rounded px-2 py-1 text-center font-mono text-lg focus:outline-none focus:ring-1 focus:ring-amber-500" 
              />
            </div>
            <button 
              onClick={() => onUpdate('current', Math.min(resource.max, resource.current + 1))}
              className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 text-lg"
            >+</button>
            <button 
              onClick={() => onUpdate('current', resource.max)}
              className="px-2 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-xs"
            >Reset</button>
            <button onClick={onRemove} className="text-red-500 hover:text-red-400 text-lg">×</button>
          </div>
        </div>

        {/* Expanded Options View (read-only) - only show if not editing */}
        {isExpanded && hasOptions && !showEditOptions && (
          <div className="px-3 pb-3 border-t border-stone-700/50">
            <div className="pt-3 space-y-2">
              {resource.options.map((option, i) => (
                <div key={i} className="bg-stone-900/50 rounded-lg p-3">
                  <h4 className="font-medium text-amber-400">{option.name}</h4>
                  {option.description && (
                    <p className="text-sm text-stone-400 mt-1 whitespace-pre-wrap">{option.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Options Panel */}
        {showEditOptions && (
          <div className="px-3 pb-3 border-t border-stone-700/50">
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-400">Configure options for this resource</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={addOption}
                    className="text-xs px-2 py-1 rounded bg-amber-800 hover:bg-amber-700 flex items-center gap-1"
                  >
                    <Icons.Plus className="w-3 h-3" /> Add Option
                  </button>
                  <button
                    onClick={() => setShowEditOptions(false)}
                    className="text-xs px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600"
                  >
                    Done
                  </button>
                </div>
              </div>
              
              {(resource.options || []).map((option, i) => (
                <div key={i} className="bg-stone-900/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option.name}
                      onChange={(e) => updateOption(i, 'name', e.target.value)}
                      placeholder="Option name (e.g., Bear Spirit)"
                      className="flex-1 bg-stone-800 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      onClick={() => removeOption(i)}
                      className="text-red-500 hover:text-red-400 p-1"
                    >
                      <Icons.Trash className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={option.description}
                    onChange={(e) => updateOption(i, 'description', e.target.value)}
                    placeholder="Description of what this option does..."
                    rows={3}
                    className="w-full bg-stone-800 rounded px-2 py-1 text-sm text-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                  />
                </div>
              ))}
              
              {(!resource.options || resource.options.length === 0) && (
                <p className="text-center text-stone-500 text-sm py-4">
                  No options yet. Add options for abilities like Spirit Totem, Wild Shape forms, etc.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Options Selection Modal */}
      {showOptions && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowOptions(false)}
        >
          <div 
            className="bg-stone-900 border border-stone-700 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-stone-700">
              <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <Icons.Sparkles className="w-5 h-5" />
                {resource.name}
              </h2>
              <p className="text-sm text-stone-400 mt-1">Choose an option to use</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {resource.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectOption(option.name)}
                  className="w-full text-left p-4 rounded-lg border border-stone-700 bg-stone-800/50 hover:border-amber-600/50 hover:bg-stone-800 transition-colors"
                >
                  <h3 className="font-medium text-amber-400">{option.name}</h3>
                  {option.description && (
                    <p className="text-sm text-stone-400 mt-1 whitespace-pre-wrap">{option.description}</p>
                  )}
                </button>
              ))}
            </div>
            
            <div className="p-4 border-t border-stone-700">
              <button
                onClick={() => setShowOptions(false)}
                className="w-full py-2 rounded-lg bg-stone-700 hover:bg-stone-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
