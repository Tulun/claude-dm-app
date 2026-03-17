import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'custom-magic-items.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadItems() {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (error) {
    console.error('Error loading custom magic items:', error);
    return [];
  }
}

function saveItems(items) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
}

// GET - load all custom magic items
export async function GET() {
  try {
    const items = loadItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/magic-items error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST - add or update a custom magic item
export async function POST(request) {
  try {
    const item = await request.json();
    const items = loadItems();

    const existingIdx = items.findIndex(i => i.id === item.id);
    if (existingIdx >= 0) {
      items[existingIdx] = { ...item, custom: true };
    } else {
      items.push({ ...item, id: item.id || `custom-${Date.now()}`, custom: true });
    }

    saveItems(items);
    return NextResponse.json(items);
  } catch (error) {
    console.error('POST /api/magic-items error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - remove a custom magic item
export async function DELETE(request) {
  try {
    const { id } = await request.json();
    const items = loadItems().filter(i => i.id !== id);
    saveItems(items);
    return NextResponse.json(items);
  } catch (error) {
    console.error('DELETE /api/magic-items error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}