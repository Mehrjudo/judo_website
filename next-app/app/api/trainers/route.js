import { NextResponse } from 'next/server';
import { fetchJson, saveJsonToOneDrive } from '@/lib/graphClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchJson('trainers.json') || [];
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to read trainers' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    await saveJsonToOneDrive('trainers.json', data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save trainers' }, { status: 500 });
  }
}

export async function POST(request) {
  return PUT(request);
}
