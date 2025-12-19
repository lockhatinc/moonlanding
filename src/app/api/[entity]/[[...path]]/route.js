import { createHttpMethods } from '@/lib/http-methods-factory';

export const { GET, POST, PUT, PATCH, DELETE } = createHttpMethods(
  async (context) => (await context.params).entity
);
