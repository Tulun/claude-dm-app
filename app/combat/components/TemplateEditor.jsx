'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Icons from '../../components/Icons';
import { sizeMatches } from '../monsterAbilities';
import { bookLabel, isOfficial, habitatsOf, compareHabitats } from '../../templates/statBlock';

const NO_BOOK = 'No book';

// CR ordered list for range filter
const CR_LIST = ['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '30'];

const CR_LABELS = { '0': '0', '1/8': '⅛', '1/4': '¼', '1/2': '½' };

const crToNumber = (cr) => {
  if (cr === '1/8') return 0.125;
  if (cr === '1/4') return 0.25;
  if (cr === '1/2') return 0.5;
  return parseFloat(cr) || 0;
};

const crLabel = (cr) => CR_LABELS[cr] || cr;

const SIZE_OPTIONS = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];

const CREATURE_TYPE_OPTIONS = [
  'Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon', 'Elemental',
  'Fey', 'Fiend', 'Giant', 'Humanoid', 'Monstrosity', 'Ooze', 'Plant', 'Undead'
];

// Multi-select dropdown component
const FilterDropdown = ({ label, options, selected, onToggle, onClear, colorClass = 'purple' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const colors = {
    purple: { bg: 'bg-purple-700', badge: 'bg-purple-900', button: 'bg-purple-600' },
    blue: { bg: 'bg-blue-700', badge: 'bg-blue-900', button: 'bg-blue-600' },
    green: { bg: 'bg-emerald-700', badge: 'bg-emerald-900', button: 'bg-emerald-600' },
    sky: { bg: 'bg-sky-700', badge: 'bg-sky-900', button: 'bg-sky-600' },
    lime: { bg: 'bg-lime-800', badge: 'bg-lime-950', button: 'bg-lime-700' },
  };
  const c = colors[colorClass] || colors.purple;

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${selected.length > 0 ? c.bg : 'bg-stone-700 hover:bg-stone-600'}`}
      >
        <span>{label}</span>
        {selected.length > 0 && (
          <span className={`${c.badge} px-1.5 py-0.5 rounded text-xs`}>{selected.length}</span>
        )}
        <Icons.ChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-stone-800 border border-stone-600 rounded-lg shadow-xl z-20 min-w-[200px] max-w-[280px]">
            <div className="p-2 border-b border-stone-700 flex justify-between items-center">
              <span className="text-xs text-stone-400">Select {label}</span>
              {selected.length > 0 && (
                <button onClick={() => { onClear(); }} className="text-xs text-red-400 hover:text-red-300">Clear</button>
              )}
            </div>
            <div className="p-2 flex flex-wrap gap-1 max-h-[200px] overflow-y-auto">
              {options.map(opt => {
                const value = typeof opt === 'object' ? opt.value : opt;
                const displayLabel = typeof opt === 'object' ? opt.label : opt;
                return (
                  <button
                    key={value}
                    onClick={() => onToggle(value)}
                    className={`px-2 py-1 rounded text-xs ${selected.includes(value) ? c.button : 'bg-stone-700 hover:bg-stone-600'}`}
                  >
                    {displayLabel}
                  </button>
                );
              })}
            </div>
            <div className="p-2 border-t border-stone-700">
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-full text-xs text-stone-400 hover:text-stone-200 py-1"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// CR Range Filter component
const CRRangeFilter = ({ minCR, maxCR, onChange, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const minIdx = minCR !== null ? CR_LIST.indexOf(minCR) : 0;
  const maxIdx = maxCR !== null ? CR_LIST.indexOf(maxCR) : CR_LIST.length - 1;
  const isActive = minCR !== null || maxCR !== null;
  
  const handleMin = (idx) => {
    const newMin = CR_LIST[idx];
    const effectiveMax = maxCR || CR_LIST[CR_LIST.length - 1];
    if (crToNumber(newMin) > crToNumber(effectiveMax)) {
      onChange(newMin, newMin);
    } else {
      onChange(newMin, maxCR);
    }
  };
  
  const handleMax = (idx) => {
    const newMax = CR_LIST[idx];
    const effectiveMin = minCR || CR_LIST[0];
    if (crToNumber(newMax) < crToNumber(effectiveMin)) {
      onChange(newMax, newMax);
    } else {
      onChange(minCR, newMax);
    }
  };

  const displayLabel = isActive
    ? `CR ${crLabel(minCR || '0')}–${crLabel(maxCR || '30')}`
    : 'CR';

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${isActive ? 'bg-purple-700' : 'bg-stone-800 hover:bg-stone-700'}`}
      >
        <span>{displayLabel}</span>
        {isActive && (
          <span role="button" onClick={(e) => { e.stopPropagation(); onClear(); }} className="text-xs hover:text-white cursor-pointer">×</span>
        )}
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-stone-800 border border-stone-600 rounded-lg shadow-xl z-20 p-3 w-[280px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-400">CR Range</span>
              {isActive && (
                <button onClick={() => { onClear(); }} className="text-xs text-red-400 hover:text-red-300">Clear</button>
              )}
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <label className="text-[10px] text-stone-500 uppercase mb-1 block">Min</label>
                <select
                  value={minIdx}
                  onChange={(e) => handleMin(parseInt(e.target.value))}
                  className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-purple-600"
                >
                  {CR_LIST.map((cr, i) => (
                    <option key={cr} value={i}>{crLabel(cr)}</option>
                  ))}
                </select>
              </div>
              <span className="text-stone-500 pt-4">–</span>
              <div className="flex-1">
                <label className="text-[10px] text-stone-500 uppercase mb-1 block">Max</label>
                <select
                  value={maxIdx}
                  onChange={(e) => handleMax(parseInt(e.target.value))}
                  className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-purple-600"
                >
                  {CR_LIST.map((cr, i) => (
                    <option key={cr} value={i}>{crLabel(cr)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick presets */}
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'Low (0–4)', min: '0', max: '4' },
                { label: 'Mid (5–10)', min: '5', max: '10' },
                { label: 'High (11–16)', min: '11', max: '16' },
                { label: 'Epic (17–30)', min: '17', max: '30' },
              ].map(p => (
                <button
                  key={p.label}
                  onClick={() => onChange(p.min, p.max)}
                  className="px-2 py-1 rounded text-xs bg-stone-700 hover:bg-stone-600"
                >
                  {p.label}
                </button>
              ))}
            </div>
            
            <div className="mt-2 pt-2 border-t border-stone-700">
              <button onClick={() => setIsOpen(false)} className="w-full text-xs text-stone-400 hover:text-stone-200 py-1">Done</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Library filters survive the trip to a monster's page and back (per tab).
const FILTER_STORAGE_KEY = 'templates-library-filters';
const readSavedFilters = () => {
  try { return JSON.parse(sessionStorage.getItem(FILTER_STORAGE_KEY) || 'null') || {}; } catch { return {}; }
};

const detailHref = (t, edit = false) => `/templates/${encodeURIComponent(t.id)}${edit ? '?edit=1' : ''}`;

/**
 * The monster library list: search + filters, one row per template. A row
 * opens the monster's own page (/templates/[id]), which owns viewing and
 * editing; this list only browses and deletes. Creating (New Template /
 * Import from Image) lives in the page header (app/templates/page.jsx).
 */
const TemplateEditor = ({ templates, onDelete }) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  // Filters start from the per-tab saved copy. TemplateEditor only mounts
  // after the client-side templates fetch, so reading sessionStorage in the
  // initializers can't cause a hydration mismatch.
  const [saved] = useState(readSavedFilters);
  const [filter, setFilter] = useState(['all', 'enemies', 'npcs'].includes(saved.filter) ? saved.filter : 'all');
  const [sourceFilter, setSourceFilter] = useState(['default', 'conflux', 'custom'].includes(saved.sourceFilter) ? saved.sourceFilter : 'default');
  const [confluxTemplates, setConfluxTemplates] = useState([]);
  const [confluxLoading, setConfluxLoading] = useState(false);
  const [confluxLoaded, setConfluxLoaded] = useState(false);

  const [searchQuery, setSearchQuery] = useState(typeof saved.searchQuery === 'string' ? saved.searchQuery : '');
  const [crMin, setCrMin] = useState(saved.crMin ?? null);
  const [crMax, setCrMax] = useState(saved.crMax ?? null);
  const [selectedSizes, setSelectedSizes] = useState(Array.isArray(saved.selectedSizes) ? saved.selectedSizes : []);
  const [selectedCreatureTypes, setSelectedCreatureTypes] = useState(Array.isArray(saved.selectedCreatureTypes) ? saved.selectedCreatureTypes : []);
  const [selectedBooks, setSelectedBooks] = useState(Array.isArray(saved.selectedBooks) ? saved.selectedBooks : []);
  const [selectedHabitats, setSelectedHabitats] = useState(Array.isArray(saved.selectedHabitats) ? saved.selectedHabitats : []);

  // Load Conflux creatures on demand
  const loadConflux = () => {
    if (confluxLoaded) return;
    setConfluxLoading(true);
    fetch('/api/templates?source=conflux')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setConfluxTemplates(data);
        setConfluxLoaded(true);
        setConfluxLoading(false);
      })
      .catch(() => setConfluxLoading(false));
  };

  // Switch source filter
  const handleSourceChange = (src) => {
    setSourceFilter(src);
    if (src === 'conflux') loadConflux();
  };

  // A restored Conflux filter needs its data fetched.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot fetch kick-off on mount
    if (sourceFilter === 'conflux') loadConflux();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({ searchQuery, filter, sourceFilter, crMin, crMax, selectedSizes, selectedCreatureTypes, selectedBooks, selectedHabitats }));
    } catch { /* storage unavailable — filters just won't persist */ }
  }, [searchQuery, filter, sourceFilter, crMin, crMax, selectedSizes, selectedCreatureTypes, selectedBooks, selectedHabitats]);

  // Get the active template list based on source filter
  const activeTemplates = sourceFilter === 'conflux' ? confluxTemplates : templates;

  // Get available creature types from active templates
  const availableCreatureTypes = useMemo(() => {
    const types = new Set();
    (activeTemplates || []).forEach(t => {
      if (t.creatureType) {
        const baseType = t.creatureType.split(' ')[0].replace(/[()]/g, '');
        types.add(baseType);
      }
    });
    return CREATURE_TYPE_OPTIONS.filter(ct => types.has(ct));
  }, [activeTemplates]);

  // Books present in the active list ("MM 2014", "MM 2024", …); "No book" for untagged.
  const availableBooks = useMemo(() => {
    const books = new Set((activeTemplates || []).map(t => bookLabel(t) || NO_BOOK));
    return [...books].sort((a, b) => (a === NO_BOOK) - (b === NO_BOOK) || a.localeCompare(b));
  }, [activeTemplates]);

  // Habitats present in the active list (2024 Monster Manual stat blocks — see habitatsOf).
  const availableHabitats = useMemo(() => {
    const habitats = new Set((activeTemplates || []).flatMap(habitatsOf));
    return [...habitats].sort(compareHabitats);
  }, [activeTemplates]);

  const toggleFilter = (setter) => (value) => {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const filtered = useMemo(() => {
    return (activeTemplates || []).filter(t => {
      // Type filter (NPC vs Enemy)
      if (filter === 'enemies' && t.isNpc) return false;
      if (filter === 'npcs' && !t.isNpc) return false;
      
      // Official (built-ins + book-tagged imports) vs Custom (everything else)
      if (sourceFilter === 'custom' && isOfficial(t)) return false;
      if (sourceFilter === 'default' && !isOfficial(t)) return false;
      
      // Search filter
      if (searchQuery.trim() && !t.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
      
      // CR range filter
      if (crMin !== null || crMax !== null) {
        const crNum = crToNumber(String(t.cr));
        if (crMin !== null && crNum < crToNumber(crMin)) return false;
        if (crMax !== null && crNum > crToNumber(crMax)) return false;
      }
      
      // Size filter
      if (!sizeMatches(t.size, selectedSizes)) return false;
      
      // Creature type filter
      if (selectedCreatureTypes.length > 0) {
        if (!t.creatureType) return false;
        const matches = selectedCreatureTypes.some(ct => 
          t.creatureType.startsWith(ct) || t.creatureType.includes(ct)
        );
        if (!matches) return false;
      }
      
      // Source book filter
      if (selectedBooks.length > 0 && !selectedBooks.includes(bookLabel(t) || NO_BOOK)) return false;

      // Habitat filter — matches a monster listed under ANY selected habitat
      if (selectedHabitats.length > 0 && !habitatsOf(t).some(h => selectedHabitats.includes(h))) return false;

      return true;
    });
  }, [activeTemplates, filter, sourceFilter, searchQuery, crMin, crMax, selectedSizes, selectedCreatureTypes, selectedBooks, selectedHabitats]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setCrMin(null);
    setCrMax(null);
    setSelectedSizes([]);
    setSelectedCreatureTypes([]);
    setSelectedBooks([]);
    setSelectedHabitats([]);
    setFilter('all');
    setSourceFilter('default');
  };

  const hasFilters = searchQuery || crMin !== null || crMax !== null || selectedSizes.length > 0 || selectedCreatureTypes.length > 0 || selectedBooks.length > 0 || selectedHabitats.length > 0 || filter !== 'all' || sourceFilter !== 'default';

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search templates by name..."
          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2 pl-10 text-sm focus:outline-none focus:border-amber-600"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300">×</button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Source Filter */}
        <div className="flex gap-1">
          {[
            { key: 'default', label: 'Official' },
            { key: 'conflux', label: 'Conflux' },
            { key: 'custom', label: 'Custom' },
          ].map(s => (
            <button key={s.key} onClick={() => handleSourceChange(s.key)}
              className={`px-3 py-1.5 rounded-lg text-sm ${sourceFilter === s.key ? 'bg-amber-700' : 'bg-stone-700 hover:bg-stone-600'}`}>
              {s.label}{s.key === 'conflux' && confluxLoading ? '...' : ''}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-stone-700" />

        {/* Type Filter */}
        <div className="flex gap-1">
          {['all', 'enemies', 'npcs'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm capitalize ${filter === f ? 'bg-amber-700' : 'bg-stone-700 hover:bg-stone-600'}`}>{f}</button>
          ))}
        </div>

        <div className="w-px h-6 bg-stone-700" />

        {/* CR Range Filter */}
        <CRRangeFilter
          minCR={crMin}
          maxCR={crMax}
          onChange={(min, max) => { setCrMin(min); setCrMax(max); }}
          onClear={() => { setCrMin(null); setCrMax(null); }}
        />

        {/* Size Filter */}
        <FilterDropdown
          label="Size"
          options={SIZE_OPTIONS}
          selected={selectedSizes}
          onToggle={toggleFilter(setSelectedSizes)}
          onClear={() => setSelectedSizes([])}
          colorClass="blue"
        />

        {/* Creature Type Filter */}
        <FilterDropdown
          label="Type"
          options={availableCreatureTypes}
          selected={selectedCreatureTypes}
          onToggle={toggleFilter(setSelectedCreatureTypes)}
          onClear={() => setSelectedCreatureTypes([])}
          colorClass="green"
        />

        {/* Source Book Filter */}
        {availableBooks.length > 1 && (
          <FilterDropdown
            label="Book"
            options={availableBooks}
            selected={selectedBooks}
            onToggle={toggleFilter(setSelectedBooks)}
            onClear={() => setSelectedBooks([])}
            colorClass="sky"
          />
        )}

        {/* Habitat Filter */}
        {availableHabitats.length > 0 && (
          <FilterDropdown
            label="Habitat"
            options={availableHabitats}
            selected={selectedHabitats}
            onToggle={toggleFilter(setSelectedHabitats)}
            onClear={() => setSelectedHabitats([])}
            colorClass="lime"
          />
        )}

        {hasFilters && (
          <button 
            onClick={clearAllFilters}
            className="px-2 py-1 rounded text-xs text-red-400 hover:text-red-300 hover:bg-red-900/30"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1 items-center">
          {(crMin !== null || crMax !== null) && (
            <span className="px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded text-xs flex items-center gap-1">
              CR {crLabel(crMin || '0')}–{crLabel(crMax || '30')}
              <button onClick={() => { setCrMin(null); setCrMax(null); }} className="hover:text-white">×</button>
            </span>
          )}
          {selectedSizes.map(size => (
            <span key={`size-${size}`} className="px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded text-xs flex items-center gap-1">
              {size}
              <button onClick={() => toggleFilter(setSelectedSizes)(size)} className="hover:text-white">×</button>
            </span>
          ))}
          {selectedBooks.map(b => (
            <span key={`book-${b}`} className="px-2 py-0.5 bg-sky-900/50 text-sky-300 rounded text-xs flex items-center gap-1">
              {b}
              <button onClick={() => toggleFilter(setSelectedBooks)(b)} className="hover:text-white">×</button>
            </span>
          ))}
          {selectedHabitats.map(h => (
            <span key={`hab-${h}`} className="px-2 py-0.5 bg-lime-900/50 text-lime-300 rounded text-xs flex items-center gap-1">
              {h}
              <button onClick={() => toggleFilter(setSelectedHabitats)(h)} className="hover:text-white">×</button>
            </span>
          ))}
          {selectedCreatureTypes.map(ct => (
            <span key={`ct-${ct}`} className="px-2 py-0.5 bg-emerald-900/50 text-emerald-300 rounded text-xs flex items-center gap-1">
              {ct}
              <button onClick={() => toggleFilter(setSelectedCreatureTypes)(ct)} className="hover:text-white">×</button>
            </span>
          ))}
        </div>
      )}

      <div className="text-xs text-stone-500">
        {filtered.length} template{filtered.length !== 1 ? 's' : ''}
        {filtered.length !== activeTemplates.length && ` (filtered from ${activeTemplates.length})`}
      </div>

      <div className="space-y-2">
        {filtered.map((t) => (
          <div key={t.id} data-testid="template-row" className={`group flex items-center gap-2 rounded-lg border pr-3 transition-colors ${t.isNpc ? 'bg-emerald-950/30 border-emerald-900/50 hover:border-emerald-700/70' : 'bg-red-950/30 border-red-900/50 hover:border-red-700/70'}`}>
            <Link href={detailHref(t)} className="flex flex-1 min-w-0 items-center gap-3 p-3">
              <div className={`shrink-0 p-2 rounded ${t.isNpc ? 'bg-emerald-900/50' : 'bg-red-900/50'}`}>{t.isNpc ? <Icons.Shield /> : <Icons.Skull />}</div>
              <div className="min-w-0">
                <div className="font-medium group-hover:text-amber-200">{t.name}</div>
                <div className="text-xs text-stone-400 truncate">
                  {(t.size || t.creatureType) && <span className="italic">{t.size} {t.creatureType} • </span>}
                  CR {t.cr} • AC {t.ac} • HP {t.maxHp}{t.hitDice && ` (${t.hitDice})`} • {t.speed}{typeof t.speed === 'number' ? ' ft.' : ''}
                </div>
              </div>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              {bookLabel(t) && <span className="text-xs text-sky-300 bg-sky-900/30 px-1.5 py-0.5 rounded" title="Source book">{bookLabel(t)}</span>}
              {t.legendaryActions?.length > 0 && <span className="text-xs text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded">Legendary</span>}
              {sourceFilter !== 'conflux' && (
                <>
                  <Link href={detailHref(t, true)} aria-label={`Edit ${t.name}`} className="p-2 rounded bg-stone-700/50 hover:bg-stone-600/50"><Icons.Edit /></Link>
                  {deleteConfirmId === t.id ? (
                    <>
                      <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 rounded bg-stone-700 text-xs">Cancel</button>
                      <button onClick={() => { onDelete(t.id); setDeleteConfirmId(null); }} className="px-2 py-1 rounded bg-red-700 text-xs">Delete</button>
                    </>
                  ) : (
                    <button onClick={() => setDeleteConfirmId(t.id)} aria-label={`Delete ${t.name}`} className="p-2 rounded bg-red-900/30 hover:bg-red-800/50 text-red-400"><Icons.Trash /></button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateEditor;
