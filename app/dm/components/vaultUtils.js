// Pure helpers for organizing the Obsidian vault index on the DM dashboard.
// The vault contains sync-duplicate top-level folders ("PCs" and "PCs 2",
// "Locations 2", ...) with real content split across both halves, so all
// grouping happens on a merged display name and the raw folders are kept
// around for a cleanup hint.

export const ROOT_GROUP = 'Overview';

// Preferred dashboard order; anything else follows alphabetically, root notes last.
const FOLDER_ORDER = ['Current Session', 'Sessions', 'NPCs', 'PCs', 'Locations', 'Lore'];

// "Locations 2" and "Locations" are the same campaign folder split by a sync
// accident — merge them for display by stripping a trailing " <number>".
export function displayFolder(folder) {
  if (!folder) return ROOT_GROUP;
  return folder.replace(/ \d+$/, '');
}

export function numericPrefix(name) {
  const match = /^(\d+)/.exec(name);
  return match ? parseInt(match[1], 10) : null;
}

// Session prep notes are named "00-Lore dump", "01-Gear...", so order by the
// numeric prefix; anything unnumbered sorts after, alphabetically.
export function sortSessionNotes(notes) {
  return [...notes].sort((a, b) => {
    const na = numericPrefix(a.name);
    const nb = numericPrefix(b.name);
    if (na !== null && nb !== null) return na - nb;
    if (na !== null) return -1;
    if (nb !== null) return 1;
    return a.name.localeCompare(b.name);
  });
}

export function sessionNotes(notes) {
  return sortSessionNotes(notes.filter(n => displayFolder(n.folder) === 'Current Session'));
}

export function recentNotes(notes, count = 8) {
  return [...notes].sort((a, b) => b.mtime - a.mtime).slice(0, count);
}

// Group notes by merged folder name, ordered FOLDER_ORDER → alpha → root last.
// Each group: { name, notes, sourceFolders } — sourceFolders keeps the raw
// top-level folder names that fed the group (>1 means sync duplicates).
export function groupNotes(notes) {
  const byGroup = new Map();
  for (const note of notes) {
    const name = displayFolder(note.folder);
    if (!byGroup.has(name)) byGroup.set(name, { name, notes: [], sourceFolders: new Set() });
    const group = byGroup.get(name);
    group.notes.push(note);
    if (note.folder) group.sourceFolders.add(note.folder);
  }

  const rank = (name) => {
    if (name === ROOT_GROUP) return FOLDER_ORDER.length + 1000;
    const idx = FOLDER_ORDER.indexOf(name);
    return idx === -1 ? FOLDER_ORDER.length : idx;
  };

  return [...byGroup.values()]
    .map(group => ({
      ...group,
      sourceFolders: [...group.sourceFolders].sort(),
      notes: [...group.notes].sort((a, b) =>
        (a.dir || '').localeCompare(b.dir || '') || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));
}

// Merged groups whose content is split across multiple raw folders — worth a
// cleanup pass in Obsidian someday.
export function duplicateFolderSets(notes) {
  return groupNotes(notes)
    .filter(group => group.sourceFolders.length > 1)
    .map(({ name, sourceFolders }) => ({ name, sourceFolders }));
}

export function searchNotes(notes, query) {
  const q = query.trim().toLowerCase();
  if (!q) return notes;
  return notes.filter(n =>
    n.name.toLowerCase().includes(q) ||
    (n.dir || '').toLowerCase().includes(q) ||
    (n.excerpt || '').toLowerCase().includes(q)
  );
}

export function formatRelativeTime(mtime, now) {
  const seconds = Math.max(0, Math.floor((now - mtime) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
