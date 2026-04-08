import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const NPCS_FILE = path.join(DATA_DIR, 'dm-npcs.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export async function GET() {
  ensureDataDir();
  try {
    if (fs.existsSync(NPCS_FILE)) {
      const data = fs.readFileSync(NPCS_FILE, 'utf8');
      return NextResponse.json(JSON.parse(data));
    }
    return NextResponse.json([]);
  } catch (error) {
    console.error('GET /api/dm-npcs error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  ensureDataDir();
  try {
    const body = await request.json();
    fs.writeFileSync(NPCS_FILE, JSON.stringify(body, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/dm-npcs error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}