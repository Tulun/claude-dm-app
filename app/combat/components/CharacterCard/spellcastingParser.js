// Parse spellcasting from traits, actions, or notes
export const parseSpellcasting = (character) => {
  const spellcasting = {
    found: false, dc: null, attack: null, atWill: [], perDay: {}, slots: {}, cantrips: [], notes: null, source: null,
  };

  const allAbilities = [
    ...(character.traits || []).map(t => ({ ...t, source: 'trait' })),
    ...(character.actions || []).map(a => ({ ...a, source: 'action' })),
  ];

  for (const ability of allAbilities) {
    const name = ability.name?.toLowerCase() || '';
    const desc = ability.description || '';
    if (name.includes('spellcasting') || name.includes('innate spellcasting')) {
      spellcasting.found = true;
      spellcasting.notes = desc;
      spellcasting.source = ability.source;
      parseSpellText(desc, spellcasting);
      break;
    }
  }

  if (!spellcasting.found && character.notes) {
    const notes = character.notes.toLowerCase();
    if (notes.includes('spellcasting') || notes.includes('spell save dc') || notes.includes('cantrips')) {
      spellcasting.found = true;
      spellcasting.notes = character.notes;
      spellcasting.source = 'notes';
      parseSpellText(character.notes, spellcasting);
    }
  }

  return spellcasting;
};

const parseSpellText = (desc, spellcasting) => {
  const dcMatch = desc.match(/(?:spell save DC|DC)\s*(\d+)/i);
  if (dcMatch) spellcasting.dc = dcMatch[1];
  
  const attackMatch = desc.match(/([+-]\d+)\s*(?:to hit|spell attack)/i);
  if (attackMatch) spellcasting.attack = attackMatch[1];

  const comboMatch = desc.match(/\(DC\s*(\d+),?\s*([+-]\d+)\)/i);
  if (comboMatch) { spellcasting.dc = comboMatch[1]; spellcasting.attack = comboMatch[2]; }

  const cantripMatch = desc.match(/cantrips?[^:]*:\s*([^.]+?)(?:\.|$|\d+(?:st|nd|rd|th))/i);
  if (cantripMatch) spellcasting.cantrips = cantripMatch[1].split(/,\s*/).map(s => s.trim()).filter(Boolean);

  const atWillMatch = desc.match(/at will[^:]*:\s*([^.]+)/i);
  if (atWillMatch) spellcasting.atWill = atWillMatch[1].split(/,\s*/).map(s => s.trim()).filter(Boolean);

  const perDayMatches = desc.matchAll(/(\d+)\/day[^:]*:\s*([^.]+)/gi);
  for (const match of perDayMatches) {
    const count = match[1];
    const spells = match[2].split(/,\s*/).map(s => s.trim()).filter(Boolean);
    spellcasting.perDay[count] = [...(spellcasting.perDay[count] || []), ...spells];
  }

  const slotMatches = desc.matchAll(/(\d+)(?:st|nd|rd|th)\s*\((\d+)\s*slots?\)[^:]*:\s*([^.]+?)(?:\.|$|\d+(?:st|nd|rd|th))/gi);
  for (const match of slotMatches) {
    const level = match[1] + (match[1] === '1' ? 'st' : match[1] === '2' ? 'nd' : match[1] === '3' ? 'rd' : 'th');
    spellcasting.slots[level] = { slots: parseInt(match[2]), spells: match[3].split(/,\s*/).map(s => s.trim()).filter(Boolean) };
  }
};