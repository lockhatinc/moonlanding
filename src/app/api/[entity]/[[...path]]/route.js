import { createUniversalHandler } from '@/lib/universal-handler';

export async function GET(request, { params }) {
  const { entity } = await params;
  const handler = createUniversalHandler(entity);
  return handler(request, { params: await params });
}

export async function POST(request, { params }) {
  const { entity } = await params;
  const handler = createUniversalHandler(entity);
  return handler(request, { params: await params });
}

export async function PUT(request, { params }) {
  const { entity } = await params;
  const handler = createUniversalHandler(entity);
  return handler(request, { params: await params });
}

export async function PATCH(request, { params }) {
  const { entity } = await params;
  const handler = createUniversalHandler(entity);
  return handler(request, { params: await params });
}

export async function DELETE(request, { params }) {
  const { entity } = await params;
  const handler = createUniversalHandler(entity);
  return handler(request, { params: await params });
}
