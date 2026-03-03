'use client';

import { useState, useEffect } from 'react';
import Icons from '../../../components/Icons';

// Wild Shape rules by druid level
const WILD_SHAPE_TABLE = [
  { level: 2, knownForms: 4, maxCR: '1/4', flySpeed: false },
  { level: 4, knownForms: 6, maxCR: '1/2', flySpeed: false },
  { level: 8, knownForms: 8, maxCR: 1, flySpeed: true },
];

function getWildShapeRules(druidLevel) {
  let rules = WILD_SHAPE_TABLE[0];
  for (const row of WILD_SHAPE_TABLE) {
    if (druidLevel >= row.level) rules = row;
  }
  return rules;
}

// Parse CR string to number for comparison
function parseCR(cr) {
  if (typeof cr === 'number') return cr;
  if (cr === '1/8') return 0.125;
  if (cr === '1/4') return 0.25;
  if (cr === '1/2') return 0.5;
  return parseFloat(cr) || 0;
}

function formatCR(cr) {
  const num = parseCR(cr);
  if (num === 0.125) return '1/8';
  if (num === 0.25) return '1/4';
  if (num === 0.5) return '1/2';
  return String(num);
}

export default function WildShapeTab({ character, onUpdate, templates = [] }) {
  const [expandedFormId, setExpandedFormId] = useState(null);
  const [showBeastPicker, setShowBeastPicker] = useState(false);
  const [crFilter, setCrFilter] = useState(null);
  const [beastSearch, setBeastSearch] = useState('');

  // Get druid level
  const getDruidLevel = () => {
    if (character.classes) {
      const druid = character.classes.find(c => c.name?.toLowerCase() === 'druid');
      return druid ? parseInt(druid.level) || 0 : 0;
    }
    if (character.class?.toLowerCase() === 'druid') {
      return parseInt(character.level) || 0;
    }
    return 0;
  };

  const druidLevel = getDruidLevel();
  const rules = getWildShapeRules(druidLevel);
  const wildShapeForms = character.wildShapeForms || [];

  // Filter beasts from templates
  const availableBeasts = templates.filter(t => {
    if (t.creatureType?.toLowerCase() !== 'beast') return false;
    const cr = parseCR(t.cr);
    const maxCR = parseCR(rules.maxCR);
    if (cr > maxCR) return false;
    // Check fly speed restriction
    const speedStr = String(t.speed || '').toLowerCase();
    if (!rules.flySpeed && speedStr.includes('fly')) return false;
    return true;
  });

  // Group beasts by CR
  const beastsByCR = availableBeasts.reduce((acc, beast) => {
    const cr = formatCR(beast.cr);
    if (!acc[cr]) acc[cr] = [];
    acc[cr].push(beast);
    return acc;
  }, {});

  const crOptions = Object.keys(beastsByCR).sort((a, b) => parseCR(a) - parseCR(b));

  const addForm = (beast) => {
    if (wildShapeForms.length >= rules.knownForms) return;
    if (wildShapeForms.some(f => f.templateId === beast.id)) return;

    const newForm = {
      id: Date.now(),
      templateId: beast.id,
      name: beast.name,
      currentHp: beast.maxHp,
      // Store beast stats for use in combat
      ac: beast.ac,
      maxHp: beast.maxHp,
      speed: beast.speed,
      cr: beast.cr,
      str: beast.str,
      dex: beast.dex,
      con: beast.con,
      int: beast.int,
      wis: beast.wis,
      cha: beast.cha,
      senses: beast.senses,
      traits: beast.traits,
      actions: beast.actions,
    };
    onUpdate('wildShapeForms', [...wildShapeForms, newForm]);
  };

  const removeForm = (formId) => {
    onUpdate('wildShapeForms', wildShapeForms.filter(f => f.id !== formId));
  };

  const updateFormHp = (formId, hp) => {
    onUpdate('wildShapeForms', wildShapeForms.map(f => 
      f.id === formId ? { ...f, currentHp: hp } : f
    ));
  };

  const activateWildShape = (formId) => {
    const form = wildShapeForms.find(f => f.id === formId);
    if (!form) return;

    const beast = templates.find(t => t.id === form.templateId);
    if (!beast) return;

    // Reset form HP when transforming
    updateFormHp(formId, beast.maxHp);

    // Decrement wild shape uses if resource exists
    const resources = character.resources || [];
    const wildShapeResource = resources.find(r => 
      r.name.toLowerCase().includes('wild shape')
    );
    if (wildShapeResource && wildShapeResource.current > 0) {
      onUpdate('resources', resources.map(r =>
        r.id === wildShapeResource.id ? { ...r, current: r.current - 1 } : r
      ));
    }

    onUpdate('wildShapeActive', true);
    onUpdate('wildShapeFormId', formId);
  };

  const deactivateWildShape = () => {
    onUpdate('wildShapeActive', false);
    onUpdate('wildShapeFormId', null);
  };

  const activeForm = character.wildShapeActive 
    ? wildShapeForms.find(f => f.id === character.wildShapeFormId)
    : null;
  const activeFormTemplate = activeForm 
    ? templates.find(t => t.id === activeForm.templateId)
    : null;

  const getModifier = (score) => {
    const mod = Math.floor(((parseInt(score) || 10) - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  if (druidLevel < 2) {
    return (
      <div className="text-center py-12 text-stone-500">
        <div className="text-4xl mb-4">🐾</div>
        <p className="text-lg">Wild Shape</p>
        <p className="text-sm mt-2">Available at Druid level 2</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wild Shape Rules Summary */}
      <div className="bg-stone-800/50 rounded-lg p-4 border border-stone-700">
        <h3 className="font-bold text-lime-400 flex items-center gap-2 mb-3">
          <span className="text-xl">🐾</span> Wild Shape
        </h3>
        <p className="text-sm text-stone-300 mb-3">
          As a Bonus Action, you shape-shift into a Beast form you have learned. You stay in that form for a number of hours equal to half your Druid level (up to {Math.floor(druidLevel / 2)} hours). You can leave the form early as a Bonus Action.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-stone-900/50 rounded p-2">
            <div className="text-stone-500 text-xs">Known Forms</div>
            <div className="text-lg font-bold text-amber-400">{wildShapeForms.length} / {rules.knownForms}</div>
          </div>
          <div className="bg-stone-900/50 rounded p-2">
            <div className="text-stone-500 text-xs">Max CR</div>
            <div className="text-lg font-bold text-amber-400">{rules.maxCR}</div>
          </div>
          <div className="bg-stone-900/50 rounded p-2">
            <div className="text-stone-500 text-xs">Fly Speed</div>
            <div className={`text-lg font-bold ${rules.flySpeed ? 'text-emerald-400' : 'text-red-400'}`}>
              {rules.flySpeed ? 'Yes' : 'No'}
            </div>
          </div>
          <div className="bg-stone-900/50 rounded p-2">
            <div className="text-stone-500 text-xs">Duration</div>
            <div className="text-lg font-bold text-amber-400">{Math.floor(druidLevel / 2)} hrs</div>
          </div>
        </div>
        <p className="text-xs text-stone-500 mt-3">
          You retain your creature type, Hit Points, Hit Dice, INT/WIS/CHA scores, class features, languages, and feats. Use the beast's STR, DEX, CON, AC, speed, senses, and special abilities.
        </p>
      </div>

      {/* Active Wild Shape Banner */}
      {activeForm && activeFormTemplate && (
        <div className="p-4 rounded-lg border-2 border-lime-500 bg-lime-950/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🐾</span>
              <div>
                <h3 className="font-bold text-lime-400 text-lg">{activeFormTemplate.name}</h3>
                <div className="text-sm text-stone-300 flex items-center gap-3">
                  <span>CR {activeFormTemplate.cr}</span>
                  <span className="flex items-center gap-1"><Icons.Shield className="w-4 h-4" /> AC {activeFormTemplate.ac}</span>
                  <span>{activeFormTemplate.speed}</span>
                </div>
              </div>
            </div>
            <button
              onClick={deactivateWildShape}
              className="px-4 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-sm font-medium"
            >
              End Wild Shape
            </button>
          </div>
          
          {/* Beast HP */}
          <div className="flex items-center gap-4 mb-3">
            <span className="text-stone-400">Beast HP:</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => updateFormHp(activeForm.id, Math.max(0, activeForm.currentHp - 1))}
                className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600"
              >−</button>
              <span className="font-mono text-lg w-20 text-center">
                <span className={activeForm.currentHp <= activeFormTemplate.maxHp / 4 ? 'text-red-400' : ''}>
                  {activeForm.currentHp}
                </span> / {activeFormTemplate.maxHp}
              </span>
              <button 
                onClick={() => updateFormHp(activeForm.id, Math.min(activeFormTemplate.maxHp, activeForm.currentHp + 1))}
                className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600"
              >+</button>
            </div>
            {activeForm.currentHp === 0 && (
              <span className="text-red-400 text-sm">Form ends! Excess damage carries over.</span>
            )}
          </div>

          {/* Beast Stats */}
          <div className="grid grid-cols-6 gap-2 mb-3">
            {['str', 'dex', 'con'].map(stat => (
              <div key={stat} className="text-center bg-stone-900/50 rounded p-2">
                <div className="text-[10px] text-stone-500 uppercase">{stat}</div>
                <div className="font-bold">{activeFormTemplate[stat]}</div>
                <div className="text-xs text-stone-400">{getModifier(activeFormTemplate[stat])}</div>
              </div>
            ))}
            {['int', 'wis', 'cha'].map(stat => (
              <div key={stat} className="text-center bg-lime-900/30 rounded p-2" title="Using your score">
                <div className="text-[10px] text-lime-500 uppercase">{stat} (yours)</div>
                <div className="font-bold text-lime-400">{character[stat]}</div>
                <div className="text-xs text-lime-400/70">{getModifier(character[stat])}</div>
              </div>
            ))}
          </div>

          {/* Beast Abilities */}
          {activeFormTemplate.traits && activeFormTemplate.traits.length > 0 && (
            <div className="text-sm space-y-1">
              {activeFormTemplate.traits.map((trait, i) => (
                <p key={i}><span className="text-amber-400 font-medium">{trait.name}.</span> {trait.description}</p>
              ))}
            </div>
          )}
          {activeFormTemplate.actions && activeFormTemplate.actions.length > 0 && (
            <div className="text-sm space-y-1 mt-2">
              <div className="text-stone-500 text-xs uppercase">Actions</div>
              {activeFormTemplate.actions.map((action, i) => (
                <p key={i}><span className="text-red-400 font-medium">{action.name}.</span> {action.description}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Known Forms */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-stone-300">Known Beast Forms</h3>
          <button
            onClick={() => setShowBeastPicker(true)}
            disabled={wildShapeForms.length >= rules.knownForms}
            className={`px-3 py-1 rounded text-xs flex items-center gap-1 ${
              wildShapeForms.length >= rules.knownForms
                ? 'bg-stone-700 text-stone-500 cursor-not-allowed'
                : 'bg-lime-800 hover:bg-lime-700 text-lime-100'
            }`}
          >
            <Icons.Plus className="w-3 h-3" /> Add Beast Form
          </button>
        </div>

        {wildShapeForms.length === 0 ? (
          <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">
            <p>No beast forms learned yet.</p>
            <p className="text-sm mt-1">Add beasts from your templates to use Wild Shape.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {wildShapeForms.map(form => {
              const beast = templates.find(t => t.id === form.templateId);
              if (!beast) return null;
              const isActive = character.wildShapeActive && character.wildShapeFormId === form.id;
              const isExpanded = expandedFormId === form.id;

              return (
                <div 
                  key={form.id}
                  className={`rounded-lg border overflow-hidden ${
                    isActive 
                      ? 'border-lime-500 bg-lime-950/30' 
                      : 'border-stone-700 bg-stone-800/50'
                  }`}
                >
                  <div 
                    className="p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5"
                    onClick={() => setExpandedFormId(isExpanded ? null : form.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isActive ? 'text-lime-400' : 'text-stone-200'}`}>
                          {beast.name}
                        </span>
                        <span className="text-xs text-stone-500">CR {beast.cr}</span>
                      </div>
                      <div className="text-xs text-stone-400 flex items-center gap-2">
                        <span>AC {beast.ac}</span>
                        <span>HP {beast.maxHp}</span>
                        <span>{beast.speed}</span>
                      </div>
                    </div>

                    {isActive ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); deactivateWildShape(); }}
                        className="px-3 py-1 rounded text-xs bg-red-800 hover:bg-red-700"
                      >
                        End Form
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); activateWildShape(form.id); }}
                        disabled={character.wildShapeActive}
                        className={`px-3 py-1 rounded text-xs ${
                          character.wildShapeActive
                            ? 'bg-stone-700 text-stone-500 cursor-not-allowed'
                            : 'bg-lime-700 hover:bg-lime-600 text-lime-100'
                        }`}
                      >
                        🐾 Transform
                      </button>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); removeForm(form.id); }}
                      className="text-red-500 hover:text-red-400 p-1"
                      title="Forget this form"
                    >
                      <Icons.Trash className="w-4 h-4" />
                    </button>

                    <span className={`text-stone-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-stone-700/50 text-sm space-y-2">
                      <div className="pt-3 grid grid-cols-6 gap-1 text-center">
                        {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => (
                          <div key={stat}>
                            <div className="text-[10px] text-stone-500 uppercase">{stat}</div>
                            <div className="font-medium">{beast[stat]}</div>
                          </div>
                        ))}
                      </div>
                      {beast.senses && <p className="text-stone-400"><span className="text-stone-500">Senses:</span> {beast.senses}</p>}
                      {beast.traits && beast.traits.map((t, i) => (
                        <p key={i}><span className="text-amber-400">{t.name}.</span> {t.description}</p>
                      ))}
                      {beast.actions && beast.actions.map((a, i) => (
                        <p key={i}><span className="text-red-400">{a.name}.</span> {a.description}</p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Beast Picker Modal */}
      {showBeastPicker && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowBeastPicker(false)}
        >
          <div 
            className="bg-stone-900 border border-stone-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-stone-700">
              <h2 className="text-lg font-bold text-lime-400">Add Beast Form</h2>
              <p className="text-sm text-stone-400">
                Choose from beasts in your templates (CR {rules.maxCR} or lower{!rules.flySpeed && ', no fly speed'})
              </p>
              
              {/* Search Field */}
              <div className="mt-3">
                <input
                  type="text"
                  value={beastSearch}
                  onChange={(e) => setBeastSearch(e.target.value)}
                  placeholder="Search beasts..."
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-lime-600"
                  autoFocus
                />
              </div>
              
              {/* CR Filter */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setCrFilter(null)}
                  className={`px-3 py-1 rounded text-xs ${
                    crFilter === null ? 'bg-lime-700 text-lime-100' : 'bg-stone-700 text-stone-300'
                  }`}
                >
                  All
                </button>
                {crOptions.map(cr => (
                  <button
                    key={cr}
                    onClick={() => setCrFilter(cr)}
                    className={`px-3 py-1 rounded text-xs ${
                      crFilter === cr ? 'bg-lime-700 text-lime-100' : 'bg-stone-700 text-stone-300'
                    }`}
                  >
                    CR {cr}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {availableBeasts.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <p>No eligible beasts found in templates.</p>
                  <p className="text-sm mt-1">Add Beast creatures to your Templates tab first.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableBeasts
                    .filter(b => crFilter === null || formatCR(b.cr) === crFilter)
                    .filter(b => !beastSearch || b.name.toLowerCase().includes(beastSearch.toLowerCase()))
                    .map(beast => {
                      const alreadyKnown = wildShapeForms.some(f => f.templateId === beast.id);
                      return (
                        <button
                          key={beast.id}
                          onClick={() => { addForm(beast); setShowBeastPicker(false); setBeastSearch(''); }}
                          disabled={alreadyKnown}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            alreadyKnown
                              ? 'border-stone-700 bg-stone-800/30 text-stone-500 cursor-not-allowed'
                              : 'border-stone-700 bg-stone-800/50 hover:border-lime-600 hover:bg-stone-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{beast.name}</span>
                              <span className="text-xs text-stone-500 ml-2">CR {beast.cr}</span>
                              {alreadyKnown && <span className="text-xs text-lime-500 ml-2">(Known)</span>}
                            </div>
                            <div className="text-xs text-stone-400 flex items-center gap-3">
                              <span>AC {beast.ac}</span>
                              <span>HP {beast.maxHp}</span>
                              <span>{beast.speed}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-stone-700">
              <button
                onClick={() => { setShowBeastPicker(false); setBeastSearch(''); }}
                className="w-full py-2 rounded-lg bg-stone-700 hover:bg-stone-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
