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

  // Skip "at will" occurrences inside a cantrips header ("Cantrips (at will):")
  // so the same list doesn't land in both cantrips and atWill.
  for (const atWillMatch of desc.matchAll(/at will[^:]*:\s*([^.]+)/gi)) {
    const insideCantripHeader = cantripMatch
      && atWillMatch.index >= cantripMatch.index
      && atWillMatch.index < cantripMatch.index + cantripMatch[0].length;
    if (insideCantripHeader) continue;
    spellcasting.atWill = atWillMatch[1].split(/,\s*/).map(s => s.trim()).filter(Boolean);
    break;
  }

  const perDayMatches = desc.matchAll(/(\d+)\/day[^:]*:\s*([^.]+)/gi);
  for (const match of perDayMatches) {
    const count = match[1];
    const spells = match[2].split(/,\s*/).map(s => s.trim()).filter(Boolean);
    spellcasting.perDay[count] = [...(spellcasting.perDay[count] || []), ...spells];
  }

  // Accepts both "1st (4 slots):" and the Monster Manual's "1st level (4 slots):"
  const slotMatches = desc.matchAll(/(\d+)(?:st|nd|rd|th)\s*(?:level\s*)?\((\d+)\s*slots?\)[^:]*:\s*([^.]+?)(?:\.|$|\d+(?:st|nd|rd|th))/gi);
  for (const match of slotMatches) {
    const level = match[1] + (match[1] === '1' ? 'st' : match[1] === '2' ? 'nd' : match[1] === '3' ? 'rd' : 'th');
    spellcasting.slots[level] = { slots: parseInt(match[2]), spells: match[3].split(/,\s*/).map(s => s.trim()).filter(Boolean) };
  }
};