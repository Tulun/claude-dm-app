'use client';

import { useState } from 'react';
import Icons from '../../components/Icons';
import { WORLD_CATEGORIES } from './constants';

export default function WorldItemCard({ item, category, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const cat = WORLD_CATEGORIES.find(c => c.key === category);
  const IconComponent = Icons[cat?.icon] || Icons.Globe;

  const borderColors = {
    emerald: 'border-emerald-700/30',
    teal: 'border-teal-700/30',
    amber: 'border-amber-700/30',
    purple: 'border-purple-700/30',
    red: 'border-red-700/30',
    blue: 'border-blue-700/30'
  };

  const bgColors = {
    emerald: 'bg-emerald-950/20',
    teal: 'bg-teal-950/20',
    amber: 'bg-amber-950/20',
    purple: 'bg-purple-950/20',
    red: 'bg-red-950/20',
    blue: 'bg-blue-950/20'
  };

  const iconBgColors = {
    emerald: 'bg-emerald-900/50',
    teal: 'bg-teal-900/50',
    amber: 'bg-amber-900/50',
    purple: 'bg-purple-900/50',
    red: 'bg-red-900/50',
    blue: 'bg-blue-900/50'
  };

  const iconTextColors = {
    emerald: 'text-emerald-400',
    teal: 'text-teal-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
    blue: 'text-blue-400'
  };

  return (
    <div className={`border ${borderColors[cat?.color]} ${bgColors[cat?.color]} rounded-lg overflow-hidden`}>
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${iconBgColors[cat?.color]}`}>
              <IconComponent className={`w-4 h-4 ${iconTextColors[cat?.color]}`} />
            </div>
            <div>
              <h3 className="font-bold text-amber-400">{item.name}</h3>
              {item.description && <p className="text-sm text-stone-400 line-clamp-2">{item.description}</p>}
              {item.tags && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {item.tags.split(',').map((tag, i) => (
                    <span key={i} className="text-xs px-1.5 py-0.5 bg-stone-700/50 rounded text-stone-400">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 rounded hover:bg-stone-700/50 text-stone-400 hover:text-amber-400"
            >
              <Icons.Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded hover:bg-stone-700/50 text-stone-400 hover:text-red-400"
            >
              <Icons.Trash className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-stone-700/50 pt-3">
          {item.details && (
            <div className="text-sm whitespace-pre-wrap">{item.details}</div>
          )}
          {item.connections && (
            <div><span className="text-stone-500 text-xs">Connections:</span> <span className="text-sm">{item.connections}</span></div>
          )}
          {item.secrets && (
            <div className="bg-red-950/30 border border-red-900/30 rounded p-2">
              <span className="text-red-400 text-xs">🔒 Secrets:</span> <span className="text-sm">{item.secrets}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
