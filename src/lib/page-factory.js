import { getEntityGenerator } from './entity-generator';

export function createListPage() {
  return async (context) => {
    const params = await context.params;
    const generator = await getEntityGenerator(params.entity);
    return generator.ListPage(context);
  };
}

export function createDetailPage() {
  return async (context) => {
    const params = await context.params;
    const generator = await getEntityGenerator(params.entity);
    return generator.DetailPage(context);
  };
}

export function createEditPage() {
  return async (context) => {
    const params = await context.params;
    const generator = await getEntityGenerator(params.entity);
    return generator.EditPage(context);
  };
}

export function createNewPage() {
  return async (context) => {
    const params = await context.params;
    const generator = await getEntityGenerator(params.entity);
    return generator.NewPage(context);
  };
}
