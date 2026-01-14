import { notFound } from '@/lib/next-polyfills';
import { createDetailPage } from '@/lib/page-factory';

const detailPageCreator = createDetailPage();

export default async function DetailPageWrapper(context) {
  try {
    return await detailPageCreator(context);
  } catch (error) {
    if (error?.message?.includes('not found in master config')) {
      notFound();
    }
    throw error;
  }
}
