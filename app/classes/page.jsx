'use client';

import { useState, useRef, useEffect } from 'react';
import Icons from '../components/Icons';
import Navbar from '../components/Navbar';
import { CLASS_DATA } from './classData';
import { CLASS_DETAILS, PROF_BONUS } from './classDetails';
import ClassIcons from './ClassIcons';

// ─── Class Icon Component ────────────────────────────────────────

function ClassIcon({ classInfo, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 ${
        isSelected
          ? 'scale-105'
          : 'hover:scale-105 opacity-70 hover:opacity-100'
      }`}
      style={{
        background: isSelected ? `${classInfo.color}20` : 'transparent',
        border: isSelected ? `2px solid ${classInfo.color}` : '2px solid transparent',
      }}
    >
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 ${
          isSelected ? 'shadow-lg' : 'group-hover:shadow-md'
        }`}
        style={{
          background: isSelected
            ? `linear-gradient(135deg, ${classInfo.color}, ${classInfo.color}CC)`
            : `${classInfo.color}30`,
          boxShadow: isSelected ? `0 4px 20px ${classInfo.color}40` : 'none',
        }}
      >
        {ClassIcons[classInfo.id]
          ? ClassIcons[classInfo.id]({ size: 36, color: isSelected ? '#fff' : classInfo.color })
          : <span className="text-2xl">{classInfo.emoji}</span>
        }
      </div>
      <span
        className={`text-xs font-semibold tracking-wide transition-colors ${
          isSelected ? 'text-stone-100' : 'text-stone-400 group-hover:text-stone-200'
        }`}
      >
        {classInfo.name}
      </span>
    </button>
  );
}

// ─── Stat Badge ──────────────────────────────────────────────────

function StatBadge({ label, value, color = 'amber' }) {
  const colorMap = {
    amber: 'bg-amber-900/40 text-amber-300 border-amber-700/30',
    red: 'bg-red-900/40 text-red-300 border-red-700/30',
    blue: 'bg-blue-900/40 text-blue-300 border-blue-700/30',
    green: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/30',
    purple: 'bg-purple-900/40 text-purple-300 border-purple-700/30',
  };
  return (
    <div className={`px-3 py-2 rounded-lg border ${colorMap[color]}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-60 font-medium">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

// ─── Feature List ────────────────────────────────────────────────

function FeatureItem({ feature, color }) {
  return (
    <div className="border-b border-stone-700/30 last:border-0">
      <div className="flex items-start gap-3 py-2.5 px-1">
        <span
          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
          style={{ background: `${color}25`, color: color }}
        >
          L{feature.level}
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm text-stone-200">{feature.name}</span>
          <p className="text-xs text-stone-400 leading-relaxed mt-0.5">{feature.desc}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Subclass Card ───────────────────────────────────────────────

function SubclassCard({ subclass, color, isExpanded, onToggle }) {
  return (
    <div
      className="rounded-xl border overflow-hidden transition-all duration-200"
      style={{
        borderColor: isExpanded ? `${color}60` : 'rgba(120,113,108,0.3)',
        background: isExpanded ? `${color}08` : 'rgba(28,25,23,0.3)',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-800/30 transition-colors"
      >
        <div>
          <h4 className="font-bold text-stone-100">{subclass.name}</h4>
          <p className="text-xs text-stone-400 mt-0.5 italic">{subclass.tagline}</p>
        </div>
        <Icons.ChevronDown
          className={`w-4 h-4 text-stone-400 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: `${color}20` }}>
          <p className="text-sm text-stone-400 mt-3 mb-4 leading-relaxed">{subclass.description}</p>
          <div className="space-y-0.5">
            {subclass.features.map((feature, i) => (
              <FeatureItem key={i} feature={feature} color={color} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Class View ─────────────────────────────────────────────

function ClassView({ classInfo, selectedSubclass, onSelectSubclass, scrollContainer }) {
  const activeSubclass = selectedSubclass !== null ? classInfo.subclasses[selectedSubclass] : null;
  const details = CLASS_DETAILS[classInfo.id];

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el && scrollContainer?.current) {
      const containerTop = scrollContainer.current.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      scrollContainer.current.scrollBy({ top: elTop - containerTop - 8, behavior: 'smooth' });
    }
  };

  // Build sidebar items based on current view
  const sidebarItems = [];
  if (!activeSubclass) {
    sidebarItems.push({ id: 'section-overview', label: classInfo.name });
    if (details) sidebarItems.push({ id: 'section-traits', label: 'Core Traits' });
    sidebarItems.push({ id: 'section-features', label: 'Class Features' });
    // Add individual features as sub-items
    classInfo.keyFeatures.forEach((f) => {
      sidebarItems.push({ id: `feature-${f.level}-${f.name.replace(/\s+/g, '-').toLowerCase()}`, label: `Level ${f.level}: ${f.name}`, indent: true });
    });
    if (details?.levelTable) sidebarItems.push({ id: 'section-levels', label: 'Level Table' });
    if (details?.multiclass) sidebarItems.push({ id: 'section-multiclass', label: 'Multiclassing' });
    // Subclasses section
    sidebarItems.push({ id: 'section-subclasses-nav', label: `${classInfo.name} Subclasses`, header: true });
    classInfo.subclasses.forEach((sub, i) => {
      sidebarItems.push({ id: `subclass-${i}`, label: sub.name, action: () => onSelectSubclass(i) });
    });
  } else {
    sidebarItems.push({ id: 'section-overview', label: activeSubclass.name });
    sidebarItems.push({ id: 'section-features', label: 'Subclass Features' });
    activeSubclass.features.forEach((f) => {
      sidebarItems.push({ id: `feature-${f.level}-${f.name.replace(/\s+/g, '-').toLowerCase()}`, label: `Level ${f.level}: ${f.name}`, indent: true });
    });
    sidebarItems.push({ id: 'back-to-class', label: `← Back to ${classInfo.name}`, action: () => onSelectSubclass(null) });
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-56 shrink-0 hidden lg:block">
        <div className="sticky top-0 space-y-0.5 text-xs max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
          {sidebarItems.map((item, i) => {
            if (item.header) {
              return (
                <div key={i} className="pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-stone-500 border-t border-stone-700/30 mt-2">
                  {item.label}
                </div>
              );
            }
            return (
              <button
                key={i}
                onClick={() => item.action ? item.action() : scrollTo(item.id)}
                className={`w-full text-left px-2 py-1.5 rounded transition-colors ${
                  item.indent
                    ? 'pl-5 text-stone-500 hover:text-stone-300 hover:bg-stone-800/30'
                    : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/50 font-medium'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 animate-fadeIn space-y-6">
        {/* Class Header */}
        <div id="section-overview" className="relative overflow-hidden rounded-2xl" style={{ background: `linear-gradient(135deg, ${classInfo.color}15, ${classInfo.color}05)` }}>
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 80% 20%, ${classInfo.color}, transparent 60%)`,
            }}
          />
          <div className="relative p-6">
            <div className="flex items-start gap-5">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${classInfo.color}, ${classInfo.color}BB)`,
                  boxShadow: `0 8px 32px ${classInfo.color}30`,
                }}
              >
                {ClassIcons[classInfo.id]
                  ? ClassIcons[classInfo.id]({ size: 52, color: '#fff' })
                  : <span className="text-4xl">{classInfo.emoji}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-3xl font-extrabold text-stone-100">
                  {activeSubclass ? activeSubclass.name : classInfo.name}
                </h2>
                <p className="text-sm mt-1 italic" style={{ color: `${classInfo.color}CC` }}>
                  {activeSubclass ? activeSubclass.tagline : classInfo.tagline}
                </p>
                <p className="text-sm text-stone-400 mt-3 leading-relaxed">
                  {activeSubclass ? activeSubclass.description : classInfo.description}
                </p>
              </div>
            </div>

            {!activeSubclass && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-5">
                <StatBadge label="Hit Die" value={classInfo.hitDie} color="red" />
                <StatBadge label="Primary Ability" value={classInfo.primaryAbility} color="amber" />
                <StatBadge label="Saving Throws" value={classInfo.savingThrows.join(', ')} color="blue" />
                <StatBadge label="Armor" value={classInfo.armorProf} color="green" />
                <StatBadge label="Weapons" value={classInfo.weaponProf} color="purple" />
              </div>
            )}
          </div>
        </div>

        {/* Core Traits Table */}
        {!activeSubclass && details && (
          <div id="section-traits" className="bg-stone-800/30 border border-stone-700/30 rounded-xl overflow-hidden">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400 px-4 pt-4 pb-2">
              Core {classInfo.name} Traits
            </h3>
            <div className="divide-y divide-stone-700/30">
              {[
                { label: 'Primary Ability', value: classInfo.primaryAbility },
                { label: 'Hit Point Die', value: `${classInfo.hitDie} per ${classInfo.name} level` },
                { label: 'Saving Throws', value: classInfo.savingThrows.join(' and ') },
                { label: 'Skill Proficiencies', value: details.skillChoices },
                { label: 'Weapon Proficiencies', value: classInfo.weaponProf },
                { label: 'Armor Training', value: classInfo.armorProf },
                { label: 'Starting Equipment', value: details.startingEquipment },
              ].map((row, i) => (
                <div key={i} className={`flex gap-4 px-4 py-2.5 ${i % 2 === 0 ? 'bg-stone-800/20' : ''}`}>
                  <span className="text-sm font-semibold text-stone-300 w-44 shrink-0">{row.label}</span>
                  <span className="text-sm text-stone-400 flex-1">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div id="section-features" className="bg-stone-800/30 border border-stone-700/30 rounded-xl p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-3">
            {activeSubclass ? `${activeSubclass.name} Features` : 'Core Class Features'}
          </h3>
          <div>
            {(activeSubclass ? activeSubclass.features : classInfo.keyFeatures).map((feature, i) => (
              <div key={i} id={`feature-${feature.level}-${feature.name.replace(/\s+/g, '-').toLowerCase()}`}>
                <FeatureItem feature={feature} color={classInfo.color} />
              </div>
            ))}
          </div>
        </div>

        {/* Level Progression Table */}
        {!activeSubclass && details && details.levelTable && (
          <div id="section-levels" className="bg-stone-800/30 border border-stone-700/30 rounded-xl overflow-hidden">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400 px-4 pt-4 pb-2">
              {classInfo.name} Features by Level
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-700/50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider w-14">Lvl</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider w-12">Prof</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Features</th>
                    {details.tableColumns.map((col, i) => (
                      <th key={i} className="px-3 py-2 text-center text-xs font-semibold text-stone-400 uppercase tracking-wider whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {details.levelTable.map((row, lvl) => (
                    <tr key={lvl} className={`border-b border-stone-700/20 ${lvl % 2 === 0 ? 'bg-stone-800/20' : ''}`}>
                      <td className="px-3 py-2 text-stone-300 font-mono text-center">{lvl + 1}</td>
                      <td className="px-3 py-2 text-stone-400 font-mono text-center">+{PROF_BONUS[lvl + 1]}</td>
                      <td className="px-3 py-2 text-stone-300">
                        {row.features === '—' ? <span className="text-stone-600">—</span> : row.features}
                      </td>
                      {row.cols.map((val, i) => (
                        <td key={i} className="px-3 py-2 text-center text-stone-400 font-mono">
                          {val === '—' ? <span className="text-stone-600">—</span> : val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Multiclass Info */}
        {!activeSubclass && details && details.multiclass && (
          <div id="section-multiclass" className="bg-stone-800/30 border border-stone-700/30 rounded-xl p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-3">
              Multiclassing
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold text-stone-300">Requirement: </span>
                <span className="text-stone-400">{details.multiclass.requirements}</span>
              </div>
              <div>
                <span className="font-semibold text-stone-300">You gain: </span>
                <span className="text-stone-400">{details.multiclass.gains}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────

export default function ClassesPage() {
  const [selectedClass, setSelectedClass] = useState(CLASS_DATA[0].id);
  const [selectedSubclass, setSelectedSubclass] = useState(null);
  const contentRef = useRef(null);

  const classInfo = CLASS_DATA.find(c => c.id === selectedClass);

  const handleClassSelect = (classId) => {
    setSelectedClass(classId);
    setSelectedSubclass(null);
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubclassSelect = (index) => {
    setSelectedSubclass(selectedSubclass === index ? null : index);
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100 overflow-hidden">
      <Navbar />

      <div className="max-w-7xl mx-auto w-full px-4 flex flex-col flex-1 min-h-0">
        {/* Page Header */}
        <div className="py-4 shrink-0">
          <h1 className="text-3xl font-bold text-amber-400 flex items-center gap-3">
            <Icons.BookOpen className="w-8 h-8" />
            Class Guide
          </h1>
          <p className="text-stone-400">5th Edition class and subclass reference</p>
        </div>

        {/* Class Selector — fixed, never scrolls */}
        <div className="shrink-0 bg-stone-800/30 border border-stone-700/30 rounded-2xl p-4 mb-2">
          <div className="flex items-center gap-1 overflow-x-auto py-1 justify-center flex-wrap">
            {CLASS_DATA.map(cls => (
              <ClassIcon
                key={cls.id}
                classInfo={cls}
                isSelected={selectedClass === cls.id}
                onClick={() => handleClassSelect(cls.id)}
              />
            ))}
          </div>
        </div>

        {/* Subclass Selector — also fixed */}
        {classInfo && (
          <div className="shrink-0 mb-4">
            <div className="flex items-center gap-2 overflow-x-auto py-1 justify-center flex-wrap">
              {/* Base class button */}
              <button
                onClick={() => { setSelectedSubclass(null); if (contentRef.current) contentRef.current.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedSubclass === null
                    ? 'text-white shadow-md'
                    : 'text-stone-400 hover:text-stone-200 bg-stone-800/30 hover:bg-stone-800/60'
                }`}
                style={selectedSubclass === null ? {
                  background: `linear-gradient(135deg, ${classInfo.color}CC, ${classInfo.color}90)`,
                  boxShadow: `0 2px 12px ${classInfo.color}30`,
                } : {}}
              >
                {classInfo.name}
              </button>

              <span className="text-stone-600 text-xs">|</span>

              {/* Subclass buttons */}
              {classInfo.subclasses.map((sub, i) => (
                <button
                  key={i}
                  onClick={() => handleSubclassSelect(i)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedSubclass === i
                      ? 'text-white shadow-md'
                      : 'text-stone-400 hover:text-stone-200 bg-stone-800/30 hover:bg-stone-800/60'
                  }`}
                  style={selectedSubclass === i ? {
                    background: `linear-gradient(135deg, ${classInfo.color}CC, ${classInfo.color}90)`,
                    boxShadow: `0 2px 12px ${classInfo.color}30`,
                  } : {}}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Class Detail — scrollable */}
        <div ref={contentRef} className="flex-1 overflow-y-auto min-h-0 pb-8">
          {classInfo && (
            <ClassView
              key={`${classInfo.id}-${selectedSubclass}`}
              classInfo={classInfo}
              selectedSubclass={selectedSubclass}
              onSelectSubclass={handleSubclassSelect}
              scrollContainer={contentRef}
            />
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
