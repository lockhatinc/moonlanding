import { getEntityGenerator } from './entity-generator';

export function createListPage() {
  return async (context) => {
    const generator = await getEntityGenerator(context.params.entity);
    return generator.ListPage(context);
  };
}

export function createDetailPage() {
  return async (context) => {
    const generator = await getEntityGenerator(context.params.entity);
    return generator.DetailPage(context);
  };
}

export function createEditPage() {
  return async (context) => {
    const generator = await getEntityGenerator(context.params.entity);
    return generator.EditPage(context);
  };
}

export function createNewPage() {
  return async (context) => {
    const generator = await getEntityGenerator(context.params.entity);
    return generator.NewPage(context);
  };
}
