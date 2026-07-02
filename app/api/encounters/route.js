import { NextResponse } from 'next/server';
import { dataPath, readJsonFile, writeJsonFile } from '../../../lib/jsonStore.js';

const ENCOUNTERS_FILE = dataPath('encounters.json');

export async function GET() {
  try {
    const data = readJsonFile(ENCOUNTERS_FILE);
    return NextResponse.json(data === undefined ? [] : data);
  } catch (error) {
    // A corrupt file falls back to an empty list rather than erroring
    console.error('Error reading encounters:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    writeJsonFile(ENCOUNTERS_FILE, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving encounters:', error);
    return NextResponse.json({ error: 'Failed to save encounters' }, { status: 500 });
  }
}
