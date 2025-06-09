import { createClient } from 'redis';
import { NextResponse } from 'next/server';

const redis = createClient({
  url: process.env.REDIS_URL
});

redis.on('error', (err: Error) => console.error('Redis Client Error', err));

export async function GET() {
  try {
    if (!redis.isOpen) {
      await redis.connect();
    }
    
    await redis.set('test-key', 'Hello from Redis!');
    const value = await redis.get('test-key');
    return NextResponse.json({ success: true, value });
  } catch (error: any) {
    console.error('Redis operation failed:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Unknown error occurred' },
      { status: 500 }
    );
  } finally {
    // Optionally close the connection after use
    // await redis.disconnect();
  }
} 