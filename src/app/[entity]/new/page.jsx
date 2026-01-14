import { notFound } from '@/lib/next-polyfills';
import { createNewPage } from '@/lib/page-factory';

const newPageCreator = createNewPage();

export default async function NewPageWrapper(context) {
  try {
    return await newPageCreator(context);
  } catch (error) {
    if (error?.message?.includes('not found in master config')) {
      notFound();
    }
    throw error;
  }
}
