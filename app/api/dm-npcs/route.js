import { NextResponse } from 'next/server';
import { dataPath, readJsonFile, writeJsonFile } from '../../../lib/jsonStore.js';

const NPCS_FILE = dataPath('dm-npcs.json');

export async function GET() {
  try {
    const data = readJsonFile(NPCS_FILE);
    return NextResponse.json(data === undefined ? [] : data);
  } catch (error) {
    console.error('GET /api/dm-npcs error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    writeJsonFile(NPCS_FILE, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/dm-npcs error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
