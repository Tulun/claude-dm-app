import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ENCOUNTERS_FILE = path.join(DATA_DIR, 'encounters.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function GET() {
  try {
    if (fs.existsSync(ENCOUNTERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(ENCOUNTERS_FILE, 'utf-8'));
      return NextResponse.json(data);
    }
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error reading encounters:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    fs.writeFileSync(ENCOUNTERS_FILE, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving encounters:', error);
    return NextResponse.json({ error: 'Failed to save encounters' }, { status: 500 });
  }
}