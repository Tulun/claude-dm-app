'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Icons from '../components/Icons';
import {
  StatsBar,
  SavingThrows,
  SavingThrowsModal,
  Senses,
  SkillsList,
  ProficiencyModal,
  ClassEditor,
  ResourcesTab,
  InventoryTab,
  SpellsTab,
  FeaturesTab,
  BackgroundTab,
  NotesTab,
  CompanionsTab,
  formatClasses,
} from './components';

export default function CharacterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const type = searchParams.get('type');
  
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('resources');
  const [showProfModal, setShowProfModal] = useState(false);
  const [showSavesModal, setShowSavesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load character on mount
  useEffect(() => {
    const loadCharacter = async () => {
      if (!id || !type) { setLoading(false); return; }
      try {
        const endpoint = type === 'party' ? '/api/party' : '/api/templates';
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          const found = data.find(c => c.id === id);
          if (found) {
            // Initialize missing fields
            if (!found.skillProficiencies) found.skillProficiencies = {};
            if (!found.saveProficiencies) found.saveProficiencies = {};
            if (!found.features) found.features = [];
            if (!found.spells) found.spells = [];
            if (!found.inventory) found.inventory = [];
            if (!found.resources) found.resources = [];
            if (!found.advantages) found.advantages = [];
            setCharacter(found);
          }
        }
      } catch (err) { console.error('Error loading character:', err); }
      setLoading(false);
    };
    loadCharacter();
  }, [id, type]);

  // Update a single field
  const updateField = (field, value) => {
    setCharacter(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Save character to API
  const saveCharacter = async () => {
    if (!character) return;
    try {
      const endpoint = type === 'party' ? '/api/party' : '/api/templates';
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        const updated = data.map(c => c.id === character.id ? character : c);
        await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
        setSaveStatus('Saved!');
        setHasChanges(false);
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch (err) { console.error('Error saving:', err); setSaveStatus('Error'); }
  };

  // Delete character
  const deleteCharacter = async () => {
    if (!character) return;
    try {
      const endpoint = type === 'party' ? '/api/party' : '/api/templates';
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        const updated = data.filter(c => c.id !== character.id);
        await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
        router.push('/');
      }
    } catch (err) { console.error('Error deleting:', err); }
  };

  // Auto-save with debounce
  useEffect(() => {
    if (!hasChanges || !character) return;
    const timeout = setTimeout(saveCharacter, 1500);
    return () => clearTimeout(timeout);
  }, [character, hasChanges]);

  // Loading state
  if (loading) {
    return <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center">Loading...</div>;
  }

  // Not found state
  if (!character) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-stone-400 mb-4">Character not found</div>
          <button onClick={() => router.back()} className="px-4 py-2 bg-amber-700 rounded-lg">Back</button>
        </div>
      </div>
    );
  }

  const isParty = type === 'party';
  const tabs = ['resources', 'inventory', 'companions', 'spells', 'features', 'background', 'notes'];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Proficiency Modal (Skills only) */}
      {showProfModal && (
        <ProficiencyModal 
          character={character} 
          onUpdate={updateField} 
          onClose={() => setShowProfModal(false)} 
        />
      )}

      {/* Saving Throws Modal */}
      {showSavesModal && (
        <SavingThrowsModal 
          character={character} 
          onUpdate={updateField} 
          onClose={() => setShowSavesModal(false)} 
        />
      )}

      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-900 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1.5 rounded bg-stone-800 hover:bg-stone-700">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </button>
            <div className={`p-1.5 rounded ${isParty ? 'bg-emerald-900/50' : 'bg-red-900/50'}`}>
              {isParty ? <Icons.Shield /> : <Icons.Skull />}
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="text" 
                value={character.name || ''} 
                onChange={(e) => updateField('name', e.target.value)}
                className="bg-transparent text-lg font-bold focus:outline-none border-b border-transparent hover:border-stone-600 focus:border-amber-500" 
              />
              <ClassEditor character={character} onUpdate={updateField} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus && <span className="text-xs text-amber-400">{saveStatus}</span>}
            <button onClick={saveCharacter} className="px-3 py-1 bg-amber-700 hover:bg-amber-600 rounded text-sm">Save</button>
            <button onClick={() => setShowDeleteModal(true)} className="px-3 py-1 bg-red-900 hover:bg-red-800 rounded text-sm text-red-200">
              <Icons.Trash />
            </button>
          </div>
        </div>
      </header>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-stone-900 border border-red-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-900/50 rounded-full">
                <Icons.Trash />
              </div>
              <h2 className="text-xl font-bold text-red-400">Delete Character</h2>
            </div>
            <p className="text-stone-300 mb-2">
              Are you sure you want to delete <span className="font-bold text-white">{character.name}</span>?
            </p>
            <p className="text-stone-500 text-sm mb-6">
              This action cannot be undone. All character data will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={deleteCharacter} 
                className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm text-white font-medium"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1800px] mx-auto p-4 space-y-4">
        {/* Top Stats Bar */}
        <StatsBar character={character} isParty={isParty} onUpdate={updateField} />

        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Saves & Senses */}
          <div className="col-span-2 space-y-3">
            <SavingThrows character={character} onEditClick={() => setShowSavesModal(true)} />
            <Senses character={character} />
            
            {/* Advantages (if any) */}
            {(character.advantages || []).length > 0 && (
              <div className="bg-stone-900 rounded-lg overflow-hidden">
                <div className="p-2 border-b border-stone-700 text-center">
                  <span className="text-xs text-stone-500 uppercase tracking-wide">Advantages</span>
                </div>
                <div className="p-2 flex flex-wrap gap-1">
                  {character.advantages.map((adv, i) => (
                    <span key={i} className="bg-blue-900/40 text-blue-300 rounded px-2 py-0.5 text-xs">{adv}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Skills Column */}
          <div className="col-span-2">
            <SkillsList character={character} onEditClick={() => setShowProfModal(true)} />
          </div>

          {/* Main Content Area */}
          <div className="col-span-8">
            {/* Tab Navigation */}
            <div className="flex gap-1 mb-3 border-b border-stone-800 pb-2">
              {tabs.map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-t text-sm font-medium capitalize ${activeTab === tab ? 'bg-stone-800 text-amber-400' : 'text-stone-400 hover:text-stone-200'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-stone-900 rounded-lg p-4 min-h-[500px]">
              {activeTab === 'resources' && <ResourcesTab character={character} onUpdate={updateField} />}
              {activeTab === 'inventory' && <InventoryTab character={character} onUpdate={updateField} />}
              {activeTab === 'companions' && <CompanionsTab character={character} onUpdate={updateField} />}
              {activeTab === 'spells' && <SpellsTab character={character} onUpdate={updateField} />}
              {activeTab === 'features' && <FeaturesTab character={character} onUpdate={updateField} />}
              {activeTab === 'background' && <BackgroundTab character={character} onUpdate={updateField} />}
              {activeTab === 'notes' && <NotesTab character={character} onUpdate={updateField} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
