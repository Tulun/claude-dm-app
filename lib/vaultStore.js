import fs from 'node:fs';
import path from 'node:path';

// Read-only access to the user's Obsidian vault (a folder of .md files).
// The vault is edited in Obsidian; this module NEVER writes to it. Everything
// is read fresh from disk on each call, so edits made in Obsidian show up on
// the next request without any sync layer.

const SKIP_DIRS = new Set(['.obsidian', '.git', '.trash', 'node_modules']);

export function getVaultPath() {
  return process.env.OBSIDIAN_VAULT_PATH || '';
}

export function stripFrontmatter(content) {
  if (!content.startsWith('---')) return content;
  const lines = content.split('\n');
  if (lines[0].trim() !== '---') return content;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      return lines.slice(i + 1).join('\n');
    }
  }
  return content;
}

// First line of real prose (not a heading, rule, image, or blank), with
// inline markdown symbols stripped, truncated for list display.
export function makeExcerpt(content, maxLength = 180) {
  const body = stripFrontmatter(content);
  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('#')) continue;
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) continue;
    if (/^!\[/.test(line) || /^!\[\[/.test(line)) continue;
    const text = line
      .replace(/!\[\[([^\]]+)\]\]/g, '')
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^[-*+]\s+/, '')
      .replace(/^>\s+/, '')
      .trim();
    if (!text) continue;
    return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
  }
  return '';
}

// Recursively list every .md note in the vault. Paths are vault-relative,
// posix-separated. `folder` is the top-level folder ('' for root notes).
export function scanVault(vaultPath) {
  const notes = [];

  const walk = (absDir, relDir) => {
    let entries;
    try {
      entries = fs.readdirSync(absDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
      const absPath = path.join(absDir, entry.name);
      if (entry.isDirectory()) {
        walk(absPath, relDir ? `${relDir}/${entry.name}` : entry.name);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        let stat, raw;
        try {
          stat = fs.statSync(absPath);
          raw = fs.readFileSync(absPath, 'utf8');
        } catch {
          continue;
        }
        notes.push({
          path: relDir ? `${relDir}/${entry.name}` : entry.name,
          name: entry.name.replace(/\.md$/i, ''),
          folder: relDir ? relDir.split('/')[0] : '',
          dir: relDir,
          mtime: stat.mtimeMs,
          excerpt: makeExcerpt(raw),
        });
      }
    }
  };

  walk(vaultPath, '');
  notes.sort((a, b) => a.path.localeCompare(b.path));
  return notes;
}

// Read one note's full content. Throws on a path that escapes the vault;
// returns null when the note does not exist.
export function readNote(vaultPath, relPath) {
  if (!relPath || !relPath.toLowerCase().endsWith('.md')) {
    throw new Error('Invalid note path');
  }
  const vaultRoot = path.resolve(vaultPath);
  const resolved = path.resolve(vaultRoot, relPath);
  if (resolved !== vaultRoot && !resolved.startsWith(vaultRoot + path.sep)) {
    throw new Error('Invalid note path');
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    return null;
  }
  const stat = fs.statSync(resolved);
  const relDir = path.posix.dirname(relPath.split(path.sep).join('/'));
  return {
    path: relPath.split(path.sep).join('/'),
    name: path.basename(relPath).replace(/\.md$/i, ''),
    dir: relDir === '.' ? '' : relDir,
    mtime: stat.mtimeMs,
    content: fs.readFileSync(resolved, 'utf8'),
  };
}
