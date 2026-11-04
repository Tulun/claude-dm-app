'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Icons from '../../components/Icons';
import { useToast } from '../../hooks/useToast';
import useNavbarBottom from '../../hooks/useNavbarBottom';
import { generateId } from '../../utils/generateId';
import { TOAST_ERROR_DURATION_MS } from '../../utils/timings';
import StatBlockView from '../components/StatBlockView';
import StatBlockForm from '../components/StatBlockForm';
import { BLANK_TEMPLATE, bookLabel, fromEditForm, isConfluxId, sameTemplate, sourceLabel, toEditForm } from '../statBlock';

const PAGE_BG = 'min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100';

export default function MonsterDetailPage() {
  return (
    <Suspense fallback={<div className={`${PAGE_BG} flex items-center justify-center text-stone-400 animate-pulse`}>Loading monster...</div>}>
      <MonsterDetail />
    </Suspense>
  );
}

/**
 * One monster template, full page: a formatted stat block, and an edit mode
 * (form + live preview side by side). Saves are explicit — Save / Delete /
 * Duplicate each POST the whole templates array (the route's contract) — so
 * there is no auto-save effect and nothing echoes on load.
 *
 * /templates/new opens a blank editor. Conflux creatures (cc-* ids) are
 * read-only source data: saving an edit creates a Custom copy.
 */
function MonsterDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = decodeURIComponent(String(params?.id ?? ''));
  const isNew = id === 'new';
  const wantEdit = searchParams?.get('edit') === '1';
  const navTop = useNavbarBottom();

  const [templates, setTemplates] = useState(null);
  const [conflux, setConflux] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, showToast] = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/templates');
        const data = res.ok ? await res.json() : null;
        if (!Array.isArray(data)) throw new Error('Templates could not be loaded');
        let cc = null;
        if (isConfluxId(id)) {
          const cres = await fetch('/api/templates?source=conflux');
          const cdata = cres.ok ? await cres.json() : [];
          cc = Array.isArray(cdata) ? cdata.find(t => t.id === id) || null : null;
        }
        if (cancelled) return;
        setTemplates(data);
        setConflux(cc);
      } catch (e) {
        if (!cancelled) setLoadError(e.message || 'Templates could not be loaded');
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const template = useMemo(() => {
    if (!templates) return null;
    if (isNew) return null;
    return templates.find(t => String(t.id) === id) || conflux || null;
  }, [templates, conflux, id, isNew]);
  const bookOptions = useMemo(
    () => [...new Set((templates || []).map(t => String(t.book ?? '').trim()).filter(Boolean))].sort(),
    [templates],
  );
  const fromConflux = !!template && isConfluxId(template.id) && !templates?.some(t => t.id === template.id);

  const startEdit = (t) => {
    const f = toEditForm(t);
    setForm(f);
    setBaseline(f);
    setEditing(true);
    setConfirmDelete(false);
    setShowPreview(false);
  };

  // Open straight into the editor for /templates/new and ?edit=1 — once per
  // id, so saving (which leaves edit mode before the URL drops ?edit=1)
  // doesn't bounce back into the editor.
  const autoOpenedFor = useRef(null);
  useEffect(() => {
    if (!templates || autoOpenedFor.current === id) return;
    if (!isNew && !(wantEdit && template)) return;
    autoOpenedFor.current = id;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot open from the URL after load
    startEdit(isNew ? BLANK_TEMPLATE : template);
  }, [templates, template, isNew, wantEdit, id]);

  const dirty = editing && form && baseline && !sameTemplate(form, baseline);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const persist = async (next) => {
    setSaving(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      setTemplates(next);
      return true;
    } catch (e) {
      console.error(e);
      showToast('Save failed — changes kept', TOAST_ERROR_DURATION_MS);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!form || !String(form.name).trim()) { showToast('A name is required', TOAST_ERROR_DURATION_MS); return; }
    if (isNew || fromConflux) {
      const built = fromEditForm(form, isNew ? {} : template);
      const created = { ...built, traits: built.traits || [], actions: built.actions || [], id: generateId('tpl'), source: 'custom' };
      if (await persist([...templates, created])) {
        setEditing(false);
        showToast(fromConflux ? 'Saved as a custom copy' : 'Monster created');
        router.replace(`/templates/${encodeURIComponent(created.id)}`);
      }
      return;
    }
    const updated = fromEditForm(form, template);
    if (sameTemplate(updated, template)) { setEditing(false); return; }
    if (await persist(templates.map(t => (t.id === template.id ? updated : t)))) {
      setEditing(false);
      showToast('Saved');
      if (wantEdit) router.replace(`/templates/${encodeURIComponent(template.id)}`);
    }
  };

  const handleCancel = () => {
    if (dirty && !window.confirm('Discard your unsaved changes?')) return;
    if (isNew) { router.push('/templates'); return; }
    setEditing(false);
    if (wantEdit) router.replace(`/templates/${encodeURIComponent(template.id)}`);
  };

  const handleDuplicate = async () => {
    const copy = { ...template, id: generateId('tpl'), name: `${template.name} (Copy)`, source: 'custom' };
    if (await persist([...templates, copy])) {
      showToast('Duplicated');
      router.push(`/templates/${encodeURIComponent(copy.id)}?edit=1`);
    }
  };

  const handleDelete = async () => {
    if (await persist(templates.filter(t => t.id !== template.id))) router.push('/templates');
  };

  // Save shortcut while editing.
  useEffect(() => {
    if (!editing) return;
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const backLink = (
    <Link href="/templates" className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-amber-300">
      <span aria-hidden>←</span> Monster library
    </Link>
  );

  let body;
  if (loadError) {
    body = <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-6 text-red-200">{loadError}. Nothing can be saved until the library loads — try reloading the page.</div>;
  } else if (!templates || (isNew && !editing)) {
    body = <div className="text-center py-16 text-stone-500 animate-pulse">Loading monster...</div>;
  } else if (!isNew && !template) {
    body = <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-6 text-stone-300">No monster with id <code className="text-amber-300">{id}</code> in the library.</div>;
  } else if (editing && form) {
    const preview = fromEditForm(form, isNew ? {} : template);
    body = (
      <>
        <div className="sticky z-20 -mx-4 px-4 py-3 mb-4 bg-stone-950/95 backdrop-blur border-b border-stone-800 flex flex-wrap items-center gap-3" style={{ top: navTop }} data-testid="edit-toolbar">
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-amber-500 font-semibold">{isNew ? 'New monster' : fromConflux ? 'Editing a Conflux creature — saves as a custom copy' : 'Editing'}</div>
            <div className="text-lg font-bold truncate">{form.name || 'Unnamed creature'}{dirty && <span className="ml-2 text-xs font-normal text-amber-400">● unsaved</span>}</div>
          </div>
          <button type="button" onClick={() => setShowPreview(p => !p)} className="xl:hidden px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-sm">{showPreview ? 'Back to form' : 'Preview'}</button>
          <button type="button" onClick={handleCancel} className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-sm">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-sm font-semibold flex items-center gap-1">
            <Icons.Check /> {isNew ? 'Create' : fromConflux ? 'Save as Copy' : 'Save'}
          </button>
        </div>
        <div className="grid gap-6 xl:grid-cols-2 items-start">
          <div className={showPreview ? 'hidden xl:block' : ''}><StatBlockForm form={form} setForm={setForm} bookOptions={bookOptions} /></div>
          <div className={`${showPreview ? '' : 'hidden'} xl:block xl:sticky rounded-xl border border-stone-800 bg-stone-900/40 p-5 xl:overflow-y-auto`}
            style={{ top: navTop + 88, maxHeight: `calc(100vh - ${navTop + 104}px)` }} data-testid="live-preview">
            <div className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-3">Live preview</div>
            <StatBlockView template={preview} compact />
          </div>
        </div>
      </>
    );
  } else {
    const t = template;
    body = (
      <>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${t.isNpc ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'}`}>
            {t.isNpc ? <><Icons.Shield /> NPC</> : <><Icons.Skull /> Enemy</>}
          </span>
          <span className="px-2 py-0.5 rounded text-xs bg-stone-800 text-stone-300">{sourceLabel(t)}</span>
          {bookLabel(t) && <span data-testid="book-badge" className="px-2 py-0.5 rounded text-xs bg-sky-900/40 text-sky-300" title="Source book">{bookLabel(t)}</span>}
          {t.legendaryActions?.length > 0 && <span className="px-2 py-0.5 rounded text-xs bg-purple-900/40 text-purple-300">Legendary</span>}
          <div className="flex-1" />
          <button type="button" onClick={() => startEdit(t)} className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-sm font-semibold flex items-center gap-1.5"><Icons.Edit /> Edit</button>
          {!fromConflux && (
            <button type="button" onClick={handleDuplicate} disabled={saving} className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-sm flex items-center gap-1.5"><Icons.Copy /> Duplicate</button>
          )}
          {!fromConflux && (confirmDelete ? (
            <span className="flex items-center gap-1">
              <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-sm">Keep</button>
              <button type="button" onClick={handleDelete} disabled={saving} className="px-3 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-sm font-semibold">Delete {t.name}</button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Delete monster" className="px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 text-sm flex items-center gap-1.5"><Icons.Trash /></button>
          ))}
        </div>
        <div className={`rounded-xl border p-5 md:p-7 ${t.isNpc ? 'border-emerald-900/50 bg-emerald-950/10' : 'border-red-900/40 bg-red-950/10'}`}>
          <StatBlockView template={t} stickyTop={navTop} />
        </div>
      </>
    );
  }

  return (
    <div className={PAGE_BG}>
      <Navbar saveStatus={saveStatus} />
      <main className="relative max-w-7xl mx-auto p-4">
        <div className="mb-3">{backLink}</div>
        {body}
      </main>
    </div>
  );
}
