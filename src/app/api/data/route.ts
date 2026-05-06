import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/data';
import type { AppState } from '@/lib/types';

export async function GET() {
  try {
    const data = readData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET /api/data]', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body: AppState = await request.json();
    writeData(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[PUT /api/data]', error);
    return NextResponse.json({ error: 'Failed to write data' }, { status: 500 });
  }
}
