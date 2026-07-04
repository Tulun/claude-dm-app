import { NextResponse } from 'next/server';
import fs from 'node:fs';
import { scanVault, readNote } from '../../../lib/vaultStore.js';

// Read-only bridge to the user's Obsidian vault. Deliberately GET-only:
// the vault is edited in Obsidian and this app never writes to it, so none
// of the data/*.json persistence rules (jsonStore, .bak policy) apply here.
// Reads hit the disk on every request so Obsidian edits appear on refresh.
//
// GET /api/vault          → { configured, vaultPath, notes: [...] }
// GET /api/vault?path=X   → full content of one note
//
// When OBSIDIAN_VAULT_PATH is unset or wrong we return 200 with
// { configured: false, error } — the UI renders a setup panel, not a crash.

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
    if (!vaultPath) {
      return NextResponse.json({
        configured: false,
        error: 'OBSIDIAN_VAULT_PATH is not set. Add it to .env.local (pointing at your vault folder) and restart the dev server.',
      });
    }
    if (!fs.existsSync(vaultPath) || !fs.statSync(vaultPath).isDirectory()) {
      return NextResponse.json({
        configured: false,
        error: `Vault folder not found: ${vaultPath}`,
      });
    }

    const notePath = new URL(request.url).searchParams.get('path');
    if (notePath) {
      let note;
      try {
        note = readNote(vaultPath, notePath);
      } catch {
        return NextResponse.json({ error: 'Invalid note path' }, { status: 400 });
      }
      if (!note) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      }
      return NextResponse.json(note);
    }

    return NextResponse.json({
      configured: true,
      vaultPath,
      notes: scanVault(vaultPath),
    });
  } catch (error) {
    console.error('GET /api/vault error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
