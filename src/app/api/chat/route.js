import { createUniversalHandler } from '@/lib/universal-handler';

const handler = createUniversalHandler('chat_message');

export async function POST(request) {
  return handler(request, { params: {} });
}

export async function GET(request) {
  return handler(request, { params: {} });
}
