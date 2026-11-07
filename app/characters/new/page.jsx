'use client';

// /characters/new?type=party|dm-npc — full-page character-creation stepper.
// Creating appends the new character to /api/party or /api/dm-npcs and opens
// its sheet. The list is re-read right before the append so the POST never
// replaces data with a stale copy; if that read fails nothing is written.

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import CharacterCreator from '../components/CharacterCreator';

const ENDPOINTS = { party: '/api/party', 'dm-npc': '/api/dm-npcs' };

export default function NewCharacterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-950" />}>
      <NewCharacterContent />
    </Suspense>
  );
}

function NewCharacterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kind = searchParams.get('type') === 'dm-npc' ? 'dm-npc' : 'party';
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const create = async (character) => {
    setSaving(true);
    setError('');
    try {
      const endpoint = ENDPOINTS[kind];
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Could not load the current list (${res.status})`);
      const current = await res.json();
      const list = Array.isArray(current) ? current : [];
      const save = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([...list, character]),
      });
      if (!save.ok) throw new Error(`Save failed (${save.status})`);
      router.push(`/character?id=${encodeURIComponent(character.id)}&type=${kind}`);
    } catch (e) {
      setError(`${e.message} — nothing was saved.`);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      <Navbar />
      <main className="max-w-6xl mx-auto p-4">
        <CharacterCreator kind={kind} saving={saving} error={error}
          onCreate={create} onCancel={() => router.push('/characters')} />
      </main>
    </div>
  );
}
