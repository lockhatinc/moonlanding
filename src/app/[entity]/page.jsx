import { notFound } from 'next/navigation';
import { createListPage } from '@/lib/page-factory';

const listPageCreator = createListPage();

export default async function ListPageWrapper(context) {
  try {
    return await listPageCreator(context);
  } catch (error) {
    if (error?.message?.includes('not found in master config')) {
      notFound();
    }
    throw error;
  }
}
