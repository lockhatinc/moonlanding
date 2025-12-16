import { createApiHandler } from '@/lib/api';

const createHandler = (action) => async (request, { params }) => {
  const { entity } = await params;
  return createApiHandler(entity, action)(request, { params: { entity } });
};

export const GET = createHandler('list');
export const POST = createHandler('create');
export const PUT = createHandler('update');
export const PATCH = createHandler('update');
export const DELETE = createHandler('delete');
