'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icons from '../components/Icons';
import Navbar from '../components/Navbar';
import { defaultPartyData } from '../components/defaultData';
import { AddPartyModal } from '../combat/components/Modals';
import { getCalculatedAC } from '../utils/acCalculation';

export default function CharactersPage() {
  const [party, setParty] = useState(null);
  const [dmNpcs, setDmNpcs] = useState([]);
  const [showAddParty, setShowAddParty] = useState(false);
  const [showAddNpc, setShowAddNpc] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/party').then(r => r.ok ? r.json() : null),
      fetch('/api/dm-npcs').then(r => r.ok ? r.json() : []),
    ]).then(([partyData, npcsData]) => {
      setParty(partyData && Array.isArray(partyData) && partyData.length > 0 ? partyData : defaultPartyData);
      if (Array.isArray(npcsData)) setDmNpcs(npcsData);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!party) return;
    const timeout = setTimeout(() => {
      fetch('/api/party', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(party) }).catch(console.error);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [party]);

  useEffect(() => {
    if (dmNpcs.length === 0) return;
    const timeout = setTimeout(() => {
      fetch('/api/dm-npcs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dmNpcs) }).catch(console.error);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [dmNpcs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      <Navbar />
      <main className="relative max-w-4xl mx-auto p-4 space-y-6">
        {/* Party Members */}
        <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2"><Icons.Shield /> Party Members</h2>
            <button onClick={() => setShowAddParty(true)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-800/50 hover:bg-emerald-700/50 text-emerald-300 text-sm"><Icons.Plus />Add</button>
          </div>
          <p className="text-stone-400 text-sm mb-6">Click on a character to view and edit their full details.</p>
          {!party ? (
            <div className="text-center py-8 text-stone-500 animate-pulse">Loading party...</div>
          ) : party.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {party.map(member => (
                <div key={member.id} className={`p-4 rounded-lg border ${member.sourceNpcId || member.isDmNpc ? 'border-amber-800/30 bg-gradient-to-br from-amber-950/20 to-stone-900/60' : 'border-emerald-800/50 bg-gradient-to-br from-emerald-950/40 to-stone-900/60'}`}>
                  <Link href={`/character?id=${member.id}&type=party`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className={`p-2 rounded-lg ${member.sourceNpcId || member.isDmNpc ? 'bg-amber-900/50' : 'bg-emerald-900/50'}`}>
                      {member.sourceNpcId || member.isDmNpc ? <Icons.Crown /> : <Icons.Shield />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{member.name}</h3>
                      <p className="text-xs text-stone-400">{member.class || member.role || ''} {member.level || ''}</p>
                    </div>
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-1 text-stone-400"><Icons.Shield /> {getCalculatedAC(member)}</div>
                      <div className="flex items-center gap-1 text-stone-400"><Icons.Heart /> {member.currentHp}/{member.maxHp}</div>
                    </div>
                  </Link>
                  {(member.sourceNpcId || member.isDmNpc) && (
                    <div className="mt-2 pt-2 border-t border-stone-700/30">
                      <button onClick={() => { if (confirm(`Remove ${member.name} from party?`)) setParty(prev => prev.filter(p => p.id !== member.id)); }}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-900/30 hover:bg-red-800/30 text-red-400">Remove from Party</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">No party members yet.</div>
          )}
        </div>

        {/* DM NPCs */}
        <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2"><Icons.Crown /> DM NPCs</h2>
            <button onClick={() => setShowAddNpc(true)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-800/50 hover:bg-amber-700/50 text-amber-300 text-sm"><Icons.Plus />New NPC</button>
          </div>
          <p className="text-stone-400 text-sm mb-6">Character-like NPCs separate from the party. Click to edit, or add them to initiative.</p>
          {dmNpcs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dmNpcs.map(npc => (
                <div key={npc.id} className="p-4 rounded-lg border border-amber-800/30 bg-gradient-to-br from-amber-950/20 to-stone-900/60">
                  <Link href={`/character?id=${npc.id}&type=dm-npc`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="p-2 rounded-lg bg-amber-900/50"><Icons.Crown /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{npc.name}</h3>
                      <p className="text-xs text-stone-400">{npc.class || npc.role || 'NPC'} {npc.level || ''}</p>
                    </div>
                    <div className="text-right text-sm shrink-0">
                      <div className="flex items-center gap-1 text-stone-400"><Icons.Shield /> {getCalculatedAC(npc)}</div>
                      <div className="flex items-center gap-1 text-stone-400"><Icons.Heart /> {npc.currentHp || npc.maxHp || '?'}/{npc.maxHp || '?'}</div>
                    </div>
                  </Link>
                  <div className="flex gap-2 mt-3 pt-2 border-t border-stone-700/30">
                    <button onClick={() => { const copy = { ...npc, id: `npc-init-${Date.now()}`, initiative: 0, currentHp: npc.currentHp || npc.maxHp, sourceNpcId: npc.id }; setParty(prev => [...(prev || []), copy]); setSaveStatus('NPC added to party'); setTimeout(() => setSaveStatus(''), 2000); }}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-emerald-800/50 hover:bg-emerald-700/50 text-emerald-300"><Icons.Plus /> Add to Party</button>
                    <button onClick={() => { if (confirm(`Delete ${npc.name}?`)) setDmNpcs(prev => prev.filter(n => n.id !== npc.id)); }}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-900/30 hover:bg-red-800/30 text-red-400">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">No DM NPCs yet.</div>
          )}
        </div>

        {saveStatus && <div className="fixed bottom-4 right-4 bg-emerald-900/90 text-emerald-200 px-4 py-2 rounded-lg text-sm animate-pulse">{saveStatus}</div>}
      </main>

      <AddPartyModal isOpen={showAddParty} onClose={() => setShowAddParty(false)} onSave={(m) => { setParty(prev => [...(prev || []), m]); }} />

      {showAddNpc && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowAddNpc(false)}>
          <div className="bg-stone-900 border border-stone-700 rounded-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2"><Icons.Crown /> New DM NPC</h2>
            <form onSubmit={(e) => { e.preventDefault(); const f = e.target;
              const npc = { id: `dm-npc-${Date.now()}`, name: f.npcName.value, class: f.npcClass.value, level: parseInt(f.npcLevel.value) || 1, ac: parseInt(f.npcAC.value) || 10, maxHp: parseInt(f.npcHP.value) || 10, currentHp: parseInt(f.npcHP.value) || 10, initiative: 0, speed: parseInt(f.npcSpeed.value) || 30, str: parseInt(f.npcStr.value) || 10, dex: parseInt(f.npcDex.value) || 10, con: parseInt(f.npcCon.value) || 10, int: parseInt(f.npcInt.value) || 10, wis: parseInt(f.npcWis.value) || 10, cha: parseInt(f.npcCha.value) || 10, notes: f.npcNotes.value, isDmNpc: true, resources: [], inventory: [], spells: [], features: [], feats: [], skillProficiencies: {}, saveProficiencies: {} };
              setDmNpcs(prev => [...prev, npc]); setShowAddNpc(false);
            }} className="space-y-3">
              <div><label className="text-xs text-stone-400">Name *</label><input name="npcName" required className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-600" autoFocus /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-stone-400">Class / Role</label><input name="npcClass" className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-600" placeholder="Fighter" /></div>
                <div><label className="text-xs text-stone-400">Level</label><input name="npcLevel" type="number" defaultValue="1" min="1" max="20" className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-600" /></div>
                <div><label className="text-xs text-stone-400">Speed</label><input name="npcSpeed" type="number" defaultValue="30" className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-600" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-stone-400">AC</label><input name="npcAC" type="number" defaultValue="10" className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-600" /></div>
                <div><label className="text-xs text-stone-400">Max HP</label><input name="npcHP" type="number" defaultValue="10" className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-600" /></div>
              </div>
              <div><label className="text-xs text-stone-400">Ability Scores</label>
                <div className="grid grid-cols-6 gap-2 mt-1">
                  {['Str','Dex','Con','Int','Wis','Cha'].map(s => (<div key={s} className="text-center"><div className="text-[10px] text-stone-500 uppercase">{s}</div><input name={`npc${s}`} type="number" defaultValue="10" min="1" max="30" className="w-full bg-stone-800 border border-stone-700 rounded px-1 py-1 text-sm text-center focus:outline-none focus:border-amber-600" /></div>))}
                </div>
              </div>
              <div><label className="text-xs text-stone-400">Notes</label><textarea name="npcNotes" rows={2} className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-600 resize-none" placeholder="Personality, role, connections..." /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 rounded bg-amber-700 hover:bg-amber-600 text-sm font-medium">Create NPC</button>
                <button type="button" onClick={() => setShowAddNpc(false)} className="px-4 py-2 rounded bg-stone-700 hover:bg-stone-600 text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
