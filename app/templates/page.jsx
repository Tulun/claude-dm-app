'use client';

import { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import Navbar from '../components/Navbar';
import { defaultEnemyTemplates } from '../components/defaultData';
import TemplateEditor from '../combat/components/TemplateEditor';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    fetch('/api/templates').then(r => r.ok ? r.json() : null).then(data => {
      setTemplates(data && Array.isArray(data) && data.length > 0 ? data : defaultEnemyTemplates);
    }).catch(() => setTemplates(defaultEnemyTemplates));
  }, []);

  useEffect(() => {
    if (!templates) return;
    const timeout = setTimeout(() => {
      fetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(templates) })
        .then(() => { setSaveStatus('Saved'); setTimeout(() => setSaveStatus(''), 2000); })
        .catch(console.error);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [templates]);

  const reloadTemplates = async () => {
    const res = await fetch('/api/templates');
    if (res.ok) {
      const data = await res.json();
      setTemplates(data && Array.isArray(data) ? data : defaultEnemyTemplates);
      setSaveStatus('Reloaded');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      <Navbar />
      <main className="relative max-w-4xl mx-auto p-4">
        <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2"><Icons.Book /> Enemy & NPC Templates</h2>
            <button onClick={reloadTemplates} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-stone-700/50 hover:bg-stone-600/50 text-sm"><Icons.Refresh />Reload</button>
          </div>
          {!templates ? (
            <div className="text-center py-8 text-stone-500 animate-pulse">Loading templates...</div>
          ) : (
            <TemplateEditor 
              templates={templates} 
              onUpdate={(u) => setTemplates(prev => prev.map(t => t.id === u.id ? u : t))} 
              onDelete={(id) => setTemplates(prev => prev.filter(t => t.id !== id))} 
              onCreate={(t) => setTemplates(prev => [...prev, t])} 
              onImport={(t) => setTemplates(prev => [...prev, t])} 
            />
          )}
        </div>
        {saveStatus && <div className="fixed bottom-4 right-4 bg-emerald-900/90 text-emerald-200 px-4 py-2 rounded-lg text-sm animate-pulse">{saveStatus}</div>}
      </main>
    </div>
  );
}
