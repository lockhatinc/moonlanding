import { notFound } from 'next/navigation';
import { createEditPage } from '@/lib/page-factory';

const editPageCreator = createEditPage();

export default async function EditPageWrapper(context) {
  try {
    return await editPageCreator(context);
  } catch (error) {
    if (error?.message?.includes('not found in master config')) {
      notFound();
    }
    throw error;
  }
}
