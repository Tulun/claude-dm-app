'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icons from '../components/Icons';
import Navbar from '../components/Navbar';
import { defaultEnemyTemplates } from '../components/defaultData';
import TemplateEditor from '../combat/components/TemplateEditor';
import ImportMonsterModal from '../combat/components/ImportMonsterModal';
import { useToast } from '../hooks/useToast';
import { TOAST_ERROR_DURATION_MS } from '../utils/timings';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState(null);
  const [saveStatus, showToast] = useToast();
  const [loadFailed, setLoadFailed] = useState(false);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    fetch('/api/templates').then(r => r.ok ? r.json() : null).then(data => {
      if (Array.isArray(data)) setTemplates(data.length > 0 ? data : defaultEnemyTemplates);
      else { setLoadFailed(true); setTemplates(defaultEnemyTemplates); }
    }).catch(() => { setLoadFailed(true); setTemplates(defaultEnemyTemplates); });
  }, []);

  // Explicit per-action saves (delete / import) — the library never
  // auto-saves, so loading it can't echo a POST back. While the load failed
  // (we're showing the built-in fallback list) nothing is saved, so the
  // fallback can't overwrite the user's real templates file.
  const persist = (update) => {
    const next = update(templates);
    setTemplates(next);
    if (loadFailed) { showToast('Library failed to load — not saved', TOAST_ERROR_DURATION_MS); return; }
    fetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) })
      .then(r => (r.ok ? showToast('Saved') : showToast('Save failed', TOAST_ERROR_DURATION_MS)))
      .catch(() => showToast('Save failed', TOAST_ERROR_DURATION_MS));
  };

  const reloadTemplates = async () => {
    const res = await fetch('/api/templates');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) { setTemplates(data); setLoadFailed(false); showToast('Reloaded'); }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      <Navbar />
      <main className="relative max-w-5xl mx-auto p-4">
        <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2 mr-auto"><Icons.Book /> Enemy & NPC Templates</h2>
            <button onClick={reloadTemplates} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-stone-700/50 hover:bg-stone-600/50 text-sm"><Icons.Refresh />Reload</button>
            {templates && (
              <>
                <button onClick={() => setShowImport(true)} className="px-3 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-sm flex items-center gap-1">
                  <Icons.Image /> Import from Image
                </button>
                <Link href="/templates/new" className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm flex items-center gap-1">
                  <Icons.Plus /> New Template
                </Link>
              </>
            )}
          </div>
          {!templates ? (
            <div className="text-center py-8 text-stone-500 animate-pulse">Loading templates...</div>
          ) : (
            <TemplateEditor
              templates={templates}
              onDelete={(id) => persist(prev => prev.filter(t => t.id !== id))}
            />
          )}
        </div>
        {templates && (
          <ImportMonsterModal
            isOpen={showImport}
            onClose={() => setShowImport(false)}
            templates={templates}
            onImport={(t) => { persist(prev => [...prev, t]); setShowImport(false); }}
            onUpdate={(u) => { persist(prev => prev.map(t => t.id === u.id ? u : t)); setShowImport(false); }}
          />
        )}
                {saveStatus && <div className="fixed bottom-4 right-4 bg-emerald-900/90 text-emerald-200 px-4 py-2 rounded-lg text-sm animate-pulse">{saveStatus}</div>}
      </main>
    </div>
  );
}
