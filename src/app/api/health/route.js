import { getDatabase } from '@/engine';

export const GET = async (request) => {
  try {
    const db = getDatabase();
    
    db.prepare('SELECT 1').get();
    
    return new Response(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[Health] Check failed:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const HEAD = async (request) => {
  try {
    const db = getDatabase();
    
    db.prepare('SELECT 1').get();
    
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('[Health] Check failed:', error);
    return new Response(null, { status: 503 });
  }
};
