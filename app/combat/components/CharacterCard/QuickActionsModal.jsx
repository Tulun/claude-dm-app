'use client';

import Icons from '../../../components/Icons';

const QuickActionsModal = ({ isOpen, character, onUpdate, onClose, displayAC, spellcastingInfo }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-red-800/50 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-stone-700 bg-gradient-to-r from-red-950/50 to-stone-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-900/50"><Icons.Skull /></div>
              <div>
                <h2 className="text-lg font-bold text-red-400">{character.name}</h2>
                <p className="text-xs text-stone-400">CR {character.cr} • AC {displayAC} • HP {character.currentHp}/{character.maxHp}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-200"><Icons.X /></button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Legendary Actions */}
          {character.legendaryActions?.length > 0 && (
            <LegendaryActionsSection character={character} onUpdate={onUpdate} />
          )}

          {/* Spellcasting */}
          {spellcastingInfo.found && (
            <SpellcastingSection character={character} onUpdate={onUpdate} spellcastingInfo={spellcastingInfo} />
          )}

          {/* Traits */}
          <AbilitySection title="Traits" items={character.traits} color="amber" />
          
          {/* Actions */}
          <AbilitySection title="Actions" items={character.actions} color="red" icon={<Icons.Sword />} />
          
          {/* Bonus Actions */}
          <AbilitySection title="Bonus Actions" items={character.bonusActions} color="orange" />
          
          {/* Reactions */}
          <AbilitySection title="Reactions" items={character.reactions} color="cyan" />

          {/* Notes */}
          {character.notes && (
            <div>
              <h3 className="text-sm font-bold text-stone-400 mb-2">Notes</h3>
              <div className="bg-stone-800/50 rounded p-3 text-sm text-stone-300 italic">{character.notes}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-700 flex justify-between items-center">
          <div className="text-xs text-stone-500">{character.senses && `Senses: ${character.senses}`}</div>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600">Close</button>
        </div>
      </div>
    </div>
  );
};

// Sub-components
const LegendaryActionsSection = ({ character, onUpdate }) => (
  <div className="bg-purple-950/30 border border-purple-800/50 rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
        ★ Legendary Actions
        <span className="text-xs text-stone-400 font-normal">(3 per round)</span>
      </h3>
      <div className="flex items-center gap-2">
        <span className="text-xs text-stone-400">Used:</span>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                const used = character.legendaryActionsUsed || 0;
                onUpdate({ ...character, legendaryActionsUsed: i < used ? i : i + 1 });
              }}
              className={`w-6 h-6 rounded-full border-2 transition-colors ${
                i < (character.legendaryActionsUsed || 0) ? 'bg-purple-600 border-purple-400' : 'bg-stone-800 border-stone-600 hover:border-purple-500'
              }`}
            />
          ))}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onUpdate({ ...character, legendaryActionsUsed: 0 }); }}
          className="text-xs text-purple-400 hover:text-purple-300 ml-2 px-2 py-1 rounded hover:bg-purple-900/30">Reset</button>
      </div>
    </div>
    <div className="space-y-2">
      {character.legendaryActions.map((action, i) => (
        <div key={i} className="bg-purple-900/20 rounded p-3 text-sm">
          <span className="text-purple-300 font-semibold">{action.name}.</span> <span className="text-stone-300">{action.description}</span>
        </div>
      ))}
    </div>
  </div>
);

const SpellcastingSection = ({ character, onUpdate, spellcastingInfo }) => (
  <div className="bg-purple-950/30 border border-purple-800/50 rounded-lg p-4">
    <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2 mb-3">
      <Icons.Sparkles /> Spellcasting
      {spellcastingInfo.dc && <span className="font-mono bg-purple-900/40 px-2 py-0.5 rounded text-purple-300 text-xs">DC {spellcastingInfo.dc}</span>}
      {spellcastingInfo.attack && <span className="font-mono bg-purple-900/40 px-2 py-0.5 rounded text-purple-300 text-xs">{spellcastingInfo.attack} to hit</span>}
    </h3>
    
    <div className="space-y-3">
      {/* Cantrips */}
      {spellcastingInfo.cantrips.length > 0 && (
        <SpellGroup label="Cantrips (at will)" spells={spellcastingInfo.cantrips} />
      )}
      
      {/* At Will */}
      {spellcastingInfo.atWill.length > 0 && (
        <SpellGroup label="At Will" spells={spellcastingInfo.atWill} />
      )}
      
      {/* Per Day */}
      {Object.entries(spellcastingInfo.perDay).sort((a, b) => parseInt(b[0]) - parseInt(a[0])).map(([count, spells]) => (
        <SpellGroupWithTracking
          key={count}
          label={`${count}/Day`}
          spells={spells}
          total={parseInt(count)}
          used={character[`perDay${count}Used`] || 0}
          onToggle={(i) => {
            const used = character[`perDay${count}Used`] || 0;
            onUpdate({ ...character, [`perDay${count}Used`]: i < used ? i : i + 1 });
          }}
          onReset={() => onUpdate({ ...character, [`perDay${count}Used`]: 0 })}
        />
      ))}
      
      {/* Spell Slots */}
      {Object.entries(spellcastingInfo.slots).map(([level, data]) => (
        <SpellGroupWithTracking
          key={level}
          label={`${level} Level`}
          spells={data.spells}
          total={data.slots}
          used={character[`spellSlots${level}Used`] || 0}
          onToggle={(i) => {
            const used = character[`spellSlots${level}Used`] || 0;
            onUpdate({ ...character, [`spellSlots${level}Used`]: i < used ? i : i + 1 });
          }}
          onReset={() => onUpdate({ ...character, [`spellSlots${level}Used`]: 0 })}
          showCount
        />
      ))}

      {/* Reset All */}
      {(Object.keys(spellcastingInfo.slots).length > 0 || Object.keys(spellcastingInfo.perDay).length > 0) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const updates = { ...character };
            Object.keys(spellcastingInfo.slots).forEach(level => { updates[`spellSlots${level}Used`] = 0; });
            Object.keys(spellcastingInfo.perDay).forEach(count => { updates[`perDay${count}Used`] = 0; });
            onUpdate(updates);
          }}
          className="text-xs text-purple-400 hover:text-purple-300 px-2 py-1 rounded hover:bg-purple-900/30 border border-purple-800/50"
        >
          Reset All Spell Slots
        </button>
      )}
    </div>
  </div>
);

const SpellGroup = ({ label, spells }) => (
  <div>
    <div className="text-xs text-purple-400 font-medium mb-1">{label}</div>
    <div className="flex flex-wrap gap-1">
      {spells.map((spell, i) => (
        <span key={i} className="bg-purple-900/30 text-purple-200 px-2 py-1 rounded text-xs italic">{spell}</span>
      ))}
    </div>
  </div>
);

const SpellGroupWithTracking = ({ label, spells, total, used, onToggle, onReset, showCount }) => (
  <div>
    <div className="flex items-center gap-2 mb-1">
      <span className="text-xs text-purple-400 font-medium">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); onToggle(i); }}
            className={`w-4 h-4 rounded-full border transition-colors ${i < used ? 'bg-purple-600 border-purple-400' : 'bg-stone-800 border-stone-600 hover:border-purple-500'}`}
          />
        ))}
      </div>
      {showCount && <span className="text-[10px] text-stone-500">{total - used}/{total}</span>}
      <button onClick={(e) => { e.stopPropagation(); onReset(); }} className="text-[10px] text-purple-400 hover:text-purple-300 px-1">Reset</button>
    </div>
    <div className="flex flex-wrap gap-1">
      {spells.map((spell, i) => (
        <span key={i} className="bg-purple-900/30 text-purple-200 px-2 py-1 rounded text-xs italic">{spell}</span>
      ))}
    </div>
  </div>
);

const AbilitySection = ({ title, items, color, icon }) => {
  if (!items?.length) return null;
  const colors = {
    amber: { bg: 'bg-amber-950/20', border: 'border-amber-900/30', text: 'text-amber-300', title: 'text-amber-400' },
    red: { bg: 'bg-red-950/20', border: 'border-red-900/30', text: 'text-red-300', title: 'text-red-400' },
    orange: { bg: 'bg-orange-950/20', border: 'border-orange-900/30', text: 'text-orange-300', title: 'text-orange-400' },
    cyan: { bg: 'bg-cyan-950/20', border: 'border-cyan-900/30', text: 'text-cyan-300', title: 'text-cyan-400' },
  };
  const c = colors[color];
  
  return (
    <div>
      <h3 className={`text-sm font-bold ${c.title} mb-2 flex items-center gap-2`}>{icon} {title}</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className={`${c.bg} border ${c.border} rounded p-3 text-sm`}>
            <span className={`${c.text} font-semibold italic`}>{item.name}.</span> <span className="text-stone-300">{item.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsModal;
