import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PARTY_FILE = path.join(DATA_DIR, 'party.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export async function GET() {
  ensureDataDir();
  try {
    if (fs.existsSync(PARTY_FILE)) {
      const data = fs.readFileSync(PARTY_FILE, 'utf8');
      return NextResponse.json(JSON.parse(data));
    }
    return NextResponse.json(null);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  ensureDataDir();
  try {
    const body = await request.json();
    fs.writeFileSync(PARTY_FILE, JSON.stringify(body, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
