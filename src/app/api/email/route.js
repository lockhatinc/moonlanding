import { createUniversalHandler } from '@/lib/universal-handler';

const handler = createUniversalHandler('email');

export async function POST(request) {
  return handler(request, { params: { entity: 'email' } });
}

export async function PUT(request) {
  return handler(request, { params: { entity: 'email' } });
}

export async function GET(request) {
  return handler(request, { params: { entity: 'email' } });
}

export async function DELETE(request) {
  return handler(request, { params: { entity: 'email' } });
}

export async function PATCH(request) {
  return handler(request, { params: { entity: 'email' } });
}
