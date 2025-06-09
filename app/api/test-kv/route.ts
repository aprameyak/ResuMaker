import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await kv.set('test-key', 'Hello from KV!');
    const value = await kv.get('test-key');
    return NextResponse.json({ success: true, value });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 