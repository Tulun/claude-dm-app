'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Icons from '../components/Icons';
import Navbar from '../components/Navbar';
import { defaultPartyData } from '../components/defaultData';
import { getCalculatedAC } from '../utils/acCalculation';
import { generateId } from '../utils/generateId';
import { useToast } from '../hooks/useToast';
import { SAVE_ARM_DELAY_MS, SAVE_DEBOUNCE_MS } from '../utils/timings';

export default function CharactersPage() {
  const [party, setParty] = useState(null);
  const [dmNpcs, setDmNpcs] = useState([]);
  const [saveStatus, showToast] = useToast();
  // Saving stays disabled until the initial load settles, so loading data
  // never echoes an unchanged copy back to the API.
  const saveEnabled = useRef(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/party').then(r => r.ok ? r.json() : null),
      fetch('/api/dm-npcs').then(r => r.ok ? r.json() : []),
    ]).then(([partyData, npcsData]) => {
      setParty(partyData && Array.isArray(partyData) && partyData.length > 0 ? partyData : defaultPartyData);
      if (Array.isArray(npcsData)) setDmNpcs(npcsData);
    }).catch(console.error).finally(() => {
      setTimeout(() => { saveEnabled.current = true; }, SAVE_ARM_DELAY_MS);
    });
  }, []);

  useEffect(() => {
    if (!saveEnabled.current || !party) return;
    const timeout = setTimeout(() => {
      fetch('/api/party', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(party) }).catch(console.error);
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [party]);

  useEffect(() => {
    // Saves even when the list is empty — deleting the last NPC must persist
    if (!saveEnabled.current) return;
    const timeout = setTimeout(() => {
      fetch('/api/dm-npcs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dmNpcs) }).catch(console.error);
    }, SAVE_DEBOUNCE_MS);
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
            <Link href="/characters/new?type=party" className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-800/50 hover:bg-emerald-700/50 text-emerald-300 text-sm"><Icons.Plus />Add</Link>
          </div>
          <p className="text-stone-400 text-sm mb-6">Click on a character to view and edit their full details.</p>
          {!party ? (
            <div className="text-center py-8 text-stone-500 animate-pulse">Loading party...</div>
          ) : party.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {party.map(member => (
                <div key={member.id} className={`p-4 rounded-lg border relative ${member.sourceNpcId || member.isDmNpc ? 'border-amber-800/30 bg-gradient-to-br from-amber-950/20 to-stone-900/60' : 'border-emerald-800/50 bg-gradient-to-br from-emerald-950/40 to-stone-900/60'}`}>
                  {(member.sourceNpcId || member.isDmNpc) && (
                    <button onClick={() => { if (confirm(`Remove ${member.name} from party?`)) setParty(prev => prev.filter(p => p.id !== member.id)); }}
                      aria-label={`Remove ${member.name} from party`} className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-sm text-red-400/80 hover:text-red-300 hover:bg-red-900/40" title="Remove from party (the NPC is kept)">×</button>
                  )}
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
            <Link href="/characters/new?type=dm-npc" className="flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-800/50 hover:bg-amber-700/50 text-amber-300 text-sm"><Icons.Plus />New NPC</Link>
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
                    {/* An NPC in the party is a copy linked by sourceNpcId; removing
                        it drops only that copy — the NPC itself stays here. */}
                    {(party || []).some(p => p.sourceNpcId === npc.id) ? (
                      <button onClick={() => { if (confirm(`Remove ${npc.name} from the party? The NPC is kept.`)) { setParty(prev => prev.filter(p => p.sourceNpcId !== npc.id)); showToast('NPC removed from party'); } }}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-stone-700/50 hover:bg-stone-600/50 text-stone-300">Remove from Party</button>
                    ) : (
                      <button onClick={() => { const copy = { ...npc, id: generateId('npc-init'), initiative: 0, currentHp: npc.currentHp || npc.maxHp, sourceNpcId: npc.id }; setParty(prev => [...(prev || []), copy]); showToast('NPC added to party'); }}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-emerald-800/50 hover:bg-emerald-700/50 text-emerald-300"><Icons.Plus /> Add to Party</button>
                    )}
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
    </div>
  );
}
