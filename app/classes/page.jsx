'use client';

import { useState, useRef, useEffect } from 'react';
import Icons from '../components/Icons';
import Navbar from '../components/Navbar';
import { CLASS_DATA } from './classData';

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
        className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all duration-200 ${
          isSelected ? 'shadow-lg' : 'group-hover:shadow-md'
        }`}
        style={{
          background: isSelected
            ? `linear-gradient(135deg, ${classInfo.color}, ${classInfo.color}CC)`
            : `${classInfo.color}30`,
          boxShadow: isSelected ? `0 4px 20px ${classInfo.color}40` : 'none',
        }}
      >
        {classInfo.emoji}
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
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="border-b border-stone-700/30 last:border-0 cursor-pointer group"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3 py-2.5 px-1">
        <span
          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
          style={{ background: `${color}25`, color: color }}
        >
          L{feature.level}
        </span>
        <span className="font-medium text-sm text-stone-200 flex-1">{feature.name}</span>
        <Icons.ChevronDown
          className={`w-3 h-3 text-stone-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </div>
      {expanded && (
        <div className="pb-3 pl-12 pr-4 text-xs text-stone-400 leading-relaxed">
          {feature.desc}
        </div>
      )}
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

function ClassView({ classInfo }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedSubclass, setExpandedSubclass] = useState(null);

  return (
    <div className="animate-fadeIn">
      {/* Class Header */}
      <div className="relative overflow-hidden rounded-2xl mb-6" style={{ background: `linear-gradient(135deg, ${classInfo.color}15, ${classInfo.color}05)` }}>
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 80% 20%, ${classInfo.color}, transparent 60%)`,
          }}
        />
        <div className="relative p-6">
          <div className="flex items-start gap-5">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-xl shrink-0"
              style={{
                background: `linear-gradient(135deg, ${classInfo.color}, ${classInfo.color}BB)`,
                boxShadow: `0 8px 32px ${classInfo.color}30`,
              }}
            >
              {classInfo.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-extrabold text-stone-100">{classInfo.name}</h2>
              <p className="text-sm mt-1 italic" style={{ color: `${classInfo.color}CC` }}>
                {classInfo.tagline}
              </p>
              <p className="text-sm text-stone-400 mt-3 leading-relaxed">{classInfo.description}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-5">
            <StatBadge label="Hit Die" value={classInfo.hitDie} color="red" />
            <StatBadge label="Primary Ability" value={classInfo.primaryAbility} color="amber" />
            <StatBadge label="Saving Throws" value={classInfo.savingThrows.join(', ')} color="blue" />
            <StatBadge label="Armor" value={classInfo.armorProf} color="green" />
            <StatBadge label="Weapons" value={classInfo.weaponProf} color="purple" />
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-5 border-b border-stone-700/50 pb-2">
        {[
          { key: 'overview', label: 'Class Features' },
          { key: 'subclasses', label: `Subclasses (${classInfo.subclasses.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeSection === tab.key
                ? 'text-stone-100 border-b-2'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            style={{
              borderColor: activeSection === tab.key ? classInfo.color : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      {activeSection === 'overview' && (
        <div className="bg-stone-800/30 border border-stone-700/30 rounded-xl p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-3">
            Core Class Features
          </h3>
          <div>
            {classInfo.keyFeatures.map((feature, i) => (
              <FeatureItem key={i} feature={feature} color={classInfo.color} />
            ))}
          </div>
        </div>
      )}

      {activeSection === 'subclasses' && (
        <div className="space-y-3">
          {classInfo.subclasses.map((subclass, i) => (
            <SubclassCard
              key={i}
              subclass={subclass}
              color={classInfo.color}
              isExpanded={expandedSubclass === i}
              onToggle={() => setExpandedSubclass(expandedSubclass === i ? null : i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────

export default function ClassesPage() {
  const [selectedClass, setSelectedClass] = useState(CLASS_DATA[0].id);
  const contentRef = useRef(null);

  const classInfo = CLASS_DATA.find(c => c.id === selectedClass);

  const handleClassSelect = (classId) => {
    setSelectedClass(classId);
    // Scroll content to top on class change
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      <Navbar />

      <div className="max-w-7xl mx-auto p-4">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-amber-400 flex items-center gap-3">
            <Icons.BookOpen className="w-8 h-8" />
            Class Guide
          </h1>
          <p className="text-stone-400">5th Edition class and subclass reference</p>
        </div>

        {/* Class Selector */}
        <div className="mb-6 bg-stone-800/30 border border-stone-700/30 rounded-2xl p-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 justify-center flex-wrap">
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

        {/* Class Detail */}
        <div ref={contentRef}>
          {classInfo && <ClassView key={classInfo.id} classInfo={classInfo} />}
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
