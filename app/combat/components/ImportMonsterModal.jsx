'use client';

import { useState, useRef, useMemo } from 'react';
import Icons from '../../components/Icons';
import Modal from '../../components/Modal';
import { getMod } from '../../utils/rules';
import { BOOK_OPTIONS } from '../../templates/statBlock';

// Must match MAX_IMAGES in app/api/parse-monster/route.js
const MAX_IMAGES = 6;

let nextImageId = 0;

// Last source book used for an import, so a batch from one book is tagged once.
// Per-browser convenience only — the tag itself is saved on the template.
const BOOK_STORAGE_KEY = 'import-monster-book';
const readLastBook = () => {
  try { return localStorage.getItem(BOOK_STORAGE_KEY) || ''; } catch { return ''; }
};

// Template with the import's source book applied (blank = untagged).
export const withBook = (monster, book) => {
  const { book: _drop, ...rest } = monster;
  const trimmed = String(book ?? '').trim();
  return trimmed ? { ...rest, book: trimmed } : rest;
};

const ImportMonsterModal = ({ isOpen, onClose, onImport, onUpdate, templates = [] }) => {
  const [isDragging, setIsDragging] = useState(false);
  // Ordered screenshots that together form ONE stat block:
  // [{ id, data (base64, no prefix), mediaType, preview (data URL) }]
  const [images, setImages] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedMonster, setParsedMonster] = useState(null);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [book, setBook] = useState(readLastBook);
  const fileInputRef = useRef(null);

  // Existing monster with the same name, if any (derived — this used to be
  // state written from inside a useMemo)
  const bookOptions = useMemo(
    () => [...new Set([...BOOK_OPTIONS, ...templates.map(t => String(t.book ?? '').trim()).filter(Boolean)])],
    [templates],
  );

  const existingMatch = useMemo(() => {
    if (!parsedMonster || templates.length === 0) return null;
    return templates.find(t =>
      t.name.toLowerCase().trim() === parsedMonster.name.toLowerCase().trim()
    ) || null;
  }, [parsedMonster, templates]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e) => {
    addFiles(e.target.files);
    // Reset so selecting the same file again still fires onChange
    e.target.value = '';
  };

  // Appends files (in the order given) to the screenshot list.
  const addFiles = (fileList) => {
    const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;
    const slots = MAX_IMAGES - images.length;
    if (files.length > slots) {
      setError(`You can add at most ${MAX_IMAGES} screenshots — only the first ${Math.max(slots, 0)} were added.`);
    } else {
      setError(null);
    }
    files.slice(0, Math.max(slots, 0)).forEach((file) => {
      const id = ++nextImageId;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        setImages(prev => {
          if (prev.length >= MAX_IMAGES) return prev;
          // Keep selection order even if readers finish out of order
          const next = [...prev, {
            id,
            data: dataUrl.split(',')[1],
            mediaType: file.type,
            preview: dataUrl,
          }];
          return next.sort((a, b) => a.id - b.id);
        });
        setParsedMonster(null);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setError(null);
  };

  // Swap a screenshot with its neighbor (dir = -1 left, +1 right). Order
  // matters: the parser reads image 1 first.
  const moveImage = (index, dir) => {
    setImages(prev => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleParse = async () => {
    if (images.length === 0) return;
    
    setIsParsing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/parse-monster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map(({ data, mediaType }) => ({ data, mediaType })),
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        if (data.raw) {
          console.error('Raw AI response:', data.raw);
        }
      } else {
        setParsedMonster(data.monster);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = (updateExisting = false) => {
    if (parsedMonster) {
      try { localStorage.setItem(BOOK_STORAGE_KEY, book.trim()); } catch { /* storage unavailable */ }
      const monster = withBook(parsedMonster, book);
      if (updateExisting && existingMatch && onUpdate) {
        // Update existing monster, keeping the original ID
        onUpdate({ ...monster, id: existingMatch.id });
      } else {
        // Create new monster
        onImport(monster);
      }
      handleClose();
    }
  };

  const handleClose = () => {
    setImages([]);
    setParsedMonster(null);
    setError(null);
    setEditMode(false);
    setIsParsing(false);
    onClose();
  };

  const updateParsedField = (field, value) => {
    setParsedMonster(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={handleClose}>
      <div className="bg-stone-900 border border-amber-800/50 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-stone-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <Icons.Upload /> Import Monster from Image
          </h2>
          <button onClick={handleClose} className="text-stone-400 hover:text-stone-200">
            <Icons.X />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!parsedMonster ? (
            // Upload/Parse Stage
            <div className="space-y-4">
              {/* Selected screenshots, in parse order */}
              {images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-green-400 text-sm">
                    {images.length === 1
                      ? 'Screenshot loaded. Add more if the stat block continues, or click "Parse Image".'
                      : `${images.length} screenshots will be combined into one stat block, in this order.`}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {images.map((img, i) => (
                      <div
                        key={img.id}
                        data-testid="import-screenshot"
                        className="relative bg-stone-800 border border-stone-700 rounded-lg p-2 w-40"
                      >
                        <span className="absolute top-1 left-1 bg-amber-600 text-white text-xs font-bold rounded px-1.5">
                          {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          aria-label={`Remove screenshot ${i + 1}`}
                          className="absolute top-1 right-1 bg-stone-900/80 rounded text-stone-400 hover:text-red-400"
                        >
                          <Icons.X />
                        </button>
                        <img
                          src={img.preview}
                          alt={`Stat block screenshot ${i + 1}`}
                          className="h-32 w-full object-contain rounded"
                        />
                        {images.length > 1 && (
                          <div className="flex justify-between mt-1 text-xs">
                            <button
                              type="button"
                              onClick={() => moveImage(i, -1)}
                              disabled={i === 0}
                              aria-label={`Move screenshot ${i + 1} earlier`}
                              className="px-2 rounded bg-stone-700 hover:bg-stone-600 disabled:opacity-30 disabled:hover:bg-stone-700"
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImage(i, 1)}
                              disabled={i === images.length - 1}
                              aria-label={`Move screenshot ${i + 1} later`}
                              className="px-2 rounded bg-stone-700 hover:bg-stone-600 disabled:opacity-30 disabled:hover:bg-stone-700"
                            >
                              →
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drop Zone */}
              {images.length < MAX_IMAGES && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
                    images.length > 0 ? 'p-4' : 'p-8'
                  } ${
                    isDragging
                      ? 'border-amber-500 bg-amber-900/20'
                      : 'border-stone-600 hover:border-stone-500 hover:bg-stone-800/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="import-file-input"
                  />
                  {images.length > 0 ? (
                    <p className="text-stone-400 text-sm flex items-center justify-center gap-2">
                      <Icons.Plus /> Add another screenshot (drop or click)
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <Icons.Upload className="w-12 h-12 mx-auto text-stone-500" />
                      <p className="text-stone-400">
                        Drag and drop stat block screenshots here, or click to browse
                      </p>
                      <p className="text-xs text-stone-500">
                        Supports PNG, JPG, WebP. Big stat block? Add up to {MAX_IMAGES} screenshots and they&apos;ll be combined.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
                  <strong>Error:</strong> {error}
                </div>
              )}

              {/* Parse Button */}
              {images.length > 0 && (
                <button
                  onClick={handleParse}
                  disabled={isParsing}
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                    isParsing 
                      ? 'bg-stone-700 text-stone-400 cursor-wait' 
                      : 'bg-amber-600 hover:bg-amber-500 text-white'
                  }`}
                >
                  {isParsing ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-stone-400 border-t-transparent rounded-full" />
                      Parsing stat block...
                    </>
                  ) : (
                    <>
                      <Icons.Wand /> {images.length > 1 ? `Parse ${images.length} Images` : 'Parse Image'}
                    </>
                  )}
                </button>
              )}

              {/* Tips */}
              <div className="bg-stone-800/50 rounded-lg p-4 text-sm">
                <h3 className="font-medium text-amber-400 mb-2">Tips for best results:</h3>
                <ul className="text-stone-400 space-y-1 list-disc list-inside">
                  <li>Use clear, high-resolution screenshots</li>
                  <li>Include the entire stat block — split tall ones across several screenshots, top to bottom</li>
                  <li>Works best with official D&D formatted stat blocks</li>
                  <li>You can edit the parsed data before importing</li>
                </ul>
              </div>
            </div>
          ) : (
            // Review/Edit Stage
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-green-400">✓ Monster Parsed Successfully</h3>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`px-3 py-1 rounded text-sm ${editMode ? 'bg-amber-700' : 'bg-stone-700 hover:bg-stone-600'}`}
                >
                  {editMode ? 'Preview' : 'Edit'}
                </button>
              </div>

              <label className="flex flex-wrap items-center gap-3 bg-stone-800/50 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-sky-300">Source book</span>
                <input
                  type="text"
                  value={book}
                  onChange={(e) => setBook(e.target.value)}
                  list="import-book-options"
                  placeholder="e.g. MM 2024, VGtM, Homebrew"
                  className="flex-1 min-w-[12rem] bg-stone-900 border border-stone-600 rounded px-3 py-1.5 text-sm"
                />
                <datalist id="import-book-options">{bookOptions.map(b => <option key={b} value={b} />)}</datalist>
                <span className="text-xs text-stone-500 w-full">Optional — tags where this stat block comes from. Remembered for your next import.</span>
              </label>

              {editMode ? (
                // Edit Form
                <div className="space-y-4 bg-stone-800/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-stone-400">Name</label>
                      <input
                        type="text"
                        value={parsedMonster.name}
                        onChange={(e) => updateParsedField('name', e.target.value)}
                        className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-stone-400">Size</label>
                        <select
                          value={parsedMonster.size}
                          onChange={(e) => updateParsedField('size', e.target.value)}
                          className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2"
                        >
                          {['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-stone-400">Type</label>
                        <input
                          type="text"
                          value={parsedMonster.creatureType}
                          onChange={(e) => updateParsedField('creatureType', e.target.value)}
                          className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-xs text-stone-400">AC</label>
                      <input type="number" value={parsedMonster.ac} onChange={(e) => updateParsedField('ac', parseInt(e.target.value))} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" />
                    </div>
                    <div>
                      <label className="text-xs text-stone-400">HP</label>
                      <input type="number" value={parsedMonster.maxHp} onChange={(e) => updateParsedField('maxHp', parseInt(e.target.value))} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" />
                    </div>
                    <div>
                      <label className="text-xs text-stone-400">CR</label>
                      <input type="text" value={parsedMonster.cr} onChange={(e) => updateParsedField('cr', e.target.value)} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" />
                    </div>
                    <div>
                      <label className="text-xs text-stone-400">XP</label>
                      <input type="number" value={parsedMonster.xp} onChange={(e) => updateParsedField('xp', parseInt(e.target.value))} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => (
                      <div key={stat}>
                        <label className="text-xs text-stone-400 uppercase">{stat}</label>
                        <input
                          type="number"
                          value={parsedMonster[stat]}
                          onChange={(e) => updateParsedField(stat, parseInt(e.target.value))}
                          className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-2 text-center"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="text-xs text-stone-400">Speed</label>
                    <input type="text" value={parsedMonster.speed} onChange={(e) => updateParsedField('speed', e.target.value)} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" />
                  </div>

                  <div className="text-xs text-stone-500">
                    Note: Traits, Actions, and other stat block sections can be edited after import in the Templates tab.
                  </div>
                </div>
              ) : (
                // Preview
                <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 space-y-3">
                  <div className="border-b border-red-800/50 pb-2">
                    <h4 className="text-xl font-bold text-red-400">{parsedMonster.name}</h4>
                    <p className="text-sm text-stone-400 italic">{parsedMonster.size} {parsedMonster.creatureType}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><span className="text-stone-500">AC</span> <span className="text-stone-200">{parsedMonster.ac}</span></div>
                    <div><span className="text-stone-500">HP</span> <span className="text-stone-200">{parsedMonster.maxHp} ({parsedMonster.hitDice})</span></div>
                    <div><span className="text-stone-500">Speed</span> <span className="text-stone-200">{parsedMonster.speed}</span></div>
                  </div>

                  <div className="grid grid-cols-6 gap-2 text-center text-xs bg-stone-900/50 rounded p-2">
                    {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => (
                      <div key={stat}>
                        <div className="text-stone-500 uppercase font-bold">{stat}</div>
                        <div className="text-stone-200">{parsedMonster[stat]} ({getMod(parsedMonster[stat])})</div>
                      </div>
                    ))}
                  </div>

                  {parsedMonster.savingThrows && (
                    <div className="text-xs"><span className="text-stone-500">Saving Throws</span> <span className="text-stone-300">{parsedMonster.savingThrows}</span></div>
                  )}
                  {parsedMonster.skills && (
                    <div className="text-xs"><span className="text-stone-500">Skills</span> <span className="text-stone-300">{parsedMonster.skills}</span></div>
                  )}
                  {parsedMonster.immunities && (
                    <div className="text-xs"><span className="text-green-500">Immunities</span> <span className="text-green-300">{parsedMonster.immunities}</span></div>
                  )}
                  {parsedMonster.resistances && (
                    <div className="text-xs"><span className="text-blue-500">Resistances</span> <span className="text-blue-300">{parsedMonster.resistances}</span></div>
                  )}
                  {parsedMonster.vulnerabilities && (
                    <div className="text-xs"><span className="text-yellow-500">Vulnerabilities</span> <span className="text-yellow-300">{parsedMonster.vulnerabilities}</span></div>
                  )}
                  {parsedMonster.senses && (
                    <div className="text-xs"><span className="text-stone-500">Senses</span> <span className="text-stone-300">{parsedMonster.senses}</span></div>
                  )}
                  {parsedMonster.languages && (
                    <div className="text-xs"><span className="text-stone-500">Languages</span> <span className="text-stone-300">{parsedMonster.languages}</span></div>
                  )}
                  <div className="text-xs"><span className="text-stone-500">CR</span> <span className="text-amber-400">{parsedMonster.cr}</span> <span className="text-stone-500">({parsedMonster.xp} XP)</span></div>

                  {parsedMonster.traits?.length > 0 && (
                    <div className="border-t border-stone-700 pt-2">
                      <div className="text-xs text-amber-400 font-bold mb-1">Traits</div>
                      {parsedMonster.traits.map((t, i) => (
                        <div key={i} className="text-xs mb-1">
                          <span className="text-amber-300 italic">{t.name}.</span> <span className="text-stone-300">{t.description}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {parsedMonster.actions?.length > 0 && (
                    <div className="border-t border-stone-700 pt-2">
                      <div className="text-xs text-red-400 font-bold mb-1">Actions</div>
                      {parsedMonster.actions.map((a, i) => (
                        <div key={i} className="text-xs mb-1">
                          <span className="text-red-300 italic">{a.name}.</span> <span className="text-stone-300">{a.description}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {parsedMonster.bonusActions?.length > 0 && (
                    <div className="border-t border-stone-700 pt-2">
                      <div className="text-xs text-orange-400 font-bold mb-1">Bonus Actions</div>
                      {parsedMonster.bonusActions.map((a, i) => (
                        <div key={i} className="text-xs mb-1">
                          <span className="text-orange-300 italic">{a.name}.</span> <span className="text-stone-300">{a.description}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {parsedMonster.reactions?.length > 0 && (
                    <div className="border-t border-stone-700 pt-2">
                      <div className="text-xs text-cyan-400 font-bold mb-1">Reactions</div>
                      {parsedMonster.reactions.map((r, i) => (
                        <div key={i} className="text-xs mb-1">
                          <span className="text-cyan-300 italic">{r.name}.</span> <span className="text-stone-300">{r.description}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {parsedMonster.legendaryActions?.length > 0 && (
                    <div className="border-t border-stone-700 pt-2">
                      <div className="text-xs text-purple-400 font-bold mb-1">Legendary Actions</div>
                      {parsedMonster.legendaryActions.map((la, i) => (
                        <div key={i} className="text-xs mb-1">
                          <span className="text-purple-300 italic">{la.name}.</span> <span className="text-stone-300">{la.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Back button */}
              <button
                onClick={() => { setParsedMonster(null); setError(null); }}
                className="text-sm text-stone-400 hover:text-stone-200"
              >
                ← Back to screenshots
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-700">
          {existingMatch && (
            <div className="mb-3 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg">
              <p className="text-amber-400 text-sm flex items-center gap-2">
                <Icons.Info /> A monster named "{existingMatch.name}" already exists.
              </p>
              <p className="text-stone-400 text-xs mt-1">You can update the existing entry or create a new one.</p>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={handleClose} className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600">
              Cancel
            </button>
            {parsedMonster && existingMatch && onUpdate && (
              <button
                onClick={() => handleImport(true)}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium flex items-center gap-2"
              >
                <Icons.Refresh /> Update Existing
              </button>
            )}
            {parsedMonster && (
              <button
                onClick={() => handleImport(false)}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium flex items-center gap-2"
              >
                <Icons.Download /> {existingMatch ? 'Create New' : 'Import Monster'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ImportMonsterModal;
