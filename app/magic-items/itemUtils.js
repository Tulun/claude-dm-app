// Pure search/sort helpers for magic items — no dataset import, safe for client bundles.

export function searchItems(q, filters = {}, items = []) {
  let r = [...items];
  if (q) {
    const lq = q.toLowerCase();
    r = r.filter(i => i.name.toLowerCase().includes(lq) || i.description.toLowerCase().includes(lq));
  }
  if (filters.category && filters.category !== 'All') r = r.filter(i => i.category === filters.category);
  if (filters.rarity && filters.rarity !== 'All') r = r.filter(i => i.rarity === filters.rarity);
  if (filters.classReq && filters.classReq !== 'All') r = r.filter(i => !i.classes || i.classes.includes(filters.classReq));
  if (filters.attunement === true) r = r.filter(i => i.attunement);
  else if (filters.attunement === false) r = r.filter(i => !i.attunement);
  return r;
}

export function sortItems(items, by = 'name', dir = 'asc') {
  const sorted = [...items];
  sorted.sort((a, b) => {
    let c = 0;
    if (by === 'name') c = a.name.localeCompare(b.name);
    else if (by === 'rarity') {
      const o = { Common: 0, Uncommon: 1, Rare: 2, 'Very Rare': 3, Legendary: 4, Artifact: 5 };
      c = o[a.rarity] - o[b.rarity];
    }
    else if (by === 'category') c = a.category.localeCompare(b.category);
    return dir === 'desc' ? -c : c;
  });
  return sorted;
}
