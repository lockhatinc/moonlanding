import { createUniversalHandler } from '@/lib/universal-handler';

const handler = createUniversalHandler('file');

export async function POST(request) {
  return handler(request, { params: { entity: 'file' } });
}

export async function GET(request) {
  return handler(request, { params: { entity: 'file' } });
}

export async function DELETE(request) {
  return handler(request, { params: { entity: 'file' } });
}

export async function PUT(request) {
  return handler(request, { params: { entity: 'file' } });
}

export async function PATCH(request) {
  return handler(request, { params: { entity: 'file' } });
}
