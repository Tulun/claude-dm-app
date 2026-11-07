'use client';

import { Fragment, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Icons from '../../components/Icons';
import { sizeMatches } from '../monsterAbilities';
import { bookLabel, librarySection, habitatsOf, compareHabitats, latestConfluxVersion, confluxChange } from '../../monsters/statBlock';
import { GROUPINGS, GROUPING_KEYS, groupMonsters, groupAnchorId, groupingKeysFor, NO_BOOK, CREATURE_TYPES as CREATURE_TYPE_OPTIONS } from '../../monsters/groupMonsters';

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

const detailHref = (t, edit = false) => `/monsters/${encodeURIComponent(t.id)}${edit ? '?edit=1' : ''}`;

// List vs card layout is a per-browser preference (survives sessions), unlike
// the filters, which are per-tab.
const VIEW_STORAGE_KEY = 'templates-library-view';
const VIEW_MODES = ['cards', 'list'];
const readSavedView = () => {
  try { const v = localStorage.getItem(VIEW_STORAGE_KEY); return VIEW_MODES.includes(v) ? v : 'cards'; } catch { return 'cards'; }
};

// "Small Plant" — size + creature type, whichever exist.
const typeLine = (t) => [t.size, t.creatureType].filter(Boolean).join(' ');

// Source tabs. The Conflux tab has a "Latest" filter that narrows it to the
// newest release's new and updated creatures (confluxChange in
// app/monsters/statBlock.js) — it used to be a tab of its own ('latest').
// 'default' (Official = Wizards of the Coast books), 'fm' and 'custom' split
// the saved library by librarySection; the two Conflux tabs are read-only.
const SOURCE_TABS = [
  { key: 'default', label: 'Official' },
  { key: 'fm', label: 'Flee Mortals' },
  { key: 'conflux', label: 'Conflux' },
  { key: 'custom', label: 'Custom' },
];
const isConfluxTab = (src) => src === 'conflux';

// Sidebar "browse by" modes: 'all' is the card/list view; the rest are the
// book-appendix style grouped indexes (app/monsters/groupMonsters.js).
// "By Conflux Group" is offered only on the Conflux tabs (groupingKeysFor).
const BROWSE_MODES = ['all', ...GROUPING_KEYS];
const sectionAnchorId = (section) => groupAnchorId('conflux-section', section);

// The sidebar's jump list: one row per group — except the Conflux index (700+
// families), which jumps by catalog section instead.
const jumpTargets = (mode, groups) => {
  if (mode !== 'conflux') return groups.map(g => ({ key: g.key, label: g.heading, count: g.monsters.length, anchor: groupAnchorId(mode, g.key) }));
  const sections = new Map();
  for (const g of groups) {
    if (!sections.has(g.section)) sections.set(g.section, { key: g.section, label: g.section, count: 0, anchor: sectionAnchorId(g.section) });
    sections.get(g.section).count += g.monsters.length;
  }
  return [...sections.values()];
};

const scrollToGroup = (id) => {
  document.getElementById(id)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
};

const BrowseSidebar = ({ modes, browseBy, onChange, groups }) => (
  <aside className="lg:w-56 shrink-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto rounded-xl border border-stone-700/60 bg-stone-900/60" aria-label="Browse monsters">
    <nav className="py-1">
      {modes.map(mode => {
        const active = browseBy === mode;
        const label = mode === 'all' ? 'All Monsters' : GROUPINGS[mode].label;
        return (
          <div key={mode}>
            <button onClick={() => onChange(mode)} aria-pressed={active}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left border-l-4 ${active ? 'border-amber-600 bg-amber-900/30 text-amber-200 font-semibold' : 'border-transparent text-stone-300 hover:bg-stone-800/70'}`}>
              <span>{label}</span>
              {mode !== 'all' && <Icons.ChevronDown className={`w-4 h-4 transition-transform ${active ? '' : '-rotate-90'}`} />}
            </button>
            {active && mode !== 'all' && groups.length > 0 && (
              <ul className="pb-1 bg-stone-950/30">
                {jumpTargets(mode, groups).map(j => (
                  <li key={j.key}>
                    <button onClick={() => scrollToGroup(j.anchor)}
                      className="w-full flex items-center justify-between gap-2 pl-7 pr-3 py-1 text-xs text-left text-stone-400 hover:text-amber-200 hover:bg-stone-800/50">
                      <span className="truncate">{j.label}</span>
                      <span className="text-stone-600">{j.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  </aside>
);

// One heading per group, names in newspaper columns (top-to-bottom, then
// across) like the book's appendix lists.
// Groups that carry a `section` (the Conflux index) get a section heading
// whenever the section changes, a CR range, and a link to the group's
// Homebrewery doc (Conflux's own lore + stat block page for the family).
const GroupedIndex = ({ browseBy, groups, readOnly, latestVersion }) => (
  <div className="space-y-6">
    {groups.map((g, i) => (
      <Fragment key={g.key}>
      {g.section && g.section !== groups[i - 1]?.section && (
        <h2 id={sectionAnchorId(g.section)} data-testid="monster-group-section" className="scroll-mt-20 pt-2 text-2xl font-bold text-amber-200 border-b-2 border-amber-700 pb-1">{g.section}</h2>
      )}
      <section data-testid="monster-group" aria-labelledby={groupAnchorId(browseBy, g.key)}>
        <h3 id={groupAnchorId(browseBy, g.key)} className="scroll-mt-20 flex flex-wrap items-baseline gap-x-2 border-b border-amber-800/60 pb-1 mb-2 text-lg font-semibold text-amber-300">
          {g.heading}<span className="text-xs font-normal text-stone-500">{g.monsters.length}</span>
          {g.crRange && <span className="text-xs font-normal text-stone-400">CR {g.crRange}</span>}
          {g.url && (
            <a href={g.url} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs font-normal text-sky-400 hover:text-amber-200 hover:underline"
              title="Conflux's page for this group — lore, tactics and every stat block">Homebrewery ↗</a>
          )}
        </h3>
        <ul className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
          {g.monsters.map(t => (
            <li key={t.id} className="break-inside-avoid py-0.5">
              <Link href={detailHref(t)} data-testid="group-entry" className="text-sky-300 hover:text-amber-200 hover:underline">{t.name}</Link>
              {/* CR + badge wrap as one unit — never "CR" on one line and "20" on the next */}
              <span className="whitespace-nowrap">
                {browseBy !== 'cr' && t.cr != null && t.cr !== '' && <span className="ml-1.5 text-[11px] text-stone-500">CR {t.cr}</span>}
                {readOnly && <span className="ml-1.5"><ChangeBadge t={t} version={latestVersion} /></span>}
              </span>
            </li>
          ))}
        </ul>
      </section>
      </Fragment>
    ))}
  </div>
);

// "New" / "Updated" chip for a creature that changed in the latest release.
const ChangeBadge = ({ t, version }) => {
  const change = confluxChange(t, version);
  if (!change) return null;
  return change === 'new'
    ? <span className="text-xs text-emerald-300 bg-emerald-900/40 px-1.5 py-0.5 rounded" title={`New in Conflux ${version}`}>New</span>
    : <span className="text-xs text-amber-300 bg-amber-900/40 px-1.5 py-0.5 rounded" title={t.confluxRenamedFrom ? `Updated in Conflux ${version} (was ${t.confluxRenamedFrom})` : `Updated in Conflux ${version}`}>Updated</span>;
};

// Edit / delete controls shared by both layouts. Conflux entries are read-only.
const RowActions = ({ t, readOnly, confirming, onAskDelete, onCancelDelete, onDelete }) => {
  if (readOnly) return null;
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Link href={detailHref(t, true)} aria-label={`Edit ${t.name}`} className="p-2 rounded bg-stone-700/50 hover:bg-stone-600/50"><Icons.Edit /></Link>
      {confirming ? (
        <>
          <button onClick={onCancelDelete} className="px-2 py-1 rounded bg-stone-700 text-xs">Cancel</button>
          <button onClick={onDelete} className="px-2 py-1 rounded bg-red-700 text-xs">Delete</button>
        </>
      ) : (
        <button onClick={onAskDelete} aria-label={`Delete ${t.name}`} className="p-2 rounded bg-red-900/30 hover:bg-red-800/50 text-red-400"><Icons.Trash /></button>
      )}
    </div>
  );
};

/**
 * The monster library list: search + filters, one card (default) or row per
 * template — the List/Cards toggle is remembered per browser. Cards show only
 * type, CR and book; the list rows add AC / HP / speed. An entry
 * opens the monster's own page (/monsters/[id]), which owns viewing and
 * editing; this list only browses and deletes. Creating (New Monster /
 * Import from Image) lives in the page header (app/monsters/page.jsx).
 */
const TemplateEditor = ({ templates, onDelete }) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [viewMode, setViewMode] = useState(readSavedView);
  const changeView = (mode) => {
    setViewMode(mode);
    try { localStorage.setItem(VIEW_STORAGE_KEY, mode); } catch { /* storage unavailable — choice just won't persist */ }
  };
  // Filters start from the per-tab saved copy. TemplateEditor only mounts
  // after the client-side templates fetch, so reading sessionStorage in the
  // initializers can't cause a hydration mismatch.
  const [saved] = useState(readSavedFilters);
  // A saved 'latest' (the old Latest Conflux tab) restores as Conflux + the Latest filter.
  const [sourceFilter, setSourceFilter] = useState(saved.sourceFilter === 'latest' ? 'conflux' : SOURCE_TABS.some(s => s.key === saved.sourceFilter) ? saved.sourceFilter : 'default');
  const [latestOnly, setLatestOnly] = useState(saved.sourceFilter === 'latest' || saved.latestOnly === true);
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
  const [browseBy, setBrowseBy] = useState(BROWSE_MODES.includes(saved.browseBy) ? saved.browseBy : 'all');

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
    if (isConfluxTab(src)) loadConflux();
  };

  // A restored Conflux filter needs its data fetched.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot fetch kick-off on mount
    if (isConfluxTab(sourceFilter)) loadConflux();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({ searchQuery, sourceFilter, latestOnly, crMin, crMax, selectedSizes, selectedCreatureTypes, selectedBooks, selectedHabitats, browseBy }));
    } catch { /* storage unavailable — filters just won't persist */ }
  }, [searchQuery, sourceFilter, latestOnly, crMin, crMax, selectedSizes, selectedCreatureTypes, selectedBooks, selectedHabitats, browseBy]);

  // Get the active template list based on source filter
  const latestVersion = useMemo(() => latestConfluxVersion(confluxTemplates), [confluxTemplates]);
  const latestTemplates = useMemo(() => {
    const order = { new: 0, updated: 1 };
    return confluxTemplates
      .filter(t => confluxChange(t, latestVersion))
      .sort((a, b) => order[confluxChange(a, latestVersion)] - order[confluxChange(b, latestVersion)]);
  }, [confluxTemplates, latestVersion]);
  const readOnly = isConfluxTab(sourceFilter);
  // The tab's own list — the Book / Habitat / type filters offer only what it holds.
  const activeTemplates = useMemo(() => {
    if (sourceFilter === 'conflux') return latestOnly ? latestTemplates : confluxTemplates;
    const section = sourceFilter === 'default' ? 'official' : sourceFilter;
    return (templates || []).filter(t => librarySection(t) === section);
  }, [sourceFilter, latestOnly, confluxTemplates, latestTemplates, templates]);

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
  // A book picked on another tab doesn't apply here (its dropdown may be hidden).
  const activeBooks = useMemo(() => selectedBooks.filter(b => availableBooks.includes(b)), [selectedBooks, availableBooks]);

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
      if (activeBooks.length > 0 && !activeBooks.includes(bookLabel(t) || NO_BOOK)) return false;

      // Habitat filter — matches a monster listed under ANY selected habitat
      if (selectedHabitats.length > 0 && !habitatsOf(t).some(h => selectedHabitats.includes(h))) return false;

      return true;
    });
  }, [activeTemplates, searchQuery, crMin, crMax, selectedSizes, selectedCreatureTypes, activeBooks, selectedHabitats]);

  // The saved choice survives a trip to a tab that doesn't offer it (the
  // Conflux grouping elsewhere) — it just shows All Monsters meanwhile.
  const browseModes = useMemo(() => ['all', ...groupingKeysFor(readOnly, { singleBook: sourceFilter === 'fm' })], [readOnly, sourceFilter]);
  const activeBrowse = browseModes.includes(browseBy) ? browseBy : 'all';
  const groups = useMemo(() => (activeBrowse === 'all' ? [] : groupMonsters(filtered, activeBrowse)), [filtered, activeBrowse]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setCrMin(null);
    setCrMax(null);
    setSelectedSizes([]);
    setSelectedCreatureTypes([]);
    setSelectedBooks([]);
    setSelectedHabitats([]);
    setLatestOnly(false);
    setSourceFilter('default');
  };

  const hasFilters = searchQuery || crMin !== null || crMax !== null || selectedSizes.length > 0 || selectedCreatureTypes.length > 0 || activeBooks.length > 0 || selectedHabitats.length > 0 || latestOnly || sourceFilter !== 'default';

  return (
    <div className="flex flex-col lg:flex-row gap-4">
    <BrowseSidebar modes={browseModes} browseBy={activeBrowse} onChange={setBrowseBy} groups={groups} />
    <div className="flex-1 min-w-0 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search monsters by name..."
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
          {SOURCE_TABS.map(s => (
            <button key={s.key} onClick={() => handleSourceChange(s.key)}
              className={`px-3 py-1.5 rounded-lg text-sm ${sourceFilter === s.key ? 'bg-amber-700' : 'bg-stone-700 hover:bg-stone-600'}`}>
              {s.label}{isConfluxTab(s.key) && confluxLoading ? '...' : ''}
            </button>
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

        {/* Conflux: only the newest release's new + updated creatures */}
        {readOnly && (
          <button onClick={() => setLatestOnly(v => !v)} aria-pressed={latestOnly}
            title={latestVersion ? `Only creatures new or updated in Conflux ${latestVersion}` : 'No release changes recorded yet'}
            className={`px-3 py-1.5 rounded-lg text-sm ${latestOnly ? 'bg-emerald-800 text-emerald-100' : 'bg-stone-700 hover:bg-stone-600'}`}>
            Latest{latestVersion ? ` (${latestVersion})` : ''}
          </button>
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
          {activeBooks.map(b => (
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

      {readOnly && latestOnly && confluxLoaded && (
        <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-3 py-2 text-sm text-stone-300">
          {latestVersion ? (
            <>
              <span className="font-semibold text-emerald-300">Conflux {latestVersion}</span>
              {' — '}{latestTemplates.filter(t => confluxChange(t, latestVersion) === 'new').length} new,{' '}
              {latestTemplates.filter(t => confluxChange(t, latestVersion) === 'updated').length} updated
            </>
          ) : 'No release changes recorded yet — run scripts/convert-conflux.mjs on a new Conflux export.'}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-stone-500">
          {filtered.length} monster{filtered.length !== 1 ? 's' : ''}
          {filtered.length !== activeTemplates.length && ` (filtered from ${activeTemplates.length})`}
        </div>
        {activeBrowse === 'all' && <div className="flex rounded-lg bg-stone-800 p-0.5" role="group" aria-label="Layout">
          {[
            { key: 'cards', label: 'Card view', Icon: Icons.ViewGrid },
            { key: 'list', label: 'List view', Icon: Icons.ViewList },
          ].map(({ key, label, Icon }) => (
            <button key={key} onClick={() => changeView(key)} aria-label={label} aria-pressed={viewMode === key} title={label}
              className={`p-1.5 rounded-md ${viewMode === key ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>
              <Icon />
            </button>
          ))}
        </div>}
      </div>

      {activeBrowse !== 'all' ? (
        <GroupedIndex browseBy={activeBrowse} groups={groups} readOnly={readOnly} latestVersion={latestVersion} />
      ) : viewMode === 'cards' ? (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((t) => {
            const book = bookLabel(t);
            const type = typeLine(t);
            return (
              <div key={t.id} data-testid="template-row" className="group flex flex-col rounded-xl border bg-stone-800/40 border-stone-700/60 hover:border-amber-700/70 transition-colors">
                <Link href={detailHref(t)} className="flex flex-1 items-start gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold leading-snug line-clamp-2 group-hover:text-amber-200">{t.name}</div>
                    {type && <div className="text-xs italic text-stone-400 truncate mt-0.5">{type}</div>}
                  </div>
                  <div className="shrink-0 text-center rounded-lg bg-stone-900/60 border border-stone-700/60 px-2 py-1 min-w-[2.75rem]" title="Challenge rating">
                    <div className="text-[9px] uppercase tracking-wider text-stone-500 leading-none">CR</div>
                    <div className="text-sm font-bold text-amber-300 leading-tight">{crLabel(String(t.cr ?? '—'))}</div>
                  </div>
                </Link>
                <div className="flex items-center gap-2 border-t border-stone-800/80 px-3 py-2 min-h-[2.75rem]">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                    {book && <span className="text-xs text-sky-300 bg-sky-900/30 px-1.5 py-0.5 rounded" title="Source book">{book}</span>}
                    {t.legendaryActions?.length > 0 && <span className="text-xs text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded">Legendary</span>}
                    {readOnly && <ChangeBadge t={t} version={latestVersion} />}
                  </div>
                  <RowActions t={t} readOnly={readOnly} confirming={deleteConfirmId === t.id}
                    onAskDelete={() => setDeleteConfirmId(t.id)} onCancelDelete={() => setDeleteConfirmId(null)}
                    onDelete={() => { onDelete(t.id); setDeleteConfirmId(null); }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} data-testid="template-row" className="group flex items-center gap-2 rounded-lg border pr-3 bg-stone-800/40 border-stone-700/60 hover:border-amber-700/70 transition-colors">
              <Link href={detailHref(t)} className="flex flex-1 min-w-0 items-center gap-3 p-3">
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
                {readOnly && <ChangeBadge t={t} version={latestVersion} />}
                <RowActions t={t} readOnly={readOnly} confirming={deleteConfirmId === t.id}
                  onAskDelete={() => setDeleteConfirmId(t.id)} onCancelDelete={() => setDeleteConfirmId(null)}
                  onDelete={() => { onDelete(t.id); setDeleteConfirmId(null); }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
};

export default TemplateEditor;
