import { createUniversalHandler } from '@/lib/universal-handler';

const handler = createUniversalHandler('email');

export async function POST(request) {
  return handler(request, { params: {} });
}

export async function PUT(request) {
  return handler(request, { params: {} });
}
