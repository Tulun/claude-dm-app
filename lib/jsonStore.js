// Shared JSON file persistence for the API routes.
// All user data lives as pretty-printed JSON files under data/.

import fs from 'node:fs';
import path from 'node:path';

export const dataPath = (filename) => path.join(process.cwd(), 'data', filename);

export function ensureDataDir() {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Returns the parsed file contents, or undefined when the file doesn't exist.
// Throws on unreadable/corrupt JSON — callers decide whether that's a 500 or a fallback.
export function readJsonFile(file) {
  ensureDataDir();
  if (!fs.existsSync(file)) return undefined;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function writeJsonFile(file, data) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

export function deleteJsonFile(file) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
}

// Preserves an unreadable/corrupt data file by renaming it to a timestamped
// .bak alongside the original, so user data is never silently overwritten.
// Returns the backup path.
export function backupCorruptFile(file) {
  const backup = `${file}.corrupt-${Date.now()}.bak`;
  fs.renameSync(file, backup);
  return backup;
}
