import { createUniversalHandler } from '@/lib/universal-handler';

const handler = createUniversalHandler('chat_message');

export async function POST(request) {
  return handler(request, { params: { entity: 'chat_message' } });
}

export async function GET(request) {
  return handler(request, { params: { entity: 'chat_message' } });
}

export async function PUT(request) {
  return handler(request, { params: { entity: 'chat_message' } });
}

export async function DELETE(request) {
  return handler(request, { params: { entity: 'chat_message' } });
}

export async function PATCH(request) {
  return handler(request, { params: { entity: 'chat_message' } });
}
