'use client';

import { useState, useRef } from 'react';
import Icons from './Icons';

const ImportMonsterModal = ({ isOpen, onClose, onImport }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedMonster, setParsedMonster] = useState(null);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const fileInputRef = useRef(null);

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
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImage(file);
    }
  };

  const processImage = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setImagePreview(base64);
      // Extract just the base64 data without the data URL prefix
      const base64Data = base64.split(',')[1];
      setImage({ data: base64Data, mediaType: file.type });
      setError(null);
      setParsedMonster(null);
    };
    reader.readAsDataURL(file);
  };

  const handleParse = async () => {
    if (!image) return;
    
    setIsParsing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/parse-monster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: image.data, mediaType: image.mediaType }),
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

  const handleImport = () => {
    if (parsedMonster) {
      onImport(parsedMonster);
      handleClose();
    }
  };

  const handleClose = () => {
    setImage(null);
    setImagePreview(null);
    setParsedMonster(null);
    setError(null);
    setEditMode(false);
    setIsParsing(false);
    onClose();
  };

  const updateParsedField = (field, value) => {
    setParsedMonster(prev => ({ ...prev, [field]: value }));
  };

  const getMod = (score) => {
    const mod = Math.floor((parseInt(score) - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div 
        className="bg-stone-900 border border-amber-800/50 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
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
              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragging 
                    ? 'border-amber-500 bg-amber-900/20' 
                    : imagePreview 
                      ? 'border-green-600 bg-green-900/10' 
                      : 'border-stone-600 hover:border-stone-500 hover:bg-stone-800/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {imagePreview ? (
                  <div className="space-y-4">
                    <img 
                      src={imagePreview} 
                      alt="Monster stat block" 
                      className="max-h-64 mx-auto rounded-lg shadow-lg"
                    />
                    <p className="text-green-400 text-sm">Image loaded! Click "Parse Image" to extract the stat block.</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setImage(null); setImagePreview(null); }}
                      className="text-xs text-stone-400 hover:text-red-400"
                    >
                      Remove and upload different image
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Icons.Upload className="w-12 h-12 mx-auto text-stone-500" />
                    <p className="text-stone-400">
                      Drag and drop a stat block screenshot here, or click to browse
                    </p>
                    <p className="text-xs text-stone-500">
                      Supports PNG, JPG, WebP images
                    </p>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
                  <strong>Error:</strong> {error}
                </div>
              )}

              {/* Parse Button */}
              {imagePreview && (
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
                      <Icons.Wand /> Parse Image
                    </>
                  )}
                </button>
              )}

              {/* Tips */}
              <div className="bg-stone-800/50 rounded-lg p-4 text-sm">
                <h3 className="font-medium text-amber-400 mb-2">Tips for best results:</h3>
                <ul className="text-stone-400 space-y-1 list-disc list-inside">
                  <li>Use clear, high-resolution screenshots</li>
                  <li>Include the entire stat block in the image</li>
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
                ← Upload a different image
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-700 flex justify-end gap-3">
          <button onClick={handleClose} className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600">
            Cancel
          </button>
          {parsedMonster && (
            <button
              onClick={handleImport}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium flex items-center gap-2"
            >
              <Icons.Download /> Import Monster
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportMonsterModal;
