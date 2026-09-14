import { NextResponse } from 'next/server';
import { fetchJson, saveJsonToOneDrive } from '@/lib/graphClient';

const DEFAULT = { subtitle: '', courses: [], infoCards: [] };

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchJson('gratis-schnuppern.json') || DEFAULT;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to read gratis schnuppern' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    await saveJsonToOneDrive('gratis-schnuppern.json', data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save gratis schnuppern' }, { status: 500 });
  }
}

export async function POST(request) {
  return PUT(request);
}
