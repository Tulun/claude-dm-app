import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export async function GET() {
  ensureDataDir();
  try {
    if (fs.existsSync(TEMPLATES_FILE)) {
      const data = fs.readFileSync(TEMPLATES_FILE, 'utf8');
      return NextResponse.json(JSON.parse(data));
    }
    return NextResponse.json(null);
  } catch (error) {
    console.error('GET /api/templates error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  ensureDataDir();
  try {
    const body = await request.json();
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(body, null, 2), 'utf8');
    console.log('Saved templates data to:', TEMPLATES_FILE);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/templates error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
